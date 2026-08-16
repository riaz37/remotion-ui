import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { EASING } from "@/remotion/lib/motion-tokens";

export type BadgeStampProps = {
  /** The word in the middle of the seal. */
  label?: string;
  /** Text curved around the top of the ring. Omit to drop it. */
  ringText?: string;
  /**
   * Text curved around the bottom. It runs on its own left-to-right arc so it
   * reads upright — a single full-circle path would print the bottom half
   * upside down.
   */
  ringTextBottom?: string;
  /** Line under the label. */
  sublabel?: string;
  size?: number;
  color?: string;
  /** Degrees the stamp lands at. It arrives from further round than this. */
  rotation?: number;
  /** How much further round it starts, in degrees. */
  windUp?: number;
  /** Frame the stamp lands on. */
  delayInFrames?: number;
  /** Frame the stamp starts leaving. Omit to leave it on screen. */
  exitAtInFrames?: number;
  /** Frames the exit takes. */
  exitInFrames?: number;
  /** Shockwave ring thrown off on impact. Set false for a plain stamp. */
  impactRing?: boolean;
};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * A seal that lands like a stamp: it comes in oversized and over-rotated, hits
 * its mark, and settles back with the rotation still unwinding after the scale
 * has stopped — the offset between the two is what sells the weight.
 *
 * The shockwave is thrown from the impact frame, not from the start, so it
 * cannot arrive before the thing that caused it.
 */
export const BadgeStamp: React.FC<BadgeStampProps> = ({
  label = "APPROVED",
  ringText = "REMOTIONUI",
  ringTextBottom = "VERIFIED BUILD",
  sublabel = "2026",
  size = 220,
  color = "#E8B86D",
  rotation = -9,
  windUp = 16,
  delayInFrames = 6,
  exitAtInFrames,
  exitInFrames = 16,
  impactRing = true,
}) => {
  const frame = useCurrentFrame();
  const { fps, id } = useVideoConfig();

  // Ids are document-global, so two stamps on one frame would share a path.
  const topPathId = `badge-stamp-top-${id}`;
  const bottomPathId = `badge-stamp-bottom-${id}`;

  const land = spring({
    frame: frame - delayInFrames,
    fps,
    config: { damping: 14, stiffness: 220, mass: 0.9 },
  });
  // Rotation trails the scale by its own spring: the seal is still turning
  // fractionally after it has stopped moving toward the page.
  const settle = spring({
    frame: frame - delayInFrames,
    fps,
    config: { damping: 11, stiffness: 120, mass: 1 },
  });

  const scale = interpolate(land, [0, 1], [2.1, 1]);
  const turn = interpolate(settle, [0, 1], [rotation + windUp, rotation]);
  const opacity = interpolate(land, [0, 0.35], [0, 1], clamp);

  // Ink strength: heavy on impact, easing back as the pressure comes off.
  const ink = interpolate(land, [0.35, 1], [1, 0.86], clamp);

  const shock = interpolate(
    frame,
    [delayInFrames + 2, delayInFrames + 20],
    [0, 1],
    { easing: EASING.exit, ...clamp },
  );

  const exit =
    exitAtInFrames === undefined
      ? 0
      : interpolate(frame, [exitAtInFrames, exitAtInFrames + exitInFrames], [0, 1], {
          easing: EASING.exit,
          ...clamp,
        });

  const r = 50;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      style={{ overflow: "visible", opacity: 1 - exit }}
    >
      <defs>
        {/* Two half arcs, both running left to right. Letters stand up from the
            direction of travel, so a shared full-circle path would invert
            everything on the bottom half. */}
        <path
          id={topPathId}
          d={`M ${60 - (r - 12)} 60 A ${r - 12} ${r - 12} 0 0 1 ${60 + (r - 12)} 60`}
          fill="none"
        />
        <path
          id={bottomPathId}
          d={`M ${60 - (r - 14)} 60 A ${r - 14} ${r - 14} 0 0 0 ${60 + (r - 14)} 60`}
          fill="none"
        />
      </defs>

      {impactRing && shock > 0 && shock < 1 ? (
        <circle
          cx={60}
          cy={60}
          r={r * (1 + shock * 0.55)}
          fill="none"
          stroke={color}
          strokeWidth={2.4 * (1 - shock)}
          opacity={0.5 * (1 - shock)}
        />
      ) : null}

      <g
        style={{
          transformOrigin: "60px 60px",
          transform: `rotate(${turn}deg) scale(${scale})`,
          opacity: opacity * (1 - exit),
        }}
      >
        <circle
          cx={60}
          cy={60}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={3.4}
          opacity={ink}
        />
        <circle
          cx={60}
          cy={60}
          r={r - 6}
          fill="none"
          stroke={color}
          strokeWidth={1.2}
          opacity={ink * 0.7}
        />

        {ringText ? (
          <text
            fill={color}
            fontSize={7.4}
            fontWeight={700}
            letterSpacing={1.6}
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            opacity={ink * 0.9}
          >
            <textPath href={`#${topPathId}`} startOffset="50%" textAnchor="middle">
              {ringText}
            </textPath>
          </text>
        ) : null}

        {ringTextBottom ? (
          <text
            fill={color}
            fontSize={7.4}
            fontWeight={700}
            letterSpacing={1.6}
            dy={6.4}
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            opacity={ink * 0.9}
          >
            <textPath href={`#${bottomPathId}`} startOffset="50%" textAnchor="middle">
              {ringTextBottom}
            </textPath>
          </text>
        ) : null}

        <text
          x={60}
          y={sublabel ? 60 : 65}
          fill={color}
          fontSize={13}
          fontWeight={800}
          letterSpacing={0.9}
          textAnchor="middle"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          opacity={ink}
        >
          {label}
        </text>

        {sublabel ? (
          <text
            x={60}
            y={75}
            fill={color}
            fontSize={9}
            fontWeight={600}
            letterSpacing={2}
            textAnchor="middle"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            opacity={ink * 0.8}
          >
            {sublabel}
          </text>
        ) : null}
      </g>
    </svg>
  );
};
