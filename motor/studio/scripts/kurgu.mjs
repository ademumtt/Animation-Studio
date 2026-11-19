// Taslak (insan/Claude tarafindan yazilan kisa kurgu plani) -> is.json (Remotion'un render ettigi tam zaman cizelgesi)
//
// Kullanim:
//   node scripts/kurgu.mjs kelimeler <job-klasoru>              -> her klibin kelimelerini numarali listeler
//   node scripts/kurgu.mjs <taslak.json> <is.json>              -> is.json uretir
//
// Taslakta zaman yazmak yerine kelimeye baglanir:  "Govde 2#7"  = Govde 2 klibinin 7. kelimesi
//   at: "Govde 2#7"        -> o kelimenin basladigi an (cikis zamaninda)
//   until: "Govde 3#4"     -> o kelimenin bittigi an
//   at: 12.5 / dur: 2      -> dogrudan saniye de olur
// Sessizlikler otomatik kesilir (jump-cut), yakin/genis plan sirayla degisir.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [, , a, b] = process.argv;
const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

if (a === "kelimeler") {
  const t = JSON.parse(fs.readFileSync(path.join(b, "transkript.json"), "utf8"));
  for (const [clip, d] of Object.entries(t)) {
    console.log(`\n## ${clip}  (${d.duration}s)`);
    console.log(d.words.map((w, i) => `${i}:${w.w}${w.p < 0.6 ? "(?)" : ""}`).join(" "));
  }
  process.exit(0);
}

const draft = JSON.parse(fs.readFileSync(a, "utf8").replace(/^﻿/, ""));
const jobRel = draft.job; // orn "jobs/ornek-marka"
const tr = JSON.parse(fs.readFileSync(path.join(publicDir, jobRel, "transkript.json"), "utf8"));
const fixes = draft.fix ?? {}; // {"Kanca A#7": "balyaj"} yanlis duyulan kelimeyi duzelt
// Kesim kurali: SADECE cumle arasi duraklamalar kesilir (konusma ortasinda asla kesim yok).
const KEEP = draft.breath ?? 0.2; // kesilen duraklamadan geriye birakilan dogal nefes (sn)
const MIN_PAUSE = draft.minPause ?? 0.32; // bundan kisa duraklamalara dokunulmaz
const PAD_IN = 0.08, PAD_OUT = 0.14;

// ses dalgasindan gercek sessizlikler (ffmpeg silencedetect), job klasorunde onbellek
const silCache = path.join(publicDir, jobRel, "sessizlik.json");
const silData = fs.existsSync(silCache) ? JSON.parse(fs.readFileSync(silCache, "utf8")) : {};
const silences = (name) => {
  const db = draft.silenceDb ?? -42;
  const key = `${name}|${db}`;
  if (!silData[key]) {
    const r = spawnSync("ffmpeg", ["-hide_banner", "-i", path.join(publicDir, jobRel, "src", `${name}.mp4`), "-af", `silencedetect=n=${db}dB:d=0.14`, "-f", "null", "-"], { encoding: "utf8" });
    const out = [];
    let a = null;
    for (const line of r.stderr.split("\n")) {
      const m1 = line.match(/silence_start: ([\d.]+)/);
      const m2 = line.match(/silence_end: ([\d.]+)/);
      if (m1) a = +m1[1];
      if (m2 && a !== null) {
        out.push([a, +m2[1]]);
        a = null;
      }
    }
    silData[key] = out;
    fs.writeFileSync(silCache, JSON.stringify(silData));
  }
  return silData[key];
};

// Sureklilik: olcum.json (tools/olc.py) varsa her cekim ayni kadraja ve ayni renge getirilir.
// Iki kamera hissi: "genis" ve "yakin" iki sabit kadraj; tum cekimlerde yuz ayni boyut ve konumda.
const olcPath = path.join(publicDir, jobRel, "olcum.json");
const olc = fs.existsSync(olcPath) ? JSON.parse(fs.readFileSync(olcPath, "utf8")) : {};
const usedClips = [...new Set(draft.clips.map((c) => (typeof c === "string" ? c : c.name)))];
const median = (arr) => {
  const s = [...arr].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
};
const rgbTarget = [0, 1, 2].map((k) => median(usedClips.filter((n) => olc[n]?.rgb).map((n) => olc[n].rgb[k])));
const framing = (name, close) => {
  const f = olc[name]?.face;
  const faceH = (close ? draft.faceClose : draft.faceWide) ?? (close ? 0.15 : 0.12);
  if (!f) return { zoom: (draft.baseZoom ?? 1) * (close ? draft.zoom ?? 1.2 : 1), focusX: draft.focus?.[name]?.[0] ?? 0.5, focusY: draft.focus?.[name]?.[1] ?? 0.35 };
  return { zoom: +(faceH / f[2]).toFixed(3), focusX: f[0], focusY: f[1] };
};
const gain = (name) => {
  const m = olc[name]?.rgb;
  if (!m || rgbTarget.some((v) => !v)) return undefined;
  const k = draft.colorMatch ?? 0.8; // farkin %80'i kapatilir
  return m.map((v, i) => +(1 + k * (rgbTarget[i] / v - 1)).toFixed(3));
};

