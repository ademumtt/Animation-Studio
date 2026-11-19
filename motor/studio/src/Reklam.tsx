import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ARoll, ARollFront } from "./components/ARoll";
import { BehindBack, Statement, Story } from "./components/Derinlik";
import { Film } from "./components/Film";
import { Cutaway, SinemaLook } from "./components/Cutaway";
import { Captions, CaptionMode } from "./components/Captions";
import { BigWord, BRoll, Cta, Glass, Hero, Price, SplitTop, White } from "./components/Overlays";
import type { Overlay, Spec } from "./types";

// Her katman icin varsayilan ses efekti (ses/ klasorunden public/sfx'e kopyalanir)
const DEFAULT_SFX: Partial<Record<Overlay["type"], string>> = {
  hero: "sfx/swoosh-2.mp3",
  white: "sfx/transition-whoosh.mp3",
  split: "sfx/swish-woosh.mp3",
  glass: "sfx/woosh-sfx.mp3",
  price: "sfx/kaching-sound-fx.mp3",
  bigword: "sfx/woosh-sound-effect.mp3",
  cta: "sfx/transition-sfx.mp3",
  broll: "sfx/swoosh-sound-effects.mp3",
  behind: "sfx/swoosh-2.mp3",
  statement: "sfx/transition-whoosh.mp3",
  story: "sfx/swish-woosh.mp3",
  cutaway: "sfx/pop-button.mp3", // destek sahnesi: kesme = kisa pop (whoosh degil)
};

const within = (t: number, o: { at: number; dur: number }) => t >= o.at && t < o.at + o.dur;

export const Reklam: React.FC<Spec> = (spec) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const ov = spec.overlays;

  // bolunmus ekran gecisi (A-roll'u alt yariya iter)
  const split = Math.max(
    0,
    ...ov
      .filter((o) => o.type === "split")
      .map((o) => {
        const a = Math.round(o.at * fps);
        const b = a + Math.round(o.dur * fps);
        return interpolate(frame, [a, a + 10, b - 9, b], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.inOut(Easing.cubic),
        });
      })
  );

  const full: Overlay[] = ov.filter((o) => ["white", "cta", "statement", "story", "film", "cutaway"].includes(o.type));
  const mode = (tt: number): CaptionMode | "off" => {
    if (spec.captions === false) return "off";
    if ((spec.noCaptions ?? []).some((n) => within(tt, n))) return "off";
    // story: ekrandaki yazilar zaten soylenen sozler
    // behind: dev baslik zaten soylenen sozu yaziyor, altyazi tekrar olur
    if (ov.some((o) => (o.type === "cta" || o.type === "story" || o.type === "behind" || o.type === "film") && within(tt, o))) return "off";
    if (ov.some((o) => (o.type === "white" || o.type === "split" || o.type === "statement") && within(tt, o))) return "pill";
    return "word";
  };
  const capY = (tt: number) => {
    // tum altyazi konumlari Meta guvenli alaninda (y < 0.65)
    if (ov.some((o) => (o.type === "white" || o.type === "statement") && within(tt, o))) return 0.6;
    if (ov.some((o) => o.type === "split" && within(tt, o))) return 0.53;
    return 0.6;
  };

  const renderOverlay = (o: Overlay, durF: number) => {
    const p = { brand: spec.brand, durF } as const;
    switch (o.type) {
      case "hero": return <Hero o={o} {...p} />;
      case "glass": return <Glass o={o} {...p} />;
      case "white": return <White o={o} {...p} />;
      case "split": return <SplitTop o={o} {...p} />;
      case "price": return <Price o={o} {...p} />;
      case "bigword": return <BigWord o={o} {...p} />;
      case "cta": return <Cta o={o} {...p} />;
      case "broll": return <BRoll o={o} {...p} />;
      case "behind": return <BehindBack o={o} {...p} />;
      case "statement": return <Statement o={o} {...p} />;
      case "story": return <Story o={o} {...p} />;
      case "film": return <Film o={o} {...p} />;
      case "cutaway": return <Cutaway o={o} durF={durF} />;
    }
  };

  // katman sirasi: B-roll en altta -> behind basliklari -> KESIK KISI (derinlik) -> kartlar -> tam ekran sahneler
  const rank = (o: Overlay) => (o.type === "broll" ? 0 : o.type === "behind" ? 1 : full.includes(o) ? 3 : 2);
  const order = [...ov].sort((a, b) => rank(a) - rank(b));
  const behindWins = ov.filter((o) => o.type === "behind");
  const frontAt = order.findIndex((o) => rank(o) >= 2);

  const renderSeq = (o: Overlay, i: number) => {
    const from = Math.round(o.at * fps);
    const durF = Math.max(2, Math.round(o.dur * fps));
    const sfx = o.sfx === false ? null : o.sfx ?? DEFAULT_SFX[o.type];
    return (
      <Sequence key={i} from={from} durationInFrames={durF} layout="none">
        <AbsoluteFill>{renderOverlay(o, durF)}</AbsoluteFill>
        {sfx && <Audio src={staticFile(sfx)} volume={o.sfxVol ?? 0.45} />}
      </Sequence>
    );
  };
  const below = frontAt < 0 ? order : order.slice(0, frontAt);
  const above = frontAt < 0 ? [] : order.slice(frontAt);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <ARoll spec={spec} split={split} />
      {spec.look === "sinema" && <SinemaLook />}
      {below.map(renderSeq)}
      <ARollFront spec={spec} windows={behindWins} />
      {above.map((o, i) => renderSeq(o, i + below.length))}
      <Captions words={spec.words} brand={spec.brand} mode={mode} y={capY} style={spec.captionStyle} />
      {(spec.sfx ?? []).map((s, i) => (
        <Sequence key={`s${i}`} from={Math.round(s.at * fps)} layout="none">
          <Audio src={staticFile(s.file)} volume={s.vol ?? 0.5} />
        </Sequence>
      ))}
      {spec.music && <Audio src={staticFile(spec.music.file)} volume={spec.music.vol ?? 0.08} loop />}
    </AbsoluteFill>
  );
};
