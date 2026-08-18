import { loadFont } from "@remotion/google-fonts/Inter";
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";
import {
  getMediaObjectFitStyle,
  isVideoSource,
  type MediaFit,
} from "@/remotion/lib/media-utils";
import { WaveformLine } from "@/remotion/primitives/waveform-line";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

/** Share of a caption line's slot spent speaking; the rest is the breath after it. */
const SPEAK_SHARE = 0.84;

/** Seconds a caption line is held before the next one takes the zone. */
const LINE_SECONDS = 1.55;

/** How long the layout takes to leave once `holdSeconds` is reached. */
const EXIT_SECONDS = 0.4;

type TalkingHeadLayoutProps = {
  /** Speaker media — image or video. Falls back to a framed placeholder. */
  mediaSrc?: string;
  /** Voice track the waveform is drawn from. Omit to hide the waveform. */
  audioSrc?: string;
  fit?: MediaFit;
  /** Small label above the name, e.g. a role or a handle. */
  eyebrow?: string;
  /** Name plate headline — who is speaking, or what they are saying. */
  title?: string;
  /** Second plate line. */
  subtitle?: string;
  /**
   * Spoken lines. They play one at a time, word by word, in the zone reserved
   * under the frame. Omit and the zone collapses so the frame takes the height
   * instead of leaving a hole for captions that never arrive.
   */
  captions?: string[];
  accentColor?: string;
  /** Overrides the page background behind the frame. */
  backgroundColor?: string;
  theme?: "dark" | "light";
  /**
   * Seconds after which the whole layout leaves. Omit to hold — correct inside
   * a `TransitionSeries`, where the transition covers the tail, and wrong on
   * its own, where the scene stands still for the rest of the clip.
   */
  holdSeconds?: number;
  /** Animation speed multiplier. */
  speed?: number;
};

