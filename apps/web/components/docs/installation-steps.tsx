import { RenderQueueStrip } from "@/components/landing/render-queue-strip";
import { CLI_PACKAGE, cliAddCommand } from "@/lib/docs-cli";

const STEPS = [
  {
    step: 1,
    label: "Initialize",
    command: `${CLI_PACKAGE} init my-video --starter social`,
    showPmTabs: true,
  },
  {
    step: 2,
    label: "Add",
    command: cliAddCommand("social-clip"),
  },
  {
    step: 3,
    label: "Render",
    command: "npx remotion render src/Root.tsx SocialClip out/social-clip.mp4",
  },
] as const;

export function InstallationSteps() {
  return (
    <div className="not-prose my-8">
      <RenderQueueStrip
        steps={STEPS}
        outputPath="out/social-clip.mp4"
        layout="vertical"
      />
    </div>
  );
}
