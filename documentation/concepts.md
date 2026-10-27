# Concepts

Naira is a catalog of AI assets and the relationships between them. This page explains the vocabulary used throughout the portal, the API and the plugin code.

## The catalog

The catalog is a graph. Its vertices are **nodes**, its edges are **relations**. The catalog service owns the graph and exposes it through the [Catalog API](/documentation/api). It never talks to external systems itself. Everything in the graph was reported by a [plugin](#plugins).

## Nodes

A node represents one asset: a model, a dataset, an inference endpoint, an MCP server, a Kubernetes deployment, a Git repository and so on.

A node is identified by its **kind** and its **path**:

- The **kind** says what sort of asset it is, for example `model` or `inference_endpoint`. Kinds are plain strings and must not contain a slash.
- The **path** identifies the asset within its kind. It may contain slashes and typically starts with a prefix that identifies the source, for example `litellm/gpt-4o` or `mlflow/fraud-detector`.

Together they form the resource name used by the API, `nodes/<kind>/<path>`. Identity is stable: the same asset reported in another run, or by another plugin, maps to the same node.

The kinds in use today are defined in the plugin API package and shared by all plugins:

| Kind | Represents |
| --- | --- |
| `model` | A model, as known by a registry, gateway or serving system |
| `inference_endpoint` | A place where a model can be called, together with its usage and health |
| `dataset` | A dataset from a data catalog or experiment tracker |
| `mcp_server`, `mcp_tool` | An MCP server and the tools it exposes |
| `deployment`, `service` | Kubernetes workloads and the services in front of them |
| `application` | An application that groups workloads |
| `git_repository` | A source repository on GitHub or Hugging Face |
| `Kustomization.fluxcd`, `HelmChart.fluxcd`, `GitRepository.fluxcd` | FluxCD objects |
| `owner` | A team or person owning other nodes |
| `tech_radar`, `tech_radar_entry` | The Tech Radar and its entries |

New kinds can be introduced by plugins. The portal groups kinds into [catalogs](/documentation/portal#catalogs).

## Relations

A relation is a directed, typed edge between two nodes. It is identified by its kind, its source node and its target node. Relation kinds describe how assets depend on each other:

| Relation | Meaning |
| --- | --- |
| `serves_model` | An inference endpoint serves a model |
| `uses_model` | A deployment calls a model |
| `trained_on` | A model was trained on a dataset |
| `exposes` | An MCP server exposes a tool |
| `calls` | A deployment calls a service |
| `deployed_from`, `built_from`, `sourced_from` | A workload or model comes from a FluxCD object, a repository or a Hugging Face repo |
| `references`, `describes`, `derived_from`, `owned_by` | Further links between repositories, documentation, lineage and owners |

Both ends of a relation must exist in the catalog. Plugins therefore report the nodes a relation points at in the same run.

## Properties and plugin claims

Nodes and relations carry **properties**, a flat set of string key-value pairs such as a model's provider, a deployment's namespace or an endpoint's token usage.

Several plugins can report the same node. A LiteLLM plugin and an MLflow plugin may both know a model, each with different details. The catalog does not pick a winner. It keeps every plugin's properties separately, as a **plugin claim**, and returns them side by side:

```json
{
  "name": "nodes/model/litellm/claude-sonnet",
  "kind": "model",
  "path": "litellm/claude-sonnet",
  "pluginClaims": [
    { "plugin": "litellm", "props": { "provider": "anthropic", "mode": "chat" } },
    { "plugin": "depl-uses-litellm", "props": { "verified": "true" } }
  ]
}
```

The portal shows claims per plugin on the detail page, so it is always clear where a piece of information came from.

## Plugins

A plugin connects one external system to the catalog. It runs as a sidecar container next to the catalog, reads from its system (an HTTP API, the Kubernetes API, a cloud provider or a file) and returns what it found. The catalog calls each plugin over gRPC with a single operation, `Collect`, and stores the result.

Plugins run on a **schedule** expressed as a cron expression, or on demand from the portal and the API. Each run is tracked as an **operation** with a start time, an end time, a result or an error. The Plugins page shows the latest operation per plugin.

Plugins are configured through environment variables. Most of them take a `PATH_PREFIX` so that several instances of the same plugin, for example two LiteLLM gateways, produce distinct node paths. See [Plugins](/documentation/plugins) for the list and [Writing a Plugin](/documentation/plugin-authoring) for the contract.

## Snapshots

Every plugin run is an atomic snapshot of what the plugin currently sees. The catalog replaces that plugin's previous contribution with the new one: nodes and relations the plugin no longer reports are removed, claims of other plugins on the same nodes stay untouched. A failed run changes nothing, so the last good snapshot stays visible until the next successful run.

## Catalogs and viewpoints

A **catalog** in the portal is a viewpoint on the graph: a selection of kinds and of the plugins that feed them. The Model Catalog shows `model` nodes from the LiteLLM, MLflow and Bedrock plugins, the MCP Catalog shows `mcp_server` nodes and their tools, and so on. Viewpoints are configuration in the UI, not separate data stores. The same node can appear in more than one viewpoint.

## Tech Radar

The Tech Radar is special in that its source is not an external system but a reviewed YAML file. Its plugin turns the file into `tech_radar` and `tech_radar_entry` nodes, and entries can reference the catalog nodes they talk about. See [Tech Radar](/documentation/tech-radar).

## Storage

The catalog keeps its graph in memory. After a restart it is empty until the plugins have run again, either on schedule or triggered by hand. The Helm chart ships a PostgreSQL database and the catalog is being prepared to persist its graph there.
