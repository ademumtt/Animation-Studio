// G3 – OTOMATIK SES TASARIMI (saas-animation sound-and-music kurallari, Remotion film'e uyarlandi)
// Kullanim (studio icinden, GORUNTU ONAYLANDIKTAN SONRA – goruntu degisirse vuruslar kayar):
//   node scripts/ses_tasarim.mjs <is.json> <video.mp4> <cikti.mp4> [--sfx-db -6]
// Yapar: is.json film vuruslarindan cues.json (mutlak saniye) -> tools/sfx_mix.py (her efekt vurusa 0 ms) ->
//        ffmpeg ile seslendirme + SFX karisimi, -14 LUFS / -1.5 dBTP. Ara dosyalar video'nun yanina: <ad>.cues.json, <ad>.sfx.wav
// Kurallar: whoosh sadece HAREKETE (telefonun ucarak gelmesi); sekil donusumu = yumusak vurus; yazi = hafif pop; liste/seq =
// yukselen tonlu pop; sayac = hizlanan tik; bildirim = pop; kapanis = riser + alcak vurus. Zil/ding/hata sesi YOK.
// Ayni sesi aynen tekrarlama: pitch donusumlu. Seslendirme her zaman onde (SFX ~ -24 LUFS civari).
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [, , isPath, videoPath, outPath, ...rest] = process.argv;
if (!outPath) {
  console.error("Kullanim: node scripts/ses_tasarim.mjs <is.json> <video.mp4> <cikti.mp4> [--sfx-db -6]");
  process.exit(1);
}
const sfxDb = rest.includes("--sfx-db") ? +rest[rest.indexOf("--sfx-db") + 1] : -4;
const here = path.dirname(fileURLToPath(import.meta.url));
const STUDIO = path.resolve(here, "..");
const SES = path.resolve(STUDIO, "..", "ses");
const spec = JSON.parse(fs.readFileSync(isPath, "utf8"));
const fps = spec.fps ?? 30;
const speech = (spec.segments ?? []).reduce((s, g) => s + (g.out - g.in), 0);
const END = +(speech + (spec.extraEnd ?? 0)).toFixed(3);

const cues = [];
const add = (at, file, db, more = {}) => at >= 0 && at < END && cues.push({ at: +at.toFixed(3), file, db, align: "peak", ...more });
const PITCH = [1, 1.09, 0.95, 1.14, 0.9];

// KULLANICI (2026-11-15): surekli hava/hisirti yatagi YOK ("arkada bos hisirti var") ve gerilim riser'i YOK.

