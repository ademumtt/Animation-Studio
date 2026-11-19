import React from "react";
import { AbsoluteFill, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { blurRise, clamp, ease, inOut, pop } from "../anim";
import { EMOJI, INTER } from "../fonts";
import type { Brand, Overlay } from "../types";

type P<T extends Overlay["type"]> = { o: Extract<Overlay, { type: T }>; brand: Brand; durF: number };

/* ---------- ortak parcalar ---------- */

const Icon: React.FC<{ image?: string; emoji?: string; size: number }> = ({ image, emoji, size }) => {
  if (image) return <Img src={staticFile(image)} style={{ width: size, height: size, objectFit: "contain", filter: "drop-shadow(0 24px 40px rgba(0,0,0,0.22))" }} />;
  if (emoji) return <div style={{ fontFamily: EMOJI, fontSize: size * 0.82, lineHeight: 1, filter: "drop-shadow(0 24px 34px rgba(0,0,0,0.2))" }}>{emoji}</div>;
  return null;
};

/** Harf harf blur ile yukselen yazi. */
const Letters: React.FC<{ text: string; start: number; stagger?: number; style?: React.CSSProperties }> = ({ text, start, stagger = 1.6, style }) => {
  const frame = useCurrentFrame();
  return (
    <span style={{ display: "inline-block", whiteSpace: "pre" }}>
      {[...text].map((ch, i) => {
        const p = ease(frame, start + i * stagger, start + i * stagger + 10);
        return (
          <span key={i} style={{ display: "inline-block", ...style, ...blurRise(p, 34, 14) }}>
            {ch}
          </span>
        );
      })}
    </span>
  );
};

// Meta Reels/Stories guvenli alani (1080x1920): ust %14 (269 px) ve alt %35 (1248 px'ten asagisi) reklam arayuzu altinda kalir.
export const SAFE_TOP = 275;
export const SAFE_BOTTOM = 1240;

const fitSize =(text: string, max: number, widthPx: number, k = 0.58) => Math.min(max, widthPx / Math.max(1, text.length * k));

/* ---------- HERO: "Turn / CLAUDE / into a master scriptwriter" ---------- */
export const Hero: React.FC<P<"hero">> = ({ o, durF, brand }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const v = inOut(frame, durF, fps, 12, 10);
  const big = fitSize(o.title, o.compact ? 180 : 210, width * 0.88);
  const grad = "linear-gradient(180deg, #ffffff 35%, rgba(255,255,255,0.6) 100%)";
  return (
    <AbsoluteFill style={{ opacity: v, filter: `blur(${(1 - v) * 10}px)` }}>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.35) 18%, rgba(0,0,0,0) 36%)" }} />
      <div style={{ position: "absolute", top: SAFE_TOP, width: "100%", textAlign: "center", fontFamily: INTER, color: "#fff" }}>
        {o.kicker && (
          <div style={{ fontWeight: 700, fontSize: big * 0.27, letterSpacing: "-0.02em", marginBottom: -big * 0.16, marginLeft: -big * 1.1, ...blurRise(ease(frame, 0, 10)) }}>
            {o.kicker}
          </div>
        )}
        <div style={{ fontWeight: 800, fontSize: big, letterSpacing: "-0.05em", lineHeight: 1, filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.3))" }}>
          <Letters
            text={o.title}
            start={3}
            style={{ backgroundImage: grad, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
          />
        </div>
        <div
          style={
            o.compact
              ? { display: "flex", justifyContent: "center", alignItems: "center", gap: 20, marginTop: -big * 0.02 }
              : { display: "flex", flexDirection: "column", alignItems: "center" }
          }
        >
        {o.sub && (
          <div style={{ fontWeight: 700, fontSize: Math.min(58, big * 0.27), letterSpacing: "-0.025em", marginTop: o.compact ? 0 : -big * 0.04, ...blurRise(ease(frame, 10, 22)) }}>
            {o.sub}
          </div>
        )}
        {o.badge && (() => {
          const bp = pop(frame, fps, 16, 11);
          const shine = interpolate(frame, [24, 44], [-120, 220], clamp);
          return (
            <div style={{ display: "flex", justifyContent: "center", marginTop: o.compact ? 0 : 16 }}>
              <div
                style={{
                  position: "relative",
                  overflow: "hidden",
                  fontFamily: `${INTER}, ${EMOJI}`,
                  fontWeight: 800,
                  fontSize: o.compact ? 40 : 46,
                  letterSpacing: "-0.02em",
                  color: brand.accentText ?? "#fff",
                  background: brand.accent,
                  border: "2px solid rgba(255,255,255,0.35)",
                  borderRadius: 999,
                  padding: o.compact ? "10px 26px 12px" : "14px 34px 16px",
                  boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
                  opacity: bp,
                  transform: `scale(${0.6 + 0.4 * bp}) rotate(${(1 - bp) * -6}deg)`,
                }}
              >
                {o.badge}
                {/* parlama gecisi */}
                <div style={{ position: "absolute", top: 0, bottom: 0, left: `${shine}%`, width: "40%", background: "linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 100%)" }} />
              </div>
            </div>
          );
        })()}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- GLASS: kisinin yaninda suzulen cam kart ---------- */
export const Glass: React.FC<P<"glass">> = ({ o, durF }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const p = pop(frame, fps, 0, 12);
  const out = interpolate(frame, [durF - 8, durF], [1, 0], clamp);
  const s = o.size ?? 300;
  const float = Math.sin(frame / 14) * 8;
  const tilt = (o.tilt ?? -4) * (1 - p) * 3 + (o.tilt ?? -4) * 0.4 + Math.sin(frame / 22) * 1.2;
  const isMedia = !o.icon && (o.image || o.video);
  return (
    <div
      style={{
        position: "absolute",
        left: o.x * width - s / 2,
        top: o.y * height - (isMedia ? s * 0.68 : s / 2) + float,
        width: s,
        opacity: Math.min(p, out),
        transform: `scale(${(0.55 + 0.45 * p) * (0.9 + 0.1 * out)}) rotate(${tilt}deg)`,
        filter: `blur(${(1 - Math.min(p, out)) * 8}px)`,
      }}
    >
      {o.badge && (
        <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: s * 0.11, color: "#fff", textAlign: "center", marginBottom: 8, textShadow: "0 2px 10px rgba(0,0,0,.5)" }}>
          {o.badge}
        </div>
      )}
      <div
        style={{
          borderRadius: s * 0.12,
          padding: isMedia ? 8 : s * 0.12,
          background: "rgba(255,255,255,0.16)",
          border: "2px solid rgba(255,255,255,0.45)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 30px 60px rgba(0,0,0,0.35)",
          overflow: "hidden",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          aspectRatio: isMedia ? "9 / 13" : "1 / 1",
        }}
      >
        {o.icon ? (
          <Img src={staticFile(o.icon)} style={{ width: s * 0.74, height: s * 0.74, objectFit: "contain", filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.25))" }} />
        ) : o.video ? (
          <OffthreadVideo src={staticFile(o.video)} muted style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: s * 0.09 }} />
        ) : o.image ? (
          <Img src={staticFile(o.image)} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: s * 0.09 }} />
        ) : (
          <Icon emoji={o.emoji} size={s * 0.7} />
        )}
      </div>
    </div>
  );
};

