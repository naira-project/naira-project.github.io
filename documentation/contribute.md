# Contribute

Naira is developed in the open and welcomes contributions: bug reports, feature ideas, plugins, code, tests and documentation. This page shows where things are and how the project works. The binding rules are in the [contribution guidelines](https://github.com/naira-project/naira/blob/main/CONTRIBUTING.md) of the main repository.

## Repositories

| Repository | Content |
| --- | --- |
| [naira](https://github.com/naira-project/naira) | The catalog, the plugins, the UI, the portal, the Helm chart and the Tiltfile |
| [architecture](https://github.com/naira-project/architecture) | RFCs, ADRs and DDRs: proposals and decisions about how Naira is built |
| [test-dependencies](https://github.com/naira-project/test-dependencies) | The Helm chart with the sample systems used for development and testing |
| [naira-project.github.io](https://github.com/naira-project/naira-project.github.io) | This website and documentation |

## Ways to contribute

- Report [bugs](https://github.com/naira-project/naira/issues/new/choose) with enough context to reproduce them.
- Suggest features and discuss ideas in [GitHub Discussions](https://github.com/naira-project/naira/discussions) or as an issue.
- Pick up an [open issue](https://github.com/naira-project/naira/issues). Comment on it first so nobody works on the same thing twice.
- Write a [plugin](/documentation/plugin-authoring) for a system you use.
- Improve this documentation. Every page has an edit link at the bottom.

Before implementing a larger change, open an issue describing the problem. The maintainers review it and assign it to you if it fits. Larger design changes start as an RFC in the architecture repository.

## Development workflow

[Getting Started](/documentation/getting-started) sets up the tools with mise and the local cluster with Tilt. The developer tasks do not need the cluster:

```bash
task --list          # all tasks
task check           # verify the tools are installed
task go:unit-test    # Go unit tests
task go:test         # Go unit and integration tests
task go:lint         # golangci-lint
task chart:check     # Helm chart render tests, ct lint, kubeconform
task shell:lint      # shellcheck
```

The UI under `ui/` and the portal under `naira-openmfp-portal/` are npm projects with their own `README.md`, including `npm run dev`, `npm test` and the Biome linter.

Each area of the repository has an `AGENTS.md` with coding conventions, for Go code, tests, plugins and documentation. They apply to humans and coding assistants alike, and reviewers refer to them.

## Pull requests

- Commit messages and PR titles follow [Conventional Commits](https://www.conventionalcommits.org/). CI enforces the title format, and the release tooling derives the changelog and version from it.
- Contributions are licensed under Apache 2.0, and the first pull request asks you to accept the Developer Certificate of Origin.
- The PR template asks what was changed, how it was tested, and whether and how AI tooling was used. Please fill it in.
- CI runs the Go tests and linters, the UI checks, the chart checks and a security scan. The end-to-end tests against a kind cluster run when a maintainer adds the `run-e2e` label.
- Plugin documentation is generated from the package godoc. Edit the comment and run `go generate` instead of editing the README.

## Documentation

Contributor-facing documentation lives next to the code: the chart README, the plugin READMEs and the `docs/` folder in the main repository. This website is for users and for anyone evaluating or extending Naira. When both describe the same thing, the repository is the source of truth and this site links to it.

The website is built with [VitePress](https://vitepress.dev/). Clone the repository, run `npm install` and `npm run dev`, and open a pull request with your change.
