import { defineLoader } from 'vitepress'
import { parse } from 'yaml'

const PLUGIN_GRAPH_URL = 'https://raw.githubusercontent.com/naira-project/naira/main/plugins/plugin-graph.yaml'

type RawRelation = { kind: string; from: string; to: string }
type RawPlugin = { plugin: string; nodes: string[]; relations: RawRelation[] }
type PluginGraphDocument = { plugins: RawPlugin[] }

function validatePluginGraph(value: unknown): PluginGraphDocument {
  if (!value || typeof value !== 'object' || !Array.isArray((value as PluginGraphDocument).plugins)) {
    throw new Error('Expected plugin graph YAML to contain a plugins array.')
  }

  const plugins = (value as PluginGraphDocument).plugins
  for (const [index, plugin] of plugins.entries()) {
    if (!plugin || typeof plugin.plugin !== 'string' || !plugin.plugin.trim()) {
      throw new Error(`Plugin graph entry ${index + 1} must have a plugin ID.`)
    }
    if (!Array.isArray(plugin.nodes) || !plugin.nodes.every((node) => typeof node === 'string')) {
      throw new Error(`Plugin graph entry "${plugin.plugin}" must have a string nodes array.`)
    }
    if (!Array.isArray(plugin.relations)) {
      throw new Error(`Plugin graph entry "${plugin.plugin}" must have a relations array.`)
    }
    for (const [relationIndex, relation] of plugin.relations.entries()) {
      if (!relation || typeof relation.kind !== 'string' || typeof relation.from !== 'string' || typeof relation.to !== 'string') {
        throw new Error(`Relation ${relationIndex + 1} in plugin "${plugin.plugin}" must define kind, from, and to.`)
      }
    }
  }

  return value as PluginGraphDocument
}

export default defineLoader({
  async load() {
    let response: Response
    try {
      response = await fetch(PLUGIN_GRAPH_URL, { signal: AbortSignal.timeout(15_000) })
    } catch (error) {
      throw new Error(`Unable to fetch plugin graph from ${PLUGIN_GRAPH_URL}.`, { cause: error })
    }
    if (!response.ok) {
      throw new Error(`Unable to fetch plugin graph from ${PLUGIN_GRAPH_URL}: HTTP ${response.status} ${response.statusText}`)
    }

    const source = await response.text()
    let parsed: unknown
    try {
      parsed = parse(source)
    } catch (error) {
      throw new Error(`Unable to parse plugin graph YAML from ${PLUGIN_GRAPH_URL}.`, { cause: error })
    }

    return validatePluginGraph(parsed)
  },
})
