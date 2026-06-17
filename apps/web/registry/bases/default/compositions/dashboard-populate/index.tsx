import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { AnimatedBarChart } from "@/remotion/scenes/animated-bar-chart";
import { MetricTicker } from "@/remotion/scenes/metric-ticker";
import { DELAY } from "@/remotion/lib/motion-tokens";

const BAR_DATA = [
  { label: "Mon", value: 42 },
  { label: "Tue", value: 58 },
  { label: "Wed", value: 71 },
  { label: "Thu", value: 64 },
];

const METRICS = [
  { label: "Active users", value: 12400, suffix: "", delta: "+18%" },
  { label: "Render time", value: 4, suffix: "s", delta: "-12%" },
];

export const DashboardPopulate: React.FC = () => {
  const { fps } = useVideoConfig();
  const premount = Math.round(fps * 0.4) + DELAY.short;

  return (
    <AbsoluteFill style={{ background: "#080810" }}>
      <Sequence durationInFrames={90} premountFor={premount}>
        <MetricTicker metrics={METRICS} title="Dashboard waking up" />
      </Sequence>
      <Sequence from={90} durationInFrames={90} premountFor={premount}>
        <AnimatedBarChart data={BAR_DATA} title="Weekly throughput" />
      </Sequence>
    </AbsoluteFill>
  );
};
