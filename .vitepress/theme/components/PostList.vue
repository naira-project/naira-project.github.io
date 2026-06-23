<script setup lang="ts">
import { withBase } from "vitepress";
import type { Post } from "../../blog.data";

defineProps<{
  posts: Post[];
  emptyMessage?: string;
}>();
</script>

<template>
  <div class="PostList">
    <p v-if="!posts.length" class="empty">
      {{ emptyMessage ?? "No posts yet." }}
    </p>
    <article v-for="post in posts" :key="post.url" class="post-card">
      <h2 class="post-title">
        <a :href="withBase(post.url)">{{ post.title }}</a>
      </h2>
      <div class="post-meta">
        <time :datetime="post.date">{{ post.dateFormatted }}</time>
        <span class="sep">·</span>
        <a
          class="author"
          :href="withBase(`/blog/authors/${encodeURIComponent(post.author)}`)"
        >{{ post.author }}</a>
        <template v-if="post.tags.length">
          <span class="sep">·</span>
          <span class="tags">
            <a
              v-for="tag in post.tags"
              :key="tag"
              class="tag"
              :href="withBase(`/blog/tags/${encodeURIComponent(tag)}`)"
            >#{{ tag }}</a>
          </span>
        </template>
      </div>
      <p v-if="post.description" class="post-desc">{{ post.description }}</p>
      <p class="post-readmore">
        <a :href="withBase(post.url)">Read more →</a>
      </p>
    </article>
  </div>
</template>

<style scoped>
.PostList {
  display: flex;
  flex-direction: column;
  gap: 36px;
}

.empty {
  color: var(--vp-c-text-2);
  font-style: italic;
}

.post-card {
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 32px;
}

.post-card:last-child {
  border-bottom: none;
}

.post-title {
  font-size: 1.65rem;
  line-height: 1.3;
  font-weight: 600;
  margin: 0 0 10px;
  border-top: 0;
  padding-top: 0;
  letter-spacing: -0.01em;
}

.post-title a {
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.post-title a:hover {
  color: var(--vp-c-brand-1);
}

.post-meta {
  font-size: 0.95rem;
  color: var(--vp-c-text-2);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.post-meta .sep {
  opacity: 0.6;
}

.post-meta .author,
.post-meta .tag {
  color: var(--vp-c-text-2);
  text-decoration: none;
}

.post-meta .author:hover,
.post-meta .tag:hover {
  color: var(--vp-c-brand-1);
}

.tags {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  font-size: 0.9rem;
}

.post-desc {
  color: var(--vp-c-text-1);
  font-size: 1rem;
  margin: 8px 0 12px;
  line-height: 1.7;
}

.post-readmore {
  margin: 0;
  font-size: 0.95rem;
}

.post-readmore a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
  font-weight: 500;
}

.post-readmore a:hover {
  text-decoration: underline;
}
</style>
