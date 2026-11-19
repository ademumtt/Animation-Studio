// OTOMATIK TASLAK: ses kaydinin kelime zamanlarindan + marka kartindan ilk `film` taslagini uretir.
// Claude bu taslagi storyboard oncesi gozden gecirip duzeltir (ozellikle small/big satir bolmesi).
//
// Kullanim (studio icinden):
//   node scripts/taslak.mjs "<Müşteri>" "<klip adi>" <cikti.json>
//   orn: node scripts/taslak.mjs "Ornek Marka" "Seslendirme 2" "../kurgu/Ornek Marka/S4_oto.json"
// Okur:  _sistem/kurgu/<Müşteri>/marka.json  (yoksa _sistem/kurgu/_ORNEK_marka.json'a bakip olustur)
//        public/jobs/<slug>/transkript.json   (tools/hazirla.py uretir)
// Kurallar (OGRENILENLER.md'den): 1 cumle ~ 1 vurus (2-3.5 sn), ilk vurus koyu "kanca", temalar donusumlu,
// gecisler ortadan (ring/wipe sirayla), liste -> seq, sayi -> sayac/etiket, son: CTA + logo/konum/buton.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [, , musteri, klip, outPath] = process.argv;
if (!musteri || !klip || !outPath) {
  console.error('Kullanim: node scripts/taslak.mjs "<Müşteri>" "<klip adi>" <cikti.json>');
  process.exit(1);
}
const here = path.dirname(fileURLToPath(import.meta.url));
const STUDIO = path.resolve(here, "..");
const SISTEM = path.resolve(STUDIO, "..");
const slug = (s) =>
  s.replace(/ı/g, "i").replace(/İ/g, "I").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const kartPath = path.join(SISTEM, "kurgu", musteri, "marka.json");
if (!fs.existsSync(kartPath)) {
  console.error(`Marka karti yok: ${kartPath}\n_sistem/kurgu/_ORNEK_marka.json'u kopyalayip doldur (logo, renkler, konum, cta).`);
  process.exit(1);
}
const kart = JSON.parse(fs.readFileSync(kartPath, "utf8").replace(/^﻿/, ""));
const job = `jobs/${slug(musteri)}`;
const tr = JSON.parse(fs.readFileSync(path.join(STUDIO, "public", job, "transkript.json"), "utf8"));
const W = tr[klip]?.words;
if (!W) {
  console.error(`Transkriptte "${klip}" yok. Klipler: ${Object.keys(tr).join(", ")}`);
  process.exit(1);
}

const low = (s) => s.toLocaleLowerCase("tr");
const clean = (s) => s.replace(/[.,!;:…"“”]+$/g, "").replace(/^["“”]+/, "");
const ref = (i) => `${klip}#${i}`;
const isNum = (s) => /^\d[\d.,]*$/.test(clean(s));
const fix = {};
W.forEach((w, i) => {
  const c = clean(w.w);
  if (/^\d{4,}$/.test(c)) fix[ref(i)] = c.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + w.w.slice(c.length); // 4000 -> 4.000
});
const word = (i) => (fix[ref(i)] ?? W[i].w);

// ---- 1) cumleler ----
const sentences = [];
let cur = [];
W.forEach((w, i) => {
  cur.push(i);
  if (/[.?!]$/.test(w.w) || i === W.length - 1) {
    sentences.push(cur);
    cur = [];
  }
});

// ---- 2) uzun cumleleri 2-3.5 sn'lik vuruslara bol (virgul, baglac oncesi, sonra sure) ----
const dur = (ix) => W[ix[ix.length - 1]].e - W[ix[0]].s;
const BREAK_BEFORE = new Set(["ve", "olan", "için", "ama", "çünkü", "sizden", "bizden", "hemen"]);
// liste araliklari ("ombre, sombre, balyaj ya da röfle"): bolunmez, kendi vurusu olur (+ en fazla 2 kuyruk kelimesi)
const listOf = new Map(); // ilk madde indeksi -> son madde indeksi
for (let i = 0; i < W.length; i++) {
  if (!/,$/.test(W[i].w)) continue;
  let j = i, n = 1;
  while (j + 2 < W.length && /,$/.test(W[j + 1].w)) (j = j + 1), n++;
  if (n < 2) continue;
  let end = j + 1; // son virgulden sonraki madde ("balyaj")
  const cj = low(clean(W[end + 1]?.w ?? ""));
  if (["ya", "veya", "ve"].includes(cj)) end += cj === "ya" ? 3 : 2; // "ya da röfle"
  listOf.set(i, Math.min(end, W.length - 1));
  i = end;
}
const chunks = [];
for (const s of sentences) {
  if ((dur(s) <= 3.6 || s.length <= 6) && ![...listOf.keys()].some((k) => s.includes(k))) {
    chunks.push(s);
    continue;
  }
  let part = [];
  let tail = -1; // liste kuyrugu: listeden sonra kalan kelime sayisi
  const flush = () => part.length && (chunks.push(part), (part = []));
  s.forEach((i, k) => {
    const next = s[k + 1];
    if (listOf.has(i)) flush(), (tail = -2); // liste kendi vurusunda baslar
    part.push(i);
    if (tail === -2 && [...listOf.entries()].some(([a, e]) => e === i)) tail = 0;
    else if (tail >= 0) tail++;
    if (next === undefined) return;
    if (tail === -2) return; // liste icinde bolme yok
    if (tail >= 2) return flush(), (tail = -1);
    if (tail >= 0) return;
    const d = W[i].e - W[part[0]].s;
    const goodBreak = /,$/.test(W[i].w) || BREAK_BEFORE.has(low(clean(W[next].w)));
    if ((goodBreak && d >= 1.6) || d >= 3.4) flush();
  });
  if (part.length) {
    // cok kisa artik (<0.7 sn) bir oncekine eklenir; "bizden hediye" gibi vurgu cumleleri kendi vurusunda kalir
    if (dur(part) < 0.7 && chunks.length) chunks[chunks.length - 1].push(...part);
    else chunks.push(part);
  }
}

