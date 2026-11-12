import { defineLoader } from "vitepress";
import { parse } from "yaml";
import type { PluginGraphDocument } from "./theme/components/schema-explorer/types";

const PLUGIN_GRAPH_URL =
  "https://raw.githubusercontent.com/naira-project/naira/main/plugins/plugin-graph.yaml";

// VitePress generates the named `data` export for client imports of data loaders.
export declare const data: PluginGraphDocument;

function validatePluginGraph(value: unknown): PluginGraphDocument {
  if (
    !value ||
    typeof value !== "object" ||
    !Array.isArray((value as { plugins?: unknown }).plugins)
  ) {
    throw new Error("Expected plugin graph YAML to contain a plugins array.");
  }

  const plugins = (value as { plugins: unknown[] }).plugins;
  for (const [index, entry] of plugins.entries()) {
    if (!entry || typeof entry !== "object") {
      throw new Error(`Plugin graph entry ${index + 1} must be an object.`);
    }
    const plugin = entry as Record<string, unknown>;
    if (typeof plugin.plugin !== "string" || !plugin.plugin.trim()) {
      throw new Error(`Plugin graph entry ${index + 1} must have a plugin ID.`);
    }
    if (!Array.isArray(plugin.nodes) || !plugin.nodes.every((node) => typeof node === "string")) {
      throw new Error(`Plugin graph entry "${plugin.plugin}" must have a string nodes array.`);
    }
    if (!Array.isArray(plugin.relations)) {
      throw new Error(`Plugin graph entry "${plugin.plugin}" must have a relations array.`);
    }
    for (const [relationIndex, relation] of (plugin.relations as unknown[]).entries()) {
      if (!relation || typeof relation !== "object") {
        throw new Error(
          `Relation ${relationIndex + 1} in plugin "${plugin.plugin}" must define kind, from, and to.`,
        );
      }
      const candidate = relation as Record<string, unknown>;
      if (
        typeof candidate.kind !== "string" ||
        typeof candidate.from !== "string" ||
        typeof candidate.to !== "string"
      ) {
        throw new Error(
          `Relation ${relationIndex + 1} in plugin "${plugin.plugin}" must define kind, from, and to.`,
        );
      }
    }
  }

  const declared = new Set(plugins.flatMap((entry) => (entry as { nodes: string[] }).nodes));
  for (const entry of plugins as PluginGraphDocument["plugins"]) {
    for (const relation of entry.relations) {
      for (const end of [relation.from, relation.to]) {
        if (!declared.has(end)) {
          throw new Error(
            `Relation "${relation.kind}" in "${entry.plugin}" references undeclared node kind "${end}".`,
          );
        }
      }
    }
  }

  return value as PluginGraphDocument;
}

export default defineLoader({
  async load() {
    let response: Response;
    try {
      response = await fetch(PLUGIN_GRAPH_URL, { signal: AbortSignal.timeout(15_000) });
    } catch (error) {
      throw new Error(`Unable to fetch plugin graph from ${PLUGIN_GRAPH_URL}.`, { cause: error });
    }
    if (!response.ok) {
      throw new Error(
        `Unable to fetch plugin graph from ${PLUGIN_GRAPH_URL}: HTTP ${response.status} ${response.statusText}`,
      );
    }

    const source = await response.text();
    let parsed: unknown;
    try {
      parsed = parse(source);
    } catch (error) {
      throw new Error(`Unable to parse plugin graph YAML from ${PLUGIN_GRAPH_URL}.`, {
        cause: error,
      });
    }

    return validatePluginGraph(parsed);
  },
});