/* ---------- WHITE: beyaz ara sahne (baslik + ikon) ---------- */
export const White: React.FC<P<"white">> = ({ o, durF, brand }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const bg = o.cut ? 1 : interpolate(frame, [0, 6, durF - 6, durF], [0, 1, 1, 0], clamp);
  const ip = pop(frame, fps, 8, 11);
  const s1 = fitSize(o.title, 160, width * 0.9, 0.6);
  const s2 = o.title2 ? fitSize(o.title2, 150, width * 0.9, 0.6) : 0;
  const ink = "linear-gradient(180deg, #111 45%, rgba(17,17,17,0.12) 100%)";
  const textStyle: React.CSSProperties = {
    fontFamily: INTER,
    fontWeight: 800,
    letterSpacing: "-0.045em",
    lineHeight: 0.92,
    backgroundImage: ink,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };
  return (
    <AbsoluteFill style={{ opacity: bg }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #ffffff 0%, #ececec 70%, #e2e2e2 100%)" }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", paddingBottom: 380, transform: `scale(${1 + frame / durF * 0.04})` }}>
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{ ...textStyle, fontSize: s1, ...blurRise(ease(frame, 3, 14)) }}>{o.title}</div>
          {o.title2 && <div style={{ ...textStyle, fontSize: s2, marginTop: -s2 * 0.1, ...blurRise(ease(frame, 7, 18)) }}>{o.title2}</div>}
        </div>
        <div style={{ position: "relative", transform: `scale(${0.4 + 0.6 * ip}) translateY(${Math.sin(frame / 12) * 10}px) rotate(${(1 - ip) * -14}deg)`, opacity: ip }}>
          <div style={{ position: "absolute", inset: "15%", background: brand.accent, filter: "blur(70px)", opacity: 0.45, borderRadius: "50%" }} />
          <Icon image={o.image} emoji={o.emoji} size={380} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------- SPLIT: ust yarida grafik, alt yarida konusan kisi ---------- */
export const SplitTop: React.FC<P<"split">> = ({ o, durF, brand }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const v = inOut(frame, durF, fps, 12, 9);
  const half = height / 2;
  const items = o.items ?? [];
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width, height: half, overflow: "hidden", transform: `translateY(${(v - 1) * half}px)` }}>
      {o.topVideo || o.topImage ? (
        o.topVideo ? (
          <OffthreadVideo src={staticFile(o.topVideo)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Img src={staticFile(o.topImage!)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )
      ) : (
        <AbsoluteFill style={{ background: "linear-gradient(180deg,#fafafa,#ececec)", alignItems: "center", justifyContent: "center", paddingTop: SAFE_TOP - 40 }}>
          {o.title && (
            <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: fitSize(o.title, 96, width * 0.85), letterSpacing: "-0.04em", color: "#141414", ...blurRise(ease(frame, 4, 15)) }}>
              {o.title}
            </div>
          )}
          {(o.image || o.emoji) && (
            <div style={{ transform: `scale(${pop(frame, fps, 8)})`, marginTop: 6 }}>
              <Icon image={o.image} emoji={o.emoji} size={items.length ? 210 : 320} />
            </div>
          )}
          {items.length > 0 && (() => {
            const first = items[0];
            const firstAt = typeof first === "string" || first.at === undefined ? 10 : Math.round(first.at * fps) - 6;
            return (
            <div
              style={{
                marginTop: 22,
                width: width * 0.82,
                background: brand.accent,
                borderRadius: 26,
                padding: 22,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                boxShadow: "0 24px 50px rgba(0,0,0,0.15)",
                transform: `scale(${0.85 + 0.15 * pop(frame, fps, firstAt)})`,
                opacity: ease(frame, firstAt, firstAt + 6),
              }}
            >
              {items.map((raw, i) => {
                const it = typeof raw === "string" ? raw : raw.text;
                const at = typeof raw === "string" ? undefined : raw.at;
                const p = pop(frame, fps, at !== undefined ? Math.round(at * fps) - 3 : 14 + i * 5, 14);
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 18,
                      background: "#fff",
                      borderRadius: 16,
                      padding: "18px 22px",
                      fontFamily: INTER,
                      fontWeight: 650,
                      fontSize: 40,
                      color: "#222",
                      whiteSpace: "nowrap",
                      opacity: p,
                      transform: `translateY(${(1 - p) * -30}px)`,
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 18, background: brand.accent, opacity: 0.55, flexShrink: 0 }} />
                    {it}
                  </div>
                );
              })}
            </div>
            );
          })()}
        </AbsoluteFill>
      )}
    </div>
  );
};

