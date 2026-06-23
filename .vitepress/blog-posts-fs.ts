import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

export interface PostMeta {
  slug: string;
  title: string;
  date: Date;
  year: string;
  month: string;
  author: string;
  tags: string[];
}

const POSTS_DIR = fileURLToPath(new URL("../blog/posts/", import.meta.url));

function parseFrontmatter(raw: string): Record<string, unknown> {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const out: Record<string, unknown> = {};
  const lines = match[1].split(/\r?\n/);
  let listKey: string | null = null;
  let listValues: string[] | null = null;
  for (const line of lines) {
    if (listKey && /^\s+-\s+/.test(line)) {
      const v = line.replace(/^\s+-\s+/, "").trim().replace(/^["']|["']$/g, "");
      listValues!.push(v);
      continue;
    }
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m) {
      listKey = null;
      listValues = null;
      const key = m[1];
      const rawVal = m[2].trim();
      if (rawVal === "") {
        listKey = key;
        listValues = [];
        out[key] = listValues;
      } else {
        out[key] = rawVal.replace(/^["']|["']$/g, "");
      }
    }
  }
  return out;
}

export function readAllPosts(): PostMeta[] {
  if (!existsSync(POSTS_DIR)) return [];
  const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
  const posts: PostMeta[] = [];
  for (const file of files) {
    const raw = readFileSync(`${POSTS_DIR}${file}`, "utf8");
    const fm = parseFrontmatter(raw);
    const slug = file.replace(/\.md$/, "");
    const dateRaw = (fm.date as string) ?? "1970-01-01";
    const date = new Date(dateRaw);
    const tags = Array.isArray(fm.tags) ? (fm.tags as string[]) : [];
    posts.push({
      slug,
      title: (fm.title as string) ?? slug,
      date,
      year: String(date.getUTCFullYear()),
      month: String(date.getUTCMonth() + 1).padStart(2, "0"),
      author: (fm.author as string) ?? "Naira",
      tags,
    });
  }
  return posts.sort((a, b) => +b.date - +a.date);
}
