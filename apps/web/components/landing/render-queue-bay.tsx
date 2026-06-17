"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CopyButton } from "@/components/copy-button";

type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

const PM_LABELS: Record<PackageManager, string> = {
  pnpm: "pnpm",
  npm: "npm",
  yarn: "yarn",
  bun: "bun",
};

const STEP_MS = 3800;
const MANUAL_RESUME_MS = 10000;
const TOTAL_FRAMES = 900;

function formatCommand(base: string, pm: PackageManager): string {
  if (pm === "npm") return base;
  if (pm === "pnpm") return base.replace(/^npx /, "pnpm dlx ");
  if (pm === "yarn") return base.replace(/^npx /, "yarn dlx ");
  return base.replace(/^npx /, "bunx ");
}

export type RenderQueueStep = {
  step: number;
  label: string;
  command: string;
  showPmTabs?: boolean;
};

type RenderQueueBayProps = {
  steps: readonly RenderQueueStep[];
  outputPath: string;
};

type JobStatus = "queued" | "active" | "done";
type PlaybackMode = "auto" | "manual";

function jobStatus(index: number, activeIndex: number): JobStatus {
  if (index < activeIndex) return "done";
  if (index === activeIndex) return "active";
  return "queued";
}

function statusLabel(status: JobStatus, isOutput: boolean): string {
  if (status === "done") return isOutput ? "READY" : "DONE";
  if (status === "active") return isOutput ? "EXPORTING" : "RUNNING";
  return "QUEUED";
}

function StatusLight({ status }: { status: JobStatus }) {
  if (status === "done") {
    return (
      <span
        className="size-2 shrink-0 rounded-full bg-[var(--bay-phosphor)]"
        aria-hidden
      />
    );
  }

  if (status === "active") {
    return (
      <span className="relative flex size-2 shrink-0" aria-hidden>
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--bay-record)] opacity-60 motion-reduce:animate-none" />
        <span className="relative inline-flex size-2 rounded-full bg-[var(--bay-record)]" />
      </span>
    );
  }

  return (
    <span
      className="size-2 shrink-0 rounded-full border border-[var(--bay-border-strong)] bg-transparent"
      aria-hidden
    />
  );
}

function BayChrome({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--bay-border-strong)] bg-[var(--bay-surface)] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.65)]">
      <div className="frame-ruler h-3 border-b border-[var(--bay-border)]" aria-hidden />
      <div className="flex items-center justify-between gap-4 border-b border-[var(--bay-border)] px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate font-[family-name:var(--font-mono)] text-[0.6875rem] font-medium text-fd-foreground">
            media-encoder
          </span>
          <span className="hidden text-fd-muted-foreground sm:inline">·</span>
          <span className="hidden truncate font-[family-name:var(--font-mono)] text-[0.6875rem] text-fd-muted-foreground sm:inline">
            render-queue
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="relative flex size-2" aria-hidden>
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--bay-record)] opacity-50 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-[var(--bay-record)]" />
          </span>
          <span className="text-mono-xs text-[var(--bay-record)]">ARMED</span>
        </div>
      </div>
      {children}
    </div>
  );
}

