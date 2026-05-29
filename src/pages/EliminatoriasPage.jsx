import { useMemo } from 'react';
import { useSheetData } from '../hooks/useSheetData';
import { BRACKET, ROUND_LABELS } from '../data/eliminatorias';
import { flagEl } from '../lib/utils';

// ── Helpers ──────────────────────────────────────────────

const FINISHED = new Set(['FT', 'AET', 'PEN']);

function getWinner(m) {
  if (!m) return null;
  if (m.homeGoals > m.awayGoals) return m.homeTeam;
  if (m.homeGoals < m.awayGoals) return m.awayTeam;
  return null;
}

// ── Match slot component ─────────────────────────────────

function MatchSlot({ match, data, isLast }) {
  const m = data;
  const hasResult = m && FINISHED.has(m.status);
  const isLive = m && m.status === 'LIVE';
  const winner = hasResult ? getWinner(m) : null;

  return (
    <div className={`bracket-match${isLast ? ' bracket-match--last' : ''}${isLive ? ' bracket-match--live' : ''}${hasResult ? ' bracket-match--done' : ''}`}>
      <div className="bracket-slot bracket-slot--home">
        <span className="bracket-team">
          {flagEl(m?.homeTeam)}
          <span className={`bracket-team-name${winner === m?.homeTeam ? ' bracket-team-name--winner' : ''}`}>
            {m?.homeTeam || (match.label || match.id)}
          </span>
        </span>
        <span className="bracket-score">
          {hasResult ? m.homeGoals : m?.homeTeam ? '–' : ''}
        </span>
      </div>
      <div className="bracket-slot bracket-slot--away">
        <span className="bracket-team">
          {flagEl(m?.awayTeam)}
          <span className={`bracket-team-name${winner === m?.awayTeam ? ' bracket-team-name--winner' : ''}`}>
            {m?.awayTeam || (!m?.homeTeam ? (match.label || match.id) : '')}
          </span>
        </span>
        <span className="bracket-score">
          {hasResult ? m.awayGoals : m?.awayTeam ? '–' : ''}
        </span>
      </div>
      {isLive && <span className="bracket-live-dot" aria-label="En vivo" />}
    </div>
  );
}

// ── Round column component ────────────────────────────────

function RoundColumn({ round, matches, resultsMap, count }) {
  const label = ROUND_LABELS[round] || round;
  const isFinalRound = round === 'final' || round === '3rd';
  const gapClass = isFinalRound ? '' : ` bracket-col--gap${Math.log2(count)}`;

  return (
    <div className={`bracket-col${gapClass}`}>
      <div className="bracket-col-label">{label}</div>
      <div className="bracket-col-matches">
        {matches.map((m) => (
          <MatchSlot
            key={m.id}
            match={m}
            data={resultsMap.get(m.id)}
            isLast={round === 'final' || round === '3rd'}
          />
        ))}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────

export default function EliminatoriasPage() {
  const { resultados, loading, error } = useSheetData();

  const resultsMap = useMemo(() => {
    const map = new Map();
    for (const r of resultados) {
      if (r.matchId) map.set(r.matchId, r);
    }
    return map;
  }, [resultados]);

  // Group bracket matches by round
  const byRound = useMemo(() => {
    const map = new Map();
    for (const m of BRACKET) {
      if (!map.has(m.round)) map.set(m.round, []);
      map.get(m.round).push(m);
    }
    // Sort final round: final first, then 3rd
    const order = ['r32', 'r16', 'qf', 'sf', '3rd', 'final'];
    return order.filter(r => map.has(r)).map(r => ({
      round: r,
      matches: map.get(r).sort((a, b) => a.index - b.index),
      count: map.get(r).length,
    }));
  }, []);

  if (loading) return <div className="app"><main><div className="container"><p className="empty">Cargando eliminatorias…</p></div></main></div>;
  if (error) return <div className="app"><main><div className="container"><p className="empty" style={{ color: 'var(--c-red)' }}>{error}</p></div></main></div>;

  return (
    <div className="app">
      <main>
        <div className="container">
          <div className="grupos-intro">
            <h2>Eliminatorias</h2>
            <p>De dieciseisavos a la final. Los equipos se determinan según los resultados de la fase de grupos.</p>
          </div>

          <div className="bracket-scroll">
            <div className="bracket">
              {byRound.map(({ round, matches, count }) => (
                <RoundColumn
                  key={round}
                  round={round}
                  matches={matches}
                  resultsMap={resultsMap}
                  count={count}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
