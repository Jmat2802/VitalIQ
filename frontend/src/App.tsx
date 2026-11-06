
import { API_BASE_URL } from './api';
import { useState, useEffect } from 'react';
import {
  Activity,
  CalendarDays,
  HeartPulse,
  Users,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  Menu,
  Sparkles,
  LayoutDashboard,
  Wifi,
  WifiOff,
  FileSpreadsheet,
  X
} from 'lucide-react';

import Inicio from './pages/Inicio-temp';
import Agenda from './pages/Agenda-temp';
import Pacientes from './pages/Pacientes-temp';
import Analitica from './pages/Analitica-temp';
import CargaExcel from './pages/CargaExcel-temp';

type Role = 'superadmin' | 'admin' | 'usuario';

const roleNames: Record<Role, string> = {
  superadmin: 'Superadmin',
  admin: 'Administrador',
  usuario: 'Usuario'
};

const navigation = [
  { name: 'Inicio', icon: LayoutDashboard },
  { name: 'Agenda', icon: CalendarDays },
  { name: 'Pacientes', icon: Users },
  { name: 'Analítica', icon: Activity },
  { name: 'Carga Excel', icon: FileSpreadsheet }
];

export default function App() {
  const [role, setRole] = useState<Role>('admin');
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [activePage, setActivePage] = useState('Inicio');
  const [apiStatus, setApiStatus] = useState('Comprobando conexión...');

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/health`)
      .then((response) => {
        if (!response.ok) throw new Error('API error');
        return response.json();
      })
      .then((data) => {
        setApiStatus(data.status === 'ok' ? 'Conectado' : 'Error de API');
      })
      .catch(() => setApiStatus('Backend desconectado'));
  }, []);

  // Cerrar menú con Escape y bloquear scroll del fondo
  useEffect(() => {
    if (!mobile) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobile(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobile]);

  const today = new Date().toLocaleDateString('es-CR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const navigate = (page: string) => {
    setActivePage(page);
    setMobile(false);
    setOpen(false);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'Agenda':
        return <Agenda />;
      case 'Pacientes':
        return <Pacientes />;
      case 'Analítica':
        return <Analitica />;
      case 'Carga Excel':
        return <CargaExcel />;
      default:
        return <Inicio />;
    }
  };

  return (
    <div className="shell">

      {/* Fondo del menú móvil */}
      {mobile && (
        <button
          type="button"
          className="mobile-backdrop"
          aria-label="Cerrar menú"
          onClick={() => setMobile(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={mobile ? 'side open' : 'side'}>
        <div className="mobile-side-header">
          <div className="brand">
            <HeartPulse />
            <div>
              <b>VitalIQ</b>
              <small>INTELLIGENCE IN HEALTH</small>
            </div>
          </div>

          <button
            type="button"
            className="mobile-close"
            aria-label="Cerrar menú"
            onClick={() => setMobile(false)}
          >
            <X />
          </button>
        </div>

        <div className="clinic">
          <span>✚</span>
          <div>
            <b>Clínica Integral</b>
            <small>San Rafael</small>
          </div>
        </div>

        <label>PLATAFORMA</label>

        <nav>
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                type="button"
                key={item.name}
                className={activePage === item.name ? 'active' : ''}
                onClick={() => navigate(item.name)}
              >
                <Icon />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="safe">
          <ShieldCheck />
          Entorno protegido
          <br />
          　 Acceso autorizado
        </div>

        <small className="version">
          VitalIQ · Preview 0.3
        </small>
      </aside>

      {/* Contenido principal */}
      <main>
        <header>
          <button
            type="button"
            className="hamb"
            aria-label={mobile ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobile}
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? <X /> : <Menu />}
          </button>

          <div className="breadcrumb">
            <span className="clinic-desktop">
              Clínica Integral San Rafael
            </span>
            <span className="breadcrumb-separator">/</span>
            <b>{activePage}</b>
          </div>

          <div className="profile">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <i>{role[0].toUpperCase()}</i>

              <span>
                <b>{roleNames[role]}</b>
                <small>Perfil demo</small>
              </span>

              <ChevronDown />
            </button>

            {open && (
              <div className="menu">
                {(['superadmin', 'admin', 'usuario'] as Role[]).map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => {
                      setRole(r);
                      setOpen(false);
                    }}
                  >
                    {roleNames[r]} {role === r ? '✓' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        <section>
          {activePage === 'Inicio' && (
            <div className="welcome">
              <div>
                <label>
                  <Sparkles />
                  PANEL EJECUTIVO
                </label>

                <h1>
                  Buenos días, <em>{roleNames[role]}</em>
                </h1>

                <p>
                  Una visión clara de la actividad y el desempeño de tu clínica.
                </p>
              </div>

              <div className="date">
                <CalendarDays />
                {today}
              </div>
            </div>
          )}

          {activePage === 'Inicio' && (
            <div className="hero">
              <div>
                <small>VITALIQ · HEALTH INTELLIGENCE</small>

                <h2>
                  La salud de tu clínica,
                  <br />
                  <strong>en una sola visión.</strong>
                </h2>

                <p>
                  Información organizada para tomar mejores decisiones.
                </p>

                <button
                  type="button"
                  onClick={() => navigate('Analítica')}
                >
                  Explorar panel <ArrowRight />
                </button>
              </div>

              <div className="pulse">
                <HeartPulse />

                <svg viewBox="0 0 220 58">
                  <path
                    d="M0 31H48L63 15L78 42L98 4L119 52L137 27H220"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                </svg>

                <small>Care · Insight · Impact</small>
              </div>
            </div>
          )}

          {renderPage()}

          <div className="notice">
            <ShieldCheck />
            <span>VitalIQ · Conectado a la plataforma</span>

            <span className="api-indicator">
              {apiStatus === 'Conectado' ? (
                <>
                  <Wifi size={16} />
                  API: {apiStatus}
                </>
              ) : (
                <>
                  <WifiOff size={16} />
                  API: {apiStatus}
                </>
              )}
            </span>
          </div>
        </section>

        <footer>
          © 2026 VitalIQ
          <span>Powered by health intelligence</span>
        </footer>
      </main>
    </div>
  );
}
