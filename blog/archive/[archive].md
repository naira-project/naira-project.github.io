---
title: Archive
description: Posts from a specific month.
---

<script setup>
import { useData } from "vitepress";
import { computed } from "vue";
import { data as posts } from "../../.vitepress/blog.data";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const { params } = useData();

const parsed = computed(() => {
  const raw = String(params.value.archive ?? "");
  const [year, month] = raw.split("-");
  return { year, month };
});

const label = computed(() => {
  const m = parseInt(parsed.value.month ?? "", 10);
  if (!parsed.value.year || Number.isNaN(m)) return parsed.value.year ?? "";
  return `${MONTHS[m - 1]} ${parsed.value.year}`;
});

const monthPosts = computed(() =>
  posts.filter(
    (p) => p.year === parsed.value.year && p.month === parsed.value.month,
  ),
);
</script>

# {{ label }}

<PostList
  :posts="monthPosts"
  :empty-message="`No posts for ${label}.`"
/>

<p style="margin-top: 32px;">
  <a href="/blog/archive">← Full archive</a> ·
  <a href="/blog/">Back to blog</a>
</p>
