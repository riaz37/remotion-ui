import { Composition } from "remotion";
import {
  ANNOUNCEMENT_CLIP_DURATION,
  AnnouncementClip,
} from "./announcement-clip";
import {
  REGISTRY_LISTING_CLIP_DURATION,
  RegistryListingClip,
} from "./registry-listing-clip";
import {
  STARS_CELEBRATION_DURATION,
  StarsCelebration,
} from "./stars-celebration";

/**
 * Marketing clips are not registry components — nobody installs them. They live
 * here so they never reach `registry.json` and never inflate the component
 * count they are usually quoting.
 */
export const MarketingRoot: React.FC = () => (
  <>
    <Composition
      id="AnnouncementClip"
      component={AnnouncementClip}
      durationInFrames={ANNOUNCEMENT_CLIP_DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="StarsCelebration"
      component={StarsCelebration}
      durationInFrames={STARS_CELEBRATION_DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="RegistryListingClip"
      component={RegistryListingClip}
      durationInFrames={REGISTRY_LISTING_CLIP_DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
