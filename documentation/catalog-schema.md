# Catalog schema

The catalog stores what plugins discover as a graph of **nodes** connected by **relations**. This page shows the shape of that graph: which kinds of nodes and relations each plugin can emit. It does not show actual catalog data.

<SchemaExplorer />

## Reading the graph

- **Box = node kind.** A node in the catalog is identified by its `kind` and `path`. The graph shows kinds only, for example `model` or `deployment`, not individual instances.
- **Arrow = relation kind.** It points from the `from` kind to the `to` kind, and the label is the relation `kind`, for example `deployment` → `uses_model` → `model`.
* **Relation highlight.** Click a relation label (for example `source_from`) to highlight that edge and its two endpoint node kinds. Every other edge with the same relation kind elsewhere in the graph is also highlighted.
- **Badges = contributing plugins.** Each node carries short plugin codes. Hover a badge for the plugin name, or open *Plugin code legend* in the side panel.
- **Shared kinds.** Several plugins can emit the same node or relation, and the catalog merges their data. That is why kinds like `model` and `deployment` show several badges. Click a node to see who contributes it.

## Data source

The graph is built from [`plugin-graph.yaml`](https://github.com/naira-project/naira/blob/nodes-index/plugins/plugin-graph.yaml), and is fetched when this site is built. To add a plugin or a kind, update that file.

## Related sources

- [Plugin authoring and catalog claim semantics](https://github.com/naira-project/naira/blob/main/docs/plugin-authoring.md)
