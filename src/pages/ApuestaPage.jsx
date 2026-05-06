import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GRUPOS, isoToFlag } from '../data/paises';
import { submitBet, updateBet } from '../lib/appsScript';

const FECHA_CIERRE = new Date('2026-06-11T14:00:00-05:00').getTime();

function isClosed() {
  return Date.now() > FECHA_CIERRE;
}

function totalElegidos(seleccion) {
  return Object.values(seleccion).flat().length;
}

function isValid(seleccion, nombre, alias) {
  if (!nombre.trim() || !alias.trim()) return false;
  for (const g of GRUPOS) {
    const sel = seleccion[g.id] ?? [];
    if (sel.length !== g.elegir) return false;
  }
  return true;
}

function SummaryProgressBar({ seleccion }) {
  return (
    <div className="summary-progress" aria-label="Progreso por grupo">
      {GRUPOS.map((g) => {
        const sel = seleccion[g.id] ?? [];
        const cells = Array.from({ length: g.elegir }, (_, i) => i);
        return cells.map((i) => {
          const filled = i < sel.length;
          const over = sel.length > g.elegir;
          return (
            <div
              key={`${g.id}-${i}`}
              className={`sp-cell${filled ? ' filled' : ''}${over ? ' over' : ''}`}
              style={{ '--bullet': g.color }}
            >
              {filled ? sel[i] : ''}
            </div>
          );
        });
      })}
    </div>
  );
}

