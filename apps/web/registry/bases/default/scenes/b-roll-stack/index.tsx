import { loadFont } from "@remotion/google-fonts/Inter";
import { Video } from "@remotion/media";
import {
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  getMediaObjectFitStyle,
  isVideoSource,
  type MediaFit,
} from "@/remotion/lib/media-utils";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION, EASING, STAGGER } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

export type BRollItem = {
  src: string;
  title?: string;
  caption?: string;
  fit?: MediaFit;
  backgroundColor?: string;
};

export type BRollStackProps = {
  items?: BRollItem[];
  title?: string;
  kicker?: string;
  caption?: string;
  backgroundColor?: string;
  accentColor?: string;
  muted?: boolean;
  maxCards?: number;
};

const COLORS = {
  bg: "#080810",
  panel: "#10131d",
  panelDeep: "#070912",
  text: "#ffffff",
  muted: "#b9c0cc",
  accent: "#e8b86d",
  teal: "#2dd4bf",
  rose: "#f472b6",
} as const;

type StackCard = BRollItem & {
  tone: string;
};

type CardPlacement = {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  zIndex: number;
};

const FALLBACK_ITEMS: StackCard[] = [
  {
    src: "",
    title: "Product screen",
    caption: "Feature walkthrough",
    fit: "cover",
    tone: COLORS.accent,
  },
  {
    src: "",
    title: "Workflow proof",
    caption: "Behind the build",
    fit: "cover",
    tone: COLORS.teal,
  },
  {
    src: "",
    title: "Customer result",
    caption: "Outcome detail",
    fit: "cover",
    tone: COLORS.rose,
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function fitHeadline(text: string | undefined, width: number, isPortrait: boolean) {
  if (!text) {
    return scaleFont(isPortrait ? 70 : 54, width);
  }

  const longestWord = text.split(/\s+/).reduce((longest, word) => {
    return word.length > longest.length ? word : longest;
  }, "");

  const base = scaleFont(isPortrait ? 68 : 54, width);
  const lengthAdjusted = text.length > 34 ? base * 0.9 : base;
  const wordAdjusted = longestWord.length > 14 ? base * 0.74 : lengthAdjusted;

  return Math.round(clamp(wordAdjusted, scaleFont(isPortrait ? 44 : 38, width), base));
}

function getPlacements(isPortrait: boolean, cardCount: number): CardPlacement[] {
  const landscape: CardPlacement[] = [
    { x: -10, y: -4, rotate: -3.5, scale: 1, zIndex: 5 },
    { x: 24, y: 18, rotate: 2.5, scale: 0.94, zIndex: 4 },
    { x: 48, y: -16, rotate: -1.25, scale: 0.89, zIndex: 3 },
    { x: 66, y: 30, rotate: 3.5, scale: 0.84, zIndex: 2 },
  ];
  const portrait: CardPlacement[] = [
    { x: 0, y: -4, rotate: -2.25, scale: 1, zIndex: 5 },
    { x: 18, y: 30, rotate: 2.5, scale: 0.94, zIndex: 4 },
    { x: -16, y: 58, rotate: -1.25, scale: 0.88, zIndex: 3 },
    { x: 28, y: 82, rotate: 3.5, scale: 0.82, zIndex: 2 },
  ];
  const placements = isPortrait ? portrait : landscape;

  return placements.slice(0, Math.max(1, cardCount));
}

function getStackCards({
  items,
  accentColor,
  maxCards,
}: {
  items: BRollItem[];
  accentColor: string;
  maxCards: number;
}): StackCard[] {
  const limit = Math.round(clamp(maxCards, 1, 4));
  const tones = [accentColor, COLORS.teal, COLORS.rose, "#f59e0b"];

  if (items.length === 0) {
    return FALLBACK_ITEMS.slice(0, limit).map((item, index) => ({
      ...item,
      tone: tones[index] ?? accentColor,
    }));
  }

  const provided = items.slice(0, limit);
  const fillerCount = Math.min(Math.max(3 - provided.length, 0), limit - provided.length);
  const filler = FALLBACK_ITEMS.slice(0, fillerCount).map((item) => ({
    ...item,
    src: "",
    title: undefined,
    caption: undefined,
  }));

  return [...provided, ...filler].map((item, index) => ({
    ...item,
    tone: tones[index] ?? accentColor,
  }));
}

function CardMedia({
  item,
  fit,
  muted,
}: {
  item: StackCard;
  fit: MediaFit;
  muted: boolean;
}) {
  if (!item.src) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: `radial-gradient(circle at 24% 20%, ${item.tone}66, transparent 34%), linear-gradient(135deg, #1f2431 0%, #0b0d16 100%)`,
          display: "grid",
          gridTemplateRows: "1fr 1fr 1fr",
          gap: 12,
          padding: 28,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "46%",
            borderRadius: 999,
            background: "rgba(255,255,255,0.72)",
          }}
        />
        <div
          style={{
            borderRadius: 18,
            background: "rgba(255,255,255,0.08)",
            boxShadow: `inset 0 0 0 1px ${item.tone}44`,
          }}
        />
        <div
          style={{
            width: "72%",
            borderRadius: 999,
            background: item.tone,
            alignSelf: "center",
          }}
        />
      </div>
    );
  }

  const mediaStyle = getMediaObjectFitStyle(fit);

  return isVideoSource(item.src) ? (
    <Video src={item.src} muted={muted} loop style={mediaStyle} />
  ) : (
    <Img src={item.src} style={mediaStyle} />
  );
}

