import { CommandRail, CompactCommandRail } from "./studio/command-rail";
import { CLI_PACKAGE, cliAddCommand, cliRecipeCommand } from "@/lib/docs-cli";

function compositionIdToOutputFile(compositionId: string): string {
  return `${compositionId
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase()}.mp4`;
}

export function InstallCommand({
  name,
  label = "Install",
  recipe = false,
}: {
  name: string;
  label?: string;
  recipe?: boolean;
}) {
  const command = recipe ? cliRecipeCommand(name) : cliAddCommand(name);

  return <CommandRail label={label} command={command} />;
}

export function SearchCommand({ query }: { query: string }) {
  return (
    <CommandRail
      label="Search"
      command={`${CLI_PACKAGE} search -q ${query}`}
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
      ? `${CLI_PACKAGE} init my-reel --starter social`
      : starter === "podcast"
        ? `${CLI_PACKAGE} init my-podcast --starter podcast`
        : `${CLI_PACKAGE} init my-video`;
  return <CommandRail label="Quick start" command={command} />;
}

export function RenderCommand({
  compositionId = "SocialClip",
  renderCommand,
}: {
  compositionId?: string;
  renderCommand?: string;
}) {
  const command =
    renderCommand ??
    `npx remotion render src/Root.tsx ${compositionId} out/${compositionIdToOutputFile(compositionId)}`;

  return <CommandRail label="Render" command={command} />;
}

// Re-export for backwards compatibility
export { CommandRail, CompactCommandRail } from "./studio/command-rail";
