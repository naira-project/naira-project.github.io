# Introduction

Naira is an open-source AI Engineering Hub that connects existing AI tools into one place to discover, govern, and operate the AI assets and services that power your products, models, datasets, inference endpoints, and integrations.
It does not replace the systems where AI work happens. Instead, it makes the AI engineering landscape understandable, connected, and actionable for the platform, application, and AI engineering teams who build and run AI-enabled software in production.

:::info
Naira is an early preview version, designed to provide a demo environment and showcase the Naira Portal for exploring the hub and offering valuable feedback. Please note that it is not yet complete and is still under active development. Your feedback is essential in helping us refine and improve it.
:::

## Why an AI Engineering Hub?

AI engineering today is fragmented. Teams building AI-enabled products navigate two handfuls of tools for standard software development, then add another one or two dozen specialized tools for AI work: experiment trackers, model registries, inference platforms, observability, caches, usage optimizations, and gateway configurations. Each tool holds a piece of the picture. None holds the whole thing.

This creates real costs. AI engineers train models that platform engineers can't find. Application developers integrate inference endpoints without knowing their detailed profiles or SLA. Nobody has a clear view of which models are actually in use, by whom, and how they perform. Security teams struggle to audit AI resource access across a patchwork of systems. And as regulations like the EU AI Act take effect, organizations need a transparency they simply don't have.

The result is knowledge silos, duplicated effort, unclear ownership, and slower time-to-value for AI products.
Naira addresses this not by becoming yet another place to do all the work, but by connecting the tools where AI work already happens into one shared engineering experience.

### What Naira Does

Naira brings these fragmented worlds together into one coherent platform experience. It is purpose-built for the AI engineering lifecycle, not retrofitted from a general-purpose developer portal.

The goal is not to move everything into a new monolith. Every information stays in its domain. Naira connects these pieces so teams can understand how they relate and turning disconnected metadata into engineering context.

**Discover and manage AI assets.** Naira provides unified registries views for models, datasets, Model Context Protocol (MCP) integrations, and inference endpoints. Every AI asset is cataloged with its metadata, ownership, health status, and relationships to other assets.

**Orchestrate platform workflows.** From webhook ingestion to event processing to real-time dashboards, Naira provides an opinionated but extensible architecture for the data flows that power AI platforms. Golden path templates accelerate delivery while ensuring consistency across teams.

**Improve reliability and governance.** AI-native observability goes beyond traditional metrics. Naira consumes data on inference latency, model performance trends, token usage, and cost using OpenTelemetry instrumentation across every service. Fine-grained access control through OpenFGA ensures that the right people have access to the right resources, with a full audit trail.

**Accelerate delivery.** Reusable application templates, a unified service catalog and a micro-frontend dashboard reduce the cognitive load on engineers. Instead of context-switching between tools, teams work from a single pane of glass.

**Avoid lock-in.** Naira integrates best-of-breed tools rather than replacing them. It works with your existing model providers, observability stack, and CI/CD pipelines. The CRD-first architecture means your AI asset definitions live in Kubernetes alongside everything else you manage declaratively.

### Who Naira Is For
Naira serves multiple personas, each with distinct needs:
- AI Engineers manage the full model lifecycle —> from registration and experimentation through deployment and monitoring. Naira gives them a model registry, an inference service catalog, and performance monitoring, all in one place. As well as the unified starting point to fine-tune models, build RAG systems or see direct effects of enhancing AI systems with new components.
- Software Engineers integrate AI capabilities into applications. They discover available models and inference endpoints through the service catalog, consume them through a unified AI API Gateway, and treat AI services as reliable dependencies with clear SLAs.
- Application Product Owners need visibility into how AI is being used across their products. Naira provides usage metrics, cost breakdowns, and performance trends without requiring deep technical expertise.
- Platform Engineers design and operate the underlying infrastructure. Naira's Kubernetes-native architecture, Platform Mesh integration, and multi-tenant control planes give them the tools to manage AI infrastructure at scale.
- Plugin Providers extend Naira to new systems. Because the AI tooling landscape changes quickly, plugins let teams and communities connect additional tools, guided by clear expectations for metadata, documentation, lifecycle, ownership, and trust, so the hub stays coherent as it grows.

### What Naira Is Not
Being clear about scope matters as much as describing capabilities. Naira is not a model training platform, a notebook environment, a RAG builder, or an AI studio where users author every application directly. And, most importantly, it is not a replacement for specialized systems such as model registries, data catalogs, inference runtimes, AI gateways, observability stacks, GitOps tools, or documentation platforms.

The best AI engineering environments are not built by forcing every team into a single tool. They are built by connecting the right tools with the right context and that is exactly what Naira sets out to do.