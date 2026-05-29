# Porra Mundial 2026

Aplicación de porra del Mundial 2026. Cada participante elige 13 selecciones al inicio del torneo y acumula puntos automáticamente según los resultados reales.

## Stack

- **Vite 8 + React 19** (JSX)
- **React Router DOM v7**
- **Google Sheets API v4** (lectura de datos: participantes + resultados)
- **Google Apps Script** (sincronización de resultados vía football-data.org)
- **Vercel** (hosting + analytics)
- **Tema Atom One Dark**

## Rutas

| Ruta | Página |
|---|---|
| `/` | **Clasificación general** — ranking con filtros por nombre y provincia, columnas ordenables, modal con desglose por equipo |
| `/score-jpit` | **Clasificación JPIT** — ranking de provincias sumando solo los 3 mejores participantes de cada una |
| `/grupos` | **Fase de grupos** — 12 grupos (A–L) con tablas, resultados, 1.º/2.º en verde y 8 mejores terceros en dorado |
| `/partidos` | **Partidos** — calendario agrupado por fase y día, resultados en vivo |
| `/equipos` | **Estadísticas por equipo** — puntos, PJ, V/E/D, GF/GC, tarjetas rojas, desglose con acrónimos y leyenda interactiva |
| `/info` | **Información** — reglas, sistema de puntuación, reparto del bote y créditos |

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

## Sistema de puntuación

Cada equipo elegido por un participante suma puntos según su rendimiento real en el torneo:

### Por resultados en partido

| Concepto | Puntos |
|---|---|
| Victoria | 3 |
| Empate | 1 |
| Portería a cero (no recibir goles) | 1 |
| 3+ goles en un partido | 1 (plano, no acumulable) |

### Por fase alcanzada (acumulativo)

| Fase | Pts fase |
|---|---|
| Dieciseisavos (R32) | 1 |
| Octavos (R16) | 2 |
| Cuartos (QF) | 3 |
| Semifinales (SF) | 4 |
| 3.er / 4.º puesto | 0 |
| Final (subcampeón) | 5 |

### Bonus

| Concepto | Puntos |
|---|---|
| Campeón del mundo | +10 |

### Totales por posición final

| Posición | Cálculo | Total |
|---|---|---|
| 3.º / 4.º | 1+2+3+4+0 | **10** |
| Subcampeón | 1+2+3+4+5 | **15** |
| Campeón | 15 + 10 (bonus) | **25** |

Las tarjetas rojas se muestran como estadística pero no restan puntos.

### Desglose de puntuación (acrónimos)

Cada fila de equipo muestra un desglose con los acrónimos:

| Sigla | Significado |
|---|---|
| **V** | Puntos por victorias (3 c/u) |
| **E** | Puntos por empates (1 c/u) |
| **PG** | Puntos por portería a cero (1 c/u) |
| **G** | Puntos por 3+ goles en un partido (1 c/u) |
| **F** | Puntos acumulados por fase alcanzada |
| **C** | Bonus de campeón (+10) |

### Desempates

1. Mayor número de puntos totales
2. Mayor número de goles a favor (GF)
3. Menor número de goles en contra (GC)
4. Orden alfabético del nombre

## Clasificación JPIT (por provincia)

- Solo suman los **3 mejores participantes** de cada provincia
- En el modal: los que suman aparecen en verde con `+`, el resto en amarillo como "No suma"
- Se ordena por puntos, con tie-breakers de GF/GC

## Fase de grupos

- 12 grupos (A–L) de 4 equipos cada uno
- Los 2 primeros de cada grupo → verdes (`gtable-row--qual`)
- Los **8 mejores terceros** → dorados (`gtable-row--qual3rd`)
- Cálculo automático de standings desde resultados reales

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

## Funcionalidades

- ✅ Formulario de apuesta (Google Forms → Sheets)
- ✅ Ranking en tiempo real con filtros y ordenación
- ✅ Ranking por provincia (top 3 participantes de cada provincia)
- ✅ Tablas de la fase de grupos (12 grupos A–L, standings calculados desde resultados)
- ✅ Mejores 8 terceros destacados en dorado
- ✅ Estadísticas detalladas por equipo con desglose V/E/PG/G/F/C
- ✅ Leyenda interactiva de acrónimos de puntuación
- ✅ Calendario de partidos con estados en vivo
- ✅ Cuenta atrás para el inicio del torneo
- ✅ Sincronización automática de resultados vía football-data.org
- ✅ Polling cada 60s cuando hay partidos en vivo
- ✅ Tema oscuro Atom One Dark
- ✅ Banderas de equipos desde flagcdn.com
- ✅ Analytics con Vercel
- ✅ Grupos del Mundial 2026 hardcodeados en `src/data/gruposMundial.js` (48 equipos, 12 grupos A–L)
- ✅ Página de información con reglas, premios y créditos
- ✅ Footer con enlaces

## Estructura del proyecto

```
src/
├── components/
│   ├── Header.jsx        # Hero + cuenta atrás + tabs de navegación
│   └── Footer.jsx        # Footer con créditos
├── data/
│   ├── paises.js         # 48 países organizados en 5 grupos para el formulario
│   └── gruposMundial.js  # Grupos oficiales del Mundial (A–L)
├── hooks/
│   └── useSheetData.js   # Hook de datos vía Google Sheets API
├── lib/
│   ├── normalizeSheetData.js  # Parseo de respuestas y resultados
│   ├── scoring.js              # Sistema de puntuación completo
│   └── utils.jsx               # Utilidades (normKey, flagEl)
├── pages/
│   ├── ClasificacionPage.jsx  # Ranking general
│   ├── ScoreJpitPage.jsx      # Ranking por provincia (top 3)
│   ├── GruposPage.jsx         # Fase de grupos
│   ├── EquiposPage.jsx        # Estadísticas por equipo
│   ├── PartidosPage.jsx       # Calendario de partidos
│   └── InfoPage.jsx           # Reglas e información
├── styles/
│   └── global.css             # Todos los estilos (Atom One Dark)
├── App.jsx                    # Router principal
└── main.jsx                   # Entry point
```

## Licencia

Código abierto. Fork del proyecto original de [josecggarrido](https://github.com/josecggarrido).
Editado y mantenido por [Edu García](https://github.com/egz-dev/porra-mundial).

## Contribuciones

¡Las contribuciones son bienvenidas! Consulta [`CONTRIBUTING.md`](./CONTRIBUTING.md) para más detalles.
