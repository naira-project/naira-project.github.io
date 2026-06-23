<script setup lang="ts">
import { computed } from "vue";
import { useData, withBase } from "vitepress";
import { data as posts } from "../../blog.data";

const { frontmatter, page } = useData();

const post = computed(() =>
  posts.find((p) => p.url === page.value.relativePath.replace(/\.md$/, "").replace(/^/, "/")) ??
  posts.find((p) => p.url.endsWith(page.value.relativePath.replace(/\.md$/, ""))),
);

const dateFormatted = computed(() => {
  const raw = post.value?.date ?? frontmatter.value.date;
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(+d)) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

const dateIso = computed(() => post.value?.date ?? frontmatter.value.date ?? "");
const author = computed(() => post.value?.author ?? frontmatter.value.author ?? "");
const tags = computed<string[]>(() => post.value?.tags ?? frontmatter.value.tags ?? []);
</script>

<template>
  <header v-if="dateFormatted || author || tags.length" class="PostHeader">
    <div class="post-meta">
      <time v-if="dateFormatted" :datetime="dateIso">{{ dateFormatted }}</time>
      <template v-if="author">
        <span class="sep">·</span>
        <a
          class="author"
          :href="withBase(`/blog/authors/${encodeURIComponent(author)}`)"
        >{{ author }}</a>
      </template>
      <template v-if="tags.length">
        <span class="sep">·</span>
        <span class="tags">
          <a
            v-for="tag in tags"
            :key="tag"
            class="tag"
            :href="withBase(`/blog/tags/${encodeURIComponent(tag)}`)"
          >#{{ tag }}</a>
        </span>
      </template>
    </div>
  </header>
</template>

<style scoped>
.PostHeader {
  margin-bottom: 12px;
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  color: var(--vp-c-text-2);
}

.post-meta .sep {
  opacity: 0.6;
}

.post-meta a {
  color: var(--vp-c-text-2);
  text-decoration: none;
}

.post-meta a:hover {
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
</style>
