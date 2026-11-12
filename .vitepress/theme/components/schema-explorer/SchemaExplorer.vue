<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { data as pluginGraph } from "../../../plugin-graph.data";
import { buildGraphModel } from "./buildGraphModel";
import { routeEdges } from "./edgeRouting";
import type { GraphNode, Point } from "./graphLayout";
import { computeLayout, NODE_H, NODE_W } from "./graphLayout";

type PlacedNode = GraphNode &
  Point & {
    activeSources: string[];
    badges: string[];
    sourceOverflow: number;
    sourceLabels: string;
  };

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.1;
const MAX_BADGES = 4;
const { plugins, groups: pluginGroups, nodes, relations } = buildGraphModel(pluginGraph);
const layout = computeLayout(nodes, relations);
const dialog = ref<HTMLDialogElement | null>(null);
const isOpen = ref(false);
const zoom = ref(1);
const selected = ref(new Set(plugins.map(({ id }) => id)));
const focusedNode = ref<string | null>(null);
const highlightedPlugin = ref<string | null>(null);
const selectedEdgeKey = ref<string | null>(null);
const pluginById = new Map(plugins.map((plugin) => [plugin.id, plugin]));
const visibleNodes = computed<PlacedNode[]>(() =>
  nodes
    .filter(
      (node) =>
        node.sources.some((source) => selected.value.has(source)) &&
        layout.positions.has(node.kind),
    )
    .map((node) => {
      const activeSources = node.sources.filter((source) => selected.value.has(source));
      return {
        ...node,
        ...layout.positions.get(node.kind)!,
        activeSources,
        badges: activeSources.slice(0, MAX_BADGES),
        sourceOverflow: Math.max(0, activeSources.length - MAX_BADGES),
        sourceLabels: activeSources.map((id) => pluginById.get(id)?.label ?? id).join(", "),
      };
    }),
);
const visibleKinds = computed(() => new Set(visibleNodes.value.map((node) => node.kind)));
const visibleRelations = computed(() =>
  relations.filter(
    (relation) =>
      relation.sources.some((source) => selected.value.has(source)) &&
      visibleKinds.value.has(relation.from) &&
      visibleKinds.value.has(relation.to),
  ),
);
const selectedNodeSources = computed(
  () =>
    nodes
      .find((node) => node.kind === focusedNode.value)
      ?.sources.filter((source) => selected.value.has(source)) ?? [],
);

function zoomGraph(amount: number) {
  zoom.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((zoom.value + amount) * 10) / 10));
}

function activeSources(sources: string[]) {
  return sources.filter((source) => selected.value.has(source));
}

watch(visibleKinds, (kinds) => {
  if (focusedNode.value && !kinds.has(focusedNode.value)) focusedNode.value = null;
});

function togglePlugin(id: string) {
  const next = new Set(selected.value);
  if (next.has(id)) {
    next.delete(id);
    if (highlightedPlugin.value === id) highlightedPlugin.value = null;
  } else next.add(id);
  selected.value = next;
}

function togglePluginHighlight(id: string) {
  highlightedPlugin.value = highlightedPlugin.value === id ? null : id;
}

function setGroup(group: { id: string; label: string; plugins: string[] }, shouldSelect: boolean) {
  const next = new Set(selected.value);
  for (const id of group.plugins) {
    if (shouldSelect) next.add(id);
    else next.delete(id);
  }
  selected.value = next;
}

function groupIsFullySelected(group: { plugins: string[] }) {
  return group.plugins.every((id) => selected.value.has(id));
}

function toggleAll() {
  selected.value =
    selected.value.size === plugins.length ? new Set() : new Set(plugins.map(({ id }) => id));
}

const visibleEdges = computed(() =>
  routeEdges(visibleRelations.value, visibleNodes.value, layout.positions, layout.routes),
);

function edgeKey(relation: { kind: string; from: string; to: string }) {
  return `${relation.kind}-${relation.from}-${relation.to}`;
}

const selectedEdge = computed(() =>
  visibleEdges.value.find((edge) => edgeKey(edge.relation) === selectedEdgeKey.value),
);
const selectedEdgeKind = computed(() => selectedEdge.value?.relation.kind ?? null);
const selectedEdgeEndpoints = computed(
  () =>
    new Set(
      selectedEdge.value ? [selectedEdge.value.relation.from, selectedEdge.value.relation.to] : [],
    ),
);

// Selected edges are painted last so they stay on top of overlapping edges.
const renderedEdges = computed(() => {
  const rank = (edge: (typeof visibleEdges.value)[number]) => {
    if (edgeKey(edge.relation) === selectedEdgeKey.value) return 2;
    return edge.relation.kind === selectedEdgeKind.value ? 1 : 0;
  };
  return [...visibleEdges.value].sort((a, b) => rank(a) - rank(b));
});

watch(selectedEdgeKind, (kind) => {
  if (kind === null) selectedEdgeKey.value = null;
});

function toggleEdgeSelection(relation: { kind: string; from: string; to: string }) {
  const key = edgeKey(relation);
  selectedEdgeKey.value = selectedEdgeKey.value === key ? null : key;
}

