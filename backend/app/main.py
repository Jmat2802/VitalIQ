import os
import secrets
import json

from fastapi import Request, Cookie
from fastapi.responses import JSONResponse, RedirectResponse
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from google.auth.transport.requests import Request as GoogleRequest
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from openpyxl import load_workbook
from io import BytesIO
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, date, timedelta
from decimal import Decimal, InvalidOperation
import re
import unicodedata

from app.database import Base, engine, get_db
from app.models import Patient, ClinicalRecord


app = FastAPI(title="VitalIQ API")


# ============================================================
# AUTENTICACIÓN VITALIQ (Google Sign-In + sesión firmada)
# ============================================================

ADMIN_EMAILS = {"jmadrigal_abarca@yahoo.com", "jimm2802@gmail.com"}
COLLABORATOR_EMAILS = {"clinicasanrafael07@gmail.com"}
SESSION_COOKIE = "vitaliq_session"
SESSION_MAX_AGE = 60 * 60 * 12  # 12 horas


def session_serializer():
    secret = os.getenv("SESSION_SECRET")
    if not secret:
        raise HTTPException(
            status_code=500,
            detail="Falta SESSION_SECRET en las variables de entorno de Render."
        )
    from itsdangerous import URLSafeTimedSerializer
    return URLSafeTimedSerializer(secret, salt="vitaliq-auth-v1")


def current_user(vitaliq_session: str | None = Cookie(default=None)):
    if not vitaliq_session:
        raise HTTPException(status_code=401, detail="Debes iniciar sesión en VitalIQ.")
    try:
        data = session_serializer().loads(vitaliq_session, max_age=SESSION_MAX_AGE)
    except Exception:
        raise HTTPException(status_code=401, detail="Sesión inválida o expirada.")
    email = (data.get("email") or "").strip().lower()
    if email in {x.lower() for x in ADMIN_EMAILS}:
        role = "admin"
    elif email in {x.lower() for x in COLLABORATOR_EMAILS}:
        role = "colaborador"
    else:
        raise HTTPException(status_code=403, detail="Tu cuenta no está autorizada para VitalIQ.")
    return {"email": email, "name": data.get("name", email), "role": role}


def require_admin(user=Depends(current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acceso exclusivo para administradores.")
    return user


def require_upload_access(user=Depends(current_user)):
    if user["role"] not in ("admin", "colaborador"):
        raise HTTPException(status_code=403, detail="No tienes permiso para cargar archivos.")
    return user


@app.get("/api/auth/google")
def auth_google():
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")

    if not client_id or not client_secret:
        raise HTTPException(
            status_code=500,
            detail="Faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET."
        )

    state = secrets.token_urlsafe(32)
    verifier = secrets.token_urlsafe(64)

    redirect_uri = os.getenv(
        "GOOGLE_LOGIN_REDIRECT_URI",
        "https://vitaliq-api.onrender.com/api/auth/google/callback"
    )

    scopes = [
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
    ]

    config = {
        "web": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [redirect_uri],
        }
    }

    flow = Flow.from_client_config(
        config,
        scopes=scopes,
        state=state,
        code_verifier=verifier
    )

    flow.redirect_uri = redirect_uri

    url, _ = flow.authorization_url(
        access_type="online",
        prompt="select_account",
        code_challenge_method="S256"
    )

    response = RedirectResponse(url)

    response.set_cookie(
        "vitaliq_login_state",
        state,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=600
    )

    response.set_cookie(
        "vitaliq_login_verifier",
        verifier,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=600
    )

    return response


@app.get("/api/auth/google/callback")
def auth_google_callback(request: Request, code: str, state: str):
    saved_state = request.cookies.get("vitaliq_login_state")
    verifier = request.cookies.get("vitaliq_login_verifier")

    if (
        not saved_state
        or not secrets.compare_digest(saved_state, state)
        or not verifier
    ):
        raise HTTPException(
            status_code=400,
            detail="Login OAuth inválido o expirado. Intenta de nuevo."
        )

    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")

    redirect_uri = os.getenv(
        "GOOGLE_LOGIN_REDIRECT_URI",
        "https://vitaliq-api.onrender.com/api/auth/google/callback"
    )

    scopes = [
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
    ]

    config = {
        "web": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [redirect_uri],
        }
    }

    flow = Flow.from_client_config(
        config,
        scopes=scopes,
        state=state,
        code_verifier=verifier
    )

    flow.redirect_uri = redirect_uri

    flow.fetch_token(code=code)

    claims = id_token.verify_oauth2_token(
        flow.credentials.id_token,
        google_requests.Request(),
        client_id
    )

    email = (claims.get("email") or "").strip().lower()

    if not claims.get("email_verified"):
        raise HTTPException(
            status_code=403,
            detail="Google no confirmó el correo."
        )

    allowed = {
        x.lower()
        for x in ADMIN_EMAILS | COLLABORATOR_EMAILS
    }

    if email not in allowed:
        raise HTTPException(
            status_code=403,
            detail="Cuenta Google no autorizada para VitalIQ."
        )

    payload = {
        "email": email,
        "name": claims.get("name", email)
    }

    signed = session_serializer().dumps(payload)

    frontend = os.getenv(
        "FRONTEND_URL",
        "https://vital-iq-sand.vercel.app"
    )

    response = RedirectResponse(frontend)

    response.set_cookie(
        SESSION_COOKIE,
        signed,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=SESSION_MAX_AGE,
        path="/"
    )

    for key in (
        "vitaliq_login_state",
        "vitaliq_login_verifier"
    ):
        response.delete_cookie(key)

    return response


