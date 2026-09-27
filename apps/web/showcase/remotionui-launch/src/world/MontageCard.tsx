import { Freeze, interpolate, Sequence, spring } from "remotion";
import { Intro } from "@/compositions/intro";
import { CUT_FRAMES, FAN, FPS, MONTAGE, REVEAL } from "../timeline";
import { CARD, FAN_CENTRE, PANEL } from "../camera/shots";
import { INTRO_PROPS } from "../facts";
import { COLORS, MONO } from "../theme";
import { CLAMP, ease, lerp } from "../lib/anim";
import { SLOTS } from "../montage/slots";
import { CHOSEN_FILE, FileCardFace, chosenSlot } from "./Fan";

/**
 * MontageCard: one rounded card, one position, for the whole montage.
 *
 * It starts life as the last file card in the fan, comes forward and flips; its
 * back is `intro` rendering live (the payoff), then it match-cuts through the
 * registry on the 16th-note grid in CUT_FRAMES. On the hard stop it freezes and
 * becomes the centre tile of the wall.
 */

const CONTENT_SCALE = CARD.w / PANEL.w;

/** Index of the cut playing at `frame`, or -1 before the montage. */
export const cutIndexAt = (frame: number): number => {
  if (frame < MONTAGE.start) {
    return -1;
  }
  for (let i = CUT_FRAMES.length - 2; i >= 0; i -= 1) {
    if (frame >= CUT_FRAMES[i]) {
      return i;
    }
  }
  return -1;
};

const LAST = SLOTS.length - 1;
/** The frame the last component is frozen on: its frame at the stop, minus one. */
const FROZEN_AT = SLOTS[LAST].offset + (REVEAL.stop - 1 - CUT_FRAMES[LAST]);

const Content: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame >= REVEAL.stop) {
    return <Freeze frame={FROZEN_AT}>{SLOTS[LAST].render()}</Freeze>;
  }
  return (
    <>
      <Sequence from={FAN.flipStart - 6} durationInFrames={MONTAGE.start - (FAN.flipStart - 6)} layout="none">
        <Intro {...INTRO_PROPS} />
      </Sequence>
      {SLOTS.map((slot, i) => (
        <Sequence key={slot.slug} from={CUT_FRAMES[i]} durationInFrames={CUT_FRAMES[i + 1] - CUT_FRAMES[i]} premountFor={12}>
          <Sequence from={-slot.offset}>{slot.render()}</Sequence>
        </Sequence>
      ))}
    </>
  );
};

const Label: React.FC<{ frame: number }> = ({ frame }) => {
  const i = cutIndexAt(frame);
  const slug = i === -1 ? "intro" : SLOTS[Math.min(i, LAST)].slug;
  const lane = i === -1 ? "Compositions" : SLOTS[Math.min(i, LAST)].lane;
  const shown = interpolate(frame, [FAN.flipEnd - 4, FAN.flipEnd + 8], [0, 1], CLAMP);
  const gone = interpolate(frame, [REVEAL.pullStart, REVEAL.pullStart + 12], [0, 1], CLAMP);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: CARD.h + 34,
        display: "flex",
        justifyContent: "center",
        gap: 22,
        fontFamily: MONO,
        fontSize: 30,
        letterSpacing: "0.01em",
        opacity: shown * (1 - gone),
      }}
    >
      <span style={{ color: COLORS.ink }}>{slug}</span>
      <span style={{ color: COLORS.faint }}>/</span>
      <span style={{ color: COLORS.phosphor }}>{lane}</span>
    </div>
  );
};

export const MontageCard: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < FAN.forwardStart) {
    return null;
  }
  const slot = chosenSlot();
  const forward = spring({ frame: frame - FAN.forwardStart, fps: FPS, config: { damping: 200, stiffness: 120 }, durationInFrames: FAN.forwardEnd - FAN.forwardStart });
  const flip = interpolate(frame, [FAN.flipStart, FAN.flipEnd], [0, 180], { ...CLAMP, easing: ease.inOut });
  // A gentle lean while it plays, straightened as it drops into the wall.
  const lean = interpolate(frame, [FAN.flipEnd, FAN.flipEnd + 20, REVEAL.pullStart, REVEAL.pullStart + 30], [0, 1, 1, 0], CLAMP);

  const cx = lerp(slot.x, FAN_CENTRE.x, forward);
  const cy = lerp(slot.y, FAN_CENTRE.y, forward);
  const scale = lerp(0.5, 1, forward);
  const rotY = lerp(slot.rotY, 0, forward) + flip + lean * -4;

  // Each cut lands with a tiny kick, so the rhythm is felt in the picture too.
  const i = cutIndexAt(frame);
  const kick = i >= 0 && frame < REVEAL.stop ? interpolate(frame - CUT_FRAMES[i], [0, 4], [1.018, 1], { ...CLAMP, easing: ease.out }) : 1;

  const face: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: CARD.radius,
    overflow: "hidden",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    boxShadow: "0 70px 160px rgba(0,0,0,0.7), 0 0 0 1.5px rgba(236,236,236,0.10)",
  };

  return (
    <div style={{ position: "absolute", left: cx - CARD.w / 2, top: cy - CARD.h / 2, width: CARD.w, height: CARD.h, zIndex: 10 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformStyle: "preserve-3d",
          transform: `perspective(3000px) rotateX(${lean * 3}deg) rotateY(${rotY}deg) scale(${scale * kick})`,
        }}
      >
        {flip < 90 ? (
          <div style={face}>
            <FileCardFace file={CHOSEN_FILE} scale={2} />
          </div>
        ) : null}
        <div style={{ ...face, transform: "rotateY(180deg)", background: "#07070a" }}>
          {frame >= FAN.flipStart - 6 ? (
            <div style={{ width: PANEL.w, height: PANEL.h, transformOrigin: "0 0", transform: `scale(${CONTENT_SCALE})` }}>
              <Content frame={frame} />
            </div>
          ) : null}
        </div>
      </div>
      <Label frame={frame} />
    </div>
  );
};
