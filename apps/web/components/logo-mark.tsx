export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect width="32" height="32" rx="7" className="fill-fd-primary" />
      <rect
        x="5"
        y="7"
        width="22"
        height="18"
        rx="3"
        className="stroke-fd-primary-foreground"
        strokeWidth="1.5"
        fill="none"
        opacity="0.9"
      />
      <path
        d="M14 12.5v7l6-3.5-6-3.5z"
        className="fill-fd-primary-foreground"
      />
    </svg>
  );
}
