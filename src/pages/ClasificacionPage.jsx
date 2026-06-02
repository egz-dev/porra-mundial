import { useState, useMemo, Fragment } from 'react';
import { useSheetData } from '../hooks/useSheetData';
import { calcClasificacion } from '../lib/scoring';
import { normKey } from '../lib/utils';
import { GRUPOS, isoToFlagUrl } from '../data/paises';

const TODOS_LOS_PAISES = GRUPOS.flatMap(g => g.paises);
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
        <div className="modal-meta">
          {entry.provincia && (
            <span className="modal-meta-item">📍 {entry.provincia}</span>
          )}
          <span className={['modal-meta-item', entry.totalRedCards > 0 ? 'modal-meta-item--red' : ''].filter(Boolean).join(' ')}>
            🟥 {entry.totalRedCards || '—'}
          </span>
        </div>
        <div className="equipo-score-grid">
          {entry.equipoScores.map(s => (
            <Fragment key={s.equipo}>
              {/* FIX TODO: revisar renderizado de banderas ENG y BA */}
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

function useFilterSort(data) {
  const [province, setProvince] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ col: 'puntos', dir: 'desc' });

  const dataWithPos = useMemo(() => data.map((d, i) => ({ ...d, _originalPos: i + 1 })), [data]);

  const provinces = useMemo(() => {
    const set = new Set(data.map(d => d.provincia).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const filtered = useMemo(() => {
    let out = dataWithPos.slice();
    if (province) out = out.filter(d => d.provincia === province);
    if (query.trim()) {
      const q = normKey(query);
      out = out.filter(d => normKey(d.nombre).includes(q));
    }
    return out;
  }, [dataWithPos, province, query]);

  const sorted = useMemo(() => {
    const out = filtered.slice();
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
        case 'provincia': {
          const pa = a.provincia || '';
          const pb = b.provincia || '';
          cmp = pa.localeCompare(pb);
          break;
        }
        case 'rojas':
          cmp = (a.totalRedCards || 0) - (b.totalRedCards || 0);
          break;
        case 'puntos':
          cmp = a.total - b.total;
          break;
        default:
          cmp = 0;
      }
      if (cmp !== 0) return cmp * m;
      // tie-breakers: puntos desc → GF desc → GC asc → nombre asc
      if (b.total !== a.total) return b.total - a.total;
      if (b.totalGF !== a.totalGF) return b.totalGF - a.totalGF;
      if (a.totalGC !== b.totalGC) return a.totalGC - b.totalGC;
      return a.nombre.localeCompare(b.nombre);
    });
    return out;
  }, [filtered, sort]);

  const toggleSort = (col) => {
    setSort(prev => ({
      col,
      dir: prev.col === col && prev.dir === 'desc' ? 'asc' : 'desc',
    }));
  };

  return {
    provinces, province, setProvince,
    query, setQuery,
    sort, toggleSort,
    sorted,
  };
}

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

export default function ClasificacionPage() {
  const { participantes, resultados, loading, error, refresh } = useSheetData();
  const [selected, setSelected] = useState(null);
  const clasificacion = calcClasificacion(participantes, resultados);

  const {
    provinces, province, setProvince,
    query, setQuery,
    sort, toggleSort,
    sorted,
  } = useFilterSort(clasificacion);

  const posMap = useMemo(() => {
    const map = new Map();
    clasificacion.forEach((c, i) => map.set(c.nombre, i + 1));
    return map;
  }, [clasificacion]);

  if (loading) return <div className="app"><main><div className="container"><p className="empty">Cargando clasificación…</p></div></main></div>;
  if (error) return <div className="app"><main><div className="container"><p className="empty" style={{ color: 'var(--c-red, #e53e3e)' }}>{error}</p></div></main></div>;

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
          <div className="filter-bar">
            <input
              type="text"
              placeholder="Buscar por nombre…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label="Buscar por nombre"
            />
            <select
              value={province}
              onChange={e => setProvince(e.target.value)}
              aria-label="Filtrar por provincia"
            >
              <option value="">Todas las provincias</option>
              {provinces.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button type="button" className="btn ghost" onClick={refresh}>
                ↻ Actualizar
              </button>
            </div>
          </div>

          <div className="rank-table" role="table" aria-label="Clasificación">
            <div className="rank-row rank-row--5col head" role="row" aria-rowindex={1}>
              <SortHeader col="pos" sort={sort} onToggle={toggleSort}>#</SortHeader>
              <SortHeader col="nombre" sort={sort} onToggle={toggleSort}>Nombre</SortHeader>
              <SortHeader col="provincia" sort={sort} onToggle={toggleSort}>Provincia</SortHeader>
              <SortHeader col="rojas" align="right" sort={sort} onToggle={toggleSort}>Rojas</SortHeader>
              <SortHeader col="puntos" align="right" sort={sort} onToggle={toggleSort}>Puntos</SortHeader>
            </div>
            {sorted.map((entry) => {
              const pos = posMap.get(entry.nombre) || 0;
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
            {sorted.length === 0 && (
              <div className="rank-row rank-row--5col" role="row">
                <span className="empty" style={{ gridColumn: '1 / -1', padding: '24px 0' }}>
                  No se encontraron resultados.
                </span>
              </div>
            )}
          </div>
        </div>
      </main>

      {selected && (
        <ParticipantModal entry={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
