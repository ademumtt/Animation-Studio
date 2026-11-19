// FILM – sadece ses kaydindan sinematik anlatim (referans: "Attention / costs money", kirmizi isikli degrade,
// egik beyaz panelle gecis). Ilke: az yazi (tek ince + tek kalin satir), derin degrade zemin, yavas hareket eden
// isik, ince film greni, yumusak sekil gecisleri. Patlama/zipla yok; her sey soylendigi anda, sakin.
import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../anim";
import { Arcs, Plus, Ribbon, Think } from "./Derinlik";
import { Art } from "./Art";
import { Device } from "./Device";
import { Obj3D } from "./Obj3D";
import { DIDONE, DIDONE_I, SANS } from "../fonts";
import type { Beat, Brand, Overlay } from "../types";

type P = { o: Extract<Overlay, { type: "film" }>; brand: Brand; durF: number };

const ex = Easing.bezier(0.16, 1, 0.3, 1); // expo-out: premium, yumusak duruş
const io = Easing.bezier(0.65, 0, 0.35, 1);

const rgb = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: string, b: string, k: number) => {
  const A = rgb(a), B = rgb(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(",")})`;
};
const rgba = (hex: string, a: number) => `rgba(${rgb(hex).join(",")},${a})`;

/** Tema zemini. t = saniye (isik yavasca kayar). */
const Ground: React.FC<{ theme: Beat["theme"]; brand: Brand; t: number }> = ({ theme, brand, t }) => {
  const acc = brand.accent;
  const glow = brand.highlight ?? "#F6C26B";
  const dx = Math.sin(t / 3.2) * 6, dy = Math.cos(t / 4.1) * 5; // isik kaymasi (%)
  if (theme === "light")
    return (
      <AbsoluteFill style={{ background: "#f7f5f1" }}>
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 70% at ${50 + dx}% ${42 + dy}%, #ffffff 0%, rgba(255,255,255,0) 70%)` }} />
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 45% at ${100 - dx}% ${100 - dy}%, ${rgba(acc, 0.1)} 0%, rgba(0,0,0,0) 70%)` }} />
      </AbsoluteFill>
    );
  // zemin isigi tonu: marka kartindaki tint (yoksa v1'in kirmizi/pembe tonu)
  const tA = brand.tint ?? "#ff3355", tB = brand.tint ?? "#ff5a6e", tC = brand.tint ?? "#ff4d6a";
  const tk = brand.tint ? 0.22 : 0.45; // canli tint (neon yesil) koyu zemini fazla boyamasin
  if (theme === "brand")
    return (
      <AbsoluteFill style={{ background: `linear-gradient(200deg, ${mix(acc, tA, tk)} 0%, ${acc} 35%, ${mix(acc, "#000000", 0.6)} 72%, #050102 100%)` }}>
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 45% at ${92 + dx}% ${2 + dy}%, ${rgba(tB, brand.tint ? 0.3 : 0.55)} 0%, rgba(0,0,0,0) 70%)`, mixBlendMode: "screen" }} />
        {/* ince dikey dokular (referans kirmizi zemin) */}
        <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0 2px, rgba(0,0,0,0) 2px 56px)" }} />
      </AbsoluteFill>
    );
  const light = theme === "glow" ? glow : mix(acc, tC, 0.35);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${mix(acc, "#000000", 0.9)} 0%, #040203 100%)` }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 55% at ${96 + dx}% ${4 + dy}%, ${rgba(light, theme === "glow" ? 0.35 : 0.5)} 0%, rgba(0,0,0,0) 72%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(circle at ${45 - dx}% ${48 - dy}%, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 38%)` }} />
    </AbsoluteFill>
  );
};

/** Kelime kelime maskeden yukari kayan satir (premium kinetik tipografi). */
const MaskLine: React.FC<{ text: string; start: number; style: React.CSSProperties; stagger?: number; dot?: string }> = ({ text, start, style, stagger = 2.2, dot }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ ...style, display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: "0.24em" }}>
      {text.split(" ").map((w, i) => {
        const p = interpolate(frame, [start + i * stagger, start + i * stagger + 16], [0, 1], { ...clamp, easing: ex });
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", padding: "0.06em 0.02em 0.14em", margin: "-0.06em -0.02em -0.14em" }}>
            <span style={{ display: "inline-block", transform: `translateY(${(1 - p) * 105}%)`, opacity: Math.min(1, p * 2.5) }}>
              {dot && w.endsWith(".") ? (
                <>
                  {w.slice(0, -1)}
                  <span style={{ color: dot }}>.</span>
                </>
              ) : (
                w
              )}
            </span>
          </span>
        );
      })}
    </div>
  );
};

// v2 (2026-11-15): kompozisyon ortada (saas-animation "tam orta" kurali). Cizim + yazi grubu ~y 0.43, yazi Meta guvenli alaninda.
const ART_TOP = 420;
const TEXT_TOP = 1050;
const EXIT = 9; // cikis suresi (kare)

/** exit: "after" = sonraki vurus BASLADIKTAN sonra 9 karede cikar (ust uste biner, bos kare kalmaz);
 *  "none" = hic cikmaz (sonraki vurus sekilli gecisle ustunu ortuyor). v1'de cikis sonraki vurustan ONCE bitiyordu ->
 *  ~0.3 sn bos ekran. */
const BeatView: React.FC<{ b: Beat; from: number; to: number; brand: Brand; fps: number; exit?: "after" | "none" }> = ({ b, from, to, brand, fps, exit = "after" }) => {
  const frame = useCurrentFrame();
  const W = 1080;
  const F = (s: number | undefined, d: number) => Math.round((s ?? d) * fps);
  const dark = b.theme !== "light";
  const ink = dark ? "#ffffff" : "#141414";
  // G2: sekilli gecisle gelen sahnede yazi, sekil eski yaziyi ortunceye kadar (~12 kare) bekler -> ust uste binme yok
  const enterGap = b.trans === "ring" || b.trans === "wipe" ? 12 : 0;
  const sF = Math.max(F(b.smallAt, b.at) + (b.logo ? 12 : 0), from + enterGap);
  const bF = Math.max(F(b.bigAt, b.at) + (b.bigAt === undefined && b.small ? 6 : 0), from + enterGap);
  // G2: hazirlik sikismasi - sonraki sekil bu sahnenin nesnesinden buyumeden hemen once nesne %7 sikisir
  const antic = exit === "none" ? interpolate(frame, [to - 7, to - 1, to + 6], [1, 0.93, 1.04], clamp) : 1;
  const outP = exit === "none" ? 1 : interpolate(frame, [to, to + EXIT], [1, 0], { ...clamp, easing: io });
  const push = 1 + 0.035 * interpolate(frame, [from, Math.max(from + 1, to)], [0, 1], clamp); // yavas kamera itmesi
  const smallP = interpolate(frame, [sF, sF + 14], [0, 1], { ...clamp, easing: ex });

  let bigText = b.big ?? "";
  if (b.seq?.length) {
    const cur = [...b.seq].reverse().find((s) => frame >= Math.round(s.at * fps) - 1) ?? b.seq[0];
    bigText = cur.text;
  }
  if (b.count !== undefined) {
    const c = interpolate(frame, [bF, bF + Math.round(0.8 * fps)], [0, b.count], { ...clamp, easing: Easing.out(Easing.cubic) });
    bigText = `${Math.round(c / 10) * 10}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (b.big ? ` ${b.big}` : "");
  }
  const serif = b.serif || b.italic;
  const len = Math.max(4, bigText.length);
  const bigSize = Math.min(serif ? 190 : 150, (W * 0.84) / (len * (serif ? 0.5 : 0.6)));
  const bigStyle: React.CSSProperties = serif
    ? { fontFamily: b.italic ? DIDONE_I : DIDONE, fontWeight: 400, fontSize: bigSize, letterSpacing: "-0.02em", lineHeight: 1.0, color: ink }
    : { fontFamily: SANS, fontWeight: 800, fontSize: bigSize, letterSpacing: "-0.035em", lineHeight: 1.02, color: ink };
  const smallStyle: React.CSSProperties = { fontFamily: SANS, fontWeight: 400, fontSize: 58, letterSpacing: "-0.015em", color: ink, opacity: dark ? 0.92 : 0.78 };

  const smallEl = b.small && frame >= sF - 1 && (
    <div style={{ ...smallStyle, opacity: (smallStyle.opacity as number) * smallP, transform: `translateY(${(1 - smallP) * 18}px)`, filter: `blur(${(1 - smallP) * 8}px)` }}>{b.small}</div>
  );
  // seq: her degisimde kisa blur gecisi; key ile yeniden maske animasyonu
  const seqStart = b.seq?.length ? Math.round(([...b.seq].reverse().find((s) => frame >= Math.round(s.at * fps) - 1) ?? b.seq[0]).at * fps) - 1 : bF;
  const bigEl = bigText && frame >= bF - 1 && (
    <div style={{ position: "relative", display: "inline-block" }}>
      <MaskLine key={bigText.length && b.seq ? bigText : "b"} text={bigText} start={b.seq ? seqStart : bF} style={bigStyle} stagger={b.count !== undefined || b.block ? 0 : 2.2} dot={dark ? brand.highlight ?? "#F6C26B" : brand.accent} />
      {b.strikeAt !== undefined && (() => {
        const k = interpolate(frame, [F(b.strikeAt, 0), F(b.strikeAt, 0) + 10], [0, 1], { ...clamp, easing: io });
        return <div style={{ position: "absolute", left: "-4%", top: "54%", height: Math.max(6, bigSize * 0.06), width: `${108 * k}%`, background: brand.highlight ?? "#F6C26B", borderRadius: 6, transform: "rotate(-4deg)", boxShadow: "0 4px 18px rgba(0,0,0,0.25)" }} />;
      })()}
    </div>
  );
  const iF = F(b.iconAt, b.at);
  const iconP = interpolate(frame, [iF, iF + 16], [0, 1], { ...clamp, easing: ex });

  if (b.logo) {
    // v2: logo onceki sahne (EXIT kare) cikarken ustune binmesin -> cikisin ortasindan sonra girer
    const lp = interpolate(frame, [from + 6, from + 26], [0, 1], { ...clamp, easing: ex });
    const bp = interpolate(frame, [from + 16, from + 34], [0, 1], { ...clamp, easing: ex });
    return (
      // kapanis: kamera itmesi yok (saas: son kart kusursuz ortali, kayma yok)
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 34, paddingBottom: 300 }}>
        {/* G6: logo indiginde parlama + marka renkli parcacik patlamasi (saas: "payoff" vurusunda kucuk kutlama) */}
        {(() => {
          const t0 = from + 20;
          const g = interpolate(frame, [t0 - 2, t0 + 3, t0 + 24], [0, 1, 0], clamp);
          const col = brand.highlight ?? "#F6C26B";
          const cy = 690;
          return (
            <>
              <div style={{ position: "absolute", left: W / 2 - 420, top: cy - 420, width: 840, height: 840, borderRadius: "50%", background: `radial-gradient(circle, ${rgba(col, dark ? 0.35 : 0.22)} 0%, rgba(0,0,0,0) 62%)`, opacity: g, pointerEvents: "none" }} />
              {Array.from({ length: 22 }).map((_, i) => {
                const t = (frame - t0) / 30;
                if (t <= 0 || t > 1.4) return null;
                const a = (i / 22) * Math.PI * 2 + (i % 3) * 0.21;
                const sp = 520 + (i * 97) % 380; // px/sn
                const x = W / 2 + Math.cos(a) * sp * t * (1 - 0.35 * t);
                const y = cy + Math.sin(a) * sp * t * (1 - 0.35 * t) + 260 * t * t; // yercekimi
                const s = i % 3 === 0 ? 18 : i % 3 === 1 ? 12 : 8;
                return <div key={i} style={{ position: "absolute", left: x - s / 2, top: y - s / 2, width: s, height: i % 2 ? s : s * 0.45, borderRadius: i % 2 ? "50%" : 3, background: i % 4 === 3 ? (dark ? "#fff" : brand.accent) : col, opacity: interpolate(t, [0, 0.1, 1, 1.4], [0, 1, 0.9, 0], clamp), transform: `rotate(${(frame - t0) * (i % 2 ? 9 : -7)}deg)` }} />;
              })}
            </>
          );
        })()}
        {/* koyu kapanista siyah zeminli logolar 'screen' ile zemine karisir (siyah kare gorunmez) */}
        {/* G6: logo indikten sonra ustunden isik supurmesi (koyu kapanis: luminans maskesi -> sadece logo pikselleri parlar) */}
        <div style={{ position: "relative", width: W * (b.logoW ?? 0.62), opacity: lp, transform: `translateY(${(1 - lp) * 30}px)`, filter: `blur(${(1 - lp) * 10}px)`, mixBlendMode: dark ? "screen" : "normal" }}>
          <Img src={staticFile(b.logo)} style={{ width: "100%", display: "block" }} />
          {(() => {
            const sw = interpolate(frame, [from + 28, from + 66], [-30, 130], { ...clamp, easing: Easing.inOut(Easing.sin) });
            if (sw <= -30 || sw >= 130) return null;
            const band = `linear-gradient(105deg, rgba(255,255,255,0) ${sw - 14}%, rgba(255,255,255,0.95) ${sw}%, rgba(255,255,255,0) ${sw + 14}%)`;
            // koyu kapanis: beyaz harf uzerinde beyaz isik gorunmez -> marka renginde parilti (harfleri boyar) + hafif hale
            // SVG maske varsayilan olarak LUMINANS kullanir (CSS mask-mode render motorunda calismadi)
            const hc = brand.highlight ?? "#F6C26B";
            const o = sw / 100;
            return dark ? (
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
                <defs>
                  <linearGradient id="lgSw" x1="0" y1="0.25" x2="1" y2="0.75">
                    <stop offset={o - 0.22} stopColor={hc} stopOpacity="0" />
                    <stop offset={o - 0.06} stopColor={hc} stopOpacity="1" />
                    <stop offset={o + 0.06} stopColor={hc} stopOpacity="1" />
                    <stop offset={o + 0.22} stopColor={hc} stopOpacity="0" />
                  </linearGradient>
                  <mask id="lgMask" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
                    <image href={staticFile(b.logo)} x="0" y="0" width="100" height="100" preserveAspectRatio="none" />
                  </mask>
                  <filter id="lgGlow" x="-10%" y="-10%" width="120%" height="120%">
                    <feGaussianBlur stdDeviation="1.2" />
                  </filter>
                </defs>
                <rect x="0" y="0" width="100" height="100" fill="url(#lgSw)" mask="url(#lgMask)" filter="url(#lgGlow)" opacity="0.8" />
                <rect x="0" y="0" width="100" height="100" fill="url(#lgSw)" mask="url(#lgMask)" />
              </svg>
            ) : (
              <div style={{ position: "absolute", inset: 0, background: band, mixBlendMode: "soft-light" }} />
            );
          })()}
        </div>
        {smallEl}
        {b.button && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              marginTop: 18,
              padding: "26px 54px",
              borderRadius: 999,
              // koyu kapanista koyu buton kaybolur -> vurgu renginde buton, koyu yazi
              background: dark ? brand.highlight ?? "#F6C26B" : brand.dark ?? "#141414",
              color: dark ? "#0b0b0b" : "#fff",
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 46,
              letterSpacing: "-0.01em",
              opacity: bp,
              transform: `translateY(${(1 - bp) * 24}px) scale(${1 + 0.018 * Math.sin((frame - from) / 7) * bp})`,
              boxShadow: `0 20px 50px ${rgba(brand.accent, 0.3)}`,
            }}
          >
            {b.buttonIcon && <Img src={staticFile(b.buttonIcon)} style={{ width: 58, height: 58, marginLeft: -10 }} />}
            {b.button}
          </div>
        )}
      </AbsoluteFill>
    );
  }

  // uygulama/ekran sahnesi: cizim yerine 3B telefon (ayni yuva, yazi altinda)
  const deviceEl = b.device && (
    <div style={{ position: "absolute", left: 0, right: 0, top: ART_TOP - 190, display: "flex", justifyContent: "center", transform: `scale(${antic})` }}>
      <Device d={b.device} from={from} to={to} fps={fps} k1={bF} dark={dark} brand={brand} />
    </div>
  );
  // gercek 3B nesne (hediye kutusu, takvim...) – cizim yuvasinda
  const objEl = b.obj && (
    <div style={{ position: "absolute", left: 0, right: 0, top: ART_TOP - 190, display: "flex", justifyContent: "center", transform: `scale(${antic})` }}>
      <Obj3D o={b.obj} from={from} to={to} k1={bF} dark={dark} brand={brand} />
    </div>
  );
  // anlam cizimi varsa: cizim ustte (y 0.17-0.48), yazi altinda (Meta guvenli alani y < 0.65)
  const artEl = !b.device && !b.obj && b.art && (
    <div style={{ position: "absolute", left: 0, right: 0, top: ART_TOP, display: "flex", justifyContent: "center", transform: `scale(${antic})`, transformOrigin: "50% 300px" }}>
      <Art
        name={b.art}
        lf={frame - from}
        k1={bF - from}
        k0={b.artAt !== undefined ? F(b.artAt, 0) - from : undefined}
        seqIdx={b.seq ? Math.max(0, b.seq.findIndex((s) => s.text === bigText)) : undefined}
        seqF={seqStart - from}
        dark={dark}
        accent={brand.accent}
        glow={brand.highlight ?? "#F6C26B"}
        size={b.art === "tag" || b.art === "coin" ? 520 : 600}
        brandName={brand.name}
        variant={b.artVar}
      />
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: b.art || b.device || b.obj ? "flex-start" : "center",
        flexDirection: "column",
        textAlign: "center",
        paddingBottom: b.art || b.device || b.obj ? 0 : 260, // Meta guvenli alani: yazi merkezi ~y 0.43
        paddingTop: b.device || b.obj ? TEXT_TOP + 40 : b.art ? TEXT_TOP : 0,
        opacity: outP,
        filter: `blur(${(1 - outP) * 10}px)`,
        transform: `translateY(${(1 - outP) * -24}px) scale(${push})`,
      }}
    >
      {deviceEl}
      {objEl}
      {artEl}
      {b.icon && (
        <Img src={staticFile(b.icon)} style={{ width: 170, height: 170, marginBottom: 30, opacity: iconP, transform: `translateY(${(1 - iconP) * 30}px) scale(${0.9 + 0.1 * iconP})`, filter: `blur(${(1 - iconP) * 8}px) drop-shadow(0 18px 30px rgba(0,0,0,0.18))` }} />
      )}
      {b.bigFirst ? (
        <>
          {bigEl}
          <div style={{ marginTop: 6 }}>{smallEl}</div>
        </>
      ) : (
        <>
          {smallEl}
          <div style={{ marginTop: 10 }}>{bigEl}</div>
        </>
      )}
      {b.note && (() => {
        const nF = F(b.noteAt, (b.bigAt ?? b.at) + 0.5);
        const np = interpolate(frame, [nF, nF + 14], [0, 1], { ...clamp, easing: ex });
        return (
          <div style={{ marginTop: 26, fontFamily: SANS, fontWeight: 500, fontSize: 40, letterSpacing: "0.01em", color: ink, opacity: 0.72 * np, transform: `translateY(${(1 - np) * 14}px)`, filter: `blur(${(1 - np) * 6}px)` }}>
            {b.note}
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};

/** Derinlik testinden gelen arka plan hareketleri (kurdele, yaylar, +, cam cerceve, nokta izgara, dusunce balonu).
 *  Yazinin ARKASINDA, kendi vurusunun basinda baslar (Sequence ile yerel kare), vurus sonunda yumusakca kaybolur. */
const Deco: React.FC<{ b: Beat; brand: Brand; len: number }> = ({ b, brand, len }) => {
  const frame = useCurrentFrame();
  const W = 1080, H = 1920, cy = 830;
  const dark = b.theme !== "light";
  const ink = dark ? "rgba(255,255,255,0.9)" : "rgba(20,20,20,0.75)";
  const glow = brand.highlight ?? "#F6C26B";
  const out = interpolate(frame, [len - 9, len], [1, 0], clamp);
  const d = b.deco ?? [];
  return (
    <AbsoluteFill style={{ opacity: out }}>
      {d.includes("grid") && (
        <AbsoluteFill
          style={{
            backgroundImage: `radial-gradient(circle, ${dark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.10)"} 2px, transparent 2.5px)`,
            backgroundSize: "104px 104px",
            backgroundPosition: `52px ${(frame * 0.4) % 104}px`,
            opacity: interpolate(frame, [0, 14], [0, 1], clamp),
            maskImage: "radial-gradient(ellipse 70% 50% at 50% 43%, #000 30%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 50% at 50% 43%, #000 30%, transparent 80%)",
          }}
        />
      )}
      {d.includes("frame") && (() => {
        const p = interpolate(frame, [0, 18], [0, 1], { ...clamp, easing: ex });
        const fw = W * 0.7, fh = H * 0.46;
        return (
          <div
            style={{
              position: "absolute",
              left: (W - fw) / 2,
              top: cy - fh * 0.42,
              width: fw,
              height: fh,
              borderRadius: 96,
              border: `3px solid ${dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}`,
              background: dark ? "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.01))" : "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.2))",
              boxShadow: dark ? "none" : "0 40px 80px rgba(0,0,0,0.06)",
              opacity: p,
              transform: `scale(${0.94 + 0.06 * p}) translateY(${Math.sin(frame / 24) * 6}px)`,
            }}
          >
            <div style={{ position: "absolute", top: 34, left: "50%", width: 130, height: 34, marginLeft: -65, borderRadius: 20, background: dark ? "rgba(255,255,255,0.85)" : "rgba(20,20,20,0.85)" }} />
          </div>
        );
      })()}
      {d.includes("ribbon") && (
        // yazinin ALTINDAN dolasan altin kurdele (yazinin ustunden gecmez)
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${H * 0.17}px)` }}>
          <Ribbon color={glow} W={W} H={H} />
        </div>
      )}
      {d.includes("arcs") && <Arcs cx={W / 2} cy={cy} r={W * 0.4} color={ink} />}
      {d.includes("think") && <Think x={W * 0.2} y={cy - 250} color={ink} />}
      {d.includes("plus") && (
        <>
          <Plus x={W * 0.15} y={cy - 230} s={64} delay={8} color={glow} />
          <Plus x={W * 0.86} y={cy + 120} s={110} delay={14} color={glow} />
          <Plus x={W * 0.24} y={cy + 300} s={40} delay={20} color={glow} />
        </>
      )}
    </AbsoluteFill>
  );
};

/** Iki tema arasi gecis maskesi (yeni zemin + yeni yazi bu maskenin icinde gelir).
 *  v2 (2026-11-15, kullanici: "sahneler arasinda ortalanmis gecis olmali"): gecisler ekranin kenarindan degil, cikan
 *  sahnenin ana nesnesinin merkezinden buyur (saas-animation: sekil ortadan buyuyup ekrani doldurur).
 *  ring = daire, wipe = yuvarlak koseli kare (daire <-> kare cesitliligi). */
const VW = 1080, VH = 1920;
const COVER = Math.hypot(VW / 2, VH * 0.65) + 40; // merkezden en uzak koseye (px)
const transClip = (kind: Beat["trans"], p: number, cx: number, cy: number): React.CSSProperties => {
  if (kind === "ring") return { clipPath: `circle(${p * COVER}px at ${cx}px ${cy}px)` };
  if (kind === "wipe") {
    const h = p * COVER; // yari kenar
    const r = 0.3 * h * Math.pow(1 - p, 1.2); // kose yuvarlakligi: kucukken yuvarlak kare, sonda 0 (koseler kalmaz)
    const t = Math.max(0, cy - h), b = Math.max(0, VH - cy - h), l = Math.max(0, cx - h), rt = Math.max(0, VW - cx - h);
    return { clipPath: `inset(${t}px ${rt}px ${b}px ${l}px round ${r}px)` };
  }
  return { opacity: p };
};
/** Sahnenin ana nesnesinin (cizim varsa cizim, yoksa yazi grubu) ekran merkezi. */
const focusOf = (b: Beat): [number, number] => {
  if (b.logo) return [VW / 2, 810];
  if (b.device || b.obj) return [VW / 2, ART_TOP + 260];
  if (b.art) return [VW / 2, ART_TOP + (b.art === "tag" || b.art === "coin" ? 260 : 300)];
  if (!b.big && !b.small) return [VW / 2, 830];
  return [VW / 2, 830];
};

export const Film: React.FC<P> = ({ o, brand, durF }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const beats = o.beats;
  const startF = beats.map((b) => Math.round(b.at * fps));
  const TR = 14; // gecis suresi (kare)
  let k = 0;
  startF.forEach((s, i) => {
    if (frame >= s - 1) k = i;
  });

  const toOf = (i: number) => (i + 1 < beats.length ? startF[i + 1] : durF + 12);
  // sonraki vurus sekilli gecisle (ring/wipe + tema degisimi) geliyorsa bu vurus hic cikmaz: gecis onu ortene kadar ekranda
  // v2: ayni zeminde de sekilli gecis (aksi halde eski ve yeni cizim/yazi ust uste biniyordu)
  const isShape = (b: Beat) => b.trans === "ring" || b.trans === "wipe";
  const shapedNext = (i: number) => i + 1 < beats.length && isShape(beats[i + 1]);
  const view = (i: number) => <BeatView key={`v${i}`} b={beats[i]} from={startF[i]} to={toOf(i)} brand={brand} fps={fps} exit={shapedNext(i) ? "none" : "after"} />;
  const back = (i: number) => {
    const b = beats[i];
    const to = toOf(i);
    return (
      <>
        <Ground theme={b.theme} brand={brand} t={frame / fps} />
        {b.deco?.length ? (
          <Sequence from={startF[i]} durationInFrames={Math.max(1, to - startF[i])} layout="none">
            <Deco b={b} brand={brand} len={to - startF[i]} />
          </Sequence>
        ) : null}
      </>
    );
  };
  const layer = (i: number) => (
    <AbsoluteFill key={i}>
      {back(i)}
      {view(i)}
    </AbsoluteFill>
  );

  const cur = beats[k];
  const prevI = k - 1;
  const shaped = cur.trans === "ring" || cur.trans === "wipe";
  // sekilli gecis: nesnenin etrafinda yumusak baslar, ekrani doldururken yavaslar (~0.73 sn); fade: simetrik
  const p = interpolate(frame, [startF[k], startF[k] + (shaped ? 22 : TR)], [0, 1], { ...clamp, easing: shaped ? Easing.bezier(0.6, 0, 0.25, 1) : io });
  const themeChange = prevI >= 0 && cur.trans !== "cut" && (shaped || beats[prevI].theme !== cur.theme);
  const ringEdge = shaped && themeChange && p < 1;
  const [fx, fy] = prevI >= 0 ? focusOf(beats[prevI]) : [VW / 2, 830];
  // ayni zeminde gecis: onceki vurusun yazisi/cizimi yeni vurus baslarken 9 karede cikar (bos kare yok)
  const prevExiting = prevI >= 0 && frame < startF[k] + EXIT + 1;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {themeChange && p < 1 ? (
        <>
          {/* onceki vurus TUMUYLE altta kalir (zemin + yazi + cizim); yeni vurus gecis maskesiyle ustune gelir */}
          <AbsoluteFill>{layer(prevI)}</AbsoluteFill>
          <AbsoluteFill style={transClip(cur.trans, p, fx, fy)}>
            {/* yeni sahne once zemin rengiyle dolar, sonra %93 -> %100 olcekle yerine oturur (saas) */}
            <AbsoluteFill style={shaped ? { transform: `scale(${0.93 + 0.07 * p})`, transformOrigin: `${fx}px ${fy}px` } : undefined}>{layer(k)}</AbsoluteFill>
          </AbsoluteFill>
          {ringEdge && (() => {
            // buyuyen seklin ince beyaz kenari (merkezden)
            const h = p * COVER;
            const r = cur.trans === "ring" ? h : 0.3 * h * Math.pow(1 - p, 1.2);
            return <div style={{ position: "absolute", left: fx - h, top: fy - h, width: 2 * h, height: 2 * h, borderRadius: r, border: `4px solid rgba(255,255,255,${0.7 * (1 - p)})` }} />;
          })()}
        </>
      ) : prevExiting && !themeChange ? (
        <AbsoluteFill>
          {back(k)}
          {view(prevI)}
          {view(k)}
        </AbsoluteFill>
      ) : (
        layer(k)
      )}
      {/* gecis sesi: sadece sekilli gecislerde, cok hafif */}
      {beats.map((b, i) =>
        o.gecisSesi !== false && i > 0 && (b.trans === "wipe" || b.trans === "ring") ? (
          <Sequence key={`a${i}`} from={startF[i] - 2} durationInFrames={45} layout="none">
            <Audio src={staticFile(b.trans === "wipe" ? "sfx/swish-woosh.mp3" : "sfx/transition-whoosh.mp3")} volume={0.22} />
          </Sequence>
        ) : null
      )}
      {/* film greni: dijital "temiz" goruntuyu kirar */}
      <AbsoluteFill style={{ opacity: 0.06, mixBlendMode: "overlay", pointerEvents: "none" }}>
        <svg width="100%" height="100%">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 6} />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
