import { API_URL } from '../api';
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  Search,
  RefreshCw,
  Users,
  ArrowLeft,
  UserRound,
  CalendarDays,
  FileText,
  Wallet,
  Activity,
  ChevronRight
} from 'lucide-react';

type Patient = Record<string, unknown>;

type ClinicalRecord = {
  id: number;
  fecha: string | null;
  servicio: string | null;
  consultas: string | null;
  procedimientos: string | null;
  medicamentos: string | null;
  monto_consulta: number | null;
  monto_servicio: number | null;
  monto_medicamentos: number | null;
  monto_total: number | null;
  forma_pago: string | null;
  estado_pago: string | null;
  observaciones: string | null;
};

type PatientHistory = {
  patient: {
    id: number;
    expediente: string | null;
    identificacion: string | null;
    nombre: string | null;
    apellido_1: string | null;
    apellido_2: string | null;
  };
  total_atenciones: number;
  atenciones: ClinicalRecord[];
};

type PatientsResponse = {
  total: number;
  limit: number;
  offset: number;
  patients: Patient[];
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';

  if (typeof value === 'object') return JSON.stringify(value);

  return String(value);
}

function formatLabel(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';

  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    maximumFractionDigits: 2
  }).format(value);
}

function formatDate(value: string | null): string {
  if (!value) return '—';

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('es-CR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function getPatientName(patient: Patient): string {
  return [
    patient.nombre,
    patient.apellido_1,
    patient.apellido_2
  ]
    .filter(Boolean)
    .join(' ') || 'Paciente sin nombre';
}

const cardStyle: CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: 20
};

const labelStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 13,
  marginBottom: 6
};

const valueStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: '#1e293b',
  overflowWrap: 'anywhere'
};

