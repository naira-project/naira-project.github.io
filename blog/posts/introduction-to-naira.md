---
title: Introduction to Naira
description: The vision behind the open source AI engineering hub for organizations building AI-first systems.
date: 2026-06-16
author: Max Körbächer
tags:
  - announcement
  - introduction
---

# Naira: The Open Source AI Engineering Hub

In many organizations, the AI landscape grows faster than the platform around it. A model is tracked in one system. A dataset is documented somewhere else. An inference endpoint runs in a Kubernetes cluster or behind a managed provider API. Gateway routes, observability dashboards, cost signals, prompts, evaluations, security policies and application dependencies are spread across even more tools.

Each of these tools may be good at its own job. But the full picture is hard to see. Perfect conditions for "Shadow AI".

That is, in short, the problem Naira is built to solve.

**Naira is an open-source AI Engineering Hub that connects existing AI tools into one place to discover, govern and operate AI assets and services and their related components.**

It does not replace the systems where AI work happens. Instead, it makes the AI engineering landscape understandable, connected and actionable for the teams that need to build and run AI-enabled software in production.

## The Problem: AI Engineering Is Becoming Fragmented

Modern software engineering is already complex. Teams work with source control, CI/CD, container registries, infrastructure automation, observability, security scanning, incident management, documentation, service catalogs, various clouds and infrastructures and deployment systems. Shift left has become a standard saying (and its not good).

AI adds another layer of complexity. Same problems to solve as with software engineering, but different tools. It increases the cognitive load for everyone yet again.

Just as an example, the following (AI generated) image shows some basic domains for an AI factory. For each of these boxes we have dozens of options. Hard to manage, easy to lose an overview.
![Example AI Factory](/blog/ai_factory_architecture.png)

Teams now also need to understand:

- which models exist;
- which model versions are approved or deprecated;
- which datasets were used for training or fine-tuning;
- where inference endpoints are running;
- and what does those inference service provide;
- which applications consume which models;
- which gateway routes expose AI services;
- which prompts, evaluations or feedback signals are relevant;
- whether a model or endpoint can be used for a specific data classification;
- who owns an AI asset;
- where to find the right documentation;
- how to debug quality, latency, cost, or availability issues.

These questions are rarely answered in one place.

A platform engineer may know where the runtime lives, but not which business application depends on it. An AI engineer may know how a model was trained, but not where it is consumed. An application developer may want to add AI to a product, but not know which model or endpoint is approved for their use case.

This leads to duplicated work, unclear ownership, manual coordination and slow movement from experimentation to production.

It is especially painful because AI systems are not isolated technical artifacts. A model is connected to data, infrastructure, policies, prompts, applications, users, feedback and operational signals. Without context, teams cannot confidently answer basic production questions:

- Is this model safe to use?
- Where is this endpoint exposed?
- Which applications would be affected if we change this route?
- Who owns this integration?
- Which observability dashboard shows what is happening?
- Is there a better approved model for this use case?


## The Idea: An AI Engineering Hub

We describe Naira as an **AI Engineering Hub**.

Naira is not just a platform, a portal or a catalog. It is closest to something like an internal development platform (IDP), but we aim for more than that.

A **platform** can sound like the place where users train models, build RAG pipelines, run notebooks, or author AI applications directly. That is not the primary purpose of Naira.

A **portal** can sound too passive, as if users can only view information. Naira starts with visibility and discovery, but the long-term direction includes guided workflows, plugin lifecycle, safe actions, governance and operational support.

So, it is a **hub**. A hub connects things. It creates orientation. It helps users move between systems. It starts by making existing tools visible and understandable, then grow into a place where approved actions and workflows can be initiated safely.

For Naira, that means connecting AI assets and services across existing tools into one shared engineering experience.

## What Naira Does

Naira brings together the context that AI engineering teams need across the lifecycle of AI-enabled systems.

At the center is a connected view of important AI and software entities, such as:

- models and model versions;
- datasets and data sources;
- inference endpoints;
- MCP integrations;
- AI gateway routes;
- software components and applications;
- workspaces and ownership;
- documentation and runbooks;
- observability links and operational signals;
- plugin-provided metadata and actions.

