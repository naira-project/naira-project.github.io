# Getting Started

This guide brings up a complete Naira environment on your machine: the catalog with its plugins, the portal, and sample systems for the plugins to read from (Keycloak, LiteLLM, MLflow, llama.cpp and a mock MCP server). Everything runs in a local [kind](https://kind.sigs.k8s.io/) cluster driven by [Tilt](https://tilt.dev/).

For installing Naira into an existing cluster, see [Deployment](/documentation/deployment).

## Prerequisites

- [Docker](https://www.docker.com/) (Docker Desktop or Docker Engine)
- [mise](https://mise.jdx.dev/), which installs every other tool in the pinned version

Clone the repository and let mise install the tools listed in `mise.toml` (kind, kubectl, helm, tilt, task, go and the linters):

```bash
git clone https://github.com/naira-project/naira.git
cd naira
mise install
```

If you prefer to install tools by hand, `mise.toml` lists the exact versions.

## Create the cluster and deploy

Create the kind cluster once. This also selects its kube context:

```bash
kind create cluster --name naira-idp --image kindest/node:v1.36.1
```

Then deploy the platform:

```bash
tilt up
```

Tilt builds the container images, installs the published [test-dependencies](https://github.com/naira-project/test-dependencies) chart into the `naira-deps` namespace and the Naira chart into `idp-system`, and port-forwards the services. It refuses to run if the kube context is not `kind-naira-idp`, so it cannot touch another cluster by accident.

Open the Tilt UI (it prints the address, usually `http://localhost:10350`) and wait until the resources are green. The first run takes a while because it builds all images and pulls the dependencies.

## Log in and explore

Open the portal at `http://localhost:3000` and log in to Keycloak with the development credentials:

| Field | Value |
| --- | --- |
| user | `testuser` |
| password | `testpass` |

The catalog is empty until plugins have run. Go to **Plugins** and click **Run All Plugins**. Plugins that have no target in the local environment show as failed, which is expected. Then open one of the catalogs, for example the **Model Catalog**, or the **Software Catalog** for the deployments and services running in the cluster.

![Catalog explorer listing models with their properties](/documentation/catalog-table.png)

Click an entry to open its detail page. The **Graph** tab shows the entry and its relationships, the **Properties** tab lists what each plugin reported about it.

![Graph view of a catalog entry and its neighbours](/documentation/catalog-graph.png)

[The Portal](/documentation/portal) describes every page in more detail.

## What is running where

Tilt forwards the services below to localhost. Dependencies are only forwarded when enabled in the test-dependencies chart.

| Service | Address |
| --- | --- |
| Portal (login here) | `http://localhost:3000` |
| UI (standalone, without the portal shell) | `http://localhost:3001` |
| Catalog API | `http://localhost:8090` |
| Keycloak | `http://localhost:8080` |
| LiteLLM | `http://localhost:4000` |
| MLflow | `http://localhost:5001` |
| MCP mock server | `http://localhost:8081` |

MLflow is forwarded to port 5001 because macOS reserves port 5000 for AirPlay.

To call the API directly, fetch a token from Keycloak and pass it as a bearer token. See [Catalog API](/documentation/api).

## Change the environment

The components of the dependency chart are selected through `tags` in its values. To change them, or to work on the chart itself, point Tilt at a local checkout:

```bash
tilt up -- --deps-repo=<path to a test-dependencies checkout>
```

Naira's own development values, including the enabled plugins and the sample Tech Radar, are in `deploy/charts/naira/values-dev.yaml`. Tilt watches the chart and re-applies changes.

## Tear down

```bash
tilt down                               # removes everything Tilt deployed
kind delete cluster --name naira-idp    # removes the cluster
```

## Next steps

- [Concepts](/documentation/concepts) explains nodes, relations, plugins and snapshots.
- [Plugins](/documentation/plugins) lists what each plugin reads and emits.
- [Contribute](/documentation/contribute) covers the developer tasks for tests, linting and chart checks.
