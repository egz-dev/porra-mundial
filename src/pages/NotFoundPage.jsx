import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="app">
      <main>
        <div className="container" style={{ textAlign: 'center', paddingTop: '40px' }}>
          <div className="empty" style={{ padding: '40px 20px' }}>
            <div className="empty-icon" style={{ fontSize: '96px', marginBottom: '8px' }}>🏟️</div>

            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(48px, 8vw, 120px)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              color: '#fff',
              margin: '0 0 4px',
              lineHeight: 1,
            }}>
              4<span style={{ color: 'var(--c-accent)' }}>0</span>4
            </h2>

            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(18px, 3vw, 28px)',
              fontWeight: 600,
              color: 'var(--c-ink)',
              margin: '0 0 8px',
              letterSpacing: '-0.02em',
            }}>
              ¡Fuera de juego!
            </p>

            <p style={{
              fontSize: '16px',
              color: 'var(--c-ink-soft)',
              margin: '0 0 32px',
              maxWidth: '48ch',
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.6,
            }}>
              Esta página no existe o se ha ido al VAR. Vuelve al campo antes de que piten el final.
            </p>

            <Link
              to="/"
              className="btn primary"
              style={{ textDecoration: 'none', fontSize: '15px' }}
            >
              ⚽ Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
