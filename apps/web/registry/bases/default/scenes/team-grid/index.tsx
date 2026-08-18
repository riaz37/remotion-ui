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

export type TeamMember = {
  name: string;
  role: string;
  /** Avatar tint. Falls back to a colour picked from `avatarColors` by index. */
  color?: string;
  /**
   * Initials inside the avatar. Derived from the name when omitted, which is
   * right for most Latin names and wrong for enough others to be worth passing
   * by hand.
   */
  initials?: string;
};

export type TeamGridProps = {
  members?: TeamMember[];
  /** Heading above the grid. Omit to drop it. */
  title?: string;
  /** Line under the heading. */
  subtitle?: string;
  /** Members per row. */
  columns?: number;
  /** Second the first avatar arrives. */
  startAtSeconds?: number;
  /** Seconds between members. */
  staggerSeconds?: number;
  /**
   * Seconds the settled grid holds before it retreats. Omit to leave it up for
   * the rest of the scene.
   */
  holdSeconds?: number;
  accentColor?: string;
  avatarColors?: string[];
  backgroundColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

const DEFAULT_MEMBERS: TeamMember[] = [
  { name: "Ada Okonjo", role: "Founder" },
  { name: "Piotr Nowak", role: "Rendering" },
  { name: "Dai Nakamura", role: "Design systems" },
  { name: "Kit Alvarez", role: "Motion" },
  { name: "Runa Sørensen", role: "Docs" },
  { name: "Sam Rhodes", role: "Infrastructure" },
  { name: "Lea Fontaine", role: "Support" },
  { name: "Noor Haddad", role: "Growth" },
];

const DEFAULT_AVATAR_COLORS = [
  "#E8B86D",
  "#7DD3E8",
  "#C99BE8",
  "#9BD4A0",
  "#8FB8F0",
  "#E89B9B",
];

/** Beat plan in seconds. Member times come from the props. */
const T = {
  head: 0.1,
  headFor: 0.42,
  exitFor: 0.42,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const initialsOf = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

/**
 * A team grid that arrives person by person: the avatar springs up first, the
 * name and role follow it, and the ring around the avatar closes over the same
 * frames so each tile resolves as one object rather than three fades.
 *
 * The stagger runs in reading order rather than by row or column, which keeps a
 * grid of any width feeling like a list being read out instead of a wipe.
 */
export const TeamGrid: React.FC<TeamGridProps> = ({
  members = DEFAULT_MEMBERS,
  title = "The people behind it",
  subtitle = "Eight of us, four timezones.",
  columns = 4,
  startAtSeconds = 0.4,
  staggerSeconds = 0.2,
  holdSeconds,
  accentColor = "#E8B86D",
  avatarColors = DEFAULT_AVATAR_COLORS,
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

  const headIn = ease(T.head, T.head + T.headFor);

  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(frame, [at(holdSeconds), at(holdSeconds + T.exitFor)], [0, 1], {
          easing: EASING.exit,
          ...clamp,
        });

  const gridW = Math.min(width - safe.paddingLeft - safe.paddingRight, 880 * u);
  const gap = 18 * u;
  const tileW = (gridW - gap * (columns - 1)) / columns;
  const avatar = Math.min(72 * u, tileW * 0.52);

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
          width: gridW,
          opacity: 1 - exit,
          translate: `0 ${exit * 26 * u}px`,
        }}
      >
        {title ? (
          <div
            style={{
              marginBottom: subtitle ? 4 * u : 22 * u,
              color: palette.fg,
              fontSize: 30 * u,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              opacity: headIn,
              translate: `0 ${(1 - headIn) * 12 * u}px`,
            }}
          >
            {title}
          </div>
        ) : null}
        {subtitle ? (
          <div
            style={{
              marginBottom: 24 * u,
              color: palette.dim,
              fontSize: 16 * u,
              fontWeight: 500,
              opacity: interpolate(headIn, [0.3, 1], [0, 1], clamp),
            }}
          >
            {subtitle}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap,
          }}
        >
          {members.map((member, index) => {
            const memberAt = startAtSeconds + index * staggerSeconds;
            const rise = spring({
              frame: frame - at(memberAt),
              fps,
              config: { damping: 17, stiffness: 150, mass: 0.7 },
            });
            const fade = ease(memberAt, memberAt + 0.34);
            // Text trails the avatar it belongs to, so the tile lands as one
            // object with depth rather than as three elements agreeing to fade.
            const textIn = ease(memberAt + 0.12, memberAt + 0.5);
            const color = member.color ?? avatarColors[index % avatarColors.length];

            return (
              <div
                key={member.name}
                style={{
                  width: tileW,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  opacity: fade,
                  translate: `0 ${(1 - rise) * 20 * u}px`,
                }}
              >
                <div
                  style={{
                    width: avatar,
                    height: avatar,
                    borderRadius: 999,
                    display: "grid",
                    placeItems: "center",
                    background: `radial-gradient(120% 120% at 30% 20%, ${color}3D, ${color}14)`,
                    // The ring closes with the tile: at rest it is a full stroke,
                    // on arrival a thin one, which reads as the avatar settling
                    // into its own outline.
                    border: `${(1 + fade * 1.2) * u}px solid ${color}${
                      fade > 0.6 ? "AA" : "55"
                    }`,
                    color,
                    fontSize: avatar * 0.34,
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                    scale: `${0.86 + rise * 0.14}`,
                  }}
                >
                  {member.initials ?? initialsOf(member.name)}
                </div>
                <div
                  style={{
                    marginTop: 12 * u,
                    color: palette.fg,
                    fontSize: 16 * u,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    opacity: textIn,
                    translate: `0 ${(1 - textIn) * 6 * u}px`,
                  }}
                >
                  {member.name}
                </div>
                <div
                  style={{
                    marginTop: 3 * u,
                    color: index === 0 ? accentColor : palette.dim,
                    fontSize: 13.5 * u,
                    fontWeight: 500,
                    opacity: textIn,
                  }}
                >
                  {member.role}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
