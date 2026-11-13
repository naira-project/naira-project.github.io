# Deployment

Naira is installed with one Helm chart. The chart deploys the catalog with its plugin sidecars, the UI and the portal, plus a PostgreSQL database. It does not deploy the systems the plugins read from, nor Keycloak. Those already exist in your environment, or, for evaluation, come from the [test-dependencies](https://github.com/naira-project/test-dependencies) chart.

The [chart README](https://github.com/naira-project/naira/tree/main/deploy/charts/naira) is the reference for every value, constraint and validation. This page covers what you need to plan an installation.

## Prerequisites

- A Kubernetes cluster and Helm.
- A Keycloak realm with an OIDC client for the portal. The catalog accepts tokens from this realm only.
- The systems you want to catalog, reachable from the cluster: a LiteLLM gateway, MLflow, OpenMetadata, MCP servers, FluxCD in the cluster, and so on. Disable the plugins for systems you do not have.
- Secrets with the credentials the enabled plugins need, the portal's OIDC client secret and the database passwords. The chart can create development Secrets from values, but for anything beyond a laptop, supply them yourself.

## Install

Released charts are published as OCI artifacts:

```bash
helm install naira oci://ghcr.io/naira-project/charts/naira --version <release> \
  -n idp-system --create-namespace -f my-values.yaml
```

Container images for the catalog, the UI, the portal and each plugin are published to `ghcr.io/naira-project` with every release, for amd64 and arm64, with a software bill of materials attached. Releases are listed on [GitHub](https://github.com/naira-project/naira/releases).

From a checkout, build the chart dependencies first, since the PostgreSQL subchart is not vendored:

```bash
helm dependency build deploy/charts/naira
helm install naira deploy/charts/naira -n idp-system --create-namespace -f my-values.yaml
```

The chart refuses to render with bare defaults: it needs a source for the catalog Secret and the portal Secret, and it validates the plugin, database and Secret configuration before anything is applied.

## What to configure

**Addresses the browser uses.** `keycloak.issuer`, `keycloak.authUrl`, `keycloak.baseDomain` and `portal.uiBaseUrl` default to localhost for the port-forwarded development setup. Anywhere else, set them to the addresses users reach in the browser.

**Plugins.** Each plugin is one entry under `catalog.plugins.<name>` with `enabled`, `schedule`, `env`, Secret references, and for cluster-reading plugins `rbac.rules`. Point the `*_BASE_URL` variables at your systems. Plugins that read Secrets cluster-wide or need a token are off by default. See [Plugins](/documentation/plugins).

**Tech Radar.** Enable the `tech-radar` plugin and provide the radar file through `config.data` or an existing ConfigMap. See [Tech Radar](/documentation/tech-radar).

**Database.** The chart runs a PostgreSQL server by default and seeds one database per entry in `database.databases`, with its own role and password, idempotently. Set `postgresql.enabled=false` and `database.host` to use an existing server, and a strict `database.sslmode` in that case. The catalog does not persist its graph there yet.

**Metrics.** `ui.prometheus.upstream` names the Prometheus-compatible endpoint the UI queries for the metric panels on inference endpoint pages. The UI forwards the user's token, so the endpoint is never exposed unauthenticated.

**Scheduling and security.** `nodeSelector`, `tolerations`, `affinity`, `priorityClassName`, probes and security contexts are available per component. The catalog and the plugins run as non-root with all capabilities dropped and meet the restricted Pod Security standard. A NetworkPolicy restricts ingress to the catalog to the UI pods.

## Constraints to know

- One release per namespace. Namespaced objects have fixed names. Several releases per cluster work as long as release names differ.
- The catalog connects to every enabled plugin at startup and exits if one is unreachable. Check the plugin sidecar logs when the catalog does not become ready.
- The catalog store is in memory. A restart empties it until the plugins run again, so give plugins a schedule rather than relying on manual runs.
- Plugin sidecars listen on loopback and have no probes.

## Development environment

For a local cluster, [Getting Started](/documentation/getting-started) describes the kind and Tilt setup. It uses `values-dev.yaml`, which is the only values file that creates Secrets from values, together with the test-dependencies chart for Keycloak, LiteLLM, MLflow, llama.cpp and a mock MCP server. The dependencies chart also offers OpenMetadata, vLLM and a monitoring stack with Prometheus and Grafana behind tags.

## Releases and versioning

Naira uses conventional commits and [release-please](https://github.com/googleapis/release-please). A release PR collects the changes since the last release, and merging it tags the release, publishes the images and the chart, and updates the [changelog](https://github.com/naira-project/naira/blob/main/CHANGELOG.md). During the alpha phase, releases can contain breaking changes.
