# Handbooks

A handbook is a static site that a team writes in Git and installs in Naira: onboarding,
engineering standards, runbooks, approved patterns. The portal lists every installed
handbook in the **Docs** group of the sidebar and opens it inside the portal. Naira does not
edit or index handbooks, and a handbook's pages never become catalog properties. The team
that owns a handbook changes it through its own repository and review rules.

## Reading a handbook

Open a handbook from the Docs group. It opens at the portal address `/<id>`, and links inside
the handbook move the portal address with them, so a page can be shared by its link. The
footer of every page names the owner, the source repository, the version and the build time.
Every signed-in user can open every installed handbook.

## Writing a handbook

A handbook lives in its owner's repository. The
[handbook starter](https://github.com/naira-project/naira/tree/main/handbook/starter) is a
[VitePress](https://vitepress.dev) site: pages are Markdown files, and a file's path is its
address. The starter also defines the image contract `naira.handbook/v1alpha1`, which an
image built with another generator can follow as well.

The [example handbook](https://github.com/naira-project/example-handbook) is a complete
handbook repository built from the starter. To start your own:

1. Copy the example repository, or fork it.
2. In `package.json`, set `name` (the handbook id, a DNS label of at most 42 characters),
   `naira.title`, `naira.owner`, `repository` and `bugs`.
3. Set the same id as `handbook-id` in `.github/workflows/handbook-build.yml`.
4. Replace the pages in `docs/` and the sidebar in `.vitepress/config.mts`.
5. Push to `main`.

The workflow calls `reusable-handbook-build.yml` from
[naira-github-workflows](https://github.com/naira-project/naira-github-workflows). It builds
the image, signs it with Cosign (keyless), attests its provenance, pushes it to the GitHub
container registry and checks the image's `naira-handbook.json`. The run summary shows the
image reference with its digest, which is what the operator installs.

## Installing a handbook

The operator adds the handbook to the Helm values. The chart takes an image only by digest
and only from a registry in `handbookGateway.allowedRegistries`:

```yaml
handbookGateway:
  domain: handbook.naira.example.com
  scheme: https
  port: 443
  portalOrigin: https://naira.example.com
  allowedRegistries: [ghcr.io/naira-project]
handbooks:
  - id: example
    contract: naira.handbook/v1alpha1
    label: Example Handbook
    primary: true
    image: ghcr.io/naira-project/example-handbook@sha256:<digest>
```

An upgrade is a new digest. `enabled: false` or removing the entry removes the handbook and
nothing else.

Each handbook runs as its own Deployment and is served at its own address,
`<id>.<handbookGateway.domain>`, behind the handbook gateway (Envoy). The gateway checks the
user's Keycloak token before it serves a page and shows an "unavailable" page when a
handbook's pods are not healthy, so one broken handbook does not affect the others or the
portal. Operators provide:

- Wildcard DNS and a wildcard TLS certificate for `*.<handbookGateway.domain>`, pointing at
  the Service `handbook-gateway`. TLS ends in front of the gateway.
- A handbook domain on the same site as the portal, for example `naira.example.com` and
  `*.handbook.naira.example.com`. Browsers drop the handbook's session cookie otherwise.

## Trust

Handbook code runs in the user's browser with the user's access token: the portal hands the
token to every frame it shows, and a script in a handbook can call the catalog API as that
user. Naira does not prevent this yet. Install only handbooks whose code your organisation
trusts: pin them by digest, pull them from a registry you control, and verify their signature
before the digest goes into your values. The chart cannot check signatures; the operator
guide shows the `cosign verify` call.

## Further reading

- [Operator guide for handbooks](https://github.com/naira-project/naira/blob/main/docs/handbooks.md):
  DNS, TLS, the same-site rule, the local development setup and signature checks.
- [Chart README, Handbooks](https://github.com/naira-project/naira/blob/main/deploy/charts/naira/README.md#handbooks):
  what the chart renders and every value.
- [Starter README](https://github.com/naira-project/naira/blob/main/handbook/starter/README.md):
  the image contract, `naira-handbook.json` and the upgrade rules.
