import { useSheetData } from '../hooks/useSheetData';
import { GRUPOS, isoToFlagUrl } from '../data/paises';

const TODOS_LOS_PAISES = GRUPOS.flatMap(g => g.paises);
const teamToIso = new Map(TODOS_LOS_PAISES.map(p => [p.nombre, p.iso]));
function flag(team) {
  if (!team) return null;
  const iso = teamToIso.get(team);
  return iso
    ? <img src={isoToFlagUrl(iso)} alt={team} width={20} height={15} style={{ verticalAlign: 'middle' }} />
    : '🏳';
}

const PHASE_ORDER = ['group', 'r32', 'last_32', 'r16', 'last_16', 'qf', 'sf', '3rd', 'final'];
const PHASE_LABELS = {
  group: 'Fase de grupos',
  r32: 'Dieciseisavos de final', last_32: 'Dieciseisavos de final',
  r16: 'Octavos de final', last_16: 'Octavos de final',
  qf: 'Cuartos de final', sf: 'Semifinales', '3rd': 'Tercer puesto', final: 'Final',
};
const STATUS_BADGE = { AET: 'AET', PEN: 'PEN', LIVE: 'en vivo' };

function formatTime(iso) {
  if (!iso) return '–';
  return new Date(iso).toLocaleTimeString('es-ES', {
    timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit',
  });
}

function formatDay(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-ES', {
    timeZone: 'Europe/Madrid', weekday: 'short', day: 'numeric', month: 'short',
  });
}

function dayKey(iso) {
  if (!iso) return '';
  // sv-SE locale returns YYYY-MM-DD consistently — used only as a grouping key
  return new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
}

export default function PartidosPage() {
  const { resultados, loading, error } = useSheetData();

  if (loading) return <div className="app"><main><div className="container"><p className="empty">Cargando partidos…</p></div></main></div>;
  if (error) return <div className="app"><main><div className="container"><p className="empty" style={{ color: 'var(--c-red)' }}>{error}</p></div></main></div>;

  if (resultados.length === 0) {
    return (
      <div className="app"><main><div className="container">
        <div className="empty"><div className="empty-icon">📅</div><p>Aún no hay partidos cargados.</p></div>
      </div></main></div>
    );
  }

  const byPhase = new Map();
  for (const m of resultados) {
    if (!byPhase.has(m.round)) byPhase.set(m.round, []);
    byPhase.get(m.round).push(m);
  }
  for (const [, arr] of byPhase) {
    arr.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }

  return (
    <div className="app">
      <main>
        <div className="container">
          {PHASE_ORDER.filter(p => byPhase.has(p)).map(phase => {
            // Group matches by calendar day (Madrid time)
            const byDay = [];
            let curKey = null;
            for (const m of byPhase.get(phase)) {
              const k = dayKey(m.date);
              if (k !== curKey) {
                curKey = k;
                byDay.push({ label: formatDay(m.date), matches: [] });
              }
              byDay[byDay.length - 1].matches.push(m);
            }

            return (
              <div key={phase} className="partidos-phase">
                <div className="partidos-phase-title">{PHASE_LABELS[phase] || phase}</div>
                {byDay.map(({ label, matches }) => (
                  <div key={label || 'nodate'}>
                    {label && <div className="partidos-day-label">{label}</div>}
                    {matches.map(m => {
                      const isNS = m.status === 'NS' || m.status === 'TBD' || m.status === 'TIMED';
                      const isLive = m.status === 'LIVE';
                      const homeName = m.homeTeam || null;
                      const awayName = m.awayTeam || null;
                      const badge = STATUS_BADGE[m.status];

                      return (
                        <div key={m.matchId} className="partido-row">
                          <div className="partido-home">
                            {homeName
                              ? <><span>{homeName}</span><span>{flag(homeName)}</span></>
                              : <span className="partido-tbd">Por determinar</span>
                            }
                          </div>
                          <div className={[
                            'partido-score',
                            isLive && 'partido-score--live',
                            isNS && 'partido-score--ns',
                          ].filter(Boolean).join(' ')}>
                            {isNS
                              ? formatTime(m.date)
                              : m.homeGoals !== null
                                ? `${m.homeGoals}–${m.awayGoals}`
                                : '–'
                            }
                            {badge && (
                              <span className={`partido-badge${isLive ? ' partido-badge--live' : ''}`}>
                                {badge}
                              </span>
                            )}
                          </div>
                          <div className="partido-away">
                            {awayName
                              ? <><span>{flag(awayName)}</span><span>{awayName}</span></>
                              : <span className="partido-tbd">Por determinar</span>
                            }
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
