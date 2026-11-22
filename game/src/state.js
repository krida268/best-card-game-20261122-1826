// Senja Duel — state game, alur giliran, dan resolusi combat.
// Satu creature menempati satu jalur. Di akhir giliran, creature menyerang
// creature di jalur yang sama; kelebihan damage mengenai nyawa lawan.
import {
  CARD_BY_ID,
  DECK_LIST,
  HAND_MAX,
  HAND_START,
  LANES,
  MAX_MANA,
  MAX_TURNS,
  START_LIFE,
} from './config.js';
import { buildDeck, createRng, drawCard } from './deck.js';

export const PHASE_TITLE = 'title';
export const PHASE_PLAY = 'play';
export const PHASE_WIN = 'win';
export const PHASE_LOSS = 'loss';

export function makeSide(deckIds, rng) {
  return {
    life: START_LIFE,
    maxMana: 0,
    mana: 0,
    deck: buildDeck(deckIds, rng),
    hand: [],
    lanes: Array.from({ length: LANES }, () => null),
  };
}

export function createGame(seed) {
  const rng = createRng(seed);
  const game = {
    seed,
    rng,
    phase: PHASE_TITLE,
    turn: 1,
    active: 'player', // 'player' | 'ai'
    player: makeSide(DECK_LIST, rng),
    ai: makeSide(DECK_LIST, rng),
    stats: { turns: 0, cardsPlayed: 0, damageDealt: 0, damageTaken: 0 },
    log: [],
    floats: [], // angka damage melayang {x, y, text, color, life}
    animations: [], // kartu meluncur {cardId, fromX, fromY, toX, toY, t}
    winner: null,
    message: '',
  };
  for (let i = 0; i < HAND_START; i += 1) {
    drawIntoHand(game.player);
    drawIntoHand(game.ai);
  }
  return game;
}

export function drawIntoHand(side) {
  if (side.hand.length >= HAND_MAX) return null;
  const id = drawCard(side.deck);
  if (id === null) return null;
  side.hand.push({ id, uid: Math.floor(Math.random() * 1e9), attack: CARD_BY_ID[id].attack ?? 0, health: CARD_BY_ID[id].health ?? 0 });
  return id;
}

function sideOf(game, who) {
  return who === 'player' ? game.player : game.ai;
}

function otherOf(game, who) {
  return who === 'player' ? game.ai : game.player;
}

/** Awal giliran: mana naik 1 (maks 10), isi penuh, ambil 1 kartu. */
export function startTurn(game, who) {
  const side = sideOf(game, who);
  game.active = who;
  side.maxMana = Math.min(MAX_MANA, side.maxMana + 1);
  side.mana = side.maxMana;
  drawIntoHand(side);
  game.stats.turns = Math.max(game.stats.turns, game.turn);
  pushLog(game, who === 'player' ? `Giliran ${game.turn}: giliranmu.` : `Giliran ${game.turn}: giliran lawan.`);
}

export function startGame(game) {
  game.phase = PHASE_PLAY;
  game.turn = 1;
  game.player.maxMana = 0;
  game.ai.maxMana = 0;
  startTurn(game, 'player');
}

export function pushLog(game, text) {
  game.log.unshift(text);
  if (game.log.length > 6) game.log.length = 6;
}

export function addFloat(game, x, y, text, color) {
  game.floats.push({ x, y, text, color, life: 1 });
}

export function canPlayCard(game, who, handIndex, lane) {
  const side = sideOf(game, who);
  const card = side.hand[handIndex];
  if (!card) return { ok: false, reason: 'tidak ada kartu' };
  const def = CARD_BY_ID[card.id];
  if (side.mana < def.cost) return { ok: false, reason: 'mana kurang' };
  if (def.kind === 'creature') {
    if (lane === null || lane === undefined) return { ok: false, reason: 'pilih jalur' };
    if (side.lanes[lane]) return { ok: false, reason: 'jalur penuh' };
  }
  return { ok: true, def };
}

