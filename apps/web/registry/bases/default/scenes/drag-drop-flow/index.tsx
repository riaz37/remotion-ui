import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { getSafeAreaPadding } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";
import { samplePath, waypointsToPath } from "@/remotion/lib/path-utils";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export type DragDropFlowProps = {
  /** File the cursor picks up and drops. */
  fileName?: string;
  /** Size shown once the upload completes. */
  fileSize?: string;
  /** Other rows in the source list, for context around the dragged file. */
  siblings?: string[];
  /** Heading on the source panel. */
  sourceLabel?: string;
  /** Idle prompt inside the drop zone. */
  label?: string;
  /** Secondary line under the prompt — accepted formats, limits. */
  hint?: string;
  /** Prompt while the file is held over the zone. */
  activeLabel?: string;
  /** Label once the upload finishes. */
  doneLabel?: string;
  accentColor?: string;
  backgroundColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

const DEFAULT_SIBLINGS = ["b-roll-rooftop.mov", "interview-cam-b.mp4"];

/** Beat plan in seconds — every frame number below derives from these. */
const T = {
  panel: 0,
  rows: 0.28,
  cursorIn: 0.45,
  reach: 1.0,
  press: 1.02,
  liftEnd: 1.22,
  dragStart: 1.12,
  dragEnd: 2.12,
  over: 1.62,
  release: 2.12,
  settleEnd: 2.5,
  uploadStart: 2.42,
  uploadEnd: 3.68,
  doneEnd: 4.05,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const FileGlyph: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M13.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5L13.5 3Z"
      stroke={color}
      strokeWidth={1.6}
      strokeLinejoin="round"
    />
    <path d="M13.3 3.2V8.7h5.5" stroke={color} strokeWidth={1.6} />
    <path
      d="m10.4 12.6 4 2.4-4 2.4v-4.8Z"
      fill={color}
      stroke={color}
      strokeWidth={1.4}
      strokeLinejoin="round"
    />
  </svg>
);

const UploadGlyph: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 15.5V4.2m0 0L7.6 8.6M12 4.2l4.4 4.4"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.5 15v3.2a1.8 1.8 0 0 0 1.8 1.8h11.4a1.8 1.8 0 0 0 1.8-1.8V15"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
    />
  </svg>
);

const CheckGlyph: React.FC<{
  size: number;
  color: string;
  progress: number;
}> = ({ size, color, progress }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M4.8 12.6l4.9 4.9 9.5-10.4"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={22}
      strokeDashoffset={22 * (1 - progress)}
    />
  </svg>
);