// ---- 3) cizim secimi (KATALOG.md) ----
const kuafor = kart.sektor === "kuafor";
const ARTS = [
  ["chat", /whatsapp|mesaj|\byaz[ıi]n\b/, true],
  ["frayed", /yıpran|kırıl|hasar|kuru/, kuafor],
  ["bond", /\bbağ\b|onar|güçlendir/, kuafor],
  ["scissorsSpin", /kesim|\bkes\b|makas/, true], // SADECE donen 3B makas (kullanici: el/sac absurt gorunuyor)
  ["percent", /indirim|yüzde|%/, true],
  ["gift", /hediye|ücretsiz|bedava/, true], // taslakta gozden gecirirken: 3B kutu icin "obj": {"kind": "gift"} tercih et
  ["tag", /fiyat|değer|lira|\btl\b|₺/, true],
  ["refund", /iade|geri öde|paran(ı|ız) geri|geri al/, true],
  ["coin", /ücret|para|ödeme|kuruş/, true],
  ["calendar", /\bay\b|hafta|\bgün|takvim|tarih/, true],
  ["clock", /saat|dakika|hızlı|süre|bekleme/, true],
  ["pin", /adres|konum|şube|\byer\b/, true],
  ["phone", /\bara(yın)?\b|telefon|numara/, true],
  ["star", /yorum|memnun|kalite|yıldız|uzman/, true],
  ["guarantee", /garanti|\bsöz\b|taahhüt/, true],
  ["shield", /risk|güvence|koru/, true],
  ["check", /güven|onay|kontrol|adım/, true],
  ["people", /müşteri|danışan|kişi|takipçi/, true],
  ["post", /reklam|paylaşım|gönderi|yayınl|içerik/, true],
  ["heart", /sev|mutlu|bakımlı|güzel/, true],
  ["hair3d", new RegExp(low(kart.name).split(" ")[0] + "|saç|kuaför"), true], // 3B isikli portre
];
const used = new Set();
const pickArt = (txt) => {
  for (const [name, re, ok] of ARTS) if (ok && !used.has(name) && re.test(txt)) return used.add(name), name;
  return undefined;
};

