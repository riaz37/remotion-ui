import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { useCameraTransform } from "./camera";
import { AppScreen } from "./app-screen";
import { Captions } from "./captions";
import { Pointer } from "./pointer";
import { COMPOSITION } from "./screen";
import { DURATION_IN_FRAMES } from "./timeline";

/**
 * launch-film — one run of Kine, told in the frames it actually produced.
 *
 * Brief → run → a real video of remotionui.com → Inspect → pick one element →
 * say what to change → the change lands, named, with the file and the lines it
 * touched and the beats that came back byte for byte.
 *
 * The stills are the whole truth of the interface. The film adds a camera, a
 * cursor and captions on top, and cuts the minutes the run really took — with
 * a chip that says so, never a timer running faster than it did.
 */

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const LaunchFilm: React.FC = () => {
  const frame = useCurrentFrame();
  const transform = useCameraTransform(frame);

  // Open and close on black so the film can be dropped straight onto a page.
  const wash = interpolate(
    frame,
    [0, 14, DURATION_IN_FRAMES - 12, DURATION_IN_FRAMES],
    [1, 0, 0, 1],
    clamp,
  );

  return (
    <AbsoluteFill style={{ background: "#050403" }}>
      <AbsoluteFill
        style={{
          width: COMPOSITION.width,
          height: COMPOSITION.height,
          transform,
          transformOrigin: "0 0",
        }}
      >
        <AppScreen />
        <Pointer />
      </AbsoluteFill>

      <Captions />

      <AbsoluteFill style={{ background: "#050403", opacity: wash }} />
    </AbsoluteFill>
  );
};
