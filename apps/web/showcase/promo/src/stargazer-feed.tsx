import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export type Stargazer = {
  /** 1-based position among all stargazers, oldest first. */
  rank: number;
  login: string;
  /** Pre-computed relative label ("3d ago") — never `Date.now()` at render time. */
  starredLabel: string;
  avatarSrc: string;
};

/**
 * 14 real, recent stargazers of github.com/riaz37/remotion-ui — avatars
 * downloaded once into `public/showcases/stargazer-avatars` so the render
 * never depends on GitHub being reachable. Ordered oldest of the batch first
 * (rank ascending) so the ticker's upward scroll reveals the newest arrival
 * last, from the bottom, the way a live feed would.
 */
export const STARGAZERS: Stargazer[] = [
  { rank: 37, login: "Golam-Robbanie-Sajib", starredLabel: "3w ago" },
  { rank: 38, login: "stefanofa", starredLabel: "2w ago" },
  { rank: 39, login: "walter201230", starredLabel: "2w ago" },
  { rank: 40, login: "mkappworks", starredLabel: "2w ago" },
  { rank: 41, login: "dat7410dat", starredLabel: "2w ago" },
  { rank: 42, login: "hdw1219", starredLabel: "2w ago" },
  { rank: 43, login: "LaoWangEatGua", starredLabel: "13d ago" },
  { rank: 44, login: "Arnon-hs", starredLabel: "12d ago" },
  { rank: 45, login: "vishsnivam", starredLabel: "10d ago" },
  { rank: 46, login: "nafiz51", starredLabel: "8d ago" },
  { rank: 47, login: "VectorWen", starredLabel: "7d ago" },
  { rank: 48, login: "sametakten-tr", starredLabel: "6d ago" },
  { rank: 49, login: "pedrogrande", starredLabel: "4d ago" },
  { rank: 50, login: "owehbeh", starredLabel: "today" },
].map((entry) => ({
  ...entry,
  avatarSrc: staticFile(`showcases/stargazer-avatars/${entry.login}.png`),
}));

export type StargazerFeedProps = {
  entries?: Stargazer[];
  accentColor: string;
  fg: string;
  dim: string;
  border: string;
  monoFamily: string;
  width: number;
  /** Frame the ticker starts scrolling on (scene-local frame). */
  startFrame: number;
  /** Frame the ticker finishes its pass (scene-local frame). */
  endFrame: number;
  /** Rows visible inside the clipped window at once. */
  visibleRows?: number;
};

/**
 * The "real humans" beat borrowed from remocn's stargazer list, re-skinned in
 * our own terminal register instead of copying their light, card-based look:
 * it reads as a second command in the same session — `$ tail -f
 * stargazers.log` — with the actual result scrolling past underneath, same
 * monospace/phosphor language as the `gh api` line above it.
 */
export const StargazerFeed: React.FC<StargazerFeedProps> = ({
  entries = STARGAZERS,
  accentColor,
  fg,
  dim,
  border,
  monoFamily,
  width,
  startFrame,
  endFrame,
  visibleRows = 4,
}) => {
  const frame = useCurrentFrame();

  const headerIn = interpolate(frame, [startFrame - 10, startFrame], [0, 1], clamp);
  const cursorOn = Math.floor(frame / 10) % 2 === 0;

  const rowHeight = scaleFont(46, width);
  const listHeight = rowHeight * visibleRows;
  const stackHeight = rowHeight * entries.length;

  // The whole stack rides from just under the visible window up past its top
  // edge — a continuous upward pass rather than discrete per-row entrances,
  // so it reads as a live tail of activity rather than a static roster.
  const scrollY = interpolate(
    frame,
    [startFrame, endFrame],
    [listHeight, -stackHeight],
    clamp,
  );

  return (
    <div style={{ flex: 1, minWidth: 0, maxWidth: scaleFont(560, width) }}>
      <div
        style={{
          fontFamily: monoFamily,
          fontSize: scaleFont(18, width),
          color: fg,
          opacity: headerIn,
          display: "flex",
          gap: scaleFont(10, width),
          whiteSpace: "pre",
          marginBottom: scaleFont(14, width),
        }}
      >
        <span style={{ color: accentColor }}>$</span>
        <span>tail -f stargazers.log</span>
        <span style={{ color: accentColor, opacity: cursorOn ? 1 : 0 }}>
          {"█"}
        </span>
      </div>

      <div
        style={{
          height: listHeight,
          overflow: "hidden",
          position: "relative",
          opacity: headerIn,
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
        }}
      >
        <div style={{ transform: `translateY(${scrollY}px)` }}>
          {entries.map((entry) => (
            <div
              key={entry.login}
              style={{
                height: rowHeight,
                display: "flex",
                alignItems: "center",
                gap: scaleFont(12, width),
              }}
            >
              <span
                style={{
                  fontFamily: monoFamily,
                  fontSize: scaleFont(14, width),
                  color: accentColor,
                  fontVariantNumeric: "tabular-nums",
                  width: scaleFont(34, width),
                  flexShrink: 0,
                }}
              >
                #{entry.rank}
              </span>
              <Img
                src={entry.avatarSrc}
                style={{
                  width: scaleFont(28, width),
                  height: scaleFont(28, width),
                  borderRadius: "50%",
                  border: `1px solid ${border}`,
                  flexShrink: 0,
                  objectFit: "cover",
                }}
              />
              <span
                style={{
                  fontFamily: monoFamily,
                  fontSize: scaleFont(17, width),
                  color: fg,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                @{entry.login}
              </span>
              <span
                style={{
                  fontFamily: monoFamily,
                  fontSize: scaleFont(14, width),
                  color: dim,
                  flexShrink: 0,
                }}
              >
                {entry.starredLabel}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
