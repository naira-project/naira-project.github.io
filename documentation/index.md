# Introduction

Naira is the open-source AI Engineering Development Platform for cloud-native teams.
It gives platform and AI engineering teams a single place to discover, manage, and govern the AI assets that power their products, models, datasets, inference endpoints, and integrations, all built natively on Kubernetes.

:::info
Naira is an early preview version, designed to provide a demo environment and showcase the Naira Portal for exploring the platform and offering valuable feedback. Please note that it is not yet complete and is still under active development. Your feedback is essential in helping us refine and improve the platform.
:::

## Why do we Need an AI Engineering Internal Development Platform?

AI engineering today is fragmented. Teams building AI-enabled products navigate between two hand full of tools for standard software development, then add another one or two dozens specialized tools for AI work: experiment trackers, model registries, inference platforms, observability,chaches, usgae optimizations and gateway configurations. Each tool holds a piece of the picture. None holds the whole thing.

This creates real costs. Data scientists train models that platform engineers can't find. Software engineers integrate inference endpoints without knowing their detailed profiles or SLA. Product owners lack visibility into which models are actually in use, by whom, and how they perform. Security teams struggle to audit AI resource access across a patchwork of systems. And as regulations like the EU AI Act take effect, organizations need transparency they simply don't have.

The result is knowledge silos, duplicated effort, and slower time-to-value for AI products.

### What Naira Does

Naira brings these fragmented worlds together into one coherent platform experience. It is purpose-built for the AI engineering lifecycle, not retrofitted from a general-purpose developer portal.

**Discover and manage AI assets.** Naira provides unified registries for models, datasets, Model Context Protocol (MCP) integrations, and inference endpoints. Every AI asset is cataloged with its metadata, ownership, health status, and relationships to other assets. 

**Orchestrate platform workflows.** From webhook ingestion to event processing to real-time dashboards, Naira provides an opinionated but extensible architecture for the data flows that power AI platforms. Golden path templates accelerate delivery while ensuring consistency across teams.

**Improve reliability and governance.** AI-native observability goes beyond traditional metrics. Naira consumes the date for inference latency, model performance trends, token usage, and cost with OpenTelemetry instrumentation across every service. Fine-grained access control through OpenFGA ensures that the right people have access to the right resources, with a full audit trail.

**Accelerate delivery.** Reusable application templates, a unified service catalog and a micro-frontend dashboard reduce the cognitive load on engineers. Instead of context-switching between tools, teams work from a single pane of glass.

**Avoid lock-in.** Naira integrates best-of-breed tools rather than replacing them. It works with your existing model providers, observability stack, and CI/CD pipelines. The CRD-first architecture means your AI asset definitions live in Kubernetes alongside everything else you manage declaratively.

### Who Naira Is For
Naira serves multiple personas, each with distinct needs:
- AI Engineers manage the full model lifecycle —> from registration and experimentation through deployment and monitoring. Naira gives them a model registry, inference service catalog, and performance monitoring in one place. As well as the unified starting point to fine-tune models, build RAG systems or see direct effects of enhancing AI systems with new components.
- Software Engineers integrate AI capabilities into applications. They discover available models and inference endpoints through the service catalog, consume them through a unified AI API Gateway, and treat AI services as reliable dependencies with clear SLAs.
- Application Product Owners need visibility into how AI is being used across their products. Naira provides usage metrics, cost breakdowns, and performance trends without requiring deep technical expertise.
- Platform Engineers design and operate the underlying infrastructure. Naira's Kubernetes-native architecture, Platform Mesh integration, and multi-tenant control planes give them the tools to manage AI infrastructure at scale.
