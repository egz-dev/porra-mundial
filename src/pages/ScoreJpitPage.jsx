import { useState, useMemo } from 'react';
import { useSheetData } from '../hooks/useSheetData';
import { calcClasificacion } from '../lib/scoring';

function ProvinceModal({ province, participants, onClose }) {
  const sorted = useMemo(() =>
    [...participants].sort((a, b) => b.total - a.total || b.totalGF - a.totalGF || a.totalGC - b.totalGC),
    [participants]
  );

  return (
    <div className="modal-bg" role="dialog" aria-modal="true" aria-labelledby="jp-modal-title" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 id="jp-modal-title">{province.nombre}</h3>
        <p style={{ color: 'var(--c-muted)', fontSize: 14, marginBottom: 16 }}>
          {province.participantes} participante{province.participantes !== 1 ? 's' : ''} · {province.puntos} pts totales
        </p>
        <div className="rank-table" role="table" aria-label={`Participantes de ${province.nombre}`}>
          <div className="rank-row rank-row--3col head" role="row">
            <span>#</span>
            <span>Nombre</span>
            <span style={{ textAlign: 'right' }}>Puntos</span>
          </div>
          {sorted.map((p, i) => (
            <div key={p.nombre} className="rank-row rank-row--3col" role="row">
              <span className="rank-pos">{i + 1}</span>
              <span className="rank-name">{p.nombre}</span>
              <span className="rank-pts">{p.total}</span>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

function groupByProvince(clasificacion) {
  const map = new Map();

  for (const p of clasificacion) {
    const key = (p.provincia || 'Sin provincia').trim();
    if (!map.has(key)) {
      map.set(key, { nombre: key, participantes: 0, puntos: 0, golesFavor: 0, golesContra: 0, rojas: 0, members: [] });
    }
    const prov = map.get(key);
    prov.participantes++;
    prov.puntos += p.total;
    prov.golesFavor += p.totalGF;
    prov.golesContra += p.totalGC;
    prov.rojas += p.totalRedCards;
    prov.members.push(p);
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.puntos !== a.puntos) return b.puntos - a.puntos;
    if (b.golesFavor !== a.golesFavor) return b.golesFavor - a.golesFavor;
    return a.golesContra - b.golesContra;
  });
}

export default function ScoreJpitPage() {
  const { participantes, resultados, loading, error, refresh } = useSheetData();
  const [selected, setSelected] = useState(null);

  const clasificacion = useMemo(() => calcClasificacion(participantes, resultados), [participantes, resultados]);
  const provinces = useMemo(() => groupByProvince(clasificacion), [clasificacion]);

  if (loading) return <div className="app"><main><div className="container"><p className="empty">Cargando clasificación por provincia…</p></div></main></div>;
  if (error) return <div className="app"><main><div className="container"><p className="empty" style={{ color: 'var(--c-red, #e53e3e)' }}>{error}</p></div></main></div>;

  if (provinces.length === 0) {
    return (
      <div className="app"><main><div className="container">
        <div className="empty"><div className="empty-icon">📡</div><p>Aún no hay participantes.</p></div>
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

          <div className="rank-table" role="table" aria-label="Clasificación por provincia">
            <div className="rank-row rank-row--5col head" role="row" aria-rowindex={1}>
              <span>#</span>
              <span>Provincia</span>
              <span>Participantes</span>
              <span style={{ textAlign: 'right' }}>Rojas</span>
              <span style={{ textAlign: 'right' }}>Puntos</span>
            </div>
            {provinces.map((prov, idx) => {
              const pos = idx + 1;
              return (
                <div
                  key={prov.nombre}
                  className="rank-row rank-row--5col"
                  role="row"
                  aria-rowindex={pos + 1}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelected(prov)}
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setSelected(prov)}
                >
                  <span className="rank-pos">{pos}</span>
                  <span className="rank-name">
                    {prov.nombre}
                    <small>Ver participantes →</small>
                  </span>
                  <span className="rank-mini">{prov.participantes}</span>
                  <span className="rank-red">{prov.rojas || '—'}</span>
                  <span className="rank-pts">{prov.puntos}</span>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {selected && (
        <ProvinceModal
          province={selected}
          participants={selected.members}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