async function openFullscreen() {
  isOpen.value = true;
  await nextTick();
  dialog.value?.showModal();
}

function onClose() {
  isOpen.value = false;
}
</script>

<template>
  <div class="schema-explorer-root">
    <div class="explorer-toolbar">
      <button class="open-fullscreen" type="button" @click="openFullscreen">Open catalog graph in full screen</button>
    </div>
    <dialog ref="dialog" class="explorer-dialog" aria-label="Catalog schema explorer" @close="onClose">
      <template v-if="isOpen">
        <div class="fullscreen-toolbar">
          <strong>Catalog schema</strong>
          <button class="close-fullscreen" type="button" aria-label="Close full-screen graph" @click="dialog?.close()">Close ×</button>
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
              <div v-for="id in group.plugins" :key="id" class="plugin-option" :class="{ selected: selected.has(id) }">
                <label class="plugin-checkbox">
                  <input type="checkbox" :checked="selected.has(id)" @change="togglePlugin(id)" />
                  <span class="plugin-label">{{ pluginById.get(id)?.label }}</span>
                </label>
                <button
                  class="plugin-highlight"
                  :class="{ active: highlightedPlugin === id }"
                  type="button"
                  :aria-label="`${highlightedPlugin === id ? 'Stop highlighting' : 'Highlight'} ${pluginById.get(id)?.label} nodes and relations`"
                  :aria-pressed="highlightedPlugin === id"
                  :title="`${highlightedPlugin === id ? 'Stop highlighting' : 'Highlight'} nodes and relations from ${pluginById.get(id)?.label}`"
                  @click="togglePluginHighlight(id)"
                >
                  {{ highlightedPlugin === id ? '●' : '○' }}
                </button>
              </div>
            </section>
            <div class="legend">
              <span class="legend-edge"></span><span>Relation arrow; label shows kind</span>
              <span class="legend-edge legend-edge-selected"></span><span>Selected relation (click its label)</span>
              <span class="legend-edge legend-edge-same-kind"></span><span>Other relations of the same kind</span>
            </div>
            <details class="plugin-code-legend">
              <summary>Plugin code legend</summary>
              <div class="plugin-code-list">
                <span v-for="plugin in plugins" :key="plugin.id" class="plugin-code-entry"><code>{{ plugin.short }}</code> {{ plugin.label }}</span>
              </div>
            </details>
            <p class="panel-footnote">Click a node to inspect which selected plugins contribute it. Click a relation label to highlight that edge, its endpoint nodes, and all other edges of the same kind; click it again to clear. Only the selected edge's endpoint nodes are highlighted. Hover a node or arrow for details.</p>
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
                role="group"
                aria-label="Node kinds connected by plugin-provided relations"
              >
                <defs><marker id="schema-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M 0 0 L 8 4 L 0 8 z" fill="context-stroke" /></marker></defs>
                <g class="edges">
                  <g
                    v-for="edge in renderedEdges"
                    :key="edgeKey(edge.relation)"
                    class="edge-group"
                    :class="{
                      highlighted: highlightedPlugin && edge.relation.sources.includes(highlightedPlugin),
                      'relation-selected': selectedEdgeKey === edgeKey(edge.relation),
                      'relation-same-kind': selectedEdgeKind === edge.relation.kind && selectedEdgeKey !== edgeKey(edge.relation),
                    }"
                  >
                    <path :d="edge.d" marker-end="url(#schema-arrow)" />
                    <text
                      class="edge-label"
                      role="button"
                      tabindex="0"
                      :x="edge.label.x"
                      :y="edge.label.y"
                      :aria-pressed="selectedEdgeKey === edgeKey(edge.relation)"
                      :aria-label="`${edge.relation.from} ${edge.relation.kind} ${edge.relation.to}; highlight relations of this kind`"
                      @click.stop="toggleEdgeSelection(edge.relation)"
                      @keydown.enter.prevent="toggleEdgeSelection(edge.relation)"
                      @keydown.space.prevent="toggleEdgeSelection(edge.relation)"
                    >{{ edge.relation.kind }}</text>
                    <title>{{ edge.relation.from }} —{{ edge.relation.kind }}→ {{ edge.relation.to }}; {{ activeSources(edge.relation.sources).map((id) => pluginById.get(id)?.label ?? id).join(', ') }}</title>
                  </g>
                </g>
                <g
                  v-for="node in visibleNodes"
                  :key="node.kind"
                  class="node-group"
                  :class="{
                    focused: focusedNode === node.kind,
                    highlighted: highlightedPlugin && node.sources.includes(highlightedPlugin),
                    'relation-endpoint': selectedEdgeEndpoints.has(node.kind),
                  }"
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
      </template>
    </dialog>
  </div>
</template>

