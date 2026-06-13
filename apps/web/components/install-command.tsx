import { CopyButton } from "./copy-button";

function CommandBlock({
  label,
  command,
  className = "my-6",
}: {
  label: string;
  command: string;
  className?: string;
}) {
  return (
    <div
      className={`not-prose overflow-hidden rounded-xl border border-fd-border bg-fd-card ${className}`}
    >
      <div className="flex items-center justify-between border-b border-fd-border px-4 py-2.5">
        <span className="text-sm font-medium text-fd-foreground">{label}</span>
        <CopyButton text={command} />
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className="font-[family-name:var(--font-mono)] text-fd-foreground">
          {command}
        </code>
      </pre>
    </div>
  );
}

export function InstallCommand({
  name,
  label = "Install",
}: {
  name: string;
  label?: string;
}) {
  return (
    <CommandBlock
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
  return (
    <div
      className={`not-prose flex items-center justify-between gap-3 overflow-hidden rounded-lg border border-fd-border bg-fd-card/90 px-3 py-2 ${className}`}
    >
      <code className="min-w-0 truncate font-[family-name:var(--font-mono)] text-[0.8125rem] text-fd-foreground">
        {command}
      </code>
      <CopyButton text={command} />
    </div>
  );
}

export function InitCommand() {
  return (
    <CommandBlock
      label="Quick start"
      command="npx remotion-ui@latest init my-video"
      className=""
    />
  );
}

export function RenderCommand({
  compositionId = "SocialClip",
}: {
  compositionId?: string;
}) {
  return (
    <CommandBlock
      label="Render"
      command={`npx remotion render src/index.ts ${compositionId} out/${compositionId.toLowerCase()}.mp4`}
      className=""
    />
  );
}
