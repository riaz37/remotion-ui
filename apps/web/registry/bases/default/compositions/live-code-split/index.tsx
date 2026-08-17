import {
  AbsoluteFill,
  interpolate,
  Loop,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CodeReveal } from "@/remotion/scenes/code-reveal";
import { TitleCard } from "@/remotion/scenes/title-card";
import { EASING } from "@/remotion/lib/motion-tokens";

const SAMPLE = `export const Clip = () => (
  <TitleCard
    title="Live preview"
  />
);`;

/**
 * Frame the JSX finishes writing, at the default `code`.
 *
 * `CodeReveal` writes at 55 characters per second from a 0.4s lead-in with a
 * short beat per newline, which closes the element just past frame 50. Change
 * `code` and this moves — that is why it is a prop and not a constant.
 */
const PREVIEW_AT = 52;

/** One pass of the previewed clip. The pane replays it, the way a player does. */
const PREVIEW_LOOP = 84;

/** How often the link between the panes pulses once the preview is live. */
const LINK_CYCLE = 30;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export type LiveCodeSplitProps = {
  code?: string;
  /** Headline the previewed clip renders — keep it the one in `code`. */
  previewTitle?: string;
  /**
   * Frame the preview pane starts rendering on. It should be the frame the
   * component's JSX finishes typing on the left.
   */
  previewAt?: number;
  backgroundColor?: string;
  accentColor?: string;
};

/**
 * The editor and its output side by side: the file is written on the left, and
 * the moment its JSX lands the pane on the right starts rendering the clip that
 * code describes — then replays it on a loop, the way a preview player does.
 */
export const LiveCodeSplit: React.FC<LiveCodeSplitProps> = ({
  code = SAMPLE,
  previewTitle = "Live preview",
  previewAt = PREVIEW_AT,
  backgroundColor = "#080810",
  accentColor = "#e8b86d",
}) => {
  const { width, height } = useVideoConfig();
  const unit = width / 960;

  const pad = Math.round(30 * unit);
  const linkW = Math.round(46 * unit);
  const innerW = width - pad * 2;

  // Each pane holds the whole composition scaled down, so both keep the 16:9
  // proportions their scene was laid out against instead of being squeezed.
  const codeW = Math.round((innerW - linkW) * 0.565);
  const previewW = innerW - linkW - codeW;

  /**
   * `CodeReveal` centres a 940px window on a 1280x720 stage, so its window is
   * only ~73% of the frame width and the rest is glow plate. Fitting the whole
   * frame into half a composition would leave a postage stamp — instead the
   * pane is scaled so the *window* fills it, and the plate is cropped.
   */
  const codeWindowW = 940 * Math.min(width / 1280, height / 720);
  const codeScale = (codeW - 22 * unit) / codeWindowW;
  const codeH = Math.round(212 * unit);

  const previewScale = previewW / width;
  const previewH = Math.round(height * previewScale);
  const chromeH = Math.round(34 * unit);

  return (
    <AbsoluteFill
      style={{
        background: backgroundColor,
        backgroundImage: `radial-gradient(ellipse 80% 60% at 50% 40%, ${accentColor}12, transparent 70%)`,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: pad,
        boxSizing: "border-box",
      }}
    >
      <Pane width={codeW} height={codeH} unit={unit} accentColor={accentColor}>
        <Stage paneW={codeW} paneH={codeH} scale={codeScale}>
          <CodeReveal
            code={code}
            title="Composition.tsx"
            accentColor={accentColor}
          />
        </Stage>
      </Pane>

      <Link width={linkW} unit={unit} accentColor={accentColor} previewAt={previewAt} />

      <PreviewPane
        width={previewW}
        height={previewH}
        chromeH={chromeH}
        unit={unit}
        accentColor={accentColor}
        previewAt={previewAt}
      >
        <Stage paneW={previewW} paneH={previewH} scale={previewScale}>
          <Sequence from={previewAt} layout="none">
            <Loop durationInFrames={PREVIEW_LOOP} layout="none">
              <TitleCard
                title={previewTitle}
                backgroundColor="#0b0b14"
                accentColor={accentColor}
              />
            </Loop>
          </Sequence>
        </Stage>
      </PreviewPane>
    </AbsoluteFill>
  );
};

/**
 * Three dots between the panes, lighting left to right once the preview is
 * live. Without it the left 60% of the frame is frozen from the moment the file
 * finishes writing, and the split stops reading as one connected thing.
 */
