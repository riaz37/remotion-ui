import { useMemo } from "react";
import { interpolate, spring } from "remotion";
import { CODE_THEMES, CodeLine, tokenizeCode } from "@/remotion/lib/code-syntax";
import { ADD_COMMAND } from "../facts";
import { FAN, FPS, terminalTimes } from "../timeline";
import { CARD, FAN_CENTRE, TERM } from "../camera/shots";
import { CLI_FILES, type CliFile } from "../generated/cli-files";
import { COLORS, MONO } from "../theme";
import { CLAMP, ease, lerp } from "../lib/anim";
import { TERMINAL_STEPS } from "./Screens";

/**
 * Fan: every file the CLI writes flies out of the terminal as a card and lands
 * in a fanned stack, the way the output prints it: this is source in your
 * repo, not a dependency. The last file, compositions/intro/index.tsx, comes
 * forward and flips; its back is the composition itself (MontageCard).
 */

/** A fan card is half the montage card, so the chosen one doubles into it. */
export const FAN_CARD = { w: CARD.w / 2, h: CARD.h / 2 } as const;

const THEME = CODE_THEMES.dark;

const times = terminalTimes(ADD_COMMAND, TERMINAL_STEPS.length - 1, 1);
/** Film frame each file's card launches: one frame after its ✓ line prints. */
export const CARD_LAUNCH = CLI_FILES.map((_, i) => Math.round(times.steps[i]) + 1);

type Slot = { x: number; y: number; rotY: number; z: number };

/** Fanned left to right, receding: index 0 at the back left, the last file at the front right. */
const slotFor = (i: number, n: number): Slot => {
  const t = i / (n - 1);
  return {
    x: FAN_CENTRE.x - 760 + t * 1180,
    y: FAN_CENTRE.y - 150 + t * 190,
    rotY: -32,
    z: -((n - 1 - i) * 90),
  };
};

export const FileCardFace: React.FC<{ file: CliFile; scale?: number }> = ({ file, scale = 1 }) => {
  const tokens = useMemo(() => tokenizeCode(file.excerpt), [file.excerpt]);
  const name = file.path.split("/").slice(-2).join("/");
  return (
    <div
      style={{
        width: FAN_CARD.w * scale,
        height: FAN_CARD.h * scale,
        borderRadius: 16 * scale,
        background: THEME.window,
        border: `${1.5 * scale}px solid ${COLORS.hairline}`,
        overflow: "hidden",
        fontFamily: MONO,
        position: "relative",
      }}
    >
      <div
        style={{
          height: 44 * scale,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `0 ${18 * scale}px`,
          background: THEME.header,
          borderBottom: `${scale}px solid ${THEME.border}`,
          fontSize: 17 * scale,
          color: COLORS.ink,
        }}
      >
        <span>{name}</span>
        <span style={{ color: THEME.dim, fontSize: 14 * scale }}>{file.lines} lines</span>
      </div>
      <div style={{ padding: `${12 * scale}px ${18 * scale}px`, fontSize: 15 * scale, lineHeight: 1.45 }}>
        {tokens.map((line, i) => (
          <div key={i} style={{ height: 15 * scale * 1.45 }}>
            <CodeLine tokens={line} theme={THEME} />
          </div>
        ))}
      </div>
    </div>
  );
};

export const Fan: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < CARD_LAUNCH[0] || frame > FAN.flipEnd + 10) {
    return null;
  }
  const n = CLI_FILES.length;
  // The rest of the fan falls back and out of focus as the chosen card comes forward.
  const fall = interpolate(frame, [FAN.forwardStart, FAN.flipEnd], [0, 1], { ...CLAMP, easing: ease.in });
  return (
    <div style={{ position: "absolute", left: 0, top: 0, zIndex: 0 }}>
      {CLI_FILES.map((file, i) => {
        if (i === n - 1 && frame >= FAN.forwardStart) {
          return null; // MontageCard owns it from here.
        }
        const launch = CARD_LAUNCH[i];
        if (frame < launch) {
          return null;
        }
        const fly = spring({ frame: frame - launch, fps: FPS, config: { damping: 17, stiffness: 110, mass: 0.8 }, durationInFrames: FAN.flyFor });
        const slot = slotFor(i, n);
        const fromX = TERM.centre.x + 360;
        const fromY = TERM.centre.y + 60;
        const x = lerp(fromX, slot.x, fly);
        const y = lerp(fromY, slot.y, fly);
        const depthBlur = ((n - 1 - i) / (n - 1)) * 3.5;
        return (
          <div
            key={file.path}
            style={{
              position: "absolute",
              left: x - FAN_CARD.w / 2,
              top: y - FAN_CARD.h / 2 + fall * 240,
              transform: `perspective(2200px) translateZ(${slot.z * fly - fall * 300}px) rotateY(${lerp(0, slot.rotY, fly)}deg) scale(${lerp(0.35, 1, fly)})`,
              opacity: interpolate(fly, [0, 0.2], [0, 1], CLAMP) * (1 - fall),
              filter: `blur(${(depthBlur * fly + fall * 8).toFixed(2)}px)`,
              boxShadow: "0 40px 90px rgba(0,0,0,0.6)",
              borderRadius: 16,
              zIndex: i,
            }}
          >
            <FileCardFace file={file} />
          </div>
        );
      })}
    </div>
  );
};

/** Where the chosen (last) card sits in the fan: MontageCard starts its move from here. */
export const chosenSlot = (): Slot => slotFor(CLI_FILES.length - 1, CLI_FILES.length);
export const CHOSEN_FILE = CLI_FILES[CLI_FILES.length - 1];
