// KURULUM TESTI: motorun calistigini kisa, sahte bir ornekle dogrular (Whisper / ses kaydi gerekmez).
// Kullanim (_sistem/studio icinden):
//   node scripts/kurulum_testi.mjs            -> 3 kontrol karesi: cikti/Kurulum Testi/test_kareler.jpg
//   node scripts/kurulum_testi.mjs --video    -> ayrica 8 sn'lik test videosu: cikti/Kurulum Testi/test.mp4
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const STUDIO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(STUDIO, "..", "..");
const video = process.argv.includes("--video");
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd: STUDIO, shell: false });
  if (r.status !== 0) throw new Error(`${cmd} ${args[0] ?? ""} basarisiz`);
};

const clip = "Test";
const job = path.join(STUDIO, "public", "jobs", "kurulum-testi");
fs.mkdirSync(path.join(job, "src"), { recursive: true });
const mp4 = path.join(job, "src", `${clip}.mp4`);
// siyah goruntu + cok kisik surekli ton (sessizlik kesimi devreye girmesin diye)
run("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "color=c=black:s=1080x1920:r=30", "-f", "lavfi", "-i", "sine=frequency=220:sample_rate=48000",
  "-t", "6", "-af", "volume=0.3", /* sine kaynagi zaten -18 dB -> ~-28 dB (sessizlik esigi -42 dB'nin ustu) */ "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", mp4]);

const W = [["Sadece", 0.3, 0.7], ["sesini", 0.75, 1.1], ["kaydet.", 1.15, 1.7], ["Gerisini", 2.6, 3.1], ["Claude", 3.15, 3.5], ["halleder.", 3.55, 4.2], ["Hazırsın.", 5.0, 5.6]];
const words = W.map(([w, s, e]) => ({ w, s, e, p: 1 }));
fs.writeFileSync(path.join(job, "transkript.json"), JSON.stringify({ [clip]: { text: W.map((x) => x[0]).join(" "), words, duration: 6 } }, null, 1));

const draft = {
  job: "jobs/kurulum-testi",
  brand: { name: "Animasyon Stüdyosu", accent: "#1F3A8A", accentText: "#ffffff", highlight: "#F6C26B", dark: "#14275E", tint: "#F6C26B" },
  clips: [clip],
  voiceOnly: [clip],
  captions: false,
  altZoom: false,
  fix: {},
  overlays: [{
    type: "film", at: `${clip}@start`, until: `${clip}@end`, untilShift: 2, sfx: false, gecisSesi: false,
    beats: [
      { at: `${clip}#0`, theme: "night", small: "Sadece", big: "sesini kaydet.", bigAt: `${clip}#1`, art: "star", deco: ["grid"] },
      { at: `${clip}#3`, theme: "light", trans: "ring", small: "Gerisini", big: "Claude halleder.", bigAt: `${clip}#4`, device: { ui: "stats", label: "Sonuç", hideValue: true, cam: "fly" } },
      { at: `${clip}@end`, theme: "night", trans: "wipe", big: "Hazırsın.", button: "Kurulum tamam" },
    ],
  }],
  extraEnd: 2,
};
const tmp = path.join(job, "tmp");
fs.mkdirSync(tmp, { recursive: true });
const draftPath = path.join(tmp, "test.json"), isPath = path.join(tmp, "test.is.json");
fs.writeFileSync(draftPath, JSON.stringify(draft, null, 2));
run(process.execPath, ["scripts/kurgu.mjs", draftPath, isPath]);

const out = path.join(ROOT, "cikti", "Kurulum Testi");
fs.mkdirSync(out, { recursive: true });
const kareDir = path.join(tmp, "kare");
fs.rmSync(kareDir, { recursive: true, force: true });
run(process.execPath, ["scripts/render.mjs", isPath, "--kare", "1.6,4.4,7.0", kareDir]);
const kareler = fs.readdirSync(kareDir).filter((f) => f.endsWith(".jpg")).sort().map((f) => path.join(kareDir, f));
run("ffmpeg", ["-v", "error", "-y", ...kareler.flatMap((k) => ["-i", k]), "-filter_complex", `hstack=inputs=${kareler.length}`, path.join(out, "test_kareler.jpg")]);
console.log("KARELER:", path.join(out, "test_kareler.jpg"));

if (video) {
  run(process.execPath, ["scripts/render.mjs", isPath, path.join(out, "test.mp4")]);
  console.log("VIDEO:", path.join(out, "test.mp4"));
}
console.log("KURULUM TESTI TAMAM");
