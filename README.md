# Porra Mundial 2026

Aplicación de porra del Mundial 2026. Cada participante elige 13 selecciones al inicio del torneo y acumula puntos automáticamente según los resultados reales.

## Stack

- Vite 8 + React 19 (JSX)
- React Router DOM v7
- Google Sheets API v4 (lectura de datos)
- Google Apps Script (sincronización de resultados vía football-data.org)
- Vercel (hosting + analytics)
- Tema Atom One Dark

## Rutas

| Ruta | Página |
|---|---|
| `/` | Clasificación general — ranking con filtros por nombre y provincia, columnas ordenables |
| `/score-jpit` | Clasificación por provincia — ranking de provincias con suma de puntos de sus participantes |
| `/grupos` | Fase de grupos del Mundial — 12 grupos (A-L) con tablas de clasificación, resultados y banderas |
| `/eliminatorias` | Cuadro de eliminatorias — bracket de dieciseisavos a la final con resultados en vivo |
| `/equipos` | Estadísticas por equipo — puntos, partidos jugados, goles, tarjetas rojas, fase alcanzada |
| `/partidos` | Calendario de partidos — agrupados por fase y día, resultados y estados en vivo |

## Arquitectura

```
Google Sheets (Respuestas + Resultados)
        ↑                          ↓
   Google Forms              Apps Script
 (apuestas de               (fetchResults()
  participantes)          ← football-data.org API)
        ↓                          ↑
   Sheets API v4              Trigger horario
   (useSheetData)             / cada 15 min en vivo
        ↓
   React App (Vite)
   └── scoring.js → clasificación + stats
```

## Configuración

### 1. Variables de entorno

Crea `.env.local` con:

```bash
VITE_SPREADSHEET_ID=tu_spreadsheet_id
VITE_SHEETS_API_KEY=tu_api_key_de_google_sheets
VITE_GROUP_NAME=Nombre del grupo
```

### 2. Google Sheets

La hoja de cálculo necesita dos pestañas:

**`Respuestas`** — respuestas del formulario de apuestas (columnas A:Q):

| A | B | C | D | E…Q |
|---|---|---|---|---|
| timestamp | — | nombre | provincia | 13 equipos separados por coma |

> El formulario de Google se configura para que el participante elija sus 13 equipos respetando los grupos (1 del grupo 1, 2 del grupo 2, 4 del grupo 3, 3 del grupo 4, 3 del grupo 5).

**`Resultados`** — rellenada automáticamente por Apps Script (columnas A:J):

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| matchId | local | visitante | goles local | goles visitante | status | fase | fecha | rojas local | rojas visitante |

### 3. Google Apps Script

1. En la hoja, abre **Extensiones > Apps Script**.
2. Pega `apps-script/Code.gs`.
3. En **Propiedades del script** añade:
   - `SPREADSHEET_ID` — ID de la hoja (está en la URL)
   - `FOOTBALL_API_KEY` — API key de [football-data.org](https://www.football-data.org/)
4. Ejecuta `preloadFixtures()` una vez para cargar los partidos del Mundial.
5. Configura el trigger:
   - `setupTrigger()` → cada hora (fuera del torneo)
   - `setupLiveTrigger()` → cada 15 minutos (durante el torneo)

### 4. Desarrollo local

```bash
pnpm install
pnpm dev
```

### 5. Deploy en Vercel

```bash
pnpm build
# output en dist/
```

Conecta el repo a Vercel. En Settings > Environment Variables, añade `VITE_SPREADSHEET_ID`, `VITE_SHEETS_API_KEY` y `VITE_GROUP_NAME`.

## Sistema de puntuación

Cada equipo elegido por un participante suma puntos según su rendimiento real en el torneo:

| Concepto | Puntos |
|---|---|
| Victoria | 3 |
| Empate | 1 |
| Portería a cero | 1 |
| Bonus de goles (cada 3 goles) | 1 |
| Alcanzar dieciseisavos | 1 |
| Alcanzar octavos | 2 |
| Alcanzar cuartos | 3 |
| Alcanzar semifinales | 4 |
| Alcanzar final / 3er puesto | 5 |
| Bonus campeón | 10 |

Las tarjetas rojas restan visibilidad pero no puntos.

### Desempates

1. Mayor número de puntos totales
2. Mayor número de goles a favor (GF)
3. Menor número de goles en contra (GC)
4. Orden alfabético del nombre

## Funcionalidades

- ✅ Formulario de apuesta (Google Forms → Sheets)
- ✅ Ranking en tiempo real con filtros y ordenación
- ✅ Ranking por provincia (suma de puntos de todos los participantes de cada provincia)
- ✅ Tablas de la fase de grupos (12 grupos A-L, standings calculados desde resultados reales)
- ✅ Cuadro de eliminatorias (bracket R32 → R16 → QF → SF → 3.er puesto / Final)
- ✅ Estadísticas detalladas por equipo
- ✅ Calendario de partidos con estados en vivo
- ✅ Cuenta atrás para el inicio del torneo
- ✅ Sincronización automática de resultados vía football-data.org
- ✅ Polling cada 60s cuando hay partidos en vivo
- ✅ Tema oscuro Atom One Dark
- ✅ Banderas de equipos desde flagcdn.com
- ✅ Analytics con Vercel
- ✅ Grupos del Mundial 2026 hardcodeados en `src/data/gruposMundial.js` (48 equipos)
- ✅ Bracket de eliminatorias hardcodeado en `src/data/eliminatorias.js` (R32 con emparejamientos A-L)
