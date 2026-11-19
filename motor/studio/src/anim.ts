import { Easing, interpolate, spring } from "remotion";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Giris/cikis ilerlemesi: 0 -> 1 (giris), cikista 1 -> 0. */
export const inOut = (frame: number, dur: number, fps: number, inF = 12, outF = 9) => {
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 170, mass: 0.8 }, durationInFrames: inF + 6 });
  const exit = interpolate(frame, [dur - outF, dur], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  return Math.min(enter, exit);
};

export const pop = (frame: number, fps: number, delay = 0, damping = 13) =>
  spring({ frame: frame - delay, fps, config: { damping, stiffness: 200, mass: 0.7 } });

export const ease = (frame: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(frame, [a, b], [from, to], { ...clamp, easing: Easing.out(Easing.cubic) });

/** Blur+yukari kayarak belirme (premium yazi girisi). */
export const blurRise = (p: number, dist = 40, blur = 18) => ({
  opacity: p,
  transform: `translateY(${(1 - p) * dist}px)`,
  filter: `blur(${(1 - p) * blur}px)`,
});
