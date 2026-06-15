import { RenderQueueStrip } from "@/components/landing/render-queue-strip";
import { InitCommand } from "@/components/install-command";

const STEPS = [
  {
    step: 1,
    label: "Initialize",
    command: "npx remotion-ui@latest init my-video --starter social",
    showPmTabs: true,
  },
  {
    step: 2,
    label: "Add composition",
    command: "npx remotion-ui@latest add fade-in",
  },
  {
    step: 3,
    label: "Render",
    command: "npx remotion render src/Root.tsx SocialClip out/social-clip.mp4",
  },
] as const;

export function InstallationSteps() {
  return (
    <div className="not-prose my-8 space-y-8">
      <InitCommand />
      <RenderQueueStrip steps={STEPS} outputPath="out/social-clip.mp4" />
    </div>
  );
}
