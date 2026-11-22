// Senja Duel — deck: bangun, acak (seeded), dan ambil kartu.
// Pengacak mulberry32: seed yang sama selalu memberi urutan yang sama,
// supaya scene screenshot dan selftest deterministik.
export function createRng(seed) {
  let value = seed >>> 0;
  return function next() {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(cards, rng) {
  const pile = cards.slice();
  for (let i = pile.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const temp = pile[i];
    pile[i] = pile[j];
    pile[j] = temp;
  }
  return pile;
}

/** Susun deck dari daftar id kartu lalu acak dengan rng. */
export function buildDeck(cardIds, rng) {
  return shuffle(cardIds, rng);
}

/** Ambil kartu teratas dari deck; null kalau deck habis. */
export function drawCard(deck) {
  return deck.length === 0 ? null : deck.pop();
}

/** Sisa kartu di deck, untuk ditampilkan di HUD. */
export function deckCount(deck) {
  return deck.length;
}
