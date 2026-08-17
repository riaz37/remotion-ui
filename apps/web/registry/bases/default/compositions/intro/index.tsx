import {
  AbsoluteFill,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FadeOut } from "@/remotion/primitives/fade-out";
import { DELAY, EASING } from "@/remotion/lib/motion-tokens";
import { TitleCard } from "@/remotion/scenes/title-card";

const COLORS = {
  bg: "#080810",
  accent: "#e8b86d",
  subtitle: "#71717a",
} as const;

export type IntroProps = {
  title?: string;
  subtitle?: string;
  /** Chip above the headline — the chapter marker. */
  eyebrow?: string;
  /**
   * Second beat: what the chapter covers. The rail staggers in once the title
   * has stood up, so the window is two beats rather than one held card.
   */
  topics?: string[];
  backgroundColor?: string;
  accentColor?: string;
};

const DEFAULT_TOPICS = ["Install", "Compose", "Render"];

/**
 * Frame the rail starts arriving on, and the beat between its items. Timed so
 * the whole row is standing by the halfway mark — a rail caught mid-stagger
 * reads as one chip sitting off-centre rather than as a row.
 */
const RAIL_AT = 46;
const RAIL_STAGGER = 6;
const RAIL_FOR = 16;

/** Frames the closing fade takes, and the frame it starts on. */
const FADE_FOR = 30;
const FADE_AT = 120;

export const Intro: React.FC<IntroProps> = ({
  title = "Chapter open",
  subtitle = "Name the topic before the walkthrough begins",
  eyebrow = "Chapter 01",
  topics = DEFAULT_TOPICS,
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
}) => {
  const { fps, durationInFrames, width } = useVideoConfig();
  const premountFor = Math.round(fps * 0.5) + DELAY.short;
  const windowFrames = Number.isFinite(durationInFrames)
    ? durationInFrames
    : FADE_AT + FADE_FOR;

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        backgroundImage:
          "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(232,184,109,0.08), transparent)",
      }}
    >
      {/*
        One sequence, one fade. Mounting a second `<TitleCard>` from frame 120
        instead replays its entrance from frame 0 inside the fade — which is
        what made the subtitle disappear over the last second.
      */}
      <Sequence durationInFrames={windowFrames} premountFor={premountFor}>
        <FadeOut delayInFrames={FADE_AT} durationInFrames={FADE_FOR}>
          <AbsoluteFill>
            <TitleCard
              title={title}
              subtitle={subtitle}
              eyebrow={eyebrow}
              backgroundColor="transparent"
              accentColor={accentColor}
            />
            <TopicRail
              topics={topics}
              accentColor={accentColor}
              unit={width / 960}
            />
          </AbsoluteFill>
        </FadeOut>
      </Sequence>
    </AbsoluteFill>
  );
};

const TopicRail: React.FC<{
  topics: string[];
  accentColor: string;
  unit: number;
}> = ({ topics, accentColor, unit }) => {
  const frame = useCurrentFrame();

  if (topics.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 62 * unit,
        display: "flex",
        justifyContent: "center",
        gap: 14 * unit,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {topics.map((topic, index) => {
        const at = RAIL_AT + index * RAIL_STAGGER;
        const enter = interpolate(frame, [at, at + RAIL_FOR], [0, 1], {
          easing: EASING.enter,
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={topic}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10 * unit,
              padding: `${10 * unit}px ${20 * unit}px`,
              borderRadius: 999,
              border: "1px solid rgba(250,250,250,0.12)",
              background: "rgba(250,250,250,0.05)",
              opacity: enter,
              translate: `0 ${(1 - enter) * 18 * unit}px`,
            }}
          >
            <span
              style={{
                color: accentColor,
                fontSize: 18 * unit,
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span
              style={{
                color: "rgba(250,250,250,0.86)",
                fontSize: 24 * unit,
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              {topic}
            </span>
          </div>
        );
      })}
    </div>
  );
};
