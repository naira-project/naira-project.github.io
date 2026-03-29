<template>
  <Layout>
    <!-- Add version selector to the navigation bar -->
    <template #nav-bar-content-after>
      <VersionSelector />
    </template>

    <!-- Add YouTube video above homepage feature tiles -->
    <template #home-features-before>
    </template>
  </Layout>
</template>

<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import VersionSelector from './components/VersionSelector.vue'
import mediumZoom from 'medium-zoom'
import { onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'

const { Layout } = DefaultTheme

const route = useRoute()

const initZoom = () => {
  mediumZoom('.main img', { background: 'var(--vp-c-bg)', margin: 80 })
}

onMounted(() => {
  initZoom()
})

watch(
  () => route.path,
  () => nextTick(() => initZoom())
)
</script>