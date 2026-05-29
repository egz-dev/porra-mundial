import { useMemo } from 'react';
import { useSheetData } from '../hooks/useSheetData';
import { GRUPOS_MUNDIAL } from '../data/gruposMundial';
import { normKey, flagEl } from '../lib/utils';

// ── Helpers ──────────────────────────────────────────────

const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN']);
const GROUP_COLORS = [
  '#e06c75', '#d19a66', '#e5c07b', '#98c379',
  '#56b6c2', '#61afef', '#c678dd', '#e06c75',
  '#d19a66', '#e5c07b', '#98c379', '#56b6c2',
];

function buildTeamLookup(resultados, groupTeams) {
  const normToCanon = new Map();
  // First, map all team names from results to themselves
  for (const m of resultados) {
    if (m.homeTeam) normToCanon.set(normKey(m.homeTeam), m.homeTeam);
    if (m.awayTeam) normToCanon.set(normKey(m.awayTeam), m.awayTeam);
  }
  // Then try to match group teams to result teams
  const lookup = new Map();
  for (const gt of groupTeams) {
    const nk = normKey(gt);
    if (normToCanon.has(nk)) {
      lookup.set(normToCanon.get(nk), gt);
    }
    // Also try direct match with each results team
    for (const [rk, rv] of normToCanon) {
      if (rk.includes(nk) || nk.includes(rk)) {
        lookup.set(rv, gt);
        break;
      }
    }
  }
  return lookup;
}

// ── Standings calculation ────────────────────────────────

function calcGroupStandings(groupId, resultados) {
  const group = GRUPOS_MUNDIAL.find(g => g.id === groupId);
  if (!group) return [];

  const groupTeamSet = new Set(group.equipos.map(normKey));
  const resultToGroupLookup = buildTeamLookup(resultados, group.equipos);

  // Map: canonical group team name → stats
  const stats = new Map();
  for (const t of group.equipos) {
    stats.set(t, { team: t, pj: 0, v: 0, e: 0, d: 0, gf: 0, gc: 0, pts: 0 });
  }

  // Process group-stage matches involving teams in this group
  const groupMatches = resultados.filter(m => {
    if (m.round !== 'group') return false;
    const ht = resultToGroupLookup.get(m.homeTeam);
    const at = resultToGroupLookup.get(m.awayTeam);
    return (ht && groupTeamSet.has(normKey(ht))) && (at && groupTeamSet.has(normKey(at)));
  });

  for (const m of groupMatches) {
    const ht = resultToGroupLookup.get(m.homeTeam);
    const at = resultToGroupLookup.get(m.awayTeam);

    const homeCanon = ht && groupTeamSet.has(normKey(ht)) ? ht : null;
    const awayCanon = at && groupTeamSet.has(normKey(at)) ? at : null;

    if (!homeCanon || !awayCanon) continue;
    if (!FINISHED_STATUSES.has(m.status)) continue;
    if (m.homeGoals === null || m.awayGoals === null) continue;

    const hs = stats.get(homeCanon);
    const as = stats.get(awayCanon);
    if (!hs || !as) continue;

    hs.pj++; as.pj++;
    hs.gf += m.homeGoals; hs.gc += m.awayGoals;
    as.gf += m.awayGoals; as.gc += m.homeGoals;

    if (m.homeGoals > m.awayGoals) { hs.v++; hs.pts += 3; as.d++; }
    else if (m.homeGoals < m.awayGoals) { as.v++; as.pts += 3; hs.d++; }
    else { hs.e++; hs.pts += 1; as.e++; as.pts += 1; }
  }

  const table = Array.from(stats.values());
  table.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const dgA = a.gf - a.gc;
    const dgB = b.gf - b.gc;
    if (dgB !== dgA) return dgB - dgA;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.team.localeCompare(b.team);
  });

  return table;
}

// ── Component ────────────────────────────────────────────

function GroupTable({ groupId, color, resultados }) {
  const standings = useMemo(() => calcGroupStandings(groupId, resultados), [groupId, resultados]);

  return (
    <div className="gtable-card">
      <div className="gtable-header" style={{ '--group-color': color }}>
        <span className="gtable-group-label">Grupo {groupId}</span>
      </div>
      <div className="gtable-table" role="table" aria-label={`Grupo ${groupId}`}>
        <div className="gtable-row gtable-head" role="row">
          <span>#</span>
          <span>Equipo</span>
          <span>PJ</span>
          <span>V</span>
          <span>E</span>
          <span>D</span>
          <span>GF</span>
          <span>GC</span>
          <span>DG</span>
          <span>Pts</span>
        </div>
        {standings.map((row, idx) => (
          <div
            key={row.team}
            className={`gtable-row${idx < 2 ? ' gtable-row--qual' : ''}`}
            role="row"
          >
            <span className="gtable-pos">{idx + 1}</span>
            <span className="gtable-team">
              {flagEl(row.team, { w: 20, h: 15 })}
              <span>{row.team}</span>
            </span>
            <span>{row.pj}</span>
            <span>{row.v}</span>
            <span>{row.e}</span>
            <span>{row.d}</span>
            <span>{row.gf}</span>
            <span>{row.gc}</span>
            <span className="gtable-dg">{row.gf - row.gc > 0 ? '+' : ''}{row.gf - row.gc}</span>
            <span className="gtable-pts">{row.pts}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────

export default function GruposPage() {
  const { resultados, loading, error } = useSheetData();

  if (loading) return <div className="app"><main><div className="container"><p className="empty">Cargando datos…</p></div></main></div>;
  if (error) return <div className="app"><main><div className="container"><p className="empty" style={{ color: 'var(--c-red)' }}>{error}</p></div></main></div>;

  return (
    <div className="app">
      <main>
        <div className="container">
          <div className="grupos-intro">
            <h2>Fase de grupos</h2>
            <p>12 grupos de 4 equipos. Los 2 primeros de cada grupo + los 8 mejores terceros avanzan a dieciseisavos de final.</p>
          </div>
          <div className="grupos-grid">
            {GRUPOS_MUNDIAL.map((g, idx) => (
              <GroupTable
                key={g.id}
                groupId={g.id}
                color={GROUP_COLORS[idx % GROUP_COLORS.length]}
                resultados={resultados}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
