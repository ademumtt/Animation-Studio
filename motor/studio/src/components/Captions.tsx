import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ease } from "../anim";
import { INTER, SANS } from "../fonts";
import type { Brand, Word } from "../types";

type Group = { words: Word[]; s: number; e: number };

/** Kelimeleri 1-3 kelimelik, okunakli gruplara ayirir. Vurgulu kelime kendi grubunda durur. */
export const groupWords = (words: Word[]): Group[] => {
  const groups: Group[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) groups.push({ words: cur, s: cur[0].s, e: cur[cur.length - 1].e });
    cur = [];
  };
  words.forEach((w, i) => {
    const prev = words[i - 1];
    const chars = cur.reduce((n, x) => n + x.w.length + 1, 0) + w.w.length;
    const gap = prev ? w.s - prev.e : 0;
    if (cur.length && (gap > 0.3 || cur.length >= 3 || chars > 17 || /[.,!?;:]$/.test(prev.w) || w.hl || cur.some((x) => x.hl))) flush();
    cur.push(w);
  });
  flush();
  // grup bir sonrakine kadar ekranda kalsin (titreme olmasin), en fazla 0.6 sn bosluk
  groups.forEach((g, i) => {
    const next = groups[i + 1];
    g.e = next ? Math.min(next.s, g.e + 0.6) : g.e + 0.5;
  });
  return groups;
};

const clean = (w: string) => w.replace(/[.,;:]+$/, "");

export type CaptionMode = "word" | "pill";

/** mix stili: 5 kelimeye kadar, 2-3 satir; cumle/duraklamada bolunur. */
export const groupMix = (words: Word[]): Group[] => {
  const groups: Group[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) groups.push({ words: cur, s: cur[0].s, e: cur[cur.length - 1].e });
    cur = [];
  };
  words.forEach((w, i) => {
    const prev = words[i - 1];
    const chars = cur.reduce((n, x) => n + x.w.length + 1, 0) + w.w.length;
    const gap = prev ? w.s - prev.e : 0;
    if (cur.length && (gap > 0.35 || cur.length >= 5 || chars > 30 || /[.!?]$/.test(prev.w))) flush();
    cur.push(w);
  });
  flush();
  groups.forEach((g, i) => {
    const next = groups[i + 1];
    g.e = next ? Math.min(next.s, g.e + 0.5) : g.e + 0.5;
  });
  return groups;
};

/** Gruptaki anahtar kelime: hl varsa o, yoksa en uzun (>=6 harf) kelime. */
const keyIndex = (g: Group) => {
  const h = g.words.findIndex((w) => w.hl);
  if (h >= 0) return h;
  let best = -1, len = 5;
  g.words.forEach((w, i) => {
    const l = clean(w.w).length;
    if (l > len) (best = i), (len = l);
  });
  return best;
};

const hexA = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

