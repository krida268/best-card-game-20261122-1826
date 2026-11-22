// Senja Duel — renderer canvas 2D: meja, kartu, tangan, HUD,
// layar judul / menang / kalah, ikon elemen, confetti, angka melayang.
import { CANVAS_HEIGHT, CANVAS_WIDTH, CARD_BY_ID, ELEMENTS, LANES, START_LIFE } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';

const HAND_CARD_W = 104;
const HAND_CARD_H = 146;
const LANE_CARD_W = 118;
const LANE_CARD_H = 128;
const LANE_W = 300;
const LANE_GAP = 24;
const LANES_X = (CANVAS_WIDTH - (LANES * LANE_W + (LANES - 1) * LANE_GAP)) / 2;
const AI_LANE_Y = 196;
const PLAYER_LANE_Y = 356;
const HAND_Y = 618;
const AI_HAND_Y = 64;

export function laneSlot(lane, who) {
  const x = LANES_X + lane * (LANE_W + LANE_GAP);
  const y = who === 'player' ? PLAYER_LANE_Y : AI_LANE_Y;
  return { x, y, w: LANE_W, h: LANE_CARD_H + 8 };
}

export function handCardRect(index, count) {
  const total = count * (HAND_CARD_W + 10) - 10;
  const x = (CANVAS_WIDTH - total) / 2 + index * (HAND_CARD_W + 10);
  return { x, y: HAND_Y, w: HAND_CARD_W, h: HAND_CARD_H };
}

export function aiHandRect(index, count) {
  const w = 72;
  const h = 100;
  const total = count * (w + 8) - 8;
  const x = (CANVAS_WIDTH - total) / 2 + index * (w + 8);
  return { x, y: AI_HAND_Y, w, h };
}

export const END_TURN_BUTTON = { x: 1072, y: 540, w: 168, h: 56 };
export const START_BUTTON = { x: 490, y: 470, w: 300, h: 72 };
export const RESTART_BUTTON = { x: 490, y: 500, w: 300, h: 72 };

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Gambar ikon elemen: segitiga Api, tetes Air, daun Daun, segi enam Batu. */
export function drawElementIcon(ctx, shape, cx, cy, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  if (shape === 'triangle') {
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size, cy + size * 0.8);
    ctx.lineTo(cx - size, cy + size * 0.8);
  } else if (shape === 'drop') {
    ctx.moveTo(cx, cy - size);
    ctx.bezierCurveTo(cx + size, cy, cx + size * 0.8, cy + size, cx, cy + size);
    ctx.bezierCurveTo(cx - size * 0.8, cy + size, cx - size, cy, cx, cy - size);
  } else if (shape === 'leaf') {
    ctx.moveTo(cx, cy - size);
    ctx.bezierCurveTo(cx + size, cy - size * 0.4, cx + size * 0.7, cy + size, cx, cy + size);
    ctx.bezierCurveTo(cx - size * 0.7, cy + size, cx - size, cy - size * 0.4, cx, cy - size);
  } else {
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const px = cx + size * Math.cos(angle);
      const py = cy + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fill();
}

