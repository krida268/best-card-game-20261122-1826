// Senja Duel — suara prosedural WebAudio: bip pendek tanpa file audio.
// Semua panggilan aman kalau audio tidak tersedia (try/catch di sekelilingnya).
let audioContext = null;

function getContext() {
  if (audioContext) return audioContext;
  try {
    const Ctor = window.AudioContext ?? window.webkitAudioContext;
    if (!Ctor) return null;
    audioContext = new Ctor();
    return audioContext;
  } catch {
    return null;
  }
}

function beep(freq, duration, type, volume) {
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio tidak tersedia: game tetap jalan tanpa suara.
  }
}

export function playClick() {
  beep(660, 0.06, 'sine', 0.08);
}

export function playDraw() {
  beep(880, 0.05, 'sine', 0.06);
}

export function playCardSound() {
  beep(440, 0.09, 'triangle', 0.12);
  setTimeout(() => beep(587, 0.09, 'triangle', 0.1), 60);
}

export function playHit() {
  beep(180, 0.15, 'sawtooth', 0.12);
}

export function playWin() {
  [523, 659, 784, 1047].forEach((freq, i) => setTimeout(() => beep(freq, 0.18, 'triangle', 0.12), i * 110));
}

export function playLose() {
  [392, 330, 262, 196].forEach((freq, i) => setTimeout(() => beep(freq, 0.2, 'sawtooth', 0.08), i * 130));
}
