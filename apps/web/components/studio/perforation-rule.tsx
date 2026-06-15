export function PerforationRule({ className = "" }: { className?: string }) {
  return (
    <div
      className={`perforation-rule w-full ${className}`}
      role="separator"
      aria-hidden
    />
  );
}
