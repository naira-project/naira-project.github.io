import { readAllPosts } from "../../.vitepress/blog-posts-fs";

export default {
  paths() {
    const posts = readAllPosts();
    const authors = new Set<string>();
    for (const post of posts) {
      if (post.author) authors.add(post.author);
    }
    const result = [...authors].map((author) => ({ params: { author } }));
    if (result.length === 0) {
      result.push({ params: { author: "unknown" } });
    }
    return result;
  },
};
