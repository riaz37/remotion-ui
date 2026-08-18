import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { SubtitleCue } from "@/remotion/lib/caption-utils";
import { EASING } from "@/remotion/lib/motion-tokens";

export type TranscriptScrollProps = {
  cues: SubtitleCue[];
  width?: number;
  height?: number;
  fontSize?: number;
  lineHeight?: number;
  /** Ink of the line being spoken. */
  activeColor?: string;
  /** Ink of everything else. */
  idleColor?: string;
  /** Ink of lines already read, when it should differ from `idleColor`. */
  readColor?: string;
  /** Speaker name printed above a line when it changes. */
  showSpeakers?: boolean;
  speakerColor?: string;
  /** Accent rule down the left edge of the active line. */
  showMarker?: boolean;
  markerColor?: string;
  /** Fade at the top and bottom edges, in px. `0` disables it. */
  fadeEdges?: number;
  /** Frames the scroll takes to settle on a new line. */
  settleInFrames?: number;
  /**
   * Optional frame override.
   * Pass a parent `frame` when using inside `<Sequence from={...}>`.
   */
  frame?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * A readable transcript that scrolls, with the spoken line marked.
 *
 * This is a document, not a caption overlay: the lines before and after stay on
 * screen, which is the whole point — the viewer can see where the quote sits in
 * the conversation. Use `srt-caption-track` or `karaoke-captions` when only the
 * current line should exist.
 *
 * The scroll is driven by a continuous position rather than by the active
 * index: interpolating between the outgoing and incoming line's offsets means
 * the page glides at cue speed instead of jumping a full line height whenever
 * the transcript advances.
 */
export const TranscriptScroll: React.FC<TranscriptScrollProps> = ({
  cues,
  width = 720,
  height = 420,
  fontSize = 34,
  lineHeight = 1.5,
  activeColor = "#fafafa",
  idleColor = "rgba(250,250,250,0.3)",
  readColor,
  showSpeakers = true,
  speakerColor = "#e8b86d",
  showMarker = true,
  markerColor = "#e8b86d",
  fadeEdges = 90,
  settleInFrames = 16,
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const { fps } = useVideoConfig();
  const timeMs = (frame / fps) * 1000;

  // Every line is measured, not just the active one: a speaker tag adds height,
  // so a fixed line pitch would drift out of register down a long transcript.
  const blocks = cues.map((cue, index) => {
    const previous = cues[index - 1];
    const withTag =
      showSpeakers && cue.speaker !== undefined && cue.speaker !== previous?.speaker;
    return {
      cue,
      withTag,
      height:
        fontSize * lineHeight * estimateLines(cue.text) +
        (withTag ? fontSize * 0.95 : 0) +
        fontSize * 0.6,
    };
  });

  const offsets: number[] = [];
  blocks.reduce((top, block) => {
    offsets.push(top);
    return top + block.height;
  }, 0);

  const activeIndex = Math.max(
    0,
    cues.reduce(
      (latest, cue, index) => (cue.startMs <= timeMs ? index : latest),
      0,
    ),
  );

  // Position glides from the previous line's offset toward the active one over
  // `settleInFrames`, so the page moves rather than cutting.
  const activeStartFrame = (cues[activeIndex].startMs / 1000) * fps;
  const settle = interpolate(
    frame,
    [activeStartFrame, activeStartFrame + settleInFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASING.editorial },
  );
  const previousOffset = offsets[Math.max(0, activeIndex - 1)];
  const targetOffset = offsets[activeIndex];
  const scroll =
    previousOffset + (targetOffset - previousOffset) * settle - height * 0.34;

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        overflow: "hidden",
        maskImage:
          fadeEdges > 0
            ? `linear-gradient(to bottom, transparent 0, #000 ${fadeEdges}px, #000 calc(100% - ${fadeEdges}px), transparent 100%)`
            : undefined,
        WebkitMaskImage:
          fadeEdges > 0
            ? `linear-gradient(to bottom, transparent 0, #000 ${fadeEdges}px, #000 calc(100% - ${fadeEdges}px), transparent 100%)`
            : undefined,
      }}
    >
      <div style={{ translate: `0 ${-scroll}px` }}>
        {blocks.map((block, index) => {
          const isActive = index === activeIndex;
          const isRead = index < activeIndex;
          const colour = isActive
            ? activeColor
            : isRead
              ? (readColor ?? idleColor)
              : idleColor;

          return (
            <div
              key={`${block.cue.startMs}-${index}`}
              style={{
                position: "relative",
                paddingLeft: fontSize * 0.9,
                paddingBottom: fontSize * 0.6,
              }}
            >
              {showMarker && isActive ? (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: block.withTag ? fontSize * 0.95 : 0,
                    width: fontSize * 0.12,
                    height: fontSize * lineHeight * estimateLines(block.cue.text),
                    borderRadius: fontSize * 0.1,
                    background: markerColor,
                    opacity: clamp01(settle * 1.6),
                  }}
                />
              ) : null}

              {block.withTag ? (
                <div
                  style={{
                    color: speakerColor,
                    fontSize: fontSize * 0.55,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: fontSize * 0.2,
                    opacity: isActive ? 1 : 0.5,
                  }}
                >
                  {block.cue.speaker}
                </div>
              ) : null}

              <div
                style={{
                  color: colour,
                  fontSize,
                  lineHeight,
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {block.cue.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Rough wrap estimate at the component's own measure.
 *
 * Real measurement would need layout, which is not available while the frame is
 * still being built. Over-estimating by a line is harmless — it only adds
 * spacing — while under-estimating would overlap two cues.
 */
function estimateLines(text: string): number {
  return Math.max(1, Math.ceil(text.length / 46));
}