const segments = [];
const words = [];
const anchor = {}; // "clip#i" -> {s,e} cikis zamani
let pos = 0;
let alt = 0;
const clipRanges = [];

draft.clips.forEach((c) => {
  const spec = typeof c === "string" ? { name: c } : c;
  const name = spec.name;
  const d = tr[name];
  if (!d) throw new Error(`Transkriptte yok: ${name}`);
  const from = spec.from ?? 0; // kelime indeksi
  const to = spec.to ?? d.words.length - 1;
  const ws = [];
  d.words.slice(from, to + 1).forEach((w, k) => {
    const x = { ...w, i: from + k };
    // "4000 TL 'lik" -> ek onceki kelimeye yapisir
    if (/^['’]/.test(w.w) && ws.length) {
      ws[ws.length - 1].w += w.w;
      ws[ws.length - 1].e = w.e;
      return;
    }
    ws.push(x);
  });
  // 1) klip araligi
  const span = [Math.max(0, ws[0].s - PAD_IN), Math.min(d.duration, ws[ws.length - 1].e + PAD_OUT)];
  // fromSec/toSec: ses dalgasindan elle bulunmus kesin kesim noktasi (kelime arasinda sessiz an)
  if (spec.fromSec !== undefined) span[0] = spec.fromSec;
  if (spec.toSec !== undefined) span[1] = spec.toSec;
  // klip basi/sonundaki olu sessizligi ses dalgasina gore kirp (Whisper ilk kelimeyi genelde 0.0'a yazar)
  if (spec.fromSec === undefined && spec.toSec === undefined) for (const [a, b] of silences(name)) {
    if (a <= span[0] + 0.05 && b > span[0]) span[0] = Math.max(span[0], b - PAD_IN);
    if (b >= span[1] - 0.05 && a < span[1]) span[1] = Math.min(span[1], a + PAD_OUT);
  }
  // 2) gercek ses sessizliklerini cikar (her sessizlikten KEEP kadar nefes birakilir)
  let keep = [span];
  for (const [a, b] of silences(name)) {
    if (b - a < MIN_PAUSE) continue;
    const ra = a + KEEP / 2, rb = b - KEEP / 2;
    keep = keep.flatMap(([x, y]) => (rb <= x || ra >= y ? [[x, y]] : [[x, ra], [rb, y]].filter(([p, q]) => q - p > 0.05)));
  }
  // cok kisa parcalar (<0.25 sn): icinde kelime baslamiyorsa at, basliyorsa sonrakiyle birlestir (titreme olmasin)
  keep = keep.reduce((acc, iv, k, arr) => {
    const [x, y] = iv;
    if (y - x >= 0.25) return [...acc, iv];
    const hasWord = ws.some((w) => w.s >= x - 0.05 && w.s < y);
    if (!hasWord) return acc;
    if (k + 1 < arr.length) {
      arr[k + 1] = [x, arr[k + 1][1]];
      return acc;
    }
    return [...acc, iv];
  }, []);
  // 3) (istege bagli) cok uzun parcalari bol. Varsayilan KAPALI: konusurken kesim izleyiciyi rahatsiz eder.
  const SPLIT = draft.cutEvery ?? 0;
  const parts = [];
  keep.forEach(([x, y]) => {
    let start = x;
    if (SPLIT > 0)
      for (let k = 1; k < ws.length; k++) {
        const gap = ws[k].s - ws[k - 1].e;
        const cut = (ws[k - 1].e + ws[k].s) / 2;
        // yalnizca virgul/nokta sonrasi dogal bir aradan bol
        if (gap > 0.12 && /[.,!?]$/.test(ws[k - 1].w) && cut > start + SPLIT && cut < y - 1.0 && cut > x) {
          parts.push([start, cut]);
          start = cut;
        }
      }
    parts.push([start, y]);
  });
  const clipStart = pos;
  // 4) segmentler + kelime eslemesi
  const segStart = [];
  parts.forEach(([x, y]) => {
    const len = y - x;
    // cok kisa parcada kadraj degistirme (goz yorar)
    if (len >= 0.8 || !segments.length) alt++;
    const zoomed = draft.altZoom === false ? false : alt % 2 === 0;
    segStart.push(pos);
    segments.push({
      src: `${jobRel}/src/${name}.mp4`,
      in: +x.toFixed(3),
      out: +y.toFixed(3),
      ...framing(name, zoomed),
      gain: gain(name),
    });
    pos += len;
  });
  const map = (t) => {
    for (let k = 0; k < parts.length; k++) {
      const [x, y] = parts[k];
      if (t < x) return segStart[k]; // atilan sessizlige dustu -> sonraki parcanin basi
      if (t <= y) return segStart[k] + (t - x);
    }
    return pos;
  };
  ws.forEach((w) => {
    const key = `${name}#${w.i}`;
    const s = +map(w.s).toFixed(3);
    const e = +Math.max(s + 0.08, map(w.e)).toFixed(3);
    anchor[key] = { s, e };
    words.push({ w: fixes[key] ?? w.w, s, e, ...(draft.hl?.includes(key) ? { hl: true } : {}) });
  });
  // klip capalari: "Govde 4 B-roll@start" / "@end" (ayni klip iki kez kullanildiysa ilk baslangic, son bitis)
  anchor[`${name}@start`] ??= { s: clipStart, e: clipStart };
  anchor[`${name}@end`] = { s: pos, e: pos };
  clipRanges.push({ name, s: clipStart, e: pos });
});

const T = (v, end = false) => {
  if (typeof v === "number") return v;
  const r = anchor[v];
  if (!r) throw new Error(`Bilinmeyen kelime capasi: ${v}`);
  return end ? r.e : r.s;
};

const overlays = (draft.overlays ?? []).map((o) => {
  const at = +(T(o.at, !!o.atEnd) + (o.shift ?? 0)).toFixed(3); // atEnd: kelimenin bittigi an
  const end = o.until !== undefined ? T(o.until, true) + (o.untilShift ?? 0) : at + (o.dur ?? 2);
  const { until, shift, untilShift, atEnd, ...rest } = o;
  // liste maddeleri soylendigi anda belirsin: {"text": "...", "at": "Govde 3#3"} -> overlay icinde goreli saniye
  if (Array.isArray(rest.items) && rest.type !== "story" && rest.type !== "cutaway")
    rest.items = rest.items.map((it) => (typeof it === "string" ? it : { text: it.text, at: it.at !== undefined ? +(T(it.at) - at).toFixed(3) : undefined }));
  // K3 destek sahnesi: ogeler soylendikleri anda girer; "fluent:<ad>" -> kutuphaneden public/ikon3d/<ad>.png kopyalanir
  if (rest.type === "cutaway" && Array.isArray(rest.items)) {
    const lib = path.resolve(publicDir, "..", "..", "kutuphane", "3d-ikon", "fluent");
    fs.mkdirSync(path.join(publicDir, "ikon3d"), { recursive: true });
    rest.items = rest.items.map((it) => {
      const out = { ...it, at: it.at !== undefined && typeof it.at !== "number" ? +(T(it.at) - at).toFixed(3) : it.at };
      if (typeof it.icon === "string" && it.icon.startsWith("fluent:")) {
        const name = it.icon.slice(7);
        const src = path.join(lib, `${name}_3d.png`);
        if (!fs.existsSync(src)) throw new Error(`Fluent 3B ikon yok: ${name} (liste: _sistem/kutuphane/3d-ikon/fluent-liste.txt)`);
        fs.copyFileSync(src, path.join(publicDir, "ikon3d", `${name}.png`));
        out.icon = `ikon3d/${name}.png`;
      }
      return out;
    });
  }
  // story ogeleri de soylendikleri anda girer
  if (rest.type === "story" && Array.isArray(rest.items))
    rest.items = rest.items.map((it) => (it.at !== undefined && typeof it.at !== "number" ? { ...it, at: +(T(it.at) - at).toFixed(3) } : it));
  // film vuruslari: tum zaman alanlari kelime capasindan overlay-goreli saniyeye
  if (rest.type === "film") {
    const rel = (v, end = false) => (v === undefined ? undefined : +(T(v, end) - at).toFixed(3));
    rest.beats = rest.beats.map((bt) => ({
      ...bt,
      at: rel(bt.at, !!bt.atEnd),
      smallAt: rel(bt.smallAt),
      bigAt: rel(bt.bigAt),
      strikeAt: rel(bt.strikeAt),
      iconAt: rel(bt.iconAt),
      artAt: rel(bt.artAt),
      noteAt: rel(bt.noteAt),
      seq: bt.seq?.map((s) => ({ ...s, at: rel(s.at) })),
      // uygulama sahnesi: bildirim/kart/dokunma anlari kelimeye bagli
      device: bt.device && {
        ...bt.device,
        items: bt.device.items?.map((x) => ({ ...x, at: rel(x.at) })),
        pops: bt.device.pops?.map((x) => ({ ...x, at: rel(x.at) })),
        taps: bt.device.taps?.map((x) => rel(x)),
        zeroAt: rel(bt.device.zeroAt),
      },
      atEnd: undefined,
    }));
  }
  if (Array.isArray(rest.rows))
    rest.rows = rest.rows.map((r) => (r.at !== undefined ? { ...r, at: +(T(r.at) - at).toFixed(3) } : r));
  return { ...rest, at, dur: +(end - at).toFixed(3) };
});

// B-roll kontrolu: adinda "B-roll" gecen klipler sadece SES olarak kullanilir, goruntu tamamen animasyonla kaplanmali
const fullCover = overlays.filter((o) => ["white", "cta", "broll", "statement", "film", "cutaway"].includes(o.type) || (o.type === "story" && o.cut));
for (const r of clipRanges.filter((r) => /b-?roll/i.test(r.name) || draft.voiceOnly?.includes(r.name))) {
  const step = 1 / 30;
  for (let t = r.s + step; t < r.e - step; t += step) {
    if (!fullCover.some((o) => t >= o.at && t < o.at + o.dur)) {
      console.warn(`UYARI: "${r.name}" ${t.toFixed(2)} sn'de acikta (B-roll ses klibi goruntude gorunuyor). Overlay'i "${r.name}@start" .. "@end" araligina yay.`);
      break;
    }
  }
}

// vurgulu kelimelerde otomatik "punch" zoom
const punches = (draft.hl ?? []).filter((k) => anchor[k]).map((k) => ({ at: anchor[k].s, dur: Math.max(0.5, anchor[k].e - anchor[k].s + 0.3), scale: 1.1 }));

const out = {
  fps: 30,
  brand: draft.brand,
  segments,
  words,
  overlays,
  punches: [...punches, ...(draft.punches ?? []).map((p) => ({ ...p, at: T(p.at) }))],
  sfx: (draft.sfx ?? []).map((s) => ({ ...s, at: T(s.at) })),
  music: draft.music,
  extraEnd: draft.extraEnd ?? 0,
  takeTransition: draft.takeTransition ?? false,
  grade: draft.grade,
  noCaptions: (draft.noCaptions ?? []).map((n) => ({ at: T(n.at), dur: n.until ? T(n.until, true) - T(n.at) : n.dur })),
  captionStyle: draft.captionStyle,
  look: draft.look,
};
// derinlik stili: daha once cikarilmis kisi maskeleri (tools/maske.py) varsa ekle
const mIdx = path.join(publicDir, jobRel, "maske", "index.json");
if (fs.existsSync(mIdx)) out.mattes = JSON.parse(fs.readFileSync(mIdx, "utf8")).filter((m) => segments.some((s) => s.src === m.src));
if (overlays.some((o) => o.type === "behind")) {
  const fps = 30;
  let p = 0;
  const miss = [];
  for (const s of segments) {
    const L = s.out - s.in;
    const hit = overlays.some((o) => o.type === "behind" && o.at < p + L && o.at + o.dur > p);
    if (hit && !(out.mattes ?? []).some((m) => m.src === s.src && m.in < s.out && m.out > s.in)) miss.push(path.basename(s.src));
    p += L;
  }
  if (miss.length) console.warn(`BILGI: 'behind' icin kisi maskesi yok (${[...new Set(miss)].join(", ")}). Render oncesi: uv run tools/maske.py "${b}"`);
}
fs.mkdirSync(path.dirname(b), { recursive: true });
fs.writeFileSync(b, JSON.stringify(out, null, 1));
console.log(`is.json yazildi: ${b}  | konusma ${pos.toFixed(2)} sn + kapanis ${out.extraEnd} sn | ${segments.length} kesim`);
