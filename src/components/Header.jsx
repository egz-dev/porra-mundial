import { useState, useEffect, Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';

const TOURNAMENT_START = new Date('2026-06-11T16:00:00-05:00'); // 11 jun 2026 UTC-5

function useCountdown(target) {
  const [diff, setDiff] = useState(() => target - Date.now());
  useEffect(() => {
    const id = setInterval(() => setDiff(target - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  const s = Math.max(0, Math.floor(diff / 1000));
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    mins: Math.floor((s % 3600) / 60),
    secs: s % 60,
  };
}

function pad(n) {
  return String(n).padStart(2, '0');
}

const TABS = [
  { to: '/',              label: 'Clasificación General',     icon: '🏆' },
  { to: '/score-jpit',    label: 'Clasificación JPIT',        icon: '📡' },
  { to: '/partidos',      label: 'Partidos',                  icon: '📅' },
  { to: '/grupos',        label: 'Fase de Grupos',            icon: '🏟️' },
  { to: '/equipos',       label: 'Equipos',                   icon: '🌍' },
  { to: '/info',          label: 'Info',                      icon: 'ℹ️' },

];

// Mensaje motivacional: banderita celebrando a España camino del mundial
function MensajeRoja() {
  return (
    <div className="mensaje-roja" role="banner" aria-label="Mensaje motivacional España">
      <span className="mensaje-roja-flag" aria-hidden="true">🇪🇸</span>
      <div className="mensaje-roja-text">
        <span className="mensaje-roja-headline">¡Por hacer historia!</span>
        <span className="mensaje-roja-sub">Todos somos España · A por la Roja</span>
      </div>
    </div>
  );
}

export default function Header() {
  const location = useLocation();
  const cd = useCountdown(TOURNAMENT_START.getTime());
  // `started` se deriva del propio countdown para evitar llamar a Date.now()
  // durante el render (regla react-hooks/purity). Como useCountdown clampea
  // la diferencia a 0 con Math.max, todos los dígitos quedan a 0 cuando el
  // torneo ya ha empezado, así que esta comprobación refleja el estado real.
  const started = cd.days === 0 && cd.hours === 0 && cd.mins === 0 && cd.secs === 0;

  return (
    <>
      <header className="hero">
        <div className="hero-inner container">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">JPIT</div>
            <div className="brand-text">
              <h1 className="hero-title">Porra Mundial <em>2026</em></h1>
            </div>
          </div>

          <MensajeRoja />

          <div className="hero-meta">
            {!started && (
              <div className="countdown" aria-label="Cuenta atrás para el inicio">
                <span className="cd-label">Empieza en</span>
                <div className="cd-units">
                  {[
                    { n: cd.days, label: 'días' },
                    { n: cd.hours, label: 'horas' },
                    { n: cd.mins, label: 'min' },
                    { n: cd.secs, label: 'seg' },
                  ].map(({ n, label }, idx, arr) => (
                    <Fragment key={label}>
                      <div className="cd-unit">
                        <div className="cd-num">{pad(n)}</div>
                        <div className="cd-name">{label}</div>
                      </div>
                      {idx < arr.length - 1 && (
                        <span className="cd-sep" aria-hidden="true">:</span>
                      )}
                    </Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav className="tabs" aria-label="Secciones">
        <div className="tabs-inner container">
          {TABS.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              role="tab"
              aria-selected={location.pathname === to}
              className="tab"
            >
              {icon} {label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
