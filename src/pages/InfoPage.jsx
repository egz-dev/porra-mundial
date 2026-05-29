export default function InfoPage() {
  return (
    <div className="app">
      <main>
        <div className="container">
          <div className="info-page">
            <h2 className="info-heading">¡PORRA MUNDIAL 2026 — JPITs!</h2>
            <p className="info-intro">¡El Mundial ya está aquí y nos jugamos algo más que el honor! 😁</p>

            <div className="info-card">
              <h3>🫂 AGRADECIMIENTOS</h3>
              <p>Este proyecto es un fork del proyecto original del usuario <b><a href="https://github.com/josecggarrido" target="_blank" rel="noopener noreferrer">josecggarrido</a></b>.</p>
              <p>Editado y mantenido por <b>Edu García</b>, perteneciente a la <b>JPIT de Ciudad Real 📡</b>. El código es completamente abierto y se puede consultar en mi repositorio de <a href="https://github.com/egz-dev/porra-mundial" target="_blank" rel="noopener noreferrer">Github</a>.</p>
              <p>El diseño es sencillo y funcional, pero si alguien quiere aportar su granito de arena para mejorarlo, ¡será más que bienvenido! 🎨.</p>
              <p>Para cualquier duda ⁉️, idea 💡 o bug 🐛, este es mi correo: <a href="mailto:hola@edugarcia.dev">hola@edugarcia.dev</a> 📨.</p>
              <p>¡Gracias a todos por participar y que gane el mejor! 🏆</p>
            </div>

            <div className="info-card">
              <h3>🔢 ¿CÓMO SE PUNTÚA?</h3>
              <ul className="info-grid">
                <li>✅ Victoria <span className="info-pts">3 puntos</span></li>
                <li>🤝 Empate <span className="info-pts">1 punto</span></li>
                <li>🧱 Portería a cero <span className="info-pts">+1 punto</span></li>
                <li>🚀 Clasificarse a 1/16 <span className="info-pts">+1</span></li>
                <li>🚀 Clasificarse a 1/8 <span className="info-pts">+2</span></li>
                <li>🚀 Clasificarse a Cuartos <span className="info-pts">+3</span></li>
                <li>🚀 Clasificarse a Semis <span className="info-pts">+4</span></li>
                <li>🚀 Clasificarse a la Final <span className="info-pts">+5</span></li>
                <li>👑 Campeón del mundo <span className="info-pts">+10 puntos extra</span></li>
                <li>⚽ 3+ goles en un partido <span className="info-pts">+2 puntos adicionales</span></li>
                <li>En la clasificación de JPITs sólo se sumarán los puntos de los 3 mejores participantes de cada provincia</li>
              </ul>
            </div>

            <div className="info-card">
              <h3>💰 REPARTO DEL BOTE</h3>
              <div className="info-prizes">
                <div className="info-prize"><span className="info-medal">🥇</span><strong>1er clasificado</strong> → 50%</div>
                <div className="info-prize"><span className="info-medal">🥈</span><strong>2º clasificado</strong> → 25%</div>
                <div className="info-prize"><span className="info-medal">🥉</span><strong>3er clasificado</strong> → 15%</div>
                <div className="info-prize"><span className="info-medal">💀</span><strong>Último</strong> (menos puntos) → 5% ¡por aguantar el tirón!</div>
                <div className="info-prize"><span className="info-medal">🟥</span><strong>Más tarjetas rojas</strong> acumuladas → 5% ¡por jugar sucio!</div>
              </div>
            </div>

            <div className="info-card">
              <h3>🏅 DESEMPATES</h3>
              <p>En caso de empate final, se miran los goles marcados (y en su defecto los encajados). Si sigue igual, ¡se reparte!</p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
