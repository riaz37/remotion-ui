import Link from "next/link";

const primitives = [
  { name: "Fade In", slug: "fade-in" },
  { name: "Fade Out", slug: "fade-out" },
  { name: "Slide Up", slug: "slide-up" },
  { name: "Slide Left", slug: "slide-left" },
  { name: "Scale In", slug: "scale-in" },
  { name: "Typewriter", slug: "typewriter" },
  { name: "Counter", slug: "counter" },
  { name: "Blur In", slug: "blur-in" },
  { name: "Spring In", slug: "spring-in" },
  { name: "Stagger Children", slug: "stagger-children" },
  { name: "Word Highlight", slug: "word-highlight" },
  { name: "Progress Bar", slug: "progress-bar" },
  { name: "Rotate In", slug: "rotate-in" },
  { name: "Transition Fade", slug: "transition-fade" },
  { name: "Transition Slide", slug: "transition-slide" },
];

const scenes = [
  { name: "Lower Third", slug: "lower-third" },
  { name: "Title Card", slug: "title-card" },
  { name: "Feature List", slug: "feature-list" },
  { name: "Stat Card", slug: "stat-card" },
  { name: "Quote Card", slug: "quote-card" },
  { name: "End Card", slug: "end-card" },
];

const compositions = [
  { name: "Intro", slug: "intro" },
  { name: "Showcase", slug: "showcase" },
];

function ComponentGrid({
  items,
  basePath,
}: {
  items: { name: string; slug: string }[];
  basePath: string;
}) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <Link
          key={item.slug}
          href={`${basePath}/${item.slug}`}
          className="rounded-lg border border-fd-border px-4 py-3 transition-colors hover:bg-fd-muted"
        >
          {item.name}
        </Link>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight">RemotionUI</h1>
      <p className="mt-3 text-lg text-fd-muted-foreground">
        The shadcn/ui of Remotion — copy-paste video components you own.
      </p>

      <pre className="mt-8 rounded-lg bg-fd-muted p-4 text-sm">
        <code>npx remotion-ui@latest init my-video</code>
      </pre>

      <div className="mt-12">
        <h2 className="text-xl font-semibold">Primitives</h2>
        <ComponentGrid items={primitives} basePath="/docs/primitives" />
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold">Scenes</h2>
        <ComponentGrid items={scenes} basePath="/docs/scenes" />
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold">Compositions</h2>
        <ComponentGrid items={compositions} basePath="/docs/compositions" />
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href="/docs"
          className="rounded-lg bg-fd-primary px-4 py-2 text-fd-primary-foreground"
        >
          Documentation
        </Link>
        <Link
          href="/docs/installation"
          className="rounded-lg border border-fd-border px-4 py-2"
        >
          Get Started
        </Link>
        <Link
          href="/docs/cli"
          className="rounded-lg border border-fd-border px-4 py-2"
        >
          CLI Reference
        </Link>
      </div>
    </main>
  );
}
