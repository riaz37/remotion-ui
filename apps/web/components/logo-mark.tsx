/** RemotionUI mark — offset frames + play (source you own). */
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect width="32" height="32" rx="8" className="fill-fd-primary" />
      <g transform="translate(-1.5 -1)">
        <rect
          x="5"
          y="6"
          width="18"
          height="13"
          rx="3"
          className="stroke-fd-primary-foreground"
          strokeWidth="1.25"
          fill="none"
          opacity="0.35"
        />
        <rect
          x="9"
          y="10"
          width="18"
          height="13"
          rx="3"
          className="fill-fd-background stroke-fd-primary-foreground"
          strokeWidth="1.5"
          opacity="0.95"
        />
        <path
          d="M15.5 14.5v5l4.5-2.5-4.5-2.5z"
          className="fill-fd-primary"
        />
      </g>
    </svg>
  );
}
