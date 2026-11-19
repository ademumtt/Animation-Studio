// ANIMASYON TESLIMI: render edilmis videoyu musteriye hazir pakete cevirir + surum arsivine koyar.
// Kullanim (studio icinden):
//   node scripts/teslim.mjs <is.json> <video.mp4> "<Müşteri>" "<Teslim adi>" <kapak sn> <surum klasoru adi>
//   orn: node scripts/teslim.mjs "../kurgu/Ornek Marka/S3_v2.is.json" "../kurgu/Ornek Marka/S3_v2.mp4" "Ornek Marka" "Animasyon Reklam" 18.5 "v2 film ortali gecis (2026-11-15)"
// Yapar:
//   cikti/<Müşteri>/REKLAM HAZIR/<Teslim adi>.mp4          video (9:16 Reels/Stories)
//   cikti/<Müşteri>/REKLAM HAZIR/<Teslim adi> - 4x5.mp4    akis (feed) kopyasi 1080x1350
//   cikti/<Müşteri>/REKLAM HAZIR/<Teslim adi> - Kapak.jpg  Instagram kapak (kapak sn'deki kare, 1080x1920)
//   _sistem/animasyon/surumler/<surum>/  taslak.json (is.json'un kaynagi) + video.mp4 + kontak.jpg
// Aciklama metni ve DURUM.md'yi Claude yazar (icerik yargisi gerektirir).
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// <boyut> ZORUNLU (kullanici karari 2026-11-17): 9x16 | 4x5 | ikisi – videoya baslamadan once kullaniciya sorulur.
// Tek render (9:16) alinir; 4:5 ondan kirpilir (ayri render yok).
const [, , isPath, videoPath, musteri, ad, kapakSn, surum, boyut] = process.argv;
if (!surum || !["9x16", "4x5", "ikisi"].includes(boyut)) {
  console.error('Kullanim: node scripts/teslim.mjs <is.json> <video.mp4> "<Müşteri>" "<Teslim adi>" <kapak sn> "<surum klasoru>" <9x16|4x5|ikisi>');
  process.exit(1);
}
const ver916 = boyut !== "4x5", ver45 = boyut !== "9x16";
const here = path.dirname(fileURLToPath(import.meta.url));
const STUDIO = path.resolve(here, "..");
const ROOT = path.resolve(STUDIO, "..", "..");
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: false });
  if (r.status !== 0) throw new Error(`${cmd} basarisiz`);
};

const hazir = path.join(ROOT, "cikti", musteri, "REKLAM HAZIR");
fs.mkdirSync(hazir, { recursive: true });
if (ver916) fs.copyFileSync(videoPath, path.join(hazir, `${ad}.mp4`));

// G7: Instagram akisi icin 4:5 kopya (1080x1350). Film yerlesimi icerigi y 270-1250 arasinda tutar -> y=210'dan kirp
// (telefon ust kenari icin pay birakir).
if (ver45) run("ffmpeg", ["-v", "error", "-y", "-i", videoPath, "-vf", "crop=1080:1350:0:210", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", path.join(hazir, `${ad} - 4x5.mp4`)]);

// kapak: render.mjs --kare ile tam cozunurluk tek kare
const tmp = path.join(STUDIO, ".teslim_tmp");
fs.mkdirSync(tmp, { recursive: true });
run("node", [path.join(STUDIO, "scripts", "render.mjs"), isPath, "--kare", String(kapakSn), tmp]);
const kare = fs.readdirSync(tmp).find((f) => f.endsWith(".jpg"));
if (ver916) fs.copyFileSync(path.join(tmp, kare), path.join(hazir, `${ad} - Kapak.jpg`));
else run("ffmpeg", ["-v", "error", "-y", "-i", path.join(tmp, kare), "-vf", "crop=1080:1350:0:210", path.join(hazir, `${ad} - 4x5 - Kapak.jpg`)]);
fs.rmSync(tmp, { recursive: true, force: true });

// surum arsivi
const sd = path.join(ROOT, "_sistem", "animasyon", "surumler", surum);
fs.mkdirSync(sd, { recursive: true });
const taslak = isPath.replace(/\.is\.json$/, ".json");
if (fs.existsSync(taslak)) fs.copyFileSync(taslak, path.join(sd, "taslak.json"));
fs.copyFileSync(videoPath, path.join(sd, "video.mp4"));
run("ffmpeg", ["-v", "error", "-y", "-i", path.join(sd, "video.mp4"), "-vf", "fps=1,scale=270:-1,tile=7x4", "-frames:v", "1", path.join(sd, "kontak.jpg")]);

console.log(`TESLIM: ${path.join(hazir, ad)}.mp4 + Kapak.jpg  |  surum: ${sd}`);
