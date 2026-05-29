# Contribuir a Porra Mundial 2026

Gracias por tu interés en contribuir. Aquí tienes todo lo necesario para empezar.

## Primeros pasos

```bash
git clone <repo>
cd porra-mundial
pnpm install
```

Crea `.env.local` con las variables de entorno (consulta [README.md](./README.md#1-variables-de-entorno)). Sin ellas la app no cargará datos reales, pero puedes hacer cambios de UI y lógica sin problema.

```bash
pnpm dev        # servidor de desarrollo en localhost:5173
pnpm lint       # ESLint
pnpm build      # compilación de producción
```

## Estructura del proyecto

```
src/
├── App.jsx                    # Router principal
├── main.jsx                   # Punto de entrada
├── components/
│   └── Header.jsx             # Header, cuenta atrás y tabs
├──  data/
│   ├── paises.js              # 48 países agrupados en 5 grupos + helpers de banderas
│   ├── gruposMundial.js       # 12 grupos (A-L) del Mundial 2026 con los 48 equipos
│   └── eliminatorias.js       # Bracket de eliminatorias (R32 → final) con emparejamientos
├── hooks/
│   └── useSheetData.js        # Fetch de Google Sheets API v4 + polling automático
├── lib/
│   ├── normalizeSheetData.js  # Parseo de filas de Sheets → participantes / resultados
│   └── scoring.js             # Motor de puntuación (equipos, fases, desempates)
├──  pages/
│   ├── ClasificacionPage.jsx  # Ranking con filtros y columnas ordenables
│   ├── ScoreJpitPage.jsx      # Ranking por provincia
│   ├── GruposPage.jsx         # Tablas de la fase de grupos (standings calculados desde resultados)
│   ├── EliminatoriasPage.jsx  # Cuadro de eliminatorias con bracket interactivo
│   ├── EquiposPage.jsx        # Estadísticas por equipo
│   └── PartidosPage.jsx       # Calendario agrupado por fase y día
└── styles/
    └── global.css             # Tema Atom One Dark
```

## Cómo funciona

### Datos

La app lee de dos pestañas de Google Sheets vía la [Sheets API v4](https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/batchGet):

| Pestaña | Contenido |
|---|---|
| `Respuestas` | Apuestas de participantes vía Google Forms |
| `Resultados` | Partidos y resultados, rellenados por Apps Script |

El hook `useSheetData()` expone `{ participantes, resultados, loading, error, refresh }`. Hace polling cada 60 segundos si detecta partidos con estado `LIVE`.

### Puntuación

`scoring.js` asigna puntos a cada equipo según su rendimiento real:

| Evento | Puntos |
|---|---|
| Victoria / empate / portería a cero / bonus goles | Puntos de partido |
| Alcanzar una fase (r32 → final) | Puntos de fase |
| Equipo campeón del torneo | +10 bonus |

El ranking se ordena por puntos totales → GF → GC → nombre. Las tarjetas rojas se muestran pero no descuentan puntos.

### Apps Script

`apps-script/Code.gs` consulta [football-data.org](https://www.football-data.org/) cada hora (o cada 15 min durante el torneo) y escribe los resultados en la pestaña `Resultados`. Incluye:

- `preloadFixtures()` — carga inicial de partidos del Mundial
- `fetchResults()` — actualización periódica de resultados
- `setupTrigger()` / `setupLiveTrigger()` — programa la ejecución automática

## Convenciones de código

- **ESM**: `import`/`export`, no `require`. El proyecto es `"type": "module"`.
- **JSX con React 19**: componentes funcionales con hooks, sin clases.
- **CSS**: variables CSS personalizadas en `:root`; naming con BEM informal (`.hero`, `.rank-row`, `.partido-score--live`). Usa `var(--c-*)` para colores.
- **Formato**: ESLint (`@eslint/js` + `react-hooks` + `react-refresh`). Ejecuta `pnpm lint` antes de commitear.
- **Nombres**: camelCase para variables/funciones, PascalCase para componentes, kebab-case para clases CSS.
- **Sin TypeScript**: el proyecto usa JSX puro con React 19.

## Flujo de trabajo

1. **Elige o crea un issue** — describe qué vas a cambiar.
2. **Crea una rama** — `git checkout -b feature/descripcion-corta`.
3. **Haz tus cambios** — respeta las convenciones de arriba.
4. **Lint** — `pnpm lint` debe pasar sin errores.
5. **Prueba** — arranca `pnpm dev` y verifica manualmente que todo funcione.
6. **Abre un PR** — explica qué cambiaste y por qué. Si afecta a la UI, incluye una captura.

### Antes de enviar el PR

- [ ] `pnpm lint` pasa limpio
- [ ] `pnpm build` compila sin warnings
- [ ] Probado en un navegador real con `pnpm dev`
- [ ] Los cambios de estilo usan variables CSS existentes y se ven bien en tema oscuro

## Añadir equipos

Los 48 países están definidos en `src/data/paises.js` agrupados en 5 grupos. Para añadir o modificar un país:

1. Edita el array del grupo correspondiente con `{ n, nombre, iso }`.
2. Si añades un país con nombre distinto al que devuelve football-data.org, añade la traducción en `apps-script/Code.gs` → `TEAM_NAME_MAP`.
3. Ajusta el campo `elegir` del grupo si cambia el número de equipos a seleccionar.

## Añadir una página nueva

1. Crea el componente en `src/pages/`.
2. Añade la ruta en `src/App.jsx`.
3. Añade la pestaña en `src/components/Header.jsx` → array `TABS`.

## Dependencias externas

Antes de añadir una dependencia, considera si realmente la necesitas. El proyecto es ligero a propósito. Si decides añadirla:

```bash
pnpm add <paquete>           # dependencia de producción
pnpm add -D <paquete>        # dependencia de desarrollo
```