/** Stand-in for a missing speaker clip — a lit frame, not a wireframe box. */
const PlaceholderSpeaker: React.FC<{
  accentColor: string;
  width: number;
  dim: string;
}> = ({ accentColor, width, dim }) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      position: "relative",
      background: `radial-gradient(ellipse 70% 60% at 50% 34%, ${accentColor}26, transparent 70%), ${dim}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <svg
      width={scaleFont(260, width)}
      height={scaleFont(260, width)}
      viewBox="0 0 100 100"
      fill="none"
    >
      <circle cx="50" cy="36" r="17" fill={accentColor} fillOpacity={0.28} />
      <path
        d="M16 92c0-19 15-30 34-30s34 11 34 30"
        fill={accentColor}
        fillOpacity={0.28}
      />
    </svg>
  </div>
);

/**
 * The frame a speaking clip is cut into, staged as the cut itself: the frame
 * opens on the speaker, the name plate slides out from behind its edge and is
 * read, the spoken lines play through the reserved zone with the waveform
 * moving under them, then the plate retreats and leaves the frame clean.
 */
export const TalkingHeadLayout: React.FC<TalkingHeadLayoutProps> = ({
  mediaSrc,
  audioSrc,
  fit = "cover",
  eyebrow,
  title,
  subtitle,
  captions,
  accentColor = "#2DD4BF",
  backgroundColor,
  theme = "dark",
  holdSeconds,
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const palette = CODE_THEMES[theme];
  const page = backgroundColor ?? palette.page;
  const safeArea = getSafeAreaPadding({ width, height });
  const isPortrait = height > width;

  // `speed` divides inside the beat clock, matching every sibling scene's
  // `at(s) = s * fps / speed` idiom rather than scaling the frame itself.
  const seconds = (value: number) => (value * fps) / speed;
  const clamp = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };

  const lines = (captions ?? []).map((line) => line.trim()).filter(Boolean);
  const hasCaptions = lines.length > 0;
  const hasPlate = Boolean(eyebrow || title || subtitle);
  const hasWave = Boolean(audioSrc);

  // --- Zone budget --------------------------------------------------------
  const contentWidth = width - safeArea.paddingLeft - safeArea.paddingRight;
  const captionSize = scaleFont(isPortrait ? 46 : 40, width);
  const captionLineHeight = Math.round(captionSize * 1.28);
  const waveHeight = hasWave ? Math.round(scaleFont(58, width)) : 0;
  const zoneGap = scaleFont(20, width);
  // Only what is actually shown is reserved — an empty zone reads as a hole.
  const captionZone =
    (hasCaptions
      ? Math.round(captionLineHeight * (isPortrait ? 2 : 1.4)) + zoneGap
      : 0) + (hasWave ? waveHeight + zoneGap : 0);
  const frameHeight =
    height - safeArea.paddingTop - safeArea.paddingBottom - captionZone;
  // Capped so a wide composition gets a clip window rather than an ultrawide
  // letterbox slot no talking head would ever be framed in.
  const frameWidth = Math.min(contentWidth, Math.round((frameHeight * 16) / 9));
  const radius = scaleFont(26, width);

  // --- Delivery plan ------------------------------------------------------
  const openDur = seconds(0.66);
  const plateAt = seconds(0.46);
  const captionsAt = plateAt + seconds(0.62);
  const lineStep = seconds(LINE_SECONDS);
  const speechEnd = captionsAt + lines.length * lineStep;
  // The plate is read, then gets out of the way — a clean frame is what the
  // rest of the clip (platform UI, burnt-in captions) needs underneath.
  const plateOutAt = hasCaptions ? speechEnd - seconds(0.5) : plateAt + seconds(2.9);

  const open = interpolate(frame, [0, openDur], [0, 1], {
    easing: EASING.enter,
    ...clamp,
  });
  const plateIn = hasPlate
    ? spring({
        fps,
        frame: frame - plateAt,
        config: { damping: 19, stiffness: 130, mass: 0.8 },
      })
    : 0;
  const plateOut = hasPlate
    ? interpolate(frame, [plateOutAt, plateOutAt + seconds(0.4)], [0, 1], {
        easing: EASING.exit,
        ...clamp,
      })
    : 0;
  const plateShift = plateIn * (1 - plateOut);

  // The push keeps running under everything, so the frame never sits still.
  const push = interpolate(frame, [0, seconds(9)], [0, 0.05], clamp);
  const drift = (frame * speed) / fps;

  // --- Speech -------------------------------------------------------------
  const lineIndex = hasCaptions
    ? Math.min(
        lines.length - 1,
        Math.max(0, Math.floor((frame - captionsAt) / lineStep)),
      )
    : 0;
  const lineStart = captionsAt + lineIndex * lineStep;
  const linePhase = hasCaptions
    ? interpolate(frame, [lineStart, lineStart + lineStep], [0, 1], clamp)
    : 0;
  const words = hasCaptions ? lines[lineIndex].split(/\s+/).filter(Boolean) : [];
  const wordStep = (lineStep * SPEAK_SHARE) / Math.max(1, words.length);

  // Voice gate: full while the line is being spoken, dropping into the breath
  // between lines, so the waveform reads as reacting rather than decorating.
  const speaking =
    hasCaptions && frame >= captionsAt && frame < speechEnd
      ? interpolate(
          linePhase,
          [0, 0.06, SPEAK_SHARE, Math.min(1, SPEAK_SHARE + 0.12)],
          [0.3, 1, 1, 0.3],
          clamp,
        )
      : hasCaptions
        ? 0.3
        : 1;
  const waveIn = interpolate(
    frame,
    [openDur * 0.5, openDur * 0.5 + seconds(0.4)],
    [0, 1],
    { easing: EASING.enter, ...clamp },
  );
  const speechProgress = hasCaptions
    ? interpolate(frame, [captionsAt, speechEnd], [0, 1], clamp)
    : undefined;

  const plateWidthLimit = isPortrait ? "88%" : "62%";

  // Exits accelerate away; entrances decelerate in. Never ease-out an exit.
  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(
          frame,
          [seconds(holdSeconds), seconds(holdSeconds + EXIT_SECONDS)],
          [0, 1],
          { easing: EASING.exit, ...clamp },
        );
  // Applied to the contents, never to the root: fading the root would fade the
  // page background with it and leave the composition transparent.
  const leaving = {
    opacity: 1 - exit,
    translate: `0 ${exit * scaleFont(34, width)}px`,
  };

  return (
    <div
      style={{
        width,
        height,
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        background: page,
        color: palette.fg,
        fontFamily,
        paddingLeft: safeArea.paddingLeft,
        paddingRight: safeArea.paddingRight,
        paddingTop: safeArea.paddingTop,
        paddingBottom: safeArea.paddingBottom,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: `-${scaleFont(80, width)}px`,
          background: `radial-gradient(ellipse 60% 46% at ${28 + Math.sin(drift * 0.42) * 5}% ${24 + Math.cos(drift * 0.36) * 5}%, ${accentColor}24, transparent 68%)`,
          opacity: (0.4 + open * 0.6) * (1 - exit),
        }}
      />

      {/* The frame opens on the speaker like a shutter, rather than fading in. */}
      <div
        style={{
          position: "relative",
          width: frameWidth,
          height: frameHeight,
          minHeight: 0,
          borderRadius: radius,
          overflow: "hidden",
          border: `1px solid ${palette.border}`,
          boxShadow: `0 ${scaleFont(30, width)}px ${scaleFont(80, width)}px ${palette.shadow}`,
          clipPath: `inset(${(1 - open) * 50}% 0% ${(1 - open) * 50}% 0% round ${radius}px)`,
          ...leaving,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            scale: `${1.07 - open * 0.07 + push}`,
            transformOrigin: "center 42%",
          }}
        >
          {mediaSrc ? (
            isVideoSource(mediaSrc) ? (
              // `pauseWhenBuffering` holds on a slow source instead of
              // showing a stale frame. On `@remotion/media` it lives on the
              // fallback props, since that is the path that can stall — the
              // wrapping Sequence carries `premountFor` to have the stream
              // ready before the scene runs.
              <Video
                src={mediaSrc}
                muted
                loop
                fallbackOffthreadVideoProps={{ pauseWhenBuffering: true }}
                style={getMediaObjectFitStyle(fit)}
              />
            ) : (
              <Img src={mediaSrc} style={getMediaObjectFitStyle(fit)} />
            )
          ) : (
            <PlaceholderSpeaker
              accentColor={accentColor}
              width={width}
              dim={palette.window}
            />
          )}
        </div>

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.62), transparent 46%)",
            opacity: hasPlate ? 0.55 + plateShift * 0.45 : 0.5,
          }}
        />

        {/* Slides out from behind the frame's edge, and retreats the same way. */}
        {hasPlate ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              // With a caption zone below, the plate can sit at the frame's
              // foot. Without one, something else owns the lower frame —
              // burnt-in captions, platform UI — so it lifts clear of it.
              bottom: hasCaptions
                ? scaleFont(34, width)
                : Math.round(frameHeight * 0.17),
              maxWidth: plateWidthLimit,
              boxSizing: "border-box",
              padding: `${scaleFont(20, width)}px ${scaleFont(30, width)}px ${scaleFont(20, width)}px ${scaleFont(28, width)}px`,
              borderRadius: `0 ${scaleFont(16, width)}px ${scaleFont(16, width)}px 0`,
              background:
                theme === "dark"
                  ? "rgba(8,10,14,0.72)"
                  : "rgba(255,255,255,0.82)",
              backdropFilter: "blur(12px)",
              borderTop: `1px solid ${palette.border}`,
              borderRight: `1px solid ${palette.border}`,
              borderBottom: `1px solid ${palette.border}`,
              display: "flex",
              flexDirection: "column",
              gap: scaleFont(8, width),
              translate: `${interpolate(plateShift, [0, 1], [-108, 0])}%`,
            }}
          >
            {eyebrow ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: scaleFont(10, width),
                  color: accentColor,
                  fontSize: scaleFont(24, width),
                  fontWeight: 600,
                  letterSpacing: "0.11em",
                  textTransform: "uppercase",
                }}
              >
                <span
                  style={{
                    width: scaleFont(9, width),
                    height: scaleFont(9, width),
                    borderRadius: "50%",
                    background: accentColor,
                    opacity: 0.5 + 0.5 * Math.sin(drift * Math.PI * 1.5),
                  }}
                />
                {eyebrow}
              </div>
            ) : null}
            {title ? (
              <div
                style={{
                  fontSize: scaleFont(isPortrait ? 46 : 50, width),
                  lineHeight: 1.1,
                  letterSpacing: "-0.025em",
                  fontWeight: 700,
                  color: theme === "dark" ? "#F8FAFC" : palette.fg,
                }}
              >
                {title}
              </div>
            ) : null}
            {subtitle ? (
              <div
                style={{
                  fontSize: scaleFont(28, width),
                  lineHeight: 1.3,
                  color: palette.dim,
                }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {captionZone > 0 ? (
        <div
          style={{
            height: captionZone,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: zoneGap,
            paddingTop: zoneGap,
            ...leaving,
          }}
        >
          {hasCaptions ? (
            <div
              style={{
                flex: 1,
                width: frameWidth,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                fontSize: captionSize,
                lineHeight: `${captionLineHeight}px`,
                fontWeight: 600,
                letterSpacing: "-0.015em",
              }}
            >
              <div key={lineIndex}>
                {words.map((word, index) => {
                  // Words land at speaking pace, then the whole line clears
                  // before the next one takes the zone.
                  const at = lineStart + index * wordStep;
                  const inWord = interpolate(
                    frame,
                    [at, at + seconds(0.16)],
                    [0, 1],
                    { easing: EASING.enter, ...clamp },
                  );
                  const outLine = interpolate(
                    linePhase,
                    [SPEAK_SHARE + 0.06, 1],
                    [1, 0],
                    clamp,
                  );
                  const isLast = lineIndex === lines.length - 1;
                  const alive = isLast ? inWord : inWord * outLine;

                  return (
                    <span
                      key={`${word}-${index}`}
                      style={{
                        display: "inline-block",
                        marginRight: "0.28em",
                        opacity: alive,
                        translate: `0 ${(1 - inWord) * scaleFont(12, width)}px`,
                      }}
                    >
                      {word}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : null}

          {hasWave && audioSrc ? (
            <div
              style={{
                width: frameWidth,
                height: waveHeight,
                opacity: waveIn * (0.5 + speaking * 0.5),
                scale: `1 ${0.42 + speaking * 0.58}`,
                transformOrigin: "center center",
              }}
            >
              <WaveformLine
                src={audioSrc}
                width={frameWidth}
                height={waveHeight}
                strokeColor={accentColor}
                mutedStrokeColor={`${accentColor}33`}
                baselineColor={palette.border}
                showBaseline={false}
                progress={speechProgress}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export type { TalkingHeadLayoutProps };