<style scoped>
.schema-explorer-root { width: 100%; }
.explorer-toolbar { display: flex; align-items: center; gap: 12px; margin: 0 0 12px; }
.open-fullscreen, .close-fullscreen { border: 1px solid var(--vp-c-brand-1); border-radius: 7px; padding: 7px 11px; background: var(--vp-c-bg); color: var(--vp-c-brand-1); cursor: pointer; font: 600 .8rem var(--vp-font-family-base); white-space: nowrap; }
dialog.explorer-dialog { width: 100vw; height: 100vh; max-width: none; max-height: none; margin: 0; border: 0; padding: 16px; background: var(--vp-c-bg); color: var(--vp-c-text-1); }
dialog.explorer-dialog::backdrop { background: rgb(0 0 0 / 65%); }
dialog.explorer-dialog[open] { display: flex; flex-direction: column; gap: 12px; overflow: auto; }
.fullscreen-toolbar { display: flex; flex: 0 0 auto; align-items: center; justify-content: space-between; }
.close-fullscreen { background: var(--vp-c-brand-1); color: white; }
.schema-workbench { --schema-border: var(--vp-c-divider); --schema-soft: var(--vp-c-bg-soft); --schema-muted: var(--vp-c-text-2); --schema-accent: #6366f1; --schema-accent-strong: #4f46e5; --schema-edge: #778397; --schema-relation-selected: #006d77; --schema-relation-same-kind: #647c9b; display: grid; grid-template-columns: 230px minmax(0, 1fr); gap: 16px; color: var(--vp-c-text-1); align-items: start; }
:global(.dark) .schema-workbench { --schema-accent: #a5b4fc; --schema-accent-strong: #c7d2fe; --schema-edge: #a0aec0; --schema-relation-selected: #4db6bf; --schema-relation-same-kind: #91a8c7; }
.schema-workbench { flex: 1; min-height: 0; align-items: stretch; }
.graph-panel { display: flex; flex-direction: column; min-height: 0; }
.graph-canvas { flex: 1; max-height: none; min-height: 0; }
.plugin-panel, .graph-panel { border: 1px solid var(--schema-border); border-radius: 12px; background: var(--vp-c-bg); }
.plugin-panel { padding: 14px; max-height: 100%; overflow-y: auto; }
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
.plugin-option { display: flex; align-items: center; justify-content: space-between; gap: 7px; margin: 3px 0; padding: 6px; border-radius: 6px; }
.plugin-option:hover, .plugin-option.selected { background: var(--schema-soft); }
.plugin-checkbox { display: flex; min-width: 0; align-items: center; gap: 7px; cursor: pointer; }
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
.legend-edge-selected { border-top: 3px solid var(--schema-relation-selected); }
.legend-edge-same-kind { border-top: 3px solid var(--schema-relation-same-kind); }
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
.edge-group .edge-label { cursor: pointer; outline: none; }
.edge-group .edge-label:hover, .edge-group .edge-label:focus-visible { fill: var(--vp-c-brand-1); text-decoration: underline; }
.edge-group.relation-same-kind path { stroke: var(--schema-relation-same-kind); stroke-width: 3; opacity: 1; }
.edge-group.relation-same-kind text { fill: var(--schema-relation-same-kind); font-weight: 800; }
.edge-group.relation-selected path { stroke: var(--schema-relation-selected); stroke-width: 3.6; opacity: 1; }
.edge-group.relation-selected text { fill: var(--schema-relation-selected); font-weight: 800; }

.node-group { cursor: pointer; outline: none; }
.node-group rect { fill: var(--vp-c-bg); stroke: var(--vp-c-divider); stroke-width: 1.5; filter: drop-shadow(0 2px 2px rgb(0 0 0 / 8%)); transition: stroke .15s ease, fill .15s ease; }
.node-group:hover rect, .node-group:focus rect { stroke: var(--vp-c-brand-1); }
.node-group.focused rect { stroke: var(--vp-c-brand-1); stroke-width: 3; }

.node-group:focus-visible rect { stroke: var(--vp-c-brand-1); stroke-width: 3; }
.node-group.highlighted rect { stroke: var(--schema-accent); stroke-width: 2.8; }
.node-group.relation-endpoint rect { fill: color-mix(in srgb, var(--schema-relation-selected) 10%, var(--vp-c-bg)); stroke: var(--schema-relation-selected); stroke-width: 3; }

.node-label { fill: var(--vp-c-text-1); text-anchor: middle; font: 700 12px var(--vp-font-family-mono); }
.node-source-codes rect { fill: var(--vp-c-bg-soft); stroke: var(--vp-c-divider); stroke-width: .8; }
.node-source-codes text { fill: var(--vp-c-text-2); text-anchor: middle; font: 700 8px var(--vp-font-family-mono); }
.empty-graph { display: grid; min-height: 580px; place-items: center; padding: 24px; color: var(--schema-muted); text-align: center; }
.node-inspector { display: flex; flex-wrap: wrap; align-items: center; gap: 7px; margin: 10px 14px; padding: 9px 11px; border: 1px solid var(--schema-border); border-radius: 8px; font-size: .75rem; }
.node-inspector > span:nth-child(2) { color: var(--schema-muted); }
.inspector-plugin, .shared-label { padding: 3px 6px; border-radius: 5px; background: var(--schema-soft); font: 600 .68rem var(--vp-font-family-mono); }
.shared-label { background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); }
</style>