[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/krida268/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/krida268/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

# Senja Duel

Duel kartu original di tiga jalur. Kamu dan lawan sama-sama punya 20 nyawa,
deck 30 kartu, dan tangan awal 5 kartu. Tiap giliran mana bertambah (maks 10)
dan kamu ambil 1 kartu. Mainkan creature ke salah satu dari 3 jalur dengan
membayar cost mana, atau pakai spell: damage langsung, heal, atau draw.

Di akhir giliran, creature menyerang creature di jalur yang sama. Kelebihan
damage mengenai nyawa lawan; jalur kosong berarti damage langsung ke nyawa.
Menang kalau nyawa lawan 0, kalah kalau nyawamu 0.

Empat elemen dibedakan warna DAN bentuk ikon: Api (merah, segitiga), Air
(biru, tetes), Daun (hijau, daun), Batu (kuning, segi enam). Semua gambar
digambar prosedural di canvas 2D, semua suara bip prosedural WebAudio —
tanpa aset luar, tanpa network.

## Cara main

- Klik kartu di tangan, lalu klik jalur untuk memainkan creature. Spell
  langsung terpakai saat diklik.
- Tombol **Akhiri Giliran** (atau Enter/Space) menutup giliranmu: combat
  berjalan, lalu lawan bermain.
- Keyboard: `1-5` pilih kartu, `1-3` pilih jalur saat kartu dipilih,
  `Enter`/`Space` akhiri giliran, `R` restart di layar akhir, `Esc` batal.
- Lawan AI serakah: mengisi jalur kosong, memenangkan duel yang bisa
  dimenangkan, dan menyimpan spell untuk lethal.

## Cara run

```sh
node serve.ts --port 8902
# buka http://localhost:8902
```

Selftest otomatis (memainkan 5 game penuh lewat autopilot):

```sh
# buka http://localhost:8902/?selftest=1
```

Screenshot deterministik:

```sh
# buka http://localhost:8902/?shot=title&seed=1  (juga play, win, loss)
```

## Struktur

- `game/index.html` — canvas 1280x800
- `game/src/config.js` — konstanta, 4 elemen, ~24 kartu unik
- `game/src/deck.js` — bangun deck, shuffle seeded, draw
- `game/src/ai.js` — logika lawan
- `game/src/state.js` — state game, alur giliran, resolusi combat
- `game/src/render.js` — meja, kartu, tangan, HUD, layar judul/menang/kalah
- `game/src/input.js` — mouse + keyboard
- `game/src/audio.js` — bip WebAudio prosedural
- `game/src/shots.js` — staging screenshot + selftest
- `game/src/main.js` — bootstrap + game loop
- `serve.ts` — server statis untuk `game/`
- `main.ts` — program entry make.fun

Dibangun untuk kompetisi [best-card-game-20261122-1826](https://make.fun/bounty/best-card-game-20261122-1826) di make.fun. Referral: `enzt809f`. Entry oleh Alxxprm.

## Lisensi

MIT — lihat `LICENSE`.