/* ---------- PRICE: fiyat/teklif karti ---------- */
export const Price: React.FC<P<"price">> = ({ o, durF, brand }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const v = inOut(frame, durF, fps, 12, 9);
  const W = width * 0.84;
  return (
    <div
      style={{
        position: "absolute",
        left: (width - W) / 2,
        top: Math.max(SAFE_TOP, (o.y ?? 0.16) * height),
        width: W,
        opacity: v,
        transform: `translateY(${(1 - v) * -40}px) scale(${0.94 + 0.06 * v})`,
        filter: `blur(${(1 - v) * 10}px)`,
        background: "rgba(18,18,18,0.55)",
        backdropFilter: "blur(22px)",
        border: "2px solid rgba(255,255,255,0.18)",
        borderRadius: 34,
        padding: "30px 36px",
        boxShadow: "0 30px 70px rgba(0,0,0,0.4)",
        fontFamily: INTER,
        color: "#fff",
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 46, letterSpacing: "-0.02em", marginBottom: 18, color: brand.highlight ?? "#fff" }}>{o.title}</div>
      {o.rows.map((r, i) => {
        const p = pop(frame, fps, r.at !== undefined ? Math.round(r.at * fps) - 3 : 8 + i * 7, 15);
        return (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              padding: "14px 0",
              borderTop: i ? "1px solid rgba(255,255,255,0.14)" : "none",
              opacity: p,
              transform: `translateX(${(1 - p) * 40}px)`,
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 40 }}>{r.label}</span>
            <span style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
              {r.old && <span style={{ fontWeight: 600, fontSize: 32, opacity: 0.55, textDecoration: "line-through" }}>{r.old}</span>}
              <span style={{ fontWeight: 800, fontSize: 44 }}>{r.value}</span>
            </span>
          </div>
        );
      })}
      {o.total && (
        <div
          style={{
            marginTop: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: brand.accent,
            color: brand.accentText ?? "#111",
            borderRadius: 20,
            padding: "16px 24px",
            transform: `scale(${pop(frame, fps, 10 + o.rows.length * 7, 10)})`,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 40 }}>{o.total.label}</span>
          <span style={{ fontWeight: 900, fontSize: 54, letterSpacing: "-0.03em" }}>{o.total.value}</span>
        </div>
      )}
    </div>
  );
};

