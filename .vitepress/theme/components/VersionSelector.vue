<template>
  <!-- Don't show version selector in PR previews -->
  <div v-if="!isPreview" class="version-selector">
    <select
      v-model="currentVersion"
      @change="switchVersion"
      class="version-dropdown"
      aria-label="Select documentation version"
    >
      <option
        v-for="version in versions"
        :key="version.name"
        :value="version.name"
      >
        {{ version.label }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Version {
  name: string
  label: string
}

// Define available versions - update this list when adding new versions
const versions: Version[] = [
  { name: 'main', label: 'main (latest)' },
]

const currentVersion = ref<string>('')
const isPreview = ref<boolean>(false)

function isPreviewContext(): boolean {
  if (typeof window === 'undefined') return false

  const path = window.location.pathname
  const segments = path.split('/').filter(Boolean)

  // Check if we're in a PR preview (path starts with pr-preview/)
  return segments.length > 0 && segments[0] === 'pr-preview'
}

function getCurrentVersion(): string {
  if (typeof window === 'undefined') return 'main'

  const path = window.location.pathname
  const segments = path.split('/').filter(Boolean)

  // Check if first segment matches a known version
  if (segments.length > 0) {
    const firstSegment = segments[0]
    if (versions.some(v => v.name === firstSegment)) {
      return firstSegment
    }
  }

  // Default to main if no version detected
  return 'main'
}

function switchVersion(): void {
  if (typeof window === 'undefined') return

  const currentPath = window.location.pathname
  const segments = currentPath.split('/').filter(Boolean)

  // Remove the version from the path if it exists
  let pathWithoutVersion = ''
  if (segments.length > 0 && versions.some(v => v.name === segments[0])) {
    pathWithoutVersion = '/' + segments.slice(1).join('/')
  } else {
    pathWithoutVersion = currentPath
  }

  // Ensure path starts with / and ends without trailing slash (unless it's just /)
  if (!pathWithoutVersion.startsWith('/')) {
    pathWithoutVersion = '/' + pathWithoutVersion
  }
  if (pathWithoutVersion.length > 1 && pathWithoutVersion.endsWith('/')) {
    pathWithoutVersion = pathWithoutVersion.slice(0, -1)
  }

  // Construct new URL with selected version
  const newPath = `/${currentVersion.value}${pathWithoutVersion}`

  window.location.href = newPath
}

onMounted(() => {
  isPreview.value = isPreviewContext()
  currentVersion.value = getCurrentVersion()
})
</script>

<style scoped>
.version-selector {
  display: inline-block;
  margin-left: 12px;
}

.version-dropdown {
  padding: 4px 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
}

.version-dropdown:hover {
  border-color: var(--vp-c-brand-1);
  background-color: var(--vp-c-bg-soft);
}

.version-dropdown:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px var(--vp-c-brand-soft);
}

/* Dark mode adjustments */
.dark .version-dropdown {
  background-color: var(--vp-c-bg-alt);
}

.dark .version-dropdown:hover {
  background-color: var(--vp-c-bg-soft);
}
</style>