import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill } from "remotion";
import { grainDissolve } from "./grain-dissolve";

const Panel: React.FC<{ background: string; label: string; color: string }> = ({
  background,
  label,
  color,
}) => (
  <AbsoluteFill
    style={{
      background,
      alignItems: "center",
      justifyContent: "center",
      color,
      fontSize: 128,
      fontWeight: 700,
      letterSpacing: "-0.04em",
      fontFamily: "system-ui, sans-serif",
    }}
  >
    {label}
  </AbsoluteFill>
);

export const GrainDissolveDemo: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={45}>
      <Panel background="#08080c" color="#fafafa" label="Before" />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      presentation={grainDissolve({ grain: 24, softness: 0.45 })}
      timing={linearTiming({ durationInFrames: 30 })}
    />
    <TransitionSeries.Sequence durationInFrames={45}>
      <Panel background="#f4f1ea" color="#111014" label="After" />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
