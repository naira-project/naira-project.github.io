<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { data as pluginGraph } from '../../../plugin-graph.data'
import { routeEdges } from './edgeRouting'
import { computeLayout, NODE_H, NODE_W } from './graphLayout'
import type { GraphNode, GraphRelation, Point } from './graphLayout'
import { FALLBACK_GROUP, pluginGroupLabel, pluginPresentation } from './schemaExplorerPresentation'

type Plugin = { id: string; label: string; short: string; group: string; groupLabel: string }
type PluginGroup = { id: string; label: string; plugins: string[] }
type PlacedNode = GraphNode & Point & { activeSources: string[]; badges: string[]; sourceOverflow: number; sourceLabels: string }

const plugins: Plugin[] = pluginGraph.plugins.map(({ plugin: id }) => {
  const presentation = pluginPresentation[id] ?? {}
  const group = presentation.group ?? FALLBACK_GROUP
  return {
    id,
    label: presentation.label ?? id,
    short: presentation.short ?? id.slice(0, 3).toUpperCase(),
    group,
    groupLabel: pluginGroupLabel(group),
  }
})

const pluginGroups: PluginGroup[] = Array.from(
  plugins.reduce((groups, plugin) => {
    const group = groups.get(plugin.group) ?? { id: plugin.group, label: plugin.groupLabel, plugins: [] }
    group.plugins.push(plugin.id)
    groups.set(plugin.group, group)
    return groups
  }, new Map<string, PluginGroup>()).values(),
).sort((a, b) => Number(a.id === FALLBACK_GROUP) - Number(b.id === FALLBACK_GROUP))

const nodes: GraphNode[] = Array.from(
  pluginGraph.plugins.reduce((kinds, plugin) => {
    for (const kind of plugin.nodes) {
      const sources = kinds.get(kind)?.sources ?? []
      if (!sources.includes(plugin.plugin)) sources.push(plugin.plugin)
      kinds.set(kind, { kind, sources })
    }
    return kinds
  }, new Map<string, GraphNode>()).values(),
).sort((a, b) => a.kind.localeCompare(b.kind))

const relations: GraphRelation[] = Array.from(
  pluginGraph.plugins.reduce((relationsByKey, plugin) => {
    for (const relation of plugin.relations) {
      const key = `${relation.kind}\u0000${relation.from}\u0000${relation.to}`
      const existing = relationsByKey.get(key) ?? { ...relation, sources: [] as string[] }
      if (!existing.sources.includes(plugin.plugin)) existing.sources.push(plugin.plugin)
      relationsByKey.set(key, existing)
    }
    return relationsByKey
  }, new Map<string, GraphRelation>()).values(),
).sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to) || a.kind.localeCompare(b.kind))

const layout = computeLayout(nodes, relations)

const isFullscreen = ref(false)
const zoom = ref(1)
const MIN_ZOOM = 0.4
const MAX_ZOOM = 2.5
const ZOOM_STEP = 0.1
const fullscreenTrigger = ref<HTMLButtonElement | null>(null)
const dialogElement = ref<HTMLElement | null>(null)
const previousFocus = ref<HTMLElement | null>(null)
const selected = ref(new Set(plugins.map(({ id }) => id)))
const focusedNode = ref<string | null>(null)
const highlightedPlugin = ref<string | null>(null)
const pluginById = new Map(plugins.map((plugin) => [plugin.id, plugin]))
const visibleNodes = computed<PlacedNode[]>(() => nodes
  .filter((node) => node.sources.some((source) => selected.value.has(source)) && layout.positions.has(node.kind))
  .map((node) => {
    const activeSources = node.sources.filter((source) => selected.value.has(source))
    return {
      ...node,
      ...layout.positions.get(node.kind)!,
      activeSources,
      badges: activeSources.slice(0, MAX_BADGES),
      sourceOverflow: Math.max(0, activeSources.length - MAX_BADGES),
      sourceLabels: activeSources.map((id) => pluginById.get(id)?.label ?? id).join(', '),
    }
  }))
