
import { API_URL } from '../api';
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const API = `${API_URL}/pacientes`;

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

type Distribution = { name: string; value: number };

const COLORS = [
  '#0EA5E9', '#14B8A6', '#6366F1', '#F59E0B',
  '#EC4899', '#8B5CF6', '#64748B', '#22C55E'
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

  patients.forEach(patient => {
    let value = normalize(patient[field]);

    if (!value || value === '.' || value === '-') {
      value = 'No especificado';
    }

    if (labels?.[value]) value = labels[value];

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
  accent
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  accent: string;
}) {
  return (
    <div style={styles.stat}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          width: 8,
          height: 8,
          borderRadius: 3,
          background: accent
        }} />
        <span style={{
          color: '#64748B',
          fontSize: 12,
          fontWeight: 600
        }}>
          {title}
        </span>
      </div>

      <div style={{
        fontSize: 29,
        fontWeight: 800,
        color: '#103653',
        letterSpacing: '-1px',
        marginTop: 12
      }}>
        {value}
      </div>

      {subtitle && (
        <div style={{
          fontSize: 11,
          color: '#94A3B8',
          marginTop: 5
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section style={styles.card}>
      <div style={{ marginBottom: 18 }}>
        <h3 style={{
          color: '#103653',
          fontSize: 16,
          margin: 0,
          fontWeight: 750
        }}>
          {title}
        </h3>

        {subtitle && (
          <p style={{
            color: '#94A3B8',
            fontSize: 12,
            margin: '6px 0 0'
          }}>
            {subtitle}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}

function DonutChart({ data }: { data: Distribution[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="viq-donut-layout">
      <div className="viq-donut-visual">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="66%"
              outerRadius="92%"
              paddingAngle={data.length > 1 ? 3 : 0}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip
              formatter={(value) => [`${value} pacientes`, 'Cantidad']}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="viq-donut-center">
          <strong>{total}</strong>
          <span>Pacientes</span>
        </div>
      </div>

      <div className="viq-donut-legend">
        {data.map((item, index) => (
          <div key={item.name}>
            <div className="viq-legend-label">
              <span
                className="viq-legend-dot"
                style={{ background: COLORS[index % COLORS.length] }}
              />
              <span>{item.name}</span>
            </div>

            <div className="viq-legend-value">
              <strong>{item.value}</strong>
              <span>
                {total
                  ? ((item.value / total) * 100).toFixed(1)
                  : '0.0'}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalBars({
  data,
  color,
  heightPerItem = 38,
  labelWidth = 125
}: {
  data: Distribution[];
  color: string;
  heightPerItem?: number;
  labelWidth?: number;
}) {
  return (
    <ResponsiveContainer
      width="100%"
      height={Math.max(230, data.length * heightPerItem + 24)}
    >
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 32, bottom: 4, left: 8 }}
        barCategoryGap="25%"
      >
        <CartesianGrid stroke="#E8EEF5" horizontal={false} />

        <XAxis
          type="number"
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94A3B8', fontSize: 11 }}
        />

        <YAxis
          type="category"
          dataKey="name"
          width={labelWidth}
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#475569', fontSize: 11 }}
        />

        <Tooltip
          formatter={(value) => [`${value} pacientes`, 'Cantidad']}
          cursor={{ fill: '#F1F5F9' }}
        />

        <Bar
          dataKey="value"
          fill={color}
          radius={[0, 7, 7, 0]}
          barSize={18}
          animationDuration={650}
        />
      </BarChart>
    </ResponsiveContainer>
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

  const genderData = useMemo(
    () => getDistribution(patients, 'genero', {
      M: 'Masculino',
      F: 'Femenino'
    }),
    [patients]
  );

  const civilData = useMemo(
    () => getDistribution(patients, 'estado_civil', {
      S: 'Soltero',
      C: 'Casado',
      D: 'Divorciado',
      V: 'Viudo',
      O: 'Otro / No especificado',
      U: 'Unión libre'
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

  const provinces = useMemo(
    () => Array.from(
      new Set(
        patients
          .map(p => normalize(p.provincia))
          .filter(Boolean)
      )
    ).sort(),
    [patients]
  );

  const cantons = useMemo(
    () => Array.from(
      new Set(
        patients
          .filter(
            p => !selectedProvince ||
              normalize(p.provincia) === selectedProvince
          )
          .map(p => normalize(p.canton))
          .filter(Boolean)
      )
    ).sort(),
    [patients, selectedProvince]
  );

  const geographyData = useMemo(() => {
    const filtered = patients.filter(
      p =>
        (!selectedProvince ||
          normalize(p.provincia) === selectedProvince) &&
        (!selectedCanton ||
          normalize(p.canton) === selectedCanton)
    );

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

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={{
          ...styles.card,
          textAlign: 'center',
          padding: 32
        }}>
          <div className="viq-loader" />
          <h2>Cargando analítica demográfica...</h2>
        </div>

        <AnalyticsStyles />
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <AnalyticsStyles />

      <header className="viq-header">
        <div>
          <div className="viq-overline">
            INTELIGENCIA CLÍNICA
          </div>

          <h1 className="viq-title">
            Analítica demográfica
          </h1>

          <p className="viq-description">
            Distribución y características de los pacientes.
          </p>
        </div>

        <button
          className="viq-refresh"
          onClick={loadData}
        >
          ↻ &nbsp;Actualizar datos
        </button>
      </header>

      {error && (
        <div className="viq-error">
          {error}
        </div>
      )}

      <div className="viq-stats">
        <StatCard
          title="Pacientes analizados"
          value={patients.length}
          subtitle="Registros procesados"
          accent="#0EA5E9"
        />

        <StatCard
          title="Registros disponibles"
          value={total}
          subtitle="Total en el sistema"
          accent="#6366F1"
        />

        <StatCard
          title="Provincias representadas"
          value={provinces.length}
          subtitle="Con información registrada"
          accent="#14B8A6"
        />

        <StatCard
          title="Nacionalidades"
          value={nationalityData.length}
          subtitle="Categorías identificadas"
          accent="#F59E0B"
        />
      </div>

      <div className="viq-grid">
        <ChartCard
          title="Distribución por género"
          subtitle="Composición de pacientes por género"
        >
          {genderData.length
            ? <DonutChart data={genderData} />
            : <p>Sin datos disponibles</p>}
        </ChartCard>

        <ChartCard
          title="Estado civil"
          subtitle="Distribución según estado civil registrado"
        >
          {civilData.length
            ? <DonutChart data={civilData} />
            : <p>Sin datos disponibles</p>}
        </ChartCard>
      </div>

      <div className="viq-grid">
        <ChartCard
          title="Nacionalidad"
          subtitle="Pacientes según nacionalidad"
        >
          {nationalityData.length
            ? <HorizontalBars
                data={nationalityData}
                color="#0EA5E9"
                heightPerItem={48}
              />
            : <p>Sin datos disponibles</p>}
        </ChartCard>

        <ChartCard
          title="Ocupación"
          subtitle="Distribución de ocupaciones registradas"
        >
          {occupationData.length
            ? <HorizontalBars
                data={occupationData}
                color="#14B8A6"
                heightPerItem={42}
              />
            : <p>Sin datos disponibles</p>}
        </ChartCard>
      </div>

      <ChartCard
        title="Distribución geográfica"
        subtitle="Explora la ubicación de los pacientes"
      >
        <div className="viq-filters">
          <label>
            Nivel geográfico
            <select
              value={geoLevel}
              onChange={e => {
                setGeoLevel(e.target.value as typeof geoLevel);
                setSelectedCanton('');
              }}
            >
              <option value="provincia">Por provincia</option>
              <option value="canton">Por cantón</option>
              <option value="distrito">Por distrito</option>
            </select>
          </label>

          <label>
            Provincia
            <select
              value={selectedProvince}
              onChange={e => {
                setSelectedProvince(e.target.value);
                setSelectedCanton('');
              }}
            >
              <option value="">Todas las provincias</option>
              {provinces.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>

          <label>
            Cantón
            <select
              value={selectedCanton}
              onChange={e => setSelectedCanton(e.target.value)}
            >
              <option value="">Todos los cantones</option>
              {cantons.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>

        {geographyData.length
          ? <HorizontalBars
              data={geographyData}
              color="#6366F1"
              heightPerItem={42}
              labelWidth={145}
            />
          : <p style={{ color: '#64748B' }}>
              Sin datos geográficos disponibles.
            </p>}
      </ChartCard>

      <div style={{ marginTop: 20 }}>
        <ChartCard
          title="Resumen por provincia"
          subtitle="Participación de cada provincia en el total de pacientes"
        >
          <div style={{ overflowX: 'auto' }}>
            <table className="viq-table">
              <thead>
                <tr>
                  <th>Provincia</th>
                  <th>Pacientes</th>
                  <th>Participación</th>
                </tr>
              </thead>

              <tbody>
                {patientsByProvince.map(item => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td><strong>{item.value}</strong></td>
                    <td>
                      <div className="viq-part">
                        <span>{percentage(item.value)}</span>

                        <div className="viq-progress">
                          <div style={{
                            width: percentage(item.value)
                          }}/>
                        </div>
                      </div>
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

function AnalyticsStyles() {
  return (
    <style>{`
      .viq-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 18px;
        flex-wrap: wrap;
        margin-bottom: 26px;
      }

      .viq-overline {
        color: #0EA5E9;
        font-size: 10px;
        letter-spacing: 2px;
        font-weight: 800;
        margin-bottom: 8px;
      }

      .viq-title {
        margin: 0 0 8px;
        color: #103653;
        font-size: clamp(24px, 3vw, 32px);
        font-weight: 800;
        letter-spacing: -.8px;
      }

      .viq-description {
        margin: 0;
        color: #64748B;
        font-size: 14px;
      }

      .viq-refresh {
        background: #0F5B94;
        color: white;
        border: 0;
        border-radius: 10px;
        padding: 11px 16px;
        cursor: pointer;
        font-weight: 650;
        font-size: 13px;
        box-shadow: 0 4px 12px #0f5b9429;
      }

      .viq-refresh:hover {
        background: #0B4775;
      }

      .viq-stats {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
        margin-bottom: 22px;
      }

      .viq-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 20px;
        margin-bottom: 20px;
      }

      .viq-donut-layout {
        display: grid;
        grid-template-columns: minmax(140px, 1fr) minmax(115px, 1fr);
        align-items: center;
        gap: 12px;
        min-height: 250px;
      }

      .viq-donut-visual {
        position: relative;
        height: 250px;
        min-width: 0;
      }

      .viq-donut-center {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }

      .viq-donut-center strong {
        color: #103653;
        font-size: 30px;
        letter-spacing: -1px;
      }

      .viq-donut-center span {
        color: #94A3B8;
        font-size: 11px;
        margin-top: 2px;
      }

      .viq-donut-legend {
        display: flex;
        flex-direction: column;
        gap: 14px;
        min-width: 0;
      }

      .viq-legend-label {
        display: flex;
        align-items: center;
        gap: 7px;
        color: #64748B;
        font-size: 12px;
      }

      .viq-legend-dot {
        width: 9px;
        height: 9px;
        border-radius: 3px;
        flex-shrink: 0;
      }

      .viq-legend-value {
        display: flex;
        align-items: baseline;
        gap: 7px;
        margin: 4px 0 0 16px;
      }

      .viq-legend-value strong {
        color: #103653;
        font-size: 16px;
      }

      .viq-legend-value span {
        color: #94A3B8;
        font-size: 11px;
      }

      .viq-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 20px;
      }

      .viq-filters label {
        display: flex;
        flex-direction: column;
        gap: 6px;
        color: #64748B;
        font-size: 11px;
        font-weight: 600;
      }

      .viq-filters select {
        min-width: 180px;
        max-width: 100%;
        border: 1px solid #DCE5EF;
        border-radius: 9px;
        padding: 10px 12px;
        background: white;
        color: #23435F;
        font-size: 13px;
        outline: none;
      }

      .viq-filters select:focus {
        border-color: #0EA5E9;
        box-shadow: 0 0 0 3px #0ea5e91a;
      }

      .viq-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        font-size: 13px;
      }

      .viq-table th {
        text-align: left;
        background: #F6F9FC;
        color: #64748B;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: .5px;
        padding: 13px 15px;
      }

      .viq-table th:first-child {
        border-radius: 8px 0 0 8px;
      }

      .viq-table th:last-child {
        border-radius: 0 8px 8px 0;
      }

      .viq-table td {
        padding: 14px 15px;
        color: #334E68;
        border-bottom: 1px solid #EDF2F7;
      }

      .viq-table tbody tr:hover td {
        background: #FAFCFE;
      }

      .viq-part {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 130px;
      }

      .viq-part > span {
        min-width: 42px;
        color: #64748B;
        font-variant-numeric: tabular-nums;
      }

      .viq-progress {
        flex: 1;
        height: 6px;
        background: #EAF0F6;
        border-radius: 99px;
        overflow: hidden;
      }

      .viq-progress div {
        height: 100%;
        background: #0EA5E9;
        border-radius: 99px;
      }

      .viq-error {
        background: #FEF2F2;
        color: #991B1B;
        border: 1px solid #FECACA;
        padding: 14px 16px;
        border-radius: 10px;
        margin-bottom: 20px;
      }

      .viq-loader {
        width: 30px;
        height: 30px;
        border: 3px solid #DCEAF5;
        border-top-color: #0EA5E9;
        border-radius: 50%;
        animation: viqspin .8s linear infinite;
        margin: auto;
      }

      @keyframes viqspin {
        to { transform: rotate(360deg); }
      }

      @media(max-width:1100px) {
        .viq-stats {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media(max-width:760px) {
        .viq-grid {
          grid-template-columns: minmax(0, 1fr);
        }

        .viq-donut-layout {
          grid-template-columns: minmax(130px, .9fr) minmax(120px, 1.1fr);
        }

        .viq-donut-visual {
          height: 220px;
        }
      }

      @media(max-width:420px) {
        .viq-stats {
          gap: 10px;
        }

        .viq-donut-layout {
          grid-template-columns: minmax(0, 1fr);
        }

        .viq-donut-visual {
          height: 210px;
        }

        .viq-donut-legend {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .viq-filters label {
          width: 100%;
        }

        .viq-filters select {
          width: 100%;
          min-width: 0;
        }
      }
    `}</style>
  );
}

const styles: {
  page: CSSProperties;
  stat: CSSProperties;
  card: CSSProperties;
} = {
  page: {
    padding: 'clamp(16px,3vw,32px)',
    background: '#F5F8FC',
    minHeight: '100%',
    color: '#103653',
    boxSizing: 'border-box'
  },

  stat: {
    background: '#fff',
    border: '1px solid #E5EDF5',
    borderRadius: 14,
    padding: '18px 20px',
    boxShadow: '0 3px 12px #0f355406',
    minWidth: 0
  },

  card: {
    background: '#fff',
    border: '1px solid #E5EDF5',
    borderRadius: 14,
    padding: 'clamp(16px,2vw,22px)',
    minWidth: 0,
    boxShadow: '0 3px 12px #0f355406'
  }
};
