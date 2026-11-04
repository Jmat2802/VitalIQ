
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const API = 'http://localhost:8001/api/pacientes';

type Patient = {
  id: number;
  genero?: string | null;
  estado_civil?: string | null;
  nacionalidad?: string | null;
  ocupacion?: string | null;
  provincia?: string | null;
  canton?: string | null;
  distrito?: string | null;
  [key: string]: any;
};

type Distribution = {
  name: string;
  value: number;
};

const COLORS = [
  '#0EA5E9',
  '#14B8A6',
  '#6366F1',
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
  '#64748B',
  '#22C55E',
];

function normalize(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function getDistribution(
  patients: Patient[],
  field: keyof Patient,
  labels?: Record<string, string>
): Distribution[] {
  const counts: Record<string, number> = {};

  patients.forEach((patient) => {
    let value = normalize(patient[field]);

    if (!value || value === '.' || value === '-') {
      value = 'No especificado';
    }

    if (labels && labels[value]) {
      value = labels[value];
    }

    counts[value] = (counts[value] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 2px 5px rgba(15,23,42,0.03)',
      }}
    >
      <div style={{ color: '#64748B', fontSize: 13, marginBottom: 8 }}>
        {title}
      </div>

      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: '#0F3554',
        }}
      >
        {value}
      </div>

      {subtitle && (
        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 6 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: 20,
        minWidth: 0,
      }}
    >
      <h3
        style={{
          color: '#0F3554',
          fontSize: 16,
          margin: '0 0 20px',
          fontWeight: 650,
        }}
      >
        {title}
      </h3>

      {children}
    </div>
  );
}

