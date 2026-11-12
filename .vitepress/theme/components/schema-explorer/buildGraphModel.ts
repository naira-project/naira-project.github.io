import type { GraphNode, GraphRelation } from './graphLayout'
import { FALLBACK_GROUP, pluginGroupLabel, pluginPresentation } from './schemaExplorerPresentation'

export type Plugin = { id: string; label: string; short: string; group: string; groupLabel: string }
export type PluginGroup = { id: string; label: string; plugins: string[] }
export type PluginGraphDocument = {
  plugins: { plugin: string; nodes: string[]; relations: { kind: string; from: string; to: string }[] }[]
}
export type GraphModel = {
  plugins: Plugin[]
  groups: PluginGroup[]
  nodes: GraphNode[]
  relations: GraphRelation[]
}

export function buildGraphModel(pluginGraph: PluginGraphDocument): GraphModel {
  const plugins: Plugin[] = pluginGraph.plugins.map(({ plugin: id }) => {
    const presentation = pluginPresentation[id] ?? {}
    const group = presentation.group ?? FALLBACK_GROUP
    return {
      id,
      label: id.replaceAll('_', '-'),
      short: presentation.short ?? id.slice(0, 3).toUpperCase(),
      group,
      groupLabel: pluginGroupLabel(group),
    }
  })

  const shortCodeOwners = new Map<string, string>()
  for (const plugin of plugins) {
    const owner = shortCodeOwners.get(plugin.short)
    if (owner && owner !== plugin.id && (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV) {
      console.warn(`Plugin short code "${plugin.short}" is shared by "${owner}" and "${plugin.id}". Add explicit short codes in pluginPresentation.`)
    } else {
      shortCodeOwners.set(plugin.short, plugin.id)
    }
  }

  const groups = Array.from(
    plugins.reduce((byGroup, plugin) => {
      const group = byGroup.get(plugin.group) ?? { id: plugin.group, label: plugin.groupLabel, plugins: [] }
      group.plugins.push(plugin.id)
      byGroup.set(plugin.group, group)
      return byGroup
    }, new Map<string, PluginGroup>()).values(),
  ).sort((a, b) => Number(a.id === FALLBACK_GROUP) - Number(b.id === FALLBACK_GROUP))

  const nodes: GraphNode[] = Array.from(
    pluginGraph.plugins.reduce((byKind, plugin) => {
      for (const kind of plugin.nodes) {
        const sources = byKind.get(kind)?.sources ?? []
        if (!sources.includes(plugin.plugin)) sources.push(plugin.plugin)
        byKind.set(kind, { kind, sources })
      }
      return byKind
    }, new Map<string, GraphNode>()).values(),
  ).sort((a, b) => a.kind.localeCompare(b.kind))

  const relations: GraphRelation[] = Array.from(
    pluginGraph.plugins.reduce((byKey, plugin) => {
      for (const relation of plugin.relations) {
        const key = `${relation.kind}\u0000${relation.from}\u0000${relation.to}`
        const existing = byKey.get(key) ?? { ...relation, sources: [] as string[] }
        if (!existing.sources.includes(plugin.plugin)) existing.sources.push(plugin.plugin)
        byKey.set(key, existing)
      }
      return byKey
    }, new Map<string, GraphRelation>()).values(),
  ).sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to) || a.kind.localeCompare(b.kind))

  return { plugins, groups, nodes, relations }
}
