import {
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { LANDMARK } from "./screen";
import { PLAYBACK } from "./timeline";

/**
 * player-video — the one thing the stills cannot carry: the video playing.
 *
 * The film's whole claim is that a brief becomes a real video of a real site.
 * Asserting that over a frozen PNG of a player reading `0:00 / 0:10` is the
 * weakest frame in the cut, and it costs nothing to fix: the Remotion project
 * this run generated survived, and rendering it is free — no model calls, no
 * gateway. That MP4 is `public/launch-film/demo-after.mp4`, and this composites
 * it into the player's own rectangle, measured off the capture.
 *
 * Nothing is faked here either. The clip is the run's own output at its own
 * speed, it starts on the frame the still already shows paused, and it stops
 * before the Inspect pick, which is authored against that paused frame.
 */

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const PlayerVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const box = LANDMARK.playerCanvas;

  if (frame < PLAYBACK.start || frame >= PLAYBACK.end + PLAYBACK.fade) {
    return null;
  }

  // Only the tail fades: the head is a straight cut, because the first video
  // frame and the still underneath it are the same picture.
  const opacity = interpolate(
    frame,
    [PLAYBACK.end, PLAYBACK.end + PLAYBACK.fade],
    [1, 0],
    clamp,
  );

  return (
    <Sequence from={PLAYBACK.start} layout="none">
      <div
        style={{
          position: "absolute",
          left: box.x,
          top: box.y,
          width: box.width,
          height: box.height,
          overflow: "hidden",
          opacity,
        }}
      >
        <OffthreadVideo
          src={staticFile("launch-film/demo-after.mp4")}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    </Sequence>
  );
};
