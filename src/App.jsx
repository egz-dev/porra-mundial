import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Header from './components/Header';
import ClasificacionPage from './pages/ClasificacionPage';
import ScoreJpitPage from './pages/ScoreJpitPage';
import GruposPage from './pages/GruposPage';
import EliminatoriasPage from './pages/EliminatoriasPage';
import EquiposPage from './pages/EquiposPage';
import PartidosPage from './pages/PartidosPage';
import InfoPage from './pages/InfoPage';
import Footer from './components/Footer';
import './styles/global.css';

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<ClasificacionPage />} />
        <Route path="/score-jpit" element={<ScoreJpitPage />} />
        <Route path="/equipos" element={<EquiposPage />} />
        <Route path="/partidos" element={<PartidosPage />} />
        <Route path="/grupos" element={<GruposPage />} />
        <Route path="/eliminatorias" element={<EliminatoriasPage />} />
        <Route path="/info" element={<InfoPage />} />
      </Routes>
      <Footer />
      <Analytics />
    </BrowserRouter>
  );
}
