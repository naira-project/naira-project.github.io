# Writing a Plugin

A plugin is a small Go program that reads from one system and returns the nodes and relations it finds. The catalog does the rest: scheduling, storing, merging with other plugins and serving the result. This page walks through the contract and the conventions. The normative rules for node identity live in the repository, in [`docs/plugin-authoring.md`](https://github.com/naira-project/naira/blob/main/docs/plugin-authoring.md), and the coding guidelines in [`plugins/AGENTS.md`](https://github.com/naira-project/naira/blob/main/plugins/AGENTS.md).

## The contract

The catalog talks to a plugin over gRPC. The service has one RPC:

```proto
service CatalogPluginService {
  rpc Collect(CollectRequest) returns (CollectResponse);
}

message CollectResponse {
  repeated NodeClaim nodes = 1;
  repeated RelationClaim relations = 2;
}
```

A `NodeClaim` is a node ID (kind and path) plus string properties. A `RelationClaim` is a relation kind, a source node ID, a target node ID and properties. The full definition is in [`plugin.proto`](https://github.com/naira-project/naira/blob/main/plugins/pkg/pluginapi/proto/plugin/v1/plugin.proto).

Every call to `Collect` must return the complete picture the plugin currently sees. The catalog treats the response as a snapshot and removes whatever the plugin reported before but not now.

## A minimal plugin

The `pluginmain` package handles configuration loading, the gRPC server and the standalone flags, so a plugin only implements `Collect`:

```go
package main

import (
	"context"

	"github.com/naira-project/naira/plugins/pkg/pluginapi"
	"github.com/naira-project/naira/plugins/pkg/pluginmain"
)

type config struct {
	BaseURL    string `env:"MYSYSTEM_BASE_URL" default:"http://127.0.0.1:9000"`
	PathPrefix string `env:"PATH_PREFIX" default:"mysystem"`
}

type plugin struct{ cfg config }

func (p *plugin) Collect(ctx context.Context) (pluginapi.CollectResponse, error) {
	// Read from the system at p.cfg.BaseURL, then:
	return pluginapi.CollectResponse{
		Nodes: []pluginapi.NodeClaim{
			{
				ID: pluginapi.NodeID{
					Kind: pluginapi.NodeKindModel,
					Path: p.cfg.PathPrefix + "/fraud-detector",
				},
				Properties: map[string]string{"version": "3"},
			},
		},
	}, nil
}

func main() {
	app := pluginmain.New[config]()
	app.Serve(&plugin{cfg: app.PluginConfig})
}
```

Configuration is a struct with `env` tags. `PORT` selects the gRPC port and is read by the framework.

## Node identity

Node IDs are the backbone of the catalog, so a few rules apply:

- A kind must not contain a slash. A path may.
- Reuse the kinds defined in `pluginapi` when they fit. A new kind is a new concept for the whole catalog, so introduce one only when none fits.
- Keep IDs stable across runs. The same asset must map to the same ID every time, otherwise it appears as a new node and the old one disappears.
- Never emit two claims with the same ID in one response.
- When the source system cannot provide a globally unique identifier, take a configurable `PATH_PREFIX` so that users can run several instances with distinct prefixes.
- Design the path from the semantics of the source system, not from what the UI currently does with it.

Relations reference nodes by ID. Both nodes must be in the same response.

## Properties

Properties are strings. Keep the field names of the source API where you pass data through, and when you rename, leave a comment at the rename explaining why. Properties from different plugins on the same node are kept apart as plugin claims, so there is no need to coordinate names with other plugins.

## Running and testing

During development, run the plugin binary with `-mermaid` to collect once against a real system and print the graph, or with `-neo4j` to produce Cypher. This needs no catalog.

Unit tests cover the mapping from source API responses to nodes and relations, ideally with raw response bodies as test input. Integration tests, tagged so they can be skipped with `-short`, run the plugin against a real instance of the source system in a concrete version. The purpose and limits of integration tests are described in [`docs/integration-tests.md`](https://github.com/naira-project/naira/blob/main/docs/integration-tests.md).

## Packaging and documentation

Each plugin has a Dockerfile in its directory and builds into the image `naira-plugin-<name>`. Adding an entry under `catalog.plugins` in the Helm chart's values wires the sidecar, its configuration, RBAC and schedule. Tilt builds any plugin image the rendered chart references, so enabling the entry in `values-dev.yaml` is enough for the local environment.

A plugin's README is generated from the godoc comment on its `main` package with `goreadme`, through a `go:generate` directive. Edit the comment, run `go generate`, and check the rendered Markdown.

## Where plugins live

Today all plugins are in the main repository under `plugins/cmd`. Contributions follow the usual [contribution process](/documentation/contribute). How plugins maintained by third parties will be distributed and listed is the topic of [RFC-010](https://github.com/naira-project/architecture/blob/main/rfc/rfc-010-plugin-ecosystem.md).
