import { createContentLoader, type ContentData } from "vitepress";

export interface Post {
  url: string;
  title: string;
  description: string;
  date: string;
  dateFormatted: string;
  year: string;
  month: string;
  author: string;
  tags: string[];
  excerpt: string | undefined;
}

function parseDate(value: unknown): Date {
  if (!value) return new Date(0);
  if (value instanceof Date) return value;
  return new Date(String(value));
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function toPost({ url, frontmatter, excerpt }: ContentData): Post {
  const date = parseDate(frontmatter.date);
  const tags = Array.isArray(frontmatter.tags)
    ? frontmatter.tags.map(String)
    : [];
  return {
    url,
    title: frontmatter.title ?? "Untitled",
    description: frontmatter.description ?? "",
    date: date.toISOString(),
    dateFormatted: formatDate(date),
    year: String(date.getUTCFullYear()),
    month: String(date.getUTCMonth() + 1).padStart(2, "0"),
    author: frontmatter.author ?? "Naira",
    tags,
    excerpt,
  };
}

export function blogLoader() {
  return createContentLoader("blog/posts/*.md", {
    excerpt: true,
    transform(rawData): Post[] {
      return rawData
        .map(toPost)
        .sort((a, b) => +new Date(b.date) - +new Date(a.date));
    },
  });
}
