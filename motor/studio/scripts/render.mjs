// Kullanim:
//   node scripts/render.mjs <is.json> <cikti.mp4>            -> tam render
//   node scripts/render.mjs <is.json> --kontrol <klasor>     -> her 1.5 sn'den bir kare (hizli kontrol)
//   node scripts/render.mjs <is.json> --kare 3.2,7.5 <klasor> -> belirli saniyelerden kare
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [, , jobPath, ...rest] = process.argv;
if (!jobPath) {
  console.error("is.json yolu gerekli");
  process.exit(1);
}
const inputProps = JSON.parse(fs.readFileSync(jobPath, "utf8"));
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), publicDir: path.join(root, "public") });
const composition = await selectComposition({ serveUrl, id: "Reklam", inputProps });
const fps = composition.fps;
console.log(`Sure: ${(composition.durationInFrames / fps).toFixed(2)} sn`);

const stills = async (secs, dir) => {
  fs.mkdirSync(dir, { recursive: true });
  for (const s of secs) {
    const frame = Math.min(composition.durationInFrames - 1, Math.round(s * fps));
    const output = path.join(dir, `kare_${String(s.toFixed(2)).padStart(6, "0")}.jpg`);
    await renderStill({ serveUrl, composition, inputProps, frame, output, imageFormat: "jpeg", jpegQuality: 80, scale: 0.4 });
  }
  console.log(`${secs.length} kare -> ${dir}`);
};

if (rest[0] === "--kontrol") {
  const total = composition.durationInFrames / fps;
  const secs = [];
  for (let s = 0.4; s < total; s += 1.5) secs.push(s);
  await stills(secs, rest[1]);
} else if (rest[0] === "--kare") {
  await stills(rest[1].split(",").map(Number), rest[2]);
} else {
  const out = rest[0];
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const tmp = path.join(os.tmpdir(), `reklam_${Date.now()}.mp4`);
  let last = -1;
  await renderMedia({
    serveUrl,
    composition,
    inputProps,
    codec: "h264",
    crf: 17,
    x264Preset: "slow",
    audioBitrate: "320k",
    pixelFormat: "yuv420p",
    concurrency: Math.max(2, Math.floor(os.cpus().length * 0.75)),
    outputLocation: tmp,
    onProgress: ({ progress }) => {
      const p = Math.floor(progress * 10);
      if (p !== last) {
        last = p;
        console.log(`render %${p * 10}`);
      }
    },
  });
  // ses son islem: tepe sinirlayici (-1.5 dBFS). SFX + konusma ust uste binince olusan tepeler Instagram'in
  // yeniden sikistirmasinda cizirtiya donmesin. Goruntu yeniden kodlanmaz.
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-i", tmp, "-c:v", "copy", "-af", "alimiter=limit=0.84:attack=2:release=60:level=disabled", "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-movflags", "+faststart", out], { stdio: "inherit" });
  fs.rmSync(tmp, { force: true });
  if (r.status !== 0) throw new Error("ffmpeg ses son islemi basarisiz");
  console.log("TAMAM:", out);
}
