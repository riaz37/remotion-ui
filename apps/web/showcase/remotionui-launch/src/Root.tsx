import { Composition } from "remotion";
import { z } from "zod";
import { RemotionUILaunch, launchFilmSchema } from "./LaunchFilm";
import { LaunchTile } from "./LaunchTile";
import { LaunchHeroCheck } from "./LaunchHeroCheck";
import { DURATION_IN_FRAMES, FPS, HEIGHT, WIDTH } from "./timeline";

/**
 * The RemotionUI launch film. A showcase, not a registry component: it lives
 * in showcase/ so it never reaches registry.json.
 *
 * LaunchHeroCheck is QA only: the film's hero plane head-on at 1:1, frame for
 * frame with the film, to compare against a live capture of remotionui.com.
 * LaunchTile renders the wall tiles for components with no poster in
 * public/previews (see scripts/render-tiles.sh).
 */
export const RemotionUILaunchRoot: React.FC = () => (
  <>
    <Composition
      id="RemotionUILaunch"
      component={RemotionUILaunch}
      schema={launchFilmSchema}
      defaultProps={{ motionBlur: true }}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
    <Composition
      id="LaunchHeroCheck"
      component={LaunchHeroCheck}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
    <Composition
      id="LaunchTile"
      component={LaunchTile}
      schema={z.object({ slug: z.string() })}
      defaultProps={{ slug: "matrix-decode" }}
      durationInFrames={150}
      fps={FPS}
      width={960}
      height={540}
    />
  </>
);
