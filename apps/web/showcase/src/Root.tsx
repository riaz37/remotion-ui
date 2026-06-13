import { Composition } from "remotion";
import { SocialClip } from "@/compositions/social-clip";
import {
  DEMO_AUDIO_SRC,
  DEMO_LOGO_SRC,
  DEMO_SOCIAL_CLIP_CAPTIONS,
} from "@/lib/demo-assets";
import { siteConfig } from "@/lib/site-config";

const socialClipDefaults = {
  audioSrc: DEMO_AUDIO_SRC,
  captions: DEMO_SOCIAL_CLIP_CAPTIONS,
  logoSrc: DEMO_LOGO_SRC,
  hookTitle: "Production-ready motion",
  hookSubtitle: "for Remotion. Source you own.",
  podcastTitle: siteConfig.name,
  ctaTitle: siteConfig.name,
  ctaLabel: "npx remotion-ui add",
  ctaUrl: "remotionui.com",
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SocialClip"
        component={SocialClip}
        durationInFrames={228}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={socialClipDefaults}
      />
    </>
  );
};