The goal is not to move all data into a new monolith. The goal is to connect to the systems that already exist and make their context usable.

A model may still live in a model registry. A dataset may still be described in a data catalog. An endpoint may still run on Kubernetes, KServe, vLLM, or a managed provider API. A gateway may still be configured through cloud-native resources and GitOps. Observability may still live in Grafana, Prometheus, OpenTelemetry, Langfuse, or another specialized system.

Naira connects these pieces so users can understand how they relate.

## How Naira Helps Different Users

### For AI Engineers

AI engineers need to understand how their models, datasets, evaluations, prompts and deployments connect to real applications.

They need visibility into:

- model lineage;
- dataset relationships;
- evaluation and feedback signals;
- where a model is deployed;
- which applications consume it;
- whether operational behavior matches expectations.

Naira helps AI engineers see the production context around their work, not just the experiment or artifact in isolation. This becomes relevant when we think about the different tools needed and their options possible, for specific subjects: from fine-tuning, to creating RAGs, optimizing LLM performance and inference.

### For Application Developers

Application developers often want to consume AI capabilities without becoming experts in every AI infrastructure tool.

They need to know:

- which models or endpoints are approved;
- which model to use for which case;
- how to access them;
- what constraints apply;
- where the documentation is;
- who to contact;
- whether there is a template or golden path for their use case.

Naira should help an application developer move from “I need AI in my application” to “I know which approved service to use, how it is exposed and what my next step is.”

![Naira the AI Engineering Hub](/blog/Naira-AI-Engineering-Hub.jpeg)

### For Platform Engineers

Platform engineers are responsible for making AI workloads reliable, secure and operable. They need to understand what runs where, which teams depend on it and what could break when infrastructure changes.

With Naira, a platform engineer should be able to answer questions like:

- Which inference endpoints are running in this workspace?
- Which applications consume this model or endpoint?
- Which gateway route exposes this AI service?
- Who owns this component?
- Which dashboards or traces are useful for diagnosing issues?
- Which plugin provided this metadata, and when was it last synchronized?

Instead of jumping between many tools and reconstructing the dependency map manually, Naira provides a connected operational view.

### For Plugin Providers

Naira is designed to be extensible. AI engineering tooling changes quickly and no core team can build every integration themselves.

Plugins allow teams and communities to connect Naira to additional systems. But plugins must not make the user experience inconsistent or confusing. Naira therefore has clear expectations for plugin metadata, documentation, UI extension points, lifecycle states, ownership, and trust.

The hub should feel coherent even when many integrations contribute to it. This is maybe the hardest challenge to solve.


## How Naira Solves the Problem

Naira solves the fragmentation problem through a set of guiding principles and ideas. These may evolve over time and be adjusted based on end-user feedback, but for now they help us establish a clear direction.

### 1. Connect Existing Tools Instead of Replacing Them

Organizations already have tools for registries, gateways, deployments, observability, documentation and governance. Naira should not force teams to abandon them. Instead, Naira integrates with existing systems and shows their information in context.

This reduces adoption friction. Teams can start by connecting what they already use, then gradually add richer workflows as the hub matures.

### 2. Relationships, Not Just Lists

A simple list of models or datasets is not enough. 

AI engineering depends on relationships:

- a model was trained on a dataset;
- an endpoint serves a model;
- a gateway route exposes an endpoint;
- an application consumes a route;
- a team owns a component;
- a dashboard observes a service;
- a plugin discovered a resource.

Naira should make those relationships visible and navigable. This is what turns disconnected metadata into engineering context.

### 3. Provide Role-Oriented Views

Different users need different perspectives.

A platform engineer may prioritize workspaces, health information and dependencies. An application developer may look at approved services, templates and documentation. An AI engineer may start from models, datasets, evaluations and deployments.

Naira should guide users based on their goals while still keeping the underlying context connected.

### 4. Make Governance Part of the Experience

Governance should not only happen in separate policy documents or approval meetings. It should be visible in the product experience. Users should be able to see ownership, lifecycle state, access constraints, data classification, approval status, documentation and operational signals near the asset or service they want to use.

