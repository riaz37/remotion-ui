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
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

export type QuizQuestionProps = {
  question?: string;
  /** Answer options in display order. Four is the readable maximum at 1080p. */
  options?: string[];
  /** Index of the right answer. */
  correctIndex?: number;
  /**
   * Index the scene picks before the reveal — the wrong-answer beat. Set it to
   * `correctIndex` for a scene where the pick is right, or -1 for no pick at
   * all.
   */
  pickedIndex?: number;
  /** Small line above the question. */
  eyebrow?: string;
  /** Second the first option arrives. */
  optionsAtSeconds?: number;
  /** Seconds between options. */
  staggerSeconds?: number;
  /** Second the pick lands. */
  pickAtSeconds?: number;
  /** Second the right answer is revealed. */
  revealAtSeconds?: number;
  /**
   * Seconds the resolved question holds before it retreats. Omit to leave it up
   * for the rest of the scene.
   */
  holdSeconds?: number;
  accentColor?: string;
  correctColor?: string;
  wrongColor?: string;
  backgroundColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

const DEFAULT_OPTIONS = [
  "It bundles a runtime you ship",
  "It copies the source into your repo",
  "It renders on our servers",
  "It needs a paid licence",
];

/** Beat plan in seconds. Option and reveal times come from the props. */
const T = {
  card: 0,
  cardFor: 0.46,
  question: 0.16,
  questionFor: 0.44,
  exitFor: 0.42,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/**
 * A question that resolves: options arrive one at a time, one is picked, and
 * then the right answer lights while everything else drops back — so the reveal
 * is a change of state on an established set rather than a new element.
 *
 * The pick and the reveal are separate beats. Collapsing them into one frame is
 * what makes quiz scenes unreadable: the eye needs to have settled on a choice
 * before it can register being told it was wrong.
 */
export const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question = "What does the RemotionUI CLI actually do?",
  options = DEFAULT_OPTIONS,
  correctIndex = 1,
  pickedIndex = 2,
  eyebrow = "Question 3 of 8",
  optionsAtSeconds = 0.55,
  staggerSeconds = 0.2,
  pickAtSeconds = 1.75,
  revealAtSeconds = 2.35,
  holdSeconds,
  accentColor = "#E8B86D",
  correctColor = "#7FD1A0",
  wrongColor = "#E89B9B",
  backgroundColor,
  theme = "dark",
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
  const u = portrait
    ? Math.min(width / 620, height / 1120)
    : Math.min(width / 1280, height / 720);

  const cardIn = spring({
    frame: frame - at(T.card),
    fps,
    config: { damping: 18, stiffness: 130, mass: 0.85 },
  });
  const open = ease(T.card, T.card + T.cardFor, EASING.editorial);
  const questionIn = ease(T.question, T.question + T.questionFor);

  const pick = ease(pickAtSeconds, pickAtSeconds + 0.26, EASING.editorial);
  const reveal = ease(revealAtSeconds, revealAtSeconds + 0.4, EASING.editorial);

  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(frame, [at(holdSeconds), at(holdSeconds + T.exitFor)], [0, 1], {
          easing: EASING.exit,
          ...clamp,
        });

  const cardW = Math.min(width - safe.paddingLeft - safe.paddingRight, 720 * u);
  const pad = 30 * u;

  return (
    <AbsoluteFill
      style={{
        background: backgroundColor ?? palette.page,
        fontFamily,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: `${safe.paddingTop}px ${safe.paddingRight}px`,
      }}
    >
      <div
        style={{
          width: cardW,
          borderRadius: 22 * u,
          background: palette.window,
          border: `1px solid ${palette.border}`,
          boxShadow: `inset 0 1px 0 ${palette.highlight}, 0 ${26 * u}px ${
            64 * u
          }px ${palette.shadow}`,
          padding: pad,
          overflow: "hidden",
          clipPath: `inset(0 0 ${(1 - open) * 100}% 0 round ${22 * u}px)`,
          opacity: 1 - exit,
          transform: `translateY(${(1 - cardIn) * 22 * u + exit * 30 * u}px)`,
        }}
      >
        {eyebrow ? (
          <div
            style={{
              color: accentColor,
              fontSize: 12.5 * u,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              opacity: questionIn,
            }}
          >
            {eyebrow}
          </div>
        ) : null}

        <div
          style={{
            marginTop: 10 * u,
            marginBottom: 22 * u,
            color: palette.fg,
            fontSize: 30 * u,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            opacity: questionIn,
            transform: `translateY(${(1 - questionIn) * 12 * u}px)`,
          }}
        >
          {question}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 * u }}>
          {options.map((option, index) => {
            const optionAt = optionsAtSeconds + index * staggerSeconds;
            const arrive = ease(optionAt, optionAt + 0.36);

            const isPicked = index === pickedIndex;
            const isCorrect = index === correctIndex;
            // Three states, resolved in order: picked, then right, then wrong.
            // A row can be picked and right at once, which is why correct wins.
            const picked = isPicked ? pick * (1 - reveal * (isCorrect ? 0 : 0.5)) : 0;
            const right = isCorrect ? reveal : 0;
            const wrong = isPicked && !isCorrect ? reveal : 0;

            const stateColor = right > 0.1 ? correctColor : wrong > 0.1 ? wrongColor : accentColor;
            const lit = Math.max(picked, right, wrong);
            // Everything not involved in the answer steps back on the reveal,
            // so the resolution reads as focus rather than as new colour.
            const dim = isCorrect || isPicked ? 0 : reveal * 0.55;

            return (
              <div
                key={option}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14 * u,
                  height: 54 * u,
                  padding: `0 ${16 * u}px`,
                  borderRadius: 12 * u,
                  background:
                    lit > 0.05 ? `${stateColor}${right > 0.1 ? "1E" : "14"}` : palette.band,
                  border: `1px solid ${
                    lit > 0.05 ? `${stateColor}${right > 0.1 ? "AA" : "66"}` : palette.border
                  }`,
                  opacity: arrive * (1 - dim),
                  transform: `translateY(${(1 - arrive) * 12 * u}px) scale(${
                    1 + right * 0.015
                  })`,
                }}
              >
                <span
                  style={{
                    width: 28 * u,
                    height: 28 * u,
                    flexShrink: 0,
                    borderRadius: 8 * u,
                    display: "grid",
                    placeItems: "center",
                    background: lit > 0.05 ? `${stateColor}2E` : palette.window,
                    border: `1px solid ${lit > 0.05 ? `${stateColor}88` : palette.border}`,
                    color: lit > 0.05 ? stateColor : palette.dim,
                    fontSize: 13.5 * u,
                    fontWeight: 700,
                  }}
                >
                  {LETTERS[index] ?? index + 1}
                </span>
                <span
                  style={{
                    color: lit > 0.05 ? palette.fg : palette.dim,
                    fontSize: 17 * u,
                    fontWeight: lit > 0.05 ? 600 : 500,
                  }}
                >
                  {option}
                </span>

                {right > 0.05 || wrong > 0.05 ? (
                  <svg
                    width={20 * u}
                    height={20 * u}
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ marginLeft: "auto", flexShrink: 0 }}
                  >
                    <path
                      d={
                        right > 0.05
                          ? "M5 12.5 L10 17.5 L19 7"
                          : "M7.5 7.5 L16.5 16.5 M16.5 7.5 L7.5 16.5"
                      }
                      stroke={right > 0.05 ? correctColor : wrongColor}
                      strokeWidth={2.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength={1}
                      strokeDasharray={1}
                      strokeDashoffset={1 - Math.max(right, wrong)}
                    />
                  </svg>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
