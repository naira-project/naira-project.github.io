---
title: Author
description: Posts by a given author.
---

<script setup>
import { useData } from "vitepress";
import { computed } from "vue";
import { data as posts } from "../../.vitepress/blog.data";

const { params } = useData();
const author = computed(() => params.value.author);
const byAuthor = computed(() => posts.filter((p) => p.author === author.value));
</script>

# Posts by {{ $params.author }}

<PostList
  :posts="byAuthor"
  :empty-message="`No posts found for ${author}.`"
/>

<p style="margin-top: 32px;">
  <a href="/blog/authors">← All authors</a> ·
  <a href="/blog/">Back to blog</a>
</p>
