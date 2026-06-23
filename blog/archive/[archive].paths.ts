import { readAllPosts } from "../../.vitepress/blog-posts-fs";

export default {
  paths() {
    const posts = readAllPosts();
    const months = new Set<string>();
    for (const post of posts) {
      months.add(`${post.year}-${post.month}`);
    }
    const result = [...months].map((archive) => ({ params: { archive } }));
    if (result.length === 0) {
      result.push({ params: { archive: "1970-01" } });
    }
    return result;
  },
};
