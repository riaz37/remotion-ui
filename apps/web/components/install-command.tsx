import { CommandRail, CompactCommandRail } from "./studio/command-rail";

export function InstallCommand({
  name,
  label = "Install",
}: {
  name: string;
  label?: string;
}) {
  return (
    <CommandRail
      label={label}
      command={`npx remotion-ui@latest add ${name}`}
    />
  );
}

export function CompactInstallCommand({
  command,
  className = "",
}: {
  command: string;
  className?: string;
}) {
  return <CompactCommandRail command={command} className={className} />;
}

export function InitCommand({ starter }: { starter?: "social" | "podcast" }) {
  const command =
    starter === "social"
      ? "npx remotion-ui@latest init my-reel --starter social"
      : starter === "podcast"
        ? "npx remotion-ui@latest init my-podcast --starter podcast"
        : "npx remotion-ui@latest init my-video";
  return <CommandRail label="Quick start" command={command} />;
}

export function RenderCommand({
  compositionId = "SocialClip",
}: {
  compositionId?: string;
}) {
  return (
    <CommandRail
      label="Render"
      command={`npx remotion render src/index.ts ${compositionId} out/${compositionId.toLowerCase()}.mp4`}
    />
  );
}

// Re-export for backwards compatibility
export { CommandRail, CompactCommandRail } from "./studio/command-rail";
