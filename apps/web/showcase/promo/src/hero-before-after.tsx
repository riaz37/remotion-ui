import { loadFont } from "@remotion/google-fonts/Inter";
import { TransitionSeries } from "@remotion/transitions";
import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { transitionFade } from "@/remotion/primitives/transition-fade";
import { transitionLiquidWarp } from "@/remotion/primitives/transition-liquid-warp";
import { RemotionUIMark } from "./remotionui-mark";

/**
 * hero-before-after — a square (and vertical) social clip: the old homepage
 * hero dissolves into the new phosphor hero.
 *
 * Footage is real browser capture (Playwright + swiftshader, fake clock
 * stepped 1/30 s per frame so the WebGL field and the hero-loop ident play at
 * true speed), 1920x1080 each, stored under public/showcases/hero-before-after/.
 *
 *   old.mp4  240f: rest 0-89, scroll 90-209 (0 -> 800px), hold 210-239
 *   new.mp4  330f: rest 0-149, scroll 150-299 (0 -> 800px), hold 300-329
 *
 * Timeline (445 frames @ 30fps, transitions overlapping):
 *   before 0-134 · warp 105-134 · after 105-374 · fade 355-374 · end 355-444
 *
 * Duration math: (135 + 270 + 90) - 30 - 20 = 445.
 */

const { fontFamily } = loadFont("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

const COLORS = {
  stage: "#050505",
  label: "#A1A1AA",
  url: "#E8B86D",
  edge: "rgba(255,255,255,0.08)",
} as const;

const SCENE_DURATIONS = { before: 135, after: 270, end: 90 } as const;
const WARP_FRAMES = 30;
const FADE_FRAMES = 20;

/**
 * Where each scene starts reading its capture (frames into the source mp4).
 * `after` starts at 0 because the ident's wordmark re-reveal sits in capture
 * frames ~0-60; the next pass would land past the end of the capture.
 */
const TRIM = { before: 45, after: 0 } as const;

export const HERO_BEFORE_AFTER_DURATION =
  SCENE_DURATIONS.before +
  SCENE_DURATIONS.after +
  SCENE_DURATIONS.end -
  WARP_FRAMES -
  FADE_FRAMES;

/**
 * Softer than the registry default (0.12 / blur 3): at full strength the whole
 * page card turns to mush and the filter's dark-area colour shift reads green.
 */
const CUT_BEFORE_TO_AFTER = transitionLiquidWarp({
  durationInFrames: WARP_FRAMES,
  scaleRatio: 0.05,
  blur: 1.5,
});
const CUT_AFTER_TO_END = transitionFade({
  durationInFrames: FADE_FRAMES,
  dipTo: COLORS.stage,
});

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const SOURCE_ASPECT = 1080 / 1920;

type CaptureProps = {
  src: string;
  trimBefore: number;
  label: string;
  durationInFrames: number;
};

/** One captured page, full width, with a quiet label above it. */
const CaptureScene: React.FC<CaptureProps> = ({
  src,
  trimBefore,
  label,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  const cardWidth = width - Math.round(width * 0.04);
  const cardHeight = Math.round(cardWidth * SOURCE_ASPECT);
  const labelSize = Math.round(width * 0.03);

  const push = interpolate(frame, [0, durationInFrames], [1, 1.04], clamp);
  const labelIn = interpolate(frame, [6, 22], [0, 1], clamp);
  const labelRise = interpolate(frame, [6, 22], [10, 0], clamp);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.stage,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: Math.round(labelSize * 1.2),
        }}
      >
        <div
          style={{
            fontFamily,
            fontWeight: 500,
            fontSize: labelSize,
            color: COLORS.label,
            letterSpacing: labelSize * 0.02,
            opacity: labelIn,
            transform: `translateY(${labelRise}px)`,
          }}
        >
          {label}
        </div>
        <div
          style={{
            width: cardWidth,
            height: cardHeight,
            borderRadius: Math.round(width * 0.014),
            overflow: "hidden",
            boxShadow: `0 0 0 1px ${COLORS.edge}`,
          }}
        >
          <OffthreadVideo
            muted
            src={staticFile(src)}
            trimBefore={trimBefore}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${push})`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const urlIn = interpolate(frame, [36, 54], [0, 1], clamp);
  const urlSize = Math.round(width * 0.034);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.stage }}>
      <RemotionUIMark backgroundColor={COLORS.stage} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: height / 2 + Math.round(width * 0.12),
          textAlign: "center",
          fontFamily,
          fontWeight: 500,
          fontSize: urlSize,
          color: COLORS.url,
          opacity: urlIn,
        }}
      >
        remotionui.com
      </div>
    </AbsoluteFill>
  );
};

export const HeroBeforeAfter: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.stage }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.before}>
        <CaptureScene
          src="showcases/hero-before-after/old.mp4"
          trimBefore={TRIM.before}
          label="Before"
          durationInFrames={SCENE_DURATIONS.before}
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...CUT_BEFORE_TO_AFTER} />
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.after}>
        <CaptureScene
          src="showcases/hero-before-after/new.mp4"
          trimBefore={TRIM.after}
          label="After"
          durationInFrames={SCENE_DURATIONS.after}
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...CUT_AFTER_TO_END} />
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.end}>
        <EndCard />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