function drawCardFace(ctx, card, x, y, w, h, opts = {}) {
  const def = CARD_BY_ID[card.id];
  const el = ELEMENTS[def.element];
  const selected = opts.selected === true;
  const dimmed = opts.dimmed === true;
  ctx.save();
  if (dimmed) ctx.globalAlpha = 0.45;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = el.light;
  ctx.fill();
  ctx.lineWidth = selected ? 4 : 2;
  ctx.strokeStyle = selected ? '#ffd166' : el.dark;
  ctx.stroke();
  // Biaya mana: lingkaran biru di kiri atas.
  ctx.beginPath();
  ctx.arc(x + 18, y + 18, 15, 0, Math.PI * 2);
  ctx.fillStyle = '#2b6cb0';
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(def.cost), x + 18, y + 19);
  // Ikon elemen di kanan atas.
  drawElementIcon(ctx, el.shape, x + w - 20, y + 20, 13, el.color);
  // Nama kartu.
  ctx.fillStyle = '#1a202c';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(def.name, x + w / 2, y + 42);
  ctx.font = '10px sans-serif';
  ctx.fillStyle = el.dark;
  ctx.fillText(el.name, x + w / 2, y + 56);
  // Badan kartu: nilai besar di tengah bawah, jauh dari nama elemen.
  if (def.kind === 'creature') {
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = el.color;
    ctx.fillText(`⚔ ${card.attack}`, x + w / 2, y + h - 52);
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#1a202c';
    ctx.fillText(`❤ ${card.health}`, x + w / 2, y + h - 24);
  } else {
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#1a202c';
    const words = def.effect.text.split(' ');
    let line = '';
    let lineY = y + h / 2 + 2;
    for (const word of words) {
      if ((line + word).length > 13) {
        ctx.fillText(line.trim(), x + w / 2, lineY);
        line = '';
        lineY += 15;
      }
      line += `${word} `;
    }
    ctx.fillText(line.trim(), x + w / 2, lineY);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = el.dark;
    ctx.fillText('SPELL', x + w / 2, y + h - 24);
  }
  ctx.restore();
}

function drawCardBack(ctx, x, y, w, h) {
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = '#4a2b6b';
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✦', x + w / 2, y + h / 2);
}

function drawLifeBar(ctx, x, y, w, label, life, color) {
  ctx.fillStyle = '#1a202c';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(label, x, y - 6);
  roundRect(ctx, x, y, w, 22, 11);
  ctx.fillStyle = '#2d3748';
  ctx.fill();
  const ratio = Math.max(0, life / START_LIFE);
  if (ratio > 0) {
    roundRect(ctx, x + 2, y + 2, (w - 4) * ratio, 18, 9);
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`❤ ${life} / ${START_LIFE}`, x + w / 2, y + 17);
}

function drawMana(ctx, x, y, mana, maxMana) {
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`MANA  ${mana}/${maxMana}`, x, y);
  for (let i = 0; i < 10; i += 1) {
    ctx.beginPath();
    ctx.arc(x + 9 + i * 20, y + 17, 8, 0, Math.PI * 2);
    ctx.fillStyle = i < mana ? '#2b6cb0' : '#cbd5e0';
    ctx.fill();
    ctx.strokeStyle = '#1a202c';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawTable(ctx, game) {
  // Latar meja.
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, '#1e3a2f');
  gradient.addColorStop(1, '#2d5a3d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  // Jalur.
  for (let lane = 0; lane < LANES; lane += 1) {
    for (const who of ['ai', 'player']) {
      const slot = laneSlot(lane, who);
      roundRect(ctx, slot.x, slot.y, slot.w, slot.h, 12);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      if (!game[who].lanes[lane]) ctx.fillText(`Jalur ${lane + 1}`, slot.x + slot.w / 2, slot.y + slot.h / 2 + 5);
    }
  }
  // Creature di jalur.
  for (let lane = 0; lane < LANES; lane += 1) {
    for (const who of ['ai', 'player']) {
      const card = game[who].lanes[lane];
      if (!card) continue;
      const slot = laneSlot(lane, who);
      drawCardFace(ctx, card, slot.x + (slot.w - LANE_CARD_W) / 2, slot.y + 4, LANE_CARD_W, LANE_CARD_H);
    }
  }
  // Tangan lawan tertutup.
  game.ai.hand.forEach((card, i) => {
    const r = aiHandRect(i, game.ai.hand.length);
    drawCardBack(ctx, r.x, r.y, r.w, r.h);
  });
  // HUD nyawa (lebar 200 supaya tidak tertutup kartu tangan yang penuh).
  drawLifeBar(ctx, 40, 24, 200, 'LAWAN', game.ai.life, '#e5484d');
  drawLifeBar(ctx, 40, 756 - 22, 200, 'KAMU', game.player.life, '#43a85c');
  // Deck lawan + deck sendiri.
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`Deck lawan: ${game.ai.deck.length}`, CANVAS_WIDTH - 40, 40);
  ctx.fillText(`Deck: ${game.player.deck.length}`, CANVAS_WIDTH - 40, 760);
  // Statistik.
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = '15px sans-serif';
  ctx.fillText(
    `Giliran ${game.turn}  •  Kartu dimainkan ${game.stats.cardsPlayed}  •  Damage ${game.stats.damageDealt}`,
    CANVAS_WIDTH / 2,
    40,
  );
  // Giliran aktif.
  ctx.fillStyle = game.active === 'player' ? '#ffd166' : '#fda4af';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(game.active === 'player' ? 'Giliranmu — mainkan kartu!' : 'Giliran lawan...', CANVAS_WIDTH / 2, 178);
  // Pesan log terakhir.
  if (game.log.length > 0) {
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'italic 14px sans-serif';
    ctx.fillText(game.log[0], CANVAS_WIDTH / 2, 348);
  }
}