@app.get("/api/auth/me")
def auth_me(user=Depends(current_user)):
    return {
        "authenticated": True,
        "user": user
    }



@app.post("/api/auth/logout")
def auth_logout():
    response = JSONResponse({"success": True, "message": "Sesión cerrada."})
    response.delete_cookie(SESSION_COOKIE, path="/")
    return response


@app.get("/api/health")
def health():
    return {"status": "ok"}


# ============================================================
# CONFIGURACIÓN
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://vital-iq-sand.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


# ============================================================
# INICIALIZACIÓN DE BASE DE DATOS
# ============================================================

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    # Token OAuth persistente en PostgreSQL (no depende del filesystem de Render).
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS google_oauth_tokens (
                id INTEGER PRIMARY KEY,
                token_json TEXT NOT NULL,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """))


# ============================================================
# FUNCIONES AUXILIARES
# ============================================================

def normalize(value):
    return str(value or "").strip().lower().replace("°", "o")


def clean_value(value):
    if value is None:
        return None

    if isinstance(value, str):
        value = value.strip()
        return value if value else None

    return str(value)


def normalize_identification(value):
    """Normaliza identificaciones sin perder ceros iniciales."""
    if value is None:
        return None

    if isinstance(value, float) and value.is_integer():
        value = int(value)

    text = str(value).strip()

    if text.endswith(".0"):
        text = text[:-2]

    return text or None


def identification_key(value):
    """Clave comparable: solo dígitos de la identificación."""
    value = normalize_identification(value)
    if not value:
        return None
    digits = re.sub(r"\D", "", value)
    return digits or None


def normalize_name(value):
    """Normaliza nombres: sin tildes, signos ni espacios repetidos."""
    if not value:
        return ""

    text = unicodedata.normalize("NFKD", str(value))
    text = "".join(char for char in text if not unicodedata.combining(char))
    return re.sub(r"[^a-zA-Z0-9]", "", text).lower()


def find_patient_by_identification(db, identification):
    key = identification_key(identification)
    if not key:
        return None

    # La normalización se hace en Python para tolerar guiones y espacios.
    patients = db.query(Patient).all()
    for patient in patients:
        if identification_key(patient.identificacion) == key:
            return patient

    return None


def create_patient_from_clinical_record(db, record_data):
    """Crea una ficha mínima cuando la identificación no existe."""
    identification = normalize_identification(
        record_data.get("patient_identification")
    )
    name = clean_value(record_data.get("patient_name"))

    if not identification:
        return None

    existing = find_patient_by_identification(db, identification)
    if existing:
        return existing

    # expediente debe tener un valor útil y único para esta ficha provisional.
    digits = identification_key(identification) or identification
    expediente = f"AUTO-{digits}"

    # Evitar colisión de expediente si ya existe por otra razón.
    expediente_exists = (
        db.query(Patient)
        .filter(Patient.expediente == expediente)
        .first()
    )
    if expediente_exists:
        expediente = f"AUTO-{digits}-{identification}"

    patient = Patient(
        expediente=expediente,
        identificacion=identification,
        nombre=name or "Paciente pendiente de completar",
        apellido_1=None,
        apellido_2=None,
    )

    db.add(patient)
    db.flush()  # Obtiene patient.id sin hacer commit todavía.
    return patient


# ============================================================
# PROCESAMIENTO GENERAL DE EXCEL
# ============================================================

def process_excel(file_bytes, filename):
    workbook = load_workbook(
        filename=BytesIO(file_bytes),
        read_only=True,
        data_only=True
    )

    result = []

    for sheet in workbook.worksheets:
        rows = list(sheet.iter_rows(values_only=True))

        rows = [
            list(row)
            for row in rows
            if any(value is not None and str(value).strip() for value in row)
        ]

        if not rows:
            continue

        header_index = 0

        for index, row in enumerate(rows):
            values = [normalize(value) for value in row]
            if any("expediente" in value for value in values):
                header_index = index
                break

        headers_original = rows[header_index]

        valid_columns = [
            index for index, header in enumerate(headers_original)
            if header is not None and str(header).strip()
        ]

        headers = [str(headers_original[index]).strip() for index in valid_columns]
        preview = []

        for row in rows[header_index + 1:]:
            values = [normalize(value) for value in row]

            if any("total de registros" in value for value in values):
                break

            clean_row = [
                row[index] if index < len(row) else None
                for index in valid_columns
            ]

            if any(value is not None for value in clean_row):
                preview.append(clean_row)

            if len(preview) >= 5:
                break

        result.append({
            "sheet": sheet.title,
            "headers": headers,
            "preview": preview,
            "total_preview_rows": len(preview)
        })

    workbook.close()

    return {"filename": filename, "sheets": result}


# ============================================================
# PROCESAMIENTO RPT_PACIENTES
# ============================================================

def process_patients_excel(file_bytes, filename):
    workbook = load_workbook(
        filename=BytesIO(file_bytes),
        read_only=True,
        data_only=True
    )

    patients = []

    columns = {
        "expediente": 0,
        "identificacion": 1,
        "nombre": 5,
        "apellido_1": 7,
        "apellido_2": 8,
        "genero": 10,
        "estado_civil": 11,
        "correo": 13,
        "telefono": 14,
        "celular": 15,
        "fecha_registro": 16,
        "referencia": 17,
        "departamento": 18,
        "ocupacion": 19,
        "escolaridad": 20,
        "nacionalidad": 21,
        "provincia": 22,
        "canton": 23,
        "distrito": 24
    }

    for sheet in workbook.worksheets:
        rows = list(sheet.iter_rows(values_only=True))
        header_index = None

        for index, row in enumerate(rows):
            values = [normalize(value) for value in row]
            if any("expediente" in value for value in values):
                header_index = index
                break

        if header_index is None:
            continue

        for row in rows[header_index + 1:]:
            values = [normalize(value) for value in row]

            if any("total de registros" in value for value in values):
                break

            expediente = row[0] if len(row) > 0 else None

            if not expediente or normalize(expediente).startswith("total"):
                continue

            patient = {}
            for field, column in columns.items():
                value = row[column] if column < len(row) else None
                patient[field] = clean_value(value)

            patients.append(patient)

    workbook.close()

    return {
        "filename": filename,
        "total_patients": len(patients),
        "patients": patients
    }


# ============================================================
# ENDPOINTS DE VISTA PREVIA
# ============================================================

@app.post("/api/excel/preview")
async def preview_excel(file: UploadFile = File(...), user=Depends(require_upload_access)):
    if not (file.filename or "").lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Por ahora solo se aceptan archivos .xlsx")

    try:
        content = await file.read()
        return process_excel(content, file.filename)
    except Exception as error:
        raise HTTPException(status_code=400, detail=f"No se pudo leer el Excel: {str(error)}")


@app.post("/api/excel/preview-multiple")
async def preview_multiple_excel(files: list[UploadFile] = File(...), user=Depends(require_upload_access)):
    results = []

    for file in files:
        filename = file.filename or "archivo.xlsx"

        if not filename.lower().endswith(".xlsx"):
            results.append({
                "filename": filename,
                "success": False,
                "error": "Solo se aceptan archivos .xlsx"
            })
            continue

        try:
            content = await file.read()
            processed = process_excel(content, filename)
            results.append({"success": True, **processed})
        except Exception as error:
            results.append({
                "filename": filename,
                "success": False,
                "error": str(error)
            })

    return {
        "total_files": len(results),
        "successful_files": sum(1 for result in results if result.get("success")),
        "failed_files": sum(1 for result in results if result.get("success") is False),
        "results": results
    }


@app.post("/api/pacientes/preview")
async def preview_patients(file: UploadFile = File(...), user=Depends(require_upload_access)):
    filename = file.filename or "archivo.xlsx"

    if not filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos .xlsx")

    try:
        content = await file.read()
        return process_patients_excel(content, filename)
    except Exception as error:
        raise HTTPException(status_code=400, detail=f"No se pudieron procesar los pacientes: {str(error)}")


# ============================================================
# ENDPOINT: IMPORTAR PACIENTES A SUPABASE
# ============================================================

@app.post("/api/pacientes/import")
async def import_patients(file: UploadFile = File(...), db: Session = Depends(get_db), user=Depends(require_upload_access)):
    filename = file.filename or "archivo.xlsx"

    if not filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos .xlsx")

    try:
        content = await file.read()
        processed = process_patients_excel(content, filename)
        patients = processed["patients"]

        inserted = 0
        updated = 0
        skipped = 0

        for patient_data in patients:
            expediente = patient_data.get("expediente")

            if not expediente:
                skipped += 1
                continue

            existing = db.query(Patient).filter(Patient.expediente == expediente).first()

            if existing:
                for field, value in patient_data.items():
                    setattr(existing, field, value)
                updated += 1
            else:
                db.add(Patient(**patient_data))
                inserted += 1

        db.commit()

        return {
            "success": True,
            "filename": filename,
            "total_excel": len(patients),
            "inserted": inserted,
            "updated": updated,
            "skipped": skipped,
            "message": "Importación completada correctamente"
        }

    except Exception as error:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"No se pudieron importar los pacientes: {str(error)}")


# ============================================================
# ENDPOINT: CONSULTAR PACIENTES GUARDADOS
# ============================================================

@app.get("/api/pacientes")
def get_patients(search: str = "", limit: int = 100, offset: int = 0, db: Session = Depends(get_db), user=Depends(require_admin)):
    query = db.query(Patient)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            (Patient.expediente.ilike(term))
            | (Patient.identificacion.ilike(term))
            | (Patient.nombre.ilike(term))
            | (Patient.apellido_1.ilike(term))
            | (Patient.apellido_2.ilike(term))
        )

    total = query.count()
    patients = query.order_by(Patient.id.desc()).offset(offset).limit(min(limit, 500)).all()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "patients": [
            {
                "id": patient.id,
                "expediente": patient.expediente,
                "identificacion": patient.identificacion,
                "nombre": patient.nombre,
                "apellido_1": patient.apellido_1,
                "apellido_2": patient.apellido_2,
                "genero": patient.genero,
                "estado_civil": patient.estado_civil,
                "correo": patient.correo,
                "telefono": patient.telefono,
                "celular": patient.celular,
                "fecha_registro": patient.fecha_registro,
                "referencia": patient.referencia,
                "departamento": patient.departamento,
                "ocupacion": patient.ocupacion,
                "escolaridad": patient.escolaridad,
                "nacionalidad": patient.nacionalidad,
                "provincia": patient.provincia,
                "canton": patient.canton,
                "distrito": patient.distrito
            }
            for patient in patients
        ]
    }


# ============================================================
# IMPORTACIÓN DE HOJA DIARIA / REGISTROS CLÍNICOS
# ============================================================

def parse_excel_date(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value

    text_value = str(value).strip()
    if not text_value:
        return None

    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%d/%m/%y", "%Y/%m/%d"):
        try:
            return datetime.strptime(text_value, fmt).date()
        except ValueError:
            continue

    return None


def parse_excel_amount(value):
    if value is None:
        return None
    if isinstance(value, (int, float, Decimal)):
        return Decimal(str(value))

    text_value = str(value).strip()
    if not text_value:
        return None

    text_value = text_value.replace("₡", "").replace("$", "").replace(" ", "")

    if "," in text_value and "." in text_value:
        text_value = text_value.replace(".", "").replace(",", ".")
    elif "," in text_value:
        text_value = text_value.replace(",", ".")

    try:
        return Decimal(text_value)
    except InvalidOperation:
        return None


def find_daily_header(rows):
    for index, row in enumerate(rows[:20]):
        headers = [normalize(value) for value in row]

        has_identification = any(
            "cedula" in value
            or "doc. id" in value
            or "doc id" in value
            or "identificacion" in value
            for value in headers
        )
        has_date = any("fecha" in value for value in headers)

        if has_identification and has_date:
            return index

    return None


def get_column(headers, aliases):
    normalized_headers = [normalize(header) for header in headers]

    # Primero intenta coincidencias exactas para evitar que "id" encuentre "Doc. ID".
    for index, header in enumerate(normalized_headers):
        if header in aliases:
            return index

    # Luego busca alias como fragmento.
    for index, header in enumerate(normalized_headers):
        for alias in aliases:
            if alias and alias in header:
                return index

    return None


def row_value(row, column):
    if column is None or column >= len(row):
        return None
    return row[column]


def process_daily_excel(file_bytes, filename):
    workbook = load_workbook(
        filename=BytesIO(file_bytes),
        read_only=True,
        data_only=True
    )

    records = []

    for sheet in workbook.worksheets:
        rows = list(sheet.iter_rows(values_only=True))
        header_index = find_daily_header(rows)

        if header_index is None:
            continue

        headers = rows[header_index]

        columns = {
            "excel_id": get_column(headers, ["id"]),
            "identificacion": get_column(headers, ["cedula", "doc. id", "doc id", "identificacion"]),
            "telefono": get_column(headers, ["telefono"]),
            "fecha": get_column(headers, ["fecha de cita", "fecha"]),
            "nombre": get_column(headers, ["nombre del paciente", "nombre"]),
            "sexo": get_column(headers, ["sexo"]),
            "grupo_etario": get_column(headers, ["grupo etario", "grupo de edad"]),
            "ubicacion": get_column(headers, ["ubicacion", "residencia"]),
            "condicion": get_column(headers, ["tipo de condicion", "condicion"]),
            "sede": get_column(headers, ["sede de atencion", "sede"]),
            "servicio": get_column(headers, ["tipo de servicio"]),
            "consultas": get_column(headers, ["consultas"]),
            "procedimientos": get_column(headers, ["procedimiento", "servicios"]),
            "medicamentos": get_column(headers, ["kits", "medicamentos"]),
            "monto_consulta": get_column(headers, ["monto de consulta"]),
            "monto_servicio": get_column(headers, ["monto de servicio"]),
            "monto_medicamento": get_column(headers, ["monto kit", "monto medicamento"]),
            "monto_total": get_column(headers, ["monto total"]),
            "forma_pago": get_column(headers, ["forma de pago"]),
            "estado_pago": get_column(headers, ["estado de pago"]),
            "comprobante": get_column(headers, ["comprobante"]),
            "observaciones": get_column(headers, ["observaciones"]),
        }

        for row in rows[header_index + 1:]:
            identification = normalize_identification(row_value(row, columns["identificacion"]))
            attention_date = parse_excel_date(row_value(row, columns["fecha"]))
            excel_id = clean_value(row_value(row, columns["excel_id"]))

            if not identification and not attention_date:
                continue
            if identification and normalize(identification).startswith("total"):
                continue

            records.append({
                "excel_id": excel_id,
                "patient_identification": identification,
                "attention_date": attention_date,
                "patient_name": clean_value(row_value(row, columns["nombre"])),
                "sex": clean_value(row_value(row, columns["sexo"])),
                "age_group": clean_value(row_value(row, columns["grupo_etario"])),
                "location": clean_value(row_value(row, columns["ubicacion"])),
                "condition_type": clean_value(row_value(row, columns["condicion"])),
                "attention_location": clean_value(row_value(row, columns["sede"])),
                "service_type": clean_value(row_value(row, columns["servicio"])),
                "consultations": clean_value(row_value(row, columns["consultas"])),
                "procedures": clean_value(row_value(row, columns["procedimientos"])),
                "medications": clean_value(row_value(row, columns["medicamentos"])),
                "consultation_amount": parse_excel_amount(row_value(row, columns["monto_consulta"])),
                "service_amount": parse_excel_amount(row_value(row, columns["monto_servicio"])),
                "medication_amount": parse_excel_amount(row_value(row, columns["monto_medicamento"])),
                "total_amount": parse_excel_amount(row_value(row, columns["monto_total"])),
                "payment_method": clean_value(row_value(row, columns["forma_pago"])),
                "payment_status": clean_value(row_value(row, columns["estado_pago"])),
                "invoice_number": clean_value(row_value(row, columns["comprobante"])),
                "observations": clean_value(row_value(row, columns["observaciones"])),
                "source_file": filename,
            })

    workbook.close()
    return records


# ============================================================
# ENDPOINT: IMPORTAR HOJA DIARIA
# ============================================================

@app.post("/api/atenciones/import")
async def import_daily_records(file: UploadFile = File(...), db: Session = Depends(get_db), user=Depends(require_upload_access)):
    filename = file.filename or "hoja_diaria.xlsx"

    if not filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos .xlsx")

    try:
        content = await file.read()
        records = process_daily_excel(content, filename)

        inserted = 0
        duplicates = 0
        created_patients = 0
        linked_existing_patients = 0
        skipped = 0

        for record_data in records:
            identification = record_data.get("patient_identification")
            attention_date = record_data.get("attention_date")
            excel_id = record_data.get("excel_id")

            if not identification:
                skipped += 1
                continue

            # 1) Buscar paciente por identificación normalizada.
            patient = find_patient_by_identification(db, identification)

            # 2) Si no existe, crear ficha mínima con los datos clínicos disponibles.
            if not patient:
                patient = create_patient_from_clinical_record(db, record_data)
                if patient:
                    created_patients += 1
            else:
                linked_existing_patients += 1

            patient_id = patient.id if patient else None

            # 3) Buscar atención existente para evitar duplicados.
            existing_query = db.query(ClinicalRecord).filter(
                ClinicalRecord.patient_identification == identification,
                ClinicalRecord.attention_date == attention_date
            )

            if excel_id:
                existing_query = existing_query.filter(ClinicalRecord.excel_id == excel_id)
            else:
                existing_query = existing_query.filter(
                    ClinicalRecord.service_type == record_data.get("service_type"),
                    ClinicalRecord.total_amount == record_data.get("total_amount")
                )

            existing = existing_query.first()

            if existing:
                # Muy importante: aunque ya existiera la atención, ahora la vinculamos.
                if patient_id and existing.patient_id != patient_id:
                    existing.patient_id = patient_id
                duplicates += 1
                continue

            record_data["patient_id"] = patient_id
            db.add(ClinicalRecord(**record_data))
            inserted += 1

        db.commit()

        return {
            "success": True,
            "filename": filename,
            "total_excel": len(records),
            "inserted": inserted,
            "duplicates": duplicates,
            "created_patients": created_patients,
            "linked_existing_patients": linked_existing_patients,
            "unmatched_patients": 0,
            "skipped": skipped,
            "message": "Importación clínica completada; pacientes creados y atenciones vinculadas cuando fue posible."
        }

    except Exception as error:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"No se pudieron importar las atenciones: {str(error)}")


# ============================================================
# ENDPOINT: HISTORIAL CLÍNICO DE UN PACIENTE
# ============================================================

@app.get("/api/pacientes/{patient_id}/atenciones")
def get_patient_clinical_history(patient_id: int, db: Session = Depends(get_db), user=Depends(require_admin)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    patient_key = identification_key(patient.identificacion)
    records = db.query(ClinicalRecord).filter(
        (ClinicalRecord.patient_id == patient.id)
        | (ClinicalRecord.patient_identification == patient.identificacion)
    ).order_by(ClinicalRecord.attention_date.desc()).all()

    # Fallback normalizado para identificaciones con guiones o espacios.
    if patient_key:
        all_records = db.query(ClinicalRecord).all()
        normalized_matches = [
            record for record in all_records
            if identification_key(record.patient_identification) == patient_key
        ]
        known_ids = {record.id for record in records}
        records.extend(record for record in normalized_matches if record.id not in known_ids)
        records.sort(key=lambda record: record.attention_date or date.min, reverse=True)

    return {
        "patient": {
            "id": patient.id,
            "expediente": patient.expediente,
            "identificacion": patient.identificacion,
            "nombre": patient.nombre,
            "apellido_1": patient.apellido_1,
            "apellido_2": patient.apellido_2
        },
        "total_atenciones": len(records),
        "atenciones": [
            {
                "id": record.id,
                "fecha": record.attention_date,
                "servicio": record.service_type,
                "consultas": record.consultations,
                "procedimientos": record.procedures,
                "medicamentos": record.medications,
                "monto_consulta": float(record.consultation_amount) if record.consultation_amount is not None else None,
                "monto_servicio": float(record.service_amount) if record.service_amount is not None else None,
                "monto_medicamentos": float(record.medication_amount) if record.medication_amount is not None else None,
                "monto_total": float(record.total_amount) if record.total_amount is not None else None,
                "forma_pago": record.payment_method,
                "estado_pago": record.payment_status,
                "observaciones": record.observations
            }
            for record in records
        ]
    }

from pathlib import Path
from datetime import datetime, timezone
from google.oauth2.credentials import Credentials
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from googleapiclient.discovery import build
from fastapi import HTTPException, Query


GOOGLE_SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "https://vitaliq-api.onrender.com/api/calendar/callback")


def google_oauth_flow(state=None, code_verifier=None):
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise HTTPException(status_code=500, detail="Faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET en Render.")

    config = {
        "web": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [GOOGLE_REDIRECT_URI],
        }
    }

    flow = Flow.from_client_config(
        config,
        scopes=GOOGLE_SCOPES,
        state=state,
        code_verifier=code_verifier,
    )
    flow.redirect_uri = GOOGLE_REDIRECT_URI
    return flow


@app.get("/api/calendar/auth")
def calendar_auth():
    state = secrets.token_urlsafe(32)
    code_verifier = secrets.token_urlsafe(64)

    flow = google_oauth_flow(state=state, code_verifier=code_verifier)
    authorization_url, _ = flow.authorization_url(
        access_type="offline",
        prompt="select_account consent",
        include_granted_scopes="true",
        code_challenge_method="S256",
    )

    response = RedirectResponse(authorization_url)
    response.set_cookie(
        "calendar_oauth_state", state,
        httponly=True, secure=True, samesite="lax", max_age=600,
    )
    response.set_cookie(
        "calendar_oauth_verifier", code_verifier,
        httponly=True, secure=True, samesite="lax", max_age=600,
    )
    return response


@app.get("/api/calendar/callback")
def calendar_callback(request: Request, code: str, state: str):
    saved_state = request.cookies.get("calendar_oauth_state")
    code_verifier = request.cookies.get("calendar_oauth_verifier")

    if not saved_state or not secrets.compare_digest(saved_state, state):
        raise HTTPException(
            status_code=400,
            detail="Estado OAuth inválido o expirado. Inicia de nuevo en /api/calendar/auth.",
        )

    if not code_verifier:
        raise HTTPException(
            status_code=400,
            detail="OAuth code verifier missing. Inicia nuevamente en /api/calendar/auth.",
        )

    flow = google_oauth_flow(state=state, code_verifier=code_verifier)
    flow.fetch_token(code=code)
    token_json = flow.credentials.to_json()

    # Persistencia del token OAuth en PostgreSQL.
    with engine.begin() as conn:
        conn.execute(text("""
            INSERT INTO google_oauth_tokens (id, token_json, updated_at)
            VALUES (1, :token_json, CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO UPDATE
            SET token_json = EXCLUDED.token_json, updated_at = CURRENT_TIMESTAMP
        """), {"token_json": token_json})

    response = JSONResponse({
        "success": True,
        "message": "Google Calendar autorizado. Ya puedes volver a VitalIQ.",
    })
    response.delete_cookie("calendar_oauth_state")
    response.delete_cookie("calendar_oauth_verifier")
    return response


@app.get("/api/calendar/events")
def get_calendar_events(max_results: int = Query(100, ge=1, le=250), user=Depends(require_admin)):
    try:
        # Prioridad: token guardado en PostgreSQL. Fallback temporal al token.json local.
        with engine.connect() as conn:
            row = conn.execute(text("SELECT token_json FROM google_oauth_tokens WHERE id = 1")).fetchone()

        if row and row[0]:
            creds = Credentials.from_authorized_user_info(json.loads(row[0]), GOOGLE_SCOPES)
        else:
            backend_dir = Path(__file__).resolve().parent.parent
            token_path = backend_dir / "token.json"
            if not token_path.exists():
                raise HTTPException(status_code=401, detail="Google Calendar no está autorizado. Abre /api/calendar/auth.")
            creds = Credentials.from_authorized_user_file(str(token_path), GOOGLE_SCOPES)

        if creds.expired and creds.refresh_token:
            creds.refresh(GoogleRequest())
            # Guardar la credencial refrescada en PostgreSQL si ya existe autorización allí.
            if row and row[0]:
                with engine.begin() as conn:
                    conn.execute(text("UPDATE google_oauth_tokens SET token_json = :token_json, updated_at = CURRENT_TIMESTAMP WHERE id = 1"),
                               {"token_json": creds.to_json()})

        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        now = datetime.now(timezone.utc).isoformat()
        result = service.events().list(
            calendarId="primary", timeMin=now, maxResults=max_results,
            singleEvents=True, orderBy="startTime"
        ).execute()

        events = []
        for event in result.get("items", []):
            start = event.get("start", {})
            end = event.get("end", {})
            events.append({
                "id": event.get("id"),
                "summary": event.get("summary", "(Sin título)"),
                "description": event.get("description", ""),
                "start": start.get("dateTime", start.get("date")),
                "end": end.get("dateTime", end.get("date")),
                "status": event.get("status"),
                "location": event.get("location", ""),
            })
        return {"success": True, "total": len(events), "events": events}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error consultando Google Calendar: {str(e)}")

@app.get("/api/dashboard/stats")
def dashboard_stats(start_date: str = None, end_date: str = None, db: Session = Depends(get_db), user=Depends(require_admin)):
    from sqlalchemy import func
    from datetime import date

    clinical_query = db.query(ClinicalRecord)
    try:
        if start_date:
            clinical_query = clinical_query.filter(ClinicalRecord.attention_date >= date.fromisoformat(start_date))
        if end_date:
            clinical_query = clinical_query.filter(ClinicalRecord.attention_date <= date.fromisoformat(end_date))
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD.")

    def grouped_count(model_field, model):
        base_query = clinical_query if model is ClinicalRecord else db.query(model)
        rows = (
            base_query.with_entities(model_field, func.count(model.id))
            .group_by(model_field)
            .order_by(func.count(model.id).desc())
            .all()
        )
        return [
            {"categoria": str(category or "Sin dato"), "cantidad": int(count)}
            for category, count in rows
        ]

    def grouped_sum(model_field):
        rows = (
            clinical_query.with_entities(model_field, func.sum(ClinicalRecord.total_amount))
            .group_by(model_field)
            .order_by(func.sum(ClinicalRecord.total_amount).desc())
            .all()
        )
        return [
            {"categoria": str(category or "Sin dato"), "monto": float(amount or 0)}
            for category, amount in rows
        ]

    # RPT_PACIENTES: demografía y residencia
    pacientes = {
        "total": db.query(Patient).count(),
        "genero": grouped_count(Patient.genero, Patient),
        "estado_civil": grouped_count(Patient.estado_civil, Patient),
        "nacionalidad": grouped_count(Patient.nacionalidad, Patient),
        "provincia": grouped_count(Patient.provincia, Patient),
        "canton": grouped_count(Patient.canton, Patient),
        "distrito": grouped_count(Patient.distrito, Patient),
        "ocupacion": grouped_count(Patient.ocupacion, Patient),
        "escolaridad": grouped_count(Patient.escolaridad, Patient),
    }

    # Hoja Diaria / registros de atención
    atenciones = {
        "total": clinical_query.count(),
        "grupo_etario": grouped_count(ClinicalRecord.age_group, ClinicalRecord),
        "ubicacion_residencia": grouped_count(ClinicalRecord.location, ClinicalRecord),
        "sede_atencion": grouped_count(ClinicalRecord.attention_location, ClinicalRecord),
        "tipo_servicio": grouped_count(ClinicalRecord.service_type, ClinicalRecord),
        "tipo_condicion": grouped_count(ClinicalRecord.condition_type, ClinicalRecord),
    }

    # Comercial: clasificación registrada en columna L (Consultas)
    comercial_rows = (
        clinical_query.with_entities(ClinicalRecord.consultations, func.count(ClinicalRecord.id))
        .filter(
            ClinicalRecord.consultations.isnot(None),
            ClinicalRecord.consultations != ""
        )
        .group_by(ClinicalRecord.consultations)
        .order_by(func.count(ClinicalRecord.id).desc())
        .all()
    )
    comercial = {
        "total_clasificadas": sum(int(count) for _, count in comercial_rows),
        "categorias": [
            {"categoria": str(category), "cantidad": int(count)}
            for category, count in comercial_rows
        ],
    }

    # Finanzas: montos y pagos de Hoja Diaria
    ingresos_totales = clinical_query.with_entities(func.sum(ClinicalRecord.total_amount)).scalar() or 0
    ingresos_consultas = clinical_query.with_entities(func.sum(ClinicalRecord.consultation_amount)).scalar() or 0
    ingresos_servicios = clinical_query.with_entities(func.sum(ClinicalRecord.service_amount)).scalar() or 0
    ingresos_medicamentos = clinical_query.with_entities(func.sum(ClinicalRecord.medication_amount)).scalar() or 0

    finanzas = {
        "ingresos_totales": float(ingresos_totales),
        "ingresos_consultas": float(ingresos_consultas),
        "ingresos_servicios": float(ingresos_servicios),
        "ingresos_medicamentos": float(ingresos_medicamentos),
        "por_forma_pago": grouped_sum(ClinicalRecord.payment_method),
        "por_estado_pago": grouped_sum(ClinicalRecord.payment_status),
    }

    return {
        "success": True,
        "pacientes": pacientes,
        "atenciones": atenciones,
        "comercial": comercial,
        "finanzas": finanzas,
    }

# Nota: /api/calendar/auth y /api/calendar/callback conservan el OAuth de Calendar independiente.
