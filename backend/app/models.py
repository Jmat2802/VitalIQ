
from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    Numeric,
    Text,
    ForeignKey,
)
from app.database import Base


# ============================================================
# PACIENTES
# ============================================================

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)

    expediente = Column(String(50), unique=True, index=True, nullable=True)
    identificacion = Column(String(50), index=True, nullable=True)

    nombre = Column(String(150), nullable=True)
    apellido_1 = Column(String(150), nullable=True)
    apellido_2 = Column(String(150), nullable=True)

    genero = Column(String(50), nullable=True)
    estado_civil = Column(String(50), nullable=True)

    correo = Column(String(200), nullable=True)
    telefono = Column(String(50), nullable=True)
    celular = Column(String(50), nullable=True)

    fecha_registro = Column(String(50), nullable=True)
    referencia = Column(String(200), nullable=True)

    departamento = Column(String(150), nullable=True)
    ocupacion = Column(String(150), nullable=True)
    escolaridad = Column(String(150), nullable=True)
    nacionalidad = Column(String(100), nullable=True)

    provincia = Column(String(100), nullable=True)
    canton = Column(String(100), nullable=True)
    distrito = Column(String(100), nullable=True)


# ============================================================
# ATENCIONES CLÍNICAS
# ============================================================

class ClinicalRecord(Base):
    __tablename__ = "clinical_records"

    id = Column(Integer, primary_key=True, index=True)

    # Identificación
    excel_id = Column(String(100), nullable=True, index=True)
    patient_identification = Column(String(50), nullable=False, index=True)

    patient_id = Column(
        Integer,
        ForeignKey("patients.id"),
        nullable=True,
        index=True
    )

    # Información clínica
    attention_date = Column(Date, nullable=True)
    patient_name = Column(String(250), nullable=True)
    sex = Column(String(50), nullable=True)
    age_group = Column(String(50), nullable=True)
    location = Column(String(250), nullable=True)
    condition_type = Column(String(150), nullable=True)
    attention_location = Column(String(150), nullable=True)
    service_type = Column(String(250), nullable=True)

    consultations = Column(Text, nullable=True)
    procedures = Column(Text, nullable=True)
    medications = Column(Text, nullable=True)

    # Información financiera
    consultation_amount = Column(Numeric(12, 2), nullable=True)
    service_amount = Column(Numeric(12, 2), nullable=True)
    medication_amount = Column(Numeric(12, 2), nullable=True)
    total_amount = Column(Numeric(12, 2), nullable=True)

    payment_method = Column(String(100), nullable=True)
    payment_status = Column(String(100), nullable=True)
    invoice_number = Column(String(100), nullable=True)

    observations = Column(Text, nullable=True)

    # Importación
    source_file = Column(String(255), nullable=True)
