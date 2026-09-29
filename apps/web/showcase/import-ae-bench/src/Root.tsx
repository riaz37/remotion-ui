import { Lottie, type LottieAnimationData } from "@remotion/lottie";
import type { ComponentType } from "react";
import { AbsoluteFill, Composition } from "remotion";
import { FIXTURES } from "./fixtures.gen";

/**
 * Two compositions per fixture, identical size / fps / length: `Lottie-*`
 * plays the JSON through `@remotion/lottie` (lottie-web, SVG renderer) and
 * `Gen-*` renders the TSX `remotion-ui import-ae` wrote for it. Both sit on
 * white so a transparent frame cannot pass for a match.
 */

const bySlug = new Map<string, (typeof FIXTURES)[number]>(FIXTURES.map((f) => [f.slug, f]));

/** White-on-white fixtures would score a perfect, meaningless match on white. */
const DARK = new Set(["trim-wrap-around"]);
const background = (slug: string) => (DARK.has(slug) ? "#1e1e1e" : "#ffffff");

// Props must survive JSON serialisation, so compositions receive a slug.
const Playback = ({ slug }: { slug: string }) => (
  <AbsoluteFill style={{ backgroundColor: background(slug) }}>
    {/* A sized container: left to grow around the inline SVG, lottie-web's
        xMidYMid-meet centring shifts the whole frame by a couple of pixels. */}
    <Lottie
      animationData={bySlug.get(slug)!.json as unknown as LottieAnimationData}
      style={{ width: "100%", height: "100%" }}
    />
  </AbsoluteFill>
);

const Generated = ({ slug }: { slug: string }) => {
  const Component: ComponentType = bySlug.get(slug)!.Generated;
  return (
    <AbsoluteFill style={{ backgroundColor: background(slug) }}>
      <Component />
    </AbsoluteFill>
  );
};

export const Root = () => (
  <>
    {FIXTURES.map((f) => (
      <Composition
        key={`lottie-${f.slug}`}
        id={`Lottie-${f.slug}`}
        component={Playback}
        defaultProps={{ slug: f.slug }}
        durationInFrames={f.durationInFrames}
        fps={f.fps}
        width={f.width}
        height={f.height}
      />
    ))}
    {FIXTURES.map((f) => (
      <Composition
        key={`gen-${f.slug}`}
        id={`Gen-${f.slug}`}
        component={Generated}
        defaultProps={{ slug: f.slug }}
        durationInFrames={f.durationInFrames}
        fps={f.fps}
        width={f.width}
        height={f.height}
      />
    ))}
  </>
);
