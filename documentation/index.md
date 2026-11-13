# Introduction

Naira is an open-source AI Engineering Hub. It connects the tools where AI work already happens into one catalog, so teams can discover, understand and operate the models, inference endpoints, datasets, MCP servers and applications that make up their AI landscape.

Naira does not replace those tools. It reads from them through plugins, stores what it finds as a graph of assets and relationships, and shows that graph in a portal built for platform, application and AI engineering teams.

:::info
Naira is in an alpha stage. APIs, data models and concepts may change on short notice, including breaking changes. The project is under active development and your feedback shapes where it goes. The [Getting Started](/documentation/getting-started) guide brings up a complete local environment in a few minutes.
:::

## Why an AI Engineering Hub?

AI engineering today is fragmented. Teams building AI-enabled products navigate the usual software delivery tooling, then add a growing set of specialized tools for AI work: experiment trackers, model registries, inference platforms, AI gateways, MCP servers, observability stacks and cost dashboards. Each tool holds a piece of the picture. None holds the whole thing.

This creates real costs. AI engineers train models that platform engineers cannot find. Application developers integrate inference endpoints without knowing their profile or SLA. Nobody has a clear view of which models are actually in use, by whom, and how they perform. Security teams struggle to audit AI resource access across a patchwork of systems. And as regulations like the EU AI Act take effect, organizations need a transparency they simply do not have.

The result is knowledge silos, duplicated effort, unclear ownership and slower time-to-value for AI products. Naira addresses this not by becoming yet another place to do the work, but by connecting the places where the work already happens.

## What Naira does today

**A catalog of AI assets and their relationships.** Plugins scan systems such as LiteLLM, MLflow, OpenMetadata, FluxCD, GitHub, AWS Bedrock and MCP servers, and report what they find as nodes and relations. The catalog merges those reports into one graph, keeping track of which plugin said what. See [Concepts](/documentation/concepts).

**Catalogs per asset type.** The portal shows dedicated catalogs for models, inference endpoints, datasets, MCP servers and the software running in the cluster. Every entry has a detail page with its properties, its neighbours in the graph and, for inference endpoints, usage metrics. See [The Portal](/documentation/portal).

**A governance view.** The Tech Radar shows which technologies the organization has decided to adopt, trial, assess or hold, driven by a reviewed YAML file and linked to the catalog entries it talks about. See [Tech Radar](/documentation/tech-radar).

**An API for everything in the catalog.** Nodes, relations, kinds, plugins and plugin runs are available through an authenticated HTTP API. See [Catalog API](/documentation/api).

**A Helm chart and a local development environment.** Naira installs with one chart next to the systems it reads from. A kind cluster with Tilt brings up everything, including sample dependencies, for development and evaluation. See [Deployment](/documentation/deployment) and [Getting Started](/documentation/getting-started).

## Where Naira is heading

The catalog is the foundation. On top of it, Naira aims to provide:

- **Orchestrated platform workflows.** Golden path templates and reusable application templates that accelerate delivery while keeping teams consistent.
- **Reliability and governance.** AI-native observability covering inference latency, model performance trends, token usage and cost, and fine-grained access control with a full audit trail.
- **A plugin ecosystem.** A place where vendors and communities publish and maintain plugins for their tools, with clear expectations for metadata, lifecycle, ownership and trust.
- **Documentation in context.** Model cards, dataset cards, READMEs and runbooks shown next to the assets they describe.

Proposals and decisions for these topics live in the [architecture repository](https://github.com/naira-project/architecture) as RFCs, ADRs and DDRs.

Naira is built with and for the cloud-native ecosystem. It integrates closely with [OpenMFP](https://openmfp.org/) for the portal and is designed to work with [Platform Mesh](https://platform-mesh.io/main/), [kcp](https://github.com/kcp-dev/kcp) and other components of the NeoNephos stack.

## Who Naira is for

- **AI Engineers** manage the model lifecycle from registration and experimentation through deployment and monitoring. Naira gives them a model registry view, an inference endpoint catalog and usage metrics in one place.
- **Software Engineers** integrate AI capabilities into applications. They discover available models, endpoints and MCP tools through the catalog and see how their deployments relate to them.
- **Application Product Owners** need visibility into how AI is used across their products: which models are in use, by which services, and how they perform.
- **Platform Engineers** design and operate the underlying infrastructure. Naira's Kubernetes-native architecture and Helm chart fit into the platforms they already run.
- **Plugin Providers** extend Naira to new systems. Because the AI tooling landscape changes quickly, plugins let teams and communities connect additional tools without changes to the core.

## What Naira is not

Being clear about scope matters as much as describing capabilities. Naira is not a model training platform, a notebook environment, a RAG builder or an AI studio where users author applications directly. Most importantly, it is not a replacement for specialized systems such as model registries, data catalogs, inference runtimes, AI gateways, observability stacks, GitOps tools or documentation platforms.

The best AI engineering environments are not built by forcing every team into a single tool. They are built by connecting the right tools with the right context, and that is exactly what Naira sets out to do.
