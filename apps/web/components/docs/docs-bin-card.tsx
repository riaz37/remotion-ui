import Link from "next/link";

type DocsBinCardProps = {
  title: string;
  description: string;
  href: string;
};

export function DocsBinCard({ title, description, href }: DocsBinCardProps) {
  return (
    <Link
      href={href}
      className="group block rounded-md border border-[var(--bay-border)] border-l-2 border-l-[var(--bay-phosphor)] bg-[var(--bay-surface)] px-4 py-4 transition-colors hover:border-[var(--bay-border-strong)]"
    >
      <p className="font-[family-name:var(--font-display)] text-base font-medium tracking-tight text-fd-foreground">
        {title}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-fd-muted-foreground">
        {description}
      </p>
    </Link>
  );
}
