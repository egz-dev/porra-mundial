// Estructura del bracket de eliminatorias del Mundial 2026
// 32 equipos: 12 ganadores de grupo + 12 segundos + 8 mejores terceros

function slotLabel(seed) {
  if (seed.startsWith('W')) return `1.° ${seed.slice(1)}`;
  if (seed.startsWith('R')) return `2.° ${seed.slice(1)}`;
  if (seed.startsWith('3')) return `3.° ${seed.slice(1)}`;
  return seed;
}

// R32 pairings based on World Cup 2026 bracket
const R32_PAIRINGS = [
  { id: 'r32-1',  home: 'WA',  away: '3C/D/E' },
  { id: 'r32-2',  home: 'RC',  away: 'RD' },
  { id: 'r32-3',  home: 'WE',  away: '3A/B/F' },
  { id: 'r32-4',  home: 'RA',  away: 'RB' },
  { id: 'r32-5',  home: 'WC',  away: '3G/H/I' },
  { id: 'r32-6',  home: 'RE',  away: 'RF' },
  { id: 'r32-7',  home: 'WG',  away: '3J/K/L' },
  { id: 'r32-8',  home: 'RH',  away: 'RI' },
  { id: 'r32-9',  home: 'WD',  away: '3E/F/G' },
  { id: 'r32-10', home: 'RJ',  away: 'RK' },
  { id: 'r32-11', home: 'WF',  away: '3A/B/C' },
  { id: 'r32-12', home: 'RG',  away: 'RL' },
  { id: 'r32-13', home: 'WH',  away: '3D/E/I' },
  { id: 'r32-14', home: 'WB',  away: '3A/F/H' },
  { id: 'r32-15', home: 'WI',  away: '3C/F/G' },
  { id: 'r32-16', home: 'WL',  away: '3D/G/J' }
];

function buildBracket() {
  const rounds = ['r32','r16','qf','sf'];
  const counts = [16, 8, 4, 2];

  const allMatches = [];

  for (let ri = 0; ri < rounds.length; ri++) {
    const round = rounds[ri];
    const count = counts[ri];
    for (let i = 0; i < count; i++) {
      const id = `${round}-${i + 1}`;
      let nextMatch = null;
      let nextPos = null;

      if (ri < rounds.length - 1) {
        const nextRound = rounds[ri + 1];
        nextMatch = `${nextRound}-${Math.floor(i / 2) + 1}`;
        nextPos = i % 2 === 0 ? 'home' : 'away';
      }

      const label = ri === 0
        ? (R32_PAIRINGS[i] ? `${slotLabel(R32_PAIRINGS[i].home)} vs ${slotLabel(R32_PAIRINGS[i].away)}` : `${round}-${i + 1}`)
        : null;

      allMatches.push({ id, round, label, nextMatch, nextPos, index: i });
    }
  }

  allMatches.push({ id: '3rd-1', round: '3rd', label: 'Perdedor SF1 vs Perdedor SF2', nextMatch: null, nextPos: null, index: 0 });
  allMatches.push({ id: 'final-1', round: 'final', label: 'Ganador SF1 vs Ganador SF2', nextMatch: null, nextPos: null, index: 1 });

  return allMatches;
}

export const BRACKET = buildBracket();

export const ROUND_LABELS = {
  r32: 'Dieciseisavos',
  r16: 'Octavos',
  qf: 'Cuartos de final',
  sf: 'Semifinales',
  '3rd': '3.er puesto',
  final: 'Final',
};