function CountryButton({ pais, selected, disabled, onToggle, groupColor }) {
  return (
    <button
      type="button"
      className={`country${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
      style={{ '--bullet': groupColor }}
      onClick={() => !disabled && onToggle(pais.n)}
      aria-pressed={selected}
    >
      <span className="flag" aria-hidden="true">{isoToFlag(pais.iso)}</span>
      <span className="c-text">
        <span className="c-name">{pais.nombre}</span>
        <span className="c-num">#{pais.n}</span>
      </span>
    </button>
  );
}

function GroupCard({ grupo, seleccion, onToggle }) {
  const sel = seleccion[grupo.id] ?? [];
  const state = sel.length === grupo.elegir ? 'ok' : sel.length > grupo.elegir ? 'over' : '';

  return (
    <section className="group">
      <div className="group-head">
        <h2 className="group-title">
          <span className="group-tag" style={{ '--bullet': grupo.color }} aria-hidden="true" />
          {grupo.nombre}
        </h2>
        <span className="group-rule">Elige {grupo.elegir}</span>
        <span className="group-counter" data-state={state}>
          {sel.length}/{grupo.elegir}
        </span>
      </div>
      <div className="country-grid">
        {grupo.paises.map((pais) => {
          const selected = sel.includes(pais.n);
          const maxReached = sel.length >= grupo.elegir && !selected;
          return (
            <CountryButton
              key={pais.n}
              pais={pais}
              selected={selected}
              disabled={maxReached}
              onToggle={onToggle}
              groupColor={grupo.color}
            />
          );
        })}
      </div>
    </section>
  );
}

function ConfirmModal({ seleccion, nombre, apellido, alias, onConfirm, onCancel, loading }) {
  const lines = GRUPOS.map((g) => {
    const sel = seleccion[g.id] ?? [];
    const nombres = sel.map((n) => {
      const p = g.paises.find((p) => p.n === n);
      return p ? `${isoToFlag(p.iso)} ${p.nombre}` : n;
    });
    return `${g.nombre}: ${nombres.join(', ')}`;
  }).join('\n');

  return (
    <div className="modal-bg" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal">
        <h3 id="modal-title">Confirma tu apuesta</h3>
        <p>
          <strong>{nombre} {apellido}</strong>{alias ? ` · @${alias}` : ''}
        </p>
        <div className="summary-list">{lines}</div>
        <p style={{ fontSize: 13, color: 'var(--c-muted)' }}>
          Una vez enviada, solo podrás editar antes del cierre usando tu enlace personal.
        </p>
        <div className="modal-actions">
          <button
            type="button"
            className="btn primary"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Enviando…' : '✅ Enviar apuesta'}
          </button>
          <button type="button" className="btn ghost" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessModal({ editUrl, onClose }) {
  return (
    <div className="modal-bg" role="dialog" aria-modal="true" aria-labelledby="success-title">
      <div className="modal">
        <h3 id="success-title">¡Apuesta enviada! 🎉</h3>
        <p>Tu selección está registrada. Guarda este enlace para poder editar antes del cierre:</p>
        <div className="summary-list" style={{ wordBreak: 'break-all' }}>{editUrl}</div>
        <p style={{ fontSize: 13, color: 'var(--c-muted)' }}>
          También te lo hemos guardado en el portapapeles.
        </p>
        <div className="modal-actions">
          <button type="button" className="btn primary" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ApuestaPage() {
  const [searchParams] = useSearchParams();
  const editToken = searchParams.get('token');
  const closed = isClosed();

  const [seleccion, setSeleccion] = useState(() =>
    Object.fromEntries(GRUPOS.map((g) => [g.id, []]))
  );
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [alias, setAlias] = useState('');

  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editUrl, setEditUrl] = useState(null);
  const [toast, setToast] = useState(null);

  const readOnly = closed && !editToken;

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const togglePais = useCallback((n) => {
    if (readOnly) return;
    setSeleccion((prev) => {
      const grupo = GRUPOS.find((g) => g.paises.some((p) => p.n === n));
      if (!grupo) return prev;
      const sel = prev[grupo.id] ?? [];
      const next = sel.includes(n) ? sel.filter((x) => x !== n) : [...sel, n];
      return { ...prev, [grupo.id]: next };
    });
  }, [readOnly]);

  const valid = isValid(seleccion, nombre, alias);
  const total = totalElegidos(seleccion);

  async function handleSubmit() {
    setLoading(true);
    try {
      const paises = Object.values(seleccion).flat();
      let result;
      if (editToken) {
        result = await updateBet({ token: editToken, nombre, apellido, alias, paises });
        showToast('Apuesta actualizada');
        setShowConfirm(false);
      } else {
        result = await submitBet({ nombre, apellido, alias, paises });
        const url = result.demo
          ? `${window.location.origin}/?token=demo-${Date.now()}`
          : `${window.location.origin}/?token=${result.token}`;
        try { await navigator.clipboard.writeText(url); } catch (_) {}
        setEditUrl(url);
        setShowConfirm(false);
      }
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      {closed && !editToken && (
        <div className="container" style={{ paddingTop: 24 }}>
          <div className="closed-banner">
            <span className="closed-banner-icon">🔒</span>
            <span>Las apuestas están cerradas. El torneo ya ha comenzado.</span>
          </div>
        </div>
      )}

      {editToken && (
        <div className="container" style={{ paddingTop: 24 }}>
          <div className="closed-banner" style={{ background: 'var(--c-blue)' }}>
            <span className="closed-banner-icon">✏️</span>
            <span>Modo edición activo. Puedes modificar tu apuesta hasta el cierre.</span>
          </div>
        </div>
      )}

      <main>
        <div className="container">
          <details className="rules-card">
            <summary>Reglas de puntuación</summary>
            <div className="rules-body">
              <div className="rule-block">
                <h4>Por partido</h4>
                <ul>
                  <li>Resultado correcto: <span className="pts">+3</span></li>
                  <li>Diferencia de goles: <span className="pts">+1</span></li>
                  <li>Portería a 0: <span className="pts">+1</span></li>
                  <li>Por cada 3 goles marcados: <span className="pts">+1</span></li>
                </ul>
              </div>
              <div className="rule-block">
                <h4>Por fase</h4>
                <ul>
                  <li>Octavos: <span className="pts">+1</span></li>
                  <li>Cuartos: <span className="pts">+2</span></li>
                  <li>Semis: <span className="pts">+3</span></li>
                  <li>Final (3º): <span className="pts">+4</span></li>
                  <li>Campeón: <span className="pts">+10</span></li>
                </ul>
              </div>
              <div className="rule-block">
                <h4>Premios especiales</h4>
                <ul>
                  <li>Más tarjetas rojas: 5% del bote</li>
                  <li>Último clasificado: 5% del bote</li>
                </ul>
              </div>
            </div>
          </details>

          {GRUPOS.map((grupo) => (
            <GroupCard
              key={grupo.id}
              grupo={grupo}
              seleccion={seleccion}
              onToggle={togglePais}
            />
          ))}

          <section className="form-section">
            <h2>Tus datos</h2>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="nombre">Nombre</label>
                <input
                  id="nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ana"
                  disabled={readOnly}
                  autoComplete="given-name"
                />
              </div>
              <div className="field">
                <label htmlFor="apellido">Apellido</label>
                <input
                  id="apellido"
                  type="text"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  placeholder="García"
                  disabled={readOnly}
                  autoComplete="family-name"
                />
              </div>
              <div className="field">
                <label htmlFor="alias">Alias / mote</label>
                <input
                  id="alias"
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="LaReina"
                  disabled={readOnly}
                />
              </div>
            </div>
          </section>
        </div>
      </main>

      {!readOnly && (
        <div className="summary-bar" role="status">
          <div className="summary-inner container">
            <div className="summary-status">
              <SummaryProgressBar seleccion={seleccion} />
              <span className="summary-text">
                <strong>{total}</strong>/13 países elegidos
              </span>
            </div>
            <button
              type="button"
              className="btn primary"
              disabled={!valid}
              onClick={() => setShowConfirm(true)}
            >
              {editToken ? '💾 Guardar cambios' : '🎯 Enviar apuesta'}
            </button>
          </div>
        </div>
      )}

      {showConfirm && (
        <ConfirmModal
          seleccion={seleccion}
          nombre={nombre}
          apellido={apellido}
          alias={alias}
          onConfirm={handleSubmit}
          onCancel={() => setShowConfirm(false)}
          loading={loading}
        />
      )}

      {editUrl && (
        <SuccessModal
          editUrl={editUrl}
          onClose={() => setEditUrl(null)}
        />
      )}

      {toast && <div className="toast" role="alert">{toast}</div>}
    </div>
  );
}
