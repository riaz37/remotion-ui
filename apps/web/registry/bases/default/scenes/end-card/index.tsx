import { loadFont } from "@remotion/google-fonts/Inter";
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { getSafeAreaPadding } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export type EndCardProps = {
  title: string;
  /** Line under the title. */
  subtitle?: string;
  /** Chip above the title. */
  eyebrow?: string;
  /** Button label. Omit to end on the title alone. */
  cta?: string;
  /** Address typed under the button. */
  url?: string;
  /** Handles or channels listed along the foot. */
  handles?: string[];
  logoSrc?: string;
  logoSize?: number;
  backgroundColor?: string;
  accentColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

/** Beat plan in seconds. */
const T = {
  logo: 0,
  eyebrow: 0.14,
  title: 0.26,
  subtitle: 0.6,
  /**
   * The button assembles and its label rises out of it — overlapping, not in
   * sequence. A label that waits for the pill to finish leaves a filled button
   * with nothing written in it, which is a bug to any viewer who lands on that
   * frame.
   */
  button: 0.78,
  buttonLabel: 0.84,
  /** Address types under the button. */
  url: 1.24,
  handles: 1.6,
  /** Attention pulse once everything is standing. */
  pulse: 2.05,
} as const;

/** Characters per second the address types at. */
const URL_CPS = 26;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * The outro built in the order a viewer acts on it: the title lands, the button
 * assembles and its label rises out of it, the address types underneath, the
 * channels list, and a single ring pulses off the button — rather than a stack
 * of text fading in together.
 */
export const EndCard: React.FC<EndCardProps> = ({
  title,
  subtitle,
  eyebrow,
  cta,
  url,
  handles,
  logoSrc,
  logoSize,
  backgroundColor,
  accentColor = "#E8B86D",
  theme = "dark",
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const palette = CODE_THEMES[theme];
  const safe = getSafeAreaPadding({ width, height });

  const now = (frame / fps) * speed;
  const at = (seconds: number) => (seconds * fps) / speed;
  const ease = (from: number, to: number, easing = EASING.enter) =>
    interpolate(frame, [at(from), at(to)], [0, 1], { easing, ...clamp });

  const stage = {
    w: width - safe.paddingLeft - safe.paddingRight,
    h: height - safe.paddingTop - safe.paddingBottom,
  };
  const portrait = height > width;
  const u = portrait
    ? Math.min(stage.w / 620, stage.h / 1120)
    : Math.min(stage.w / 1120, stage.h / 620);

  const logoIn = logoSrc ? ease(T.logo, T.logo + 0.5) : 0;
  const eyebrowIn = eyebrow ? ease(T.eyebrow, T.eyebrow + 0.45) : 0;
  const titleIn = ease(T.title, T.title + 0.55);
  const subtitleIn = subtitle ? ease(T.subtitle, T.subtitle + 0.5) : 0;
  const button = cta
    ? spring({
        frame: frame - at(T.button),
        fps,
        config: { damping: 15, stiffness: 160, mass: 0.7 },
      })
    : 0;
  const buttonLabel = cta ? ease(T.buttonLabel, T.buttonLabel + 0.4) : 0;
  const typed = url
    ? Math.floor(Math.max(now - T.url, 0) * URL_CPS)
    : 0;
  const urlDone = url ? typed >= url.length : false;
  const handlesIn = handles?.length ? ease(T.handles, T.handles + 0.5) : 0;
  const pulse = cta
    ? interpolate(frame, [at(T.pulse), at(T.pulse + 0.7)], [0, 1], clamp)
    : 0;

  return (
    <div
      style={{
        width,
        height,
        background: backgroundColor ?? palette.page,
        fontFamily,
        position: "relative",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 60% 46% at 50% 44%, ${accentColor}1F, transparent 72%)`,
        }}
      />

      <div
        style={{
          position: "relative",
          width: Math.min(stage.w, 860 * u),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16 * u,
          textAlign: "center",
        }}
      >
        {logoSrc ? (
          <Img
            src={logoSrc}
            style={{
              width: logoSize ?? 76 * u,
              height: logoSize ?? 76 * u,
              objectFit: "contain",
              opacity: logoIn,
              translate: `0 ${(1 - logoIn) * 12 * u}px`,
            }}
          />
        ) : null}

        {eyebrow ? (
          <div
            style={{
              color: accentColor,
              fontSize: 20 * u,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              opacity: eyebrowIn,
              translate: `0 ${(1 - eyebrowIn) * 10 * u}px`,
            }}
          >
            {eyebrow}
          </div>
        ) : null}

        {/* The title rises out of its own mask */}
        <div style={{ overflow: "hidden", paddingBottom: "0.04em" }}>
          <h2
            style={{
              margin: 0,
              color: palette.fg,
              fontSize: 68 * u,
              fontWeight: 700,
              lineHeight: 1.06,
              letterSpacing: "-0.03em",
              translate: `0 ${(1 - titleIn) * 100}%`,
            }}
          >
            {title}
          </h2>
        </div>

        {subtitle ? (
          <p
            style={{
              margin: 0,
              maxWidth: stage.w * 0.7,
              color: palette.dim,
              fontSize: 28 * u,
              lineHeight: 1.35,
              opacity: subtitleIn,
              translate: `0 ${(1 - subtitleIn) * 12 * u}px`,
            }}
          >
            {subtitle}
          </p>
        ) : null}

        {cta ? (
          <div style={{ position: "relative", marginTop: 10 * u }}>
            {/* Pulse leaves the button edge, so it reads as a prompt */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 999,
                border: `${2 * u}px solid ${accentColor}`,
                opacity: pulse > 0 && pulse < 1 ? (1 - pulse) * 0.8 : 0,
                scale: `${interpolate(pulse, [0, 1], [1, 1.28])}`,
              }}
            />
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 12 * u,
                padding: `${17 * u}px ${34 * u}px`,
                borderRadius: 999,
                background: accentColor,
                color: palette.page,
                fontSize: 27 * u,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                boxShadow: `0 ${14 * u}px ${40 * u}px ${accentColor}44`,
                // The label rises out of the pill from below it, so the
                // pill must clip vertically — which means a label long enough to
                // wrap would be cut mid-glyph. Keep it on one line and bounded
                // by the stage so a sentence degrades to an ellipsis, not to a
                // sliced word.
                maxWidth: stage.w,
                whiteSpace: "nowrap",
                opacity: Math.min(button, 1),
                scale: `${interpolate(
                  Math.min(button, 1),
                  [0, 1],
                  [0.9, 1],
                )}`,
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  display: "block",
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  // A short rise with its own fade: the label is legible while
                  // the pill is still assembling, so no frame catches a filled
                  // button with an empty middle.
                  opacity: buttonLabel,
                  translate: `0px ${(1 - buttonLabel) * 60}%`,
                }}
              >
                {cta}
              </span>
              <svg
                width={20 * u}
                height={20 * u}
                viewBox="0 0 24 24"
                fill="none"
                style={{ opacity: buttonLabel }}
              >
                <path
                  d="M5 12h13m0 0-5.4-5.4M18 12l-5.4 5.4"
                  stroke={palette.page}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        ) : null}

        {url ? (
          <div
            style={{
              marginTop: 4 * u,
              color: palette.dim,
              fontSize: 24 * u,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              opacity: typed > 0 ? 1 : 0,
            }}
          >
            {url.slice(0, typed)}
            {/* Caret holds while typing, then clears once the address is whole */}
            <span
              style={{
                display: "inline-block",
                width: 2 * u,
                height: 24 * u,
                marginLeft: 3 * u,
                background: accentColor,
                opacity: urlDone ? 0 : 1,
              }}
            />
          </div>
        ) : null}

        {handles?.length ? (
          <div
            style={{
              marginTop: 10 * u,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: `${8 * u}px ${20 * u}px`,
              color: palette.faint,
              fontSize: 21 * u,
              opacity: handlesIn,
              translate: `0 ${(1 - handlesIn) * 10 * u}px`,
            }}
          >
            {handles.map((handle) => (
              <span key={handle}>{handle}</span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};