function StackCard({
  item,
  placement,
  index,
  isPortrait,
  accentColor,
  muted,
}: {
  item: StackCard;
  placement: CardPlacement;
  index: number;
  isPortrait: boolean;
  accentColor: string;
  muted: boolean;
}) {
  const frame = useCurrentFrame();
  const { width, fps } = useVideoConfig();
  const delay = STAGGER.normal + index * STAGGER.tight;
  const enter = spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 18,
      mass: 0.85,
      stiffness: 120,
    },
    durationInFrames: DURATION.normal,
  });
  const shimmer = interpolate(
    frame,
    [delay + DURATION.fast, delay + DURATION.slow + 16],
    [-24, 124],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASING.editorial,
    },
  );
  const cardRadius = scaleFont(isPortrait ? 28 : 18, width);
  const labelPad = scaleFont(isPortrait ? 18 : 12, width);
  const titleSize = scaleFont(isPortrait ? 30 : 22, width);
  const captionSize = scaleFont(isPortrait ? 21 : 16, width);
  const cardTone = index === 0 ? accentColor : item.tone;
  const fit = item.fit ?? (isPortrait ? "cover" : "contain");
  const travelY = isPortrait ? 42 : 34;
  const travelX = isPortrait ? 0 : 30;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: placement.zIndex,
        borderRadius: cardRadius,
        overflow: "hidden",
        background: item.backgroundColor ?? COLORS.panel,
        border: `1px solid rgba(255,255,255,${index === 0 ? 0.2 : 0.12})`,
        boxShadow: `0 ${scaleFont(24 + index * 10, width)}px ${scaleFont(64 + index * 18, width)}px rgba(0,0,0,0.46)`,
        opacity: interpolate(enter, [0, 0.25, 1], [0, 1, 1]),
        transform: [
          `translateX(${placement.x * enter - (1 - enter) * travelX}px)`,
          `translateY(${placement.y * enter + (1 - enter) * travelY}px)`,
          `rotate(${placement.rotate * enter}deg)`,
          `scale(${0.88 + (placement.scale - 0.88) * enter})`,
        ].join(" "),
        transformOrigin: "center center",
        display: "grid",
        gridTemplateRows: item.title || item.caption ? "1fr auto" : "1fr",
      }}
    >
      <div
        style={{
          minHeight: 0,
          position: "relative",
          overflow: "hidden",
          background: COLORS.panelDeep,
        }}
      >
        <CardMedia item={item} fit={fit} muted={muted} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.12), transparent 38%, rgba(0,0,0,0.24))",
            pointerEvents: "none",
          }}
        />
        {index === 0 ? (
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${shimmer}%`,
              width: "26%",
              transform: "skewX(-18deg)",
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)",
              opacity: 0.5,
            }}
          />
        ) : null}
      </div>
      {item.title || item.caption ? (
        <div
          style={{
            padding: `${labelPad}px ${labelPad + scaleFont(2, width)}px`,
            background:
              "linear-gradient(180deg, rgba(13,16,26,0.92), rgba(7,9,18,0.98))",
            display: "grid",
            gap: scaleFont(5, width),
            boxShadow: `inset 0 1px 0 ${cardTone}44`,
          }}
        >
          {item.title ? (
            <div
              style={{
                color: COLORS.text,
                fontSize: titleSize,
                fontWeight: 700,
                lineHeight: 1.08,
              }}
            >
              {item.title}
            </div>
          ) : null}
          {item.caption ? (
            <div
              style={{
                color: COLORS.muted,
                fontSize: captionSize,
                fontWeight: 500,
                lineHeight: 1.2,
              }}
            >
              {item.caption}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export const BRollStack: React.FC<BRollStackProps> = ({
  items = [],
  title = "Layer cutaways behind the narration",
  kicker = "Supporting visuals",
  caption = "Stack proof shots, product screens, and process clips without hand-positioning every layer.",
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
  muted = true,
  maxCards = 4,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });
  const isPortrait = height > width;
  const cards = getStackCards({ items, accentColor, maxCards });
  const placements = getPlacements(isPortrait, cards.length);
  const gap = scaleFont(isPortrait ? 34 : 24, width);
  const headlineSize = fitHeadline(title, width, isPortrait);
  const kickerEnter = interpolate(frame, [0, DURATION.fast], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.enter,
  });
  const titleEnter = interpolate(
    frame,
    [STAGGER.tight, STAGGER.tight + DURATION.fast],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASING.enter,
    },
  );
  const captionEnter = interpolate(
    frame,
    [STAGGER.normal, STAGGER.normal + DURATION.fast],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASING.enter,
    },
  );
  const stackWidth = isPortrait
    ? width - safe.paddingLeft - safe.paddingRight
    : Math.round(width * 0.46);
  const stackHeight = isPortrait
    ? Math.round(height * 0.43)
    : height - safe.paddingTop - safe.paddingBottom - scaleFont(28, width);
  const stageInset = scaleFont(isPortrait ? 36 : 32, width);
  const innerWidth = Math.max(220, stackWidth - stageInset * 2);
  const innerHeight = Math.max(180, stackHeight - stageInset * 2);
  const backgroundBeat = interpolate(frame, [0, DURATION.slow], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.enter,
  });

  return (
    <div
      style={{
        width,
        height,
        boxSizing: "border-box",
        background: `radial-gradient(circle at 78% 18%, ${accentColor}28, transparent 30%), linear-gradient(135deg, ${backgroundColor}, #050711 68%)`,
        color: COLORS.text,
        paddingLeft: safe.paddingLeft,
        paddingRight: safe.paddingRight,
        paddingTop: safe.paddingTop,
        paddingBottom: safe.paddingBottom,
        fontFamily,
        display: "flex",
        flexDirection: isPortrait ? "column" : "row",
        gap,
        alignItems: isPortrait ? "stretch" : "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flex: isPortrait ? "0 0 auto" : "1 1 0",
          minWidth: 0,
          display: "grid",
          gap: scaleFont(isPortrait ? 14 : 12, width),
          alignContent: "center",
        }}
      >
        {kicker ? (
          <div
            style={{
              color: accentColor,
              fontSize: scaleFont(isPortrait ? 29 : 24, width),
              fontWeight: 700,
              lineHeight: 1,
              opacity: kickerEnter,
              transform: `translateY(${(1 - kickerEnter) * scaleFont(12, width)}px)`,
            }}
          >
            {kicker}
          </div>
        ) : null}
        {title ? (
          <h2
            style={{
              margin: 0,
              color: COLORS.text,
              fontSize: headlineSize,
              lineHeight: 1.02,
              fontWeight: 800,
              maxWidth: isPortrait ? "100%" : scaleFont(390, width),
              opacity: titleEnter,
              transform: `translateY(${(1 - titleEnter) * scaleFont(18, width)}px)`,
            }}
          >
            {title}
          </h2>
        ) : null}
        {caption ? (
          <p
            style={{
              margin: 0,
              color: COLORS.muted,
              fontSize: scaleFont(isPortrait ? 27 : 20, width),
              lineHeight: 1.24,
              fontWeight: 500,
              maxWidth: isPortrait ? "100%" : scaleFont(360, width),
              opacity: captionEnter,
              transform: `translateY(${(1 - captionEnter) * scaleFont(12, width)}px)`,
            }}
          >
            {caption}
          </p>
        ) : null}
      </div>

      <div
        style={{
          flex: isPortrait ? "1 1 auto" : "0 0 auto",
          width: isPortrait ? "100%" : stackWidth,
          height: stackHeight,
          minHeight: isPortrait ? 0 : stackHeight,
          position: "relative",
          display: "grid",
          placeItems: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: stageInset * 0.65,
            borderRadius: scaleFont(34, width),
            background: `linear-gradient(135deg, ${accentColor}1f, rgba(45,212,191,0.09))`,
            opacity: backgroundBeat,
            transform: `scale(${0.92 + backgroundBeat * 0.08}) rotate(${
              isPortrait ? -2 : -4
            }deg)`,
            boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 ${scaleFont(
              28,
              width,
            )}px ${scaleFont(90, width)}px rgba(0,0,0,0.34)`,
          }}
        />
        <div
          style={{
            width: innerWidth,
            height: innerHeight,
            position: "relative",
          }}
        >
          {cards.map((item, index) => (
            <StackCard
              key={`${item.src || item.title || "placeholder"}-${index}`}
              item={item}
              placement={placements[index] ?? placements[0]!}
              index={index}
              isPortrait={isPortrait}
              accentColor={accentColor}
              muted={muted}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