for (const o of spec.overlays ?? []) {
  if (o.type !== "film") continue;
  const beats = o.beats;
  beats.forEach((b, i) => {
    const s = o.at + b.at;
    const big = o.at + (b.bigAt ?? b.at);
    const shaped = i > 0 && (b.trans === "ring" || b.trans === "wipe");
    // sekil donusumu: yumusak vurus, sekil merkezde buyurken (~0.15 sn)
    if (shaped) add(s + 0.15, "Synth Soft Hit", -27, { pitch: PITCH[i % 5] });
    // buyuk satir: hafif pop (seq/count/logo kendi seslerini alir)
    if (!b.seq && b.count === undefined && !b.logo && (b.big || b.art)) add(Math.max(big, s + 0.4), "Synth Pop", -30, { pitch: PITCH[(i + 2) % 5], lp: 7000 });
    // muhur iner (garanti) -> alcak vurus; kalkan tiki -> pop
    if (b.art === "guarantee") add(big + 0.27, "Synth Soft Hit", -20, { pitch: 0.8 });
    if (b.art === "shield") add(big + 0.2, "Synth Pop", -25, { pitch: 1.1 });
    // makas: iki kesim sesi (k1 ve k1+9 kare) + kesim parlamasi
    if (b.art === "scissors" || b.art === "scissors3d") [0, 9].forEach((f, k) => add(big + f / fps, "Synth Shutter", -22, { pitch: 1.15 - 0.1 * k }));
    // el + makas: havada 3 kesme hareketi, kapanislar k1+4/+12/+20 kare; birlesme (kavrama) ~24. kare
    if (b.art === "scissorsSpin") [4, 12, 20].forEach((f, k) => add(big + f / fps, "Synth Shutter", -22, { pitch: 1.2 - 0.06 * k }));
    if (b.art === "scissorsHand") {
      add(s + 0.75, "Synth Pop", -28, { pitch: 0.9 });
      [4, 12, 20].forEach((f, k) => add(big + f / fps, "Synth Shutter", -21, { pitch: 1.2 - 0.06 * k }));
    }
    // iade: her para cuzdana dustugunde tonlu pop (yukselen), cuzdan kapaninca yumusak vurus
    if (b.art === "refund") {
      // kagit para: her banknot cebe girerken kisa kagit hisirtisi (shutter) + hafif tonlu pop; inis k1+8+5i
      [0, 1, 2, 3].forEach((k) => {
        add(big + (4 + k * 5) / fps, "Synth Shutter", -27, { pitch: 0.85 + 0.1 * k, lp: 6000 });
        add(big + (8 + k * 5) / fps, "Synth Pop", -29, { pitch: 0.95 + 0.08 * k });
      });
      add(big + 31 / fps, "Synth Soft Hit", -23, { pitch: 1.05 }); // kapak kapanir k1+26..32
    }
    // liste: her degisimde yukselen tonlu pop
    (b.seq ?? []).forEach((q, k) => add(o.at + q.at, "Synth Pop", -27, { pitch: 0.92 + 0.08 * k }));
    // sayac: 0.8 sn'de hizlanan tikler
    if (b.count !== undefined) [0, 0.22, 0.4, 0.54, 0.65, 0.74, 0.8].forEach((t, k) => add(big + t, "Synth Tick", -31, { pitch: 0.9 + 0.06 * k }));
    // 3B nesneler: hediye kapagi firlar (pop + yumusak vurus), takvim sayfalari (kagit)
    if (b.obj?.kind === "gift") (add(big + 0.05, "Synth Pop", -23, { pitch: 1.05 }), add(big + 0.12, "Synth Soft Hit", -25));
    if (b.obj?.kind === "calendar") (b.obj.pages ?? ["1", "15", "30"]).slice(0, -1).forEach((_, k) => add(big + (-4 + k * 9 + 5) / fps, "Synth Shutter", -24, { pitch: 0.9 + 0.1 * k }));
    // telefon: ucarak gelis = hareket -> whoosh; bildirim/kart/dokunma
    if (b.device) {
      const d = b.device;
      const fromF = Math.round(b.at * fps), k1 = Math.round(big * fps) - Math.round(o.at * fps);
      if ((d.cam ?? "fly") === "fly") add(s + 0.25, "Synth Whoosh 1", -29);
      (d.items ?? []).slice(0, 5).forEach((it, k) => {
        const f = typeof it.at === "number" ? Math.round(it.at * fps) : fromF + Math.max(10, k1 - fromF - 6) + k * 9;
        add(o.at + f / fps + 0.1, "Synth Pop", -27, { pitch: PITCH[k % 5] });
      });
      (d.pops ?? []).forEach((pp, k) => {
        const f = typeof pp.at === "number" ? Math.round(pp.at * fps) : fromF + Math.max(14, k1 - fromF) + k * 10;
        add(o.at + f / fps + 0.12, "Synth Pop", -25, { pitch: PITCH[(k + 1) % 5] });
      });
      (d.taps ?? []).forEach((t) => typeof t === "number" && add(o.at + t, "Synth Tick", -27));
    }
    // kapanis: alcak vurus + parcacik + buton pop (riser yok - kullanici "gerilim sesi" istemedi)
    if (b.logo) {
      add(s + 0.5, "Synth Soft Hit", -21, { pitch: 0.85 });
      add(s + 0.68, "Synth Pop", -24, { pitch: 1.2 }); // parcacik patlamasi
      if (b.button) add(s + 0.9, "Synth Pop", -26, { pitch: 1.05 });
    }
  });
}

const base = outPath.replace(/\.mp4$/i, "");
const cuesPath = `${base}.cues.json`, sfxPath = `${base}.sfx.wav`;
fs.writeFileSync(cuesPath, JSON.stringify(cues, null, 1));
console.log(`${cues.length} efekt -> ${cuesPath}`);

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd: STUDIO, shell: false });
  if (r.status !== 0) throw new Error(`${cmd} basarisiz`);
};
run("uv", ["run", "tools/sfx_mix.py", cuesPath, sfxPath, "--lib", SES, "--len", String(END)]);
// SFX katmanini olc -> hedef: seslendirmenin (-14) ~10-11 dB alti = -25 LUFS (+ --sfx-db ince ayar)
const meas = spawnSync("ffmpeg", ["-hide_banner", "-i", sfxPath, "-af", "loudnorm=print_format=json", "-f", "null", "-"], { encoding: "utf8" });
const m = /"input_i"\s*:\s*"(-?[\d.]+)"/.exec(meas.stderr ?? "");
const stem = m ? +m[1] : -38;
const gain = +(-25 - stem + sfxDb + 4).toFixed(1); // sfxDb varsayilan -4 -> net -25 LUFS
console.log(`SFX katmani ${stem} LUFS -> ${gain >= 0 ? "+" : ""}${gain} dB`);
// seslendirme + SFX, sonra -14 LUFS / -1.5 dBTP
run("ffmpeg", ["-v", "error", "-y", "-i", videoPath, "-i", sfxPath, "-filter_complex",
  `[1:a]volume=${gain}dB,alimiter=limit=0.7[s];[0:a][s]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11[a]`,
  "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-ar", "48000", outPath]);
console.log(`SESLI: ${outPath}`);
