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

export type KanbanCard = {
  title: string;
  /** Small line under the title — an issue key, an owner, an estimate. */
  meta?: string;
  /** Column the card starts in, as an index into `columns`. */
  column: number;
  /** Colour of the card's leading rail. Falls back to the accent. */
  tint?: string;
  /**
   * The one move this card makes. Omit for cards that stay put — a board where
   * everything moves reads as noise, not as work getting done.
   */
  moveTo?: number;
  /** Second the move starts. Required when `moveTo` is set. */
  moveAtSeconds?: number;
};

export type KanbanMoveProps = {
  columns?: string[];
  cards?: KanbanCard[];
  /** How long one card takes to cross from column to column. */
  moveSeconds?: number;
  /** Seconds between each card's arrival during the opening stagger. */
  dealStaggerSeconds?: number;
  /**
   * Seconds the settled board holds before it retreats. Omit to leave the board
   * up for the rest of the scene.
   */
  holdSeconds?: number;
  accentColor?: string;
  backgroundColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

const DEFAULT_COLUMNS = ["Backlog", "In progress", "Shipped"];

const DEFAULT_CARDS: KanbanCard[] = [
  { title: "Caption presets", meta: "RUI-218 · Ana", column: 0, tint: "#8FB8F0" },
  {
    title: "Render queue retries",
    meta: "RUI-204 · Piotr",
    column: 0,
    tint: "#E8B86D",
    moveTo: 1,
    moveAtSeconds: 0.95,
  },
  { title: "Waveform atom", meta: "RUI-231 · Dai", column: 0, tint: "#C99BE8" },
  {
    title: "Timeline scrubber",
    meta: "RUI-190 · Ana",
    column: 1,
    tint: "#7DD3E8",
    moveTo: 2,
    moveAtSeconds: 1.72,
  },
  { title: "Theme tokens", meta: "RUI-177 · Kit", column: 1, tint: "#9BD4A0" },
  { title: "Export presets", meta: "RUI-166 · Dai", column: 2, tint: "#9BD4A0" },
];

/** Beat plan in seconds. Card moves carry their own times. */
const T = {
  board: 0,
  boardFor: 0.5,
  /** Cards start dealing in while the board is still opening. */
  deal: 0.18,
  dealFor: 0.42,
  exitFor: 0.42,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * A board where work actually moves: a card lifts off its column, arcs across
 * the gutter under a shadow that grows with the lift, and drops into the end of
 * the next list while the cards it left behind close the gap.
 *
 * Slots are arithmetic, not layout. Every card's row is its starting order minus
 * the summed progress of the cards above it that have left, so the column closes
 * up over exactly the frames the card is travelling — no reflow, no snap, and
 * nothing that depends on measuring the DOM in a headless render.
 */
export const KanbanMove: React.FC<KanbanMoveProps> = ({
  columns = DEFAULT_COLUMNS,
  cards = DEFAULT_CARDS,
  moveSeconds = 0.62,
  dealStaggerSeconds = 0.08,
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

  const boardIn = spring({
    frame: frame - at(T.board),
    fps,
    config: { damping: 18, stiffness: 130, mass: 0.9 },
  });
  const open = ease(T.board, T.board + T.boardFor, EASING.editorial);

  // Exits accelerate away; entrances decelerate in.
  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(frame, [at(holdSeconds), at(holdSeconds + T.exitFor)], [0, 1], {
          easing: EASING.exit,
          ...clamp,
        });

  const boardW = Math.min(width - safe.paddingLeft - safe.paddingRight, 1000 * u);
  const gutter = 18 * u;
  const columnW = (boardW - gutter * (columns.length - 1)) / columns.length;
  const cardH = 74 * u;
  const cardGap = 10 * u;
  const headerH = 34 * u;
  const listH = cardH * 3 + cardGap * 2;

  /** How far through its move each card is, 0 while it still waits. */
  const progressOf = (card: KanbanCard) =>
    card.moveTo === undefined || card.moveAtSeconds === undefined
      ? 0
      : ease(card.moveAtSeconds, card.moveAtSeconds + moveSeconds, EASING.editorial);

  const startSlot = (card: KanbanCard, index: number) =>
    cards.filter(
      (other, otherIndex) => other.column === card.column && otherIndex < index,
    ).length;

  // A card lands at the bottom of the column as it stands at the moment it
  // arrives: everyone who started there, minus whoever has already left, plus
  // whoever arrived before it. Every term is static — the landing slot must not
  // depend on the current frame, or the card would chase a moving target.
  const landingSlot = (card: KanbanCard, index: number) => {
    const arrivesAt = card.moveAtSeconds ?? 0;
    const resident = cards.filter((other) => other.column === card.moveTo).length;
    const gone = cards.filter(
      (other) =>
        other.column === card.moveTo &&
        other.moveTo !== undefined &&
        (other.moveAtSeconds ?? 0) < arrivesAt,
    ).length;
    const earlier = cards.filter(
      (other, otherIndex) =>
        otherIndex !== index &&
        other.moveTo === card.moveTo &&
        (other.moveAtSeconds ?? 0) < arrivesAt,
    ).length;
    return resident - gone + earlier;
  };

  /**
   * Slots close up behind a departure. A card shifts one row for every card
   * above it that leaves the column *after* the card itself got there — a
   * departure that happened before it arrived is already priced into the
   * landing slot, and counting it twice would drop the card through the floor.
   */
  const closedUpBy = (
    column: number,
    ownSlot: number,
    presentFromSeconds: number,
    index: number,
  ) =>
    cards.reduce((sum, other, otherIndex) => {
      if (otherIndex === index) return sum;
      if (other.column !== column || other.moveTo === undefined) return sum;
      if ((other.moveAtSeconds ?? 0) < presentFromSeconds) return sum;
      if (startSlot(other, otherIndex) >= ownSlot) return sum;
      return sum + progressOf(other);
    }, 0);

  const columnX = (columnIndex: number) => columnIndex * (columnW + gutter);
  const slotY = (slot: number) => headerH + slot * (cardH + cardGap);

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
          position: "relative",
          width: boardW,
          height: headerH + listH,
          opacity: open * (1 - exit),
          transform: `translateY(${(1 - boardIn) * 22 * u + exit * 28 * u}px)`,
        }}
      >
        {columns.map((column, columnIndex) => {
          // Count follows the cards, not the clock: a card in flight is counted
          // by the column it is closest to.
          const settled = cards.filter((card, index) => {
            const progress = progressOf(card);
            const where = progress > 0.5 ? card.moveTo : card.column;
            return where === columnIndex && ease(
              T.deal + index * dealStaggerSeconds,
              T.deal + index * dealStaggerSeconds + T.dealFor,
            ) > 0.5;
          }).length;

          // The gutter a card is crossing right now lights its destination.
          const incoming = cards.reduce((peak, card) => {
            if (card.moveTo !== columnIndex) return peak;
            const progress = progressOf(card);
            return Math.max(peak, Math.min(1, progress * (1 - progress) * 4));
          }, 0);

          return (
            <div
              key={column}
              style={{
                position: "absolute",
                left: columnX(columnIndex),
                top: 0,
                width: columnW,
                height: headerH + listH,
                borderRadius: 14 * u,
                background: palette.band,
                border: `1px solid ${
                  incoming > 0.02
                    ? `${accentColor}${Math.round(40 + incoming * 120)
                        .toString(16)
                        .padStart(2, "0")}`
                    : palette.border
                }`,
                boxShadow: incoming > 0.02
                  ? `0 0 ${incoming * 26 * u}px ${accentColor}33`
                  : "none",
              }}
            >
              <div
                style={{
                  height: headerH,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: `0 ${12 * u}px`,
                }}
              >
                <span
                  style={{
                    color: palette.dim,
                    fontSize: 13 * u,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {column}
                </span>
                <span
                  style={{
                    color: palette.faint,
                    fontSize: 13 * u,
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {settled}
                </span>
              </div>
            </div>
          );
        })}

        {cards.map((card, index) => {
          const dealAt = T.deal + index * dealStaggerSeconds;
          const dealt = ease(dealAt, dealAt + T.dealFor);
          const progress = progressOf(card);

          // Cards above a departing card close the gap as it leaves.
          const home = startSlot(card, index);
          const fromSlot =
            home - closedUpBy(card.column, home, Number.NEGATIVE_INFINITY, index);
          const toSlot =
            card.moveTo === undefined
              ? fromSlot
              : landingSlot(card, index) -
                closedUpBy(
                  card.moveTo,
                  landingSlot(card, index),
                  card.moveAtSeconds ?? 0,
                  index,
                );

          const x = interpolate(
            progress,
            [0, 1],
            [columnX(card.column), columnX(card.moveTo ?? card.column)],
          );
          const y = interpolate(progress, [0, 1], [slotY(fromSlot), slotY(toSlot)]);

          // A single hump: highest, largest and most shadowed at the midpoint.
          const lift = Math.sin(Math.PI * progress);
          const tint = card.tint ?? accentColor;

          return (
            <div
              key={card.title}
              style={{
                position: "absolute",
                left: x + 8 * u,
                top: y - lift * 22 * u,
                width: columnW - 16 * u,
                height: cardH,
                // A card in flight crosses over the board, never under it.
                zIndex: lift > 0.01 ? 20 : 1,
                borderRadius: 11 * u,
                background: palette.window,
                border: `1px solid ${lift > 0.05 ? `${tint}66` : palette.border}`,
                boxShadow: `inset 0 1px 0 ${palette.highlight}, 0 ${
                  (4 + lift * 20) * u
                }px ${(10 + lift * 34) * u}px ${palette.shadow}`,
                opacity: dealt,
                transform: `scale(${(0.94 + dealt * 0.06) * (1 + lift * 0.05)}) rotate(${
                  lift * -1.6
                }deg)`,
                transformOrigin: "center",
                display: "flex",
                alignItems: "center",
                gap: 10 * u,
                padding: `0 ${12 * u}px`,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: 3 * u,
                  height: 40 * u,
                  borderRadius: 999,
                  background: tint,
                  opacity: 0.85,
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    color: palette.fg,
                    fontSize: 16 * u,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {card.title}
                </div>
                {card.meta ? (
                  <div
                    style={{
                      marginTop: 4 * u,
                      color: palette.dim,
                      fontSize: 12.5 * u,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {card.meta}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
