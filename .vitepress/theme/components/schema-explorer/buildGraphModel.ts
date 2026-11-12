import { FALLBACK_GROUP, pluginGroupLabel, pluginPresentation } from "./schemaExplorerPresentation";
import type {
  GraphModel,
  GraphNode,
  GraphRelation,
  Plugin,
  PluginGraphDocument,
  PluginGroup,
} from "./types";

export function buildGraphModel(pluginGraph: PluginGraphDocument): GraphModel {
  const plugins: Plugin[] = [];
  for (const { plugin: id } of pluginGraph.plugins) {
    const presentation = pluginPresentation[id] ?? {};
    const group = presentation.group ?? FALLBACK_GROUP;
    plugins.push({
      id,
      label: id.replaceAll("_", "-"),
      short: presentation.short ?? id.slice(0, 3).toUpperCase(),
      group,
      groupLabel: pluginGroupLabel(group),
    });
  }

  const shortCodeOwners = new Map<string, string>();
  for (const plugin of plugins) {
    const owner = shortCodeOwners.get(plugin.short);
    if (owner && owner !== plugin.id) {
      throw new Error(
        `Plugin short code "${plugin.short}" is shared by "${owner}" and "${plugin.id}". Add explicit short codes in pluginPresentation.`,
      );
    }
    shortCodeOwners.set(plugin.short, plugin.id);
  }

  const groupsById = new Map<string, PluginGroup>();
  for (const plugin of plugins) {
    let group = groupsById.get(plugin.group);
    if (!group) {
      group = { id: plugin.group, label: plugin.groupLabel, plugins: [] };
      groupsById.set(plugin.group, group);
    }
    group.plugins.push(plugin.id);
  }
  const groups = [...groupsById.values()].sort(
    (a, b) => Number(a.id === FALLBACK_GROUP) - Number(b.id === FALLBACK_GROUP),
  );

  const nodesByKind = new Map<string, GraphNode>();
  for (const plugin of pluginGraph.plugins) {
    for (const kind of plugin.nodes) {
      let node = nodesByKind.get(kind);
      if (!node) {
        node = { kind, sources: [] };
        nodesByKind.set(kind, node);
      }
      if (!node.sources.includes(plugin.plugin)) node.sources.push(plugin.plugin);
    }
  }
  const nodes = [...nodesByKind.values()].sort((a, b) => a.kind.localeCompare(b.kind));

  const relationsByKey = new Map<string, GraphRelation>();
  for (const plugin of pluginGraph.plugins) {
    for (const relation of plugin.relations) {
      const key = `${relation.kind}\u0000${relation.from}\u0000${relation.to}`;
      let graphRelation = relationsByKey.get(key);
      if (!graphRelation) {
        graphRelation = { ...relation, sources: [] };
        relationsByKey.set(key, graphRelation);
      }
      if (!graphRelation.sources.includes(plugin.plugin)) graphRelation.sources.push(plugin.plugin);
    }
  }
  const relations = [...relationsByKey.values()].sort(
    (a, b) =>
      a.from.localeCompare(b.from) || a.to.localeCompare(b.to) || a.kind.localeCompare(b.kind),
  );

  return { plugins, groups, nodes, relations };
}
