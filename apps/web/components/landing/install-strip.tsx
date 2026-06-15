import { CommandRail } from "@/components/studio/command-rail";
import { PerforationRule } from "@/components/studio/perforation-rule";

const STEPS = [
  {
    step: 1,
    label: "Initialize",
    command: "npx remotion-ui@latest init my-video --starter social",
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
    <section className="border-b border-[var(--bay-border)] py-[120px]">
      <div className="mx-auto max-w-[680px] px-6">
        <PerforationRule className="mb-16" />
        <div className="max-w-xl">
          <h2 className="text-display-lg">Ship your first clip</h2>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-fd-muted-foreground">
            Three commands from empty repo to rendered MP4.
          </p>
        </div>
        <div className="mt-10 grid gap-4">
          {STEPS.map((item, index) => (
            <CommandRail
              key={item.step}
              step={item.step}
              label={item.label}
              command={item.command}
              showPmTabs={index === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
