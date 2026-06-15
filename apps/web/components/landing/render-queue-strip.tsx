import { CommandRail } from "@/components/studio/command-rail";

type QueueStep = {
  step: number;
  label: string;
  command: string;
  showPmTabs?: boolean;
};

type RenderQueueStripProps = {
  steps: readonly QueueStep[];
  outputPath: string;
  /** Use vertical stack in narrow docs prose columns. */
  layout?: "horizontal" | "vertical";
};

export function RenderQueueStrip({
  steps,
  outputPath,
  layout = "horizontal",
}: RenderQueueStripProps) {
  const isVertical = layout === "vertical";

  return (
    <div>
      <div
        className={
          isVertical
            ? "flex flex-col gap-6"
            : "flex flex-col gap-6 xl:flex-row xl:items-start"
        }
      >
        {steps.map((item, index) => (
          <div
            key={item.step}
            className={
              isVertical
                ? "min-w-0"
                : "flex min-w-0 w-full items-start gap-4 xl:flex-1"
            }
          >
            <div className="min-w-0 w-full">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="size-2 shrink-0 rounded-full bg-[var(--bay-phosphor)]"
                  aria-hidden
                />
                <span className="text-mono-xs text-fd-muted-foreground">
                  Queue {String(item.step).padStart(2, "0")}
                </span>
              </div>
              <CommandRail
                step={item.step}
                label={item.label}
                command={item.command}
                showPmTabs={item.showPmTabs}
              />
            </div>
            {!isVertical && index < steps.length - 1 ? (
              <div
                className="render-queue-connector mt-11 hidden shrink-0 xl:block"
                aria-hidden
              />
            ) : null}
          </div>
        ))}
        <div className={isVertical ? "min-w-0" : "min-w-0 w-full xl:w-[200px] xl:shrink-0"}>
          <div className="mb-2 flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-full border border-[var(--bay-phosphor)] bg-transparent"
              aria-hidden
            />
            <span className="text-mono-xs text-fd-muted-foreground">Output</span>
          </div>
          <div className="rounded-md border border-[var(--bay-border)] bg-[var(--bay-surface)] px-4 py-3">
            <p className="font-[family-name:var(--font-mono)] text-[0.8125rem] text-fd-foreground">
              {outputPath}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
