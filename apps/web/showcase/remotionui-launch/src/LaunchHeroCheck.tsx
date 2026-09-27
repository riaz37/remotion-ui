import { AbsoluteFill, useCurrentFrame } from "remotion";
import { HeroScreen } from "./world/Screens";

/**
 * QA only. The film's hero plane head-on at 1:1 (no camera, tilt, cursor or
 * grain), on the same frame clock as the film, so a still of it lines up
 * pixel for pixel with a 1920×1080 capture of the live remotionui.com hero.
 */
export const LaunchHeroCheck: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#060605" }}>
      <HeroScreen frame={frame} flat />
    </AbsoluteFill>
  );
};
