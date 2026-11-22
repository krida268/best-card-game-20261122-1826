// Senja Duel — bootstrap dan game loop.
// ?seed=N menetapkan seed deck. ?shot=title|play|win|loss&seed=N me-render
// scene itu langsung (untuk screenshot) dan menandai window.__shotReady.
// ?selftest=1 memainkan 5 game penuh otomatis dan menulis PASS/FAIL ke
// document.title dan <pre id="selftest">.
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './config.js';
import { createGame, endPlayerTurn, startGame } from './state.js';
import { runAiTurn } from './ai.js';
import { createInput } from './input.js';
import { createRenderer, SCREEN_LOSS, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { runSelfTest, stageShot } from './shots.js';
import { playHit, playLose, playWin } from './audio.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const selftest = params.get('selftest') === '1';
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);

function announce(message) {
  status.textContent = message;
}

function runShot(name) {
  const staged = stageShot(name, seed);
  const screen = staged.screen === 'title'
    ? SCREEN_TITLE
    : staged.screen === 'win'
      ? SCREEN_WIN
      : staged.screen === 'loss'
        ? SCREEN_LOSS
        : SCREEN_PLAY;
  let painted = 0;
  function paint() {
    renderer.draw(staged.game, screen, { selected: null, hoverLane: null });
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runSelftestMode() {
  const result = runSelfTest();
  document.title = result.summary;
  const pre = document.getElementById('selftest');
  pre.textContent = result.lines.join('\n');
  pre.style.display = 'block';
  window.__shotReady = true;
}

function runGame() {
  const game = createGame(seed);
  const input = createInput(canvas, game, {
    onStart() {
      startGame(game);
      announce(`Bermain. Nyawa ${game.player.life}, mana ${game.player.mana}.`);
    },
    onRestart() {
      const fresh = createGame(Math.floor(Math.random() * 4294967296));
      Object.assign(game, fresh);
      input.resetSelection();
      startGame(game);
      announce('Duel baru dimulai.');
    },
    onEndTurn() {
      const beforeLife = game.ai.life;
      endPlayerTurn(game);
      if (game.ai.life < beforeLife) playHit();
      if (game.phase === 'win') {
        playWin();
        announce('Menang!');
      } else if (game.phase === 'loss') {
        playLose();
        announce('Kalah.');
      } else if (game.active === 'ai') {
        // Giliran AI berjalan sinkron lalu kembali ke pemain.
        setTimeout(() => {
          runAiTurn(game);
          if (game.phase === 'win') playWin();
          else if (game.phase === 'loss') playLose();
        }, 350);
      }
    },
    onPlayed() {
      if (game.phase === 'win') playWin();
      else if (game.phase === 'loss') playLose();
    },
    onMessage(text) {
      announce(text);
    },
  });

  let screen = SCREEN_TITLE;
  let last = performance.now();
  let announcedPhase = '';

  function syncScreen() {
    if (game.phase === 'title') screen = SCREEN_TITLE;
    else if (game.phase === 'play') screen = SCREEN_PLAY;
    else if (game.phase === 'win') screen = SCREEN_WIN;
    else screen = SCREEN_LOSS;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    syncScreen();
    // Umumkan sekali tiap pergantian layar akhir, untuk pembaca layar.
    if (screen !== announcedPhase && (screen === SCREEN_WIN || screen === SCREEN_LOSS)) {
      announcedPhase = screen;
      announce(screen === SCREEN_WIN ? 'Menang! Nyawa lawan habis.' : 'Kalah. Nyawamu habis.');
    }
    // Animasi kartu meluncur dan angka melayang maju dengan waktu.
    for (const anim of game.animations) anim.t += dt * 3;
    game.animations = game.animations.filter((anim) => anim.t < 1);
    for (const f of game.floats) f.life -= dt * 0.9;
    game.floats = game.floats.filter((f) => f.life > 0);
    renderer.draw(game, screen, input.ui);
  }

  announce('Senja Duel. Tekan Enter atau klik Mulai Duel.');
  requestAnimationFrame(frame);
}

if (selftest) runSelftestMode();
else if (shot) runShot(shot);
else runGame();
