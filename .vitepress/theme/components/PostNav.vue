<script setup lang="ts">
import { computed } from "vue";
import { useData, withBase } from "vitepress";
import { data as posts } from "../../blog.data";

const { page } = useData();

const currentIndex = computed(() => {
  const path = page.value.relativePath.replace(/\.md$/, "");
  return posts.findIndex(
    (p) =>
      p.url === `/${path}` ||
      p.url === path ||
      p.url.endsWith(`/${path}`),
  );
});

const newer = computed(() => {
  const i = currentIndex.value;
  return i > 0 ? posts[i - 1] : null;
});

const older = computed(() => {
  const i = currentIndex.value;
  return i >= 0 && i < posts.length - 1 ? posts[i + 1] : null;
});
</script>

<template>
  <nav
    v-if="newer || older"
    class="PostNav"
    aria-label="Post navigation"
  >
    <a v-if="newer" class="nav-link prev" :href="withBase(newer.url)">
      <span class="label">← Newer post</span>
      <span class="title">{{ newer.title }}</span>
    </a>
    <span v-else />
    <a v-if="older" class="nav-link next" :href="withBase(older.url)">
      <span class="label">Older post →</span>
      <span class="title">{{ older.title }}</span>
    </a>
    <span v-else />
  </nav>
</template>

<style scoped>
.PostNav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--vp-c-divider);
}

.nav-link {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  text-decoration: none;
  transition: border-color 0.25s, background-color 0.25s;
}

.nav-link:hover {
  border-color: var(--vp-c-brand-1);
  background-color: var(--vp-c-bg-soft);
}

.nav-link.next {
  text-align: right;
}

.label {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}

.title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

@media (max-width: 640px) {
  .PostNav {
    grid-template-columns: 1fr;
  }

  .nav-link.next {
    text-align: left;
  }
}
</style>
