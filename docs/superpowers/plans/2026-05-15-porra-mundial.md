# Porra Mundial 2026 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the betting web app into a read-only visualization panel that reads from Google Sheets and computes rankings client-side.

**Architecture:** Single batchGet call to Sheets API reads "Respuestas" (Forms) and "Resultados" (Apps Script) tabs. A pure scoring engine computes rankings in the browser. An Apps Script hourly trigger fetches API-Football results and writes them to the Sheet.

**Tech Stack:** React 19 + Vite 8, react-router-dom v7, Google Sheets API v4, Google Apps Script + API-Football v3.

---

## File Map

**Create:**
- `src/hooks/useSheetData.js` — fetches both Sheets tabs, exposes `{ participantes, resultados, loading, error, refresh }`
- `src/lib/normalizeSheetData.js` — parses raw Sheets rows into typed objects, deduplicates participants
- `src/lib/scoring.js` — pure scoring engine (match points + phase points + champion bonus)
- `src/pages/ClasificacionPage.jsx` — ranking table with participant detail modal
- `src/pages/EquiposPage.jsx` — 48-team standings table
- `src/pages/PartidosPage.jsx` — matches grouped by phase
- `.env.example` — documents required env vars

**Modify:**
- `src/App.jsx` — new routes, remove ApuestaPage
- `src/components/Header.jsx` — update TABS array
- `src/styles/global.css` — add CSS for new pages
- `apps-script/Code.gs` — replace bet logic with API-Football fetch
- `package.json` — remove papaparse

**Delete:**
- `src/pages/ApuestaPage.jsx`
- `src/lib/appsScript.js`

---

## Task 1: Cleanup and .env.example

**Files:**
- Delete: `src/pages/ApuestaPage.jsx`
- Delete: `src/lib/appsScript.js`
- Modify: `package.json`
- Create: `.env.example`

- [ ] **Step 1: Delete unused source files**

```bash
rm src/pages/ApuestaPage.jsx src/lib/appsScript.js
```

- [ ] **Step 2: Remove papaparse from package.json**

In `package.json`, remove the papaparse line from `dependencies`:

```json
{
  "dependencies": {
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "react-router-dom": "^7.6.0"
  }
}
```

- [ ] **Step 3: Uninstall papaparse**

```bash
npm uninstall papaparse
```

Expected: `node_modules/papaparse` removed, `package.json` updated (lock file synced).

- [ ] **Step 4: Create .env.example**

```
VITE_SPREADSHEET_ID=your_spreadsheet_id_here
VITE_SHEETS_API_KEY=your_google_api_key_here
```

- [ ] **Step 5: Verify build still compiles**

```bash
npm run build 2>&1 | tail -5
```

