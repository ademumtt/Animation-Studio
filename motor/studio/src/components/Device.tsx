// DEVICE – uygulama / ekran animasyonu (G1, 2026-11-15). saas-animation "UI in 3D space" dilinin Remotion karsiligi.
// 3B telefon: siyah cam, titanyum cerceve (derinlik dilimleri), dinamik ada, cam yansimasi. Kamera tek yonlu doner
// (yon degistirmez). Ekran: gercek ekran goruntusu (yavas kaydirma) ya da hazir arayuzler (bildirim, akis, randevu,
// istatistik). Ekrandan 3B firlayan kartlar (pops) ve dokunma halkasi (taps). Tum zamanlar overlay-goreli saniye.
import React from "react";
import { Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { SANS } from "../fonts";
import type { Brand, DeviceSpec } from "../types";

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ex = Easing.bezier(0.16, 1, 0.3, 1);
const spring2 = Easing.bezier(0.34, 1.35, 0.64, 1);
const PW = 372, PH = 766, R = 60; // telefon olcusu (px) – ekranin ~%34'u, arayuz yazilari okunur
const SW = PW - 22, SH = PH - 22; // ekran

type P = { d: DeviceSpec; from: number; to: number; fps: number; k1: number; dark: boolean; brand: Brand };

export const Device: React.FC<P> = ({ d, from, to, fps, k1: k1Abs, dark, brand }) => {
  const frame = useCurrentFrame();
  const lf = frame - from;
  const k1 = k1Abs - from; // buyuk satirin yerel karesi (lf ile ayni olcek)
  const len = Math.max(1, to - from);
  // is.json'da zamanlar sayi (kurgu.mjs kelime capasini cevirir)
  const F = (s: number | string | undefined, def: number) => (typeof s !== "number" ? def : Math.round(s * fps) - from);
  const acc = brand.accent, hi = brand.highlight ?? "#F6C26B";

  // ---- kamera: giris (hizli) + uzun yavas suzulme, yon hic donmez ----
  const inP = interpolate(lf, [0, 24], [0, 1], { ...cl, easing: ex });
  const drift = interpolate(lf, [0, len], [0, 1], cl);
  const cam = d.cam ?? "fly";
  let rx = 8, ry = -14, ty = 0, sc = 1;
  if (cam === "fly") (ty = 520 * (1 - inP)), (rx = 8 + 30 * (1 - inP)), (ry = -20 + 14 * drift), (sc = 0.84 + 0.16 * inP);
  if (cam === "tilt") (ry = 18 - 30 * drift), (rx = 6), (sc = 0.92 + 0.08 * inP), (ty = 60 * (1 - inP));
  if (cam === "orbit") (ry = 34 - 58 * drift), (rx = 4), (sc = 0.9 + 0.1 * inP), (ty = 40 * (1 - inP));
  const float = Math.sin(lf / 26) * 6;

  // ---- ekran icerigi ----
  const screen = (() => {
    // G5: ekran kaydi / video – vurus basindan itibaren sessiz oynar, ekrani doldurur
    if (d.video) {
      return (
        <Sequence from={from} layout="none">
          <OffthreadVideo src={staticFile(d.video)} muted style={{ width: SW, height: SH, objectFit: "cover" }} />
        </Sequence>
      );
    }
    if (d.screen) {
      const sp = interpolate(lf, [10, len], [0, 1], { ...cl, easing: Easing.inOut(Easing.sin) });
      return <Img src={staticFile(d.screen)} style={{ width: SW, transform: `translateY(${-(d.scroll ?? 0) * sp}px)` }} />;
    }
    switch (d.ui ?? "notif") {
      case "notif": {
        const items = d.items?.length ? d.items : [{ title: "Yeni randevu talebi", sub: "Yarın 14:00 · Saç boyama" }];
        return (
          <div style={{ width: SW, height: SH, background: `linear-gradient(170deg, ${mixHex(acc, "#ffffff", 0.18)} 0%, ${acc} 45%, #050505 100%)`, position: "relative" }}>
            <div style={{ position: "absolute", top: 70, width: "100%", textAlign: "center", color: "#fff", fontFamily: SANS }}>
              <div style={{ fontSize: 17, opacity: 0.8, fontWeight: 500 }}>Cumartesi, 15 Kasım</div>
              <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>09:41</div>
            </div>
            {items.slice(0, 5).map((it, i) => {
              const at = F(it.at, Math.max(10, k1 - 6) + i * 9);
              const p = interpolate(lf, [at, at + 12], [0, 1], { ...cl, easing: spring2 });
              const n = items.slice(0, 5).filter((x, j) => j > i && lf >= F(x.at, Math.max(10, k1 - 6) + j * 9)).length; // ustune gelenler asagi iter
              return (
                <div key={i} style={{ position: "absolute", left: 12, right: 12, top: 230 + n * 96, height: 84, borderRadius: 24, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", gap: 12, padding: "0 14px", opacity: p, transform: `translateY(${(1 - p) * -60}px) scale(${0.92 + 0.08 * p})`, boxShadow: "0 8px 24px rgba(0,0,0,0.18)" }}>
                  <AppIcon brand={brand} size={48} />
                  <div style={{ fontFamily: SANS, minWidth: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#111", whiteSpace: "nowrap" }}>{it.title}</div>
                    {it.sub && <div style={{ fontSize: 16, color: "#444", whiteSpace: "nowrap" }}>{it.sub}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
      case "feed": {
        const sp = interpolate(lf, [14, len], [0, 1], { ...cl, easing: Easing.inOut(Easing.sin) });
        const tiles = Array.from({ length: 18 });
        return (
          <div style={{ width: SW, background: "#fff", fontFamily: SANS, transform: `translateY(${-160 * sp}px)` }}>
            <div style={{ height: 56 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "0 16px" }}>
              <div style={{ width: 74, height: 74, borderRadius: "50%", padding: 3, background: `linear-gradient(45deg, ${hi}, ${acc})` }}>
                <AppIcon brand={brand} size={68} round />
              </div>
              {[["86", "gönderi"], [`${Math.round(interpolate(lf, [k1, k1 + 30], [1200, 1480], cl)).toLocaleString("tr-TR")}`, "takipçi"], ["210", "takip"]].map(([a, b], i) => (
                <div key={i} style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#111" }}>{a}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>{b}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: "10px 16px 0", fontSize: 14, fontWeight: 700, color: "#111" }}>{brand.name}</div>
            <div style={{ margin: "10px 16px", height: 32, borderRadius: 9, background: hi, color: "#111", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>Mesaj gönder</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, marginTop: 8 }}>
              {tiles.map((_, i) => {
                const on = interpolate(lf, [8 + i * 1.5, 18 + i * 1.5], [0, 1], cl);
                const k = (i * 37) % 5;
                const bg = [`linear-gradient(135deg, ${acc}, ${hi})`, `linear-gradient(200deg, ${hi}, #fff)`, acc, `linear-gradient(160deg, #222, ${acc})`, `linear-gradient(45deg, ${mixHex(hi, "#ffffff", 0.4)}, ${hi})`][k];
                return <div key={i} style={{ aspectRatio: "1", background: bg, opacity: on, transform: `scale(${0.9 + 0.1 * on})` }} />;
              })}
            </div>
          </div>
        );
      }
      case "booking": {
        const slots = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00"];
        return (
          <div style={{ width: SW, height: SH, background: "#f6f6f4", fontFamily: SANS, padding: "60px 18px 0", boxSizing: "border-box" }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: "#111" }}>Randevular</div>
            <div style={{ fontSize: 16, color: d.empty ? "#c0392b" : "#777", marginBottom: 14, fontWeight: d.empty ? 700 : 400 }}>
              Bugün · {d.empty ? `${Math.round(interpolate(lf, [6, 26], [0, slots.length], cl))} boş saat` : `${slots.length} saat`}
            </div>
            {slots.map((s, i) => {
              // empty: satirlar sirayla belirir, "Bos" yazisi soluk nabizla atar; dolu: k1'den itibaren sirayla dolar
              const on = d.empty ? 0 : interpolate(lf, [k1 - 8 + i * 5, k1 + 2 + i * 5], [0, 1], { ...cl, easing: spring2 });
              if (d.empty) {
                const show = interpolate(lf, [4 + i * 3, 12 + i * 3], [0, 1], cl);
                const pulse = 0.55 + 0.45 * Math.abs(Math.sin((lf + i * 7) / 14));
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, height: 72, borderBottom: "1px solid #e6e6e2", opacity: show }}>
                    <div style={{ width: 62, fontSize: 18, fontWeight: 700, color: "#333" }}>{s}</div>
                    <div style={{ flex: 1, height: 48, borderRadius: 14, border: "2px dashed #cfcfca", display: "flex", alignItems: "center", padding: "0 14px", color: "#9a9a94", fontSize: 16, fontWeight: 700, opacity: pulse }}>Boş</div>
                  </div>
                );
              }
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, height: 62, borderBottom: "1px solid #e6e6e2" }}>
                  <div style={{ width: 52, fontSize: 15, fontWeight: 700, color: "#333" }}>{s}</div>
                  <div style={{ flex: 1, height: 42, borderRadius: 12, background: on > 0.02 ? acc : "#ececea", display: "flex", alignItems: "center", padding: "0 12px", color: on > 0.02 ? "#fff" : "#aaa", fontSize: 13, fontWeight: 700, transform: `scaleX(${0.6 + 0.4 * Math.max(on, on > 0.02 ? 0 : 1)})`, transformOrigin: "left", opacity: 0.4 + 0.6 * Math.max(on, 0.2) }}>
                    {on > 0.5 ? "Dolu ✓" : "Boş"}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
      case "search": {
        // v8: arama cubuguna yazilir, rakipler listelenir, k1'de "isletmeniz yok" bos kart nabizla belirir
        const q = d.query ?? "en iyi hizmet yakınımda";
        const typed = Math.round(interpolate(lf, [8, 8 + q.length * 1.3], [0, q.length], cl));
        const res = [0, 1, 2, 3];
        const miss = interpolate(lf, [k1 - 4, k1 + 10], [0, 1], { ...cl, easing: spring2 });
        const pulse = 0.6 + 0.4 * Math.abs(Math.sin((lf - k1) / 12));
        return (
          <div style={{ width: SW, height: SH, background: "#f6f6f4", fontFamily: SANS, padding: "62px 16px 0", boxSizing: "border-box" }}>
            <div style={{ height: 48, borderRadius: 24, background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 10, padding: "0 16px" }}>
              <svg width="20" height="20" viewBox="0 0 20 20"><circle cx="8.5" cy="8.5" r="6" stroke="#666" strokeWidth="2.4" fill="none" /><path d="M13 13 L18 18" stroke="#666" strokeWidth="2.4" strokeLinecap="round" /></svg>
              <div style={{ fontSize: 16, color: "#222", whiteSpace: "nowrap", overflow: "hidden" }}>
                {q.slice(0, typed)}
                <span style={{ opacity: typed < q.length && Math.floor(lf / 8) % 2 === 0 ? 1 : 0, color: hi === "#C4F82A" ? "#5a7a00" : hi }}>|</span>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#888", margin: "14px 4px 8px" }}>Sonuçlar</div>
            {res.map((i) => {
              const on = interpolate(lf, [8 + q.length * 1.3 + i * 5, 18 + q.length * 1.3 + i * 5], [0, 1], { ...cl, easing: ex });
              return (
                <div key={i} style={{ height: 78, borderRadius: 16, background: "#fff", marginBottom: 10, display: "flex", alignItems: "center", gap: 12, padding: "0 12px", opacity: on, transform: `translateY(${(1 - on) * 16}px)` }}>
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: ["#d9d9d4", "#cfd6dc", "#dcd3cb", "#d4dccd"][i] }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ width: [150, 120, 165, 135][i], height: 12, borderRadius: 6, background: "#c9c9c4", marginBottom: 8 }} />
                    <div style={{ fontSize: 13, color: "#e3a400", letterSpacing: 1 }}>★★★★★</div>
                  </div>
                </div>
              );
            })}
            <div style={{ height: 78, borderRadius: 16, border: "2.5px dashed #d0574a", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#c0392b", fontSize: 16, fontWeight: 800, opacity: miss * pulse, transform: `scale(${0.9 + 0.1 * miss})` }}>
              <AppIcon brand={brand} size={38} /> Sizin işletmeniz yok
            </div>
          </div>
        );
      }
      case "ads": {
        // v8: reklam paneli – harcanan butce surekli artar, sonuc 0 kalir; zeroAt'ta 0 kirmiziya doner, cizgi duz
        const spent = interpolate(lf, [6, len], [180, 2450], { ...cl, easing: Easing.in(Easing.quad) });
        const z = F(d.zeroAt, k1 + 20);
        const red = interpolate(lf, [z, z + 8], [0, 1], cl);
        const zc = red > 0.5 ? "#ff5a4e" : "#fff";
        const dr = interpolate(lf, [10, 50], [0, 1], { ...cl, easing: ex });
        return (
          <div style={{ width: SW, height: SH, background: "#0d0d0d", fontFamily: SANS, padding: "58px 18px 0", boxSizing: "border-box", color: "#fff" }}>
            <div style={{ fontSize: 15, opacity: 0.6 }}>Reklam paneli</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>Bu ay</div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1, borderRadius: 18, background: "#1b1b1b", padding: "14px 14px" }}>
                <div style={{ fontSize: 13, opacity: 0.6 }}>Harcanan</div>
                <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.03em" }}>₺{Math.round(spent).toLocaleString("tr-TR")}</div>
              </div>
              <div style={{ flex: 1, borderRadius: 18, background: red > 0.5 ? "rgba(255,90,78,0.14)" : "#1b1b1b", padding: "14px 14px", boxShadow: red > 0.5 ? "inset 0 0 0 2px #ff5a4e" : "none" }}>
                <div style={{ fontSize: 13, opacity: 0.6 }}>Yeni müşteri</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: zc, transform: `scale(${1 + 0.12 * Math.sin(Math.PI * red)})`, transformOrigin: "left" }}>0</div>
              </div>
            </div>
            <svg width={SW - 36} height="200" viewBox="0 0 298 200" style={{ marginTop: 26 }}>
              {[40, 90, 140].map((y) => <line key={y} x1="0" x2="298" y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="2" />)}
              <path d="M10 170 L288 170" stroke={red > 0.5 ? "#ff5a4e" : "rgba(255,255,255,0.55)"} strokeWidth="5" strokeLinecap="round" strokeDasharray="300" strokeDashoffset={300 * (1 - dr)} />
            </svg>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 70, marginTop: 10 }}>
              {[0.12, 0.1, 0.13, 0.11, 0.12, 0.1, 0.12].map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h * 100}%`, borderRadius: 6, background: "rgba(255,255,255,0.18)" }} />
              ))}
            </div>
          </div>
        );
      }
      case "stats": {
        const v = interpolate(lf, [k1, k1 + 30], [0, d.value ?? 30], { ...cl, easing: Easing.out(Easing.cubic) });
        const line = "M16 230 C70 220 90 200 130 190 C170 180 190 140 230 120 C250 110 270 70 282 40";
        const dr = interpolate(lf, [k1 - 4, k1 + 34], [0, 1], { ...cl, easing: ex });
        return (
          <div style={{ width: SW, height: SH, background: "#0d0d0d", fontFamily: SANS, padding: "56px 18px 0", boxSizing: "border-box", color: "#fff" }}>
            <div style={{ fontSize: 15, opacity: 0.6 }}>Bu ay</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{d.label ?? "Yeni müşteri"}</div>
            {d.hideValue ? (
              <div style={{ height: 97, display: "flex", alignItems: "center" }}>
                <svg width="86" height="86" viewBox="0 0 86 86" style={{ transform: `translateY(${(1 - dr) * 20}px)`, opacity: dr }}>
                  <circle cx="43" cy="43" r="40" fill={hi} />
                  <path d="M43 64 V24 M27 39 L43 23 L59 39" stroke="#111" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ) : (
              <div style={{ fontSize: 88, fontWeight: 800, letterSpacing: "-0.04em", color: hi, lineHeight: 1.1 }}>+{Math.round(v)}</div>
            )}
            <svg width={SW - 36} height="260" viewBox="0 0 298 260" style={{ marginTop: 10 }}>
              <defs>
                <linearGradient id="stG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={hi} stopOpacity="0.45" />
                  <stop offset="1" stopColor={hi} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`${line} L282 260 L16 260 Z`} fill="url(#stG)" opacity={dr} />
              <path d={line} stroke={hi} strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray="400" strokeDashoffset={400 * (1 - dr)} />
            </svg>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 90 }}>
              {[0.35, 0.5, 0.42, 0.7, 0.62, 0.9, 1].map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h * 100 * interpolate(lf, [k1 + i * 3, k1 + 14 + i * 3], [0.1, 1], cl)}%`, borderRadius: 6, background: i === 6 ? hi : "rgba(255,255,255,0.18)" }} />
              ))}
            </div>
          </div>
        );
      }
    }
    return null;
  })();

  // cam yansimasi kamera acisiyla kayar
  const glare = 30 + ry * 1.6;

  return (
    <div style={{ position: "relative", width: 1080, height: 860, display: "flex", alignItems: "center", justifyContent: "center", perspective: 1800 }}>
      {/* derinlik: arkada bulanik marka lekeleri (sig alan derinligi hissi) */}
      <div style={{ position: "absolute", left: 160, top: 120, width: 420, height: 420, borderRadius: "50%", background: hi, opacity: 0.22 * inP, filter: "blur(90px)" }} />
      <div style={{ position: "absolute", right: 150, bottom: 60, width: 380, height: 380, borderRadius: "50%", background: dark ? acc : mixHex(acc, "#ffffff", 0.5), opacity: 0.35 * inP, filter: "blur(90px)" }} />
      <div style={{ position: "relative", width: PW, height: PH, transformStyle: "preserve-3d", transform: `translateY(${ty + float}px) scale(${sc}) rotateX(${rx}deg) rotateY(${ry}deg)`, opacity: Math.min(1, inP * 1.6) }}>
        {/* yere dusen golge */}
        <div style={{ position: "absolute", left: 30, right: 30, bottom: -60, height: 50, borderRadius: "50%", background: "rgba(0,0,0,0.45)", filter: "blur(28px)", transform: "translateZ(-40px) rotateX(80deg)" }} />
        {/* govde derinlik dilimleri (titanyum yan) */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ position: "absolute", inset: 0, borderRadius: R, background: i < 9 ? `rgb(${46 - i * 3},${46 - i * 3},${50 - i * 3})` : "#0a0a0a", transform: `translateZ(${-1.6 * (10 - i)}px)` }} />
        ))}
        <div style={{ position: "absolute", inset: 0, borderRadius: R, background: "#0a0a0a", boxShadow: dark ? `inset 0 0 0 2px #6a6a70, inset 0 0 0 5px #0a0a0a, 0 0 0 1.5px rgba(255,255,255,0.18), 0 0 60px ${hi}33` : "inset 0 0 0 2px #3c3c40, inset 0 0 0 5px #0a0a0a" }} />
        {/* ekran */}
        <div style={{ position: "absolute", left: 11, top: 11, width: SW, height: SH, borderRadius: R - 11, overflow: "hidden", background: "#000" }}>
          {screen}
          {/* dokunma halkalari */}
          {(d.taps ?? []).map((t, i) => {
            const tf = F(t, 0);
            const p = interpolate(lf, [tf, tf + 16], [0, 1], cl);
            return p > 0 && p < 1 ? <div key={i} style={{ position: "absolute", left: SW / 2 - 40 * p, top: SH * 0.68 - 40 * p, width: 80 * p, height: 80 * p, borderRadius: "50%", background: "rgba(255,255,255,0.35)", border: "3px solid rgba(255,255,255,0.8)", opacity: 1 - p }} /> : null;
          })}
          {/* cam yansimasi */}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(115deg, rgba(255,255,255,0) ${glare - 12}%, rgba(255,255,255,0.13) ${glare}%, rgba(255,255,255,0) ${glare + 14}%)` }} />
          {/* dinamik ada */}
          <div style={{ position: "absolute", left: SW / 2 - 48, top: 12, width: 96, height: 28, borderRadius: 16, background: "#000" }} />
        </div>
        {/* ekrandan 3B firlayan kartlar */}
        {(d.pops ?? []).map((pp, i) => {
          const at = F(pp.at, Math.max(14, k1) + i * 10);
          const p = interpolate(lf, [at, at + 16], [0, 1], { ...cl, easing: spring2 });
          const side = pp.side ?? (i % 2 ? "l" : "r");
          const x = side === "r" ? PW - 70 : -190, y = 110 + i * 150;
          return (
            <div key={i} style={{ position: "absolute", left: x, top: y, width: 260, padding: "16px 18px", borderRadius: 24, background: "rgba(255,255,255,0.96)", boxShadow: "0 30px 60px rgba(0,0,0,0.28)", display: "flex", alignItems: "center", gap: 12, fontFamily: SANS, opacity: p, transform: `translateZ(${40 + 110 * p}px) translateY(${(1 - p) * 40}px) scale(${0.8 + 0.2 * p})` }}>
              {pp.icon ? <Img src={staticFile(pp.icon)} style={{ width: 44, height: 44 }} /> : <div style={{ width: 44, height: 44, borderRadius: 14, background: hi, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#111" }}>✓</div>}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 19, fontWeight: 800, color: "#111", lineHeight: 1.15 }}>{pp.title}</div>
                {pp.sub && <div style={{ fontSize: 14, color: "#666", marginTop: 2 }}>{pp.sub}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AppIcon: React.FC<{ brand: Brand; size: number; round?: boolean }> = ({ brand, size, round }) => (
  <div style={{ width: size, height: size, borderRadius: round ? "50%" : size * 0.26, background: brand.accent, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, border: round ? "3px solid #fff" : "none", boxSizing: "border-box" }}>
    {brand.logo ? <Img src={staticFile(brand.logo)} style={{ width: "86%", height: "86%", objectFit: "contain" }} /> : <span style={{ color: brand.highlight ?? "#fff", fontFamily: SANS, fontWeight: 800, fontSize: size * 0.45 }}>{brand.name[0]}</span>}
  </div>
);

function mixHex(a: string, b: string, k: number) {
  const p = (h: string) => {
    const x = h.replace("#", "");
    const n = parseInt(x.length === 3 ? x.split("").map((c) => c + c).join("") : x.slice(0, 6), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const A = p(a), B = p(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(",")})`;
}
