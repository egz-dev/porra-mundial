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

export default function EquiposPage() {
  const { resultados, loading, error } = useSheetData();

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
          <table className="equipos-table">
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Pts</th>
                <th>PJ</th>
                <th>V</th>
                <th>E</th>
                <th>D</th>
                <th>GF</th>
                <th>GC</th>
                <th>Fase</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(s => (
                <tr key={s.team}>
                  <td>
                    <div className="equipo-cell">
                      <span>{flag(s.team)}</span>
                      <span>{s.team}</span>
                    </div>
                  </td>
                  <td><strong>{s.pts}</strong></td>
                  <td>{s.pj}</td>
                  <td>{s.v}</td>
                  <td>{s.e}</td>
                  <td>{s.d}</td>
                  <td>{s.gf}</td>
                  <td>{s.gc}</td>
                  <td>{s.faseAlcanzada}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
