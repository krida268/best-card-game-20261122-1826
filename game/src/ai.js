// Senja Duel — logika lawan (AI serakah yang bisa dibaca).
// Urutan pikir AI: (1) spell lethal kalau bisa menang sekarang,
// (2) mainkan creature ke jalur kosong, termurah dulu,
// (3) mainkan creature yang mengalahkan creature lawan di jalurnya,
// (4) pakai sisa mana untuk spell damage / heal saat nyawa rendah.
import { CARD_BY_ID, LANES } from './config.js';
import { canPlayCard, playCard, resolveCombat, startTurn } from './state.js';

function laneScore(game, lane, def) {
  const foe = game.player.lanes[lane];
  if (!foe) return 10 + def.attack; // jalur kosong: damage langsung tiap giliran
  if (def.attack >= foe.health && def.health > foe.attack) return 8; // menang duel, selamat
  if (def.attack >= foe.health) return 5; // bunuh lawan tapi ikut gugur
  if (def.health > foe.attack) return 3; // bertahan, tahan damage
  return 2; // kalah duel tapi tetap melunakkan lawan sebelum gugur
}

/** Jalankan satu giliran AI penuh: main kartu, lalu combat. */
export function runAiTurn(game) {
  if (game.phase !== 'play' || game.active !== 'ai') return;
  const ai = game.ai;
  // 1. Lethal: spell damage yang menghabisi nyawa pemain.
  for (let i = 0; i < ai.hand.length; i += 1) {
    const def = CARD_BY_ID[ai.hand[i].id];
    if (def.kind === 'spell' && def.effect.damage && def.effect.damage >= game.player.life && ai.mana >= def.cost) {
      playCard(game, 'ai', i, null);
      break;
    }
  }
  // 2. Creature: ulangi sampai tidak ada langkah yang menguntungkan.
  let moved = true;
  while (moved && game.phase === 'play') {
    moved = false;
    let best = null;
    for (let i = 0; i < ai.hand.length; i += 1) {
      const def = CARD_BY_ID[ai.hand[i].id];
      if (def.kind !== 'creature') continue;
      for (let lane = 0; lane < LANES; lane += 1) {
        const check = canPlayCard(game, 'ai', i, lane);
        if (!check.ok) continue;
        const score = laneScore(game, lane, def) - def.cost;
        if (!best || score > best.score) best = { i, lane, score };
      }
    }
    if (best && best.score > 0) {
      playCard(game, 'ai', best.i, best.lane);
      moved = true;
    }
  }
  // 3. Sisa mana: spell damage kalau lawan sekarat, heal kalau nyawa rendah,
  // draw kalau tangan menipis. Hanya ulangi indeks yang sama kalau spell
  // benar-benar terpakai.
  for (let i = 0; i < ai.hand.length && game.phase === 'play'; i += 1) {
    const def = CARD_BY_ID[ai.hand[i].id];
    if (def.kind !== 'spell' || ai.mana < def.cost) continue;
    if (def.effect.damage && (game.player.life <= 10 || ai.mana >= def.cost)) {
      if (playCard(game, 'ai', i, null).ok) i -= 1;
    } else if (def.effect.heal && ai.life <= 12) {
      if (playCard(game, 'ai', i, null).ok) i -= 1;
    } else if (def.effect.draw && ai.hand.length <= 4) {
      if (playCard(game, 'ai', i, null).ok) i -= 1;
    }
  }
  // 4. Combat lalu kembalikan giliran ke pemain (nomor giliran sudah
  // naik di endPlayerTurn, jadi di sini tidak dinaikkan lagi).
  if (game.phase !== 'play') return;
  resolveCombat(game);
  if (game.phase !== 'play') return;
  startTurn(game, 'player');
}
