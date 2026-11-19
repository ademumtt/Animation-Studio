// Film vuruslarindan ses tasarimi icin olay listesi (saas-animation "window.EVENTS" fikrinin Remotion karsiligi).
// Kullanim (studio icinden): node scripts/olaylar.mjs <is.json> <olaylar.json>
// Uretilen adlar (reklam zaman cizelgesinde saniye):
//   b<N>.start  vurus basi / gecis      b<N>.small  ince satir      b<N>.big  buyuk satir / cizimin ana tetigi
//   b<N>.seq<K> seq kelime degisimi     b<N>.strike ustu cizilir    b<N>.note  not satiri    b<N>.icon  ikon
//   end         video sonu
// Animasyon yeniden zamanlanirsa olaylar da kendiliginden kayar; cues.json "event" adlariyla yazilir.
import fs from "node:fs";

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error("Kullanim: node scripts/olaylar.mjs <is.json> <olaylar.json>");
  process.exit(1);
}
const spec = JSON.parse(fs.readFileSync(inPath, "utf8"));
const ev = [];
const add = (name, t) => t !== undefined && t !== null && !Number.isNaN(t) && ev.push({ name, t: +t.toFixed(3) });
for (const o of spec.overlays ?? []) {
  if (o.type !== "film") continue;
  o.beats.forEach((b, i) => {
    const n = i + 1, at = (v) => (v === undefined ? undefined : o.at + v);
    add(`b${n}.start`, at(b.at));
    add(`b${n}.small`, at(b.smallAt ?? (b.small ? b.at : undefined)));
    add(`b${n}.big`, at(b.bigAt ?? (b.big || b.art ? b.at : undefined)));
    (b.seq ?? []).forEach((s, k) => add(`b${n}.seq${k + 1}`, at(s.at)));
    add(`b${n}.strike`, at(b.strikeAt));
    add(`b${n}.note`, at(b.noteAt));
    add(`b${n}.icon`, at(b.iconAt));
  });
}
const speech = (spec.segments ?? []).reduce((s, g) => s + (g.out - g.in), 0);
add("end", speech + (spec.extraEnd ?? 0));
ev.sort((a, b) => a.t - b.t);
fs.writeFileSync(outPath, JSON.stringify(ev, null, 1));
console.log(`${ev.length} olay -> ${outPath}`);