Expected: build succeeds (there will be import errors from App.jsx — that's fine, fixed in Task 2).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove betting UI and papaparse, add .env.example"
```

---

## Task 2: Routing and Navigation

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/Header.jsx`

- [ ] **Step 1: Replace App.jsx**

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ClasificacionPage from './pages/ClasificacionPage';
import EquiposPage from './pages/EquiposPage';
import PartidosPage from './pages/PartidosPage';
import './styles/global.css';

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<ClasificacionPage />} />
        <Route path="/equipos" element={<EquiposPage />} />
        <Route path="/partidos" element={<PartidosPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: Update Header TABS**

In `src/components/Header.jsx`, replace the `TABS` constant:

```js
const TABS = [
  { to: '/',         label: 'Clasificación', icon: '🏆' },
  { to: '/equipos',  label: 'Equipos',       icon: '🌍' },
  { to: '/partidos', label: 'Partidos',       icon: '📅' },
];
```

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx src/components/Header.jsx
git commit -m "feat: update routing and navigation tabs"
```

---

## Task 3: Sheet Data Normalization

**Files:**
- Create: `src/lib/normalizeSheetData.js`

- [ ] **Step 1: Create normalizeSheetData.js**

```js
const NUM_PREFIX_RE = /^\d+-/;

function normalizeName(raw) {
  return (raw || '').replace(NUM_PREFIX_RE, '').trim();
}

export function parseParticipantes(rows) {
  if (!rows || rows.length < 2) return [];

  const raw = rows.slice(1).map(row => ({
    timestamp: row[0] || '',
    nombre: (row[1] || '').trim(),
    telegram: (row[2] || '').replace(/^@/, '').toLowerCase().trim(),
    equipos: row.slice(3, 16).map(normalizeName).filter(Boolean),
  })).filter(e => e.nombre);

  raw.sort((a, b) => (b.timestamp > a.timestamp ? 1 : b.timestamp < a.timestamp ? -1 : 0));

  const seenNombres = new Set();
  const seenTelegrams = new Set();
  const result = [];

  for (const entry of raw) {
    const nombreKey = entry.nombre.toLowerCase();
    if (seenNombres.has(nombreKey)) continue;
    if (entry.telegram && seenTelegrams.has(entry.telegram)) continue;
    seenNombres.add(nombreKey);
    if (entry.telegram) seenTelegrams.add(entry.telegram);
    result.push({ nombre: entry.nombre, telegram: entry.telegram, equipos: entry.equipos });
  }

  return result;
}

export function parseResultados(rows) {
  if (!rows || rows.length === 0) return [];

  return rows
    .filter(row => row[0] !== undefined && row[0] !== '')
    .map(row => ({
      matchId: Number(row[0]),
      homeTeam: String(row[1] || ''),
      awayTeam: String(row[2] || ''),
      homeGoals: row[3] !== '' && row[3] !== undefined ? Number(row[3]) : null,
      awayGoals: row[4] !== '' && row[4] !== undefined ? Number(row[4]) : null,
      status: String(row[5] || 'NS'),
      round: String(row[6] || ''),
      date: String(row[7] || ''),
    }));
}
```

- [ ] **Step 2: Verify manually in browser console (after Task 5 is done)**

With real or mock data, run:

```js
import { parseParticipantes } from './src/lib/normalizeSheetData.js';

const rows = [
  ['Marca temporal', 'Nombre', 'Telegram', '...'],
  ['2026-05-10T10:00:00Z', 'Ana García', '@ana', '1-Brasil', 'España'],
  ['2026-05-09T09:00:00Z', 'Ana García', '@ana', '2-Argentina', 'Francia'],
  ['2026-05-08T08:00:00Z', 'Luis', '@luis', '3-Alemania'],
];
const result = parseParticipantes(rows);
// Expected: 2 entries; Ana García keeps the 2026-05-10 row (most recent)
console.assert(result.length === 2);
console.assert(result[0].nombre === 'Ana García');
console.assert(result[0].equipos[0] === 'Brasil'); // prefix stripped
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/normalizeSheetData.js
git commit -m "feat: add sheet data normalization and deduplication"
```

---

## Task 4: Scoring Engine

**Files:**
- Create: `src/lib/scoring.js`

- [ ] **Step 1: Create scoring.js**

```js
const PHASE_POINTS = { r32: 1, r16: 2, qf: 3, sf: 4, '3rd': 5, final: 5 };
const PHASE_ORDER = ['final', '3rd', 'sf', 'qf', 'r16', 'r32', 'group'];
const PHASE_LABELS = {
  group: 'Grupos', r32: '1/16', r16: 'Octavos', qf: 'Cuartos',
  sf: 'Semis', '3rd': '3er puesto', final: 'Final',
};

export function calcTeamStats(team, resultados) {
  let matchPts = 0, phasePts = 0;
  let pj = 0, v = 0, e = 0, d = 0, gf = 0, gc = 0;
  const phasesReached = new Set();

  for (const m of resultados) {
    const isHome = m.homeTeam === team;
    const isAway = m.awayTeam === team;
    if (!isHome && !isAway) continue;

    if (m.round) phasesReached.add(m.round);

    if (m.status !== 'FT' || m.homeGoals === null || m.awayGoals === null) continue;

    pj++;
    const myGoals = isHome ? m.homeGoals : m.awayGoals;
    const theirGoals = isHome ? m.awayGoals : m.homeGoals;
    gf += myGoals;
    gc += theirGoals;

    if (myGoals > theirGoals) { matchPts += 3; v++; }
    else if (myGoals === theirGoals) { matchPts += 1; e++; }
    else { d++; }

    if (theirGoals === 0) matchPts += 1;
    matchPts += Math.floor(myGoals / 3);
  }

  for (const phase of phasesReached) {
    phasePts += PHASE_POINTS[phase] || 0;
  }

  const faseAlcanzada = getFaseLabel(phasesReached);
  return { matchPts, phasePts, pj, v, e, d, gf, gc, phasesReached, faseAlcanzada };
}

function getFaseLabel(phasesReached) {
  for (const phase of PHASE_ORDER) {
    if (phasesReached.has(phase)) return PHASE_LABELS[phase] || phase;
  }
  return '—';
}

export function detectChampion(resultados) {
  const f = resultados.find(m => m.round === 'final' && m.status === 'FT');
  if (!f || f.homeGoals === null || f.awayGoals === null || f.homeGoals === f.awayGoals) return null;
  return f.homeGoals > f.awayGoals ? f.homeTeam : f.awayTeam;
}

export function calcClasificacion(participantes, resultados) {
  const champion = detectChampion(resultados);

  const scored = participantes.map(p => {
    let totalGF = 0, totalGC = 0, totalMatchPts = 0, totalPhasePts = 0, championBonus = 0;

    const equipoScores = p.equipos.map(equipo => {
      const s = calcTeamStats(equipo, resultados);
      const bonus = champion && equipo === champion ? 10 : 0;
      totalMatchPts += s.matchPts;
      totalPhasePts += s.phasePts;
      championBonus += bonus;
      totalGF += s.gf;
      totalGC += s.gc;
      return { equipo, matchPts: s.matchPts, phasePts: s.phasePts, pj: s.pj, v: s.v, e: s.e, d: s.d, gf: s.gf, gc: s.gc, faseAlcanzada: s.faseAlcanzada, championBonus: bonus, pts: s.matchPts + s.phasePts + bonus };
    });

    const total = totalMatchPts + totalPhasePts + championBonus;
    return { ...p, total, totalGF, totalGC, equipoScores };
  });

  scored.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    if (b.totalGF !== a.totalGF) return b.totalGF - a.totalGF;
    return a.totalGC - b.totalGC;
  });

  return scored;
}

