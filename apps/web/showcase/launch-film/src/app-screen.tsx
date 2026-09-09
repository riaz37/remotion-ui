import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { EASING } from "@/remotion/lib/motion-tokens";
import { PlayerVideo } from "./player-video";
import { COMPOSITION, LANDMARK } from "./screen";
import {
  DIFF_MARKER,
  DISSOLVE,
  SELECTION_PULSE,
  SHOTS,
  TYPING,
} from "./timeline";

/**
 * app-screen — the real captures, and the three marks drawn on top of them.
 *
 * Nothing here invents app state: every pixel of interface is a screenshot of
 * the run in `docs/demo-frames/`. What this file adds is only what a video
 * cannot capture from a still — the line arriving a character at a time, the
 * ring landing on the picked element, the marker under the diff.
 */

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const ACCENT = "#E8B86D";

/** The composer's own interior, sampled off the captures. */
const COMPOSER_INK = "#090706";

const src = (file: string) => staticFile(`launch-film/${file}`);

const fill: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: COMPOSITION.width,
  height: COMPOSITION.height,
  objectFit: "contain",
};

/**
 * The stills, stacked oldest first — each new shot takes over the last at the
 * length it declares. A shot with `dissolve: 0` is a hard cut, because a
 * cross-fade only reads when the two frames differ in one region: fading
 * between two different layouts prints one screen over the other and both
 * become unreadable for a third of a second.
 */
const Stills: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    {SHOTS.map((shot, index) => {
      const dissolve = shot.dissolve ?? DISSOLVE;
      const opacity =
        index === 0
          ? 1
          : dissolve === 0
            ? Number(frame >= shot.start)
            : interpolate(frame, [shot.start, shot.start + dissolve], [0, 1], clamp);

      return <Img key={shot.src} src={src(shot.src)} style={{ ...fill, opacity }} />;
    })}
  </>
);

/**
 * The refine is typed rather than cut to: the finished still is revealed left
 * to right across the one line it differs by, with a caret at the edge. The
 * characters are the app's own rendering of them, not a font we picked.
 */
const TypedLine: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < TYPING.start || frame >= TYPING.handover) {
    return null;
  }

  const box = LANDMARK.refineText;
  const edge = interpolate(frame, [TYPING.start, TYPING.end], [box.x, box.x + box.width], {
    ...clamp,
    easing: EASING.editorial,
  });
  // A caret holds solid while a key is going down — it only blinks once the
  // hand stops. Blinking mid-word is what a fake typing animation does.
  const caretVisible =
    frame <= TYPING.end
      ? true
      : frame < TYPING.end + 12 && Math.floor((frame - TYPING.end) / 8) % 2 === 0;
  // The still underneath still shows the composer's placeholder on this line.
  // A plate in the composer's own colour clears it, so the revealed characters
  // arrive on an empty field rather than over ghost text. It holds until the
  // full `07` still is opaque — dropping it mid-dissolve puts the placeholder
  // back as a ghost behind the typed line.

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: LANDMARK.composerLine.x,
          top: LANDMARK.composerLine.y,
          width: LANDMARK.composerLine.width,
          height: LANDMARK.composerLine.height,
          background: COMPOSER_INK,
        }}
      />
      <Img
        src={src("07-refine-typed.png")}
        style={{
          ...fill,
          clipPath: `inset(${box.y}px ${COMPOSITION.width - edge}px ${
            COMPOSITION.height - (box.y + box.height)
          }px ${box.x}px)`,
        }}
      />
      {caretVisible ? (
        <div
          style={{
            position: "absolute",
            left: edge + 2,
            top: box.y + 12,
            width: 2,
            height: box.height - 24,
            background: ACCENT,
          }}
        />
      ) : null}
    </>
  );
};

/**
 * The Inspect pick. The still already carries the app's own selection ring;
 * this is the landing — one ring expanding off the element and fading, so the
 * click has somewhere to arrive.
 */
const SelectionPulse: React.FC<{ frame: number }> = ({ frame }) => {
  const local = frame - SELECTION_PULSE;
  if (local < 0 || local > 26) {
    return null;
  }

  const grow = interpolate(local, [0, 26], [0, 26], { ...clamp, easing: EASING.enter });
  const opacity = interpolate(local, [0, 4, 26], [0, 0.9, 0], clamp);
  const box = LANDMARK.beat;

  return (
    <div
      style={{
        position: "absolute",
        left: box.x - grow,
        top: box.y - grow,
        width: box.width + grow * 2,
        height: box.height + grow * 2,
        border: `2px solid ${ACCENT}`,
        borderRadius: 6 + grow,
        opacity,
      }}
    />
  );
};

/** A marker sweeping under the line the change actually landed on. */
const DiffMarker: React.FC<{ frame: number }> = ({ frame }) => {
  const box = LANDMARK.diffLine;
  const width = interpolate(
    frame,
    [DIFF_MARKER.start, DIFF_MARKER.end],
    [0, box.width],
    { ...clamp, easing: EASING.enter },
  );

  if (width <= 0) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        width,
        height: box.height,
        borderRadius: 4,
        background: "rgba(232,184,109,0.16)",
        borderBottom: `2px solid ${ACCENT}`,
      }}
    />
  );
};

export const AppScreen: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <Stills frame={frame} />
      <PlayerVideo />
      <TypedLine frame={frame} />
      <SelectionPulse frame={frame} />
      <DiffMarker frame={frame} />
    </AbsoluteFill>
  );
};
