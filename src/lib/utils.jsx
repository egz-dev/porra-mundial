import { TODOS_LOS_PAISES, isoToFlagUrl } from '../data/paises';

/** Normaliza un string quitando tildes, pasando a minúsculas y recortando espacios. */
export function normKey(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

// ── Flag renderer ────────────────────────────────────────

const teamToIsoCache = new Map(TODOS_LOS_PAISES.map(p => [p.nombre, p.iso]));

/** Renderiza la bandera de un equipo como <img>. */
export function flagEl(team, opts = {}) {
  if (!team) return null;
  const { w = 18, h = 13 } = opts;
  const iso = teamToIsoCache.get(team);
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
