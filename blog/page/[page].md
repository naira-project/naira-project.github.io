---
title: Blog
description: News, deep dives, and updates from the Naira project.
---

<script setup>
import { useData } from "vitepress";
import { computed } from "vue";
import { data as posts } from "../../.vitepress/blog.data";
import { POSTS_PER_PAGE } from "../../.vitepress/blog-config";

const { params } = useData();
const current = computed(() => Number(params.value.page) || 1);
const totalPages = computed(() => Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE)));
const pagePosts = computed(() => {
  const start = (current.value - 1) * POSTS_PER_PAGE;
  return posts.slice(start, start + POSTS_PER_PAGE);
});
</script>

# Blog — page {{ $params.page }}

<PostList :posts="pagePosts" />

<Pagination :current="current" :total="totalPages" base-path="/blog/" />

<p style="margin-top: 24px; color: var(--vp-c-text-2);">
  Browse by
  <a href="/blog/tags">tags</a> ·
  <a href="/blog/authors">authors</a> ·
  <a href="/blog/archive">archive</a>
</p>
