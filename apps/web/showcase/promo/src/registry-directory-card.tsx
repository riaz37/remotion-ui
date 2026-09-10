import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadMonoFont } from "@remotion/google-fonts/JetBrainsMono";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { PathDraw } from "@/remotion/primitives/path-draw";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { getSafeAreaPadding } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});
const { fontFamily: monoFamily } = loadMonoFont("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});

/** GitHub octicon "star-fill" (16x16) — see end-card for why the numbers are
 * fully spaced out (an `@remotion/paths` arc-parsing quirk). */
const STAR_PATH =
  "M 8 0.25 a 0.75 0.75 0 0 1 0.673 0.418 l 1.882 3.815 4.21 0.612 a 0.75 0.75 0 0 1 0.416 1.279 l -3.046 2.97 0.719 4.192 a 0.75 0.75 0 0 1 -1.088 0.791 L 8 12.347 l -3.766 1.98 a 0.75 0.75 0 0 1 -1.088 -0.79 l 0.72 -4.194 L 0.818 6.374 a 0.75 0.75 0 0 1 0.416 -1.28 l 4.21 -0.611 L 7.327 0.668 A 0.75 0.75 0 0 1 8 0.25 z";

const SearchGlyph: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="10.6" cy="10.6" r="6.4" stroke={color} strokeWidth={2} />
    <path
      d="M15.4 15.4L20 20"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </svg>
);

const CloseGlyph: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M6 6l12 12M18 6L6 18"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </svg>
);

const PlusGlyph: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 5v14M5 12h14"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
    />
  </svg>
);

const ChatGlyph: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M4 5.5h16v10H10l-4 3.5v-3.5H4v-10Z"
      stroke={color}
      strokeWidth={1.6}
      strokeLinejoin="round"
    />
  </svg>
);

const ThemeToggleGlyph: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="8" stroke={color} strokeWidth={1.6} />
    <path
      d="M12 4a8 8 0 0 0 0 16Z"
      fill={color}
    />
  </svg>
);

const GithubGlyph: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M8 .3a7.7 7.7 0 0 0-2.43 15c.38.08.53-.16.53-.37v-1.3c-2.17.48-2.63-1.04-2.63-1.04-.35-.9-.87-1.14-.87-1.14-.71-.5.05-.48.05-.48.79.06 1.2.82 1.2.82.7 1.2 1.83.85 2.28.65.07-.51.27-.85.5-1.05-1.73-.2-3.55-.87-3.55-3.87 0-.86.3-1.55.8-2.1-.08-.2-.35-1 .08-2.1 0 0 .66-.21 2.17.8a7.4 7.4 0 0 1 3.95 0c1.5-1.01 2.16-.8 2.16-.8.43 1.1.16 1.9.08 2.1.5.55.8 1.24.8 2.1 0 3-1.83 3.67-3.57 3.86.28.25.53.72.53 1.46v2.16c0 .21.14.46.54.37A7.7 7.7 0 0 0 8 .3Z"
      fill={color}
    />
  </svg>
);

const ExternalLinkGlyph: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M6.5 3H3.5A1.5 1.5 0 0 0 2 4.5v8A1.5 1.5 0 0 0 3.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-3M9.5 2H14v4.5M14 2 7 9"
      stroke={color}
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronDownGlyph: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M4 6l4 4 4-4"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const StackGlyph: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M8 1.5 1.5 5 8 8.5 14.5 5 8 1.5Z"
      stroke={color}
      strokeWidth={1.3}
      strokeLinejoin="round"
    />
    <path
      d="M1.5 8 8 11.5 14.5 8M1.5 11 8 14.5 14.5 11"
      stroke={color}
      strokeWidth={1.3}
      strokeLinejoin="round"
    />
  </svg>
);

/** shadcn's slash-in-square wordmark glyph, at listing-inline size. */
const ShadcnGlyph: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect
      x={0.75}
      y={0.75}
      width={14.5}
      height={14.5}
      rx={3}
      stroke={color}
      strokeWidth={1.2}
    />
    <path d="M10.5 4.5 5.5 11.5" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
  </svg>
);

/**
 * A small static redraw of the RemotionUI mark — a rounded plate with an
 * offset terminal-window frame and a phosphor play triangle — sized as a
 * listing icon rather than the full standalone lockup `remotionui-mark.tsx`
 * draws (that component owns the whole frame and its own entrance beats).
 */
