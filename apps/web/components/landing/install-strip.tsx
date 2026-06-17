import { LandingSection } from "@/components/landing/landing-section";
import { RenderQueueBay } from "@/components/landing/render-queue-bay";

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
    command: "npx remotion-ui@latest add social-clip",
  },
  {
    step: 3,
    label: "Render",
    command: "npx remotion render src/Root.tsx SocialClip out/social-clip.mp4",
  },
] as const;

export function InstallStrip() {
  return (
    <LandingSection
      title="Render queue"
      lead="Init a project, add a composition, export an MP4 — three CLI steps, no editor required."
      layout="bin"
    >
      <RenderQueueBay steps={STEPS} outputPath="out/social-clip.mp4" />
    </LandingSection>
  );
}
