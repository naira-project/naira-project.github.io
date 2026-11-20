<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { data as pluginGraph } from "../../../plugin-graph.data";
import { buildGraphModel } from "./buildGraphModel";
import { routeEdges } from "./edgeRouting";
import { computeLayout, NODE_H, NODE_W } from "./graphLayout";
import type { GraphNode, PluginGroup, Point } from "./types";

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
const focusedKindRaw = ref<string | null>(null);
const highlightedPlugin = ref<string | null>(null);
const activeHighlight = computed(() =>
  highlightedPlugin.value && selected.value.has(highlightedPlugin.value)
    ? highlightedPlugin.value
    : null,
);
watch(selected, (selection) => {
  if (highlightedPlugin.value && !selection.has(highlightedPlugin.value)) {
    highlightedPlugin.value = null;
  }
});
const selectedEdgeKey = ref<string | null>(null);
const pluginById = new Map(plugins.map((plugin) => [plugin.id, plugin]));
const positionedNodes = nodes.flatMap((node) => {
  const position = layout.positions.get(node.kind);
  return position
    ? [
        {
          ...node,
          ...position,
          sourceLabels: node.sources.map((id) => pluginById.get(id)?.label ?? id).join(", "),
        },
      ]
    : [];
});
const visibleNodes = computed<PlacedNode[]>(() =>
  positionedNodes.flatMap((node) => {
    const activeSources = node.sources.filter((source) => selected.value.has(source));
    return activeSources.length
      ? [
          {
            ...node,
            activeSources,
            badges: activeSources.slice(0, MAX_BADGES),
            sourceOverflow: Math.max(0, activeSources.length - MAX_BADGES),
          },
        ]
      : [];
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
const focusedKind = computed(() =>
  visibleKinds.value.has(focusedKindRaw.value ?? "") ? focusedKindRaw.value : null,
);
const selectedNodeSources = computed(
  () =>
    nodes
      .find((node) => node.kind === focusedKind.value)
      ?.sources.filter((source) => selected.value.has(source)) ?? [],
);

function zoomGraph(amount: number) {
  zoom.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((zoom.value + amount) * 10) / 10));
}

function activeSources(sources: string[]) {
  return sources.filter((source) => selected.value.has(source));
}

function togglePlugin(id: string) {
  const next = new Set(selected.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selected.value = next;
}

function togglePluginHighlight(id: string) {
  highlightedPlugin.value = highlightedPlugin.value === id ? null : id;
}

function toggleGroup(group: PluginGroup) {
  const shouldSelect = !groupIsFullySelected(group);
  const next = new Set(selected.value);
  for (const id of group.plugins) {
    if (shouldSelect) next.add(id);
    else next.delete(id);
  }
  selected.value = next;
}

function groupIsFullySelected(group: PluginGroup) {
  return group.plugins.every((id) => selected.value.has(id));
}

function toggleAll() {
  selected.value =
    selected.value.size === plugins.length ? new Set() : new Set(plugins.map(({ id }) => id));
}

const visibleEdges = computed(() =>
  routeEdges(visibleRelations.value, visibleNodes.value, layout.positions, layout.routes),
);

const selectedEdge = computed(
  () => visibleEdges.value.find((edge) => edge.key === selectedEdgeKey.value) ?? null,
);
const activeSelectedEdgeKey = computed(() => selectedEdge.value?.key ?? null);
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
    if (edge.key === activeSelectedEdgeKey.value) return 2;
    return edge.relation.kind === selectedEdgeKind.value ? 1 : 0;
  };
  return [...visibleEdges.value].sort((a, b) => rank(a) - rank(b));
});

function toggleEdgeSelection(key: string) {
  selectedEdgeKey.value = activeSelectedEdgeKey.value === key ? null : key;
}

function toggleNodeFocus(kind: string) {
  focusedKindRaw.value = focusedKind.value === kind ? null : kind;
}

