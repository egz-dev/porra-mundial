import { useState, useMemo } from 'react';
import { useSheetData } from '../hooks/useSheetData';
import { calcClasificacion } from '../lib/scoring';
function SortHeader({ col, align = 'left', children, sort, onToggle }) {
  const active = sort.col === col;
  return (
    <span
      className={['sortable', active ? 'active' : ''].filter(Boolean).join(' ')}
      style={{ justifyContent: align === 'right' ? 'flex-end' : 'flex-start', cursor: 'pointer', userSelect: 'none' }}
      onClick={() => onToggle(col)}
      role="button"
      aria-pressed={active}
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle(col);
        }
      }}
    >
      {children}
      <span className="sort-indicator" aria-hidden="true">
        {active ? (sort.dir === 'desc' ? '▼' : '▲') : '▼'}
      </span>
    </span>
  );
}

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
          {province.participantes} participante{province.participantes !== 1 ? 's' : ''} · {province.puntos} pts (top 3)
        </p>
        <div className="rank-table" role="table" aria-label={`Participantes de ${province.nombre}`}>
          <div className="rank-row rank-row--3col head" role="row">
            <span>#</span>
            <span>Nombre</span>
            <span style={{ textAlign: 'right' }}>Puntos</span>
          </div>
          {sorted.map((p, i) => {
            const isCounted = i < 3;
            return (
              <div
                key={p.nombre}
                className="rank-row rank-row--3col"
                role="row"
                style={{
                  background: isCounted
                    ? 'linear-gradient(90deg, rgba(152,195,121,0.10), transparent 50%)'
                    : 'linear-gradient(90deg, rgba(229,192,123,0.08), transparent 50%)',
                }}
              >
                <span className="rank-pos" style={isCounted ? { color: 'var(--c-green)' } : { color: 'var(--c-accent)' }}>
                  {i + 1}
                </span>
                <span className="rank-name" style={isCounted ? {} : { color: 'var(--c-ink-soft)' }}>
                  {p.nombre}
                  {!isCounted && <small style={{ color: 'var(--c-accent)' }}>No suma</small>}
                </span>
                <span
                  className="rank-pts"
                  style={{
                    color: isCounted ? 'var(--c-green)' : 'var(--c-accent)',
                    opacity: isCounted ? 1 : 0.5,
                  }}
                >
                  {isCounted ? `+${p.total}` : p.total}
                </span>
              </div>
            );
          })}
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
    prov.members.push(p);
  }

  // Sum stats only for the top 3 participants of each province
  for (const prov of map.values()) {
    prov.members.sort((a, b) => b.total - a.total || b.totalGF - a.totalGF || a.totalGC - b.totalGC);
    const top3 = prov.members.slice(0, 3);
    prov.puntos = top3.reduce((s, m) => s + m.total, 0);
    prov.golesFavor = top3.reduce((s, m) => s + m.totalGF, 0);
    prov.golesContra = top3.reduce((s, m) => s + m.totalGC, 0);
    prov.rojas = top3.reduce((s, m) => s + (m.totalRedCards || 0), 0);
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
  const [sort, setSort] = useState({ col: 'puntos', dir: 'desc' });

  const clasificacion = useMemo(() => calcClasificacion(participantes, resultados), [participantes, resultados]);
  const provinces = useMemo(() => groupByProvince(clasificacion), [clasificacion]);

  const sortedProvinces = useMemo(() => {
    const out = provinces.slice();
    const { col, dir } = sort;
    const m = dir === 'asc' ? 1 : -1;
    out.sort((a, b) => {
      let cmp = 0;
      switch (col) {
        case 'pos':
          cmp = (a._originalPos || 0) - (b._originalPos || 0);
          break;
        case 'nombre':
          cmp = a.nombre.localeCompare(b.nombre);
          break;
        case 'participantes':
          cmp = a.participantes - b.participantes;
          break;
        case 'rojas':
          cmp = (a.rojas || 0) - (b.rojas || 0);
          break;
        case 'puntos':
          cmp = a.puntos - b.puntos;
          break;
        default:
          cmp = 0;
      }
      if (cmp !== 0) return cmp * m;
      // tie-breakers: puntos desc → GF desc → nombre asc
      if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      if (b.golesFavor !== a.golesFavor) return b.golesFavor - a.golesFavor;
      return a.nombre.localeCompare(b.nombre);
    });
    return out;
  }, [provinces, sort]);

  const toggleSort = (col) => {
    setSort(prev => ({
      col,
      dir: prev.col === col && prev.dir === 'desc' ? 'asc' : 'desc',
    }));
  };

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
              <SortHeader col="pos" sort={sort} onToggle={toggleSort}>#</SortHeader>
              <SortHeader col="nombre" sort={sort} onToggle={toggleSort}>Provincia</SortHeader>
              <SortHeader col="participantes" sort={sort} onToggle={toggleSort}>Participantes</SortHeader>
              <SortHeader col="rojas" align="right" sort={sort} onToggle={toggleSort}>Rojas</SortHeader>
              <SortHeader col="puntos" align="right" sort={sort} onToggle={toggleSort}>Puntos</SortHeader>
            </div>
            {sortedProvinces.map((prov, idx) => {
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
