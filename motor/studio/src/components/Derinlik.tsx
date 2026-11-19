// DERINLIK STILI – referans: konusmaci onde, dev baslik arkasinda; tam ekran sade "statement";
// konusmaci arkada kalip anlattigi seyin baglantili parcalarla canlandigi "story".
// Ilke: patlama/efekt yok. Her oge SOYLENDIGI anda, yumusak (blur + yukselis) girer; ayni anda tek vurgu.
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { blurRise, clamp, ease, pop } from "../anim";
import { EMOJI, INTER, SERIF } from "../fonts";
import type { Brand, Overlay } from "../types";

type P<T extends Overlay["type"]> = { o: Extract<Overlay, { type: T }>; brand: Brand; durF: number };

/** Video ustunde okunur acik marka tonu (koyu marka rengi yazi olmaz). */
export const glowColor = (b: Brand) => b.highlight ?? "#D9F23A";

const fit = (text: string, max: number, widthPx: number, k = 0.6) => Math.min(max, widthPx / Math.max(1, text.length * k));

/** Cikis: son 8 karede blur + hafif yukari. */
const exitP = (frame: number, durF: number, n = 8) => interpolate(frame, [durF - n, durF], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) });

const hexA = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const n = parseInt(f, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/** Harf harf asagidan blur ile yukselen dev kelime. */
const RiseLetters: React.FC<{ text: string; start: number; style: React.CSSProperties; stagger?: number }> = ({ text, start, style, stagger = 1.4 }) => {
  const frame = useCurrentFrame();
  return (
    <span style={{ display: "inline-block", whiteSpace: "pre" }}>
      {[...text].map((ch, i) => {
        const p = ease(frame, start + i * stagger, start + i * stagger + 11);
        return (
          <span key={i} style={{ display: "inline-block", ...style, opacity: p, transform: `translateY(${(1 - p) * 0.35}em)`, filter: `blur(${(1 - p) * 14}px)` }}>
            {ch}
          </span>
        );
      })}
    </span>
  );
};

/* ---------- sade suslemeler ---------- */
export const Plus: React.FC<{ x: number; y: number; s: number; delay: number; color: string }> = ({ x, y, s, delay, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(frame, fps, delay, 14);
  return (
    <svg width={s} height={s} viewBox="0 0 10 10" style={{ position: "absolute", left: x - s / 2, top: y - s / 2, opacity: p, transform: `scale(${p}) rotate(${frame * 0.6}deg)` }}>
      <path d="M5 1 V9 M1 5 H9" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </svg>
  );
};

export const Arcs: React.FC<{ cx: number; cy: number; r: number; color?: string }> = ({ cx, cy, r, color = "#fff" }) => {
  const frame = useCurrentFrame();
  const p = ease(frame, 4, 22);
  const rot = -30 + frame * 0.35;
  const len = Math.PI * r * 0.22; // her yay ~40 derece
  return (
    <svg width={r * 2 + 40} height={r * 2 + 40} style={{ position: "absolute", left: cx - r - 20, top: cy - r - 20, transform: `rotate(${rot}deg)`, opacity: p }}>
      {[0, 1].map((k) => (
        <circle
          key={k}
          cx={r + 20}
          cy={r + 20}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${len * p} ${Math.PI * 2 * r}`}
          transform={`rotate(${k * 180 - 20} ${r + 20} ${r + 20})`}
        />
      ))}
    </svg>
  );
};

export const Think: React.FC<{ x: number; y: number; color?: string }> = ({ x, y, color = "rgba(255,255,255,0.9)" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      {[
        [0, 0, 64],
        [70, -38, 44],
        [128, -66, 28],
      ].map(([dx, dy, s], i) => {
        const p = pop(frame, fps, 6 + i * 5, 14);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + dx - s / 2,
              top: y + dy - s / 2 + Math.sin(frame / 16 + i) * 4,
              width: s,
              height: s,
              borderRadius: "50%",
              border: `4px solid ${color}`,
              opacity: p,
              transform: `scale(${p})`,
            }}
          />
        );
      })}
    </>
  );
};

/** Kisinin arkasindan gecen marka renkli kurdele (referans 1). */
export const Ribbon: React.FC<{ color: string; W: number; H: number }> = ({ color, W, H }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 26], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  // baslik blogunun ALTINDAN baslar, govdenin arkasindan dolanir (yazinin ustunden gecmez)
  const d = `M ${W * 1.05} ${H * 0.33} C ${W * 0.7} ${H * 0.3}, ${W * 0.05} ${H * 0.36}, ${W * 0.12} ${H * 0.47} S ${W * 0.95} ${H * 0.56}, ${W * 0.8} ${H * 0.68}`;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, transform: `translateY(${Math.sin(frame / 30) * 8}px)` }}>
      <defs>
        <linearGradient id="rb" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.6" stopColor={color} stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke="url(#rb)" strokeWidth={48} strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 1`} style={{ filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.18))" }} />
    </svg>
  );
};

/* ---------- BEHIND: dev baslik kisinin arkasinda ---------- */
export const BehindBack: React.FC<P<"behind">> = ({ o, durF, brand }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const glow = glowColor(brand);
  const out = exitP(frame, durF);
  const dimIn = interpolate(frame, [0, 8, durF - 8, durF], [0, 1, 1, 0], clamp);
  const dim = (o.dim ?? 0.45) * dimIn;
  const deco = o.deco ?? [];
  // bas tepesi kadrajda ~y 0.26: blok onun hemen ustunde, bas sadece dev kelimenin ALT kismini keser (referans)
  const cy = (o.y ?? 0.235) * H;
  const big = fit(o.title, 250, W * 0.86, 0.58);
  const drift = 1 + 0.03 * (frame / durF); // canli dursun: cok yavas buyume
  const scriptReveal = ease(frame, 5, 20);

  return (
    <AbsoluteFill>
      {/* spot isik: arka plan kararir, kisi (on katmanda) aydinlik kalir */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 48% at 50% 58%, rgba(0,0,0,${dim * 0.25}) 0%, rgba(0,0,0,${dim}) 100%)`,
        }}
      />
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(255,255,255,${0.07 * dimIn}) 0%, rgba(255,255,255,0) 40%)`, clipPath: "polygon(38% 0, 62% 0, 80% 100%, 20% 100%)" }} />

      {deco.includes("ribbon") && <Ribbon color={glow} W={W} H={H} />}

      {deco.includes("frame") && (() => {
        const p = ease(frame, 0, 14);
        const fw = W * 0.62, fh = H * 0.5;
        return (
          <div
            style={{
              position: "absolute",
              left: (W - fw) / 2,
              top: cy - big * 0.8 - (o.kicker ? 110 : 60), // centik ust satirin ustunde kalsin
              width: fw,
              height: fh,
              borderRadius: 90,
              border: "3px solid rgba(255,255,255,0.22)",
              background: "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))",
              boxShadow: "inset 0 0 60px rgba(255,255,255,0.05)",
              opacity: p * out,
              transform: `scale(${0.94 + 0.06 * p})`,
            }}
          >
            <div style={{ position: "absolute", top: 34, left: "50%", width: 130, height: 34, marginLeft: -65, borderRadius: 20, background: "rgba(255,255,255,0.85)" }} />
          </div>
        );
      })()}

      {(o.image || o.video) && (() => {
        const p = ease(frame, 0, 14);
        const cw = W * 0.86, ch = big * 1.15;
        const hole = (top: boolean) => (
          <div style={{ position: "absolute", left: 18, right: 18, [top ? "top" : "bottom"]: 10, height: 14, backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.85) 0 16px, transparent 16px 34px)", borderRadius: 3, opacity: 0.8 }} />
        );
        return (
          <div
            style={{
              position: "absolute",
              left: (W - cw) / 2,
              top: cy - ch / 2,
              width: cw,
              height: ch,
              borderRadius: 28,
              overflow: "hidden",
              background: "#111",
              boxShadow: "0 30px 70px rgba(0,0,0,0.35)",
              opacity: p * out,
              transform: `scale(${(0.9 + 0.1 * p) * drift}) rotate(${-1.5 * (1 - p)}deg)`,
              filter: `blur(${(1 - p) * 12}px)`,
            }}
          >
            {o.video ? (
              <OffthreadVideo src={staticFile(o.video)} muted style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.75 }} />
            ) : (
              <Img src={staticFile(o.image!)} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.75 }} />
            )}
            {hole(true)}
            {hole(false)}
          </div>
        );
      })()}

      {deco.includes("arcs") && <Arcs cx={W / 2} cy={cy} r={W * 0.4} />}
      {deco.includes("think") && <Think x={W * 0.2} y={cy - big * 0.75} />}
      {deco.includes("plus") && (
        <>
          <Plus x={W * 0.16} y={cy - big * 0.55} s={64} delay={10} color={glow} />
          <Plus x={W * 0.86} y={cy + big * 0.2} s={110} delay={16} color={glow} />
          <Plus x={W * 0.24} y={cy + big * 0.85} s={40} delay={22} color={glow} />
        </>
      )}

      {/* baslik blogu */}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: cy,
          transform: `translateY(-50%) translateY(${(1 - out) * -30}px) scale(${drift})`,
          opacity: out,
          filter: `blur(${(1 - out) * 10}px)`,
          textAlign: "center",
          fontFamily: INTER,
          color: "#fff",
        }}
      >
        {o.kicker && (
          <div style={{ fontWeight: 500, fontSize: big * 0.24, letterSpacing: "-0.04em", lineHeight: 1.05, ...blurRise(ease(frame, 1, 12), 24, 10) }}>{o.kicker}</div>
        )}
        {o.script && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: big * 0.06, lineHeight: 1, marginTop: big * 0.02 }}>
            <span
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontSize: big * 0.36,
                color: glow,
                clipPath: `inset(-20% ${(1 - scriptReveal) * 100}% -20% 0)`,
                filter: `blur(${(1 - scriptReveal) * 4}px)`,
              }}
            >
              {o.script}
            </span>
            {o.after && <span style={{ fontWeight: 500, fontSize: big * 0.24, letterSpacing: "-0.04em", ...blurRise(ease(frame, 12, 22), 20, 8) }}>{o.after}</span>}
          </div>
        )}
        <div style={{ position: "relative", display: "inline-block", fontWeight: 800, fontSize: big, letterSpacing: "-0.06em", lineHeight: 0.95, marginTop: o.script || o.kicker ? -big * 0.04 : 0 }}>
          <RiseLetters
            text={o.title}
            start={o.script ? 10 : 4}
            style={{
              backgroundImage: "linear-gradient(180deg, #ffffff 30%, rgba(255,255,255,0.55) 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              filter: "drop-shadow(0 12px 30px rgba(0,0,0,0.35))",
            }}
          />
          {o.dot && (() => {
            const dp = pop(frame, fps, (o.script ? 10 : 4) + o.title.length * 1.4 + 6, 12);
            return <span style={{ display: "inline-block", width: big * 0.18, height: big * 0.18, borderRadius: "50%", background: glow, marginLeft: big * 0.03, transform: `scale(${dp})`, boxShadow: `0 0 30px ${hexA(glow, 0.6)}` }} />;
          })()}
          {o.tail && (
            <span style={{ position: "absolute", right: 0, bottom: -big * 0.22, fontWeight: 500, fontSize: big * 0.17, letterSpacing: "-0.03em", ...blurRise(ease(frame, 20, 30), 16, 8) }}>{o.tail}</span>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- STATEMENT: tam ekran sade cumle, ses konusmacidan devam eder ---------- */
export const Statement: React.FC<P<"statement">> = ({ o, durF, brand }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const glow = glowColor(brand);
  const theme = o.bg ?? "dark";
  const bgIn = o.cut ? 1 : interpolate(frame, [0, 6, durF - 6, durF], [0, 1, 1, 0], clamp);
  const out = exitP(frame, durF, 6);
  const big = fit(o.title, 330, W * 0.84, 0.58);
  const deco = o.deco ?? ["arcs", "grid"];
  const cy = H * 0.4;
  const bg =
    theme === "light"
      ? "radial-gradient(ellipse at 50% 40%, #ffffff 0%, #ececec 75%)"
      : theme === "brand"
        ? `radial-gradient(ellipse at 50% 40%, ${hexA(brand.accent, 1)} 0%, ${brand.dark ?? "#111"} 100%)`
        : `radial-gradient(ellipse 70% 40% at 50% 40%, ${hexA(glow, 0.1)} 0%, #0c0c0c 60%, #070707 100%)`;
  const ink = theme === "light" ? "#141414" : "#ffffff";
  const fill =
    theme === "light"
      ? "linear-gradient(180deg, #141414 40%, rgba(20,20,20,0.35) 100%)"
      : `linear-gradient(180deg, #ffffff 25%, ${glow} 140%)`;
  const glowPulse = 0.55 + 0.1 * Math.sin(frame / 10);
  return (
    <AbsoluteFill style={{ opacity: bgIn }}>
      <AbsoluteFill style={{ background: bg }} />
      {deco.includes("grid") && (
        <AbsoluteFill
          style={{
            backgroundImage: `radial-gradient(circle, ${theme === "light" ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.14)"} 2px, transparent 2.5px)`,
            backgroundSize: "104px 104px",
            backgroundPosition: `${52}px ${(frame * 0.4) % 104}px`,
            opacity: 0.8,
          }}
        />
      )}
      {deco.includes("arcs") && <Arcs cx={W / 2} cy={cy} r={W * 0.36} color={ink} />}
      {deco.includes("plus") && (
        <>
          <Plus x={W * 0.15} y={cy - big * 0.8} s={60} delay={8} color={glow} />
          <Plus x={W * 0.85} y={cy + big * 0.7} s={90} delay={14} color={glow} />
        </>
      )}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: cy,
          transform: `translateY(-50%) scale(${1 + 0.035 * (frame / durF)})`,
          opacity: out,
          filter: `blur(${(1 - out) * 10}px)`,
          display: "flex",
          justifyContent: "center",
          fontFamily: INTER,
          color: ink,
        }}
      >
        <div style={{ position: "relative", display: "inline-block" }}>
          {o.kicker && (
            <div style={{ position: "absolute", left: big * 0.05, bottom: "100%", marginBottom: -big * 0.08, whiteSpace: "nowrap", fontWeight: 500, fontSize: big * 0.2, letterSpacing: "-0.04em", ...blurRise(ease(frame, 2, 13), 20, 8) }}>
              {o.kicker}
            </div>
          )}
          <div style={{ fontWeight: 800, fontSize: big, letterSpacing: "-0.06em", lineHeight: 1, filter: theme === "light" ? "none" : `drop-shadow(0 0 ${28 * glowPulse}px ${hexA(glow, 0.55)})` }}>
            <RiseLetters text={o.title} start={6} style={{ backgroundImage: fill, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }} />
          </div>
          {o.tail && (
            <div style={{ position: "absolute", right: 0, top: "100%", marginTop: -big * 0.06, whiteSpace: "nowrap", fontWeight: 500, fontSize: big * 0.16, letterSpacing: "-0.03em", ...blurRise(ease(frame, 18, 28), 16, 8) }}>
              {o.tail}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- STORY: konusmaci buzlu camin arkasinda, anlatilan sey baglantili parcalarla ---------- */
export const Story: React.FC<P<"story">> = ({ o, durF, brand }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const glow = glowColor(brand);
  const dark = o.bg === "dark";
  const bgIn = o.cut ? 1 : interpolate(frame, [0, 8, durF - 7, durF], [0, 1, 1, 0], clamp);
  const starts = o.items.map((it, i) => Math.max(0, Math.round((it.at ?? i * 1.2) * fps) - 2));
  // yeni oge gelince oncekiler hafifce geri cekilir (tek vurgu)
  const activeIdx = starts.reduce((acc, s, i) => (frame >= s ? i : acc), 0);
  const cam = 1.06 - 0.06 * (frame / durF); // tum sahne tek parca: yavas geri cekilen kamera
  const blob = (cx: number, cy: number, r: number, c: string, ph: number) => (
    <div
      style={{
        position: "absolute",
        left: cx * W - r + Math.sin(frame / 40 + ph) * 60,
        top: cy * H - r + Math.cos(frame / 46 + ph) * 50,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        background: c,
        filter: "blur(120px)",
      }}
    />
  );
  return (
    <AbsoluteFill style={{ opacity: bgIn }}>
      {/* konusmaci arkada: buzlu cam */}
      <AbsoluteFill style={{ backdropFilter: "blur(46px) saturate(0.8)", background: dark ? "rgba(10,10,12,0.86)" : o.cut ? "#f3f3f3" : "rgba(243,243,243,0.84)" }} />
      {blob(0.75, 0.35, 380, hexA(glow, dark ? 0.35 : 0.45), 0)}
      {blob(0.2, 0.7, 340, hexA(brand.accent, dark ? 0.35 : 0.22), 2)}
      <AbsoluteFill style={{ transform: `scale(${cam})` }}>
        {o.items.map((it, i) => {
          const s0 = starts[i];
          if (frame < s0) return null;
          const p = pop(frame, fps, s0, 16);
          const e = ease(frame, s0, s0 + 10);
          const back = i < activeIdx ? ease(frame, starts[activeIdx], starts[activeIdx] + 10) : 0;
          const op = Math.min(e, 1 - 0.45 * back);
          const sc = (0.85 + 0.15 * p) * (1 - 0.1 * back);
          const float = Math.sin(frame / 18 + i * 1.7) * 7;
          const x = it.x * W, y = it.y * H;
          if (it.image || it.emoji || it.icon) {
            const size = it.size ?? 420;
            const ring = interpolate(frame, [s0 + 4, s0 + 26], [0, 1], clamp);
            return (
              <div key={i} style={{ position: "absolute", left: x - size / 2, top: y - size / 2 + float, width: size, height: size, opacity: op, transform: `scale(${sc})`, filter: `blur(${(1 - e) * 10}px)` }}>
                {it.circle && ring < 1 && (
                  <div style={{ position: "absolute", inset: -20 - 70 * ring, borderRadius: "50%", border: `3px solid ${hexA(glow, 0.7 * (1 - ring))}` }} />
                )}
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: it.circle ? "50%" : 0,
                    overflow: it.circle ? "hidden" : "visible",
                    border: it.circle ? "8px solid rgba(255,255,255,0.9)" : "none",
                    boxShadow: it.circle ? "0 30px 60px rgba(0,0,0,0.18)" : "none",
                    background: it.circle ? "#fff" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {it.image || it.icon ? (
                    <Img
                      src={staticFile((it.image ?? it.icon)!)}
                      style={{ width: "100%", height: "100%", objectFit: it.circle && it.image ? "cover" : "contain", filter: it.circle ? "none" : "drop-shadow(0 30px 50px rgba(0,0,0,0.2))" }}
                    />
                  ) : (
                    <div style={{ fontFamily: EMOJI, fontSize: size * 0.72, lineHeight: 1, filter: "drop-shadow(0 30px 40px rgba(0,0,0,0.18))" }}>{it.emoji}</div>
                  )}
                </div>
              </div>
            );
          }
          const ink = dark ? "#fff" : "#151515";
          const bigSize = it.big ? fit(it.big, 104, W * 0.8, 0.66) : 0;
          const line = ease(frame, s0 + 6, s0 + 20);
          return (
            <div
              key={i}
              lang="tr"
              style={{
                position: "absolute",
                left: x,
                top: y + float * 0.4,
                transform: `translate(-50%, -50%) scale(${sc})`,
                opacity: op,
                textAlign: "center",
                fontFamily: INTER,
                color: ink,
                whiteSpace: "nowrap",
              }}
            >
              {it.text && <div style={{ fontWeight: 500, fontSize: it.big ? bigSize * 0.48 : 58, letterSpacing: "-0.03em", ...blurRise(e, 18, 8) }}>{it.text}</div>}
              {it.big && (
                <div style={{ fontWeight: 900, fontSize: bigSize, letterSpacing: "-0.035em", lineHeight: 1, textTransform: "uppercase" }}>
                  <RiseLetters text={it.big} start={s0 + 3} stagger={1} style={{ backgroundImage: `linear-gradient(180deg, ${ink} 45%, ${hexA(dark ? "#ffffff" : "#151515", 0.45)} 110%)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }} />
                </div>
              )}
              {/* soylenen fikrin altinda ince marka cizgisi */}
              <div style={{ margin: "14px auto 0", height: 5, borderRadius: 3, width: `${line * 100}%`, background: `linear-gradient(90deg, transparent, ${glow}, transparent)` }} />
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