function onSvgKeydown(event: KeyboardEvent, action: () => void) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  action();
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
      <button class="open-fullscreen" type="button" @click="openFullscreen">
        Open catalog graph in full screen
      </button>
    </div>
    <dialog
      ref="dialog"
      class="explorer-dialog"
      aria-label="Catalog schema explorer"
      @close="onClose"
    >
      <template v-if="isOpen">
        <div class="fullscreen-toolbar">
          <strong>Catalog Schema</strong>
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
                <button class="group-select" type="button" @click="toggleGroup(group)">{{ groupIsFullySelected(group) ? 'Clear' : 'Select all' }}</button>
              </header>
              <div v-for="id in group.plugins" :key="id" class="plugin-option" :class="{ selected: selected.has(id) }">
                <label class="plugin-checkbox">
                  <input type="checkbox" :checked="selected.has(id)" @change="togglePlugin(id)" />
                  <span class="plugin-label">{{ pluginById.get(id)?.label }}</span>
                </label>
                <button
                  class="plugin-highlight"
                  :class="{ active: activeHighlight === id }"
                  type="button"
                  :aria-label="`${activeHighlight === id ? 'Stop highlighting' : 'Highlight'} ${pluginById.get(id)?.label} nodes and relations`"
                  :aria-pressed="activeHighlight === id"
                  :title="`${activeHighlight === id ? 'Stop highlighting' : 'Highlight'} nodes and relations from ${pluginById.get(id)?.label}`"
                  :disabled="!selected.has(id)"
                  @click="togglePluginHighlight(id)"
                >
                  {{ activeHighlight === id ? '●' : '○' }}
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
                :style="{ width: `${layout.width * zoom}px`, height: `${layout.height * zoom}px` }"
                role="group"
                aria-label="Node kinds connected by plugin-provided relations"
              >
                <defs>
                  <marker
                    id="schema-arrow"
                    markerWidth="8"
                    markerHeight="8"
                    refX="7"
                    refY="4"
                    orient="auto"
                  >
                    <path d="M 0 0 L 8 4 L 0 8 z" fill="context-stroke" />
                  </marker>
                </defs>
                <g class="edges">
                  <g
                    v-for="edge in renderedEdges"
                    :key="edge.key"
                    class="edge-group"
                    :class="{
                      highlighted: !!activeHighlight && edge.relation.sources.includes(activeHighlight),
                      'relation-selected': activeSelectedEdgeKey === edge.key,
                      'relation-same-kind': selectedEdgeKind === edge.relation.kind && activeSelectedEdgeKey !== edge.key,
                    }"
                  >
                    <path :d="edge.d" marker-end="url(#schema-arrow)" />
                    <text
                      class="edge-label"
                      role="button"
                      tabindex="0"
                      :x="edge.label.x"
                      :y="edge.label.y"
                      :aria-pressed="activeSelectedEdgeKey === edge.key"
                      :aria-label="`${edge.relation.from} ${edge.relation.kind} ${edge.relation.to}; highlight relations of this kind`"
                      @click.stop="toggleEdgeSelection(edge.key)"
                      @keydown="onSvgKeydown($event, () => toggleEdgeSelection(edge.key))"
                    >{{ edge.relation.kind }}</text>
                    <title>{{ edge.relation.from }} —{{ edge.relation.kind }}→ {{ edge.relation.to }}; {{ activeSources(edge.relation.sources).map((id) => pluginById.get(id)?.label ?? id).join(', ') }}</title>
                  </g>
                </g>
                <g
                  v-for="node in visibleNodes"
                  :key="node.kind"
                  class="node-group"
                  :class="{
                    focused: focusedKind === node.kind,
                    highlighted: !!activeHighlight && node.sources.includes(activeHighlight),
                    'relation-endpoint': selectedEdgeEndpoints.has(node.kind),
                  }"
                  role="button"
                  tabindex="0"
                  :aria-label="`${node.kind}, provided by ${node.sourceLabels}`"
                  :aria-pressed="focusedKind === node.kind"
                  @click="toggleNodeFocus(node.kind)"
                  @keydown="onSvgKeydown($event, () => toggleNodeFocus(node.kind))"
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
            <div class="node-inspector" aria-live="polite">
              <template v-if="focusedKind">
                <strong>{{ focusedKind }}</strong><span>Contributed by:</span>
                <span v-for="source in selectedNodeSources" :key="source" class="inspector-plugin">{{ pluginById.get(source)?.label ?? source }}</span>
                <span v-if="selectedNodeSources.length > 1" class="shared-label">Shared node kind</span>
              </template>
            </div>
          </div>
        </section>
      </template>
    </dialog>
  </div>
</template>

<style scoped src="./SchemaExplorer.css"></style>