const visibleKinds = computed(() => new Set(visibleNodes.value.map((node) => node.kind)))
const visibleRelations = computed(() => relations.filter((relation) =>
  relation.sources.some((source) => selected.value.has(source)) &&
  visibleKinds.value.has(relation.from) && visibleKinds.value.has(relation.to),
))
const selectedNodeSources = computed(() => nodes.find((node) => node.kind === focusedNode.value)?.sources.filter((source) => selected.value.has(source)) ?? [])

function zoomGraph(amount: number) {
  zoom.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((zoom.value + amount) * 10) / 10))
}

function activeSources(sources: string[]) {
  return sources.filter((source) => selected.value.has(source))
}

const MAX_BADGES = 4

watch(visibleKinds, (kinds) => {
  if (focusedNode.value && !kinds.has(focusedNode.value)) focusedNode.value = null
})

function togglePlugin(id: string) {
  const next = new Set(selected.value)
  if (next.has(id)) {
    next.delete(id)
    if (highlightedPlugin.value === id) highlightedPlugin.value = null
  } else next.add(id)
  selected.value = next
}

function togglePluginHighlight(id: string) {
  highlightedPlugin.value = highlightedPlugin.value === id ? null : id
}

function setGroup(group: PluginGroup, shouldSelect: boolean) {
  const next = new Set(selected.value)
  for (const id of group.plugins) {
    if (shouldSelect) next.add(id)
    else next.delete(id)
  }
  selected.value = next
}

function groupIsFullySelected(group: PluginGroup) {
  return group.plugins.every((id) => selected.value.has(id))
}

function toggleAll() {
  selected.value = selected.value.size === plugins.length ? new Set() : new Set(plugins.map(({ id }) => id))
}

const visibleEdges = computed(() =>
  routeEdges(visibleRelations.value, visibleNodes.value, layout.positions, layout.routes),
)

const previousBodyOverflow = ref('')

async function openFullscreen() {
  previousFocus.value = document.activeElement instanceof HTMLElement ? document.activeElement : null
  previousBodyOverflow.value = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', handleDocumentKeydown, true)
  isFullscreen.value = true
  await nextTick()
  dialogElement.value?.focus()
}

function handleDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isFullscreen.value) {
    event.preventDefault()
    closeFullscreen()
  }
}

function closeFullscreen() {
  if (!isFullscreen.value) return
  isFullscreen.value = false
  document.removeEventListener('keydown', handleDocumentKeydown, true)
  document.body.style.overflow = previousBodyOverflow.value
  requestAnimationFrame(() => {
    if (previousFocus.value?.isConnected) previousFocus.value.focus()
    else fullscreenTrigger.value?.focus()
  })
}

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleDocumentKeydown, true)
  if (isFullscreen.value) document.body.style.overflow = previousBodyOverflow.value
})