const ListingMark: React.FC<{ size: number; accentColor: string }> = ({
  size,
  accentColor,
}) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect width={32} height={32} rx={7} fill="#2A2928" />
    <g transform="translate(-1.5 -1)">
      <rect
        x={9}
        y={10}
        width={18}
        height={13}
        rx={3}
        fill="#050505"
        stroke="#ECECEC"
        strokeWidth={1.5}
        opacity={0.95}
      />
      <path d="M15.5 14.5v5l4.5-2.5-4.5-2.5z" fill={accentColor} />
    </g>
  </svg>
);

export type RegistryDirectoryCardProps = {
  /** Query typed into the directory search field. */
  query?: string;
  /** Site wordmark, split at the first dot for the muted/bold styling —
   * `registry.directory` renders as muted "registry" + bold ".directory". */
  site?: string;
  /** Placeholder before typing starts. */
  placeholder?: string;
  name?: string;
  tagline?: string;
  sourceLabel?: string;
  stars?: number;
  items?: number;
  accentColor?: string;
  backgroundColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

/** Beat plan in seconds — mirrors `search-results-populate`'s field/bar
 * language, but resolves into one listing card instead of a ranked list. */
const T = {
  card: 0,
  cardFor: 0.42,
  chrome: 0.22,
  field: 0.12,
  filter: 0.34,
  beforeResult: 0.08,
  resultFor: 0.5,
  stats: 0.24,
  desc: 0.36,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * `registry.directory` recreated as a UI mockup (not a screen recording): the
 * site chrome (header icons, wordmark, subtitle, filter row) settles in,
 * a query types into the search field, an indeterminate bar runs, and the one
 * result that matters — the RemotionUI listing itself — grows in underneath
 * with its real stats. Custom to this clip: nobody installs "a
 * registry.directory search result" as a reusable scene, but the chrome
 * (search field, indeterminate bar, card-open reveal) deliberately reuses the
 * same beats as the registry's own `search-results-populate` scene so the cut
 * from the terminal into this feels like the same visual language, not a
 * fourth new idiom.
 *
 * Pixel-matched against a reference screenshot of the live site rather than
 * screen-recorded — reusing another product's live UI as raw footage is a
 * trust/legal edge case a recreation avoids. The real site is monochrome
 * (grayscale on black, no brand color anywhere in its own chrome), so this
 * mockup stays monochrome too and reserves `accentColor` for the one thing
 * that is genuinely ours: the RemotionUI mark's play triangle and the type
 * caret.
 */
export const RegistryDirectoryCard: React.FC<RegistryDirectoryCardProps> = ({
  query = "@remotionui",
  site = "registry.directory",
  placeholder = "Search the shadcn registry",
  name = "RemotionUI",
  tagline = "200 copy-paste Remotion components — primitives, transitions, and full video…",
  sourceLabel = "items",
  stars = 52,
  items = 224,
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

  const charsPerSecond = 26;
  const typeFor = Math.max(0.2, query.length / charsPerSecond);
  const typedEnd = T.field + 0.4 + typeFor;
  const searchSeconds = 0.24;
  const searchEnd = typedEnd + searchSeconds;
  const resultAt = searchEnd + T.beforeResult;
  const statsAt = resultAt + T.stats;
  const descAt = resultAt + T.desc;

  const typed = ease(T.field + 0.4, typedEnd, EASING.editorial);
  const shown = query.slice(0, Math.round(typed * query.length));
  const searching =
    ease(typedEnd, typedEnd + 0.1) * (1 - ease(searchEnd, searchEnd + 0.12));
  const caretOn = Math.floor(frame / (fps * 0.45)) % 2 === 0;
  const typingNow =
    frame >= at(T.field + 0.3) && frame < at(typedEnd + 0.1);

  const chromeIn = ease(0, T.chrome, EASING.editorial);
  const fieldIn = ease(T.field, T.field + 0.4);
  const filterIn = ease(T.filter, T.filter + 0.3);

  const card = spring({
    frame: frame - at(T.card),
    fps,
    config: { damping: 18, stiffness: 130, mass: 0.85 },
  });
  const open = ease(T.card, T.card + T.cardFor, EASING.editorial);

  const result = ease(resultAt, resultAt + T.resultFor, EASING.editorial);
  const markIn = spring({
    frame: frame - at(resultAt),
    fps,
    config: { damping: 16, stiffness: 170, mass: 0.8 },
  });
  const starIn = ease(statsAt, statsAt + 0.32);
  const descIn = ease(descAt, descAt + 0.3);

  const displayStars = Math.round(Math.min(1, Math.max(0, starIn)) * stars);
  const displayItems = Math.round(Math.min(1, Math.max(0, starIn)) * items);

  const portrait = height > width;
  const u = portrait
    ? Math.min(width / 496, height / 900)
    : Math.min(width / 1024, height / 576);

  const cardW = Math.min(width - safe.paddingLeft - safe.paddingRight, 800 * u);
  void card;

  const siteParts = site.split(".");
  const siteHead = siteParts[0] ?? site;
  const siteTail = siteParts.length > 1 ? `.${siteParts.slice(1).join(".")}` : "";

  return (
    <AbsoluteFill
      style={{
        background: backgroundColor ?? "#000000",
        fontFamily,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: `${safe.paddingTop}px ${safe.paddingRight}px`,
      }}
    >
      {/* header row — top-right chrome icons */}
      <div
        style={{
          position: "absolute",
          top: safe.paddingTop * 0.55,
          right: safe.paddingRight,
          display: "flex",
          alignItems: "center",
          gap: 22 * u,
          opacity: chromeIn,
        }}
      >
        <PlusGlyph size={17 * u} color={palette.faint} />
        <ChatGlyph size={17 * u} color={palette.faint} />
        <ThemeToggleGlyph size={17 * u} color={palette.dim} />
      </div>

      <div
        style={{
          width: cardW,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10 * u,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10 * u,
            opacity: chromeIn,
          }}
        >
          <span
            style={{
              fontFamily: monoFamily,
              fontSize: 30 * u,
              fontWeight: 700,
              color: palette.dim,
              letterSpacing: "-0.01em",
            }}
          >
            {siteHead}
            <span style={{ color: palette.fg }}>{siteTail}</span>
          </span>
          <span
            style={{
              padding: `${3 * u}px ${9 * u}px`,
              borderRadius: 999,
              border: `1px solid ${palette.border}`,
              color: palette.faint,
              fontSize: 11 * u,
              fontWeight: 600,
              letterSpacing: "0.06em",
              fontFamily: monoFamily,
            }}
          >
            BETA
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6 * u,
            color: palette.dim,
            fontFamily: monoFamily,
            fontSize: 16 * u,
            opacity: chromeIn,
            marginBottom: 18 * u,
          }}
        >
          <span>The explorer for the</span>
          <ShadcnGlyph size={14 * u} color={palette.fg} />
          <span style={{ color: palette.fg, fontWeight: 700 }}>shadcn</span>
          <span>registry ecosystem.</span>
        </div>

        <div
          style={{
            position: "relative",
            width: "100%",
            height: 56 * u,
            display: "flex",
            alignItems: "center",
            gap: 12 * u,
            padding: `0 ${18 * u}px`,
            borderRadius: 13 * u,
            background: "#0A0A0A",
            border: `1px solid ${palette.border}`,
            overflow: "hidden",
            opacity: fieldIn,
            translate: `0 ${(1 - fieldIn) * 10 * u}px`,
          }}
        >
          <SearchGlyph size={19 * u} color={palette.faint} />
          <span
            style={{
              flex: 1,
              color: shown.length > 0 ? palette.fg : palette.faint,
              fontSize: 18 * u,
              fontWeight: 500,
              whiteSpace: "nowrap",
              fontFamily: monoFamily,
            }}
          >
            {shown.length > 0 ? shown : placeholder}
          </span>
          <span
            style={{
              width: 2 * u,
              height: 20 * u,
              background: accentColor,
              opacity: typingNow && caretOn ? 1 : 0,
            }}
          />
          {shown.length > 0 && (
            <CloseGlyph size={16 * u} color={palette.faint} />
          )}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 2 * u,
              opacity: searching,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "38%",
                height: "100%",
                background: accentColor,
                translate: `${interpolate(
                  (frame / (fps * 0.62)) % 1,
                  [0, 1],
                  [-100, 264],
                )}%`,
              }}
            />
          </div>
        </div>

        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 20 * u,
            marginTop: 14 * u,
            opacity: filterIn,
          }}
        >
          <span
            style={{
              fontSize: 15 * u,
              fontWeight: 600,
              color: palette.fg,
              fontFamily: monoFamily,
              paddingBottom: 6 * u,
              borderBottom: `2px solid ${palette.fg}`,
            }}
          >
            Popular
          </span>
          <span
            style={{
              fontSize: 15 * u,
              color: palette.dim,
              fontFamily: monoFamily,
            }}
          >
            Stars
          </span>
          <span
            style={{
              fontSize: 15 * u,
              color: palette.dim,
              fontFamily: monoFamily,
            }}
          >
            Recently active
          </span>
          <span
            style={{
              width: 1,
              height: 16 * u,
              background: palette.border,
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8 * u,
            }}
          >
            <span
              style={{
                width: 14 * u,
                height: 14 * u,
                borderRadius: 3 * u,
                border: `1px solid ${palette.border}`,
              }}
            />
            <span
              style={{
                fontSize: 15 * u,
                color: palette.dim,
                fontFamily: monoFamily,
              }}
            >
              Premium only
            </span>
          </div>
          <div style={{ flex: 1 }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8 * u,
              padding: `${6 * u}px ${12 * u}px`,
              borderRadius: 8 * u,
              border: `1px solid ${palette.border}`,
              color: palette.dim,
              fontSize: 14 * u,
              fontFamily: monoFamily,
            }}
          >
            <StackGlyph size={14 * u} color={palette.dim} />
            <span>All types</span>
            <ChevronDownGlyph size={13 * u} color={palette.faint} />
          </div>
        </div>

        <div
          style={{
            width: "100%",
            marginTop: 18 * u,
            borderRadius: 16 * u,
            background: "#0A0A0A",
            border: `1px solid ${palette.border}`,
            padding: `${20 * u}px ${22 * u}px`,
            clipPath: `inset(0 0 ${(1 - open) * 100}% 0 round ${16 * u}px)`,
            opacity: result,
            translate: `0 ${(1 - result) * 22 * u}px`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12 * u,
                opacity: markIn,
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  scale: `${interpolate(markIn, [0, 1], [0.7, 1])}`,
                }}
              >
                <ListingMark size={40 * u} accentColor={accentColor} />
              </div>
              <span
                style={{
                  color: palette.fg,
                  fontSize: 20 * u,
                  fontWeight: 700,
                }}
              >
                {name}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12 * u,
                opacity: markIn,
              }}
            >
              <GithubGlyph size={15 * u} color={palette.faint} />
              <ExternalLinkGlyph size={15 * u} color={palette.faint} />
            </div>
          </div>

          <div
            style={{
              marginTop: 12 * u,
              color: palette.dim,
              fontSize: 14.5 * u,
              lineHeight: 1.45,
              opacity: descIn,
              translate: `0 ${(1 - descIn) * 6 * u}px`,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {tagline}
          </div>

          <div
            style={{
              marginTop: 12 * u,
              display: "flex",
              alignItems: "center",
              gap: 8 * u,
              opacity: starIn,
              translate: `0 ${(1 - starIn) * 8 * u}px`,
            }}
          >
            <PathDraw
              d={STAR_PATH}
              viewBox="0 0 16 16"
              width={14 * u}
              height={14 * u}
              stroke={accentColor}
              strokeWidth={0.9}
              fill={accentColor}
              delayInFrames={statsAt * fps}
              durationInFrames={0.28 * fps}
              head={false}
            />
            <span
              style={{
                color: palette.fg,
                fontSize: 14.5 * u,
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {displayStars}
            </span>
            <span style={{ color: palette.faint, fontSize: 14.5 * u }}>·</span>
            <span
              style={{
                color: palette.fg,
                fontSize: 14.5 * u,
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {displayItems}
            </span>
            <span style={{ color: palette.faint, fontSize: 14.5 * u }}>
              {" "}
              {sourceLabel}
            </span>
          </div>

          <div
            style={{
              marginTop: 4 * u,
              color: palette.faint,
              fontSize: 13 * u,
              opacity: starIn,
            }}
          >
            updated yesterday
          </div>

          <div
            style={{
              marginTop: 16 * u,
              width: "100%",
              height: 42 * u,
              borderRadius: 10 * u,
              border: `1px solid ${palette.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: palette.fg,
              fontSize: 14.5 * u,
              fontWeight: 600,
              opacity: descIn,
            }}
          >
            Explore
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
