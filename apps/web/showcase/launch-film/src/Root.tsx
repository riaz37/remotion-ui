import { Composition } from "remotion";
import { LaunchFilm } from "./launch-film";
import { COMPOSITION } from "./screen";
import { DURATION_IN_FRAMES } from "./timeline";

/**
 * The launch film is a marketing clip, not a registry component — it lives
 * here, beside `promo/`, so it never reaches `registry.json`.
 */
export const LaunchFilmRoot: React.FC = () => (
  <Composition
    id="LaunchFilm"
    component={LaunchFilm}
    durationInFrames={DURATION_IN_FRAMES}
    fps={COMPOSITION.fps}
    width={COMPOSITION.width}
    height={COMPOSITION.height}
  />
);
