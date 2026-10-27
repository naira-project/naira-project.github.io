# Plugins

Plugins connect external systems to the catalog. Each one runs as a sidecar next to the catalog, reads from its system and reports nodes and relations. This page gives an overview of the plugins that ship with Naira. The detailed documentation of each plugin, including every environment variable, is the README in its source directory under [`plugins/cmd`](https://github.com/naira-project/naira/tree/main/plugins/cmd).

## Available plugins

| Plugin | Reads from | Emits | In the Helm chart |
| --- | --- | --- | --- |
| [litellm](https://github.com/naira-project/naira/tree/main/plugins/cmd/litellm) | A LiteLLM gateway | Models, the inference endpoints serving them with usage metrics, MCP servers proxied by LiteLLM | Enabled by default |
| [mlflow](https://github.com/naira-project/naira/tree/main/plugins/cmd/mlflow) | An MLflow tracking server | Registered models and datasets | Enabled by default |
| [openmetadata](https://github.com/naira-project/naira/tree/main/plugins/cmd/openmetadata) | An OpenMetadata instance | Datasets | Enabled by default |
| [mcp_servers](https://github.com/naira-project/naira/tree/main/plugins/cmd/mcp_servers) | MCP servers addressed directly | MCP servers and the tools they expose | Enabled by default |
| [depl_calls_svc](https://github.com/naira-project/naira/tree/main/plugins/cmd/depl_calls_svc) | The Kubernetes API | Deployments, Services and which deployment calls which service, found by scanning environment variables for service hostnames | Enabled by default |
| [fluxcd](https://github.com/naira-project/naira/tree/main/plugins/cmd/fluxcd) | The Kubernetes API | FluxCD Kustomizations, HelmReleases and GitRepositories, the Deployments they manage and the GitHub repositories they reference | Enabled by default |
| [depl_uses_litellm](https://github.com/naira-project/naira/tree/main/plugins/cmd/depl_uses_litellm) | The Kubernetes API and LiteLLM | Which deployments use which LiteLLM models, found by matching API keys in Secrets | Available, off by default (reads Secrets cluster-wide) |
| [github](https://github.com/naira-project/naira/tree/main/plugins/cmd/github) | GitHub | Repositories that provably built the images running in the cluster, with CODEOWNERS ownership, linked to their deployments | Available, off by default (needs a token) |
| [tech_radar](https://github.com/naira-project/naira/tree/main/plugins/cmd/tech_radar) | A mounted YAML file | The Tech Radar and its entries | Available, off by default (needs the file) |
| [bedrock](https://github.com/naira-project/naira/tree/main/plugins/cmd/bedrock) | AWS Bedrock and CloudWatch | Foundation models and, per region with traffic, their inference endpoints with usage and health | Not yet in the chart |
| [openai_api_models](https://github.com/naira-project/naira/tree/main/plugins/cmd/openai_api_models) | Any OpenAI API compatible `/v1/models` endpoint | Models | Not yet in the chart |
| [thalamus](https://github.com/naira-project/naira/tree/main/plugins/cmd/thalamus), [depl_uses_thalamus](https://github.com/naira-project/naira/tree/main/plugins/cmd/depl_uses_thalamus) | The Thalamus serving operator | Models served by Thalamus and the deployments using them | Not yet in the chart, experimental third-party contribution |

Plugin names in the chart use hyphens (`depl-calls-svc`), source directories use underscores (`depl_calls_svc`).

## How plugins are configured

In the Helm chart, one entry under `catalog.plugins.<name>` drives everything about a plugin: whether it is enabled, its image, its port inside the pod, its cron schedule, its environment variables, Secret references, RBAC rules and mounted config files. See [Deployment](/documentation/deployment) and the [chart README](https://github.com/naira-project/naira/tree/main/deploy/charts/naira#plugins).

A few conventions hold across plugins:

- **`PATH_PREFIX`** sets the prefix of the node paths a plugin emits, for example `litellm` produces `litellm/gpt-4o`. Run the same plugin twice with different prefixes to catalog two instances of a system.
- **Credentials** are read from environment variables that the chart fills from a Secret. A plugin never stores credentials.
- **Schedules** are cron expressions. A plugin without a schedule only runs when triggered from the Plugins page or the API.
- **Kubernetes access** uses the in-cluster service account by default. A `KUBECONFIG` style variable points to a kubeconfig file for local runs.

## Running a plugin on its own

Every plugin binary can run outside the catalog, which helps when developing or when checking what a plugin would report against a real system. Started with the `-mermaid` flag, it performs one collect, prints the result as a Mermaid graph and exits. With `-neo4j <prefix>` it prints Cypher statements instead, and with `-neo4j-url` it pushes the result into a Neo4j database for exploration.

## Contributing a plugin

Plugins are the main extension point of Naira, and new ones are welcome. [Writing a Plugin](/documentation/plugin-authoring) walks through the contract and the project conventions. The longer-term model for distributing plugins maintained outside the core team is discussed in [RFC-010](https://github.com/naira-project/architecture/blob/main/rfc/rfc-010-plugin-ecosystem.md).
