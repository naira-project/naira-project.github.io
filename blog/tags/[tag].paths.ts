import { readAllPosts } from "../../.vitepress/blog-posts-fs";

export default {
  paths() {
    const posts = readAllPosts();
    const tags = new Set<string>();
    for (const post of posts) {
      for (const tag of post.tags) {
        tags.add(tag);
      }
    }
    const result = [...tags].map((tag) => ({ params: { tag } }));
    if (result.length === 0) {
      result.push({ params: { tag: "untagged" } });
    }
    return result;
  },
};
