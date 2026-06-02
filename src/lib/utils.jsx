import { isoToFlagUrl, resolveIso } from '../data/paises';

/** Normaliza un string quitando tildes, pasando a minúsculas y recortando espacios. */
export function normKey(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

// ── Flag renderer ────────────────────────────────────────

/** Renderiza la bandera de un equipo como <img>. */
export function flagEl(team, opts = {}) {
  if (!team) return null;
  const { w = 18, h = 13 } = opts;
  const iso = resolveIso(team);
  if (!iso) return null;
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
