import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ApuestaPage from './pages/ApuestaPage';
import './styles/global.css';

function Placeholder({ title }) {
  return (
    <div className="app">
      <main>
        <div className="container">
          <div className="empty">
            <div className="empty-icon">🚧</div>
            <p>{title} — próximamente</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<ApuestaPage />} />
        <Route path="/ranking" element={<Placeholder title="Ranking" />} />
        <Route path="/calendario" element={<Placeholder title="Calendario" />} />
        <Route path="/admin" element={<Placeholder title="Admin" />} />
      </Routes>
    </BrowserRouter>
  );
}
