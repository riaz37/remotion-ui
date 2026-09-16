import { Composition } from "remotion";
import {
  README_HERO_DURATION,
  README_HERO_FPS,
  README_HERO_HEIGHT,
  README_HERO_WIDTH,
  ReadmeHero,
} from "./readme-hero";

/**
 * The README hero is a marketing asset, not a registry component. It lives here
 * rather than in `registry.json` for the same reason the promo clips do: nobody
 * installs it, and it must never inflate the 206 the README quotes.
 *
 * Size, fps and length are imported rather than retyped. A duplicated duration
 * is how the loop silently acquires a seam — the composition is the one source
 * of truth and the generator reads the same constants.
 */
export const ReadmeHeroRoot: React.FC = () => (
  <Composition
    id="ReadmeHero"
    component={ReadmeHero}
    durationInFrames={README_HERO_DURATION}
    fps={README_HERO_FPS}
    width={README_HERO_WIDTH}
    height={README_HERO_HEIGHT}
  />
);
