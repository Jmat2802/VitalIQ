import { API_URL } from '../api';
import { useState } from 'react';

interface PatientImportResult {
  success: boolean;
  filename: string;
  total_excel: number;
  inserted: number;
  updated: number;
  skipped: number;
  message: string;
}

interface ClinicalImportResult {
  success: boolean;
  filename: string;
  total_excel: number;
  inserted: number;
  duplicates: number;
  unmatched_patients: number;
  skipped: number;
  message: string;
}

export default function CargaExcel() {
  // ============================================================
  // ESTADOS RPT PACIENTES
  // ============================================================

  const [patientFiles, setPatientFiles] = useState<File[]>([]);
  const [patientLoading, setPatientLoading] = useState(false);
  const [patientResults, setPatientResults] = useState<PatientImportResult[]>([]);
  const [patientError, setPatientError] = useState('');
  const [patientCompleted, setPatientCompleted] = useState(false);

  // ============================================================
  // ESTADOS HOJA DIARIA
  // ============================================================

  const [clinicalFiles, setClinicalFiles] = useState<File[]>([]);
  const [clinicalLoading, setClinicalLoading] = useState(false);
  const [clinicalResults, setClinicalResults] = useState<ClinicalImportResult[]>([]);
  const [clinicalError, setClinicalError] = useState('');
  const [clinicalCompleted, setClinicalCompleted] = useState(false);

  // ============================================================
  // IMPORTAR PACIENTES
  // ============================================================

  async function importPatients() {
    if (patientFiles.length === 0) {
      setPatientError('Seleccioná al menos un archivo RPT.');
      return;
    }

    setPatientLoading(true);
    setPatientError('');
    setPatientResults([]);
    setPatientCompleted(false);

    const results: PatientImportResult[] = [];

    try {
      for (const file of patientFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(
          `${API_URL}/pacientes/import`,
          {
            method: 'POST',
            body: formData,
            credentials: 'include',
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            `${file.name}: ${data.detail || 'Error de importación'}`
          );
        }

        results.push(data);
        setPatientResults([...results]);
      }

      setPatientCompleted(true);
    } catch (err) {
      setPatientError(
        err instanceof Error
          ? err.message
          : 'Error de conexión con VitalIQ.'
      );
    } finally {
      setPatientLoading(false);
    }
  }

  // ============================================================
  // IMPORTAR HOJA DIARIA
  // ============================================================

  async function importClinicalRecords() {
    if (clinicalFiles.length === 0) {
      setClinicalError('Seleccioná al menos una Hoja Diaria.');
      return;
    }

    setClinicalLoading(true);
    setClinicalError('');
    setClinicalResults([]);
    setClinicalCompleted(false);

    const results: ClinicalImportResult[] = [];

    try {
      for (const file of clinicalFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(
          `${API_URL}/atenciones/import`,
          {
            method: 'POST',
            body: formData,
            credentials: 'include',
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            `${file.name}: ${data.detail || 'Error de importación'}`
          );
        }

        results.push(data);
        setClinicalResults([...results]);
      }

      setClinicalCompleted(true);
    } catch (err) {
      setClinicalError(
        err instanceof Error
          ? err.message
          : 'Error de conexión con VitalIQ.'
      );
    } finally {
      setClinicalLoading(false);
    }
  }

  // ============================================================
  // TOTALES PACIENTES
  // ============================================================

  const patientsInserted = patientResults.reduce(
    (sum, result) => sum + result.inserted,
    0
  );

  const patientsUpdated = patientResults.reduce(
    (sum, result) => sum + result.updated,
    0
  );

  const patientsSkipped = patientResults.reduce(
    (sum, result) => sum + result.skipped,
    0
  );

  const patientsTotal = patientResults.reduce(
    (sum, result) => sum + result.total_excel,
    0
  );

  // ============================================================
  // TOTALES CLÍNICOS
  // ============================================================

  const clinicalInserted = clinicalResults.reduce(
    (sum, result) => sum + result.inserted,
    0
  );

  const clinicalDuplicates = clinicalResults.reduce(
    (sum, result) => sum + result.duplicates,
    0
  );

  const clinicalUnmatched = clinicalResults.reduce(
    (sum, result) => sum + result.unmatched_patients,
    0
  );

  const clinicalSkipped = clinicalResults.reduce(
    (sum, result) => sum + result.skipped,
    0
  );

  const clinicalTotal = clinicalResults.reduce(
    (sum, result) => sum + result.total_excel,
    0
  );

  // ============================================================
  // INTERFAZ
  // ============================================================

  return (
    <div className="excel-page">
      <div className="excel-header">
        <div>
          <h1>Carga de archivos</h1>
          <p>Importación y consolidación de información en VitalIQ</p>
        </div>
      </div>

      {/* ========================================================
          RPT PACIENTES
      ======================================================== */}

      <div className="excel-upload-card">
        <div className="excel-upload-icon">👥</div>

        <h2>RPT · Pacientes</h2>

        <p>
          Importá los reportes de pacientes para registrar o actualizar
          información personal, identificación y expediente.
        </p>

        <input
          type="file"
          accept=".xlsx"
          multiple
          disabled={patientLoading}
          onChange={(e) => {
            setPatientFiles(Array.from(e.target.files || []));
            setPatientResults([]);
            setPatientError('');
            setPatientCompleted(false);
          }}
        />

        {patientFiles.length > 0 && (
          <div className="excel-selected-file">
            <strong>{patientFiles.length} archivos seleccionados</strong>

            {patientFiles.map((file, index) => (
              <div key={`${file.name}-${index}`}>
                📄 {file.name}
              </div>
            ))}
          </div>
        )}

        <button
          className="excel-upload-button"
          onClick={importPatients}
          disabled={patientLoading || patientFiles.length === 0}
        >
          {patientLoading
            ? 'Importando pacientes...'
            : 'Importar pacientes a Supabase'}
        </button>

        {patientError && (
          <div className="excel-error">{patientError}</div>
        )}
      </div>

      {patientCompleted && (
        <div className="excel-results">
          <div className="excel-success">
            <h2>✓ Importación RPT finalizada</h2>
            <p>Registros procesados: {patientsTotal}</p>
            <p>Pacientes nuevos: {patientsInserted}</p>
            <p>Pacientes actualizados: {patientsUpdated}</p>
            <p>Registros omitidos: {patientsSkipped}</p>
          </div>
        </div>
      )}

      {patientResults.map((result, index) => (
        <div
          className="excel-sheet-card"
          key={`${result.filename}-${index}`}
        >
          <h3>✅ {result.filename}</h3>
          <p>{result.message}</p>
          <p>Registros: {result.total_excel}</p>
          <p>Insertados: {result.inserted}</p>
          <p>Actualizados: {result.updated}</p>
          <p>Omitidos: {result.skipped}</p>
        </div>
      ))}

      {/* ========================================================
          HOJA DIARIA
      ======================================================== */}

      <div className="excel-upload-card">
        <div className="excel-upload-icon">📋</div>

        <h2>Hoja Diaria · Atenciones</h2>

        <p>
          Importá las hojas diarias para consolidar consultas,
          procedimientos, medicamentos, servicios y pagos.
        </p>

        <input
          type="file"
          accept=".xlsx"
          multiple
          disabled={clinicalLoading}
          onChange={(e) => {
            setClinicalFiles(Array.from(e.target.files || []));
            setClinicalResults([]);
            setClinicalError('');
            setClinicalCompleted(false);
          }}
        />

        {clinicalFiles.length > 0 && (
          <div className="excel-selected-file">
            <strong>{clinicalFiles.length} archivos seleccionados</strong>

            {clinicalFiles.map((file, index) => (
              <div key={`${file.name}-${index}`}>
                📄 {file.name}
              </div>
            ))}
          </div>
        )}

        <button
          className="excel-upload-button"
          onClick={importClinicalRecords}
          disabled={clinicalLoading || clinicalFiles.length === 0}
        >
          {clinicalLoading
            ? 'Importando atenciones...'
            : 'Importar atenciones a Supabase'}
        </button>

        {clinicalError && (
          <div className="excel-error">{clinicalError}</div>
        )}
      </div>

      {clinicalCompleted && (
        <div className="excel-results">
          <div className="excel-success">
            <h2>✓ Importación clínica finalizada</h2>
            <p>Registros procesados: {clinicalTotal}</p>
            <p>Atenciones nuevas: {clinicalInserted}</p>
            <p>Duplicados omitidos: {clinicalDuplicates}</p>
            <p>Pacientes sin vincular: {clinicalUnmatched}</p>
            <p>Registros omitidos: {clinicalSkipped}</p>
          </div>
        </div>
      )}

      {clinicalResults.map((result, index) => (
        <div
          className="excel-sheet-card"
          key={`${result.filename}-${index}`}
        >
          <h3>✅ {result.filename}</h3>
          <p>{result.message}</p>
          <p>Registros: {result.total_excel}</p>
          <p>Insertados: {result.inserted}</p>
          <p>Duplicados: {result.duplicates}</p>
          <p>Pacientes sin vincular: {result.unmatched_patients}</p>
          <p>Omitidos: {result.skipped}</p>
        </div>
      ))}
    </div>
  );
}
