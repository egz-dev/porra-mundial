import { useState, Fragment } from 'react';
import { useSheetData } from '../hooks/useSheetData';
import { calcClasificacion } from '../lib/scoring';
import { GRUPOS, isoToFlagUrl } from '../data/paises';

const TODOS_LOS_PAISES = GRUPOS.flatMap(g => g.paises);
function normKey(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); }
const teamToIsoExact = new Map(TODOS_LOS_PAISES.map(p => [p.nombre, p.iso]));
const teamToIsoNorm  = new Map(TODOS_LOS_PAISES.map(p => [normKey(p.nombre), p.iso]));
function flag(team) {
  if (!team) return null;
  const iso = teamToIsoExact.get(team) ?? teamToIsoNorm.get(normKey(team));
  if (!iso) console.warn('[porra] no flag ISO for team:', JSON.stringify(team));
  return iso
    ? <img src={isoToFlagUrl(iso)} alt={team} width={20} height={15} style={{ verticalAlign: 'middle' }} />
    : '🏳';
}


const TOP_CLASS = { 1: 'top1', 2: 'top2', 3: 'top3' };
const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

function ParticipantModal({ entry, onClose }) {
  return (
    <div className="modal-bg" role="dialog" aria-modal="true" aria-labelledby="detail-title" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 id="detail-title">{entry.nombre}</h3>
        {entry.telegram && <p style={{ color: 'var(--c-muted)', fontSize: 13 }}>@{entry.telegram}</p>}
        <div className="equipo-score-grid">
          {entry.equipoScores.map(s => (
            <Fragment key={s.equipo}>
              <div className="equipo-score-name">
                <span>{flag(s.equipo)}</span>
                <span>{s.equipo}</span>
              </div>
              <div className="equipo-score-pts">
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                  <span>{s.pts} pts</span>
                  {s.redCards > 0 && <span style={{ color: 'var(--c-red, #e53e3e)', fontWeight: 700, fontSize: 13 }}>🟥 {s.redCards}</span>}
                </div>
                {s.pts > 0 && (
                  <div className="pts-breakdown">
                    {s.winPts > 0 && <span title="Victorias">V:{s.winPts}</span>}
                    {s.drawPts > 0 && <span title="Empates">E:{s.drawPts}</span>}
                    {s.cleanSheetPts > 0 && <span title="Porterías a cero">PG:{s.cleanSheetPts}</span>}
                    {s.goalBonusPts > 0 && <span title="Bonus goles (cada 3)">G:{s.goalBonusPts}</span>}
                    {s.phasePts > 0 && <span title="Puntos de fase">F:{s.phasePts}</span>}
                    {s.championBonus > 0 && <span title="Bonus campeón">🏆:{s.championBonus}</span>}
                  </div>
                )}
              </div>
            </Fragment>
          ))}
        </div>
        <p style={{ marginTop: 16, fontWeight: 700, fontSize: 16 }}>Total: {entry.total} pts</p>
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

export default function ClasificacionPage() {
  const { participantes, resultados, loading, error, refresh } = useSheetData();
  const [selected, setSelected] = useState(null);

  if (loading) return <div className="app"><main><div className="container"><p className="empty">Cargando clasificación…</p></div></main></div>;
  if (error) return <div className="app"><main><div className="container"><p className="empty" style={{ color: 'var(--c-red, #e53e3e)' }}>{error}</p></div></main></div>;

  const clasificacion = calcClasificacion(participantes, resultados);

  if (clasificacion.length === 0) {
    return (
      <div className="app"><main><div className="container">
        <div className="empty"><div className="empty-icon">🏆</div><p>Aún no hay participantes.</p></div>
      </div></main></div>
    );
  }

  return (
    <div className="app">
      <main>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button type="button" className="btn ghost" onClick={refresh}>
              ↻ Actualizar
            </button>
          </div>

          <div className="rank-table" role="table" aria-label="Clasificación">
            <div className="rank-row rank-row--5col head" role="row" aria-rowindex={1}>
              <span>#</span>
              <span>Nombre</span>
              <span>Provincia</span>
              <span style={{ textAlign: 'right' }}>Rojas</span>
              <span style={{ textAlign: 'right' }}>Puntos</span>
            </div>
            {clasificacion.map((entry, idx) => {
              const pos = idx + 1;
              const topClass = TOP_CLASS[pos] || '';
              return (
                <div
                  key={entry.nombre}
                  className={['rank-row', 'rank-row--5col', topClass].filter(Boolean).join(' ')}
                  role="row"
                  aria-rowindex={pos + 1}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelected(entry)}
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setSelected(entry)}
                >
                  <span className="rank-pos">{MEDAL[pos] || pos}</span>
                  <span className="rank-name">
                    {entry.nombre}
                    <small>Ver equipos →</small>
                  </span>
                  <span className="rank-mini">{entry.provincia ? `${entry.provincia}` : '—'}</span>
                  <span className="rank-red">{entry.totalRedCards || '—'}</span>
                  <span className="rank-pts">{entry.total}</span>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {selected && (
        <ParticipantModal entry={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
