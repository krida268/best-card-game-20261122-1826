// Senja Duel — staging screenshot deterministik dan selftest.
// ?shot=title|play|win|loss&seed=N me-render scene itu langsung saat load,
// tanpa interaksi. ?selftest=1 memainkan game penuh otomatis (autopilot
// kedua pihak) lalu menulis PASS/FAIL + ringkasan ke document.title dan
// <pre id="selftest">.
import { CARD_BY_ID, LANES } from './config.js';
import { createGame, PHASE_LOSS, PHASE_PLAY, PHASE_WIN, canPlayCard, endPlayerTurn, playCard, startGame } from './state.js';
import { runAiTurn } from './ai.js';

/** Autopilot serakah untuk satu pihak: mainkan kartu terbaik yang bisa. */
export function autopilotPlay(game, who) {
  const side = who === 'player' ? game.player : game.ai;
  let moved = true;
  while (moved && game.phase === PHASE_PLAY) {
    moved = false;
    let best = null;
    for (let i = 0; i < side.hand.length; i += 1) {
      const def = CARD_BY_ID[side.hand[i].id];
      if (def.kind === 'spell') {
        if (def.effect.damage && side.mana >= def.cost) {
          const foeLife = (who === 'player' ? game.ai : game.player).life;
          if (def.effect.damage >= foeLife || side.mana >= def.cost + 3) {
            playCard(game, who, i, null);
            moved = true;
            break;
          }
        } else if (def.effect.heal && side.life <= 12 && side.mana >= def.cost) {
          playCard(game, who, i, null);
          moved = true;
          break;
        } else if (def.effect.draw && side.mana >= def.cost && side.hand.length <= 4) {
          playCard(game, who, i, null);
          moved = true;
          break;
        }
        continue;
      }
      for (let lane = 0; lane < LANES; lane += 1) {
        const check = canPlayCard(game, who, i, lane);
        if (!check.ok) continue;
        const foe = (who === 'player' ? game.ai : game.player).lanes[lane];
        let score = 10 + def.attack - def.cost;
        if (foe) score = def.attack >= foe.health ? 8 : 2;
        if (!best || score > best.score) best = { i, lane, score };
      }
    }
    if (best && best.score > 0) {
      playCard(game, who, best.i, best.lane);
      moved = true;
    }
  }
}

/** Mainkan satu game penuh dari seed; kembalikan game yang sudah selesai. */
export function playFullGame(seed) {
  const game = createGame(seed);
  startGame(game);
  let guard = 0;
  while (game.phase === PHASE_PLAY && guard < 400) {
    guard += 1;
    if (game.active === 'player') {
      autopilotPlay(game, 'player');
      if (game.phase !== PHASE_PLAY) break;
      endPlayerTurn(game);
      if (game.phase !== PHASE_PLAY) break;
      runAiTurn(game);
    } else {
      runAiTurn(game);
    }
  }
  return game;
}

/** Cari seed yang menghasilkan pemenang yang diminta (deterministik). */
function findSeedForWinner(winner, baseSeed) {
  for (let offset = 0; offset < 60; offset += 1) {
    const game = playFullGame(baseSeed + offset * 7919);
    if ((winner === 'player' && game.phase === PHASE_WIN) || (winner === 'ai' && game.phase === PHASE_LOSS)) {
      return game;
    }
  }
  return playFullGame(baseSeed);
}

/** Siapkan scene bernama dan kembalikan layar yang harus digambar. */
export function stageShot(name, seed) {
  if (name === 'title') {
    const game = createGame(seed);
    game.floats = [];
    return { game, screen: 'title' };
  }
  if (name === 'win') {
    const game = findSeedForWinner('player', seed);
    game.floats = [];
    return { game, screen: 'win' };
  }
  if (name === 'loss') {
    const game = findSeedForWinner('ai', seed);
    game.floats = [];
    return { game, screen: 'loss' };
  }
  // play: cari seed yang gamenya masih berjalan di giliran ke-4/5,
  // giliran pemain, kedua nyawa masih di atas 0 — meja tengah permainan.
  for (let offset = 0; offset < 30; offset += 1) {
    const game = createGame(seed + offset * 7919);
    startGame(game);
    let guard = 0;
    while (game.phase === PHASE_PLAY && game.turn <= 4 && guard < 200) {
      guard += 1;
      if (game.active === 'player') {
        autopilotPlay(game, 'player');
        if (game.phase !== PHASE_PLAY) break;
        endPlayerTurn(game);
        if (game.phase !== PHASE_PLAY) break;
        runAiTurn(game);
      } else {
        runAiTurn(game);
      }
    }
    if (game.phase === PHASE_PLAY && game.active === 'player' && game.player.life > 0 && game.ai.life > 0) {
      game.floats = [];
      return { game, screen: 'play' };
    }
  }
  // Cadangan: game pertama apa pun keadaannya, tanpa angka melayang.
  const fallback = createGame(seed);
  startGame(fallback);
  fallback.floats = [];
  return { game: fallback, screen: 'play' };
}

/** Selftest: mainkan 5 game dari seed berbeda, laporkan hasilnya. */
export function runSelfTest() {
  const results = [];
  let pass = true;
  for (let s = 1; s <= 5; s += 1) {
    const game = playFullGame(s * 101);
    const finished = game.phase === PHASE_WIN || game.phase === PHASE_LOSS;
    const sane = game.player.life >= 0 && game.ai.life >= 0 && game.stats.cardsPlayed > 0;
    const ok = finished && sane;
    if (!ok) pass = false;
    results.push(
      `seed ${s * 101}: ${finished ? (game.phase === PHASE_WIN ? 'pemain menang' : 'lawan menang') : 'BELUM SELESAI'} ` +
      `giliran ${game.turn}, nyawa ${game.player.life}-${game.ai.life}, kartu dimainkan ${game.stats.cardsPlayed}, ` +
      `damage ${game.stats.damageDealt} — ${ok ? 'OK' : 'GAGAL'}`,
    );
  }
  const summary = `${pass ? 'PASS' : 'FAIL'}: 5 game selftest, ${results.filter((r) => r.includes('OK')).length}/5 selesai dengan pemenang`;
  return { pass, summary, lines: [summary, ...results] };
}
