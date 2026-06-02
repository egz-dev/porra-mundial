import { HashRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Header from './components/Header';
import ClasificacionPage from './pages/ClasificacionPage';
import ScoreJpitPage from './pages/ScoreJpitPage';
import GruposPage from './pages/GruposPage';
import EquiposPage from './pages/EquiposPage';
import PartidosPage from './pages/PartidosPage';
import InfoPage from './pages/InfoPage';
import NotFoundPage from './pages/NotFoundPage';
import Footer from './components/Footer';
import './styles/global.css';

export default function App() {
  return (
    <HashRouter>
      <Header />
      <Routes>
        <Route path="/" element={<ClasificacionPage />} />
        <Route path="/score-jpit" element={<ScoreJpitPage />} />
        <Route path="/equipos" element={<EquiposPage />} />
        <Route path="/partidos" element={<PartidosPage />} />
        <Route path="/grupos" element={<GruposPage />} />
        <Route path="/info" element={<InfoPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
      <Analytics />
    </HashRouter>
  );
}
