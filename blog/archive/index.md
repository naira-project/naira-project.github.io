---
title: Archive
description: Browse blog posts by date.
---

<script setup>
import { computed } from "vue";
import { withBase } from "vitepress";
import { data as posts } from "../../.vitepress/blog.data";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const archive = computed(() => {
  const groups = new Map();
  for (const post of posts) {
    const key = `${post.year}-${post.month}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(post);
  }
  return [...groups.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, items]) => {
      const [year, month] = key.split("-");
      return {
        key,
        year,
        month,
        label: `${MONTHS[parseInt(month, 10) - 1]} ${year}`,
        count: items.length,
      };
    });
});
</script>

# Archive

Browse posts by month.

<ul class="archive-list">
  <li v-for="entry in archive" :key="entry.key">
    <a :href="withBase(`/blog/archive/${entry.key}`)">
      {{ entry.label }} <span class="count">({{ entry.count }})</span>
    </a>
  </li>
  <li v-if="!archive.length" class="empty">No posts yet.</li>
</ul>

<p style="margin-top: 24px;"><a href="/blog/">← Back to blog</a></p>

<style scoped>
.archive-list {
  list-style: none;
  padding: 0;
  margin: 24px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.archive-list li a {
  text-decoration: none;
  color: var(--vp-c-text-1);
  font-size: 16px;
}

.archive-list li a:hover {
  color: var(--vp-c-brand-1);
}

.archive-list .count {
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.archive-list .empty {
  color: var(--vp-c-text-2);
  font-style: italic;
}
</style>
