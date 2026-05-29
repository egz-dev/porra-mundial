// Grupos oficiales del Mundial 2026 (12 grupos × 4 equipos)
// Sorteo: 5 diciembre 2025 | Torneo: 11 junio – 19 julio 2026
// Fuente: FIFA / MLSSoccer.com

export const GRUPOS_MUNDIAL = [
  {
    id: 'A',
    equipos: ['México', 'Sudáfrica', 'Corea del Sur', 'República Checa'],
  },
  {
    id: 'B',
    equipos: ['Canadá', 'Bosnia-Herzegovina', 'Catar', 'Suiza'],
  },
  {
    id: 'C',
    equipos: ['Brasil', 'Marruecos', 'Haití', 'Escocia'],
  },
  {
    id: 'D',
    equipos: ['EEUU', 'Paraguay', 'Australia', 'Turquía'],
  },
  {
    id: 'E',
    equipos: ['Alemania', 'Curaçao', 'Costa de Marfil', 'Ecuador'],
  },
  {
    id: 'F',
    equipos: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'],
  },
  {
    id: 'G',
    equipos: ['Bélgica', 'Egipto', 'Irán', 'Nueva Zelanda'],
  },
  {
    id: 'H',
    equipos: ['España', 'Cabo Verde', 'Arabia Saudí', 'Uruguay'],
  },
  {
    id: 'I',
    equipos: ['Francia', 'Senegal', 'Irak', 'Noruega'],
  },
  {
    id: 'J',
    equipos: ['Argentina', 'Argelia', 'Austria', 'Jordania'],
  },
  {
    id: 'K',
    equipos: ['Portugal', 'Rep. Dem. del Congo', 'Uzbekistán', 'Colombia'],
  },
  {
    id: 'L',
    equipos: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá'],
  },
];

// Mapa: nombre de equipo → grupo (para lookup rápido)
export const TEAM_TO_GROUP = new Map();
for (const g of GRUPOS_MUNDIAL) {
  for (const t of g.equipos) {
    TEAM_TO_GROUP.set(t, g.id);
  }
}
