import { readAllPosts } from "../../.vitepress/blog-posts-fs";
import { POSTS_PER_PAGE } from "../../.vitepress/blog-config";

export default {
  paths() {
    const posts = readAllPosts();
    const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
    const result: { params: { page: string } }[] = [];
    // Page 1 lives at /blog/, so emit pages 2..N here.
    for (let page = 2; page <= totalPages; page++) {
      result.push({ params: { page: String(page) } });
    }
    return result;
  },
};
