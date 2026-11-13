# The Portal

The portal is where users explore the catalog. After logging in, the left navigation shows the Overview, the Plugins page, the catalogs and the Explore section with the Tech Radar.

## Overview

The Overview lists every catalog as a card with a short description. A search box filters the cards. Click a card to open that catalog.

## Catalogs

Each catalog is a viewpoint on the graph: a table of nodes of one or more kinds, fed by a defined set of plugins.

| Catalog | Shows | Fed by |
| --- | --- | --- |
| Model Catalog | `model` nodes | litellm, mlflow, bedrock |
| Inference Endpoints Catalog | `inference_endpoint` nodes | litellm, bedrock |
| MCP Catalog | `mcp_server` nodes with their `mcp_tool` nodes | mcp-servers, litellm |
| Dataset Catalog | `dataset` nodes | openmetadata |
| Software Catalog | `deployment` and `service` nodes | depl-calls-svc, depl-uses-litellm, fluxcd |

A catalog page has a kind selector when it covers several kinds, and a **Plugins & Ingestion** dialog that runs the plugins feeding this catalog. The table columns come from the properties the plugins report. Rows are clickable and open the detail page.

![Catalog explorer listing models with their properties](/documentation/catalog-table.png)

## Detail page

The detail page of a node has these parts:

- **Graph**: the node and its relations, rendered as an interactive graph. Neighbouring nodes can be opened by clicking them.
- **Properties**: every property reported for this node, grouped by the plugin that reported it. When several plugins know the same node, each plugin's claim is shown separately.
- **Related nodes**: a section specific to the kind. An MCP server lists the tools it exposes. An inference endpoint shows the model it serves, and a model shows the endpoints serving it.
- **Metrics**: inference endpoints from LiteLLM and Bedrock show panels with request, token and latency metrics, queried from Prometheus through the UI with the user's token.

![Graph view of a catalog entry and its neighbours](/documentation/catalog-graph.png)

## Plugins page

The Plugins page lists every plugin the catalog knows, with its schedule in a readable form (or "Not scheduled" for plugins that only run on demand) and the result of its latest run: running, succeeded with the number of nodes and relations, or failed with the error message. **Run All Plugins** starts every plugin, and each row has a button to run one plugin. The refresh button reloads the status while runs are in progress.

A failed run leaves the catalog unchanged. The previous snapshot of that plugin stays visible, so a temporary outage of a source system does not empty a catalog.

## Tech Radar

The Tech Radar under Explore renders the organization's technology decisions and links entries to the models and endpoints in the catalog. See [Tech Radar](/documentation/tech-radar).

## Standalone UI

During development, the UI can be opened without the portal shell. In the local environment it is forwarded to port 3001. Login still goes through Keycloak, and the portal remains the entry point for users.