/** Pointer arrow, drawn rather than typed so it renders on every platform. */
const CursorGlyph: React.FC<{ size: number; fill: string; stroke: string }> = ({
  size,
  fill,
  stroke,
}) => (
  <svg width={size} height={size * 1.35} viewBox="0 0 17 23" fill="none">
    <path
      d="M1.4 1.2 15.2 12.1l-6.1.6-3.2 6.3-4.5-17.8Z"
      fill={fill}
      stroke={stroke}
      strokeWidth={1.4}
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * The whole drag beat rather than a card sliding into a box: the cursor picks
 * a file out of the library, the row it left keeps its place as a ghost, the
 * drop zone arms while the file is held over it, and the release turns into a
 * real upload that completes.
 */
export const DragDropFlow: React.FC<DragDropFlowProps> = ({
  fileName = "hero-take.mp4",
  fileSize = "48.2 MB",
  siblings = DEFAULT_SIBLINGS,
  sourceLabel = "Media library",
  label = "Drop your clip",
  hint = "MP4 or MOV, up to 2 GB",
  activeLabel = "Release to upload",
  doneLabel = "Uploaded",
  accentColor = "#E8B86D",
  backgroundColor,
  theme = "dark",
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const palette = CODE_THEMES[theme];
  const safe = getSafeAreaPadding({ width, height });

  /** Seconds → frames, compressed by `speed`. */
  const at = (seconds: number) => (seconds * fps) / speed;
  const ease = (from: number, to: number, easing = EASING.enter) =>
    interpolate(frame, [at(from), at(to)], [0, 1], { easing, ...clamp });

  const stage = {
    x: safe.paddingLeft,
    y: safe.paddingTop,
    w: width - safe.paddingLeft - safe.paddingRight,
    h: height - safe.paddingTop - safe.paddingBottom,
  };
  const portrait = height > width;
  /** One typographic unit, so text and radii follow the smaller edge. */
  const u = Math.min(stage.w / 1120, stage.h / 620);

  const trayPad = 26 * u;
  const rowH = 74 * u;
  const rowGap = 12 * u;
  /** The dragged file sits mid-list so the ghost it leaves reads clearly. */
  const draggedIndex = Math.min(1, siblings.length);
  const rows = [
    ...siblings.slice(0, draggedIndex),
    fileName,
    ...siblings.slice(draggedIndex),
  ].slice(0, 3);

  // Both panels are sized to what they hold and then centred, rather than
  // stretched to the safe area — a half-empty list panel reads as a bug.
  const gap = 0.05 * Math.min(stage.w, stage.h * 1.6);
  const trayH =
    trayPad * 2 + 46 * u + rows.length * rowH + (rows.length - 1) * rowGap;
  const zoneH = portrait
    ? stage.h - trayH - gap
    : Math.min(stage.h, Math.max(trayH, 400 * u));
  const tray = portrait
    ? { x: 0, y: 0, w: stage.w, h: trayH }
    : { x: 0, y: (stage.h - trayH) / 2, w: stage.w * 0.34, h: trayH };
  const zone = portrait
    ? { x: 0, y: trayH + gap, w: stage.w, h: zoneH }
    : {
        x: tray.w + gap,
        y: (stage.h - zoneH) / 2,
        w: stage.w - tray.w - gap,
        h: zoneH,
      };

  const rowsTop = tray.y + trayPad + 46 * u;
  const rowY = (index: number) => rowsTop + index * (rowH + rowGap);

  const cardW = Math.min(tray.w - trayPad * 2, 360 * u);
  const cardH = rowH;
  const homeCenter = {
    x: tray.x + trayPad + cardW / 2,
    y: rowY(draggedIndex) + cardH / 2,
  };
  /** Where the file lands — high in the zone, so the prompt below stays clear. */
  const dropCenter = {
    x: zone.x + zone.w / 2,
    y: zone.y + zone.h * 0.34,
  };
  /** Where the pointer holds the card — its top-left quadrant, as a mouse does. */
  const grip = { x: cardW * 0.16, y: cardH * 0.18 };

  // The cursor travels on two arcs: in to the file, then out to the zone.
  // Keeping them separate lets the grab land on an exact beat instead of on a
  // guessed fraction of one long path.
  const approach = waypointsToPath(
    [
      { x: tray.x + tray.w * 0.12, y: stage.h + 90 * u },
      { x: homeCenter.x - cardW * 0.1, y: homeCenter.y + rowH * 1.9 },
      { x: homeCenter.x + grip.x, y: homeCenter.y + grip.y },
    ],
    0.6,
  );
  const carry = waypointsToPath(
    [
      { x: homeCenter.x + grip.x, y: homeCenter.y + grip.y },
      {
        x: (homeCenter.x + dropCenter.x) / 2,
        y: Math.min(homeCenter.y, dropCenter.y) - stage.h * 0.16,
      },
      { x: dropCenter.x + grip.x, y: dropCenter.y + grip.y },
    ],
    0.9,
  );

  const carrying = frame >= at(T.dragStart);
  const cursorPoint = carrying
    ? samplePath(carry, ease(T.dragStart, T.dragEnd, EASING.editorial))
    : samplePath(approach, ease(T.cursorIn, T.reach, EASING.editorial));

  const press = interpolate(
    frame,
    [at(T.press), at(T.press + 0.09), at(T.liftEnd)],
    [0, 1, 0],
    clamp,
  );
  const lift = interpolate(
    frame,
    [at(T.press), at(T.liftEnd), at(T.release), at(T.settleEnd)],
    [0, 1, 1, 0],
    { easing: EASING.editorial, ...clamp },
  );
  const released = frame >= at(T.release);
  const settle = spring({
    frame: frame - at(T.release),
    fps,
    config: { damping: 15, stiffness: 150, mass: 0.7 },
  });
  const armed = interpolate(
    frame,
    [at(T.over), at(T.over + 0.22), at(T.release), at(T.release + 0.3)],
    [0, 1, 1, 0],
    clamp,
  );
  const upload = ease(T.uploadStart, T.uploadEnd, EASING.editorial);
  const done = ease(T.uploadEnd, T.doneEnd);
  const panel = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.8 },
  });

  // The card is parented to the cursor while carried, then springs into the
  // zone after the release.
  const cardCenter = released
    ? {
        x: interpolate(settle, [0, 1], [cursorPoint.x - grip.x, dropCenter.x]),
        y: interpolate(settle, [0, 1], [cursorPoint.y - grip.y, dropCenter.y]),
      }
    : carrying
      ? { x: cursorPoint.x - grip.x, y: cursorPoint.y - grip.y }
      : homeCenter;

  const zoneArmed = armed > 0 || released;
  const zoneLabel = released
    ? upload < 1
      ? "Uploading"
      : doneLabel
    : armed > 0.5
      ? activeLabel
      : label;

  return (
    <div
      style={{
        width,
        height,
        background: backgroundColor ?? palette.page,
        fontFamily,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 60% 55% at ${
            ((stage.x + dropCenter.x) / width) * 100
          }% ${((stage.y + dropCenter.y) / height) * 100}%, ${accentColor}${
            zoneArmed ? "22" : "10"
          }, transparent 70%)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: stage.x,
          top: stage.y,
          width: stage.w,
          height: stage.h,
        }}
      >
        {/* Source list */}
        <div
          style={{
            position: "absolute",
            left: tray.x,
            top: tray.y,
            width: tray.w,
            height: tray.h,
            borderRadius: 22 * u,
            background: palette.window,
            border: `1px solid ${palette.border}`,
            boxShadow: `inset 0 1px 0 ${palette.highlight}, 0 ${26 * u}px ${
              70 * u
            }px ${palette.shadow}`,
            opacity: panel,
            transform: `translateX(${(1 - panel) * -22 * u}px)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: trayPad,
              top: trayPad,
              color: palette.dim,
              fontSize: 19 * u,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {sourceLabel}
          </div>
        </div>

        {rows.map((name, index) => {
          const isDragged = index === draggedIndex;
          const rowIn = interpolate(
            frame,
            [at(T.rows + index * 0.08), at(T.rows + index * 0.08 + 0.4)],
            [0, 1],
            { easing: EASING.enter, ...clamp },
          );

          if (isDragged) {
            // The slot the file left — dashed, and only while it is away.
            return (
              <div
                key={name}
                style={{
                  position: "absolute",
                  left: tray.x + trayPad,
                  top: rowY(index),
                  width: cardW,
                  height: rowH,
                  borderRadius: 14 * u,
                  border: `1px dashed ${palette.faint}`,
                  // Stays after the drop: the file left the library for the
                  // upload, so its slot should still read as vacated.
                  opacity: rowIn * Math.max(lift * 0.9, released ? 0.55 : 0),
                }}
              />
            );
          }

          return (
            <div
              key={name}
              style={{
                position: "absolute",
                left: tray.x + trayPad,
                top: rowY(index),
                width: cardW,
                height: rowH,
                borderRadius: 14 * u,
                border: `1px solid ${palette.border}`,
                background: palette.band,
                opacity: rowIn,
                transform: `translateY(${(1 - rowIn) * 14 * u}px)`,
                display: "flex",
                alignItems: "center",
                gap: 14 * u,
                paddingLeft: 16 * u,
                color: palette.dim,
                fontSize: 21 * u,
                fontWeight: 500,
              }}
            >
              <FileGlyph size={26 * u} color={palette.faint} />
              <span style={{ whiteSpace: "nowrap", overflow: "hidden" }}>
                {name}
              </span>
            </div>
          );
        })}

        {/* Drop zone */}
        <div
          style={{
            position: "absolute",
            left: zone.x,
            top: zone.y,
            width: zone.w,
            height: zone.h,
            borderRadius: 26 * u,
            border: `${2 * u}px dashed ${
              zoneArmed ? accentColor : palette.border
            }`,
            background: zoneArmed
              ? `linear-gradient(180deg, ${accentColor}${
                  released ? "0C" : "16"
                }, transparent 72%)`
              : palette.band,
            boxShadow: `0 0 ${
              52 * u * Math.max(armed, released ? 0.3 : 0)
            }px ${accentColor}55`,
            opacity: panel,
            transform: `scale(${1 + armed * 0.012})`,
          }}
        />

        {/* Zone copy — centred while the zone waits, tucked under the file once
            it lands, so the two never share the same band */}
        <div
          style={{
            position: "absolute",
            left: zone.x,
            top: interpolate(
              released ? settle : 0,
              [0, 1],
              [zone.y + zone.h * 0.58, dropCenter.y + cardH * 0.5 + 82 * u],
            ),
            width: zone.w,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10 * u,
            textAlign: "center",
            transform: "translateY(-50%)",
          }}
        >
          {released ? null : (
            <div style={{ transform: `translateY(${armed * -6 * u}px)` }}>
              <UploadGlyph
                size={44 * u}
                color={armed > 0.4 ? accentColor : palette.dim}
              />
            </div>
          )}
          <div
            style={{
              color: done > 0 ? accentColor : palette.fg,
              fontSize: 30 * u,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 10 * u,
            }}
          >
            {done > 0 ? (
              <CheckGlyph size={28 * u} color={accentColor} progress={done} />
            ) : null}
            {zoneLabel}
          </div>
          <div style={{ color: palette.faint, fontSize: 20 * u }}>
            {released ? `${fileName} · ${fileSize}` : hint}
          </div>
        </div>

        {/* The file itself — one element from library row to landed upload */}
        <div
          style={{
            position: "absolute",
            left: cardCenter.x - cardW / 2,
            top: cardCenter.y - cardH / 2,
            width: cardW,
            height: cardH,
            borderRadius: 14 * u,
            background: palette.window,
            border: `1px solid ${
              lift > 0.2 || released ? `${accentColor}88` : palette.border
            }`,
            boxShadow: `0 ${(6 + lift * 22) * u}px ${(16 + lift * 46) * u}px ${
              palette.shadow
            }`,
            transform: `scale(${1 + lift * 0.06 - press * 0.04}) rotate(${
              lift * -2.2 * (1 - settle)
            }deg)`,
            opacity: interpolate(
              frame,
              [at(T.rows), at(T.rows + 0.4)],
              [0, 1],
              clamp,
            ),
            display: "flex",
            alignItems: "center",
            gap: 14 * u,
            paddingLeft: 16 * u,
            paddingRight: 16 * u,
            color: palette.fg,
            fontSize: 21 * u,
            fontWeight: 500,
            overflow: "hidden",
          }}
        >
          <FileGlyph size={26 * u} color={accentColor} />
          <span style={{ whiteSpace: "nowrap" }}>{fileName}</span>
          <div
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              height: 4 * u,
              width: `${upload * 100}%`,
              background: accentColor,
              opacity: released ? 1 : 0,
            }}
          />
        </div>

        {/* Transfer readout under the landed file */}
        <div
          style={{
            position: "absolute",
            left: dropCenter.x - cardW / 2,
            top: dropCenter.y + cardH * 0.5 + 14 * u,
            width: cardW,
            display: "flex",
            justifyContent: "space-between",
            color: palette.dim,
            fontSize: 17 * u,
            fontVariantNumeric: "tabular-nums",
            opacity: released ? settle : 0,
          }}
        >
          <span />
          <span>{Math.round(upload * 100)}%</span>
        </div>

        {/* Click ring, then the cursor on top of it */}
        <div
          style={{
            position: "absolute",
            left: cursorPoint.x - 30 * u,
            top: cursorPoint.y - 30 * u,
            width: 60 * u,
            height: 60 * u,
            borderRadius: "50%",
            border: `${2 * u}px solid ${accentColor}`,
            // Only after the release — a clamped ramp would otherwise hold the
            // ring at full strength for the whole approach.
            opacity: released
              ? interpolate(
                  frame,
                  [at(T.release), at(T.release + 0.34)],
                  [0.75, 0],
                  clamp,
                )
              : 0,
            transform: `scale(${interpolate(
              frame,
              [at(T.release), at(T.release + 0.34)],
              [0.4, 1.5],
              clamp,
            )})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: cursorPoint.x,
            top: cursorPoint.y,
            opacity: interpolate(
              frame,
              [
                at(T.cursorIn),
                at(T.cursorIn + 0.2),
                at(T.release + 0.25),
                at(T.release + 0.6),
              ],
              [0, 1, 1, 0],
              clamp,
            ),
            transform: `scale(${1 - press * 0.14})`,
            transformOrigin: "top left",
          }}
        >
          <CursorGlyph
            size={19 * u}
            fill={theme === "dark" ? "#F6F7FA" : "#1A1D24"}
            stroke={
              theme === "dark" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)"
            }
          />
        </div>
      </div>
    </div>
  );
};
