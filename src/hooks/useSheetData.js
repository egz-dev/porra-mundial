import { useState, useCallback, useEffect, useRef } from 'react';
import { parseParticipantes, parseResultados } from '../lib/normalizeSheetData';

const LIVE_POLL_INTERVAL = 60_000; // 1 min mientras hay partidos en vivo

const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
const API_KEY = import.meta.env.VITE_SHEETS_API_KEY;

export function useSheetData() {
  const [participantes, setParticipantes] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [apuestasCount, setApuestasCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!SPREADSHEET_ID || !API_KEY) {
      setError('Configura VITE_SPREADSHEET_ID y VITE_SHEETS_API_KEY en .env.local');
      return;
    }
    setLoading(true);
    setError(null);

    const controller = new AbortController();

    try {
      const url = new URL(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchGet`
      );
      url.searchParams.set('ranges', "'Respuestas'!A:I");
      url.searchParams.append('ranges', 'Resultados!A:J');
      url.searchParams.append('ranges', "'Apuestas'!A:A");
      url.searchParams.set('key', API_KEY);

      const res = await fetch(url.toString(), { signal: controller.signal });
      if (!res.ok) throw new Error(`Sheets API: HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      const [resp, result, apuestas] = data.valueRanges;
      setParticipantes(parseParticipantes(resp.values || []));
      setResultados(parseResultados(result.values || []));
      const apuestasRows = apuestas?.values || [];
      setApuestasCount(Math.max(0, apuestasRows.length - 1)); // -1 por la cabecera
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial al montar. La regla `react-hooks/set-state-in-effect` marca
  // esta línea porque refresh() llama a setLoading(true) sincrónicamente antes
  // del primer await, pero es el patrón canónico de "fetch on mount": sólo se
  // ejecuta una vez (refresh es estable vía useCallback) y nunca produce renders
  // en cascada — la actualización final de los datos ocurre una sola vez tras
  // resolverse la promesa de Sheets API.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh(); }, [refresh]);

  // Polling automático cuando hay partidos en vivo
  useEffect(() => {
    const hasLive = resultados.some(m => m.status === 'LIVE');
    clearInterval(pollRef.current);
    if (hasLive) {
      pollRef.current = setInterval(refresh, LIVE_POLL_INTERVAL);
    }
    return () => clearInterval(pollRef.current);
  }, [resultados, refresh]);

  return { participantes, resultados, apuestasCount, loading, error, refresh };
}
