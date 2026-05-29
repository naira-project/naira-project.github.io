<script setup lang="ts">
import { withBase } from "vitepress";

const props = defineProps<{
  current: number;
  total: number;
  basePath: string;
}>();

function pageHref(n: number): string {
  if (n <= 1) return withBase(props.basePath);
  return withBase(`${props.basePath.replace(/\/$/, "")}/page/${n}`);
}
</script>

<template>
  <nav v-if="total > 1" class="Pagination" aria-label="Pagination">
    <a
      v-if="current > 1"
      class="page-link"
      :href="pageHref(current - 1)"
      rel="prev"
    >← Newer</a>
    <span v-else class="page-link disabled">← Newer</span>

    <span class="page-info">Page {{ current }} of {{ total }}</span>

    <a
      v-if="current < total"
      class="page-link"
      :href="pageHref(current + 1)"
      rel="next"
    >Older →</a>
    <span v-else class="page-link disabled">Older →</span>
  </nav>
</template>

<style scoped>
.Pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--vp-c-divider);
  gap: 12px;
}

.page-link {
  color: var(--vp-c-brand-1);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
}

.page-link:hover {
  text-decoration: underline;
}

.page-link.disabled {
  color: var(--vp-c-text-3);
  pointer-events: none;
}

.page-info {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}
</style>