function drawHand(ctx, game, ui) {
  game.player.hand.forEach((card, i) => {
    const r = handCardRect(i, game.player.hand.length);
    const def = CARD_BY_ID[card.id];
    const dimmed = game.active !== 'player' || game.player.mana < def.cost;
    const rect = ui.selected === i
      ? { x: r.x, y: r.y - 18, w: r.w, h: r.h }
      : r;
    drawCardFace(ctx, card, rect.x, rect.y, rect.w, rect.h, { selected: ui.selected === i, dimmed });
  });
}

function drawEndTurn(ctx, game, ui) {
  const b = END_TURN_BUTTON;
  const enabled = game.active === 'player' && game.phase === 'play';
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fillStyle = enabled ? '#d9a441' : '#718096';
  ctx.fill();
  ctx.strokeStyle = '#1a202c';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#1a202c';
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Akhiri Giliran', b.x + b.w / 2, b.y + b.h / 2);
  ctx.textBaseline = 'alphabetic';
  drawMana(ctx, 1050, 470, game.player.mana, game.player.maxMana);
  if (ui.hoverLane !== null && ui.hoverLane !== undefined && ui.selected !== null && ui.selected !== undefined) {
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Mainkan ke Jalur ${ui.hoverLane + 1}`, 1156, 625);
  }
}

function drawFloats(ctx, game) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const f of game.floats) {
    ctx.globalAlpha = Math.max(0, f.life);
    ctx.font = 'bold 30px sans-serif';
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y - (1 - f.life) * 50);
  }
  ctx.globalAlpha = 1;
  ctx.textBaseline = 'alphabetic';
}

function drawTitle(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, '#2b1a4a');
  gradient.addColorStop(0.55, '#7a3b2e');
  gradient.addColorStop(1, '#2b1a4a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  // Ikon empat elemen di atas judul.
  const shapes = ['triangle', 'drop', 'leaf', 'hexagon'];
  const colors = ['#e5484d', '#3e8fe8', '#43a85c', '#d9a441'];
  shapes.forEach((shape, i) => {
    drawElementIcon(ctx, shape, 500 + i * 90, 170, 26, colors[i]);
  });
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 84px sans-serif';
  ctx.fillText('SENJA DUEL', CANVAS_WIDTH / 2, 290);
  ctx.fillStyle = '#fff';
  ctx.font = '24px sans-serif';
  ctx.fillText('Duel kartu di tiga jalur — kalahkan lawan sebelum senja habis.', CANVAS_WIDTH / 2, 340);
  ctx.font = '17px sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText('Mainkan creature ke 3 jalur, bayar mana, serang di akhir giliran.', CANVAS_WIDTH / 2, 400);
  ctx.fillText('Menang kalau nyawa lawan 0. Klik kartu lalu klik jalur. 1-5 pilih kartu, Enter akhiri giliran.', CANVAS_WIDTH / 2, 428);
  const b = START_BUTTON;
  roundRect(ctx, b.x, b.y, b.w, b.h, 14);
  ctx.fillStyle = '#d9a441';
  ctx.fill();
  ctx.strokeStyle = '#1a202c';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#1a202c';
  ctx.font = 'bold 26px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('Mulai Duel', b.x + b.w / 2, b.y + b.h / 2 + 1);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#cbd5e0';
  ctx.font = '14px sans-serif';
  ctx.fillText('Senja Duel — game kartu original, tanpa aset luar.', CANVAS_WIDTH / 2, 620);
}

let confetti = [];
let confettiPhase = '';

function drawEndScreen(ctx, game, screen) {
  const won = screen === SCREEN_WIN;
  ctx.fillStyle = won ? 'rgba(20,60,30,0.92)' : 'rgba(60,20,20,0.92)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  if (won) {
    if (confettiPhase !== 'win') {
      confettiPhase = 'win';
      confetti = Array.from({ length: 120 }, (_, i) => ({
        x: (i * 97) % CANVAS_WIDTH,
        y: (i * 53) % 300,
        size: 6 + (i % 5) * 2,
        color: ['#ffd166', '#e5484d', '#3e8fe8', '#43a85c'][i % 4],
        speed: 1 + (i % 4) * 0.5,
      }));
    }
    const t = Date.now() / 1000;
    for (const piece of confetti) {
      ctx.fillStyle = piece.color;
      const y = (piece.y + t * 60 * piece.speed) % CANVAS_HEIGHT;
      ctx.fillRect(piece.x, y, piece.size, piece.size * 0.6);
    }
  } else {
    confettiPhase = '';
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 72px sans-serif';
  ctx.fillText(won ? 'MENANG!' : 'KALAH', CANVAS_WIDTH / 2, 280);
  ctx.fillStyle = '#fff';
  ctx.font = '22px sans-serif';
  ctx.fillText(
    won ? 'Nyawa lawan habis. Senja milikmu!' : 'Nyawamu habis. Senja menelanmu...',
    CANVAS_WIDTH / 2,
    340,
  );
  ctx.font = '18px sans-serif';
  ctx.fillText(
    `Giliran ${game.turn}  •  Kartu dimainkan ${game.stats.cardsPlayed}  •  Damage ${game.stats.damageDealt}  •  Damage diterima ${game.stats.damageTaken}`,
    CANVAS_WIDTH / 2,
    400,
  );
  ctx.fillText(`Nyawa akhir — Kamu ${game.player.life} vs Lawan ${game.ai.life}`, CANVAS_WIDTH / 2, 432);
  const b = RESTART_BUTTON;
  roundRect(ctx, b.x, b.y, b.w, b.h, 14);
  ctx.fillStyle = '#d9a441';
  ctx.fill();
  ctx.strokeStyle = '#1a202c';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#1a202c';
  ctx.font = 'bold 24px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('Main Lagi (R)', b.x + b.w / 2, b.y + b.h / 2 + 1);
  ctx.textBaseline = 'alphabetic';
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  return {
    draw(game, screen, ui) {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      if (screen === SCREEN_TITLE) {
        drawTitle(ctx);
        return;
      }
      drawTable(ctx, game);
      drawHand(ctx, game, ui);
      drawEndTurn(ctx, game, ui);
      // Animasi kartu meluncur saat dimainkan.
      for (const anim of game.animations) {
        const progress = Math.min(1, anim.t);
        const x = anim.fromX + (anim.toX - anim.fromX) * progress;
        const y = anim.fromY + (anim.toY - anim.fromY) * progress;
        drawCardFace(ctx, { id: anim.cardId, attack: anim.attack, health: anim.health }, x, y, LANE_CARD_W, LANE_CARD_H);
      }
      drawFloats(ctx, game);
      if (screen === SCREEN_WIN || screen === SCREEN_LOSS) drawEndScreen(ctx, game, screen);
    },
  };
}