export function calcEquiposStats(resultados) {
  const teams = new Set();
  for (const m of resultados) {
    if (m.homeTeam) teams.add(m.homeTeam);
    if (m.awayTeam) teams.add(m.awayTeam);
  }

  const stats = Array.from(teams).map(team => {
    const s = calcTeamStats(team, resultados);
    return {
      team,
      pts: s.matchPts + s.phasePts,
      pj: s.pj,
      v: s.v,
      e: s.e,
      d: s.d,
      gf: s.gf,
      gc: s.gc,
      faseAlcanzada: s.faseAlcanzada,
    };
  });

  stats.sort((a, b) => b.pts - a.pts || b.gf - a.gf || a.gc - b.gc);
  return stats;
}
```

- [ ] **Step 2: Verify manually in browser console (after dev server running)**

```js
// Paste in browser console after importing or via window.scoring = ...
const resultados = [
  { matchId: 1, homeTeam: 'Brasil', awayTeam: 'España', homeGoals: 3, awayGoals: 0, status: 'FT', round: 'group', date: '' },
  { matchId: 2, homeTeam: 'Brasil', awayTeam: 'Francia', homeGoals: 1, awayGoals: 1, status: 'FT', round: 'r16', date: '' },
];
// Brasil: 3 wins → 3pts + clean sheet → +1 + floor(3/3)→+1 = 5 match pts; r16 phase → +2 = 7 total
// España: 1 loss → 0 pts; group phase → 0 pts = 0 total
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/scoring.js
git commit -m "feat: add client-side scoring engine"
```

---

## Task 5: useSheetData Hook

**Files:**
- Create: `src/hooks/useSheetData.js`

- [ ] **Step 1: Create useSheetData.js**

```js
import { useState, useCallback, useEffect } from 'react';
import { parseParticipantes, parseResultados } from '../lib/normalizeSheetData';

const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
const API_KEY = import.meta.env.VITE_SHEETS_API_KEY;