That does not replace formal governance systems. But it makes good decisions easier and unsafe decisions harder.


## What Naira Is

Naira is:

- an **open-source AI Engineering Hub**;
- a shared place to discover AI assets and services;
- a context layer across models, datasets, endpoints, gateways, applications, documentation, observability and plugins;
- a way to make ownership, lifecycle and governance visible;
- a role-oriented experience for platform engineers, application developers, and AI engineers;
- an extensible system that connects to existing tools through plugins;
- a foundation for future guided workflows and safe operations across AI engineering systems.

In short:

> Naira helps teams understand what AI capabilities exist, how they are connected, who owns them, where they run, and how they can be used safely.

![Naira Hub](/blog/Naira-hub.jpeg)


## What Naira Is Not

It is equally important to be clear about what Naira is not.

- Naira is **not** a model training platform.
- It is **not** a notebook environment.
- It is **not** a RAG builder.
- It is **not** an AI studio where users author every AI application directly.
- And, maybe most important, it is **not** a replacement for specialized systems such as model registries, data catalogs, inference runtimes, AI gateways, observability stacks, GitOps tools, or documentation platforms.

Naira may provide default integrations, reference components, templates or guided workflows over time. But the purpose is not to absorb every tool into one product. The purpose is to connect the AI engineering landscape into one understandable, governable, and increasingly actionable hub.

The best AI engineering environments will not be built by forcing every team into a single tool. They will be built by connecting the right tools with the right context and making the overall system easier to use.

## Why Open Source Matters

AI engineering and the entire "AI" domain is continuously evolving, partially with a pace where one finding of last week, gets overruled by a new finding this week. The tooling landscape is changing quickly and organizations have different requirements around infrastructure, compliance, data, providers and operational models. A massive challenge for companies.

A closed, one-size-fits-all product cannot easily match that diversity.

Naira is open source because the hub for AI engineering should be inspectable, extensible and adaptable. Teams should be able to understand how integrations work, contribute new plugins, adapt patterns to their environment and participate in the direction of the project.

Open source also matters for trust. If Naira becomes the place where teams understand their AI landscape, then its model, integrations, and governance assumptions should be visible and discussable.


## Where Naira Starts

Naira starts with the foundations required to make AI engineering visible and connected:

- core catalog and context capabilities;
- model and dataset discovery;
- plugin lifecycle and discovery;
- inference endpoint and gateway context;
- software catalog relationships;
- observability and documentation links;
- role-oriented user flows;
- design and UX foundations that make the product pleasant to use.

From there, the hub can grow toward richer workflows: plugin installation and configuration, guided onboarding, golden paths, operational actions, policy-aware access and deeper AI-native observability.

The direction is intentionally incremental.

First, make the landscape visible.

Then, make it understandable.

Then, make it governable.

Then, make safe actions easy.


## The Goal

The goal of Naira is not to become another place where AI engineers must do all their work. The goal is to reduce the cognitive load of AI engineering across an organization. A platform engineer should understand operational dependencies before making changes. An application developer should find approved AI services without knowing every backend tool. An AI engineer should see how models, data, deployments, and feedback connect to real applications. And a plugin provider should be able to extend the hub without fragmenting the experience.

If Naira succeeds, teams will spend less time asking “Where is this information?” and more time building, operating and improving AI-enabled systems responsibly.

That is what we mean by an **AI Engineering Hub**.

Naira connects the tools where AI work happens into one shared place to discover, govern and operate the AI landscape.

### Funded by the European Union

We are a new project and part of ApeiroRA which is an Important Project of Common European Interest - Next Generation Cloud Infrastructures and Services (IPCEI-CIS).

🌐 ApeiroRA?
ApeiroRA is a reference blueprint for an open, flexible, secure, and compliant next-generation cloud-edge continuum and therefore a key contribution to IPCEI-CIS. At a high level, the projects of ApeiroRA allow users to provider-agnostically fetch, request and consume services, and for service providers to describe, offer and provision their services.

Learn more about ApeiroRA by checking out the official website at https://apeirora.eu/.

![EU Funding](/blog/funded-EU-IPCEI.png)