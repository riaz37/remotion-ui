"use client";

import { Sequence } from "remotion";
import { TutorialClip } from "../registry-exports";
import { DEMO_APP_PORTRAIT_SRC, DEMO_COPY } from "@/lib/demo-assets";

/**
 * Copy here is the video's copy, not notes to whoever fills the template in.
 * The callout used to read "Name the key action" — an instruction to the
 * author, printed on screen as if it were the script.
 */
export const TutorialClipPreview: React.FC = () => (
  <Sequence from={0}>
    <TutorialClip
      mediaSrc={DEMO_APP_PORTRAIT_SRC}
      mediaWidth={1080}
      mediaHeight={1920}
      title="Show the product path"
      subtitle="One screen, one callout, one code beat"
      mediaTitle="Queue a render"
      mediaCaption="The whole flow is one screen"
      calloutTarget={{ x: 76, y: 1060, width: 928, height: 160 }}
      calloutTitle="Tap Render to queue the job"
      calloutSubtitle="Renders in 4.2s on the free tier."
      code={`npx remotion-ui add media-frame\nnpx remotion-ui add callout-spotlight\nnpx remotion render TutorialClip out.mp4`}
      ctaTitle="Tutorial Cut"
      ctaSubtitle="Install the scenes, keep the source"
      ctaLabel={DEMO_COPY.endCard.ctaLabel}
      ctaUrl="remotionui.com"
    />
  </Sequence>
);
