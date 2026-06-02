import { isoToFlagUrl, resolveIso } from '../data/paises';

/** Normaliza un string quitando tildes, pasando a minúsculas y recortando espacios. */
export function normKey(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

// ── Flag renderer ────────────────────────────────────────

/** Renderiza la bandera de un equipo como <img>.
 *  Opciones: w, h (tamaño), fallback (si no hay ISO, e.g. '🏳'), warn (console.warn si no hay ISO). */
export function flagEl(team, opts = {}) {
  const { w = 18, h = 13, fallback = null, warn = false } = opts;
  if (!team) return fallback;
  const iso = resolveIso(team);
  if (!iso) {
    if (warn) console.warn('[porra] no flag ISO for team:', JSON.stringify(team));
    return fallback;
  }
  return (
    <img
      src={isoToFlagUrl(iso)}
      alt={team}
      width={w}
      height={h}
      style={{ verticalAlign: 'middle', flexShrink: 0 }}
    />
  );
}
