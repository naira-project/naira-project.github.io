---
title: Authors
description: Browse blog posts by author.
---

<script setup>
import { computed } from "vue";
import { withBase } from "vitepress";
import { data as posts } from "../../.vitepress/blog.data";

const authors = computed(() => {
  const counts = new Map();
  for (const post of posts) {
    if (!post.author) continue;
    counts.set(post.author, (counts.get(post.author) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
});
</script>

# Authors

Browse posts by author.

<ul class="author-list">
  <li v-for="[name, count] in authors" :key="name">
    <a :href="withBase(`/blog/authors/${encodeURIComponent(name)}`)">
      {{ name }} <span class="count">({{ count }})</span>
    </a>
  </li>
  <li v-if="!authors.length" class="empty">No authors yet.</li>
</ul>

<p style="margin-top: 24px;"><a href="/blog/">← Back to blog</a></p>

<style scoped>
.author-list {
  list-style: none;
  padding: 0;
  margin: 24px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.author-list li a {
  text-decoration: none;
  color: var(--vp-c-text-1);
  font-size: 16px;
}

.author-list li a:hover {
  color: var(--vp-c-brand-1);
}

.author-list .count {
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.author-list .empty {
  color: var(--vp-c-text-2);
  font-style: italic;
}
</style>