// ---- 4) vuruslar ----
const THEMES = ["brand", "light"];
let tIdx = 0;
const beats = chunks.map((ix, n) => {
  const txt = low(ix.map((i) => W[i].w).join(" "));
  const b = { at: ref(ix[0]) };
  // liste: "a, b, c ya da d" -> kelime yerinde degisir
  const commas = ix.filter((i) => /,$/.test(W[i].w));
  if (commas.length >= 2) {
    const first = commas[0];
    const items = [...commas];
    const lastC = commas[commas.length - 1];
    let lastItem = lastC;
    if (ix.includes(lastC + 1)) items.push(lastC + 1), (lastItem = lastC + 1); // "balyaj"
    const cj = low(clean(W[lastItem + 1]?.w ?? ""));
    if (["ya", "veya", "ve"].includes(cj)) {
      const li = lastItem + (cj === "ya" ? 3 : 2); // "ya da röfle"
      if (ix.includes(li)) items.push(li), (lastItem = li);
    }
    const after = ix.indexOf(lastItem) + 1;
    b.italic = true;
    b.bigFirst = true;
    b.bigAt = ref(first);
    b.seq = items.map((i) => ({ at: ref(i), text: clean(word(i)) }));
    const rest = ix.slice(after);
    if (rest.length) (b.small = rest.map((i) => clean(word(i))).join(" ")), (b.smallAt = ref(rest[0]));
    b.art = kuafor ? (used.add("lock"), "lock") : pickArt(txt);
    return b;
  }
  const numK = ix.findIndex((i) => isNum(W[i].w));
  let small, big, bigFrom;
  if (numK >= 0) {
    const ni = ix[numK];
    const unit = ix[numK + 1] !== undefined && /^(lira|tl|₺)/.test(low(W[ix[numK + 1]].w)) ? " TL" : "";
    big = clean(word(ni)) + unit;
    bigFrom = numK;
    small = ix.slice(Math.max(0, numK - 5), numK).map((i) => clean(word(i))).join(" ") || undefined;
    const after = ix.slice(numK + (unit ? 2 : 1));
    if (after.length >= 3) (b.note = after.map((i) => clean(word(i))).join(" ")), (b.noteAt = ref(after[0]));
  } else {
    // buyuk satir: son 3 kelime (cok uzunsa 2); 2 kelimelik vurusta ilk kelime kucuk, son kelime buyuk
    let k = ix.length <= 2 ? 1 : ix.length <= 4 ? 2 : 3;
    if (k === 3 && ix.slice(-3).map((i) => clean(word(i))).join(" ").length > 24) k = 2;
    bigFrom = ix.length - k;
    big = ix.slice(bigFrom).map((i) => clean(word(i))).join(" ");
    const sm = ix.slice(Math.max(0, bigFrom - 6), bigFrom);
    small = sm.length ? sm.map((i) => clean(word(i))).join(" ") : undefined;
    if (/\?$/.test(W[ix[ix.length - 1]].w) && !big.endsWith("?")) big += "?";
    if (/\.$/.test(W[ix[ix.length - 1]].w) && b.at && k <= 2) big += "."; // kisa vurgu: v1 dilinde noktali ("hediye.")
  }
  if (small) b.small = small;
  b.big = big;
  b.bigAt = ref(ix[bigFrom]);
  if (big.length <= 14 && numK < 0) b.block = true;
  b.art = pickArt(txt);
  return b;
});

// temalar + gecisler: ilk vurus koyu kanca, hediye/ucretsiz -> glow, CTA -> light, digerleri brand/light donusumlu
beats.forEach((b, n) => {
  if (n === 0) b.theme = "night";
  else if (b.art === "gift" || b.art === "coin") b.theme = "glow";
  else if (b.art === "chat" || b.art === "phone" || b.art === "pin") b.theme = "light";
  else b.theme = THEMES[tIdx++ % 2];
  if (n > 0) b.trans = n % 2 ? "ring" : "wipe";
  if (b.theme === "night" || b.art === "tag") b.deco = ["grid"];
});
// kapanis: son kelimede logo + konum + buton
const last = W.length - 1;
beats.push({
  at: ref(last),
  theme: kart.kapanisTema ?? "light",
  ...(kart.logoW ? { logoW: kart.logoW } : {}),
  trans: beats.length % 2 ? "ring" : "wipe",
  ...(kart.logo ? { logo: kart.logo } : { big: kart.name }),
  ...(kart.konum ? { small: kart.konum } : {}),
  ...(kart.cta?.buton ? { button: kart.cta.buton } : {}),
  ...(kart.cta?.kanal === "whatsapp" ? { buttonIcon: "ortak/whatsapp.png" } : {}),
});

const brand = Object.fromEntries(Object.entries(kart).filter(([k]) => ["name", "accent", "accentText", "highlight", "dark", "logo", "tint"].includes(k)));
const draft = {
  job,
  brand,
  _stil: "OTOMATIK TASLAK (scripts/taslak.mjs) - en iyi surumun dili: film + Art, gecisler ortadan. Claude gozden gecirir.",
  _senaryo: W.map((w) => w.w).join(" "),
  clips: [klip],
  voiceOnly: [klip],
  captions: false,
  altZoom: false,
  fix,
  overlays: [{ type: "film", at: `${klip}@start`, until: `${klip}@end`, untilShift: 2.2, sfx: false, gecisSesi: false, beats }],
  extraEnd: 2.2,
};
fs.writeFileSync(outPath, JSON.stringify(draft, null, 2));

// ozet (storyboard icin)
const tAt = (r) => W[+r.split("#")[1]].s.toFixed(1);
console.log(`${beats.length} vurus -> ${outPath}`);
beats.forEach((b, n) =>
  console.log(
    `${String(n + 1).padStart(2)}. ${tAt(b.at)}s ${b.theme.padEnd(5)} ${(b.trans ?? "-").padEnd(4)} ${(b.art ?? "-").padEnd(9)} | ${b.small ?? ""}${b.seq ? " [" + b.seq.map((s) => s.text).join("/") + "]" : ""} || ${b.big ?? (b.logo ? "LOGO" : "")}${b.note ? "  (" + b.note + ")" : ""}`
  )
);