export function useSheetData() {
  const [participantes, setParticipantes] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!SPREADSHEET_ID || !API_KEY) {
      setError('Configura VITE_SPREADSHEET_ID y VITE_SHEETS_API_KEY en .env.local');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = new URL(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchGet`
      );
      url.searchParams.set('ranges', 'Respuestas!A:P');
      url.searchParams.append('ranges', 'Resultados!A:H');
      url.searchParams.set('key', API_KEY);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Sheets API: HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      const [resp, result] = data.valueRanges;
      setParticipantes(parseParticipantes(resp.values || []));
      setResultados(parseResultados(result.values || []));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { participantes, resultados, loading, error, refresh };
}
```

- [ ] **Step 2: Create .env.local with real credentials (not committed)**

```bash
cp .env.example .env.local
# Edit .env.local with your real SPREADSHEET_ID and API_KEY
```

Add `.env.local` to `.gitignore` if not already there:

```bash
grep -q '.env.local' .gitignore || echo '.env.local' >> .gitignore
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useSheetData.js .gitignore
git commit -m "feat: add useSheetData hook for Sheets API batchGet"
```

---

## Task 6: CSS for New Pages

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Add CSS classes at the end of global.css**

Append to `src/styles/global.css`:

```css
/* ── Clasificación table (5 columns) ─────────────────────── */
.rank-row--5col {
  grid-template-columns: 50px 1fr 80px 100px 1fr;
}
@media (max-width: 600px) {
  .rank-row--5col {
    grid-template-columns: 40px 1fr 60px;
  }
  .rank-row--5col .rank-telegram,
  .rank-row--5col .rank-flags {
    display: none;
  }
}

/* ── Equipos table ────────────────────────────────────────── */
.equipos-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.equipos-table th,
.equipos-table td {
  padding: 8px 12px;
  text-align: right;
  border-bottom: 1px solid var(--c-border);
}
.equipos-table th:first-child,
.equipos-table td:first-child {
  text-align: left;
}
.equipos-table thead th {
  font-size: 12px;
  color: var(--c-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.equipos-table tbody tr:hover {
  background: var(--c-surface);
}
.equipo-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ── Partidos ─────────────────────────────────────────────── */
.partidos-phase {
  margin-bottom: 32px;
}
.partidos-phase-title {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--c-muted);
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--c-border);
}
.partido-row {
  display: grid;
  grid-template-columns: 1fr 80px 1fr;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  border-bottom: 1px solid var(--c-border);
}
.partido-home {
  text-align: right;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  font-size: 14px;
}
.partido-away {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}
.partido-score {
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.partido-score--live {
  color: var(--c-red, #e53e3e);
}

/* ── Participant detail modal ─────────────────────────────── */
.equipo-score-grid {
  display: grid;
  grid-template-columns: 1fr 60px;
  gap: 4px 12px;
  font-size: 13px;
  margin-top: 12px;
}
.equipo-score-name {
  display: flex;
  align-items: center;
  gap: 6px;
}
.equipo-score-pts {
  text-align: right;
  font-weight: 600;
}
```

- [ ] **Step 2: Verify no existing class names are accidentally overridden**

```bash
grep -n 'rank-row--5col\|equipos-table\|partidos-phase\|partido-row\|equipo-score-grid' src/styles/global.css | head -20
```

Expected: only the lines you just added.

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: add CSS for clasificacion, equipos, and partidos pages"
```

---

## Task 7: PartidosPage

**Files:**
- Create: `src/pages/PartidosPage.jsx`

- [ ] **Step 1: Create PartidosPage.jsx**

```jsx
import { useSheetData } from '../hooks/useSheetData';
import { GRUPOS, isoToFlag } from '../data/paises';

const TODOS_LOS_PAISES = GRUPOS.flatMap(g => g.paises);
const teamToFlag = new Map(TODOS_LOS_PAISES.map(p => [p.nombre, isoToFlag(p.iso)]));
function flag(team) { return teamToFlag.get(team) || '🏳'; }

const PHASE_ORDER = ['group', 'r32', 'r16', 'qf', 'sf', '3rd', 'final'];
const PHASE_LABELS = {
  group: 'Fase de grupos', r32: '1/16 de final', r16: 'Octavos de final',
  qf: 'Cuartos de final', sf: 'Semifinales', '3rd': 'Tercer puesto', final: 'Final',
};

export default function PartidosPage() {
  const { resultados, loading, error } = useSheetData();

  if (loading) return <div className="app"><main><div className="container"><p className="empty">Cargando partidos…</p></div></main></div>;
  if (error) return <div className="app"><main><div className="container"><p className="empty" style={{ color: 'var(--c-red, #e53e3e)' }}>{error}</p></div></main></div>;

  const visible = resultados.filter(m => m.status === 'FT' || m.status === 'LIVE');
  const byPhase = new Map();
  for (const m of visible) {
    if (!byPhase.has(m.round)) byPhase.set(m.round, []);
    byPhase.get(m.round).push(m);
  }
  for (const [, matches] of byPhase) {
    matches.sort((a, b) => a.date.localeCompare(b.date));
  }

  if (byPhase.size === 0) {
    return (
      <div className="app"><main><div className="container">
        <div className="empty"><div className="empty-icon">📅</div><p>Aún no hay partidos jugados.</p></div>
      </div></main></div>
    );
  }

  return (
    <div className="app">
      <main>
        <div className="container">
          {PHASE_ORDER.filter(p => byPhase.has(p)).map(phase => (
            <div key={phase} className="partidos-phase">
              <div className="partidos-phase-title">{PHASE_LABELS[phase] || phase}</div>
              {byPhase.get(phase).map(m => (
                <div key={m.matchId} className="partido-row">
                  <div className="partido-home">
                    <span>{m.homeTeam}</span>
                    <span>{flag(m.homeTeam)}</span>
                  </div>
                  <div className={`partido-score${m.status === 'LIVE' ? ' partido-score--live' : ''}`}>
                    {m.homeGoals !== null ? `${m.homeGoals}–${m.awayGoals}` : '–'}
                  </div>
                  <div className="partido-away">
                    <span>{flag(m.awayTeam)}</span>
                    <span>{m.awayTeam}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Start dev server and verify**

```bash
npm run dev
```

Navigate to `/partidos`. With no env vars, you should see the config error. With env vars pointing to a real sheet with data, you should see matches grouped by phase. With an empty sheet, you should see "Aún no hay partidos jugados."

- [ ] **Step 3: Commit**

```bash
git add src/pages/PartidosPage.jsx
git commit -m "feat: add PartidosPage grouped by phase"
```

---

## Task 8: EquiposPage

**Files:**
- Create: `src/pages/EquiposPage.jsx`

- [ ] **Step 1: Create EquiposPage.jsx**

```jsx
import { useSheetData } from '../hooks/useSheetData';
import { calcEquiposStats } from '../lib/scoring';
import { GRUPOS, isoToFlag } from '../data/paises';

const TODOS_LOS_PAISES = GRUPOS.flatMap(g => g.paises);
const teamToFlag = new Map(TODOS_LOS_PAISES.map(p => [p.nombre, isoToFlag(p.iso)]));
function flag(team) { return teamToFlag.get(team) || '🏳'; }

export default function EquiposPage() {
  const { resultados, loading, error } = useSheetData();

  if (loading) return <div className="app"><main><div className="container"><p className="empty">Cargando equipos…</p></div></main></div>;
  if (error) return <div className="app"><main><div className="container"><p className="empty" style={{ color: 'var(--c-red, #e53e3e)' }}>{error}</p></div></main></div>;

  const stats = calcEquiposStats(resultados);

  if (stats.length === 0) {
    return (
      <div className="app"><main><div className="container">
        <div className="empty"><div className="empty-icon">🌍</div><p>Aún no hay datos de partidos.</p></div>
      </div></main></div>
    );
  }

  return (
    <div className="app">
      <main>
        <div className="container">
          <table className="equipos-table">
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Pts</th>
                <th>PJ</th>
                <th>V</th>
                <th>E</th>
                <th>D</th>
                <th>GF</th>
                <th>GC</th>
                <th>Fase</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(s => (
                <tr key={s.team}>
                  <td>
                    <div className="equipo-cell">
                      <span>{flag(s.team)}</span>
                      <span>{s.team}</span>
                    </div>
                  </td>
                  <td><strong>{s.pts}</strong></td>
                  <td>{s.pj}</td>
                  <td>{s.v}</td>
                  <td>{s.e}</td>
                  <td>{s.d}</td>
                  <td>{s.gf}</td>
                  <td>{s.gc}</td>
                  <td>{s.faseAlcanzada}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Navigate to `/equipos`. Table should render with correct columns. With mock data, verify sorting by pts descending. Flags should display for known team names; unknown names show 🏳.

- [ ] **Step 3: Commit**

```bash
git add src/pages/EquiposPage.jsx
git commit -m "feat: add EquiposPage with team standings table"
```

---

## Task 9: ClasificacionPage

**Files:**
- Create: `src/pages/ClasificacionPage.jsx`

- [ ] **Step 1: Create ClasificacionPage.jsx**

```jsx
import { useState } from 'react';
import { useSheetData } from '../hooks/useSheetData';
import { calcClasificacion } from '../lib/scoring';
import { GRUPOS, isoToFlag } from '../data/paises';

const TODOS_LOS_PAISES = GRUPOS.flatMap(g => g.paises);
const teamToFlag = new Map(TODOS_LOS_PAISES.map(p => [p.nombre, isoToFlag(p.iso)]));
function flag(team) { return teamToFlag.get(team) || '🏳'; }

const TOP_CLASS = { 1: 'top1', 2: 'top2', 3: 'top3' };

function ParticipantModal({ entry, onClose }) {
  return (
    <div className="modal-bg" role="dialog" aria-modal="true" aria-labelledby="detail-title" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 id="detail-title">{entry.nombre}</h3>
        {entry.telegram && <p style={{ color: 'var(--c-muted)', fontSize: 13 }}>@{entry.telegram}</p>}
        <div className="equipo-score-grid">
          {entry.equipoScores.map(s => (
            <>
              <div key={`${s.equipo}-name`} className="equipo-score-name">
                <span>{flag(s.equipo)}</span>
                <span>{s.equipo}</span>
              </div>
              <div key={`${s.equipo}-pts`} className="equipo-score-pts">{s.pts} pts</div>
            </>
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

export default function ClasificacionPage() {
  const { participantes, resultados, loading, error, refresh } = useSheetData();
  const [selected, setSelected] = useState(null);

  if (loading) return <div className="app"><main><div className="container"><p className="empty">Cargando clasificación…</p></div></main></div>;
  if (error) return <div className="app"><main><div className="container"><p className="empty" style={{ color: 'var(--c-red, #e53e3e)' }}>{error}</p></div></main></div>;

  const clasificacion = calcClasificacion(participantes, resultados);

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
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button type="button" className="btn ghost" onClick={refresh}>
              ↻ Actualizar
            </button>
          </div>

          <div className="rank-table" role="table" aria-label="Clasificación">
            <div className="rank-row rank-row--5col rank-header" role="row" aria-rowindex={1}>
              <span className="rank-pos">Pos</span>
              <span className="rank-name">Nombre</span>
              <span className="rank-pts">Pts</span>
              <span className="rank-telegram">@Telegram</span>
              <span className="rank-flags">Equipos</span>
            </div>
            {clasificacion.map((entry, idx) => {
              const pos = idx + 1;
              const topClass = TOP_CLASS[pos] || '';
              return (
                <div
                  key={entry.nombre}
                  className={`rank-row rank-row--5col${topClass ? ` ${topClass}` : ''}`}
                  role="row"
                  aria-rowindex={pos + 1}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelected(entry)}
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setSelected(entry)}
                >
                  <span className="rank-pos">{pos}</span>
                  <span className="rank-name">{entry.nombre}</span>
                  <span className="rank-pts">{entry.total}</span>
                  <span className="rank-telegram">{entry.telegram ? `@${entry.telegram}` : '—'}</span>
                  <span className="rank-flags rank-mini">
                    {entry.equipos.map(eq => flag(eq)).join(' ')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {selected && (
        <ParticipantModal entry={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Navigate to `/` (ClasificacionPage). Verify:
- Table renders with 5 columns on desktop, 3 on mobile
- Rows 1–3 have top1/top2/top3 styles
- Clicking a row opens the participant modal
- "Actualizar" button triggers a re-fetch
- Flags display next to team names in the modal

- [ ] **Step 3: Commit**

```bash
git add src/pages/ClasificacionPage.jsx
git commit -m "feat: add ClasificacionPage with ranking table and participant modal"
```

---

## Task 10: Apps Script — API-Football Fetch

**Files:**
- Modify: `apps-script/Code.gs`

- [ ] **Step 1: Replace entire Code.gs content**

```js
var TEAM_NAME_MAP = {
  'Brazil': 'Brasil', 'Spain': 'España', 'England': 'Inglaterra',
  'France': 'Francia', 'Netherlands': 'Países Bajos', 'Germany': 'Alemania',
  'Portugal': 'Portugal', 'Argentina': 'Argentina', 'Italy': 'Italia',
  'Norway': 'Noruega', 'Belgium': 'Bélgica', 'Canada': 'Canadá',
  'Switzerland': 'Suiza', 'Mexico': 'México', 'Japan': 'Japón',
  'United States': 'EEUU', 'Turkey': 'Turquía', 'Sweden': 'Suecia',
  'Croatia': 'Croacia', 'Morocco': 'Marruecos', 'South Korea': 'Corea del Sur',
  'Egypt': 'Egipto', 'Algeria': 'Argelia', 'DR Congo': 'Rep. Dem. del Congo',
  'Tunisia': 'Túnez', 'Colombia': 'Colombia', 'Ecuador': 'Ecuador',
  'Senegal': 'Senegal', 'Ghana': 'Ghana', 'Cameroon': 'Camerún',
  'Scotland': 'Escocia', 'Iran': 'Irán', 'Czech Republic': 'Chequia',
  "Ivory Coast": 'Costa de Marfil', 'New Zealand': 'Nueva Zelanda',
  'Curacao': 'Curaçao', 'Jordan': 'Jordania', 'South Africa': 'Sudáfrica',
  'Uzbekistan': 'Uzbekistán', 'Haiti': 'Haití', 'Qatar': 'Catar',
  'Iraq': 'Irak', 'Panama': 'Panamá', 'Cabo Verde': 'Cabo Verde',
  'Saudi Arabia': 'Arabia Saudí', 'Australia': 'Australia', 'Chile': 'Chile',
  'Venezuela': 'Venezuela', 'Peru': 'Perú', 'Uruguay': 'Uruguay',
};

var ROUND_MAP = {
  'Round of 32': 'r32',
  'Round of 16': 'r16',
  'Quarter-finals': 'qf',
  'Semi-finals': 'sf',
  '3rd Place Final': '3rd',
  'Final': 'final',
};

function normalizeRound(round) {
  if (!round) return 'group';
  if (ROUND_MAP[round]) return ROUND_MAP[round];
  if (round.indexOf('Group Stage') === 0) return 'group';
  return round.toLowerCase().replace(/\s+/g, '_');
}

function normalizeTeam(name) {
  return TEAM_NAME_MAP[name] || name;
}

function fetchResults() {
  var props = PropertiesService.getScriptProperties();
  var apiKey = props.getProperty('FOOTBALL_API_KEY');
  var spreadsheetId = props.getProperty('SPREADSHEET_ID');
  var sheetName = props.getProperty('RESULTS_SHEET_NAME') || 'Resultados';

  if (!apiKey || !spreadsheetId) {
    Logger.log('ERROR: FOOTBALL_API_KEY or SPREADSHEET_ID not set in Script Properties');
    return;
  }

  var ss = SpreadsheetApp.openById(spreadsheetId);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  var existingData = sheet.getDataRange().getValues();
  var idToRow = {};
  for (var i = 0; i < existingData.length; i++) {
    var matchId = existingData[i][0];
    if (matchId) idToRow[String(matchId)] = i;
  }

  var url = 'https://v3.football.api-sports.io/fixtures?league=1&season=2026';
  var response = UrlFetchApp.fetch(url, {
    headers: { 'x-apisports-key': apiKey },
    muteHttpExceptions: true,
  });

  if (response.getResponseCode() !== 200) {
    Logger.log('API error: ' + response.getContentText());
    return;
  }

  var json = JSON.parse(response.getContentText());
  var fixtures = json.response || [];
  Logger.log('Fixtures fetched: ' + fixtures.length);

  var allowedStatuses = { 'FT': true, 'NS': true, 'LIVE': true, '1H': true, 'HT': true, '2H': true };

  for (var j = 0; j < fixtures.length; j++) {
    var f = fixtures[j];
    var status = f.fixture.status.short;
    if (!allowedStatuses[status]) continue;

    var matchId = f.fixture.id;
    var homeTeam = normalizeTeam(f.teams.home.name);
    var awayTeam = normalizeTeam(f.teams.away.name);
    var homeGoals = f.goals.home !== null && f.goals.home !== undefined ? f.goals.home : '';
    var awayGoals = f.goals.away !== null && f.goals.away !== undefined ? f.goals.away : '';
    var normalStatus = (status === '1H' || status === 'HT' || status === '2H') ? 'LIVE' : status;
    var round = normalizeRound(f.league.round);
    var date = f.fixture.date || '';

    var row = [matchId, homeTeam, awayTeam, homeGoals, awayGoals, normalStatus, round, date];
    var key = String(matchId);

    if (idToRow.hasOwnProperty(key)) {
      var rowIdx = idToRow[key];
      for (var c = 0; c < row.length; c++) {
        existingData[rowIdx][c] = row[c];
      }
    } else {
      idToRow[key] = existingData.length;
      existingData.push(row);
    }
  }

  if (existingData.length > 0) {
    sheet.clearContents();
    sheet.getRange(1, 1, existingData.length, 8).setValues(existingData);
  }

  Logger.log('Done. Rows in sheet: ' + existingData.length);
}

function setupTrigger() {
  clearTriggers();
  ScriptApp.newTrigger('fetchResults')
    .timeBased()
    .everyHours(1)
    .create();
  Logger.log('Hourly trigger created for fetchResults');
}

function clearTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  Logger.log('All triggers cleared');
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, ts: new Date().toISOString() }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

- [ ] **Step 2: Set Script Properties in Apps Script editor**

In the Apps Script editor (script.google.com), go to Project Settings → Script Properties and add:

| Key | Value |
|-----|-------|
| `FOOTBALL_API_KEY` | your API-Football key |
| `SPREADSHEET_ID` | your Google Spreadsheet ID |
| `RESULTS_SHEET_NAME` | `Resultados` |

- [ ] **Step 3: Run fetchResults manually to verify**

In the Apps Script editor, select `fetchResults` and click Run. Check Execution log for "Fixtures fetched: NNN" and "Done. Rows in sheet: NNN". Open the spreadsheet and verify the "Resultados" tab has data.

- [ ] **Step 4: Set up the hourly trigger**

In the Apps Script editor, select `setupTrigger` and click Run. Go to Triggers (clock icon) and verify a trigger for `fetchResults` running every hour is listed.

- [ ] **Step 5: Commit**

```bash
git add apps-script/Code.gs
git commit -m "feat: add Apps Script to fetch API-Football results hourly"
```

---

## Task 11: End-to-End Browser Test

No automated tests — verify the full flow manually.

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test ClasificacionPage (`/`)**

- Ranking table renders with correct positions
- Rows 1–3 have gold/silver/bronze styling (`.top1`, `.top2`, `.top3`)
- Clicking any row opens the participant detail modal
- Modal shows all team flags and points breakdown
- "Actualizar" button re-fetches and updates the table

- [ ] **Step 3: Test EquiposPage (`/equipos`)**

- All teams with matches appear in the table
- Sorted by Pts descending
- Flags display correctly; unknown names show 🏳
- GF/GC/V/E/D columns show correct values

- [ ] **Step 4: Test PartidosPage (`/partidos`)**

- Completed matches grouped by phase label
- Phases ordered: Fase de grupos → 1/16 → Octavos → Cuartos → Semis → Tercer puesto → Final
- Scores shown as `X–Y`; LIVE scores shown in red

- [ ] **Step 5: Test navigation**

- All three tabs navigate correctly
- Active tab is highlighted
- Countdown in header counts down to tournament start (or is hidden if tournament started)

- [ ] **Step 6: Test responsive layout**

- At mobile width (<600px): ClasificacionPage shows 3 columns (Pos, Nombre, Pts); @Telegram and Equipos columns hidden
- EquiposPage and PartidosPage scroll horizontally if needed on narrow screens

- [ ] **Step 7: Test error states**

Temporarily remove `VITE_SPREADSHEET_ID` from `.env.local`, restart dev server. All three pages should show the config error message instead of crashing.

- [ ] **Step 8: Final build check**

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds with no errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: end-to-end verification complete"
```
