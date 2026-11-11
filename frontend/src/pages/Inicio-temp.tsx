
import { API_BASE_URL } from '../api';
import { useEffect, useState } from 'react';
import type { ElementType, ChangeEvent } from 'react';
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
  CreditCard,
  MapPin,
  ChevronRight,
  CircleDollarSign,
  CalendarCheck,
  UserRound,
  Building2,
  CheckCircle2,
  Sparkles,
  Stethoscope
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
  opciones?: Record<string, CategoryCount[]>;
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
    month: 'short',
    year: 'numeric'
  });
}

function formatLongDate() {
  return new Date().toLocaleDateString('es-CR', {
    weekday: 'long',
    day: 'numeric',
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

function getPercentage(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function MultiSelectFilter({
  label,
  options,
  selected,
  onChange
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = options.filter(option =>
    option.toLowerCase().includes(search.toLowerCase())
  );

  function toggleOption(option: string) {
    onChange(
      selected.includes(option)
        ? selected.filter(value => value !== option)
        : [...selected, option]
    );
  }

  return (
    <div style={{ position: 'relative', minWidth: 0 }}>
      <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6 }}>
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        style={{
          width: '100%', minHeight: 42, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 8, padding: '9px 11px',
          border: `1px solid ${open ? '#477ce0' : '#d5deea'}`, borderRadius: 9,
          background: '#fff', color: '#334155', cursor: 'pointer', textAlign: 'left',
          boxShadow: open ? '0 0 0 3px rgba(71,124,224,.10)' : 'none'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
          {selected.length ? `${selected.length} seleccionado${selected.length !== 1 ? 's' : ''}` : 'Todos'}
        </span>
        <span style={{ color: '#64748b', fontSize: 11 }}>{open ? '▲' : '▼'}</span>
      </button>

      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
          {selected.slice(0, 3).map(value => (
            <span key={value} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: '#eaf2ff', color: '#2456a6', borderRadius: 6,
              padding: '4px 6px', fontSize: 10, maxWidth: '100%'
            }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
              <button type="button" aria-label={`Quitar ${value}`} onClick={() => toggleOption(value)}
                style={{ border: 0, background: 'transparent', color: '#2456a6', padding: 0, cursor: 'pointer', fontWeight: 700 }}>×</button>
            </span>
          ))}
          {selected.length > 3 && <span style={{ fontSize: 10, color: '#64748b', alignSelf: 'center' }}>+{selected.length - 3}</span>}
        </div>
      )}

      {open && (
        <div style={{
          position: 'absolute', zIndex: 30, top: '100%', left: 0, right: 0,
          marginTop: 5, background: '#fff', border: '1px solid #dbe3ef',
          borderRadius: 10, boxShadow: '0 12px 28px rgba(15,23,42,.14)', padding: 8
        }}>
          <input value={search} onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.currentTarget.value)}
            placeholder="Buscar opción..." aria-label={`Buscar ${label}`}
            style={{ width: '100%', boxSizing: 'border-box', padding: '8px 9px',
              border: '1px solid #e2e8f0', borderRadius: 7, outlineColor: '#477ce0',
              fontSize: 12, marginBottom: 6 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 3px 7px' }}>
            <button type="button" onClick={() => onChange(options)}
              style={{ border: 0, background: 'transparent', color: '#477ce0', fontSize: 11, cursor: 'pointer' }}>Seleccionar todos</button>
            <button type="button" onClick={() => onChange([])}
              style={{ border: 0, background: 'transparent', color: '#64748b', fontSize: 11, cursor: 'pointer' }}>Limpiar</button>
          </div>
          <div style={{ maxHeight: 190, overflowY: 'auto' }}>
            {filtered.map(option => (
              <label key={option} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '7px 5px',
                borderRadius: 6, cursor: 'pointer', color: '#334155', fontSize: 12
              }}>
                <input type="checkbox" checked={selected.includes(option)}
                  onChange={() => toggleOption(option)} />
                <span>{option}</span>
              </label>
            ))}
            {filtered.length === 0 && <div style={{ padding: 10, color: '#94a3b8', fontSize: 12 }}>Sin coincidencias</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeading({
  number,
  title,
  description,
  icon: Icon
}: {
  number: string;
  title: string;
  description: string;
  icon: ElementType;
}) {
  return (
    <div className="vi-home-section-heading">
      <div className="vi-home-section-number">{number}</div>

      <div className="vi-home-section-copy">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <div className="vi-home-section-icon">
        <Icon size={20} />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  detail,
  icon: Icon,
  accent,
  loading
}: {
  title: string;
  value: string;
  detail: string;
  icon: ElementType;
  accent: string;
  loading: boolean;
}) {
  return (
    <article className={`vi-home-stat vi-accent-${accent}`}>
      <div className="vi-home-stat-top">
        <div className="vi-home-stat-icon">
          <Icon size={21} strokeWidth={2} />
        </div>
        <span className="vi-home-stat-label">{title}</span>
      </div>

      <strong className="vi-home-stat-value">
        {loading ? '...' : value}
      </strong>

      <div className="vi-home-stat-bottom">
        <span className="vi-home-stat-detail">{detail}</span>
        <div className="vi-home-stat-dot" />
      </div>
    </article>
  );
}

function DistributionList({
  title,
  items,
  valueLabel = 'registros',
  limit = 5,
  accent = 'blue'
}: {
  title: string;
  items: CategoryCount[];
  valueLabel?: string;
  limit?: number;
  accent?: string;
}) {
  const total = items.reduce(
    (sum, item) => sum + (item.cantidad || 0),
    0
  );

  const visibleItems = [...items]
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, limit);

  return (
    <div className="vi-home-distribution">
      <div className="vi-home-distribution-heading">
        <h4>{title}</h4>
        <span>{formatCount(total)}</span>
      </div>

      {visibleItems.length === 0 ? (
        <div className="vi-home-empty">
          No hay datos disponibles.
        </div>
      ) : (
        <div className="vi-home-distribution-list">
          {visibleItems.map((item, index) => {
            const percentage = getPercentage(item.cantidad, total);

            return (
              <div className="vi-home-distribution-item" key={item.categoria}>
                <div className="vi-home-distribution-line">
                  <div className="vi-home-distribution-name">
                    <span className="vi-home-distribution-rank">
                      {index + 1}
                    </span>
                    <span title={item.categoria}>
                      {item.categoria}
                    </span>
                  </div>

                  <div className="vi-home-distribution-value">
                    <strong>{formatCount(item.cantidad)}</strong>
                    <small>{percentage}%</small>
                  </div>
                </div>

                <div className="vi-home-progress">
                  <div
                    className={`vi-home-progress-fill vi-progress-${accent}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="vi-home-distribution-footer">
        <span>{valueLabel}</span>
        <span>{items.length} categorías</span>
      </div>
    </div>
  );
}

function AmountList({
  title,
  items,
  accent = 'blue'
}: {
  title: string;
  items: CategoryAmount[];
  accent?: string;
}) {
  const total = items.reduce(
    (sum, item) => sum + (item.monto || 0),
    0
  );

  return (
    <div className="vi-home-amount-card">
      <div className="vi-home-amount-heading">
        <h4>{title}</h4>
        <span>{items.length} métodos</span>
      </div>

      {items.length === 0 ? (
        <div className="vi-home-empty">
          No hay datos disponibles.
        </div>
      ) : (
        <div className="vi-home-amount-list">
          {[...items]
            .sort((a, b) => b.monto - a.monto)
            .map(item => {
              const percentage = getPercentage(item.monto, total);

              return (
                <div className="vi-home-amount-item" key={item.categoria}>
                  <div className="vi-home-amount-row">
                    <div>
                      <span className="vi-home-amount-category">
                        {item.categoria}
                      </span>
                      <small>{percentage}% del total</small>
                    </div>

                    <strong>{formatCurrency(item.monto)}</strong>
                  </div>

                  <div className="vi-home-progress">
                    <div
                      className={`vi-home-progress-fill vi-progress-${accent}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      )}

      <div className="vi-home-amount-total">
        <span>Total</span>
        <strong>{formatCurrency(total)}</strong>
      </div>
    </div>
  );
}

function AppointmentCard({
  event,
  index
}: {
  event: CalendarEvent;
  index: number;
}) {
  return (
    <article className="vi-home-appointment">
      <div className="vi-home-appointment-date">
        <span>{formatDate(event.start).split(' ')[0]}</span>
        <strong>
          {new Date(event.start).toLocaleDateString('es-CR', {
            day: '2-digit'
          })}
        </strong>
      </div>

      <div className="vi-home-appointment-content">
        <div className="vi-home-appointment-title">
          <strong>{event.summary || 'Cita sin título'}</strong>
          <span className={`vi-home-appointment-status ${event.status || 'confirmed'}`}>
            {event.status === 'cancelled'
              ? 'Cancelada'
              : event.status === 'tentative'
                ? 'Pendiente'
                : 'Programada'}
          </span>
        </div>

        <div className="vi-home-appointment-meta">
          <span>
            <Clock size={13} />
            {formatTime(event.start)}
            {event.end.includes('T')
              ? ` – ${formatTime(event.end)}`
              : ''}
          </span>

          {event.location && (
            <span>
              <MapPin size={13} />
              {event.location}
            </span>
          )}
        </div>
      </div>

      <div className="vi-home-appointment-index">
        {String(index + 1).padStart(2, '0')}
      </div>
    </article>
  );
}

function DashboardStyles() {
  return (
    <style>{`
      .vi-home {
        --vi-ink: #15243a;
        --vi-muted: #718096;
        --vi-border: #e8edf4;
        --vi-surface: #ffffff;
        --vi-background: #f6f8fc;
        --vi-blue: #477ce0;
        --vi-purple: #8764db;
        --vi-green: #20a47b;
        --vi-orange: #e99a45;
        color: var(--vi-ink);
        padding-bottom: 32px;
      }

      .vi-home * {
        box-sizing: border-box;
      }

      .vi-home-heading {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 24px;
        margin-bottom: 26px;
      }

      .vi-home-eyebrow {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #477ce0;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 1.5px;
        margin-bottom: 12px;
      }

      .vi-home-title {
        font-size: clamp(26px, 3vw, 34px);
        font-weight: 800;
        letter-spacing: -1.2px;
        line-height: 1.15;
        margin: 0;
        color: #15243a;
      }

      .vi-home-heading-actions {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 12px;
      }

      .vi-home-current-date {
        display: flex;
        align-items: center;
        gap: 7px;
        color: #718096;
        font-size: 12px;
        text-transform: capitalize;
      }

      .vi-home-refresh {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 15px;
        border: 1px solid #dce5f0;
        background: white;
        color: #34445b;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 650;
        cursor: pointer;
        transition: all .2s ease;
      }

      .vi-home-refresh:hover:not(:disabled) {
        border-color: #477ce0;
        color: #477ce0;
        box-shadow: 0 4px 12px rgba(71,124,224,.10);
      }

      .vi-home-refresh:disabled {
        opacity: .65;
        cursor: not-allowed;
      }

      .vi-home-refresh-icon {
        animation: vi-home-spin 1.2s linear infinite;
      }

      @keyframes vi-home-spin {
        to { transform: rotate(360deg); }
      }

      .vi-home-status {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 13px 16px;
        border: 1px solid #dce9fa;
        background: linear-gradient(100deg, #f0f6ff, #f8fbff);
        border-radius: 12px;
        color: #45658f;
        font-size: 12px;
        margin-bottom: 24px;
        position: relative;
margin-top: 16px;
width: 100%;
      }

      .vi-home-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #20a47b;
        box-shadow: 0 0 0 4px rgba(32,164,123,.12);
        flex-shrink: 0;
      }

      .vi-home-error {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 14px 16px;
        margin-bottom: 22px;
        border-radius: 12px;
        background: #fff1f2;
        border: 1px solid #fecdd3;
        color: #be123c;
        font-size: 13px;
      }

      .vi-home-kpis {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
        margin-bottom: 28px;
      }

      .vi-home-stat {
        position: relative;
        overflow: hidden;
        padding: 20px;
        border: 1px solid #e8edf4;
        border-radius: 16px;
        background: #fff;
        box-shadow: 0 4px 15px rgba(23,42,77,.025);
        transition: transform .2s ease, box-shadow .2s ease;
      }

      .vi-home-stat:hover {
        transform: translateY(-2px);
        box-shadow: 0 9px 25px rgba(23,42,77,.06);
      }

      .vi-home-stat::after {
        content: '';
        position: absolute;
        width: 80px;
        height: 80px;
        border-radius: 50%;
        right: -35px;
        top: -35px;
        background: var(--stat-color);
        opacity: .055;
      }

      .vi-accent-blue { --stat-color: #477ce0; }
      .vi-accent-purple { --stat-color: #8764db; }
      .vi-accent-green { --stat-color: #20a47b; }
      .vi-accent-orange { --stat-color: #e99a45; }

      .vi-home-stat-top {
        display: flex;
        align-items: center;
        gap: 11px;
        margin-bottom: 19px;
      }

      .vi-home-stat-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        border-radius: 12px;
        color: var(--stat-color);
        background: color-mix(in srgb, var(--stat-color) 11%, white);
        flex-shrink: 0;
      }

      .vi-home-stat-label {
        color: #718096;
        font-size: 12px;
        font-weight: 600;
        line-height: 1.4;
      }

      .vi-home-stat-value {
        display: block;
        font-size: clamp(22px, 2vw, 29px);
        font-weight: 800;
        color: #15243a;
        letter-spacing: -1px;
        line-height: 1.2;
        overflow-wrap: anywhere;
      }

      .vi-home-stat-bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-top: 15px;
      }

      .vi-home-stat-detail {
        color: #94a3b8;
        font-size: 11px;
      }

      .vi-home-stat-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--stat-color);
      }

      .vi-home-panel {
        background: white;
        border: 1px solid #e8edf4;
        border-radius: 17px;
        padding: 24px;
        margin-bottom: 24px;
        box-shadow: 0 4px 15px rgba(23,42,77,.025);
      }

      .vi-home-section-heading {
        display: flex;
        align-items: center;
        gap: 13px;
        margin-bottom: 22px;
      }

      .vi-home-section-number {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: #eef4ff;
        color: #477ce0;
        font-size: 12px;
        font-weight: 800;
        flex-shrink: 0;
      }

      .vi-home-section-copy {
        flex: 1;
        min-width: 0;
      }

      .vi-home-section-copy h3 {
        margin: 0;
        font-size: 17px;
        font-weight: 750;
        color: #15243a;
        letter-spacing: -.3px;
      }

      .vi-home-section-copy p {
        margin: 6px 0 0;
        color: #8390a3;
        font-size: 12px;
        line-height: 1.5;
      }

      .vi-home-section-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background: #f5f7fb;
        color: #64748b;
        border-radius: 12px;
        flex-shrink: 0;
      }

      .vi-home-overview-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .vi-home-overview {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 18px;
        background: #f8faff;
        border: 1px solid #edf2fa;
        border-radius: 13px;
      }

      .vi-home-overview-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 46px;
        height: 46px;
        border-radius: 13px;
        flex-shrink: 0;
      }

      .vi-home-overview-icon.blue {
        background: #e9f1ff;
        color: #477ce0;
      }

      .vi-home-overview-icon.purple {
        background: #f0eaff;
        color: #8764db;
      }

      .vi-home-overview-copy {
        min-width: 0;
      }

      .vi-home-overview-copy span {
        display: block;
        color: #718096;
        font-size: 12px;
        margin-bottom: 6px;
      }

      .vi-home-overview-copy strong {
        display: block;
        color: #15243a;
        font-size: 25px;
        font-weight: 800;
        letter-spacing: -.8px;
      }

      .vi-home-overview-copy small {
        display: block;
        color: #94a3b8;
        font-size: 11px;
        margin-top: 5px;
      }

      .vi-home-divider {
        height: 1px;
        background: #edf1f6;
        margin: 25px 0;
      }

      .vi-home-distribution-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 25px;
      }

      .vi-home-distribution-heading,
      .vi-home-amount-heading {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 18px;
      }

      .vi-home-distribution-heading h4,
      .vi-home-amount-heading h4 {
        margin: 0;
        color: #34445b;
        font-size: 13px;
        font-weight: 750;
      }

      .vi-home-distribution-heading > span {
        padding: 4px 8px;
        border-radius: 7px;
        background: #f2f5fa;
        color: #64748b;
        font-size: 11px;
        font-weight: 700;
      }

      .vi-home-distribution-list {
        display: grid;
        gap: 15px;
      }

      .vi-home-distribution-line {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 7px;
      }

      .vi-home-distribution-name {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        color: #526176;
        font-size: 12px;
      }

      .vi-home-distribution-name > span:last-child {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .vi-home-distribution-rank {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 19px;
        height: 19px;
        background: #f3f6fb;
        border-radius: 6px;
        color: #8a98aa;
        font-size: 10px;
        font-weight: 700;
        flex-shrink: 0;
      }

      .vi-home-distribution-value {
        display: flex;
        align-items: center;
        gap: 7px;
        flex-shrink: 0;
      }

      .vi-home-distribution-value strong {
        color: #34445b;
        font-size: 12px;
      }

      .vi-home-distribution-value small {
        color: #94a3b8;
        font-size: 10px;
      }

      .vi-home-progress {
        height: 6px;
        background: #edf2f8;
        border-radius: 99px;
        overflow: hidden;
      }

      .vi-home-progress-fill {
        height: 100%;
        border-radius: 99px;
        transition: width .4s ease;
      }

      .vi-progress-blue { background: #477ce0; }
      .vi-progress-purple { background: #8764db; }
      .vi-progress-green { background: #20a47b; }
      .vi-progress-orange { background: #e99a45; }

      .vi-home-distribution-footer {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        margin-top: 18px;
        padding-top: 12px;
        border-top: 1px solid #edf1f6;
        color: #94a3b8;
        font-size: 10px;
      }

      .vi-home-empty {
        padding: 15px;
        text-align: center;
        background: #f8faff;
        border-radius: 10px;
        color: #94a3b8;
        font-size: 12px;
      }

      .vi-home-agenda-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 18px;
      }

      .vi-home-agenda-count {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 7px 10px;
        background: #eef4ff;
        border-radius: 8px;
        color: #477ce0;
        font-size: 11px;
        font-weight: 700;
      }

      .vi-home-appointments {
        display: grid;
        gap: 10px;
      }

      .vi-home-appointment {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 15px;
        border: 1px solid #edf1f6;
        border-radius: 12px;
        transition: background .2s ease, border-color .2s ease;
      }

      .vi-home-appointment:hover {
        background: #fafcff;
        border-color: #dbe7fa;
      }

      .vi-home-appointment-date {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 49px;
        height: 53px;
        border-radius: 11px;
        background: #eef4ff;
        color: #477ce0;
        flex-shrink: 0;
      }

      .vi-home-appointment-date span {
        font-size: 9px;
        text-transform: uppercase;
        font-weight: 700;
      }

      .vi-home-appointment-date strong {
        font-size: 21px;
        line-height: 1.2;
        font-weight: 800;
      }

      .vi-home-appointment-content {
        flex: 1;
        min-width: 0;
      }

      .vi-home-appointment-title {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 8px;
      }

      .vi-home-appointment-title > strong {
        color: #34445b;
        font-size: 13px;
        font-weight: 750;
        overflow-wrap: anywhere;
      }

      .vi-home-appointment-status {
        display: inline-flex;
        align-items: center;
        padding: 4px 7px;
        border-radius: 6px;
        background: #e9f8f1;
        color: #17865e;
        font-size: 10px;
        font-weight: 700;
      }

      .vi-home-appointment-status.cancelled {
        background: #fff0f0;
        color: #c24141;
      }

      .vi-home-appointment-status.tentative {
        background: #fff7e8;
        color: #b7791f;
      }

      .vi-home-appointment-meta {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        color: #8794a7;
        font-size: 11px;
      }

      .vi-home-appointment-meta span {
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }

      .vi-home-appointment-index {
        color: #c5ceda;
        font-size: 11px;
        font-weight: 800;
      }

      .vi-home-commercial-highlight {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 18px;
        background: linear-gradient(110deg, #f1f6ff, #fafcff);
        border: 1px solid #e5edfb;
        border-radius: 13px;
        margin-bottom: 24px;
      }

      .vi-home-commercial-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 49px;
        height: 49px;
        background: #e3edff;
        color: #477ce0;
        border-radius: 14px;
        flex-shrink: 0;
      }

      .vi-home-commercial-copy span {
        display: block;
        color: #718096;
        font-size: 12px;
        margin-bottom: 5px;
      }

      .vi-home-commercial-copy strong {
        display: block;
        color: #15243a;
        font-size: 27px;
        font-weight: 800;
        letter-spacing: -.7px;
      }

      .vi-home-commercial-copy small {
        display: block;
        margin-top: 5px;
        color: #94a3b8;
        font-size: 11px;
      }

      .vi-home-financial-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
        margin-bottom: 25px;
      }

      .vi-home-financial-card {
        padding: 17px;
        border: 1px solid #edf1f6;
        border-radius: 13px;
        background: #fbfcfe;
      }

      .vi-home-financial-card-top {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
      }

      .vi-home-financial-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        flex-shrink: 0;
      }

      .vi-home-financial-icon.green {
        background: #e8f8f1;
        color: #20a47b;
      }

      .vi-home-financial-icon.blue {
        background: #eaf1ff;
        color: #477ce0;
      }

      .vi-home-financial-icon.orange {
        background: #fff4e8;
        color: #e99a45;
      }

      .vi-home-financial-card span {
        color: #718096;
        font-size: 11px;
        line-height: 1.4;
      }

      .vi-home-financial-card strong {
        display: block;
        color: #15243a;
        font-size: 23px;
        font-weight: 800;
        letter-spacing: -.7px;
        overflow-wrap: anywhere;
      }

      .vi-home-financial-card small {
        display: block;
        color: #94a3b8;
        font-size: 10px;
        margin-top: 6px;
      }

      .vi-home-financial-lists {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 25px;
      }

      .vi-home-amount-heading > span {
        color: #94a3b8;
        font-size: 10px;
      }

      .vi-home-amount-list {
        display: grid;
        gap: 15px;
      }

      .vi-home-amount-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        margin-bottom: 7px;
      }

      .vi-home-amount-row > div {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .vi-home-amount-category {
        color: #526176;
        font-size: 12px;
      }

      .vi-home-amount-row small {
        color: #94a3b8;
        font-size: 10px;
      }

      .vi-home-amount-row strong {
        color: #34445b;
        font-size: 12px;
        flex-shrink: 0;
      }

      .vi-home-amount-total {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        border-top: 1px solid #edf1f6;
        padding-top: 15px;
        margin-top: 18px;
      }

      .vi-home-amount-total span {
        color: #718096;
        font-size: 12px;
        font-weight: 650;
      }

      .vi-home-amount-total strong {
        color: #15243a;
        font-size: 16px;
        font-weight: 800;
      }

      .vi-home-footer {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: #a0adbd;
        font-size: 11px;
        padding: 12px 0 4px;
      }

      @media (max-width: 1100px) {
        .vi-home-kpis {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .vi-home-distribution-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 760px) {
        .vi-home-heading {
    position: relative;
    top: auto;
    z-index: auto;
    flex-direction: column;
    align-items: stretch;
    padding: 0;
    margin-bottom: 26px;
    background: transparent;
    border-bottom: none;
        }

        .vi-home-heading-actions {
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
        }

        .vi-home-panel {
          padding: 17px;
          border-radius: 14px;
        }

        .vi-home-distribution-grid {
          grid-template-columns: 1fr;
          gap: 24px;
        }

        .vi-home-overview-grid {
          grid-template-columns: 1fr;
        }

        .vi-home-financial-grid {
          grid-template-columns: 1fr;
        }

        .vi-home-financial-lists {
          grid-template-columns: 1fr;
          gap: 25px;
        }

        .vi-home-section-copy h3 {
          font-size: 15px;
        }

        .vi-home-section-copy p {
          font-size: 11px;
        }
      }

      @media (max-width: 480px) {
        .vi-home-kpis {
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .vi-home-stat {
          padding: 17px;
        }

        .vi-home-stat-top {
          margin-bottom: 12px;
        }

        .vi-home-stat-value {
          font-size: 26px;
        }

        .vi-home-heading-actions {
          align-items: flex-start;
          flex-direction: column;
          width: 100%;
  gap: 14px;
  position: relative;
  z-index: 1;
        }

        .vi-home-appointment {
          padding: 12px;
          gap: 10px;
        }

        .vi-home-appointment-date {
          width: 43px;
          height: 48px;
        }

        .vi-home-appointment-index {
          display: none;
        }

        .vi-home-appointment-title > strong {
          font-size: 12px;
        }

        .vi-home-appointment-meta {
          gap: 8px;
        }
      }
    `}</style>
  );
}

export default function Inicio() {
  const [totalPatients, setTotalPatients] = useState(0);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string[]>>({
    genero: [], nacionalidad: [], estado_civil: [], provincia: [], canton: [], distrito: [],
    grupo_etario: [], residencia: [], sede_atencion: [], condicion: [], tipo_servicio: []
  });

  async function loadDashboard() {
    setLoading(true);
    setError('');

    try {
      
const params = new URLSearchParams();
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);
      Object.entries(filters).forEach(([key, values]) => {
        if (values.length) params.set(key, values.join(','));
      });
      const statsUrl = `${API}/api/dashboard/stats${params.toString() ? `?${params.toString()}` : ''}`;

const [
  patientsResponse,
  calendarResponse,
  statsResponse
] = await Promise.all([
  fetch(`${API}/api/pacientes?limit=100&offset=0`, {
    credentials: 'include'
  }),
  fetch(`${API}/api/calendar/events?max_results=100`, {
    credentials: 'include'
  }),
  fetch(statsUrl, {
    credentials: 'include'
  })
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
  }, [startDate, endDate, filters]);

  const monthlyAppointments = events.filter(event =>
    isSameMonth(event.start)
  ).length;

  const upcomingEvents = [...events]
    .filter(event => event.status !== 'cancelled')
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
      value: formatCount(stats?.pacientes?.total ?? totalPatients),
      icon: Users,
      accent: 'blue',
      detail: 'Base RPT de pacientes'
    },
    {
      title: 'Citas este mes',
      value: formatCount(monthlyAppointments),
      icon: CalendarDays,
      accent: 'purple',
      detail: 'Google Calendar'
    },
    {
      title: 'Ingresos registrados',
      value: formatCurrency(ingresos),
      icon: DollarSign,
      accent: 'green',
      detail: 'Hoja Diaria · monto total'
    },
    {
      title: 'Atenciones registradas',
      value: formatCount(totalAtenciones),
      icon: HeartPulse,
      accent: 'orange',
      detail: 'Hoja Diaria'
    }
  ];

  return (
    <div className="vi-home">
      <DashboardStyles />

      {/* ENCABEZADO */}
      <header className="vi-home-heading">
        <div>
          <div className="vi-home-eyebrow">
            <Activity size={15} />
            VITALIQ · INTELIGENCIA CLÍNICA
          </div>

          <h1 className="vi-home-title">Dashboard Ejecutivo</h1>

        </div>

        <div className="vi-home-heading-actions">
          <div className="vi-home-current-date">
            <CalendarDays size={14} />
            {formatLongDate()}
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="vi-home-refresh"
          >
            <RefreshCw
              size={15}
              className={loading ? 'vi-home-refresh-icon' : ''}
            />
            {loading ? 'Actualizando...' : 'Actualizar datos'}
          </button>
        </div>
      </header>

      {/* FILTROS DE ANÁLISIS */}
      <section className="vi-home-panel" style={{ padding: '16px 20px' }}>
        <button type="button" onClick={() => setFiltersOpen(!filtersOpen)}
          aria-expanded={filtersOpen}
          style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', background:'transparent', border:0, cursor:'pointer', color:'inherit', padding:0 }}>
          <span style={{display:'flex',alignItems:'center',gap:10,fontWeight:700}}>
            <Activity size={18}/> Filtros de análisis
            {(Object.values(filters).flat().length > 0 || startDate || endDate) &&
              <span style={{fontSize:11,padding:'3px 8px',borderRadius:20,background:'#dbeafe',color:'#1d4ed8'}}>
                {Object.values(filters).flat().length + (startDate || endDate ? 1 : 0)} activos
              </span>}
          </span>
          <span style={{fontSize:13,color:'#64748b'}}>{filtersOpen ? 'Ocultar ▲' : 'Mostrar filtros ▼'}</span>
        </button>
        {filtersOpen && <div style={{marginTop:16}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}>
            <label style={{fontSize:12,color:'#64748b'}}>Desde<input type="date" value={startDate} onChange={(e: ChangeEvent<HTMLInputElement>)=>setStartDate(e.currentTarget.value)} style={{display:'block',width:'100%',marginTop:6,padding:9,border:'1px solid #d1d5db',borderRadius:8}}/></label>
            <label style={{fontSize:12,color:'#64748b'}}>Hasta<input type="date" value={endDate} onChange={(e: ChangeEvent<HTMLInputElement>)=>setEndDate(e.currentTarget.value)} style={{display:'block',width:'100%',marginTop:6,padding:9,border:'1px solid #d1d5db',borderRadius:8}}/></label>
          </div>
          {[
            ['Demografía',[['genero','Género'],['nacionalidad','Nacionalidad'],['estado_civil','Estado civil'],['grupo_etario','Grupo etario']]],
            ['Ubicación',[['provincia','Provincia'],['canton','Cantón'],['distrito','Distrito'],['residencia','Residencia']]],
            ['Atención',[['sede_atencion','Sede de atención'],['condicion','Condición'],['tipo_servicio','Tipo de servicio']]]
          ].map(([group,items]:any)=><div key={group} style={{marginTop:15}}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:8,color:'#475569'}}>{group}</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:14}}>
              {items.map(([key,label]:[string,string])=>{
                const source: CategoryCount[] = stats?.opciones?.[key] ?? [];
                const options = Array.from(new Set(source.map((item: CategoryCount) => item.categoria)));
                return <MultiSelectFilter key={key} label={label} options={options}
                  selected={filters[key]} onChange={selected=>setFilters(prev=>({...prev,[key]:selected}))} />;
              })}
            </div>
          </div>)}
          <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:15}}>
            <button type="button" onClick={()=>{setStartDate('');setEndDate('');setFilters({genero:[],nacionalidad:[],estado_civil:[],provincia:[],canton:[],distrito:[],grupo_etario:[],residencia:[],sede_atencion:[],condicion:[],tipo_servicio:[]});}}
              style={{padding:'9px 13px',border:'1px solid #cbd5e1',borderRadius:8,background:'white',cursor:'pointer'}}>Limpiar todo</button>
          </div>
          <small style={{display:'block',marginTop:8,color:'#64748b'}}>Selección múltiple: usa ⌘ en Mac o Ctrl en Windows. Las cifras se actualizan conservando todos los criterios.</small>
        </div>}
      </section>

      {/* ESTADO DE CONEXIÓN */}
      <div className="vi-home-status">
        <span className="vi-home-status-dot" />
        <span>
          Datos integrados desde RPT, Hoja Diaria y Google Calendar.
        </span>
        <span style={{ marginLeft: 'auto', opacity: .7 }}>
          {loading ? 'Sincronizando' : 'Dashboard conectado'}
        </span>
      </div>

      {error && (
        <div className="vi-home-error">
          <Activity size={17} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI PRINCIPALES */}
      <div className="vi-home-kpis">
        {kpis.map(kpi => (
          <StatCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            detail={kpi.detail}
            icon={kpi.icon}
            accent={kpi.accent}
            loading={loading}
          />
        ))}
      </div>

      {/* MÓDULO 1: DEMOGRAFÍA Y ATENCIÓN */}
      <section className="vi-home-panel">
        <SectionHeading
          number="01"
          title="Demografía, residencia y atención"
          description="Perfil de pacientes y comportamiento de la actividad clínica."
          icon={Users}
        />

        <div className="vi-home-overview-grid">
          <article className="vi-home-overview">
            <div className="vi-home-overview-icon blue">
              <UserRound size={21} />
            </div>
            <div className="vi-home-overview-copy">
              <span>Pacientes registrados · RPT</span>
              <strong>
                {loading
                  ? '...'
                  : formatCount(stats?.pacientes?.total ?? totalPatients)}
              </strong>
              <small>Personas registradas en la base</small>
            </div>
          </article>

          <article className="vi-home-overview">
            <div className="vi-home-overview-icon purple">
              <Stethoscope size={21} />
            </div>
            <div className="vi-home-overview-copy">
              <span>Atenciones · Hoja Diaria</span>
              <strong>
                {loading ? '...' : formatCount(totalAtenciones)}
              </strong>
              <small>Registros de actividad clínica</small>
            </div>
          </article>
        </div>

        <div className="vi-home-divider" />

        <div className="vi-home-distribution-grid">
          <DistributionList
            title="Distribución por género"
            items={stats?.pacientes?.genero ?? []}
            valueLabel="pacientes"
            accent="blue"
          />

          <DistributionList
            title="Nacionalidad"
            items={stats?.pacientes?.nacionalidad ?? []}
            valueLabel="pacientes"
            accent="purple"
          />

          <DistributionList
            title="Estado civil"
            items={stats?.pacientes?.estado_civil ?? []}
            valueLabel="pacientes"
            accent="green"
          />
        </div>

        <div className="vi-home-divider" />

        <div className="vi-home-distribution-grid">
          <DistributionList
            title="Provincia"
            items={stats?.pacientes?.provincia ?? []}
            valueLabel="pacientes"
            accent="blue"
          />

          <DistributionList
            title="Cantón"
            items={stats?.pacientes?.canton ?? []}
            valueLabel="pacientes"
            accent="purple"
          />

          <DistributionList
            title="Distrito"
            items={stats?.pacientes?.distrito ?? []}
            valueLabel="pacientes"
            accent="green"
          />
        </div>

        <div className="vi-home-divider" />

        <div className="vi-home-distribution-grid">
          <DistributionList
            title="Grupo etario"
            items={stats?.atenciones?.grupo_etario ?? []}
            accent="blue"
          />

          <DistributionList
            title="Residencia"
            items={stats?.atenciones?.ubicacion_residencia ?? []}
            accent="purple"
          />

          <DistributionList
            title="Sede de atención"
            items={stats?.atenciones?.sede_atencion ?? []}
            accent="green"
          />
        </div>

        <div className="vi-home-divider" />

        <div className="vi-home-distribution-grid">
          <DistributionList
            title="Condición"
            items={stats?.atenciones?.tipo_condicion ?? []}
            accent="orange"
          />

          <DistributionList
            title="Tipo de servicio"
            items={stats?.atenciones?.tipo_servicio ?? []}
            accent="blue"
          />
        </div>
      </section>

      {/* AGENDA */}
      <section className="vi-home-panel">
        <div className="vi-home-agenda-header">
          <SectionHeading
            number="02"
            title="Agenda clínica"
            description="Próximas citas programadas en Google Calendar."
            icon={CalendarCheck}
          />

          <div className="vi-home-agenda-count">
            <CalendarDays size={13} />
            {formatCount(monthlyAppointments)} este mes
          </div>
        </div>

        {loading ? (
          <div className="vi-home-empty">Cargando agenda...</div>
        ) : upcomingEvents.length === 0 ? (
          <div className="vi-home-empty">
            No hay citas próximas registradas.
          </div>
        ) : (
          <div className="vi-home-appointments">
            {upcomingEvents.map((event, index) => (
              <AppointmentCard
                key={event.id}
                event={event}
                index={index}
              />
            ))}
          </div>
        )}
      </section>

      {/* MÓDULO 2: COMERCIAL */}
      <section className="vi-home-panel">
        <SectionHeading
          number="03"
          title="Comercial y captación"
          description="Clasificación de atenciones según la columna L de Hoja Diaria."
          icon={Handshake}
        />

        <div className="vi-home-commercial-highlight">
          <div className="vi-home-commercial-icon">
            <TrendingUp size={23} />
          </div>

          <div className="vi-home-commercial-copy">
            <span>Atenciones clasificadas comercialmente</span>
            <strong>
              {loading
                ? '...'
                : formatCount(stats?.comercial?.total_clasificadas ?? 0)}
            </strong>
            <small>Clasificación dinámica de columna L</small>
          </div>
        </div>

        <DistributionList
          title="Categorías comerciales"
          items={comercial}
          accent="blue"
          limit={10}
        />
      </section>

      {/* MÓDULO 3: FINANZAS */}
      <section className="vi-home-panel">
        <SectionHeading
          number="04"
          title="Finanzas"
          description="Ingresos registrados, métodos de pago y estados financieros."
          icon={Wallet}
        />

        <div className="vi-home-financial-grid">
          <article className="vi-home-financial-card">
            <div className="vi-home-financial-card-top">
              <div className="vi-home-financial-icon green">
                <CircleDollarSign size={18} />
              </div>
              <span>Ingresos totales</span>
            </div>
            <strong>
              {loading ? '...' : formatCurrency(ingresos)}
            </strong>
            <small>Montos registrados en Hoja Diaria</small>
          </article>

          <article className="vi-home-financial-card">
            <div className="vi-home-financial-card-top">
              <div className="vi-home-financial-icon blue">
                <CreditCard size={18} />
              </div>
              <span>Formas de pago</span>
            </div>
            <strong>
              {loading
                ? '...'
                : formatCount(stats?.finanzas?.por_forma_pago?.length ?? 0)}
            </strong>
            <small>Métodos registrados</small>
          </article>

          <article className="vi-home-financial-card">
            <div className="vi-home-financial-card-top">
              <div className="vi-home-financial-icon orange">
                <Activity size={18} />
              </div>
              <span>Estados de pago</span>
            </div>
            <strong>
              {loading
                ? '...'
                : formatCount(stats?.finanzas?.por_estado_pago?.length ?? 0)}
            </strong>
            <small>Estados presentes en Hoja Diaria</small>
          </article>
        </div>

        <div className="vi-home-financial-lists">
          <AmountList
            title="Ingresos por forma de pago"
            items={stats?.finanzas?.por_forma_pago ?? []}
            accent="green"
          />

          <AmountList
            title="Ingresos por estado de pago"
            items={stats?.finanzas?.por_estado_pago ?? []}
            accent="blue"
          />
        </div>
      </section>

      {/* FOOTER */}
      <div className="vi-home-footer">
        <Sparkles size={13} />
        VitalIQ · Dashboard Ejecutivo
      </div>
    </div>
  );
}