function trapDialogFocus(event: KeyboardEvent) {
  if (event.key !== 'Tab' || !dialogElement.value) return
  const focusable = Array.from(dialogElement.value.querySelectorAll<HTMLElement>(
    'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )).filter((element) => element.offsetParent !== null)
  if (!focusable.length) {
    event.preventDefault()
    dialogElement.value.focus()
    return
  }
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}
</script>

<template>
  <div class="schema-explorer-root">
    <div class="explorer-toolbar">
      <button ref="fullscreenTrigger" class="open-fullscreen" type="button" @click="openFullscreen">Open catalog graph in a full-screen</button>
    </div>
    <Teleport v-if="isFullscreen" to="body">
      <div
        ref="dialogElement"
        class="explorer-shell fullscreen"
        role="dialog"
        aria-modal="true"
        aria-label="Full-screen catalog graph explorer"
        tabindex="-1"
        @keydown="trapDialogFocus"
      >
        <div class="fullscreen-toolbar">
          <strong>Catalog schema</strong>
          <button class="close-fullscreen" type="button" aria-label="Close full-screen graph" @click="closeFullscreen">Close ×</button>
        </div>
        <section class="schema-workbench" aria-label="Interactive catalog schema explorer">
          <aside class="plugin-panel">
            <div class="plugin-panel-heading">
              <div><h2>Plugin groups</h2><p>Select plugins to filter the graph.</p></div>
              <button class="select-all" type="button" @click="toggleAll">{{ selected.size === plugins.length ? 'Clear all' : 'Select all' }}</button>
            </div>
            <section v-for="group in pluginGroups" :key="group.id" class="plugin-group">
              <header class="plugin-group-heading">
                <strong>{{ group.label }}</strong>
                <button class="group-select" type="button" @click="setGroup(group, !groupIsFullySelected(group))">{{ groupIsFullySelected(group) ? 'Clear' : 'Select all' }}</button>
              </header>
              <label v-for="id in group.plugins" :key="id" class="plugin-option" :class="{ selected: selected.has(id) }">
                <input type="checkbox" :checked="selected.has(id)" @change="togglePlugin(id)" />
                <span class="plugin-label">{{ pluginById.get(id)?.label }}</span>
                <button
                  class="plugin-highlight"
                  :class="{ active: highlightedPlugin === id }"
                  type="button"
                  :aria-label="`${highlightedPlugin === id ? 'Stop highlighting' : 'Highlight'} ${pluginById.get(id)?.label} nodes and relations`"
                  :aria-pressed="highlightedPlugin === id"
                  :title="`${highlightedPlugin === id ? 'Stop highlighting' : 'Highlight'} nodes and relations from ${pluginById.get(id)?.label}`"
                  @click.prevent="togglePluginHighlight(id)"
                >
                  {{ highlightedPlugin === id ? '●' : '○' }}
                </button>
              </label>
            </section>
            <div class="legend">
              <span class="legend-edge"></span><span>Relation arrow; label shows kind</span>
            </div>
            <details class="plugin-code-legend">
              <summary>Plugin code legend</summary>
              <div class="plugin-code-list">
                <span v-for="plugin in plugins" :key="plugin.id" class="plugin-code-entry"><code>{{ plugin.short }}</code> {{ plugin.label }}</span>
              </div>
            </details>
            <p class="panel-footnote">Click a node to inspect which selected plugins contribute it. Hover a node or arrow for details.</p>
          </aside>

          <div class="graph-panel">
            <header class="graph-heading">
              <div><h2>Catalog graph</h2><p>{{ visibleNodes.length }} node kinds · {{ visibleRelations.length }} relations · {{ selected.size }} plugins selected</p></div>
              <div class="graph-controls" aria-label="Graph zoom controls">
                <button type="button" aria-label="Zoom out" :disabled="zoom <= MIN_ZOOM" @click="zoomGraph(-ZOOM_STEP)">−</button>
                <span aria-live="polite">{{ Math.round(zoom * 100) }}%</span>
                <button type="button" aria-label="Zoom in" :disabled="zoom >= MAX_ZOOM" @click="zoomGraph(ZOOM_STEP)">+</button>
                <button type="button" :disabled="zoom === 1" @click="zoom = 1">Reset</button>
              </div>
            </header>
            <div v-if="visibleNodes.length" class="graph-canvas" role="region" aria-label="Scrollable graph visualization" tabindex="0">
              <svg
                class="graph-svg"
                :viewBox="`0 0 ${layout.width} ${layout.height}`"
                :style="{ width: `${layout.width * zoom}px`, height: `${layout.height * zoom}px`, minHeight: 0 }"
                role="img"
                aria-label="Node kinds connected by plugin-provided relations"
              >
                <defs><marker id="schema-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M 0 0 L 8 4 L 0 8 z" fill="context-stroke" /></marker></defs>
                <g class="edges">
                  <g v-for="edge in visibleEdges" :key="edge.key" class="edge-group" :class="{ highlighted: highlightedPlugin && edge.relation.sources.includes(highlightedPlugin) }">
                    <path :d="edge.d" marker-end="url(#schema-arrow)" />
                    <text :x="edge.label.x" :y="edge.label.y">{{ edge.relation.kind }}</text>
                    <title>{{ edge.relation.from }} —{{ edge.relation.kind }}→ {{ edge.relation.to }}; {{ activeSources(edge.relation.sources).map((id) => pluginById.get(id)?.label ?? id).join(', ') }}</title>
                  </g>
                </g>
                <g
                  v-for="node in visibleNodes"
                  :key="node.kind"
                  class="node-group"
                  :class="{ focused: focusedNode === node.kind, highlighted: highlightedPlugin && node.sources.includes(highlightedPlugin) }"
                  role="button"
                  tabindex="0"
                  :aria-label="`${node.kind}, provided by ${node.sourceLabels}`"
                  @click="focusedNode = focusedNode === node.kind ? null : node.kind"
                  @keydown.enter.prevent="focusedNode = focusedNode === node.kind ? null : node.kind"
                  @keydown.space.prevent="focusedNode = focusedNode === node.kind ? null : node.kind"
                >
                  <rect :x="node.x - NODE_W / 2" :y="node.y - NODE_H / 2" :width="NODE_W" :height="NODE_H" rx="9" />
                  <text class="node-label" :x="node.x" :y="node.y - 3">{{ node.kind }}</text>
                  <g class="node-source-codes">
                    <g v-for="(source, sourceIndex) in node.badges" :key="source" :transform="`translate(${node.x + (sourceIndex - (node.badges.length - 1) / 2) * 30}, ${node.y + 14})`">
                      <rect x="-13" y="-8" width="26" height="16" rx="4" />
                      <text y="3">{{ pluginById.get(source)?.short }}</text>
                      <title>{{ pluginById.get(source)?.label }}</title>
                    </g>
                    <g v-if="node.sourceOverflow > 0" :transform="`translate(${node.x + (node.badges.length - (node.badges.length - 1) / 2) * 30}, ${node.y + 14})`">
                      <rect x="-12" y="-8" width="24" height="16" rx="4" />
                      <text y="3">+{{ node.sourceOverflow }}</text>
                      <title>{{ node.activeSources.slice(MAX_BADGES).map((id) => pluginById.get(id)?.label ?? id).join(', ') }}</title>
                    </g>
                  </g>
                </g>
              </svg>
            </div>
            <div v-else class="empty-graph">Select one or more plugins to display their node kinds and relations.</div>
            <div v-if="focusedNode" class="node-inspector" aria-live="polite">
              <strong>{{ focusedNode }}</strong><span>Contributed by:</span>
              <span v-for="source in selectedNodeSources" :key="source" class="inspector-plugin">{{ pluginById.get(source)?.label ?? source }}</span>
              <span v-if="selectedNodeSources.length > 1" class="shared-label">Shared node kind</span>
            </div>
          </div>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.schema-explorer-root { width: 100%; }
.explorer-toolbar { display: flex; align-items: center; gap: 12px; margin: 0 0 12px; }
.open-fullscreen, .close-fullscreen { border: 1px solid var(--vp-c-brand-1); border-radius: 7px; padding: 7px 11px; background: var(--vp-c-bg); color: var(--vp-c-brand-1); cursor: pointer; font: 600 .8rem var(--vp-font-family-base); white-space: nowrap; }
.explorer-shell.fullscreen { position: fixed; inset: 0; z-index: 9999; display: flex; flex-direction: column; gap: 12px; overflow: auto; padding: 16px; background: var(--vp-c-bg); }
.fullscreen-toolbar { display: flex; flex: 0 0 auto; align-items: center; justify-content: space-between; }
.close-fullscreen { background: var(--vp-c-brand-1); color: white; }
.schema-workbench { --schema-border: var(--vp-c-divider); --schema-soft: var(--vp-c-bg-soft); --schema-muted: var(--vp-c-text-2); --schema-accent: #6366f1; --schema-accent-strong: #4f46e5; --schema-edge: #778397; display: grid; grid-template-columns: 230px minmax(0, 1fr); gap: 16px; color: var(--vp-c-text-1); align-items: start; }
:global(.dark) .schema-workbench { --schema-accent: #a5b4fc; --schema-accent-strong: #c7d2fe; --schema-edge: #a0aec0; }
.explorer-shell.fullscreen .schema-workbench { flex: 1; min-height: 0; align-items: stretch; }
.explorer-shell.fullscreen .plugin-panel { position: static; max-height: 100%; }
.explorer-shell.fullscreen .graph-panel { display: flex; flex-direction: column; min-height: 0; }
.explorer-shell.fullscreen .graph-canvas { flex: 1; max-height: none; min-height: 0; }
.explorer-shell.fullscreen .graph-svg { width: 100%; height: 100%; min-height: 700px; }
.plugin-panel, .graph-panel { border: 1px solid var(--schema-border); border-radius: 12px; background: var(--vp-c-bg); }
.plugin-panel { padding: 14px; position: sticky; top: 16px; max-height: calc(100vh - 32px); overflow-y: auto; }
.plugin-panel-heading, .graph-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.graph-controls { display: flex; flex: 0 0 auto; align-items: center; gap: 5px; }
.graph-controls button { min-width: 28px; border: 1px solid var(--schema-border); border-radius: 5px; padding: 4px 7px; background: var(--vp-c-bg); color: var(--vp-c-text-1); cursor: pointer; font: 600 .78rem var(--vp-font-family-base); }
.graph-controls button:disabled { cursor: not-allowed; opacity: .45; }
.graph-controls span { min-width: 42px; color: var(--schema-muted); text-align: center; font-size: .72rem; }
.plugin-panel-heading { margin-bottom: 12px; }
.plugin-panel h2, .graph-heading h2 { margin: 0; border: 0; padding: 0; font-size: 1.05rem; }
.plugin-panel-heading p, .graph-heading p { margin: 4px 0 0; color: var(--schema-muted); font-size: .78rem; line-height: 1.4; }
.select-all, .group-select { box-sizing: border-box; border: 0; padding: 4px 6px; background: transparent; color: var(--vp-c-brand-1); cursor: pointer; font: inherit; font-size: .72rem; white-space: nowrap; text-align: right; }
.select-all { flex: 0 0 74px; }
.group-select { flex: 0 0 68px; }
.plugin-group { margin-top: 11px; padding-top: 9px; border-top: 1px solid var(--schema-border); }
.plugin-group-heading { display: flex; align-items: center; justify-content: space-between; gap: 5px; margin-bottom: 3px; font-size: .72rem; }
.plugin-option { display: flex; align-items: center; gap: 7px; margin: 3px 0; padding: 6px; border-radius: 6px; cursor: pointer; }
.plugin-option:hover, .plugin-option.selected { background: var(--schema-soft); }
.plugin-option input { accent-color: var(--vp-c-brand-1); flex: 0 0 auto; }
.plugin-label { overflow-wrap: anywhere; font: 600 .72rem var(--vp-font-family-mono); }
.plugin-highlight { flex: 0 0 auto; border: 0; padding: 0 2px; color: var(--schema-muted); cursor: pointer; font-size: .82rem; line-height: 1; }
.plugin-highlight:hover, .plugin-highlight.active { color: var(--schema-accent); }
.plugin-code-legend { margin-top: 10px; color: var(--schema-muted); font-size: .7rem; }
.plugin-code-legend summary { cursor: pointer; }
.plugin-code-list { display: grid; grid-template-columns: 1fr; gap: 4px; margin-top: 7px; }
.plugin-code-entry code { display: inline-block; width: 34px; color: var(--vp-c-text-1); font-weight: 700; }
.legend { display: grid; grid-template-columns: 18px 1fr; gap: 7px; align-items: center; margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--schema-border); color: var(--schema-muted); font-size: .68rem; }
.legend-edge { height: 0; border-top: 2px solid var(--vp-c-text-2); }
.panel-footnote { color: var(--schema-muted); font-size: .7rem; line-height: 1.5; margin: 12px 0 0; }
.graph-panel { min-width: 0; overflow: hidden; }
.graph-heading { padding: 14px 16px 10px; }
.graph-heading p { font-size: .8rem; }
.graph-canvas { max-height: calc(100vh - 225px); min-height: 580px; overflow: auto; background-color: var(--vp-c-bg); background-image: radial-gradient(var(--vp-c-divider) .75px, transparent .75px); background-size: 18px 18px; border-top: 1px solid var(--schema-border); border-bottom: 1px solid var(--schema-border); }
.graph-svg { display: block; width: 100%; height: auto; min-height: 580px; color: var(--vp-c-text-2); }
.edge-group path { fill: none; stroke: var(--schema-edge); stroke-width: 1.5; opacity: .7; }
.edge-group text { fill: var(--vp-c-text-2); stroke: var(--vp-c-bg); stroke-width: 4px; paint-order: stroke; text-anchor: middle; font: 600 11px var(--vp-font-family-mono); }
.edge-group.highlighted path { stroke: var(--schema-accent); stroke-width: 3.2; opacity: 1; }
.edge-group.highlighted text { fill: var(--schema-accent-strong); font-weight: 800; }

.node-group { cursor: pointer; outline: none; }
.node-group rect { fill: var(--vp-c-bg); stroke: var(--vp-c-divider); stroke-width: 1.5; filter: drop-shadow(0 2px 2px rgb(0 0 0 / 8%)); transition: stroke .15s ease, fill .15s ease; }
.node-group:hover rect, .node-group:focus rect { stroke: var(--vp-c-brand-1); }
.node-group.focused rect { stroke: var(--vp-c-brand-1); stroke-width: 3; }

.node-group:focus-visible rect { stroke: var(--vp-c-brand-1); stroke-width: 3; }
.node-group.highlighted rect { stroke: var(--schema-accent); stroke-width: 2.8; }

.node-label { fill: var(--vp-c-text-1); text-anchor: middle; font: 700 12px var(--vp-font-family-mono); }
.node-source-codes rect { fill: var(--vp-c-bg-soft); stroke: var(--vp-c-divider); stroke-width: .8; }
.node-source-codes text { fill: var(--vp-c-text-2); text-anchor: middle; font: 700 8px var(--vp-font-family-mono); }
.empty-graph { display: grid; min-height: 580px; place-items: center; padding: 24px; color: var(--schema-muted); text-align: center; }
.node-inspector { display: flex; flex-wrap: wrap; align-items: center; gap: 7px; margin: 10px 14px; padding: 9px 11px; border: 1px solid var(--schema-border); border-radius: 8px; font-size: .75rem; }
.node-inspector > span:nth-child(2) { color: var(--schema-muted); }
.inspector-plugin, .shared-label { padding: 3px 6px; border-radius: 5px; background: var(--schema-soft); font: 600 .68rem var(--vp-font-family-mono); }
.shared-label { background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); }
@media (max-width: 760px) {
  .explorer-toolbar { align-items: flex-start; flex-direction: column; }
  .explorer-shell.fullscreen { padding: 10px; }
  .schema-workbench { grid-template-columns: 1fr; }
  .plugin-panel { position: static; max-height: 270px; }
  .graph-canvas { max-height: 68vh; min-height: 480px; }
  .graph-svg { min-height: 480px; }
}
</style>