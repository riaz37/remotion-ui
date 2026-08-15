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

export type FaqItem = {
  question: string;
  answer: string;
};

export type FaqAccordionProps = {
  items?: FaqItem[];
  /** Heading above the list. Omit to drop it. */
  title?: string;
  /**
   * Indices opened in turn, in order. Each one closes the previous. Pass a
   * shorter list than `items` to leave the tail closed.
   */
  openOrder?: number[];
  /** Second the first row opens. */
  startAtSeconds?: number;
  /** Seconds between one row opening and the next. */
  openEverySeconds?: number;
  /** How long a row takes to open or close. */
  transitionSeconds?: number;
  /**
   * Seconds the list holds before it retreats. Omit to leave it up for the rest
   * of the scene.
   */
  holdSeconds?: number;
  accentColor?: string;
  backgroundColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

const DEFAULT_ITEMS: FaqItem[] = [
  {
    question: "Do I own the components?",
    answer:
      "Yes. The CLI copies the source into your repo, so every component is yours to edit and ships with no runtime dependency on us.",
  },
  {
    question: "Can I render on my own machine?",
    answer:
      "Renders run wherever Remotion runs — your laptop, your CI, or a container you control.",
  },
  {
    question: "What happens when a component updates?",
    answer:
      "Re-run the add command and the CLI shows a diff before writing anything over your local edits.",
  },
  {
    question: "Is there a licence for client work?",
    answer: "MIT. Use it for client projects, products, or anything you ship.",
  },
];

/** Beat plan in seconds. Open times come from the props. */
const T = {
  list: 0,
  listFor: 0.46,
  head: 0.14,
  headFor: 0.38,
  rowStagger: 0.07,
  exitFor: 0.42,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * Question rows that open one at a time: the answer's panel grows while the row
 * above it gives the height back, the chevron turns over the same frames, and
 * the copy fades in behind the growing edge rather than with it.
 *
 * Panel heights are estimated from the answer's own length against the measured
 * content width — a headless render has no layout to interrogate mid-animation,
 * so a wrap that depends on `scrollHeight` would collapse to zero on the frames
 * it matters. The estimate rounds up, which costs a few pixels of slack and buys
 * a height that is identical on every machine.
 */
export const FaqAccordion: React.FC<FaqAccordionProps> = ({
  items = DEFAULT_ITEMS,
  title = "Questions people ask",
  openOrder = [0, 1, 2],
  startAtSeconds = 0.55,
  openEverySeconds = 1,
  transitionSeconds = 0.55,
  holdSeconds,
  accentColor = "#E8B86D",
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

  const listIn = spring({
    frame: frame - at(T.list),
    fps,
    config: { damping: 18, stiffness: 130, mass: 0.85 },
  });
  const open = ease(T.list, T.list + T.listFor, EASING.editorial);
  const headIn = ease(T.head, T.head + T.headFor);

  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(frame, [at(holdSeconds), at(holdSeconds + T.exitFor)], [0, 1], {
          easing: EASING.exit,
          ...clamp,
        });

  const listW = Math.min(width - safe.paddingLeft - safe.paddingRight, 760 * u);
  const rowPadX = 20 * u;
  const questionH = 54 * u;
  const answerFontSize = 15 * u;
  const answerLineH = 22 * u;
  const contentW = listW - rowPadX * 2 - 34 * u;

  /**
   * How far row `index` is open, 0 to 1. A row opens on its turn and closes on
   * the next one's, so the two curves overlap and the list never jumps height.
   */
  const opennessOf = (index: number) => {
    const turn = openOrder.indexOf(index);
    if (turn < 0) return 0;
    const opensAt = startAtSeconds + turn * openEverySeconds;
    const opened = ease(opensAt, opensAt + transitionSeconds, EASING.editorial);
    const isLast = turn === openOrder.length - 1;
    if (isLast) return opened;
    const closesAt = startAtSeconds + (turn + 1) * openEverySeconds;
    const closed = ease(closesAt, closesAt + transitionSeconds, EASING.editorial);
    return opened - closed;
  };

  const answerHeight = (answer: string) => {
    // Inter runs about 0.52em average advance for lowercase prose.
    const charsPerLine = Math.max(12, Math.floor(contentW / (answerFontSize * 0.52)));
    const lines = Math.ceil(answer.length / charsPerLine);
    return lines * answerLineH + 16 * u;
  };

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
          width: listW,
          opacity: 1 - exit,
          transform: `translateY(${(1 - listIn) * 22 * u + exit * 28 * u}px)`,
        }}
      >
        {title ? (
          <div
            style={{
              marginBottom: 16 * u,
              color: palette.fg,
              fontSize: 28 * u,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              opacity: headIn,
              transform: `translateY(${(1 - headIn) * 10 * u}px)`,
            }}
          >
            {title}
          </div>
        ) : null}

        <div
          style={{
            borderRadius: 16 * u,
            background: palette.window,
            border: `1px solid ${palette.border}`,
            boxShadow: `inset 0 1px 0 ${palette.highlight}, 0 ${22 * u}px ${
              56 * u
            }px ${palette.shadow}`,
            overflow: "hidden",
            opacity: open,
          }}
        >
          {items.map((item, index) => {
            const rowAt = T.head + index * T.rowStagger;
            const rowIn = ease(rowAt, rowAt + 0.4);
            const openness = opennessOf(index);
            const panelH = answerHeight(item.answer) * openness;

            return (
              <div
                key={item.question}
                style={{
                  borderTop: index === 0 ? "none" : `1px solid ${palette.border}`,
                  background:
                    openness > 0.02 ? `${accentColor}0A` : "transparent",
                  opacity: rowIn,
                }}
              >
                <div
                  style={{
                    height: questionH,
                    display: "flex",
                    alignItems: "center",
                    gap: 14 * u,
                    padding: `0 ${rowPadX}px`,
                  }}
                >
                  <div
                    style={{
                      width: 20 * u,
                      height: 20 * u,
                      flexShrink: 0,
                      display: "grid",
                      placeItems: "center",
                      // A half turn, not a quarter: the chevron ends pointing at
                      // the panel it just opened.
                      transform: `rotate(${openness * 180}deg)`,
                    }}
                  >
                    <svg width={16 * u} height={16 * u} viewBox="0 0 24 24" fill="none">
                      <path
                        d="M6 9.5 L12 15.5 L18 9.5"
                        stroke={openness > 0.4 ? accentColor : palette.dim}
                        strokeWidth={2.4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span
                    style={{
                      color: openness > 0.4 ? palette.fg : palette.dim,
                      fontSize: 17.5 * u,
                      fontWeight: openness > 0.4 ? 600 : 500,
                      letterSpacing: "-0.01em",
                      transform: `translateX(${(1 - rowIn) * -10 * u}px)`,
                    }}
                  >
                    {item.question}
                  </span>
                </div>

                <div style={{ height: panelH, overflow: "hidden" }}>
                  <div
                    style={{
                      padding: `0 ${rowPadX}px 0 ${rowPadX + 34 * u}px`,
                      color: palette.dim,
                      fontSize: answerFontSize,
                      lineHeight: `${answerLineH}px`,
                      fontWeight: 500,
                      // The copy trails the edge that reveals it, so the panel
                      // reads as opening rather than as text stretching.
                      opacity: interpolate(openness, [0.35, 0.9], [0, 1], clamp),
                      transform: `translateY(${(1 - openness) * -8 * u}px)`,
                    }}
                  >
                    {item.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
