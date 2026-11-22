// Senja Duel — konstanta, empat elemen, dan daftar kartu.
// Elemen dibedakan warna DAN bentuk ikon, supaya terbaca tanpa teks.
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 800;

export const START_LIFE = 20;
export const MAX_MANA = 10;
export const HAND_START = 5;
export const HAND_MAX = 7;
export const LANES = 3;
export const DECK_SIZE = 30;
export const MAX_TURNS = 60; // pengaman: game yang terlalu panjang berakhir seri

export const ELEMENTS = {
  fire: { name: 'Api', color: '#e5484d', dark: '#8f1d22', light: '#ffd9d9', shape: 'triangle' },
  water: { name: 'Air', color: '#3e8fe8', dark: '#174a80', light: '#d6e9ff', shape: 'drop' },
  leaf: { name: 'Daun', color: '#43a85c', dark: '#1f5c31', light: '#d9f2dd', shape: 'leaf' },
  stone: { name: 'Batu', color: '#d9a441', dark: '#7a5510', light: '#ffefc4', shape: 'hexagon' },
};

// id, nama, elemen, cost mana, jenis creature/spell,
// attack + health untuk creature, effect untuk spell.
export const CARD_DEFS = [
  { id: 'ember-imp', name: 'Imp Bara', element: 'fire', kind: 'creature', cost: 1, attack: 1, health: 1 },
  { id: 'flame-hound', name: 'Anjing Api', element: 'fire', kind: 'creature', cost: 2, attack: 2, health: 2 },
  { id: 'ash-sprite', name: 'Sprite Abu', element: 'fire', kind: 'creature', cost: 3, attack: 3, health: 2 },
  { id: 'fire-drake', name: 'Drake Api', element: 'fire', kind: 'creature', cost: 4, attack: 4, health: 3 },
  { id: 'lava-golem', name: 'Golem Lava', element: 'fire', kind: 'creature', cost: 5, attack: 3, health: 7 },
  { id: 'phoenix', name: 'Phoenix Senja', element: 'fire', kind: 'creature', cost: 6, attack: 6, health: 5 },
  { id: 'tide-sprite', name: 'Sprite Pasang', element: 'water', kind: 'creature', cost: 1, attack: 1, health: 2 },
  { id: 'frost-wisp', name: 'Wisp Beku', element: 'water', kind: 'creature', cost: 2, attack: 3, health: 1 },
  { id: 'coral-knight', name: 'Ksatria Karang', element: 'water', kind: 'creature', cost: 2, attack: 2, health: 3 },
  { id: 'rain-caller', name: 'Pemanggil Hujan', element: 'water', kind: 'creature', cost: 3, attack: 2, health: 3 },
  { id: 'wave-serpent', name: 'Ular Ombak', element: 'water', kind: 'creature', cost: 4, attack: 4, health: 4 },
  { id: 'deep-leviathan', name: 'Leviathan Dalam', element: 'water', kind: 'creature', cost: 7, attack: 7, health: 6 },
  { id: 'sproutling', name: 'Tunas Kecil', element: 'leaf', kind: 'creature', cost: 1, attack: 2, health: 1 },
  { id: 'vine-archer', name: 'Pemanah Sulur', element: 'leaf', kind: 'creature', cost: 2, attack: 3, health: 2 },
  { id: 'thorn-wolf', name: 'Serigala Duri', element: 'leaf', kind: 'creature', cost: 3, attack: 3, health: 3 },
  { id: 'bloom-dryad', name: 'Dryad Mekar', element: 'leaf', kind: 'creature', cost: 3, attack: 1, health: 4 },
  { id: 'moss-troll', name: 'Troll Lumut', element: 'leaf', kind: 'creature', cost: 4, attack: 2, health: 5 },
  { id: 'grove-guardian', name: 'Penjaga Rimbun', element: 'leaf', kind: 'creature', cost: 5, attack: 4, health: 6 },
  { id: 'pebble', name: 'Kerikil Hidup', element: 'stone', kind: 'creature', cost: 1, attack: 1, health: 3 },
  { id: 'rock-hound', name: 'Anjing Batu', element: 'stone', kind: 'creature', cost: 2, attack: 2, health: 4 },
  { id: 'sand-spirit', name: 'Roh Pasir', element: 'stone', kind: 'creature', cost: 3, attack: 2, health: 2 },
  { id: 'crystal-golem', name: 'Golem Kristal', element: 'stone', kind: 'creature', cost: 4, attack: 3, health: 5 },
  { id: 'granite-giant', name: 'Raksasa Granit', element: 'stone', kind: 'creature', cost: 6, attack: 5, health: 7 },
  { id: 'mountain-titan', name: 'Titan Gunung', element: 'stone', kind: 'creature', cost: 8, attack: 8, health: 8 },
  { id: 'fireball', name: 'Bola Api', element: 'fire', kind: 'spell', cost: 3, effect: { damage: 4, text: '4 damage ke nyawa lawan' } },
  { id: 'healing-rain', name: 'Hujan Pulih', element: 'water', kind: 'spell', cost: 2, effect: { heal: 5, text: 'Pulihkan 5 nyawa' } },
  { id: 'arcane-draw', name: 'Tarik Arcana', element: 'leaf', kind: 'spell', cost: 2, effect: { draw: 2, text: 'Ambil 2 kartu' } },
  { id: 'thorn-burst', name: 'Ledakan Duri', element: 'leaf', kind: 'spell', cost: 4, effect: { damage: 2, draw: 1, text: '2 damage + ambil 1 kartu' } },
  { id: 'stone-skin', name: 'Kulit Batu', element: 'stone', kind: 'spell', cost: 1, effect: { heal: 3, text: 'Pulihkan 3 nyawa' } },
  { id: 'storm-bolt', name: 'Petir Badai', element: 'water', kind: 'spell', cost: 5, effect: { damage: 7, text: '7 damage ke nyawa lawan' } },
];

export const CARD_BY_ID = Object.fromEntries(CARD_DEFS.map((card) => [card.id, card]));

// Komposisi deck 30 kartu: semua 24 creature unik sekali + 6 spell unik
// sekali = 30. Setiap kartu unik muncul tepat satu kali di deck.
export const DECK_LIST = CARD_DEFS.map((c) => c.id);
