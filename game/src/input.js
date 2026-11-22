// Senja Duel — input mouse + keyboard.
// Klik kartu di tangan lalu klik jalur untuk memainkannya; spell langsung
// terpakai saat diklik. Keyboard: 1-5 pilih kartu, 1-3 pilih jalur saat
// kartu dipilih, Enter/Space akhiri giliran, R restart, Esc batal pilih.
import { CARD_BY_ID } from './config.js';
import { canPlayCard, playCard } from './state.js';
import {
  END_TURN_BUTTON,
  RESTART_BUTTON,
  START_BUTTON,
  handCardRect,
  laneSlot,
} from './render.js';
import { playCardSound, playClick } from './audio.js';

function inside(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function createInput(canvas, game, hooks) {
  const ui = { selected: null, hoverLane: null };

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function playSelected(lane) {
    if (ui.selected === null) return false;
    const card = game.player.hand[ui.selected];
    if (!card) {
      ui.selected = null;
      return false;
    }
    const def = CARD_BY_ID[card.id];
    const from = handCardRect(ui.selected, game.player.hand.length);
    const result = playCard(game, 'player', ui.selected, lane);
    if (!result.ok) {
      hooks.onMessage(result.reason);
      return false;
    }
    if (def.kind === 'creature') {
      const slot = laneSlot(lane, 'player');
      game.animations.push({
        cardId: card.id,
        attack: card.attack,
        health: card.health,
        fromX: from.x,
        fromY: from.y,
        toX: slot.x + (slot.w - 118) / 2,
        toY: slot.y + 4,
        t: 0,
      });
    }
    playCardSound();
    ui.selected = null;
    ui.hoverLane = null;
    hooks.onPlayed();
    return true;
  }

  function clickCard(index) {
    const card = game.player.hand[index];
    if (!card) return;
    const def = CARD_BY_ID[card.id];
    if (def.kind === 'spell') {
      const result = playCard(game, 'player', index, null);
      if (result.ok) {
        playCardSound();
        hooks.onPlayed();
      } else {
        hooks.onMessage(result.reason);
      }
      return;
    }
    ui.selected = ui.selected === index ? null : index;
    playClick();
  }

  function handleClick(event) {
    const point = canvasPoint(event);
    if (game.phase === 'title') {
      if (inside(point.x, point.y, START_BUTTON)) hooks.onStart();
      return;
    }
    if (game.phase === 'win' || game.phase === 'loss') {
      if (inside(point.x, point.y, RESTART_BUTTON)) hooks.onRestart();
      return;
    }
    if (game.phase !== 'play' || game.active !== 'player') return;
    if (inside(point.x, point.y, END_TURN_BUTTON)) {
      hooks.onEndTurn();
      return;
    }
    // Klik jalur: mainkan kartu yang dipilih ke jalur itu.
    for (let lane = 0; lane < 3; lane += 1) {
      if (inside(point.x, point.y, laneSlot(lane, 'player'))) {
        if (ui.selected !== null) playSelected(lane);
        return;
      }
    }
    // Klik kartu di tangan.
    for (let i = 0; i < game.player.hand.length; i += 1) {
      const rect = handCardRect(i, game.player.hand.length);
      const lifted = ui.selected === i ? { ...rect, y: rect.y - 18 } : rect;
      if (inside(point.x, point.y, lifted)) {
        clickCard(i);
        return;
      }
    }
    ui.selected = null;
  }

  function handleMove(event) {
    const point = canvasPoint(event);
    ui.hoverLane = null;
    if (game.phase !== 'play' || ui.selected === null) return;
    for (let lane = 0; lane < 3; lane += 1) {
      if (inside(point.x, point.y, laneSlot(lane, 'player'))) ui.hoverLane = lane;
    }
  }

  function handleKey(event) {
    const key = event.key;
    if (game.phase === 'title' && (key === 'Enter' || key === ' ')) {
      event.preventDefault();
      hooks.onStart();
      return;
    }
    if ((game.phase === 'win' || game.phase === 'loss') && (key === 'r' || key === 'R')) {
      hooks.onRestart();
      return;
    }
    if (game.phase !== 'play' || game.active !== 'player') return;
    if (key === 'Escape') {
      ui.selected = null;
      return;
    }
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      hooks.onEndTurn();
      return;
    }
    const digit = Number.parseInt(key, 10);
    if (Number.isInteger(digit) && digit >= 1 && digit <= 5) {
      if (ui.selected !== null && digit <= 3) {
        playSelected(digit - 1);
      } else {
        clickCard(digit - 1);
      }
    }
  }

  canvas.addEventListener('click', handleClick);
  canvas.addEventListener('mousemove', handleMove);
  window.addEventListener('keydown', handleKey);

  return {
    ui,
    resetSelection() {
      ui.selected = null;
      ui.hoverLane = null;
    },
  };
}
