import { blog as blogCollection } from "collections/server";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  /** ISO date, for `<time dateTime>` and RSS. */
  isoDate: string;
  /** e.g. "August 16, 2026" */
  displayDate: string;
  entry: (typeof blogCollection)[number];
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

function slugOf(path: string): string {
  return path.replace(/\.mdx?$/, "").replace(/^.*\//, "");
}

function toPost(entry: (typeof blogCollection)[number]): BlogPost {
  const date = new Date(entry.date);

  return {
    slug: slugOf(entry.info.path),
    title: entry.title,
    description: entry.description,
    date: entry.date,
    author: entry.author,
    tags: entry.tags,
    isoDate: date.toISOString(),
    displayDate: dateFormatter.format(date),
    entry,
  };
}

/** Published posts, newest first. Drafts are excluded outside development. */
export function getBlogPosts(): BlogPost[] {
  return blogCollection
    .filter((entry) => !entry.draft || process.env.NODE_ENV === "development")
    .map(toPost)
    .sort((a, b) => b.isoDate.localeCompare(a.isoDate));
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return getBlogPosts().find((post) => post.slug === slug);
}