function JobRow({
  jobId,
  title,
  status,
  active,
  onSelect,
}: {
  jobId: string;
  title: string;
  status: JobStatus;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-start gap-3 border-l-2 px-4 py-3 text-left transition-colors ${
        active
          ? "border-[var(--bay-phosphor)] bg-[var(--bay-surface-raised)]"
          : "border-transparent hover:bg-[var(--bay-surface-raised)]/70"
      }`}
    >
      <StatusLight status={status} />
      <span className="min-w-0">
        <span className="text-mono-xs text-fd-muted-foreground">{jobId}</span>
        <span className="mt-0.5 block truncate text-sm font-medium text-fd-foreground">
          {title}
        </span>
      </span>
    </button>
  );
}

function TypedCommand({ command }: { command: string }) {
  const [visibleChars, setVisibleChars] = useState(0);

  useEffect(() => {
    setVisibleChars(0);

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) {
      setVisibleChars(command.length);
      return;
    }

    let index = 0;
    const id = window.setInterval(() => {
      index += 1;
      setVisibleChars(index);
      if (index >= command.length) {
        window.clearInterval(id);
      }
    }, 18);

    return () => window.clearInterval(id);
  }, [command]);

  const visible = command.slice(0, visibleChars);

  return (
    <code className="block whitespace-pre-wrap break-all font-[family-name:var(--font-mono)] text-[0.8125rem] leading-relaxed text-fd-foreground">
      <span className="text-[var(--bay-phosphor)]">$ </span>
      {visible}
      {visibleChars < command.length ? (
        <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-[var(--bay-phosphor)] motion-reduce:animate-none" />
      ) : null}
    </code>
  );
}

function DetailPanel({
  step,
  label,
  command,
  showPmTabs,
  outputPath,
  isOutput,
  status,
  panelKey,
}: {
  step?: number;
  label: string;
  command?: string;
  showPmTabs?: boolean;
  outputPath?: string;
  isOutput?: boolean;
  status: JobStatus;
  panelKey: string;
}) {
  const [pm, setPm] = useState<PackageManager>("npm");
  const displayCommand = command && showPmTabs ? formatCommand(command, pm) : command;

  return (
    <div
      key={panelKey}
      className="queue-panel-in flex h-[332px] flex-col"
    >
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--bay-border)] px-5 py-4">
        <div>
          <p className="text-mono-xs text-fd-muted-foreground">
            {isOutput ? "DELIVERABLE" : `JOB ${step ? String(step).padStart(2, "0") : ""}`}
          </p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl font-medium tracking-tight text-fd-foreground">
            {label}
          </h3>
        </div>
        <span
          className={`text-mono-xs shrink-0 rounded-sm border px-2 py-1 ${
            status === "active"
              ? "border-[var(--bay-record)]/40 text-[var(--bay-record)]"
              : status === "done"
                ? "border-[var(--bay-phosphor)]/40 text-[var(--bay-phosphor)]"
                : "border-[var(--bay-border)] text-fd-muted-foreground"
          }`}
        >
          {statusLabel(status, Boolean(isOutput))}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-10 shrink-0 items-center border-b border-[var(--bay-border)] px-5">
          {showPmTabs ? (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {(Object.keys(PM_LABELS) as PackageManager[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPm(key)}
                  className={`text-mono-xs transition-colors ${
                    pm === key
                      ? "text-[var(--bay-phosphor)] underline underline-offset-4"
                      : "text-fd-muted-foreground hover:text-fd-foreground"
                  }`}
                >
                  {PM_LABELS[key]}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-5">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-[var(--bay-border)] bg-[var(--bay-stage)]">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--bay-border)] px-4 py-2.5">
              <span className="text-mono-xs text-fd-muted-foreground">
                {isOutput ? "export" : "shell"}
              </span>
              {!isOutput && displayCommand ? (
                <CopyButton text={displayCommand} />
              ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
              {isOutput ? (
                <OutputBody outputPath={outputPath ?? ""} />
              ) : displayCommand ? (
                <TypedCommand command={displayCommand} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OutputBody({ outputPath }: { outputPath: string }) {
  return (
    <div className="flex h-full min-h-[148px] flex-col justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-[var(--bay-border-strong)] bg-[var(--bay-surface)]">
          <FilmIcon />
        </div>
        <div className="min-w-0">
          <p className="truncate font-[family-name:var(--font-mono)] text-sm text-fd-foreground">
            {outputPath}
          </p>
          <p className="mt-1 text-mono-xs text-fd-muted-foreground">
            H.264 · 1080×1920 · 30fps
          </p>
        </div>
      </div>

      <div className="flex items-end gap-1 overflow-hidden" aria-hidden>
        {Array.from({ length: 10 }).map((_, index) => (
          <div
            key={index}
            className="h-12 w-7 shrink-0 rounded-[2px] bg-[var(--bay-phosphor)] motion-safe:animate-pulse motion-reduce:animate-none"
            style={{
              opacity: 0.16 + (index % 4) * 0.08,
              animationDelay: `${index * 100}ms`,
            }}
          />
        ))}
      </div>

      <div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bay-border)]">
          <div className="h-full w-full rounded-full bg-[var(--bay-phosphor)]" />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-fd-muted-foreground">
          Composition exported — ready to publish.
        </p>
      </div>
    </div>
  );
}

function QueueFooter({
  activeIndex,
  totalSteps,
  outputPath,
  stepProgress,
}: {
  activeIndex: number;
  totalSteps: number;
  outputPath: string;
  stepProgress: number;
}) {
  const slots = totalSteps + 1;
  const overallProgress =
    ((activeIndex + stepProgress / 100) / slots) * 100;

  const frameBase = Math.round((overallProgress / 100) * TOTAL_FRAMES);
  const frameLabel = `${frameBase} / ${TOTAL_FRAMES}f`;

  return (
    <div className="border-t border-[var(--bay-border)] bg-[var(--bay-surface-raised)]/40 px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-mono-xs text-fd-muted-foreground">
          Auto-advancing queue
        </span>
        <span className="text-mono-xs text-fd-muted-foreground">
          {Math.round(overallProgress)}%
        </span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bay-border)]">
            <div
              className="h-full rounded-full bg-[var(--bay-phosphor)] transition-[width] duration-150 ease-linear motion-reduce:transition-none"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
        <span className="text-mono-xs shrink-0 text-fd-muted-foreground">{frameLabel}</span>
        <span className="truncate font-[family-name:var(--font-mono)] text-[0.6875rem] text-[var(--bay-phosphor)] sm:max-w-[220px]">
          {outputPath}
        </span>
      </div>
    </div>
  );
}

function FilmIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-[var(--bay-phosphor)]"
      />
      <path
        d="M7 5v14M17 5v14M3 10h4M3 14h4M17 10h4M17 14h4"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-[var(--bay-phosphor)]"
      />
    </svg>
  );
}

export function RenderQueueBay({ steps, outputPath }: RenderQueueBayProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [playback, setPlayback] = useState<PlaybackMode>("auto");
  const [isVisible, setIsVisible] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const resumeTimerRef = useRef<number | null>(null);
  const activeIndexRef = useRef(0);
  const stepStartedAtRef = useRef(0);

  const slotCount = steps.length + 1;
  const outputIndex = steps.length;
  const isOutput = activeIndex === outputIndex;
  const activeStep = !isOutput ? steps[activeIndex] : undefined;
  const activeStatus: JobStatus = "active";

  activeIndexRef.current = activeIndex;

  const scheduleAutoResume = () => {
    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = window.setTimeout(() => {
      stepStartedAtRef.current = Date.now();
      setPlayback("auto");
      setStepProgress(0);
      resumeTimerRef.current = null;
    }, MANUAL_RESUME_MS);
  };

  const selectJob = (index: number) => {
    activeIndexRef.current = index;
    stepStartedAtRef.current = Date.now();
    setActiveIndex(index);
    setStepProgress(0);
    setPlayback("manual");
    scheduleAutoResume();
  };

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry?.isIntersecting ?? true),
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) {
        window.clearTimeout(resumeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (playback !== "auto" || !isVisible) return;

    stepStartedAtRef.current = Date.now();
    const tickMs = 50;

    const id = window.setInterval(() => {
      const elapsed = Date.now() - stepStartedAtRef.current;
      const progress = Math.min(100, (elapsed / STEP_MS) * 100);
      setStepProgress(progress);

      if (elapsed < STEP_MS) return;

      stepStartedAtRef.current = Date.now();
      const nextIndex = (activeIndexRef.current + 1) % slotCount;
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      setStepProgress(0);
    }, tickMs);

    return () => window.clearInterval(id);
  }, [playback, isVisible, slotCount]);

  return (
    <div ref={rootRef}>
      <BayChrome>
        <div className="grid min-h-0 lg:grid-cols-[minmax(200px,240px)_minmax(0,1fr)]">
          <div className="border-b border-[var(--bay-border)] lg:border-b-0 lg:border-r">
            <p className="border-b border-[var(--bay-border)] px-4 py-2 text-mono-xs text-fd-muted-foreground">
              Jobs
            </p>
            <div className="divide-y divide-[var(--bay-border)]">
              {steps.map((item, index) => (
                <JobRow
                  key={item.step}
                  jobId={`JOB ${String(item.step).padStart(2, "0")}`}
                  title={item.label}
                  status={jobStatus(index, activeIndex)}
                  active={activeIndex === index}
                  onSelect={() => selectJob(index)}
                />
              ))}
              <JobRow
                jobId="OUTPUT"
                title="Export MP4"
                status={isOutput ? "active" : "queued"}
                active={isOutput}
                onSelect={() => selectJob(outputIndex)}
              />
            </div>
          </div>

          <div className="relative h-[332px] overflow-hidden">
            <DetailPanel
              panelKey={`${activeIndex}-${activeStep?.command ?? "output"}`}
              step={activeStep?.step}
              label={isOutput ? "Ready to ship" : activeStep?.label ?? ""}
              command={activeStep?.command}
              showPmTabs={activeStep?.showPmTabs}
              outputPath={outputPath}
              isOutput={isOutput}
              status={activeStatus}
            />
          </div>
        </div>

        <QueueFooter
          activeIndex={activeIndex}
          totalSteps={steps.length}
          outputPath={outputPath}
          stepProgress={stepProgress}
        />
      </BayChrome>
    </div>
  );
}
