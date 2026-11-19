// K1 + K3 (2026-11-15, kullanici referansi: konusmaci + soyledigini destekleyen gorsel sahneler)
// SinemaLook: konusmaci ustunde sicak "sinema" gorunumu (ust yarida nokta deseni, altta koyu gecis, vinyet).
// Cutaway: tam ekran destek sahnesi – sicak kagit/masa zemini (pencere + yaprak golgesi, kagit dokusu) ya da bokeh,
// uzerinde 3B ikonlar (Fluent 3D, MIT) ve el yazili yapiskan notlar; kelimede yayla girer, hafif suzulur, yavas kamera itmesi.
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import { clamp } from "../anim";
import type { Overlay } from "../types";

const { fontFamily: HAND } = loadCaveat("normal", { weights: ["600", "700"], subsets: ["latin", "latin-ext"] });
const spr = Easing.bezier(0.34, 1.5, 0.64, 1);

export const SinemaLook: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {/* ust yarida ince nokta deseni (referans: "after" karelerindeki doku) */}
    <AbsoluteFill
      style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.16) 1.6px, transparent 2px)",
        backgroundSize: "14px 14px",
        maskImage: "linear-gradient(180deg, #000 0%, rgba(0,0,0,0.6) 30%, transparent 55%)",
        WebkitMaskImage: "linear-gradient(180deg, #000 0%, rgba(0,0,0,0.6) 30%, transparent 55%)",
        mixBlendMode: "overlay",
      }}
    />
    {/* alt koyu gecis: altyazi okunurlugu */}
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 48%, rgba(0,0,0,0.35) 68%, rgba(0,0,0,0.78) 100%)" }} />
    {/* vinyet */}
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 70% at 50% 42%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.32) 100%)" }} />
  </AbsoluteFill>
);

type P = { o: Extract<Overlay, { type: "cutaway" }>; durF: number };

export const Cutaway: React.FC<P> = ({ o, durF }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const inP = interpolate(frame, [0, 5], [0, 1], clamp);
  const outP = interpolate(frame, [durF - 4, durF], [1, 0], clamp);
  const push = 1.06 - 0.06 * interpolate(frame, [0, durF], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }); // yavas ice cekilme
  const drift = (frame / fps) * 6;
  const bg = o.bg ?? "masa";

  const ground =
    bg === "masa" ? (
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 120% 90% at 40% 30%, #f3ead9 0%, #e6d8bf 55%, #cdb994 100%)" }}>
        {/* kagit dokusu */}
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.35, mixBlendMode: "multiply" }}>
          <filter id="cwPaper">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="7" />
            <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.48  0 0 0 0 0.38  0 0 0 0.6 0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#cwPaper)" />
        </svg>
        {/* pencere golgesi: capraz yumusak serit + cerceve */}
        <div style={{ position: "absolute", left: -W * 0.3, top: -H * 0.1, width: W * 0.55, height: H * 1.3, background: "rgba(70,50,30,0.22)", transform: `rotate(18deg) translateX(${drift}px)`, filter: "blur(40px)" }} />
        <div style={{ position: "absolute", left: W * 0.55, top: -H * 0.2, width: 60, height: H * 1.4, background: "rgba(70,50,30,0.2)", transform: `rotate(18deg) translateX(${drift}px)`, filter: "blur(22px)" }} />
        {/* yaprak golgeleri */}
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ position: "absolute", left: W * (0.72 + 0.06 * i), top: H * (0.04 + 0.07 * i), width: 220, height: 90, borderRadius: "50%", background: "rgba(60,45,25,0.25)", transform: `rotate(${-30 + i * 22}deg) translate(${Math.sin(frame / 40 + i) * 8}px, 0)`, filter: "blur(16px)" }} />
        ))}
        {/* vinyet */}
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(60,40,20,0.35) 100%)" }} />
      </AbsoluteFill>
    ) : (
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #d9c6a8 0%, #b89c74 100%)" }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ position: "absolute", left: W * ((i * 0.37) % 1), top: H * ((i * 0.23 + 0.1) % 1), width: 300 + (i % 3) * 120, height: 300 + (i % 3) * 120, borderRadius: "50%", background: i % 2 ? "rgba(255,240,210,0.55)" : "rgba(255,255,255,0.35)", filter: "blur(60px)" }} />
        ))}
      </AbsoluteFill>
    );

  return (
    <AbsoluteFill style={{ opacity: Math.min(inP, outP) }}>
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        {ground}
        {o.items.map((it, i) => {
          const at = Math.round((it.at ?? 0.15 * i) * fps);
          const p = interpolate(frame, [at, at + 12], [0, 1], { ...clamp, easing: spr });
          const fl = Math.sin(frame / 22 + i * 1.7) * 6;
          const x = it.x * W, y = it.y * H;
          if (it.note) {
            const s = it.size ?? 300;
            return (
              <div key={i} style={{ position: "absolute", left: x - s / 2, top: y - s / 2, width: s, minHeight: s * 0.8, padding: "26px 24px", boxSizing: "border-box", background: i % 2 ? "#fff8d6" : "#fdfcf8", boxShadow: "0 18px 30px rgba(60,40,20,0.28), 0 2px 4px rgba(0,0,0,0.12)", transform: `rotate(${it.rot ?? (i % 2 ? 5 : -4)}deg) translateY(${(1 - p) * 60 + fl * 0.4}px) scale(${0.85 + 0.15 * p})`, opacity: p, fontFamily: HAND, fontWeight: 700, fontSize: s * 0.21, lineHeight: 1.15, color: "#2b2b2b", whiteSpace: "pre-line" }}>
                {/* bant */}
                <div style={{ position: "absolute", left: "50%", top: -14, width: 96, height: 30, marginLeft: -48, background: "rgba(220,210,190,0.75)", transform: "rotate(-3deg)" }} />
                {it.note}
              </div>
            );
          }
          const s = it.size ?? 380;
          return (
            <Img
              key={i}
              src={staticFile(it.icon!)}
              style={{
                position: "absolute",
                left: x - s / 2,
                top: y - s / 2,
                width: s,
                height: s,
                objectFit: "contain",
                opacity: p,
                transform: `translateY(${(1 - p) * 80 + fl}px) rotate(${(it.rot ?? 0) + (1 - p) * -12}deg) scale(${0.6 + 0.4 * p})`,
                filter: "drop-shadow(0 34px 36px rgba(60,40,20,0.38)) drop-shadow(0 6px 8px rgba(0,0,0,0.18))",
              }}
            />
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
