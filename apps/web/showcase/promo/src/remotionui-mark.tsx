import { loadFont } from "@remotion/google-fonts/Inter";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { springBouncy, springSmooth } from "@/remotion/lib/springs";

const { fontFamily } = loadFont("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

/**
 * The real RemotionUI mark, redrawn from `apps/web/public/logo.svg` /
 * `apps/web/components/logo-mark.tsx` with concrete hex values swapped in for
 * the `--bay-*` CSS custom properties those source files read at runtime —
 * this renders standalone, outside the site's theme context. A rounded-square
 * plate carries an offset "terminal window" frame with a gold phosphor play
 * triangle inside; it is not a letter mark, so it is drawn as shapes rather
 * than piped through a stroke-drawing primitive built for line art.
 */
const MARK = {
  viewBox: "0 0 32 32",
  plate: "#2A2928",
  frame: "#ECECEC",
  window: "#050505",
} as const;

export type RemotionUIMarkProps = {
  wordmark?: string;
  accentColor?: string;
  backgroundColor?: string;
};

/** Frame each beat starts on on a 30fps timeline. */
const BEATS = {
  plate: 0,
  frame: 5,
  window: 12,
  triangle: 20,
  wordmark: 30,
} as const;

const DURATIONS = {
  plate: 18,
  frame: 14,
  window: 14,
  wordmark: 18,
} as const;

/** A shape that scales and fades in from its own centre, driven by a spring. */
const Reveal: React.FC<{
  progress: number;
  from?: number;
  children: React.ReactNode;
}> = ({ progress, from = 0.7, children }) => (
  <g
    style={{
      transformBox: "fill-box",
      transformOrigin: "center",
      transform: `scale(${from + (1 - from) * progress})`,
      opacity: progress,
    }}
  >
    {children}
  </g>
);

export const RemotionUIMark: React.FC<RemotionUIMarkProps> = ({
  wordmark = "RemotionUI",
  accentColor = "#E8B86D",
  backgroundColor = "#080810",
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });

  const springAt = (beat: number, duration: number, config = springSmooth) =>
    spring({ frame: frame - beat, fps, config, durationInFrames: duration });

  const plateIn = springAt(BEATS.plate, DURATIONS.plate);
  const frameIn = springAt(BEATS.frame, DURATIONS.frame);
  const windowIn = springAt(BEATS.window, DURATIONS.window);
  const triangleIn = springAt(BEATS.triangle, 16, springBouncy);
  const wordmarkIn = springAt(BEATS.wordmark, DURATIONS.wordmark);

  const iconSize = scaleFont(160, width);
  const gap = scaleFont(36, width);
  const fontSize = scaleFont(84, width);

  return (
    <div
      style={{
        width,
        height,
        backgroundColor,
        paddingLeft: safeArea.paddingLeft,
        paddingRight: safeArea.paddingRight,
        paddingTop: safeArea.paddingTop,
        paddingBottom: safeArea.paddingBottom,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: iconSize * 2.6,
          height: iconSize * 2.6,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}38, transparent 70%)`,
          filter: `blur(${scaleFont(36, width)}px)`,
          opacity: plateIn * 0.9,
          scale: 0.8 + plateIn * 0.35,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap,
        }}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox={MARK.viewBox}
          fill="none"
          style={{ flexShrink: 0 }}
        >
          <Reveal progress={plateIn}>
            <rect width={32} height={32} rx={6} fill={MARK.plate} />
          </Reveal>
          <g transform="translate(-1.5 -1)">
            <Reveal progress={frameIn}>
              <rect
                x={5}
                y={6}
                width={18}
                height={13}
                rx={3}
                stroke={MARK.frame}
                strokeWidth={1.25}
                fill="none"
                opacity={0.35}
              />
            </Reveal>
            <Reveal progress={windowIn}>
              <rect
                x={9}
                y={10}
                width={18}
                height={13}
                rx={3}
                fill={MARK.window}
                stroke={MARK.frame}
                strokeWidth={1.5}
                opacity={0.95}
              />
            </Reveal>
            <Reveal progress={triangleIn} from={0.4}>
              <path d="M15.5 14.5v5l4.5-2.5-4.5-2.5z" fill={accentColor} />
            </Reveal>
          </g>
        </svg>

        <div
          style={{
            color: "#F4F4F5",
            fontFamily,
            fontSize,
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: -0.5,
            opacity: wordmarkIn,
            translate: `${(1 - wordmarkIn) * -scaleFont(18, width)}px 0`,
          }}
        >
          {wordmark}
        </div>
      </div>
    </div>
  );
};
