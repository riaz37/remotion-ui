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

export type CalendarEvent = {
  /** Day of the month, 1-based. */
  day: number;
  label: string;
  color?: string;
};

export type CalendarMonthFillProps = {
  /** Month name in the header. */
  month?: string;
  /** Year beside the month. */
  year?: string;
  /** Days in the month. */
  daysInMonth?: number;
  /** Weekday column the 1st falls in, 0 = Monday. */
  startWeekday?: number;
  /** Day given the highlighted ring. Pass -1 for none. */
  todayDay?: number;
  events?: CalendarEvent[];
  /** Weekday column headings. */
  weekdayLabels?: string[];
  /** Second the grid finishes fading up. */
  gridAtSeconds?: number;
  /** Second the first event lands. */
  eventsAtSeconds?: number;
  /** Seconds between events. */
  staggerSeconds?: number;
  /**
   * Seconds the filled month holds before it retreats. Omit to leave it up for
   * the rest of the scene.
   */
  holdSeconds?: number;
  accentColor?: string;
  backgroundColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

const DEFAULT_EVENTS: CalendarEvent[] = [
  { day: 4, label: "Kickoff", color: "#7DD3E8" },
  { day: 7, label: "Design review", color: "#C99BE8" },
  { day: 12, label: "Beta cut", color: "#E8B86D" },
  { day: 15, label: "Render day", color: "#9BD4A0" },
  { day: 19, label: "Launch", color: "#E89B9B" },
  { day: 23, label: "Retro", color: "#8FB8F0" },
  { day: 27, label: "Roadmap", color: "#7DD3E8" },
];

const DEFAULT_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Beat plan in seconds. Event times come from the props. */
const T = {
  card: 0,
  cardFor: 0.44,
  head: 0.12,
  headFor: 0.4,
  /** Cells fade up on a diagonal so the grid arrives as a sweep. */
  cellStagger: 0.018,
  exitFor: 0.42,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * A month that fills itself in: the empty grid sweeps up on a diagonal, then
 * events drop onto their days one at a time, each chip springing in under the
 * day number it belongs to.
 *
 * Cells are laid out from `startWeekday` and `daysInMonth` rather than from a
 * date library — a scene needs a month that looks right, not one that is
 * correct for a particular year, and this keeps the component free of both a
 * dependency and a timezone.
 */
export const CalendarMonthFill: React.FC<CalendarMonthFillProps> = ({
  month = "August",
  year = "2026",
  daysInMonth = 31,
  startWeekday = 5,
  todayDay = 15,
  events = DEFAULT_EVENTS,
  weekdayLabels = DEFAULT_WEEKDAYS,
  gridAtSeconds = 0.3,
  eventsAtSeconds = 0.95,
  staggerSeconds = 0.2,
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

  const cardIn = spring({
    frame: frame - at(T.card),
    fps,
    config: { damping: 18, stiffness: 130, mass: 0.85 },
  });
  const open = ease(T.card, T.card + T.cardFor, EASING.editorial);
  const headIn = ease(T.head, T.head + T.headFor);

  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(frame, [at(holdSeconds), at(holdSeconds + T.exitFor)], [0, 1], {
          easing: EASING.exit,
          ...clamp,
        });

  const cardW = Math.min(width - safe.paddingLeft - safe.paddingRight, 760 * u);
  const pad = 26 * u;
  const columns = weekdayLabels.length;
  const cellW = (cardW - pad * 2) / columns;
  const cellH = 56 * u;
  const rows = Math.ceil((daysInMonth + startWeekday) / columns);

  const eventFor = (day: number) => {
    const index = events.findIndex((event) => event.day === day);
    if (index < 0) return null;
    const eventAt = eventsAtSeconds + index * staggerSeconds;
    return {
      event: events[index],
      drop: spring({
        frame: frame - at(eventAt),
        fps,
        config: { damping: 16, stiffness: 170, mass: 0.6 },
      }),
      fade: ease(eventAt, eventAt + 0.3),
    };
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
          width: cardW,
          borderRadius: 20 * u,
          background: palette.window,
          border: `1px solid ${palette.border}`,
          boxShadow: `inset 0 1px 0 ${palette.highlight}, 0 ${24 * u}px ${
            60 * u
          }px ${palette.shadow}`,
          padding: pad,
          overflow: "hidden",
          clipPath: `inset(0 0 ${(1 - open) * 100}% 0 round ${20 * u}px)`,
          opacity: 1 - exit,
          transform: `translateY(${(1 - cardIn) * 22 * u + exit * 30 * u}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10 * u,
            marginBottom: 14 * u,
            opacity: headIn,
            transform: `translateY(${(1 - headIn) * 10 * u}px)`,
          }}
        >
          <span
            style={{
              color: palette.fg,
              fontSize: 28 * u,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            {month}
          </span>
          <span
            style={{
              color: palette.dim,
              fontSize: 17 * u,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {year}
          </span>
        </div>

        <div style={{ display: "flex" }}>
          {weekdayLabels.map((label) => (
            <div
              key={label}
              style={{
                width: cellW,
                paddingBottom: 8 * u,
                color: palette.faint,
                fontSize: 11.5 * u,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                opacity: headIn,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        <div
          style={{
            position: "relative",
            height: rows * cellH,
            borderTop: `1px solid ${palette.border}`,
          }}
        >
          {Array.from({ length: rows * columns }, (_, cellIndex) => {
            const day = cellIndex - startWeekday + 1;
            if (day < 1 || day > daysInMonth) return null;

            const row = Math.floor(cellIndex / columns);
            const column = cellIndex % columns;
            const cellAt = gridAtSeconds + (row + column) * T.cellStagger;
            const cellIn = ease(cellAt, cellAt + 0.3);
            const marked = eventFor(day);
            const isToday = day === todayDay;

            return (
              <div
                key={day}
                style={{
                  position: "absolute",
                  left: column * cellW,
                  top: row * cellH,
                  width: cellW,
                  height: cellH,
                  padding: `${7 * u}px ${5 * u}px 0 0`,
                  opacity: cellIn,
                }}
              >
                <div
                  style={{
                    width: 22 * u,
                    height: 22 * u,
                    borderRadius: 999,
                    display: "grid",
                    placeItems: "center",
                    background: isToday ? `${accentColor}22` : "transparent",
                    border: isToday ? `1px solid ${accentColor}88` : "1px solid transparent",
                    color: isToday ? accentColor : palette.dim,
                    fontSize: 13 * u,
                    fontWeight: isToday ? 700 : 500,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {day}
                </div>

                {marked && marked.fade > 0.01 ? (
                  <div
                    style={{
                      marginTop: 5 * u,
                      marginRight: 4 * u,
                      height: 20 * u,
                      borderRadius: 6 * u,
                      background: `${marked.event.color ?? accentColor}22`,
                      borderLeft: `2px solid ${marked.event.color ?? accentColor}`,
                      display: "flex",
                      alignItems: "center",
                      padding: `0 ${5 * u}px`,
                      color: palette.fg,
                      fontSize: 11 * u,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      opacity: marked.fade,
                      // Chips drop onto the day rather than fading in place, so
                      // a filling month reads as things being scheduled.
                      transform: `translateY(${(1 - marked.drop) * -10 * u}px)`,
                    }}
                  >
                    {marked.event.label}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
