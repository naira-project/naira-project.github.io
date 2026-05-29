<script setup lang="ts">
import { computed, h } from "vue";
import { useData } from "vitepress";
import DefaultTheme from "vitepress/theme";
import PostHeader from "./components/PostHeader.vue";
import PostNav from "./components/PostNav.vue";

const { frontmatter, page } = useData();

const isPost = computed(() => {
  if (frontmatter.value.layout === "post") return true;
  const path = page.value.relativePath ?? "";
  return /^blog\/posts\//.test(path);
});
</script>

<template>
  <DefaultTheme.Layout>
    <template #doc-before>
      <PostHeader v-if="isPost" />
    </template>
    <template #doc-after>
      <PostNav v-if="isPost" />
    </template>
  </DefaultTheme.Layout>
</template>
