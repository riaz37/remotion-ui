import { Fragment } from "react";
import { TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill, staticFile, useVideoConfig } from "remotion";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { CardStack3d } from "@/remotion/scenes/card-stack-3d";
import { DeviceMockup3D } from "@/remotion/scenes/device-mockup-3d";
import { GlobePoints3d } from "@/remotion/scenes/globe-points-3d";
import { ProductTurntable3d } from "@/remotion/scenes/product-turntable-3d";
import { TextExtrude3d } from "@/remotion/scenes/text-extrude-3d";
import {
  BeatCaption,
  COLORS,
  EndCard,
  Grid,
  Hook,
  FramedScene,
  type GridTile,
} from "./three-d-showcase-parts";

/**
 * three-d-showcase — a square social clip for the five `3d` lane components.
 *
 * Every 3D frame is the registry scene itself, played from an offset into its
 * own timeline so no beat opens on the scene's quiet first frames.
 *
 * Timeline (741 frames @ 30fps, 1080x1080, 12-frame crossfades):
 *   hook 0-74 · device 63-167 · turntable 156-260 · text 249-353
 *   · cards 342-446 · globe 435-539 · grid 528-647 · end 636-740
 *
 * Duration math: 75 + 5 x 105 + 120 + 105 - 7 x 12 = 741.
 *
 * Render with GL flags (see GL_RENDER_FLAGS): --gl=angle --concurrency=1.
 */

const DURATIONS = { hook: 75, beat: 105, grid: 120, end: 105 } as const;
const FADE_FRAMES = 12;

type Beat = GridTile & { descriptor: string };

const BEATS: readonly Beat[] = [
  {
    slug: "device-mockup-3d",
    descriptor: "Your screenshot on a 3D laptop",
    offset: 40,
    aspect: 1.35,
    render: () => (
      <DeviceMockup3D
        src={staticFile("launch-film/04-preview-ready.png")}
        backgroundColor={COLORS.stage}
      />
    ),
  },
  {
    slug: "product-turntable-3d",
    descriptor: "A studio turntable, zero assets",
    offset: 30,
    aspect: 1,
    render: () => <ProductTurntable3d />,
  },
  {
    slug: "text-extrude-3d",
    descriptor: "Extruded, beveled 3D type",
    offset: 20,
    aspect: 1,
    // "MOTION" is sized for landscape and runs off a square frame.
    render: () => (
      <TextExtrude3d
        text="3D"
        fontSize={1.9}
        fontUrl={staticFile("fonts/geist-bold.typeface.json")}
      />
    ),
  },
  {
    slug: "card-stack-3d",
    descriptor: "A fanned 3D card deck",
    // Early frames swing the deck edge-on past the right edge.
    offset: 150,
    aspect: 1.6,
    render: () => <CardStack3d backgroundColor={COLORS.stage} />,
  },
  {
    slug: "globe-points-3d",
    descriptor: "A dotted globe with live routes",
    offset: 35,
    aspect: 1.2,
    render: () => (
      <GlobePoints3d
        landUrl={staticFile("geo/land-110m.json")}
        backgroundColor={COLORS.stage}
      />
    ),
  },
];

export const THREE_D_SHOWCASE_DURATION =
  DURATIONS.hook +
  BEATS.length * DURATIONS.beat +
  DURATIONS.grid +
  DURATIONS.end -
  (BEATS.length + 2) * FADE_FRAMES;

/** Room left under a letterboxed scene for the caption. */
const CAPTION_LIFT = 70;

const BeatScene: React.FC<{ beat: Beat }> = ({ beat }) => {
  const { width, height } = useVideoConfig();
  return (
    <FramedScene
      box={{ width, height }}
      aspect={beat.aspect}
      lift={CAPTION_LIFT}
      offset={beat.offset}
      length={DURATIONS.beat}
    >
      {beat.render()}
    </FramedScene>
  );
};

const FADE = transitionFade({ durationInFrames: FADE_FRAMES });

export const ThreeDShowcase: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.stage }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={DURATIONS.hook}>
        <Hook />
      </TransitionSeries.Sequence>

      {BEATS.map((beat, i) => (
        <Fragment key={beat.slug}>
          <TransitionSeries.Transition {...FADE} />
          <TransitionSeries.Sequence durationInFrames={DURATIONS.beat}>
            <BeatScene beat={beat} />
            <BeatCaption
              slug={beat.slug}
              descriptor={beat.descriptor}
              index={i + 1}
              total={BEATS.length}
            />
          </TransitionSeries.Sequence>
        </Fragment>
      ))}

      <TransitionSeries.Transition {...FADE} />
      <TransitionSeries.Sequence durationInFrames={DURATIONS.grid}>
        <Grid tiles={[...BEATS]} length={DURATIONS.grid} />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition {...FADE} />
      <TransitionSeries.Sequence durationInFrames={DURATIONS.end}>
        <EndCard url="remotionui.com" handle="@remotionui" />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
