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
  X,
  LogOut,
  LoaderCircle,
  LockKeyhole
} from 'lucide-react';

import Inicio from './pages/Inicio-temp';
import Agenda from './pages/Agenda-temp';
import Pacientes from './pages/Pacientes-temp';
import Analitica from './pages/Analitica-temp';
import CargaExcel from './pages/CargaExcel-temp';

type Role = 'admin' | 'colaborador';

type User = {
  email: string;
  name?: string;
  role: Role;
};

type PageName = 'Inicio' | 'Agenda' | 'Pacientes' | 'Analítica' | 'Carga Excel';

const roleNames: Record<Role, string> = {
  admin: 'Administrador',
  colaborador: 'Colaborador'
};

const navigation: { name: PageName; icon: typeof LayoutDashboard }[] = [
  { name: 'Inicio', icon: LayoutDashboard },
  { name: 'Agenda', icon: CalendarDays },
  { name: 'Pacientes', icon: Users },
  { name: 'Analítica', icon: Activity },
  { name: 'Carga Excel', icon: FileSpreadsheet }
];

const ADMIN_PAGES: PageName[] = ['Inicio', 'Agenda', 'Pacientes', 'Analítica', 'Carga Excel'];
const COLLABORATOR_PAGES: PageName[] = ['Carga Excel'];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [activePage, setActivePage] = useState<PageName>('Inicio');
  const [apiStatus, setApiStatus] = useState('Comprobando conexión...');
  const [logoutLoading, setLogoutLoading] = useState(false);

  const isAdmin = user?.role === 'admin';
  const allowedPages = isAdmin ? ADMIN_PAGES : COLLABORATOR_PAGES;

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_BASE_URL}/api/auth/me`, {
      credentials: 'include'
    })
      .then(async (response) => {
        if (response.status === 401) return null;
        if (!response.ok) throw new Error('No se pudo validar la sesión');
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data?.authenticated && data?.user) {
          setUser(data.user as User);
          const role = data.user.role as Role;
          setActivePage(role === 'colaborador' ? 'Carga Excel' : 'Inicio');
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        if (!cancelled) setLoginError('No fue posible conectar con VitalIQ. Verificá tu conexión e intentá nuevamente.');
      })
      .finally(() => {
        if (!cancelled) setAuthLoading(false);
      });

    fetch(`${API_BASE_URL}/api/health`)
      .then((response) => {
        if (!response.ok) throw new Error('API error');
        return response.json();
      })
      .then((data) => setApiStatus(data.status === 'ok' ? 'Conectado' : 'Error de API'))
      .catch(() => setApiStatus('Backend desconectado'));

    return () => {
      cancelled = true;
    };
  }, []);

  // Mantener siempre al usuario en una página permitida para su rol.
  useEffect(() => {
    if (!user) return;
    if (!allowedPages.includes(activePage)) {
      setActivePage(user.role === 'colaborador' ? 'Carga Excel' : 'Inicio');
    }
  }, [user, activePage, allowedPages]);

  // Cerrar menú con Escape y bloquear scroll del fondo.
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

  const navigate = (page: PageName) => {
    if (!allowedPages.includes(page)) return;
    setActivePage(page);
    setMobile(false);
    setOpen(false);
  };

  const handleGoogleLogin = () => {
    setLoginError('');
    window.location.assign(`${API_BASE_URL}/api/auth/google`);
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } finally {
      setUser(null);
      setOpen(false);
      setMobile(false);
      setActivePage('Inicio');
      setLogoutLoading(false);
    }
  };

  const renderPage = () => {
    if (!user) return null;

    switch (activePage) {
      case 'Agenda':
        return isAdmin ? <Agenda /> : null;
      case 'Pacientes':
        return isAdmin ? <Pacientes /> : null;
      case 'Analítica':
        return isAdmin ? <Analitica /> : null;
      case 'Carga Excel':
        return <CargaExcel />;
      default:
        return isAdmin ? <Inicio /> : <CargaExcel />;
    }
  };

  if (authLoading) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <HeartPulse className="auth-logo" />
          <h1>VitalIQ</h1>
          <p>Verificando acceso seguro…</p>
          <LoaderCircle className="auth-spinner" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <HeartPulse className="auth-logo" />
          <small>INTELLIGENCE IN HEALTH</small>
          <h1>VitalIQ</h1>
          <p>Ingresá con tu cuenta autorizada de Google para continuar.</p>

          {loginError && <div className="auth-error" role="alert">{loginError}</div>}

          <button type="button" className="google-login-button" onClick={handleGoogleLogin}>
            <LockKeyhole size={18} />
            Continuar con Google
            <ArrowRight size={18} />
          </button>

          <div className="auth-security">
            <ShieldCheck size={16} />
            Acceso restringido a cuentas autorizadas
          </div>
        </div>
      </div>
    );
  }

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
          {navigation.filter((item) => allowedPages.includes(item.name)).map((item) => {
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
          VitalIQ · Preview 0.4
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
            {isAdmin && <span className="clinic-desktop">Clínica Integral San Rafael</span>}
            {isAdmin && <span className="breadcrumb-separator">/</span>}
            <b>{activePage}</b>
          </div>

          <div className="profile">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <i>{(user.name || user.email)[0].toUpperCase()}</i>

              <span>
                <b>{roleNames[user.role]}</b>
                <small>{user.name || user.email}</small>
              </span>

              <ChevronDown />
            </button>

            {open && (
              <div className="menu">
                <div className="profile-menu-email">{user.email}</div>
                <button type="button" onClick={handleLogout} disabled={logoutLoading}>
                  <LogOut size={16} />
                  {logoutLoading ? 'Cerrando sesión…' : 'Cerrar sesión'}
                </button>
              </div>
            )}
          </div>
        </header>

        <section>
          {isAdmin && activePage === 'Inicio' && (
            <div className="welcome">
              <div>
                <label>
                  <Sparkles />
                  PANEL EJECUTIVO
                </label>

                <h1>
                  Buenos días, <em>{user.name || roleNames[user.role]}</em>
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

          {isAdmin && activePage === 'Inicio' && (
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

                <button type="button" onClick={() => navigate('Analítica')}>
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
            <span>VitalIQ · Sesión autenticada</span>

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
