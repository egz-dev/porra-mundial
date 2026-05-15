import { useState } from 'react';
import { useSheetData } from '../hooks/useSheetData';
import { calcClasificacion } from '../lib/scoring';
import { GRUPOS, isoToFlag } from '../data/paises';

const TODOS_LOS_PAISES = GRUPOS.flatMap(g => g.paises);
const teamToFlag = new Map(TODOS_LOS_PAISES.map(p => [p.nombre, isoToFlag(p.iso)]));
function flag(team) { return teamToFlag.get(team) || '🏳'; }

const TOP_CLASS = { 1: 'top1', 2: 'top2', 3: 'top3' };

function ParticipantModal({ entry, onClose }) {
  return (
    <div className="modal-bg" role="dialog" aria-modal="true" aria-labelledby="detail-title" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 id="detail-title">{entry.nombre}</h3>
        {entry.telegram && <p style={{ color: 'var(--c-muted)', fontSize: 13 }}>@{entry.telegram}</p>}
        <div className="equipo-score-grid">
          {entry.equipoScores.map(s => (
            <>
              <div key={`${s.equipo}-name`} className="equipo-score-name">
                <span>{flag(s.equipo)}</span>
                <span>{s.equipo}</span>
              </div>
              <div key={`${s.equipo}-pts`} className="equipo-score-pts">{s.pts} pts</div>
            </>
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
            <div className="rank-row rank-row--5col rank-header" role="row" aria-rowindex={1}>
              <span className="rank-pos">Pos</span>
              <span className="rank-name">Nombre</span>
              <span className="rank-pts">Pts</span>
              <span className="rank-telegram">@Telegram</span>
              <span className="rank-flags">Equipos</span>
            </div>
            {clasificacion.map((entry, idx) => {
              const pos = idx + 1;
              const topClass = TOP_CLASS[pos] || '';
              return (
                <div
                  key={entry.nombre}
                  className={`rank-row rank-row--5col${topClass ? ` ${topClass}` : ''}`}
                  role="row"
                  aria-rowindex={pos + 1}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelected(entry)}
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setSelected(entry)}
                >
                  <span className="rank-pos">{pos}</span>
                  <span className="rank-name">{entry.nombre}</span>
                  <span className="rank-pts">{entry.total}</span>
                  <span className="rank-telegram">{entry.telegram ? `@${entry.telegram}` : '—'}</span>
                  <span className="rank-flags rank-mini">
                    {entry.equipos.map(eq => flag(eq)).join(' ')}
                  </span>
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
