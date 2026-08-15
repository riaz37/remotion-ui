import { useId } from "react";
import type { CSSProperties } from "react";
import { Img, OffthreadVideo, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import {
  useEnterExit,
  type EnterExitOptions,
} from "@/remotion/lib/motion-primitive";

export type TextMaskMedia = "video" | "image" | "gradient";

export type TextMaskVideoProps = EnterExitOptions & {
  /** The letterforms the media is seen through. `\n` breaks a line. */
  text: string;
  /** Video or image source. Wrap local files in `staticFile()`. */
  src?: string;
  /** Defaults to `video` when `src` is set, `gradient` when it is not. */
  media?: TextMaskMedia;
  /** Fill used by `media="gradient"`. Any CSS background value. */
  gradient?: string;
  /** Stage the letters are laid out in. The clip is in these coordinates. */
  width?: number;
  height?: number;
  /** How far the media drifts behind the letters over a second, in px. */
  drift?: number;
  /** Extra scale the media creeps through. 0 holds it still. */
  zoom?: number;
  /** Which way the letters are uncovered. */
  reveal?: "left" | "right" | "up" | "down" | "none";
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
  letterSpacing?: number;
  lineHeight?: number;
  /** Frame offset into the video, in frames. */
  startFrom?: number;
  /**
   * CSS filter on the media layer. Footage that reads fine full-frame is
   * usually too dark once it is only visible inside letterforms.
   */
  mediaFilter?: string;
  style?: CSSProperties;
  className?: string;
};

const REVEAL_INSET: Record<
  Exclude<TextMaskVideoProps["reveal"] & string, "none">,
  (hidden: number) => string
> = {
  left: (hidden) => `inset(0 ${hidden}% 0 0)`,
  right: (hidden) => `inset(0 0 0 ${hidden}%)`,
  up: (hidden) => `inset(0 0 ${hidden}% 0)`,
  down: (hidden) => `inset(${hidden}% 0 0 0)`,
};

/**
 * Shows moving media through a word.
 *
 * The letters are an SVG `clipPath` applied to a real element, not a
 * `background-clip: text` trick, because `background-clip` cannot take a video
 * — it only takes a paint. Clipping the element means the same code path
 * carries a video, a still, or a gradient, and the media underneath is a normal
 * `<OffthreadVideo>` that trims and seeks like any other.
 *
 * The reveal is a second, nested clip. One element gets one `clip-path`, so the
 * wipe lives on a child of the letter-clipped layer rather than fighting it.
 *
 * `width`/`height` are the clip's coordinate space, so the type is positioned
 * without measuring anything — a measured layout renders differently on frame 0
 * of a headless render than it does on frame 1.
 */
export const TextMaskVideo: React.FC<TextMaskVideoProps> = ({
  text,
  src,
  media,
  gradient = "linear-gradient(115deg, #e8b86d 0%, #f472b6 42%, #2dd4bf 100%)",
  width: widthProp,
  height: heightProp,
  drift = 26,
  zoom = 0.12,
  reveal = "left",
  fontSize: fontSizeProp,
  fontFamily,
  fontWeight = 800,
  letterSpacing = 0,
  lineHeight = 0.98,
  startFrom,
  mediaFilter,
  style,
  className,
  ...motionProps
}) => {
  const frame = useCurrentFrame();
  const { width: videoWidth, fps } = useVideoConfig();
  const clipId = `mask-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  const kind: TextMaskMedia = media ?? (src ? "video" : "gradient");
  const fontSize = fontSizeProp ?? scaleFont(150, videoWidth);
  const lines = text.split(/\r?\n/);
  const width = widthProp ?? Math.round(fontSize * 6.2);
  const height = heightProp ?? Math.round(fontSize * lineHeight * lines.length * 1.25);

  const { motion, opacity, exitProgress } = useEnterExit(motionProps);
  // The wipe runs on the entrance and unwinds on the exit.
  const revealed = reveal === "none" ? 1 : motion * (1 - exitProgress);
  const hidden = Math.max(0, Math.min(100, (1 - revealed) * 100));

  // Both channels are sines, not ramps: a linear pan runs the media off its own
  // edge on a long shot, and a linear zoom has to stop somewhere — which is
  // exactly where the shot dies.
  const seconds = frame / fps;
  const pan = Math.sin(seconds * 0.62) * drift;
  const scale = 1 + zoom * (0.5 + 0.5 * Math.sin(seconds * 0.44 + 1.1));

  const cx = width / 2;
  const blockHeight = (lines.length - 1) * fontSize * lineHeight;
  const firstY = height / 2 - blockHeight / 2;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width,
        height,
        opacity,
        ...style,
      }}
    >
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            {lines.map((line, index) => (
              <text
                key={`${line}-${index}`}
                x={cx}
                y={firstY + index * fontSize * lineHeight}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={fontSize}
                fontWeight={fontWeight}
                letterSpacing={letterSpacing}
                {...(fontFamily ? { fontFamily } : {})}
              >
                {line}
              </text>
            ))}
          </clipPath>
        </defs>
      </svg>

      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: `url(#${clipId})`,
          WebkitClipPath: `url(#${clipId})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            ...(reveal === "none"
              ? null
              : {
                  clipPath: REVEAL_INSET[reveal](hidden),
                  WebkitClipPath: REVEAL_INSET[reveal](hidden),
                }),
          }}
        >
          <div
            style={{
              position: "absolute",
              // Overscanned so the drift never brings an edge into a letter.
              inset: "-8%",
              transform: `translateX(${(-pan).toFixed(2)}px) scale(${scale.toFixed(4)})`,
              transformOrigin: "center center",
              ...(mediaFilter ? { filter: mediaFilter } : null),
            }}
          >
            {kind === "video" && src ? (
              <OffthreadVideo
                src={src}
                startFrom={startFrom}
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : kind === "image" && src ? (
              <Img
                src={src}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", background: gradient }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