/** Mainkan kartu dari tangan. Creature butuh lane; spell langsung berefek. */
export function playCard(game, who, handIndex, lane) {
  const check = canPlayCard(game, who, handIndex, lane);
  if (!check.ok) return check;
  const side = sideOf(game, who);
  const foe = otherOf(game, who);
  const card = side.hand.splice(handIndex, 1)[0];
  const def = check.def;
  side.mana -= def.cost;
  game.stats.cardsPlayed += 1;
  if (def.kind === 'creature') {
    side.lanes[lane] = card;
    pushLog(game, `${who === 'player' ? 'Kamu' : 'Lawan'} memainkan ${def.name} di jalur ${lane + 1}.`);
  } else {
    applySpell(game, who, side, foe, def);
    pushLog(game, `${who === 'player' ? 'Kamu' : 'Lawan'} memakai ${def.name}.`);
  }
  checkWinner(game);
  return { ok: true, def, card };
}

function applySpell(game, who, side, foe, def) {
  const effect = def.effect;
  if (effect.damage) {
    foe.life = Math.max(0, foe.life - effect.damage);
    if (who === 'player') game.stats.damageDealt += effect.damage;
    else game.stats.damageTaken += effect.damage;
    addFloat(game, 640, who === 'player' ? 150 : 620, `-${effect.damage}`, '#e5484d');
  }
  if (effect.heal) side.life = Math.min(START_LIFE, side.life + effect.heal);
  if (effect.draw) {
    for (let i = 0; i < effect.draw; i += 1) drawIntoHand(side);
  }
}

/** Combat akhir giliran: tiap jalur saling serang; kelebihan kena nyawa. */
export function resolveCombat(game) {
  for (let lane = 0; lane < LANES; lane += 1) {
    const mine = game.player.lanes[lane];
    const theirs = game.ai.lanes[lane];
    if (!mine && !theirs) continue;
    if (mine && !theirs) {
      game.ai.life = Math.max(0, game.ai.life - mine.attack);
      game.stats.damageDealt += mine.attack;
      addFloat(game, 640, 150, `-${mine.attack}`, '#e5484d');
    } else if (theirs && !mine) {
      game.player.life = Math.max(0, game.player.life - theirs.attack);
      game.stats.damageTaken += theirs.attack;
      addFloat(game, 640, 620, `-${theirs.attack}`, '#e5484d');
    } else {
      mine.health -= theirs.attack;
      theirs.health -= mine.attack;
      addFloat(game, 640, 400, `${mine.attack} vs ${theirs.attack}`, '#ffffff');
    }
  }
  game.player.lanes = game.player.lanes.map((c) => (c && c.health > 0 ? c : null));
  game.ai.lanes = game.ai.lanes.map((c) => (c && c.health > 0 ? c : null));
  checkWinner(game);
}

export function checkWinner(game) {
  if (game.phase !== PHASE_PLAY) return;
  if (game.ai.life <= 0 && game.player.life <= 0) {
    // Seri dihitung sebagai kemenangan pemain: keduanya roboh bersamaan.
    game.winner = 'player';
    game.phase = PHASE_WIN;
  } else if (game.ai.life <= 0) {
    game.winner = 'player';
    game.phase = PHASE_WIN;
  } else if (game.player.life <= 0) {
    game.winner = 'ai';
    game.phase = PHASE_LOSS;
  }
}

/** Akhiri giliran pemain: combat, lalu giliran AI penuh, lalu giliran baru. */
export function endPlayerTurn(game) {
  if (game.phase !== PHASE_PLAY || game.active !== 'player') return;
  resolveCombat(game);
  if (game.phase !== PHASE_PLAY) return;
  game.turn += 1;
  if (game.turn > MAX_TURNS) {
    game.winner = game.player.life >= game.ai.life ? 'player' : 'ai';
    game.phase = game.winner === 'player' ? PHASE_WIN : PHASE_LOSS;
    return;
  }
  startTurn(game, 'ai');
}