export default function Pacientes() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [history, setHistory] = useState<PatientHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  async function loadPatients() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/pacientes?limit=100&offset=0`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('No fue posible cargar los pacientes.');
      }

      const data: PatientsResponse = await response.json();

      setPatients(data.patients ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error de conexión con VitalIQ.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function openPatient(patient: Patient) {
    setSelectedPatient(patient);
    setHistory(null);
    setHistoryError('');
    setHistoryLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/pacientes/${patient.id}/atenciones`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('No fue posible cargar el expediente clínico.');
      }

      const data: PatientHistory = await response.json();

      setHistory(data);
    } catch (err) {
      setHistoryError(
        err instanceof Error
          ? err.message
          : 'Error cargando el historial clínico.'
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  function backToPatients() {
    setSelectedPatient(null);
    setHistory(null);
    setHistoryError('');
  }

  useEffect(() => {
    loadPatients();
  }, []);

  const filteredPatients = patients.filter((patient) =>
    Object.values(patient).some((value) =>
      formatValue(value).toLowerCase().includes(search.toLowerCase())
    )
  );

  const columns = patients.length > 0
    ? Object.keys(patients[0])
    : [];

  // ==========================
  // EXPEDIENTE INDIVIDUAL
  // ==========================

  if (selectedPatient) {
    const patient = history?.patient;
    const records = history?.atenciones ?? [];

    return (
      <div style={{ padding: '24px 0' }}>
        <button
          type="button"
          onClick={backToPatients}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: 'none',
            background: 'transparent',
            color: '#2563eb',
            cursor: 'pointer',
            fontWeight: 600,
            padding: '8px 0',
            marginBottom: 20
          }}
        >
          <ArrowLeft size={18} />
          Volver a pacientes
        </button>

        <div
          style={{
            ...cardStyle,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            flexWrap: 'wrap'
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <UserRound size={32} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ color: '#64748b', fontSize: 13 }}>
              EXPEDIENTE CLÍNICO
            </div>

            <h2 style={{ margin: '6px 0', fontSize: 26 }}>
              {patient
                ? `${patient.nombre ?? ''} ${patient.apellido_1 ?? ''} ${patient.apellido_2 ?? ''}`.trim()
                : getPatientName(selectedPatient)}
            </h2>

            <div style={{ color: '#64748b', fontSize: 14 }}>
              Expediente: {formatValue(patient?.expediente ?? selectedPatient.expediente)}
              {' · '}
              Identificación: {formatValue(patient?.identificacion ?? selectedPatient.identificacion)}
            </div>
          </div>

          <button
            type="button"
            onClick={() => openPatient(selectedPatient)}
            disabled={historyLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid #dbe3eb',
              background: '#fff',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} />
            Actualizar expediente
          </button>
        </div>

        {historyError && (
          <div
            style={{
              marginTop: 20,
              padding: 16,
              borderRadius: 8,
              background: '#fef2f2',
              color: '#b91c1c'
            }}
          >
            {historyError}
          </div>
        )}

        {historyLoading ? (
          <div style={{ ...cardStyle, marginTop: 20, textAlign: 'center', padding: 40 }}>
            Cargando expediente clínico...
          </div>
        ) : history ? (
          <>
            <h3 style={{ marginTop: 28, marginBottom: 14 }}>
              Información del paciente
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16
              }}
            >
              {[
                ['Expediente', patient?.expediente],
                ['Identificación', patient?.identificacion],
                ['Nombre', patient?.nombre],
                ['Primer apellido', patient?.apellido_1],
                ['Segundo apellido', patient?.apellido_2]
              ].map(([label, value]) => (
                <div key={String(label)} style={cardStyle}>
                  <div style={labelStyle}>{label}</div>
                  <div style={valueStyle}>{formatValue(value)}</div>
                </div>
              ))}
            </div>

            <h3 style={{ marginTop: 28, marginBottom: 14 }}>
              Resumen clínico
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16
              }}
            >
              <div style={cardStyle}>
                <CalendarDays color="#2563eb" size={24} />
                <div style={{ ...labelStyle, marginTop: 12 }}>
                  Atenciones registradas
                </div>
                <strong style={{ fontSize: 28 }}>
                  {history.total_atenciones}
                </strong>
              </div>

              <div style={cardStyle}>
                <Activity color="#059669" size={24} />
                <div style={{ ...labelStyle, marginTop: 12 }}>
                  Servicios registrados
                </div>
                <strong style={{ fontSize: 28 }}>
                  {records.length}
                </strong>
              </div>

              <div style={cardStyle}>
                <Wallet color="#7c3aed" size={24} />
                <div style={{ ...labelStyle, marginTop: 12 }}>
                  Total facturado en atenciones
                </div>
                <strong style={{ fontSize: 24 }}>
                  {formatMoney(
                    records.reduce(
                      (sum, record) => sum + Number(record.monto_total ?? 0),
                      0
                    )
                  )}
                </strong>
              </div>
            </div>

            <h3 style={{ marginTop: 32, marginBottom: 14 }}>
              <FileText
                size={20}
                style={{ verticalAlign: 'middle', marginRight: 8 }}
              />
              Historial de atenciones
            </h3>

            {records.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: 'center', padding: 36 }}>
                <CalendarDays size={32} color="#94a3b8" />
                <p style={{ fontWeight: 600 }}>
                  No hay atenciones registradas para este paciente.
                </p>
                <p style={{ color: '#64748b', fontSize: 14 }}>
                  Las atenciones importadas aparecerán aquí cuando estén vinculadas
                  a su identificación.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {records.map((record) => (
                  <div key={record.id} style={cardStyle}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        flexWrap: 'wrap',
                        marginBottom: 18
                      }}
                    >
                      <div>
                        <div style={{ color: '#64748b', fontSize: 13 }}>
                          {formatDate(record.fecha)}
                        </div>
                        <h4 style={{ margin: '5px 0', fontSize: 18 }}>
                          {formatValue(record.servicio)}
                        </h4>
                      </div>

                      <div
                        style={{
                          padding: '8px 12px',
                          borderRadius: 8,
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          fontWeight: 700
                        }}
                      >
                        {formatMoney(record.monto_total)}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 16
                      }}
                    >
                      <div>
                        <div style={labelStyle}>Consultas</div>
                        <div style={valueStyle}>{formatValue(record.consultas)}</div>
                      </div>

                      <div>
                        <div style={labelStyle}>Procedimientos</div>
                        <div style={valueStyle}>{formatValue(record.procedimientos)}</div>
                      </div>

                      <div>
                        <div style={labelStyle}>Medicamentos</div>
                        <div style={valueStyle}>{formatValue(record.medicamentos)}</div>
                      </div>

                      <div>
                        <div style={labelStyle}>Monto consulta</div>
                        <div style={valueStyle}>{formatMoney(record.monto_consulta)}</div>
                      </div>

                      <div>
                        <div style={labelStyle}>Monto servicios</div>
                        <div style={valueStyle}>{formatMoney(record.monto_servicio)}</div>
                      </div>

                      <div>
                        <div style={labelStyle}>Monto medicamentos</div>
                        <div style={valueStyle}>{formatMoney(record.monto_medicamentos)}</div>
                      </div>

                      <div>
                        <div style={labelStyle}>Forma de pago</div>
                        <div style={valueStyle}>{formatValue(record.forma_pago)}</div>
                      </div>

                      <div>
                        <div style={labelStyle}>Estado de pago</div>
                        <div style={valueStyle}>{formatValue(record.estado_pago)}</div>
                      </div>
                    </div>

                    {record.observaciones && (
                      <div
                        style={{
                          marginTop: 18,
                          padding: 14,
                          borderRadius: 8,
                          background: '#f8fafc'
                        }}
                      >
                        <div style={labelStyle}>Observaciones</div>
                        <div style={{ fontSize: 14, color: '#334155' }}>
                          {record.observaciones}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    );
  }

  // ==========================
  // LISTADO DE PACIENTES
  // ==========================

  return (
    <div style={{ padding: '24px 0' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Pacientes</h2>
          <p style={{ marginTop: 8 }}>
            Gestión de pacientes y expedientes clínicos.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPatients}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #dbe3eb',
            background: '#fff',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      <div
        style={{
          marginTop: 24,
          padding: 20,
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}
      >
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            background: '#eff6ff',
            color: '#2563eb'
          }}
        >
          <Users size={24} />
        </div>

        <div>
          <div style={{ color: '#64748b', fontSize: 14 }}>
            Pacientes registrados
          </div>
          <strong style={{ fontSize: 28 }}>
            {loading ? '...' : total}
          </strong>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            border: '1px solid #dbe3eb',
            borderRadius: 10,
            background: '#fff',
            maxWidth: 420
          }}
        >
          <Search size={18} color="#64748b" />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar pacientes..."
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: 14,
              background: 'transparent'
            }}
          />
        </div>
      </div>

      {error && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 8,
            background: '#fef2f2',
            color: '#b91c1c'
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          marginTop: 20,
          overflowX: 'auto',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          background: '#fff'
        }}
      >
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            Cargando pacientes...
          </div>
        ) : filteredPatients.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            No se encontraron pacientes.
          </div>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: 14
            }}
          >
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {columns.slice(0, 2).map((column) => (
                  <th
                    key={column}
                    style={{
                      padding: 14,
                      borderBottom: '1px solid #e2e8f0',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {formatLabel(column)}
                  </th>
                ))}

                <th
                  style={{
                    padding: 14,
                    borderBottom: '1px solid #e2e8f0'
                  }}
                >
                  Expediente
                </th>

                {columns.slice(2).map((column) => (
                  <th
                    key={column}
                    style={{
                      padding: 14,
                      borderBottom: '1px solid #e2e8f0',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {formatLabel(column)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredPatients.map((patient, index) => (
                <tr key={String(patient.id ?? index)}>
                  {columns.slice(0, 2).map((column) => (
                    <td
                      key={column}
                      style={{
                        padding: 14,
                        borderBottom: '1px solid #f1f5f9',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {formatValue(patient[column])}
                    </td>
                  ))}

                  <td
                    style={{
                      padding: 14,
                      borderBottom: '1px solid #f1f5f9'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => openPatient(patient)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: 8,
                        background: '#eff6ff',
                        color: '#2563eb',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Ver expediente
                      <ChevronRight size={16} />
                    </button>
                  </td>

                  {columns.slice(2).map((column) => (
                    <td
                      key={column}
                      style={{
                        padding: 14,
                        borderBottom: '1px solid #f1f5f9',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {formatValue(patient[column])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ color: '#64748b', fontSize: 13, marginTop: 12 }}>
        Mostrando {filteredPatients.length} de {total} pacientes registrados.
      </p>
    </div>
  );
}