/* ---------- BIGWORD: kocaman tek kelime/sayi (ornek: "21 GUN") ---------- */
export const BigWord: React.FC<P<"bigword">> = ({ o, durF, brand }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const v = inOut(frame, durF, fps, 10, 8);
  const size = fitSize(o.text, 300, width * 0.92, 0.62);
  return (
    <div
      style={{
        position: "absolute",
        width: "100%",
        top: (o.y ?? 0.2) * height,
        textAlign: "center",
        fontFamily: INTER,
        fontWeight: 900,
        fontSize: size,
        letterSpacing: "-0.05em",
        lineHeight: 1,
        backgroundImage: `linear-gradient(180deg, #fff 25%, ${brand.highlight ?? "#ddd"} 120%)`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        opacity: v,
        transform: `scale(${1.25 - 0.25 * v})`,
        filter: `blur(${(1 - v) * 16}px) drop-shadow(0 12px 30px rgba(0,0,0,0.35))`,
      }}
    >
      {o.text}
    </div>
  );
};

/* ---------- BROLL: tam ekran ek goruntu, konusma sesi altta devam eder ---------- */
export const BRoll: React.FC<P<"broll">> = ({ o, durF }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / Math.max(1, durF);
  const z = o.zoom === "out" ? 1.12 - 0.08 * t : 1.04 + 0.08 * t;
  const style: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z})`, filter: "contrast(1.06) saturate(1.08)" };
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {o.video ? (
        <OffthreadVideo src={staticFile(o.video)} muted trimBefore={Math.round((o.from ?? 0) * fps)} style={style} />
      ) : o.image ? (
        <Img src={staticFile(o.image)} style={style} />
      ) : null}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)" }} />
    </AbsoluteFill>
  );
};

/* ---------- CTA: kapanis karti ---------- */
export const Cta: React.FC<P<"cta">> = ({ o, durF, brand }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const bg = interpolate(frame, [0, 7], [0, 1], clamp);
  const lp = pop(frame, fps, 4, 11);
  const pulse = 1 + Math.sin(frame / 5) * 0.025;
  const logo = o.logo ?? brand.logo;
  return (
    <AbsoluteFill style={{ opacity: bg }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 38%, #ffffff 0%, #eeeeee 75%)" }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 40, fontFamily: INTER }}>
        {logo && (
          <Img
            src={staticFile(logo)}
            style={{ width: width * 0.5, maxHeight: 380, objectFit: "contain", transform: `scale(${0.6 + 0.4 * lp})`, opacity: lp, filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.15))" }}
          />
        )}
        <div style={{ fontWeight: 800, fontSize: fitSize(o.headline, 92, width * 0.86), letterSpacing: "-0.04em", color: "#141414", textAlign: "center", padding: "0 60px", lineHeight: 1.04, ...blurRise(ease(frame, 10, 22)) }}>
          {o.headline}
        </div>
        {o.sub && <div style={{ fontWeight: 600, fontSize: 40, color: "#555", textAlign: "center", padding: "0 80px", ...blurRise(ease(frame, 15, 27)) }}>{o.sub}</div>}
        {o.button && (
          <div
            style={{
              marginTop: 10,
              background: brand.dark ?? "#141414",
              color: "#fff",
              fontWeight: 800,
              fontSize: 46,
              padding: "26px 60px",
              borderRadius: 999,
              boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
              transform: `scale(${pop(frame, fps, 20, 10) * pulse})`,
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            {o.buttonIcon && <Img src={staticFile(o.buttonIcon)} style={{ width: 62, height: 62, marginLeft: -16 }} />}
            {o.button} →
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
