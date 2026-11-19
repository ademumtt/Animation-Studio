import React from "react";
import { Composition } from "remotion";
import { Reklam } from "./Reklam";
import type { Spec } from "./types";
import "./fonts";

const demo: Spec = {
  brand: { name: "Demo", accent: "#F5B82E" },
  segments: [],
  words: [],
  overlays: [],
  extraEnd: 3,
};

export const Root: React.FC = () => (
  <Composition
    id="Reklam"
    component={Reklam as unknown as React.FC<Record<string, unknown>>}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={90}
    defaultProps={demo as unknown as Record<string, unknown>}
    calculateMetadata={({ props }) => {
      const p = props as unknown as Spec;
      const fps = p.fps ?? 30;
      const speech = Math.round(p.segments.reduce((n, s) => n + (s.out - s.in), 0) * fps);
      return { fps, durationInFrames: Math.max(30, speech + Math.round((p.extraEnd ?? 0) * fps)) };
    }}
  />
);
