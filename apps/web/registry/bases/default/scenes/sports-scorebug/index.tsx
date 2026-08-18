import { loadFont } from "@remotion/google-fonts/Inter";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { getSafeAreaPadding } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export type ScorebugTeam = {
  /** Three-letter broadcast abbreviation. */
  abbr: string;
  score: number;
  /** Team colour for the abbreviation chip. */
  color?: string;
  /** Marks the home side with a possession dot. */
  possession?: boolean;
};

export type ScoreChange = {
  /** Which side scores. */
  side: "home" | "away";
  /** Seconds into the scene. */
  atSeconds: number;
  /** Points added. */
  points: number;
};

export type SportsScorebugProps = {
  home: ScorebugTeam;
  away: ScorebugTeam;
  /** Period furniture — Q3, 2ND HALF, SET 2. */
  period?: string;
  /** Game clock at the top of the scene, in seconds. Counts down. */
  clockSeconds?: number;
  /** Scores that land mid-scene. Each one flashes its side and bumps the total. */
  changes?: ScoreChange[];
  /** Which edge the bug sits against. */
  align?: "left" | "center" | "right";
  accentColor?: string;
  theme?: "dark" | "light";
  /** Seconds the bug holds before it retreats. Omit to leave it up. */
  holdSeconds?: number;
  /**
   * Size multiplier for the bug itself. Broadcast furniture is deliberately
   * small against a live feed; a preview tile or a wide frame needs it larger
   * without every caller having to restate the type scale.
   */
  scale?: number;
  /** Animation speed multiplier. */
  speed?: number;
};

/** Beat plan in seconds. */
const T = {
  bug: 0,
  bugFor: 0.46,
  teams: 0.2,
  teamStagger: 0.08,
  clock: 0.38,
  /**
   * How long a scoring side stays lit after its points land. Long enough that
   * a still sampled a few frames either side of the basket still catches the
   * flash — a 0.9s window decayed to zero between samples and the signature
   * beat never appeared in a frame.
   */
  flashFor: 1.3,
  exitFor: 0.4,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const formatClock = (seconds: number) => {
  const whole = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(whole / 60);
  return `${minutes}:${String(whole % 60).padStart(2, "0")}`;
};

/**
 * Broadcast score furniture: the bug wipes in from its own edge, the clock runs
 * down live, and points landing mid-scene bump the total and flash that side
 * rather than silently swapping the number.
 */
export const SportsScorebug: React.FC<SportsScorebugProps> = ({
  home,
  away,
  period = "Q3",
  clockSeconds = 154,
  changes = [],
  align = "center",
  accentColor = "#E8B86D",
  theme = "dark",
  holdSeconds,
  scale = 1,
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const palette = CODE_THEMES[theme];
  const safe = getSafeAreaPadding({ width, height });

  const at = (seconds: number) => (seconds * fps) / speed;
  const ease = (from: number, to: number, easing = EASING.enter) =>
    interpolate(frame, [at(from), at(to)], [0, 1], { easing, ...clamp });

  const portrait = height > width;
  const u =
    (portrait
      ? Math.min(width / 620, height / 1120)
      : Math.min(width / 1280, height / 720)) * scale;

  const seconds = (frame / fps) * speed;
  const bug = spring({
    frame: frame - at(T.bug),
    fps,
    config: { damping: 18, stiffness: 140, mass: 0.8 },
  });
  const open = ease(T.bug, T.bug + T.bugFor, EASING.editorial);
  const clockIn = ease(T.clock, T.clock + 0.4);

  // Exits accelerate away; entrances decelerate in. Never ease-out an exit.
  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(frame, [at(holdSeconds), at(holdSeconds + T.exitFor)], [0, 1], {
          easing: EASING.exit,
          ...clamp,
        });

  const sideState = (side: "home" | "away", base: number) => {
    const landed = changes.filter((c) => c.side === side && seconds >= c.atSeconds);
    const score = landed.reduce((sum, c) => sum + c.points, base);
    const last = landed[landed.length - 1];
    // Lit for `flashFor` after the most recent points, then back to rest.
    const flash = last
      ? interpolate(
          seconds,
          [last.atSeconds, last.atSeconds + 0.16, last.atSeconds + T.flashFor],
          [0, 1, 0],
          clamp,
        )
      : 0;
    const bump = last
      ? spring({
          frame: frame - at(last.atSeconds),
          fps,
          config: { damping: 11, stiffness: 220, mass: 0.6 },
        })
      : 1;
    return { score, flash, bump: last ? bump : 1 };
  };

  const homeState = sideState("home", home.score);
  const awayState = sideState("away", away.score);
  const clockLeft = Math.max(0, clockSeconds - seconds);

  const justify =
    align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";

  const teamBlock = (
    team: ScorebugTeam,
    state: { score: number; flash: number; bump: number },
    index: number,
  ) => {
    const rowAt = T.teams + T.teamStagger * index;
    const rowIn = ease(rowAt, rowAt + 0.4);
    const color = team.color ?? accentColor;

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12 * u,
          opacity: rowIn,
          translate: `0 ${(1 - rowIn) * 10 * u}px`,
        }}
      >
        <div
          style={{
            width: 6 * u,
            height: 34 * u,
            borderRadius: 999,
            background: color,
            boxShadow: state.flash > 0 ? `0 0 ${16 * u}px ${color}` : undefined,
          }}
        />
        <span
          style={{
            color: palette.fg,
            fontSize: 24 * u,
            fontWeight: 600,
            letterSpacing: "0.06em",
          }}
        >
          {team.abbr}
        </span>
        {team.possession ? (
          <span
            style={{
              width: 8 * u,
              height: 8 * u,
              borderRadius: "50%",
              background: accentColor,
            }}
          />
        ) : null}
        <span
          style={{
            marginLeft: 4 * u,
            color: state.flash > 0.05 ? color : palette.fg,
            fontSize: 30 * u,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            minWidth: 48 * u,
            textAlign: "right",
            // The bump is the point landing, not a loop — it settles at 1.
            scale: 1 + state.flash * 0.12 * state.bump,
            textShadow: state.flash > 0 ? `0 0 ${20 * u}px ${color}80` : undefined,
          }}
        >
          {state.score}
        </span>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ pointerEvents: "none", fontFamily }}>
      <div
        style={{
          position: "absolute",
          left: safe.paddingLeft,
          right: safe.paddingRight,
          top: Math.max(safe.paddingTop, 52 * u),
          display: "flex",
          justifyContent: justify,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            width: "fit-content",
            borderRadius: 14 * u,
            background: `${palette.window}F2`,
            border: `1px solid ${palette.border}`,
            boxShadow: `inset 0 1px 0 ${palette.highlight}, 0 ${18 * u}px ${
              44 * u
            }px ${palette.shadow}`,
            overflow: "hidden",
            clipPath: `inset(0 ${(1 - open) * 100}% 0 0 round ${14 * u}px)`,
            opacity: 1 - exit,
            translate: `0 ${(1 - bug) * -18 * u + exit * -24 * u}px`,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8 * u,
              padding: `${14 * u}px ${20 * u}px`,
            }}
          >
            {teamBlock(away, awayState, 0)}
            {teamBlock(home, homeState, 1)}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 4 * u,
              padding: `0 ${22 * u}px`,
              background: palette.band,
              borderLeft: `1px solid ${palette.border}`,
              opacity: clockIn,
            }}
          >
            <span
              style={{
                color: accentColor,
                fontSize: 15 * u,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              {period}
            </span>
            <span
              style={{
                color: palette.fg,
                fontSize: 28 * u,
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.01em",
              }}
            >
              {formatClock(clockLeft)}
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