const Link: React.FC<{
  width: number;
  unit: number;
  accentColor: string;
  previewAt: number;
}> = ({ width, unit, accentColor, previewAt }) => {
  const frame = useCurrentFrame();
  const since = frame - previewAt;
  const phase = since >= 0 ? (since % LINK_CYCLE) / LINK_CYCLE : -1;

  return (
    <div
      style={{
        width,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6 * unit,
      }}
    >
      {[0, 1, 2].map((index) => {
        const target = index / 3;
        const distance = Math.min(
          Math.abs(phase - target),
          Math.abs(phase - target + 1),
          Math.abs(phase - target - 1),
        );
        const lit = phase < 0 ? 0 : Math.max(0, 1 - distance * 4);

        return (
          <div
            key={index}
            style={{
              width: 7 * unit,
              height: 7 * unit,
              borderRadius: "50%",
              background: accentColor,
              opacity: interpolate(lit, [0, 1], [0.14, 1], clamp),
              scale: interpolate(lit, [0, 1], [0.8, 1.35], {
                ...clamp,
                output: "perceptual-scale",
              }),
            }}
          />
        );
      })}
    </div>
  );
};

/**
 * A scene rendered at composition size, scaled down and centred inside a pane.
 * The scene still reads `useVideoConfig()`, so it has to be laid out full size
 * and then scaled — anything smaller and its own internal sizing goes wrong.
 */
const Stage: React.FC<{
  paneW: number;
  paneH: number;
  scale: number;
  children: React.ReactNode;
}> = ({ paneW, paneH, scale, children }) => {
  const { width, height } = useVideoConfig();

  return (
    <div
      style={{
        position: "absolute",
        left: (paneW - width * scale) / 2,
        top: (paneH - height * scale) / 2,
        width,
        height,
        transformOrigin: "top left",
        scale,
      }}
    >
      {children}
    </div>
  );
};

const Pane: React.FC<{
  width: number;
  height: number;
  unit: number;
  accentColor: string;
  children: React.ReactNode;
}> = ({ width, height, unit, accentColor, children }) => (
  <div
    style={{
      width,
      height,
      position: "relative",
      overflow: "hidden",
      borderRadius: 18 * unit,
      border: `1px solid ${accentColor}26`,
      background: "#0b0b14",
    }}
  >
    {children}
  </div>
);

const PreviewPane: React.FC<{
  width: number;
  height: number;
  chromeH: number;
  unit: number;
  accentColor: string;
  previewAt: number;
  children: React.ReactNode;
}> = ({ width, height, chromeH, unit, accentColor, previewAt, children }) => {
  const frame = useCurrentFrame();
  const since = frame - previewAt;
  const live = since >= 0;

  // The pane lights up on the frame the code lands, then the playhead walks
  // each replay — so the right half is never a still image.
  const wake = interpolate(frame, [previewAt, previewAt + 8], [0, 1], {
    easing: EASING.enter,
    ...clamp,
  });
  const playhead = live ? ((since % PREVIEW_LOOP) + 1) / PREVIEW_LOOP : 0;
  /** The pane's ring takes the accent as the first render lands. */
  const ringAlpha = Math.round(0x14 + wake * (0x57 - 0x14))
    .toString(16)
    .padStart(2, "0");

  return (
    <div
      style={{
        width,
        borderRadius: 18 * unit,
        overflow: "hidden",
        border: `1px solid ${accentColor}${ringAlpha}`,
        background: "#0b0b14",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          height: chromeH,
          display: "flex",
          alignItems: "center",
          gap: 9 * unit,
          padding: `0 ${13 * unit}px`,
          borderBottom: "1px solid rgba(250,250,250,0.09)",
          background: "rgba(250,250,250,0.04)",
        }}
      >
        <div
          style={{
            width: 8 * unit,
            height: 8 * unit,
            borderRadius: "50%",
            background: accentColor,
            opacity: interpolate(wake, [0, 1], [0.24, 1]),
          }}
        />
        <span
          style={{
            color: "rgba(250,250,250,0.62)",
            fontSize: 14 * unit,
            fontWeight: 600,
            letterSpacing: "0.02em",
          }}
        >
          Preview
        </span>
        <span
          style={{
            marginLeft: "auto",
            color: live ? accentColor : "rgba(250,250,250,0.34)",
            fontSize: 12 * unit,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {live ? "Live" : "Idle"}
        </span>
      </div>

      <div
        style={{
          width,
          height,
          position: "relative",
          overflow: "hidden",
          background: "#0b0b14",
        }}
      >
        <div style={{ opacity: wake }}>{children}</div>
        {live ? null : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              color: "rgba(250,250,250,0.3)",
              fontSize: 15 * unit,
              fontWeight: 500,
            }}
          >
            Awaiting first render
          </div>
        )}
      </div>

      <div style={{ height: 4 * unit, background: "rgba(250,250,250,0.07)" }}>
        <div
          style={{
            height: "100%",
            width: `${playhead * 100}%`,
            background: accentColor,
            opacity: wake,
          }}
        />
      </div>
    </div>
  );
};
