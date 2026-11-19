// OBJ3D – GERCEK 3B NESNELER (CSS 3D, 6 yuzlu kutular). 2026-11-15, kullanici 3B dili seviyor.
// Her yuz kamera acisina gore isiktan pay alir (sol ust tek isik kaynagi) -> donerken gercek golgelenme.
// Nesneler: "gift" (doner, k1'de kapak firlar + ic isik + pariltilar), "calendar" (masa takvimi, k1'den itibaren
// sayfalar ust kenardan cevrilir: pages[]). Kamera tek yonlu doner (yon degistirmez). Zamanlar yerel kare (lf, k1).
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { SANS } from "../fonts";
import type { Brand, ObjSpec } from "../types";

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ex = Easing.bezier(0.16, 1, 0.3, 1);
const spr = Easing.bezier(0.34, 1.45, 0.64, 1);

const hex = (h: string) => {
  const x = h.replace("#", "");
  const n = parseInt(x.length === 3 ? x.split("").map((c) => c + c).join("") : x.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
/** rengi parlaklik katsayisiyla (0..1.3) koyulastir/acar */
const shade = (h: string, k: number) => `rgb(${hex(h).map((v) => Math.max(0, Math.min(255, Math.round(v * k)))).join(",")})`;

/** Yuz isigi: yuz normalinin dunya acisi (deg, Y ekseni) + isik yonu (sol on, -35deg) */
const lightY = (normalDeg: number) => 0.62 + 0.42 * Math.max(0, Math.cos(((normalDeg + 35) * Math.PI) / 180));

type BoxP = { w: number; h: number; d: number; color: string; ry: number; faces?: Partial<Record<"front" | "back" | "left" | "right" | "top", React.ReactNode>>; topK?: number };
/** 6 yuzlu kutu; merkez orijinde. ry: kutunun dunya Y donusu (isik hesabi icin). */
const Box: React.FC<BoxP> = ({ w, h, d, color, ry, faces = {}, topK = 1.18 }) => {
  const face = (key: string, fw: number, fh: number, tr: string, k: number, node?: React.ReactNode) => (
    <div key={key} style={{ position: "absolute", left: -fw / 2, top: -fh / 2, width: fw, height: fh, background: shade(color, k), transform: tr, backfaceVisibility: "hidden", overflow: "hidden" }}>
      {node}
      {/* yuz kenari: ince kontur (kutu hacmi okunsun) */}
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 0 1.5px rgba(0,0,0,0.18)" }} />
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 0, top: 0, transformStyle: "preserve-3d" }}>
      {face("front", w, h, `translateZ(${d / 2}px)`, lightY(ry), faces.front)}
      {face("back", w, h, `rotateY(180deg) translateZ(${d / 2}px)`, lightY(ry + 180), faces.back)}
      {face("right", d, h, `rotateY(90deg) translateZ(${w / 2}px)`, lightY(ry + 90), faces.right)}
      {face("left", d, h, `rotateY(-90deg) translateZ(${w / 2}px)`, lightY(ry - 90), faces.left)}
      {face("top", w, d, `rotateX(90deg) translateZ(${h / 2}px)`, topK, faces.top)}
      {face("bottom", w, d, `rotateX(-90deg) translateZ(${h / 2}px)`, 0.45)}
    </div>
  );
};

type P = { o: ObjSpec; from: number; to: number; k1: number; dark: boolean; brand: Brand };

