import { LogoMark } from "./logo-mark";

/** Logo mark only — parent nav (Fumadocs HomeLayout/DocsLayout) wraps this in its own link. */
export function SiteLogo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 font-semibold tracking-tight ${className}`}
    >
      <LogoMark className="size-8 shrink-0" />
      <span className="font-[family-name:var(--font-display)] text-[1.05rem]">
        RemotionUI
      </span>
    </span>
  );
}
