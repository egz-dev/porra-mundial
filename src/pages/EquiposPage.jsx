import { useState } from 'react';
import { useSheetData } from '../hooks/useSheetData';
import { calcEquiposStats } from '../lib/scoring';
import { GRUPOS, isoToFlagUrl } from '../data/paises';

const TODOS_LOS_PAISES = GRUPOS.flatMap(g => g.paises);
const teamToIso = new Map(TODOS_LOS_PAISES.map(p => [p.nombre, p.iso]));
function flag(team) {
  const iso = teamToIso.get(team);
  return iso
    ? <img src={isoToFlagUrl(iso)} alt={team} width={20} height={15} style={{ verticalAlign: 'middle' }} />
    : '🏳';
}

const LEGEND_ITEMS = [
  { key: 'V', label: 'Victorias', desc: '3 pts por victoria' },
  { key: 'E', label: 'Empates', desc: '1 pt por empate' },
  { key: 'PG', label: 'Portería a cero', desc: '1 pt por partido sin recibir goles' },
  { key: 'G', label: 'Bonus goles', desc: '1 pt si marca 3+ goles en un partido' },
  { key: 'F', label: 'Puntos de fase', desc: 'Pts por alcanzar fases eliminatorias' },
  { key: 'C', label: 'Campeón', desc: '10 pts extra para el ganador del torneo' },
];

function LegendModal({ onClose }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal legend-modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Leyenda</h3>
          <button type="button" className="modal-x" onClick={onClose} aria-label="Cerrar">&times;</button>
        </div>
        <table className="legend-table">
          <tbody>
            {LEGEND_ITEMS.map(item => (
              <tr key={item.key}>
                <td><span className="legend-key">{item.key}</span></td>
                <td className="legend-label">{item.label}</td>
                <td className="legend-desc">{item.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function EquiposPage() {
  const { resultados, loading, error } = useSheetData();
  const [showLegend, setShowLegend] = useState(false);

  if (loading) return <div className="app"><main><div className="container"><p className="empty">Cargando equipos…</p></div></main></div>;
  if (error) return <div className="app"><main><div className="container"><p className="empty" style={{ color: 'var(--c-red, #e53e3e)' }}>{error}</p></div></main></div>;

  const stats = calcEquiposStats(resultados);

  if (stats.length === 0) {
    return (
      <div className="app"><main><div className="container">
        <div className="empty"><div className="empty-icon">🌍</div><p>Aún no hay datos de partidos.</p></div>
      </div></main></div>
    );
  }

  return (
    <div className="app">
      <main>
        <div className="container">
          <div className="equipos-scroll">
            <table className="equipos-table">
            <thead>
              <tr>
                <th>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    Equipo
                    <button type="button" className="btn-legend" onClick={() => setShowLegend(true)} aria-label="Leyenda de puntuación" title="Leyenda">?</button>
                  </span>
                </th>
                <th>Pts</th>
                <th>PJ</th>
                <th>V</th>
                <th>E</th>
                <th>D</th>
                <th>GF</th>
                <th>GC</th>
                <th>Rojas</th>
                <th>Fase</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(s => (
                <tr key={s.team}>
                  <td>
                    <div className="equipo-cell">
                      <span>{flag(s.team)}</span>
                      <span className="equipo-name">{s.team}</span>
                      {s.pts > 0 && (
                        <span className="pts-breakdown equipo-breakdown">
                          {s.winPts > 0 && <span title="Victorias">V:{s.winPts}</span>}
                          {s.drawPts > 0 && <span title="Empates">E:{s.drawPts}</span>}
                          {s.cleanSheetPts > 0 && <span title="Porterías a cero">PG:{s.cleanSheetPts}</span>}
                          {s.goalBonusPts > 0 && <span title="3+ goles en un partido">G:{s.goalBonusPts}</span>}
                          {s.phasePts > 0 && <span title="Puntos de fase">F:{s.phasePts}</span>}
                          {s.championBonus > 0 && <span className="badge-champion" title="Bonus campeón">C:{s.championBonus}</span>}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <strong>{s.pts}</strong>
                  </td>
                  <td>{s.pj}</td>
                  <td>{s.v}</td>
                  <td>{s.e}</td>
                  <td>{s.d}</td>
                  <td>{s.gf}</td>
                  <td>{s.gc}</td>
                  <td style={{ color: s.redCards > 0 ? 'var(--c-red, #e53e3e)' : undefined, fontWeight: s.redCards > 0 ? 700 : undefined }}>{s.redCards || '—'}</td>
                  <td>{s.faseAlcanzada}</td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>

        {showLegend && <LegendModal onClose={() => setShowLegend(false)} />}
      </main>
    </div>
  );
}