export default function Analitica() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [geoLevel, setGeoLevel] = useState<
    'provincia' | 'canton' | 'distrito'
  >('provincia');

  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCanton, setSelectedCanton] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API}?limit=10000&offset=0`);

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const result = await response.json();

      // El backend devuelve los pacientes dentro de "patients".
      const records: Patient[] =
        result.patients ||
        result.pacientes ||
        result.data ||
        [];

      setPatients(records);
      setTotal(result.total ?? records.length);
    } catch (err) {
      console.error('Error cargando analítica:', err);

      setError(
        'No fue posible cargar los datos demográficos. Verifica la conexión con el servidor.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // DISTRIBUCIONES DEMOGRÁFICAS

  const genderData = useMemo(
    () =>
      getDistribution(patients, 'genero', {
        M: 'Masculino',
        F: 'Femenino',
      }),
    [patients]
  );

  const civilData = useMemo(
    () =>
      getDistribution(patients, 'estado_civil', {
        S: 'Soltero',
        C: 'Casado',
        D: 'Divorciado',
        V: 'Viudo',
        O: 'Otro / No especificado',
        U: 'Unión libre',
      }),
    [patients]
  );

  const nationalityData = useMemo(
    () => getDistribution(patients, 'nacionalidad'),
    [patients]
  );

  const occupationData = useMemo(
    () => getDistribution(patients, 'ocupacion'),
    [patients]
  );

  // GEOGRAFÍA

  const provinces = useMemo(
    () =>
      Array.from(
        new Set(
          patients
            .map((p) => normalize(p.provincia))
            .filter(Boolean)
        )
      ).sort(),
    [patients]
  );

  const cantons = useMemo(
    () =>
      Array.from(
        new Set(
          patients
            .filter(
              (p) =>
                !selectedProvince ||
                normalize(p.provincia) === selectedProvince
            )
            .map((p) => normalize(p.canton))
            .filter(Boolean)
        )
      ).sort(),
    [patients, selectedProvince]
  );

  const geographyData = useMemo(() => {
    const filtered = patients.filter((p) => {
      if (
        selectedProvince &&
        normalize(p.provincia) !== selectedProvince
      ) {
        return false;
      }

      if (
        selectedCanton &&
        normalize(p.canton) !== selectedCanton
      ) {
        return false;
      }

      return true;
    });

    const field =
      geoLevel === 'provincia'
        ? 'provincia'
        : geoLevel === 'canton'
          ? 'canton'
          : 'distrito';

    return getDistribution(filtered, field);
  }, [patients, geoLevel, selectedProvince, selectedCanton]);

  const patientsByProvince = useMemo(
    () => getDistribution(patients, 'provincia'),
    [patients]
  );

  const percentage = (value: number) =>
    patients.length
      ? `${((value / patients.length) * 100).toFixed(1)}%`
      : '0%';

  // LOADING

  if (loading) {
    return (
      <div style={{ padding: 32, color: '#0F3554' }}>
        <h2>Analítica demográfica</h2>
        <p>Cargando información de pacientes...</p>
      </div>
    );
  }

  // INTERFAZ

  return (
    <div
      style={{
        padding: '28px 32px',
        background: '#F5F8FC',
        minHeight: '100%',
        color: '#0F3554',
      }}
    >
      {/* ENCABEZADO */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 750,
              margin: '0 0 8px',
              color: '#0F3554',
            }}
          >
            Analítica demográfica
          </h1>

          <p style={{ color: '#64748B', margin: 0 }}>
            Distribución y características de los pacientes.
          </p>
        </div>

        <button
          onClick={loadData}
          style={{
            background: '#0F5B94',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            padding: '10px 16px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Actualizar datos
        </button>
      </div>

      {error && (
        <div
          style={{
            background: '#FEE2E2',
            color: '#991B1B',
            padding: 14,
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      {/* INDICADORES */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          title="Pacientes analizados"
          value={patients.length}
          subtitle="Registros procesados"
        />

        <StatCard
          title="Registros disponibles"
          value={total}
          subtitle="Total en el sistema"
        />

        <StatCard
          title="Provincias representadas"
          value={provinces.length}
          subtitle="Con información registrada"
        />

        <StatCard
          title="Nacionalidades"
          value={nationalityData.length}
          subtitle="Categorías identificadas"
        />
      </div>

      {/* GÉNERO Y ESTADO CIVIL */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20,
          marginBottom: 20,
        }}
      >
        <ChartCard title="Distribución por género">
          {genderData.length ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={genderData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(1)}%`
                    }
                  >
                    {genderData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>

              <div
                style={{
                  textAlign: 'center',
                  color: '#64748B',
                }}
              >
                {genderData.map((item) => (
                  <span key={item.name} style={{ margin: '0 10px' }}>
                    {item.name}: <strong>{item.value}</strong>
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p>Sin datos disponibles</p>
          )}
        </ChartCard>

        <ChartCard title="Estado civil">
          {civilData.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={civilData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(1)}%`
                  }
                >
                  {civilData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p>Sin datos disponibles</p>
          )}
        </ChartCard>
      </div>

      {/* NACIONALIDAD Y OCUPACIÓN */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20,
          marginBottom: 20,
        }}
      >
        <ChartCard title="Nacionalidad">
          {nationalityData.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={nationalityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />

                <Bar
                  dataKey="value"
                  fill="#0EA5E9"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p>Sin datos disponibles</p>
          )}
        </ChartCard>

        <ChartCard title="Ocupación">
          {occupationData.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={occupationData}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="name"
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={85}
                  fontSize={11}
                />

                <YAxis allowDecimals={false} />
                <Tooltip />

                <Bar
                  dataKey="value"
                  fill="#14B8A6"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p>Sin datos disponibles</p>
          )}
        </ChartCard>
      </div>

      {/* GEOGRAFÍA */}

      <ChartCard title="Distribución geográfica">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <select
            value={geoLevel}
            onChange={(e) => {
              setGeoLevel(e.target.value as typeof geoLevel);
              setSelectedCanton('');
            }}
            style={selectStyle}
          >
            <option value="provincia">Por provincia</option>
            <option value="canton">Por cantón</option>
            <option value="distrito">Por distrito</option>
          </select>

          <select
            value={selectedProvince}
            onChange={(e) => {
              setSelectedProvince(e.target.value);
              setSelectedCanton('');
            }}
            style={selectStyle}
          >
            <option value="">Todas las provincias</option>

            {provinces.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>

          <select
            value={selectedCanton}
            onChange={(e) => setSelectedCanton(e.target.value)}
            style={selectStyle}
          >
            <option value="">Todos los cantones</option>

            {cantons.map((canton) => (
              <option key={canton} value={canton}>
                {canton}
              </option>
            ))}
          </select>
        </div>

        {geographyData.length ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={geographyData}
              layout="vertical"
              margin={{ left: 30, right: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis type="number" allowDecimals={false} />

              <YAxis
                type="category"
                dataKey="name"
                width={140}
                fontSize={12}
              />

              <Tooltip />

              <Bar
                dataKey="value"
                fill="#6366F1"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p>Sin datos geográficos disponibles.</p>
        )}
      </ChartCard>

      {/* RESUMEN POR PROVINCIA */}

      <div style={{ marginTop: 20 }}>
        <ChartCard title="Resumen por provincia">
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 14,
              }}
            >
              <thead>
                <tr style={{ background: '#F1F5F9', textAlign: 'left' }}>
                  <th style={tableCellStyle}>Provincia</th>
                  <th style={tableCellStyle}>Pacientes</th>
                  <th style={tableCellStyle}>Participación</th>
                </tr>
              </thead>

              <tbody>
                {patientsByProvince.map((item) => (
                  <tr key={item.name}>
                    <td style={tableCellStyle}>{item.name}</td>
                    <td style={tableCellStyle}>{item.value}</td>
                    <td style={tableCellStyle}>
                      {percentage(item.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

const selectStyle: CSSProperties = {
  border: '1px solid #CBD5E1',
  borderRadius: 8,
  padding: '10px 12px',
  background: '#FFFFFF',
  color: '#0F3554',
  minWidth: 180,
};

const tableCellStyle: CSSProperties = {
  padding: '12px 14px',
  borderBottom: '1px solid #E2E8F0',
};
