---
title: Tags
description: Browse blog posts by tag.
---

<script setup>
import { computed } from "vue";
import { withBase } from "vitepress";
import { data as posts } from "../../.vitepress/blog.data";

const tagCounts = computed(() => {
  const counts = new Map();
  for (const post of posts) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) =>
    b[1] - a[1] || a[0].localeCompare(b[0]),
  );
});
</script>

# Tags

Browse posts by tag.

<ul class="tag-list">
  <li v-for="[tag, count] in tagCounts" :key="tag">
    <a :href="withBase(`/blog/tags/${encodeURIComponent(tag)}`)">
      #{{ tag }} <span class="count">({{ count }})</span>
    </a>
  </li>
  <li v-if="!tagCounts.length" class="empty">No tags yet.</li>
</ul>

<p style="margin-top: 24px;"><a href="/blog/">← Back to blog</a></p>

<style scoped>
.tag-list {
  list-style: none;
  padding: 0;
  margin: 24px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-list li a {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  text-decoration: none;
  color: var(--vp-c-text-1);
  font-size: 14px;
  transition: border-color 0.25s, color 0.25s;
}

.tag-list li a:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.tag-list .count {
  color: var(--vp-c-text-2);
  font-size: 12px;
}

.tag-list .empty {
  color: var(--vp-c-text-2);
  font-style: italic;
}
</style>