export const Obj3D: React.FC<P> = ({ o, from, to, k1: k1Abs, dark, brand }) => {
  const frame = useCurrentFrame();
  const lf = frame - from;
  const k1 = k1Abs - from;
  const len = Math.max(1, to - from);
  const acc = brand.accent, hi = brand.highlight ?? "#F6C26B";
  const inP = interpolate(lf, [0, 24], [0, 1], { ...cl, easing: ex });
  // tek yonlu donus: hizli giris, sonra yavas surekli
  const ry = interpolate(lf, [0, 30], [-120, -30], { ...cl, easing: ex }) + interpolate(lf, [30, len + 30], [0, 0.55 * (len + 0)], cl);
  const rx = -16;
  const float = Math.sin(lf / 22) * 8;

  const ground = (wd: number) => (
    <div style={{ position: "absolute", left: 540 - wd / 2, top: 700, width: wd, height: 60, borderRadius: "50%", background: "rgba(0,0,0,0.42)", filter: "blur(26px)", opacity: inP }} />
  );
  const scene = (children: React.ReactNode, groundW: number) => (
    <div style={{ position: "relative", width: 1080, height: 820, perspective: 1600 }}>
      <div style={{ position: "absolute", left: 270, top: 140, width: 540, height: 540, borderRadius: "50%", background: hi, opacity: 0.2 * inP, filter: "blur(100px)" }} />
      {ground(groundW)}
      <div style={{ position: "absolute", left: 540, top: 430 + float + (1 - inP) * 160, transformStyle: "preserve-3d", transform: `scale(${0.7 + 0.3 * inP}) rotateX(${rx}deg) rotateY(${ry}deg)`, opacity: Math.min(1, inP * 1.5) }}>
        {children}
      </div>
    </div>
  );

  if (o.kind === "gift") {
    const W = 300, H = 230, D = 300;
    const pop = interpolate(lf, [k1, k1 + 14], [0, 1], { ...cl, easing: spr });
    const glow = interpolate(lf, [k1 + 2, k1 + 16], [0, 1], cl);
    const ribbon = (vertical: boolean) => <div style={{ position: "absolute", ...(vertical ? { left: "50%", top: 0, bottom: 0, width: 46, marginLeft: -23 } : { top: "50%", left: 0, right: 0, height: 46, marginTop: -23 }), background: `linear-gradient(90deg, ${shade(hi, 0.8)}, ${hi} 45%, ${shade(hi, 1.15)} 55%, ${shade(hi, 0.85)})` }} />;
    const side = <>{ribbon(true)}</>;
    return scene(
      <>
        {/* kutu govdesi */}
        <div style={{ position: "absolute", transformStyle: "preserve-3d", transform: `translateY(${H / 2 - 40}px)` }}>
          <Box w={W} h={H} d={D} color={acc} ry={ry} faces={{ front: side, back: side, left: side, right: side, top: <>{ribbon(true)}{ribbon(false)}</> }} />
        </div>
        {/* ic isik (kapak acilinca yukari huzme) */}
        <div style={{ position: "absolute", left: -W / 2, top: -170 - 220 * glow, width: W, height: 260 + 220 * glow, background: `linear-gradient(0deg, ${hi} 0%, rgba(255,255,255,0) 100%)`, opacity: 0.55 * glow, filter: "blur(18px)", transform: "translateZ(0px)" }} />
        {/* kapak: k1'de yukari firlar ve egilir */}
        <div style={{ position: "absolute", transformStyle: "preserve-3d", transform: `translateY(${-40 - 20 - 230 * pop}px) translateX(${70 * pop}px) rotateZ(${24 * pop}deg) rotateX(${-18 * pop}deg)` }}>
          <Box w={W + 30} h={56} d={D + 30} color={shade(acc, 1.12)} ry={ry} faces={{ front: ribbon(true), back: ribbon(true), left: ribbon(true), right: ribbon(true), top: <>{ribbon(true)}{ribbon(false)}</> }} />
          {/* fiyonk: kameraya bakan iki ilmek */}
          <div style={{ position: "absolute", left: -70, top: -100, width: 140, height: 80, transform: `rotateY(${-ry}deg) rotateX(${-rx}deg)` }}>
            <svg width="140" height="80" viewBox="0 0 140 80">
              <path d="M70 70 C30 10 0 30 20 60 C30 75 55 72 70 70 Z" fill={hi} stroke={shade(hi, 0.7)} strokeWidth="3" />
              <path d="M70 70 C110 10 140 30 120 60 C110 75 85 72 70 70 Z" fill={shade(hi, 1.1)} stroke={shade(hi, 0.7)} strokeWidth="3" />
              <circle cx="70" cy="68" r="11" fill={shade(hi, 0.85)} />
            </svg>
          </div>
        </div>
        {/* pariltilar */}
        {[0, 1, 2, 3, 4].map((i) => {
          const sp = interpolate(lf, [k1 + 6 + i * 3, k1 + 30 + i * 3], [0, 1], cl);
          if (sp <= 0 || sp >= 1) return null;
          const a = -Math.PI / 2 + (i - 2) * 0.45;
          const r = 120 + 230 * sp;
          return <div key={i} style={{ position: "absolute", left: Math.cos(a) * r - 14, top: -120 + Math.sin(a) * r - 14, width: 28, height: 28, transform: `rotateY(${-ry}deg) rotate(${lf * 6}deg)`, opacity: 1 - sp }}>
            <svg width="28" height="28" viewBox="0 0 28 28"><path d="M14 0 V28 M0 14 H28" stroke={dark ? "#fff" : hi} strokeWidth="5" strokeLinecap="round" /></svg>
          </div>;
        })}
      </>,
      380
    );
  }

  if (o.kind === "calendar") {
    const pages = o.pages?.length ? o.pages : ["1", "15", "30"];
    const W = 400, H = 375, D = 150;
    const ryC = ry * 0.45 - 6; // takvim fazla donmesin, on yuz okunsun
    const pageEl = (txt: string, z: number) => (
      <div style={{ position: "absolute", inset: 0, background: "#fbfaf7", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: SANS, transform: `translateZ(${z}px)`, borderRadius: 6, boxShadow: "inset 0 0 0 1.5px rgba(0,0,0,0.12)" }}>
        <div style={{ fontSize: 170, fontWeight: 800, color: "#111", letterSpacing: "-0.04em", lineHeight: 1 }}>{txt}</div>
        {o.caption && <div style={{ fontSize: 30, fontWeight: 800, color: shade(acc, 1), letterSpacing: "0.12em", marginTop: 6 }}>{o.caption}</div>}
      </div>
    );
    return scene(
      <div style={{ position: "absolute", transformStyle: "preserve-3d", transform: `rotateY(${ryC - ry}deg)` }}>
        {/* govde (karton blok) */}
        <Box w={W} h={H} d={D} color="#e9e4da" ry={ryC} />
        {/* ust cilt seridi */}
        <div style={{ position: "absolute", transformStyle: "preserve-3d", transform: `translateY(${-H / 2 - 22}px)` }}>
          <Box w={W + 10} h={44} d={D + 10} color={acc} ry={ryC} />
        </div>
        {/* on yuzde sayfalar: siradaki sayfa ust kenardan menteseli doner */}
        <div style={{ position: "absolute", left: -W / 2 + 12, top: -H / 2 + 14, width: W - 24, height: H - 28, transformStyle: "preserve-3d", transform: `translateZ(${D / 2 + 1}px)` }}>
          {pages.map((t, i) => {
            const rev = pages.length - 1 - i; // en ustteki ilk sayfa
            const flipAt = k1 - 4 + i * 9;
            const f = i < pages.length - 1 ? interpolate(lf, [flipAt, flipAt + 10], [0, 1], { ...cl, easing: Easing.inOut(Easing.cubic) }) : 0;
            if (f >= 1) return null;
            return (
              <div key={i} style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transformOrigin: "50% 0%", transform: `rotateX(${168 * f}deg)` }}>
                {pageEl(t, rev * 0.6)}
              </div>
            );
          })}
        </div>
      </div>,
      420
    );
  }
  return null;
};
