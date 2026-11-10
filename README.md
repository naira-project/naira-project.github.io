# Naira - Website and Documentation

This Repository contains the Naira Website and Documentation. This website is built using [VitePress](https://vitepress.dev/, a modern static website generator.

## Local Run

```sh
npm install
npm run dev
```

## Code Checks

Biome formats and lints the project's JavaScript, TypeScript, JSON, and CSS files. Run the
checks (including the TypeScript check) before submitting changes:

```sh
npm run check
```

To apply Biome's safe formatting and fixes:

```sh
npm run fix
```

## Releasing

The release is performed automatically through a GitHub Actions Workflow. The resulting website will be available as github page under the following URL: https://naira-project.github.io/

## Requirements

The website requires an installation of node.js and npm.
Checkout the [package.json](package.json) for the required node version and dependencies and install them via `npm install`.

## Contributing

Please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file in this repository for instructions on how to contribute to Naira.

## Code of Conduct

Please refer to the [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) file in this repository for information on the expected Code of Conduct for contributing to Naira.

<p align="center"><img alt="Bundesministerium für Wirtschaft und Energie (BMWE)-EU funding logo" src="https://apeirora.eu/assets/img/BMWK-EU.png" width="400"/></p>
