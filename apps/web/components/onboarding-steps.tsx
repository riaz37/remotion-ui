import { InitCommand, InstallCommand, RenderCommand } from "./install-command";

const STEPS = [
  {
    step: "1",
    title: "Create a Remotion project",
    body: "Scaffold a new project or bootstrap an existing one.",
    command: <InitCommand />,
  },
  {
    step: "2",
    title: "Add a composition",
    body: "Copy source into your repo and register it in Root.tsx.",
    command: <InstallCommand name="social-clip" label="Add social-clip" />,
  },
  {
    step: "3",
    title: "Open Remotion Studio",
    body: "Preview frames, tweak props, and iterate locally.",
    command: (
      <div className="not-prose overflow-hidden rounded-xl border border-fd-border bg-fd-card">
        <div className="border-b border-fd-border px-4 py-2.5">
          <span className="text-sm font-medium text-fd-foreground">Studio</span>
        </div>
        <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
          <code className="font-[family-name:var(--font-mono)] text-fd-foreground">
            npm run dev
          </code>
        </pre>
      </div>
    ),
  },
  {
    step: "4",
    title: "Render an mp4",
    body: "Export the composition when you are ready to ship.",
    command: <RenderCommand compositionId="SocialClip" />,
  },
] as const;

export function OnboardingSteps() {
  return (
    <section className="border-b border-fd-border">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
            From zero to mp4
          </h2>
          <p className="mt-2 text-fd-muted-foreground">
            Remotion-native workflow: full compositions, not one-off effects.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {STEPS.map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-fd-border bg-fd-card/70 p-5"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-full bg-fd-primary/10 font-[family-name:var(--font-mono)] text-sm font-semibold text-fd-primary">
                  {item.step}
                </span>
                <h3 className="font-semibold">{item.title}</h3>
              </div>
              <p className="mb-4 text-sm text-fd-muted-foreground">{item.body}</p>
              {item.command}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
