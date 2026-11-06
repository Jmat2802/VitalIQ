import { API_BASE_URL } from '../api';
import { useEffect, useState } from 'react';
import {
  Users,
  CalendarDays,
  DollarSign,
  HeartPulse,
  Activity,
  TrendingUp,
  RefreshCw,
  Clock,
  Handshake,
  Wallet,
  CreditCard
} from 'lucide-react';

const API = API_BASE_URL;

type CalendarEvent = {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  status?: string;
  location?: string;
};

type CategoryCount = {
  categoria: string;
  cantidad: number;
};

type CategoryAmount = {
  categoria: string;
  monto: number;
};

type DashboardStats = {
  success: boolean;
  pacientes: {
    total: number;
    genero: CategoryCount[];
    estado_civil: CategoryCount[];
    nacionalidad: CategoryCount[];
    provincia: CategoryCount[];
    canton: CategoryCount[];
    distrito: CategoryCount[];
    ocupacion: CategoryCount[];
    escolaridad: CategoryCount[];
  };
  atenciones: {
    total: number;
    grupo_etario: CategoryCount[];
    ubicacion_residencia: CategoryCount[];
    sede_atencion: CategoryCount[];
    tipo_servicio: CategoryCount[];
    tipo_condicion: CategoryCount[];
  };
  comercial: {
    total_clasificadas: number;
    categorias: CategoryCount[];
  };
  finanzas: {
    ingresos_totales: number;
    ingresos_consultas: number;
    ingresos_servicios: number;
    ingresos_medicamentos: number;
    por_forma_pago: CategoryAmount[];
    por_estado_pago: CategoryAmount[];
  };
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-CR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function formatTime(value: string) {
  if (value.includes('T')) {
    return new Date(value).toLocaleTimeString('es-CR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return 'Todo el día';
}

function isSameMonth(value: string) {
  const date = new Date(value);
  const now = new Date();

  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    maximumFractionDigits: 0
  }).format(value || 0);
}

function formatCount(value: number) {
  return (value || 0).toLocaleString('es-CR');
}

function CategoryList({
  title,
  items,
  valueLabel = 'Atenciones'
}: {
  title: string;
  items: CategoryCount[];
  valueLabel?: string;
}) {
  const total = items.reduce(
    (sum, item) => sum + (item.cantidad || 0),
    0
  );

  return (
    <div>
      <h4>{title}</h4>

      {items.length === 0 ? (
        <p style={{ color: '#94a3b8' }}>
          No hay datos disponibles.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          {items.map(item => {
            const percentage = total > 0
              ? Math.round((item.cantidad / total) * 100)
              : 0;

            return (
              <div key={item.categoria}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 5
                }}>
                  <span style={{ color: '#475569' }}>
                    {item.categoria}
                  </span>

                  <strong style={{ color: '#0f172a' }}>
                    {formatCount(item.cantidad)}
                    {' '}
                    <small style={{
                      color: '#64748b',
                      fontWeight: 400
                    }}>
                      {valueLabel}
                    </small>
                  </strong>
                </div>

                <div style={{
                  height: 7,
                  borderRadius: 99,
                  background: '#eaf0f6',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    borderRadius: 99,
                    background: '#5287d8'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AmountList({
  title,
  items
}: {
  title: string;
  items: CategoryAmount[];
}) {
  return (
    <div>
      <h4>{title}</h4>

      {items.length === 0 ? (
        <p style={{ color: '#94a3b8' }}>
          No hay datos disponibles.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          {items.map(item => (
            <div
              key={item.categoria}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                paddingBottom: 8,
                borderBottom: '1px solid #edf1f5'
              }}
            >
              <span style={{ color: '#475569' }}>
                {item.categoria}
              </span>

              <strong>{formatCurrency(item.monto)}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Inicio() {
  const [totalPatients, setTotalPatients] = useState(0);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDashboard() {
    setLoading(true);
    setError('');

    try {
      const [
        patientsResponse,
        calendarResponse,
        statsResponse
      ] = await Promise.all([
        fetch(`${API}/api/pacientes?limit=100&offset=0`),
        fetch(`${API}/api/calendar/events?max_results=100`),
        fetch(`${API}/api/dashboard/stats`)
      ]);

      if (!patientsResponse.ok) {
        throw new Error('No fue posible consultar los pacientes.');
      }

      if (!calendarResponse.ok) {
        throw new Error('No fue posible consultar Google Calendar.');
      }

      if (!statsResponse.ok) {
        throw new Error('No fue posible consultar las estadísticas.');
      }

      const [
        patientsData,
        calendarData,
        statsData
      ] = await Promise.all([
        patientsResponse.json(),
        calendarResponse.json(),
        statsResponse.json()
      ]);

      setTotalPatients(patientsData.total ?? 0);
      setEvents(calendarData.events ?? []);
      setStats(statsData);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al cargar el dashboard.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const monthlyAppointments = events.filter(event =>
    isSameMonth(event.start)
  ).length;

  const upcomingEvents = [...events]
    .sort(
      (a, b) =>
        new Date(a.start).getTime() -
        new Date(b.start).getTime()
    )
    .slice(0, 5);

  const ingresos = stats?.finanzas?.ingresos_totales ?? 0;
  const totalAtenciones = stats?.atenciones?.total ?? 0;

  const comercial = stats?.comercial?.categorias ?? [];

  const kpis = [
    {
      title: 'Pacientes registrados',
      value: formatCount(
        stats?.pacientes?.total ?? totalPatients
      ),
      icon: Users,
      color: 'blue',
      detail: 'Base RPT de pacientes'
    },
    {
      title: 'Citas este mes',
      value: formatCount(monthlyAppointments),
      icon: CalendarDays,
      color: 'purple',
      detail: 'Google Calendar'
    },
    {
      title: 'Ingresos registrados',
      value: formatCurrency(ingresos),
      icon: DollarSign,
      color: 'green',
      detail: 'Hoja Diaria · monto total'
    },
    {
      title: 'Atenciones registradas',
      value: formatCount(totalAtenciones),
      icon: HeartPulse,
      color: 'orange',
      detail: 'Hoja Diaria'
    }
  ];

  return (
    <div className="dashboard">

      {/* ENCABEZADO */}
      <div className="dashboard-heading">
        <div>
          <div className="eyebrow">
            <Activity size={16} />
            INTELIGENCIA CLÍNICA
          </div>

          <h2>Dashboard Ejecutivo</h2>

          <p>
            Resumen general del desempeño y actividad de la clínica.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboard}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #dbe3eb',
            background: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          <RefreshCw size={16} />
          {loading ? 'Actualizando…' : 'Actualizar'}
        </button>
      </div>

      {/* ESTADO */}
      <div className="demo-banner">
        <Activity size={16} />
        Estadísticas conectadas a RPT, Hoja Diaria y Google Calendar.
      </div>

      {error && (
        <div style={{
          padding: 16,
          marginBottom: 20,
          background: '#fef2f2',
          color: '#b91c1c',
          borderRadius: 8
        }}>
          {error}
        </div>
      )}

      {/* KPI PRINCIPALES */}
      <div className="kpi-grid">
        {kpis.map(kpi => {
          const Icon = kpi.icon;

          return (
            <article className="kpi-card" key={kpi.title}>
              <div className={`kpi-icon ${kpi.color}`}>
                <Icon size={21} />
              </div>

              <span className="kpi-title">{kpi.title}</span>

              <strong className="kpi-value">
                {loading ? '...' : kpi.value}
              </strong>

              <span className="kpi-detail">{kpi.detail}</span>
            </article>
          );
        })}
      </div>

      {/* MÓDULO 1: DEMOGRAFÍA, RESIDENCIA Y ATENCIÓN */}
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header">
          <div>
            <h3>1. Demografía, Residencia y Atención</h3>
            <p>
              Información proveniente exclusivamente del RPT de pacientes
              y la Hoja Diaria para atenciones.
            </p>
          </div>

          <div className="panel-icon">
            <Users size={18} />
          </div>
        </div>

        <div className="dashboard-grid">
          <article className="operation-card">
            <div className="operation-icon blue">
              <Users size={20} />
            </div>

            <div>
              <span>Pacientes registrados (RPT)</span>
              <strong>
                {loading
                  ? '...'
                  : formatCount(stats?.pacientes?.total ?? totalPatients)}
              </strong>
              <small>Registros de pacientes</small>
            </div>
          </article>

          <article className="operation-card">
            <div className="operation-icon purple">
              <HeartPulse size={20} />
            </div>

            <div>
              <span>Atenciones (Hoja Diaria)</span>
              <strong>
                {loading ? '...' : formatCount(totalAtenciones)}
              </strong>
              <small>Registros clínicos importados</small>
            </div>
          </article>
        </div>

        <div className="panel-divider" />

        <div className="dashboard-grid">
          <CategoryList
            title="Género (RPT)"
            items={stats?.pacientes?.genero ?? []}
            valueLabel="pacientes"
          />

          <CategoryList
            title="Nacionalidad (RPT)"
            items={stats?.pacientes?.nacionalidad ?? []}
            valueLabel="pacientes"
          />

          <CategoryList
            title="Estado civil (RPT)"
            items={stats?.pacientes?.estado_civil ?? []}
            valueLabel="pacientes"
          />
        </div>

        <div className="panel-divider" />

        <div className="dashboard-grid">
          <CategoryList
            title="Provincia (RPT)"
            items={stats?.pacientes?.provincia ?? []}
            valueLabel="pacientes"
          />

          <CategoryList
            title="Cantón (RPT)"
            items={stats?.pacientes?.canton ?? []}
            valueLabel="pacientes"
          />

          <CategoryList
            title="Distrito (RPT)"
            items={stats?.pacientes?.distrito ?? []}
            valueLabel="pacientes"
          />
        </div>

        <div className="panel-divider" />

        <div className="dashboard-grid">
          <CategoryList
            title="Grupo etario (Hoja Diaria)"
            items={stats?.atenciones?.grupo_etario ?? []}
          />

          <CategoryList
            title="Residencia (Hoja Diaria)"
            items={stats?.atenciones?.ubicacion_residencia ?? []}
          />

          <CategoryList
            title="Sede de atención"
            items={stats?.atenciones?.sede_atencion ?? []}
          />
        </div>

        <div className="panel-divider" />

        <div className="dashboard-grid">
          <CategoryList
            title="Condición"
            items={stats?.atenciones?.tipo_condicion ?? []}
          />

          <CategoryList
            title="Tipo de servicio"
            items={stats?.atenciones?.tipo_servicio ?? []}
          />
        </div>
      </div>

      {/* PRÓXIMAS CITAS: GOOGLE CALENDAR */}
      <article className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header">
          <div>
            <h3>Próximas citas</h3>
            <p>Eventos reales de Google Calendar</p>
          </div>

          <div className="panel-icon">
            <Clock size={18} />
          </div>
        </div>

        {loading ? (
          <p style={{ padding: 24 }}>Cargando citas...</p>
        ) : upcomingEvents.length === 0 ? (
          <p style={{ padding: 24 }}>
            No hay citas próximas registradas.
          </p>
        ) : (
          upcomingEvents.map(event => (
            <div
              key={event.id}
              style={{
                padding: '18px 20px',
                borderTop: '1px solid #e5eaf0'
              }}
            >
              <strong>{event.summary}</strong>

              <p style={{
                color: '#64748b',
                margin: '6px 0'
              }}>
                {formatDate(event.start)} · {formatTime(event.start)}
                {event.end.includes('T')
                  ? ` - ${formatTime(event.end)}`
                  : ''}
              </p>

              {event.location && (
                <small style={{ color: '#64748b' }}>
                  {event.location}
                </small>
              )}
            </div>
          ))
        )}
      </article>

      {/* MÓDULO 2: COMERCIAL */}
      <article className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header">
          <div>
            <h3>2. Comercial y Captación</h3>
            <p>
              Clasificación dinámica basada exclusivamente en la columna L
              de Hoja Diaria.
            </p>
          </div>

          <div className="panel-icon">
            <Handshake size={18} />
          </div>
        </div>

        <div className="dashboard-grid">
          <article className="operation-card">
            <div className="operation-icon blue">
              <TrendingUp size={20} />
            </div>

            <div>
              <span>Atenciones clasificadas comercialmente</span>
              <strong>
                {loading
                  ? '...'
                  : formatCount(stats?.comercial?.total_clasificadas ?? 0)}
              </strong>
              <small>Valores registrados en columna L</small>
            </div>
          </article>
        </div>

        <div className="panel-divider" />

        <CategoryList
          title="Categorías comerciales (columna L)"
          items={comercial}
        />
      </article>

      {/* MÓDULO 3: FINANZAS */}
      <article className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header">
          <div>
            <h3>3. Finanzas</h3>
            <p>
              Ingresos calculados exclusivamente desde los montos de Hoja Diaria.
            </p>
          </div>

          <div className="panel-icon">
            <Wallet size={18} />
          </div>
        </div>

        <div className="operational-grid">
          <div className="operation-card">
            <div className="operation-icon green">
              <DollarSign size={20} />
            </div>

            <div>
              <span>Ingresos totales registrados</span>
              <strong>
                {loading ? '...' : formatCurrency(ingresos)}
              </strong>
              <small>Suma del monto total por atención</small>
            </div>
          </div>

          <div className="operation-card">
            <div className="operation-icon blue">
              <CreditCard size={20} />
            </div>

            <div>
              <span>Formas de pago</span>
              <strong>
                {loading
                  ? '...'
                  : formatCount(stats?.finanzas?.por_forma_pago?.length ?? 0)}
              </strong>
              <small>Métodos registrados en Hoja Diaria</small>
            </div>
          </div>

          <div className="operation-card">
            <div className="operation-icon orange">
              <Activity size={20} />
            </div>

            <div>
              <span>Estados de pago</span>
              <strong>
                {loading
                  ? '...'
                  : formatCount(stats?.finanzas?.por_estado_pago?.length ?? 0)}
              </strong>
              <small>Estados presentes en Hoja Diaria</small>
            </div>
          </div>
        </div>

        <div className="panel-divider" />

        <div className="dashboard-grid">
          <AmountList
            title="Ingresos por forma de pago"
            items={stats?.finanzas?.por_forma_pago ?? []}
          />

          <AmountList
            title="Ingresos por estado de pago"
            items={stats?.finanzas?.por_estado_pago ?? []}
          />
        </div>
      </article>
    </div>
  );
}
