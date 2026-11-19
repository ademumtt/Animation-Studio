import React from "react";
import { AbsoluteFill, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Punch, Segment, Spec } from "../types";

// Kare sinirlari BIRIKIMLI saniyeden yuvarlanir; tek tek yuvarlamak kayma biriktirir
// (goruntu, kelime/overlay zamanlarindan birkac kare kayardi).
export const segmentFrames = (segs: Segment[], fps: number) => {
  let sec = 0;
  return segs.map((s) => {
    const from = Math.round(sec * fps);
    sec += s.out - s.in;
    const len = Math.max(1, Math.round(sec * fps) - from);
    return { seg: s, from, len };
  });
};

const punchScale = (frame: number, fps: number, punches: Punch[]) => {
  let z = 1;
  for (const p of punches) {
    const a = Math.round(p.at * fps);
    const b = a + Math.round(p.dur * fps);
    if (frame < a - 1 || frame > b + 8) continue;
    const target = p.scale ?? 1.12;
    const up = interpolate(frame, [a, a + 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    const down = interpolate(frame, [b, b + 7], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
    z *= 1 + (target - 1) * Math.min(up, down);
  }
  return z;
};

const gainId = (g: number[]) => `g${g.map((v) => Math.round(v * 1000)).join("_")}`;

/** Konusan kisi (A-roll). split: 0 = tam ekran, 1 = alt yarida. */
export const ARoll: React.FC<{ spec: Spec; split: number }> = ({ spec, split }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const segs = segmentFrames(spec.segments, fps);
  const g = spec.grade ?? {};
  const pz = punchScale(frame, fps, spec.punches ?? []);
  const top = (height / 2) * split;
  // hafif sicak tonlama + kontrast: "ham telefon goruntusu" hissini kirar
  const grade = `contrast(${g.contrast ?? 1.07}) saturate(${g.saturate ?? 1.1}) brightness(${g.brightness ?? 1.02}) sepia(${g.warmth ?? 0.06})`;
  const gains = [...new Map(spec.segments.filter((s) => s.gain).map((s) => [gainId(s.gain!), s.gain!])).values()];

  return (
    <AbsoluteFill style={{ top, height: height - top, overflow: "hidden", backgroundColor: "#000" }}>
      {/* cekimler arasi renk esitleme filtreleri */}
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          {gains.map((gn) => (
            <filter key={gainId(gn)} id={gainId(gn)} colorInterpolationFilters="sRGB">
              <feColorMatrix type="matrix" values={`${gn[0]} 0 0 0 0  0 ${gn[1]} 0 0 0  0 0 ${gn[2]} 0 0  0 0 0 1 0`} />
            </filter>
          ))}
        </defs>
      </svg>
      {segs.map(({ seg, from, len }, i) => {
        // istege bagli cekim gecisi (varsayilan kapali: temiz kesim, tek parca his)
        const takeChange = spec.takeTransition && i > 0 && segs[i - 1].seg.src !== seg.src;
        const tp = takeChange ? interpolate(frame - from, [0, 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }) : 1;
        // yuzu kadrajin hedef noktasina (yatay orta, ust ucte bir) tasi; kenarlarda siyah bosluk birakma
        const z = (seg.zoom ?? 1) * pz * (1 + 0.04 * (1 - tp));
        const lim = ((z - 1) / 2) * 100;
        const dx = Math.max(-lim, Math.min(lim, -((seg.focusX ?? 0.5) - 0.5) * z * 100));
        const dy = Math.max(-lim, Math.min(lim, -((seg.focusY ?? 0.33) - 0.5) * z * 100 + (0.40 - 0.5) * 100)); // yuz y=0.40: ust %14 Reels arayuzu + baslik icin yer
        const filter = `${seg.gain ? `url(#${gainId(seg.gain)}) ` : ""}${grade}${tp < 1 ? ` blur(${(1 - tp) * 6}px)` : ""}`;
        return (
          <Sequence key={i} from={from} durationInFrames={len} premountFor={fps}>
            <AbsoluteFill style={{ transform: `translate(${dx}%, ${dy}%) scale(${z})` }}>
              <OffthreadVideo
                src={staticFile(seg.src)}
                trimBefore={Math.round(seg.in * fps)}
                // kesimde "tik" sesi olmasin: 1 karelik (33 ms) ses yumusatma; kelime basini yutmaz
                volume={(f) => interpolate(f, [0, 1, len - 1, len], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `50% ${50 - 18 * split}%`, filter }}
              />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      {/* vinyet */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)" }} />
    </AbsoluteFill>
  );
};

/**
 * Derinlik stili: kisinin kesilmis hali (tools/maske.py, seffaf webm) A-roll ile AYNI kadraj, zoom ve renkte
 * yazilarin USTUNE cizilir -> yazi kisinin arkasinda kalir. Sadece `behind` katmanlari suresince cizilir.
 */
export const ARollFront: React.FC<{ spec: Spec; windows: { at: number; dur: number }[] }> = ({ spec, windows }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mattes = spec.mattes ?? [];
  if (!mattes.length || !windows.length) return null;
  const t = frame / fps;
  // pencere disinda hic cizme (gereksiz video cozme olmasin); yarim saniye pay
  if (!windows.some((w) => t >= w.at - 0.5 && t < w.at + w.dur + 0.5)) return null;
  const segs = segmentFrames(spec.segments, fps);
  const g = spec.grade ?? {};
  const pz = punchScale(frame, fps, spec.punches ?? []);
  const grade = `contrast(${g.contrast ?? 1.07}) saturate(${g.saturate ?? 1.1}) brightness(${g.brightness ?? 1.02}) sepia(${g.warmth ?? 0.06})`;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {segs.map(({ seg, from, len }, i) => {
        if (frame < from - fps || frame >= from + len) return null;
        // maske sadece behind penceresini (+pay) kapsar; segmentin ortasinda baslayabilir
        const m = mattes.find((mm) => mm.src === seg.src && mm.in < seg.out && mm.out > seg.in);
        if (!m) return null;
        const off = Math.max(0, Math.round(m.in * fps) - Math.round(seg.in * fps));
        const n = Math.min(len - off, Math.round(m.out * fps) - Math.round(Math.max(seg.in, m.in) * fps));
        if (n <= 0) return null;
        const z = (seg.zoom ?? 1) * pz;
        const lim = ((z - 1) / 2) * 100;
        const dx = Math.max(-lim, Math.min(lim, -((seg.focusX ?? 0.5) - 0.5) * z * 100));
        const dy = Math.max(-lim, Math.min(lim, -((seg.focusY ?? 0.33) - 0.5) * z * 100 + (0.40 - 0.5) * 100));
        const filter = `${seg.gain ? `url(#${gainId(seg.gain)}) ` : ""}${grade}`;
        const skip = Math.max(0, Math.round(seg.in * fps) - Math.round(m.in * fps));
        return (
          <Sequence key={i} from={from + off} durationInFrames={n} premountFor={fps}>
            <AbsoluteFill style={{ transform: `translate(${dx}%, ${dy}%) scale(${z})` }}>
              <OffthreadVideo
                src={staticFile(m.file)}
                transparent
                muted
                trimBefore={skip}
                style={{ width: "100%", height: "100%", objectFit: "cover", filter }}
              />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      {/* A-roll'daki vinyetin aynisi: kesik kisi kenarlarda parlak kalip "yapistirma" gibi durmasin */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)" }} />
    </AbsoluteFill>
  );
};
