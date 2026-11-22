// Senja Duel — program entry make.fun (Node 22, pustaka standar saja).
// Menyerahkan game/ dan screenshots/ dari repo ini ke folder output dan
// menulis dossier.json dengan buildDossier dari vendor/makefun-game.ts.
// Di luar grader, MAKEFUN_OUTPUT_DIR menggantikan /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Catatan: /output adalah mount point grader — foldernya tidak pernah
// dihapus, hanya isinya yang dikosongkan sebelum diisi ulang.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Buat folder output kalau belum ada, lalu kosongkan isinya saja.
mkdirSync(out, { recursive: true });
for (const entry of readdirSync(out)) {
  rmSync(join(out, entry), { recursive: true, force: true });
}

cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Batas yang dipakai scorer (lihat kit): hanya text_max_bytes yang
// membentuk byte dossier; sisanya menolak entry yang scorer tolak
// (lebih dari 4 screenshot atau satu di atas 256 KiB; lebih dari
// 993 file di game/ atau 48 MiB total; path game/ di atas 1000 byte).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log(`Senja Duel diserahkan ke ${out} — game, screenshots, dossier.json siap.`);
