---
title: Blog
description: News, deep dives, and updates from the Naira project.
---

<script setup>
import { data as posts } from "../.vitepress/blog.data";
import { POSTS_PER_PAGE } from "../.vitepress/blog-config";

const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
const pagePosts = posts.slice(0, POSTS_PER_PAGE);
</script>

# Blog

News, deep dives, and updates from the Naira project.

<PostList :posts="pagePosts" />

<Pagination :current="1" :total="totalPages" base-path="/blog/" />

<p style="margin-top: 24px; color: var(--vp-c-text-2);">
  Browse by
  <a href="/blog/tags">tags</a> ·
  <a href="/blog/authors">authors</a> ·
  <a href="/blog/archive">archive</a>
</p>
