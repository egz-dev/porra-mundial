import { useState, useEffect, useMemo, Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSheetData } from '../hooks/useSheetData';
import { calcClasificacion } from '../lib/scoring';

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

// Estructura de premios (mantener sincronizada con InfoPage)
const PRIZE_AMOUNTS = { 1: 42, 2: 21, 3: 12, last: 5, reds: 5 };

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

// Reparto momentáneo: muestra los 5 ganadores virtuales según la clasificación
// actual. Solo un premio por participante, así no se solapan en escenarios con
// pocos participantes.
function BoteMomentaneoRow() {
  const { participantes, resultados, apuestasCount } = useSheetData();
  const clasificacion = useMemo(
    () => participantes.length > 0 ? calcClasificacion(participantes, resultados) : [],
    [participantes, resultados],
  );

  if (clasificacion.length === 0) return null;

  const won = new Set();
  const chips = [];
  const addChip = (player, pos, medal, eur, variant) => {
    if (!player || won.has(player.nombre)) return;
    won.add(player.nombre);
    chips.push({
      key: `${pos}-${player.nombre}`,
      pos, medal, eur, name: player.nombre, variant,
    });
  };

  addChip(clasificacion[0],                              '1º',    '🥇', PRIZE_AMOUNTS[1],    'gold');
  addChip(clasificacion[1],                              '2º',    '🥈', PRIZE_AMOUNTS[2],    'silver');
  addChip(clasificacion[2],                              '3º',    '🥉', PRIZE_AMOUNTS[3],    'bronze');
  addChip(clasificacion[clasificacion.length - 1],       'Últ.',  '💀', PRIZE_AMOUNTS.last,  'last');

  // Más rojas: solo si alguien tiene > 0 rojas
  const maxReds = clasificacion.reduce((m, c) => Math.max(m, c.totalRedCards || 0), 0);
  if (maxReds > 0) {
    const rojasWinner = clasificacion.find(c => (c.totalRedCards || 0) === maxReds);
    addChip(rojasWinner, `🟥 ${maxReds}`, '🟥', PRIZE_AMOUNTS.reds, 'reds');
  }

  if (chips.length === 0) return null;

  const boteTotal = apuestasCount * 5;

  return (
    <div className="bote-momentaneo" role="region" aria-label="Reparto momentáneo del bote">
      <div className="bote-bar-head">
        <span className="bote-pulse" aria-hidden="true" />
        <span className="bote-bar-label">Reparto momentáneo del bote</span>
        {boteTotal > 0 && (
          <span className="bote-bar-total" aria-label={`Bote total: ${boteTotal} euros`}>
            🏆 Bote <strong>{boteTotal} €</strong>
          </span>
        )}
      </div>
      <div className="bote-grid">
        {chips.map(c => (
          <div key={c.key} className={`bote-chip bote-chip--${c.variant}`}>
            <span className="bote-chip-medal" aria-hidden="true">{c.medal}</span>
            <div className="bote-chip-info">
              <span className="bote-chip-pos">{c.pos}</span>
              <span className="bote-chip-name" title={c.name}>{c.name}</span>
            </div>
            <span className="bote-chip-eur">{c.eur} €</span>
          </div>
        ))}
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

          <BoteMomentaneoRow />

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
