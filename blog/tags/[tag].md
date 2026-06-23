---
title: Tag
description: Posts tagged with a given tag.
---

<script setup>
import { useData } from "vitepress";
import { computed } from "vue";
import { data as posts } from "../../.vitepress/blog.data";

const { params } = useData();
const tag = computed(() => params.value.tag);
const tagged = computed(() => posts.filter((p) => p.tags.includes(tag.value)));
</script>

# Posts tagged <code>#{{ $params.tag }}</code>

<PostList
  :posts="tagged"
  :empty-message="`No posts found for #${tag}.`"
/>

<p style="margin-top: 32px;">
  <a href="/blog/tags">← All tags</a> ·
  <a href="/blog/">Back to blog</a>
</p>
