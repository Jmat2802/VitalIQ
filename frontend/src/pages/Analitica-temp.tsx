
import { API_URL } from '../api';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

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
  '#22C55E'
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

    if (labels?.[value]) {
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
  icon,
  color,
  percentage
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  color: string;
  percentage?: string;
}) {
  return (
    <div className="viq-kpi">
      <div className="viq-kpi-top">
        <div
          className="viq-kpi-icon"
          style={{
            background: `${color}15`,
            color
          }}
        >
          {icon}
        </div>

        {percentage && (
          <span className="viq-kpi-badge">
            {percentage}
          </span>
        )}
      </div>

      <div className="viq-kpi-value">
        {value}
      </div>

      <div className="viq-kpi-title">
        {title}
      </div>

      <div className="viq-kpi-subtitle">
        {subtitle}
      </div>

      <div
        className="viq-kpi-line"
        style={{ background: color }}
      />
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  badge
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  badge?: string;
}) {
  return (
    <section className="viq-chart-card">
      <div className="viq-chart-header">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>

        {badge && (
          <span className="viq-chart-badge">
            {badge}
          </span>
        )}
      </div>

      {children}
    </section>
  );
}

function DonutChart({
  data,
  colorSet = COLORS
}: {
  data: Distribution[];
  colorSet?: string[];
}) {
  const total = data.reduce(
    (sum, item) => sum + item.value,
    0
  );

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
              innerRadius="67%"
              outerRadius="94%"
              paddingAngle={data.length > 1 ? 4 : 0}
              stroke="none"
              animationDuration={700}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={colorSet[index % colorSet.length]}
                />
              ))}
            </Pie>

            <Tooltip
              formatter={(value) => [
                `${value} pacientes`,
                'Cantidad'
              ]}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #E2E8F0',
                boxShadow: '0 8px 25px #0F172A12'
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="viq-donut-center">
          <strong>
            {total.toLocaleString('es-CR')}
          </strong>
          <span>Pacientes</span>
        </div>
      </div>

      <div className="viq-donut-legend">
        {data.map((item, index) => (
          <div
            className="viq-legend-item"
            key={item.name}
          >
            <div className="viq-legend-heading">
              <span
                className="viq-legend-dot"
                style={{
                  background: colorSet[index % colorSet.length]
                }}
              />

              <span className="viq-legend-name">
                {item.name}
              </span>
            </div>

            <div className="viq-legend-bottom">
              <strong>
                {item.value.toLocaleString('es-CR')}
              </strong>

              <span>
                {total
                  ? `${((item.value / total) * 100).toFixed(1)}%`
                  : '0%'}
              </span>
            </div>

            <div className="viq-legend-progress">
              <div
                style={{
                  width: total
                    ? `${(item.value / total) * 100}%`
                    : '0%',
                  background: colorSet[index % colorSet.length]
                }}
              />
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
  heightPerItem = 42,
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
      height={Math.max(250, data.length * heightPerItem + 30)}
    >
      <BarChart
        data={data}
        layout="vertical"
        margin={{
          top: 5,
          right: 35,
          bottom: 5,
          left: 5
        }}
        barCategoryGap="28%"
      >
        <CartesianGrid
          stroke="#EEF2F7"
          horizontal={false}
        />

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
          tick={{
            fill: '#475569',
            fontSize: 11
          }}
        />

        <Tooltip
          formatter={(value) => [
            `${value} pacientes`,
            'Cantidad'
          ]}
          cursor={{ fill: '#F8FAFC' }}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #E2E8F0'
          }}
        />

        <Bar
          dataKey="value"
          fill={color}
          radius={[0, 8, 8, 0]}
          barSize={20}
          animationDuration={700}
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

      const response = await fetch(
        `${API}?limit=10000&offset=0`,
        {
          credentials: 'include'
        }
      );

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
  }, [
    patients,
    geoLevel,
    selectedProvince,
    selectedCanton
  ]);

  const patientsByProvince = useMemo(
    () => getDistribution(patients, 'provincia'),
    [patients]
  );

  const percentage = (value: number) =>
    patients.length
      ? `${((value / patients.length) * 100).toFixed(1)}%`
      : '0%';

  const topProvince = patientsByProvince[0];
  const topGender = genderData[0];

  if (loading) {
    return (
      <div className="viq-page">
        <AnalyticsStyles />

        <div className="viq-loading">
          <div className="viq-loader" />
          <h2>Cargando analítica demográfica</h2>
          <p>Preparando los datos de pacientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="viq-page">
      <AnalyticsStyles />

      {/* HEADER */}
      <header className="viq-header">
        <div>
          <div className="viq-eyebrow">
            <span className="viq-eyebrow-dot" />
            VITALIQ · INTELIGENCIA CLÍNICA
          </div>

          <h1>Analítica demográfica</h1>

          <p>
            Conocé la composición y distribución de la población atendida.
          </p>
        </div>

        <div className="viq-header-actions">
          <span className="viq-live-indicator">
            <span />
            Datos actualizados
          </span>

          <button
            className="viq-refresh"
            onClick={loadData}
          >
            <span>↻</span>
            Actualizar
          </button>
        </div>
      </header>

      {error && (
        <div className="viq-error">
          <strong>⚠ Atención</strong>
          <span>{error}</span>
        </div>
      )}

      {/* KPIs */}
      <section className="viq-kpi-grid">
        <StatCard
          title="Pacientes analizados"
          value={patients.length.toLocaleString('es-CR')}
          subtitle="Registros procesados"
          icon="♙"
          color="#0EA5E9"
        />

        <StatCard
          title="Total en sistema"
          value={total.toLocaleString('es-CR')}
          subtitle="Registros disponibles"
          icon="▤"
          color="#6366F1"
        />

        <StatCard
          title="Provincias"
          value={provinces.length}
          subtitle="Con pacientes registrados"
          icon="⌖"
          color="#14B8A6"
        />

        <StatCard
          title="Nacionalidades"
          value={nationalityData.length}
          subtitle="Representadas en el sistema"
          icon="◎"
          color="#F59E0B"
        />
      </section>

      {/* INSIGHT */}
      <section className="viq-insight">
        <div className="viq-insight-icon">✦</div>

        <div className="viq-insight-content">
          <span>RESUMEN DE POBLACIÓN</span>

          <p>
            {topGender
              ? `${topGender.name} representa la categoría con mayor cantidad de pacientes (${percentage(topGender.value)} del total).`
              : 'No hay información suficiente para generar un resumen.'}
          </p>
        </div>

        {topProvince && (
          <div className="viq-insight-highlight">
            <span>Provincia principal</span>
            <strong>{topProvince.name}</strong>
            <small>{topProvince.value.toLocaleString('es-CR')} pacientes</small>
          </div>
        )}
      </section>

      {/* GÉNERO Y ESTADO CIVIL */}
      <div className="viq-section-heading">
        <div>
          <span>01 / COMPOSICIÓN</span>
          <h2>Perfil de pacientes</h2>
        </div>
      </div>

      <div className="viq-grid">
        <ChartCard
          title="Distribución por género"
          subtitle="Composición de la población atendida"
          badge={`${genderData.length} categorías`}
        >
          {genderData.length
            ? <DonutChart data={genderData} />
            : <p>Sin datos disponibles</p>}
        </ChartCard>

        <ChartCard
          title="Estado civil"
          subtitle="Situación civil registrada"
          badge={`${civilData.length} categorías`}
        >
          {civilData.length
            ? <DonutChart
                data={civilData}
                colorSet={[
                  '#6366F1',
                  '#0EA5E9',
                  '#14B8A6',
                  '#F59E0B',
                  '#EC4899',
                  '#8B5CF6'
                ]}
              />
            : <p>Sin datos disponibles</p>}
        </ChartCard>
      </div>

      {/* NACIONALIDAD Y OCUPACIÓN */}
      <div className="viq-section-heading">
        <div>
          <span>02 / CARACTERÍSTICAS</span>
          <h2>Información sociodemográfica</h2>
        </div>
      </div>

      <div className="viq-grid">
        <ChartCard
          title="Nacionalidad"
          subtitle="Distribución por nacionalidad"
          badge={`${nationalityData.length} categorías`}
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
          subtitle="Actividad laboral registrada"
          badge={`${occupationData.length} categorías`}
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

      {/* GEOGRAFÍA */}
      <div className="viq-section-heading">
        <div>
          <span>03 / TERRITORIO</span>
          <h2>Distribución geográfica</h2>
        </div>
      </div>

      <ChartCard
        title="Exploración territorial"
        subtitle="Analizá dónde se encuentran los pacientes"
      >
        <div className="viq-filter-panel">
          <div className="viq-filter-title">
            <span>⌖</span>
            Filtros geográficos
          </div>

          <div className="viq-filters">
            <label>
              <span>Nivel de análisis</span>
              <select
                value={geoLevel}
                onChange={e => {
                  setGeoLevel(
                    e.target.value as typeof geoLevel
                  );
                  setSelectedCanton('');
                }}
              >
                <option value="provincia">Provincia</option>
                <option value="canton">Cantón</option>
                <option value="distrito">Distrito</option>
              </select>
            </label>

            <label>
              <span>Provincia</span>
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
              <span>Cantón</span>
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

            <button
              className="viq-filter-reset"
              onClick={() => {
                setSelectedProvince('');
                setSelectedCanton('');
                setGeoLevel('provincia');
              }}
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        <div className="viq-geography-summary">
          <div>
            <span>Ubicaciones identificadas</span>
            <strong>{geographyData.length}</strong>
          </div>

          <div>
            <span>Pacientes en selección</span>
            <strong>
              {geographyData
                .reduce((sum, item) => sum + item.value, 0)
                .toLocaleString('es-CR')}
            </strong>
          </div>
        </div>

        {geographyData.length
          ? <HorizontalBars
              data={geographyData}
              color="#6366F1"
              heightPerItem={42}
              labelWidth={145}
            />
          : <p className="viq-empty">
              Sin datos geográficos disponibles.
            </p>}
      </ChartCard>

      {/* TABLA PROVINCIAL */}
      <div className="viq-section-heading">
        <div>
          <span>04 / DISTRIBUCIÓN</span>
          <h2>Resumen provincial</h2>
        </div>

        <span className="viq-section-note">
          {patientsByProvince.length} provincias
        </span>
      </div>

      <ChartCard
        title="Pacientes por provincia"
        subtitle="Participación de cada provincia en el total de registros"
      >
        <div className="viq-table-wrapper">
          <table className="viq-table">
            <thead>
              <tr>
                <th>Provincia</th>
                <th>Pacientes</th>
                <th>Participación</th>
                <th>Distribución</th>
              </tr>
            </thead>

            <tbody>
              {patientsByProvince.map((item, index) => (
                <tr key={item.name}>
                  <td>
                    <div className="viq-province-name">
                      <span className="viq-province-number">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <strong>{item.name}</strong>
                    </div>
                  </td>

                  <td>
                    <strong className="viq-table-number">
                      {item.value.toLocaleString('es-CR')}
                    </strong>
                  </td>

                  <td>
                    <span className="viq-percentage">
                      {percentage(item.value)}
                    </span>
                  </td>

                  <td>
                    <div className="viq-table-progress">
                      <div
                        style={{
                          width: percentage(item.value)
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <footer className="viq-analytics-footer">
        <span>VITALIQ</span>
        <span>Analítica demográfica · Datos del sistema</span>
      </footer>
    </div>
  );
}

function AnalyticsStyles() {
  return (
    <style>{`
      .viq-page {
        background: #F3F6FB;
        min-height: 100%;
        padding: clamp(20px, 3vw, 38px);
        color: #102D46;
        box-sizing: border-box;
        font-family: inherit;
      }

      .viq-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 24px;
        margin-bottom: 30px;
      }

      .viq-eyebrow {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #64748B;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1.8px;
        margin-bottom: 12px;
      }

      .viq-eyebrow-dot {
        width: 7px;
        height: 7px;
        background: #0EA5E9;
        border-radius: 50%;
        box-shadow: 0 0 0 4px #0EA5E915;
      }

      .viq-header h1 {
        margin: 0;
        font-size: clamp(27px, 3vw, 36px);
        line-height: 1.15;
        font-weight: 850;
        letter-spacing: -1.2px;
        color: #102D46;
      }

      .viq-header p {
        margin: 10px 0 0;
        color: #718198;
        font-size: 14px;
      }

      .viq-header-actions {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .viq-live-indicator {
        display: flex;
        align-items: center;
        gap: 7px;
        color: #64748B;
        font-size: 11px;
        font-weight: 600;
      }

      .viq-live-indicator span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #10B981;
        box-shadow: 0 0 0 4px #10B98118;
      }

      .viq-refresh {
        display: flex;
        align-items: center;
        gap: 9px;
        background: #103B5C;
        color: white;
        border: 0;
        border-radius: 11px;
        padding: 12px 17px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 700;
        transition: .2s ease;
      }

      .viq-refresh:hover {
        background: #0B527E;
        transform: translateY(-1px);
        box-shadow: 0 6px 16px #103B5C20;
      }

      .viq-refresh span {
        font-size: 18px;
      }

      /* KPI CARDS */

      .viq-kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 17px;
        margin-bottom: 25px;
      }

      .viq-kpi {
        position: relative;
        background: white;
        border: 1px solid #E7EDF5;
        border-radius: 16px;
        padding: 22px;
        overflow: hidden;
        min-width: 0;
        box-shadow: 0 4px 18px #16324F05;
        transition: .2s ease;
      }

      .viq-kpi:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 25px #16324F0B;
      }

      .viq-kpi-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .viq-kpi-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        border-radius: 12px;
        font-size: 23px;
        font-weight: 700;
      }

      .viq-kpi-badge {
        color: #0F9B76;
        background: #ECFDF5;
        border-radius: 7px;
        padding: 5px 8px;
        font-size: 10px;
        font-weight: 800;
      }

      .viq-kpi-value {
        color: #102D46;
        font-size: clamp(27px, 2.4vw, 34px);
        font-weight: 850;
        letter-spacing: -1.2px;
        margin-top: 22px;
        line-height: 1;
        font-variant-numeric: tabular-nums;
      }

      .viq-kpi-title {
        color: #475569;
        font-size: 13px;
        font-weight: 700;
        margin-top: 10px;
      }

      .viq-kpi-subtitle {
        color: #94A3B8;
        font-size: 11px;
        margin-top: 6px;
      }

      .viq-kpi-line {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        opacity: .8;
      }

      /* INSIGHT */

      .viq-insight {
        display: flex;
        align-items: center;
        gap: 15px;
        background: linear-gradient(110deg, #103B5C, #174C70);
        color: white;
        padding: 20px 24px;
        border-radius: 16px;
        margin-bottom: 35px;
        box-shadow: 0 8px 22px #103B5C12;
      }

      .viq-insight-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: #FFFFFF16;
        color: #7DD3FC;
        font-size: 22px;
      }

      .viq-insight-content {
        flex: 1;
        min-width: 0;
      }

      .viq-insight-content > span {
        color: #7DD3FC;
        font-size: 9px;
        letter-spacing: 1.5px;
        font-weight: 800;
      }

      .viq-insight-content p {
        margin: 7px 0 0;
        color: #E2EEF7;
        font-size: 13px;
        line-height: 1.5;
      }

      .viq-insight-highlight {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
        padding-left: 22px;
        border-left: 1px solid #FFFFFF20;
        flex-shrink: 0;
      }

      .viq-insight-highlight span {
        color: #A9C6D9;
        font-size: 10px;
      }

      .viq-insight-highlight strong {
        font-size: 17px;
        color: white;
      }

      .viq-insight-highlight small {
        color: #A9C6D9;
        font-size: 10px;
      }

      /* SECTION HEADINGS */

      .viq-section-heading {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 15px;
        margin: 0 0 17px;
      }

      .viq-section-heading > div > span {
        color: #0EA5E9;
        font-size: 9px;
        letter-spacing: 1.5px;
        font-weight: 850;
      }

      .viq-section-heading h2 {
        margin: 6px 0 0;
        font-size: 21px;
        font-weight: 800;
        letter-spacing: -.5px;
        color: #102D46;
      }

      .viq-section-note {
        color: #94A3B8;
        font-size: 11px;
      }

      /* CHART CARDS */

      .viq-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 20px;
        margin-bottom: 34px;
      }

      .viq-chart-card {
        background: white;
        border: 1px solid #E7EDF5;
        border-radius: 17px;
        padding: 24px;
        min-width: 0;
        box-shadow: 0 4px 18px #16324F05;
      }

      .viq-chart-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 22px;
      }

      .viq-chart-header h3 {
        color: #173852;
        font-size: 15px;
        font-weight: 800;
        margin: 0;
      }

      .viq-chart-header p {
        color: #94A3B8;
        font-size: 11px;
        margin: 7px 0 0;
      }

      .viq-chart-badge {
        flex-shrink: 0;
        color: #64748B;
        background: #F1F5F9;
        padding: 6px 9px;
        border-radius: 7px;
        font-size: 10px;
        font-weight: 700;
      }

      /* DONUTS */

      .viq-donut-layout {
        display: grid;
        grid-template-columns: minmax(160px, 1.05fr) minmax(130px, .95fr);
        align-items: center;
        gap: 12px;
        min-height: 270px;
      }

      .viq-donut-visual {
        position: relative;
        height: 270px;
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
        font-size: 28px;
        font-weight: 850;
        color: #102D46;
        letter-spacing: -1px;
      }

      .viq-donut-center span {
        color: #94A3B8;
        font-size: 10px;
        margin-top: 4px;
      }

      .viq-donut-legend {
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-width: 0;
      }

      .viq-legend-item {
        min-width: 0;
      }

      .viq-legend-heading {
        display: flex;
        align-items: center;
        gap: 7px;
      }

      .viq-legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 3px;
        flex-shrink: 0;
      }

      .viq-legend-name {
        color: #64748B;
        font-size: 11px;
        font-weight: 600;
        overflow-wrap: anywhere;
      }

      .viq-legend-bottom {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 6px;
        margin-top: 5px;
      }

      .viq-legend-bottom strong {
        color: #173852;
        font-size: 17px;
        font-weight: 800;
      }

      .viq-legend-bottom span {
        color: #94A3B8;
        font-size: 10px;
        font-weight: 700;
      }

      .viq-legend-progress {
        width: 100%;
        height: 4px;
        border-radius: 99px;
        background: #F1F5F9;
        overflow: hidden;
        margin-top: 7px;
      }

      .viq-legend-progress div {
        height: 100%;
        border-radius: 99px;
      }

      /* GEOGRAPHY FILTERS */

      .viq-filter-panel {
        background: #F8FAFC;
        border: 1px solid #E8EEF5;
        border-radius: 13px;
        padding: 17px;
        margin-bottom: 20px;
      }

      .viq-filter-title {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #173852;
        font-size: 12px;
        font-weight: 800;
        margin-bottom: 14px;
      }

      .viq-filter-title span {
        color: #0EA5E9;
        font-size: 17px;
      }

      .viq-filters {
        display: flex;
        align-items: flex-end;
        flex-wrap: wrap;
        gap: 12px;
      }

      .viq-filters label {
        display: flex;
        flex-direction: column;
        gap: 7px;
        flex: 1;
        min-width: 150px;
      }

      .viq-filters label > span {
        color: #64748B;
        font-size: 10px;
        font-weight: 700;
      }

      .viq-filters select {
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
        border: 1px solid #DCE5EF;
        border-radius: 9px;
        padding: 11px 12px;
        background: white;
        color: #23435F;
        font-size: 12px;
        outline: none;
        cursor: pointer;
      }

      .viq-filters select:focus {
        border-color: #0EA5E9;
        box-shadow: 0 0 0 3px #0EA5E915;
      }

      .viq-filter-reset {
        border: 1px solid #DCE5EF;
        background: white;
        color: #64748B;
        border-radius: 9px;
        padding: 11px 13px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        transition: .2s ease;
      }

      .viq-filter-reset:hover {
        border-color: #0EA5E9;
        color: #0EA5E9;
      }

      .viq-geography-summary {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
      }

      .viq-geography-summary > div {
        display: flex;
        flex-direction: column;
        gap: 5px;
        background: #F8FAFC;
        border: 1px solid #EDF2F7;
        padding: 13px 16px;
        border-radius: 10px;
        flex: 1;
      }

      .viq-geography-summary span {
        color: #94A3B8;
        font-size: 10px;
      }

      .viq-geography-summary strong {
        color: #173852;
        font-size: 20px;
        font-weight: 800;
      }

      /* PROVINCE TABLE */

      .viq-table-wrapper {
        width: 100%;
        overflow-x: auto;
      }

      .viq-table {
        width: 100%;
        min-width: 520px;
        border-collapse: collapse;
        font-size: 12px;
      }

      .viq-table th {
        background: #F8FAFC;
        color: #94A3B8;
        text-align: left;
        font-size: 9px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1px;
        padding: 15px 16px;
        border-bottom: 1px solid #E8EEF5;
      }

      .viq-table td {
        padding: 16px;
        color: #475569;
        border-bottom: 1px solid #F1F5F9;
      }

      .viq-table tbody tr:last-child td {
        border-bottom: 0;
      }

      .viq-table tbody tr:hover td {
        background: #FAFCFE;
      }

      .viq-province-name {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .viq-province-number {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 27px;
        height: 27px;
        border-radius: 8px;
        background: #F1F5F9;
        color: #94A3B8;
        font-size: 9px;
        font-weight: 800;
      }

      .viq-province-name strong {
        color: #173852;
        font-weight: 700;
      }

      .viq-table-number {
        color: #173852;
        font-size: 14px;
        font-weight: 800;
      }

      .viq-percentage {
        color: #64748B;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
      }

      .viq-table-progress {
        width: 100%;
        max-width: 150px;
        height: 7px;
        background: #EAF0F6;
        border-radius: 99px;
        overflow: hidden;
      }

      .viq-table-progress div {
        height: 100%;
        background: linear-gradient(90deg, #0EA5E9, #14B8A6);
        border-radius: 99px;
      }

      /* FOOTER & STATES */

      .viq-analytics-footer {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-top: 30px;
        padding-top: 18px;
        border-top: 1px solid #E2E8F0;
        color: #94A3B8;
        font-size: 10px;
      }

      .viq-analytics-footer span:first-child {
        color: #64748B;
        font-weight: 850;
        letter-spacing: 1.5px;
      }

      .viq-empty {
        text-align: center;
        padding: 35px;
        color: #94A3B8;
        font-size: 12px;
      }

      .viq-error {
        display: flex;
        flex-direction: column;
        gap: 6px;
        background: #FEF2F2;
        color: #991B1B;
        border: 1px solid #FECACA;
        padding: 15px 18px;
        border-radius: 12px;
        margin-bottom: 22px;
        font-size: 12px;
      }

      .viq-loading {
        background: white;
        border: 1px solid #E7EDF5;
        border-radius: 17px;
        padding: 60px 20px;
        text-align: center;
      }

      .viq-loading h2 {
        color: #173852;
        font-size: 17px;
        margin: 20px 0 8px;
      }

      .viq-loading p {
        color: #94A3B8;
        font-size: 12px;
      }

      .viq-loader {
        width: 32px;
        height: 32px;
        border: 3px solid #E0F2FE;
        border-top-color: #0EA5E9;
        border-radius: 50%;
        animation: viqspin .8s linear infinite;
        margin: auto;
      }

      @keyframes viqspin {
        to { transform: rotate(360deg); }
      }

      /* RESPONSIVE */

      @media(max-width:1200px) {
        .viq-kpi-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .viq-donut-layout {
          grid-template-columns: minmax(130px, 1fr) minmax(120px, 1fr);
        }
      }

      @media(max-width:900px) {
        .viq-grid {
          grid-template-columns: minmax(0, 1fr);
        }

        .viq-donut-layout {
          grid-template-columns: minmax(180px, .8fr) minmax(160px, 1.2fr);
        }

        .viq-donut-visual {
          height: 250px;
        }

        .viq-donut-legend {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }
      }

      @media(max-width:600px) {
        .viq-page {
          padding: 16px;
        }

        .viq-header {
          align-items: flex-start;
          flex-direction: column;
          margin-bottom: 23px;
        }

        .viq-header-actions {
          width: 100%;
          justify-content: space-between;
        }

        .viq-kpi-grid {
          gap: 10px;
        }

        .viq-kpi {
          padding: 16px;
          border-radius: 13px;
        }

        .viq-kpi-icon {
          width: 35px;
          height: 35px;
          font-size: 20px;
        }

        .viq-kpi-value {
          font-size: 26px;
          margin-top: 17px;
        }

        .viq-kpi-title {
          font-size: 11px;
        }

        .viq-kpi-subtitle {
          font-size: 10px;
        }

        .viq-insight {
          align-items: flex-start;
          flex-wrap: wrap;
          padding: 17px;
          gap: 12px;
        }

        .viq-insight-content {
          flex-basis: calc(100% - 55px);
        }

        .viq-insight-highlight {
          flex-basis: 100%;
          align-items: flex-start;
          border-left: 0;
          border-top: 1px solid #FFFFFF20;
          padding: 13px 0 0;
        }

        .viq-section-heading h2 {
          font-size: 19px;
        }

        .viq-chart-card {
          padding: 17px;
          border-radius: 14px;
        }

        .viq-chart-header {
          margin-bottom: 15px;
        }

        .viq-donut-layout {
          grid-template-columns: minmax(0, 1fr);
          gap: 5px;
        }

        .viq-donut-visual {
          height: 230px;
        }

        .viq-donut-legend {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 15px;
          padding: 0 5px 10px;
        }

        .viq-geography-summary {
          flex-direction: column;
        }

        .viq-filters {
          flex-direction: column;
          align-items: stretch;
        }

        .viq-filters label {
          min-width: 0;
          width: 100%;
        }

        .viq-filter-reset {
          width: 100%;
        }

        .viq-analytics-footer {
          flex-direction: column;
        }
      }

      @media(max-width:360px) {
        .viq-kpi {
          padding: 13px;
        }

        .viq-kpi-value {
          font-size: 23px;
        }

        .viq-kpi-badge {
          font-size: 9px;
        }

        .viq-donut-legend {
          grid-template-columns: minmax(0, 1fr);
        }
      }
    `}</style>
  );
}