const MixCaption: React.FC<{ g: Group; brand: Brand; top: number }> = ({ g, brand, top }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const glow = brand.highlight ?? brand.accent;
  const k = keyIndex(g);
  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <div
        lang="tr"
        style={{
          position: "absolute",
          top,
          transform: "translateY(-50%)",
          width: "84%",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "baseline",
          columnGap: "0.22em",
          fontFamily: INTER,
          lineHeight: 1.0,
          fontSize: 58,
        }}
      >
        {g.words.map((w, i) => {
          const wf = Math.round(w.s * fps) - 1;
          const p = ease(frame, wf, wf + 6);
          const key = i === k;
          const hl = key && w.hl;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                fontWeight: key ? 900 : 700,
                fontSize: key ? "1.9em" : "1em",
                letterSpacing: key ? "-0.04em" : "-0.02em",
                color: hl ? glow : "#fff",
                // anahtar kelime: marka renginde ince parlak kontur (referans: dis klinigi)
                textShadow: key
                  ? hl
                    ? `0 0 3px #fff, 0 0 18px ${hexA("#ffffff", 0.45)}, 0 4px 20px rgba(0,0,0,0.35)`
                    : `0 0 3px ${glow}, 0 0 14px ${hexA(glow, 0.9)}, 0 0 34px ${hexA(glow, 0.5)}`
                  : "0 3px 18px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.4)",
                opacity: p,
                transform: `translateY(${(1 - p) * 16}px) scale(${(key ? 0.85 : 0.94) + (key ? 0.15 : 0.06) * p})`,
                filter: `blur(${(1 - p) * 6}px)`,
              }}
            >
              {clean(w.w)}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** K2 (referans altyazilari): kucuk beyaz satir + vurgu kelimesi kendi satirinda.
 *  kutu: vurgu turuncu/vurgu renkli kutu icinde beyaz; parilti: vurgu parlayan sari. Kelime sirasi bozulmaz. */
const RefCaption: React.FC<{ g: Group; brand: Brand; top: number; variant: "kutu" | "parilti" }> = ({ g, brand, top, variant }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = keyIndex(g);
  const boxCol = brand.highlight && variant === "kutu" ? brand.highlight : "#F39A1E";
  const glowCol = "#FFE14D";
  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <div lang="tr" style={{ position: "absolute", top, transform: "translateY(-50%)", width: "86%", display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", columnGap: "0.24em", rowGap: 6, fontFamily: SANS, lineHeight: 1.05 }}>
        {g.words.map((w, i) => {
          const wf = Math.round(w.s * fps) - 1;
          const p = ease(frame, wf, wf + 6);
          const key = i === k;
          const base: React.CSSProperties = { display: "inline-block", opacity: p, transform: `translateY(${(1 - p) * 14}px) scale(${(key ? 0.86 : 0.95) + (key ? 0.14 : 0.05) * p})`, filter: `blur(${(1 - p) * 5}px)` };
          if (!key)
            return (
              <span key={i} style={{ ...base, fontSize: 56, fontWeight: 600, color: "#fff", letterSpacing: "-0.01em", textShadow: "0 3px 16px rgba(0,0,0,0.6)", margin: "0 0.12em" }}>
                {clean(w.w)}
              </span>
            );
          return (
            <React.Fragment key={i}>
              <span style={{ flexBasis: "100%", height: 0 }} />
              {variant === "kutu" ? (
                <span style={{ ...base, fontSize: 92, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", background: boxCol, padding: "2px 22px 8px", borderRadius: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.35)" }}>{clean(w.w)}</span>
              ) : (
                <span style={{ ...base, fontSize: 112, fontWeight: 800, color: glowCol, letterSpacing: "-0.03em", textShadow: `0 0 6px ${glowCol}, 0 0 26px ${hexA(glowCol, 0.75)}, 0 0 60px ${hexA(glowCol, 0.4)}` }}>{clean(w.w)}</span>
              )}
              <span style={{ flexBasis: "100%", height: 0 }} />
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Captions: React.FC<{ words: Word[]; brand: Brand; mode: (t: number) => CaptionMode | "off"; y: (t: number) => number; style?: "classic" | "mix" | "kutu" | "parilti" }> = ({
  words,
  brand,
  mode,
  y,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const t = frame / fps;
  const mixGroups = React.useMemo(() => groupMix(words), [words]);
  const groups = React.useMemo(() => groupWords(words), [words]);
  if (style === "mix" && mode(t) === "word") {
    const mg = mixGroups.find((x) => t >= x.s - 0.04 && t < x.e);
    return mg ? <MixCaption g={mg} brand={brand} top={y(t) * height} /> : null;
  }
  if ((style === "kutu" || style === "parilti") && mode(t) === "word") {
    const mg = mixGroups.find((x) => t >= x.s - 0.04 && t < x.e);
    return mg ? <RefCaption g={mg} brand={brand} top={y(t) * height} variant={style} /> : null;
  }
  const g = groups.find((x) => t >= x.s - 0.04 && t < x.e);
  const m = mode(t);
  if (!g || m === "off") return null;
  const gf = Math.round(g.s * fps);
  const isHl = g.words.some((w) => w.hl);

  const wordEls = g.words.map((w, i) => {
    const wf = Math.round(w.s * fps) - 1;
    const p = ease(frame, wf, wf + 5);
    const visible = m === "pill" ? 1 : p;
    const style: React.CSSProperties = {
      display: "inline-block",
      marginRight: i < g.words.length - 1 ? "0.24em" : 0,
      opacity: visible,
      transform: `translateY(${(1 - visible) * 14}px) scale(${0.9 + 0.1 * visible})`,
      filter: `blur(${(1 - visible) * 6}px)`,
    };
    return (
      <span key={i} style={style}>
        {clean(w.w)}
      </span>
    );
  });

  const enter = ease(frame, gf - 1, gf + 5);
  const top = y(t) * height;

  if (m === "pill") {
    return (
      <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top,
            transform: `translateY(-50%) scale(${0.92 + 0.08 * enter})`,
            opacity: enter,
            fontFamily: INTER,
            fontWeight: 700,
            fontSize: 66,
            letterSpacing: "-0.02em",
            color: "#fff",
            background: "rgba(110,110,110,0.62)",
            backdropFilter: "blur(14px)",
            borderRadius: 18,
            padding: "6px 26px 10px",
            whiteSpace: "nowrap",
          }}
        >
          {wordEls}
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <div
        lang="tr"
        style={{
          position: "absolute",
          top,
          transform: "translateY(-50%)",
          maxWidth: "88%",
          textAlign: "center",
          fontFamily: INTER,
          fontWeight: isHl ? 900 : 800,
          fontSize: isHl ? 112 : 76,
          lineHeight: 1.05,
          letterSpacing: isHl ? "-0.035em" : "-0.025em",
          color: isHl ? brand.highlight ?? brand.accent : "#fff",
          textShadow: "0 4px 24px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.35)",
          textTransform: isHl ? "uppercase" : "none",
        }}
      >
        {wordEls}
      </div>
    </AbsoluteFill>
  );
};
