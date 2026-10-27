# Tech Radar

The Tech Radar is a read-only governance view. It shows which technologies
(models, agentic patterns, knowledge techniques) the organization has decided
to adopt, trial, assess, or hold, next to the assets the catalogs already
describe. Decisions are managed in a single YAML configuration file. The
portal renders that file and offers no write path, so governance stays
auditable through whatever review process already owns the file.

![The Tech Radar overview: entries plotted across four quadrants and the adopt, trial, assess, and hold rings](/documentation/tech-radar-1.png)

The radar expresses the organization's *target vision*, not what is currently
deployed or in use. Entries can still point at the catalog: an entry's optional
`catalog_refs` describe which models and inference endpoints it is about, and
the portal resolves them at read time. See
[Linking entries to the catalog](#linking-entries-to-the-catalog).

## How it works

The radar is provided by the `tech-radar` plugin:

- The plugin reads the config file (default
  `/etc/naira/techradar/radar.yaml`, overridable via the
  `TECH_RADAR_CONFIG_PATH` environment variable) on **every** collect, so
  changes take effect on the next sync without a redeployment.
- A valid file becomes one `tech_radar` node (radar metadata plus the quadrant
  and ring taxonomies) and one `tech_radar_entry` node per entry.
- An invalid file fails the collect with errors naming the offending **line,
  field, and reason**. A failed collect never touches the store, so the
  previous radar stays visible ("last known good"). The errors appear in the
  plugin log and in the sync operation's error message on the Plugins page.
- Radar data is served by the standard catalog API, with no dedicated
  endpoints:

  ```
  GET /v1/nodes?filter=kind="tech_radar"
  GET /v1/nodes?filter=kind="tech_radar_entry"
  ```

:::info
The catalog store is in-memory: after a catalog restart the radar (like all
catalog data) is empty until the next plugin sync runs.
:::

## Using the radar

Open **Tech Radar** in the portal. The overview shows the radar circle, the
ring definitions, the edition label, and the count of entries that moved since
the previous edition. Each quadrant links to a filterable table with every
entry's rationale, so the "why" behind each placement is always one click
away. The table's **In catalog** column lists the models and inference
endpoints matched by the entry's `catalog_refs`, each linking to its catalog
detail page.

![Quadrant summary cards listing each entry per ring, with movement markers and links to the detail view](/documentation/tech-radar-2.png)

## Linking entries to the catalog

An entry can declare which catalog nodes it is about through `catalog_refs`.
The radar file keeps no node names, only matching rules, so the links follow
the catalog as plugins add and remove nodes.

```yaml
entries:
  - id: claude-sonnet
    name: Claude Sonnet
    quadrant: models
    ring: adopt
    owner: ml-platform
    rationale: Default general-purpose model.
    catalog_refs:
      - match: claude-sonnet
        kinds: [model, inference_endpoint]
      - kinds: [model]
        plugins: [bedrock]
```

A node matches a ref when every field of the ref matches it:

- `kinds` is required and lists the node kinds the ref applies to.
- `match` is compared case-insensitively as a substring of the node path.
  `claude-sonnet` therefore finds `litellm/claude-sonnet-4` as well as
  `bedrock/anthropic.claude-sonnet-4-...`, and older versions of the model
  along with the current one.
- `plugins` lists the plugin names, as configured in the Helm chart, that
  must have reported the node. The second ref above links every model the
  `bedrock` plugin reports, regardless of path.
- A ref needs `match`, `plugins`, or both. A ref with only `kinds` is
  rejected by the plugin, so an incomplete ref can never link an entry to
  every node of a kind.

An entry matches a node when any of its refs matches it.

The portal resolves the refs when the page is loaded. On the quadrant table,
the **In catalog** column lists the matched nodes grouped by kind, with
**Models** and **Endpoints** first and other kinds after them, each linking
to the node's detail page. On a node's detail page, the entries that match
it appear as badges with the entry's name and ring, each linking to the
entry's quadrant, so a model page shows at a glance whether the organization
has decided to adopt or hold it. Matching happens on the first 1000 nodes of
each referenced kind.

The plugin stores the refs as a JSON property, `catalog_refs`, on the
`tech_radar_entry` node and emits no relations for them.

## Updating the radar

The Helm chart mounts the config from the `plugin-tech-radar-config`
ConfigMap, set by `catalog.plugins.tech-radar.config` (see the chart's
[plugins section](https://github.com/naira-project/naira/tree/main/deploy/charts/naira#plugins)).
In the local dev environment, the config is in
[`deploy/charts/naira/values-dev.yaml`](https://github.com/naira-project/naira/blob/main/deploy/charts/naira/values-dev.yaml).

1. With `tilt up` running, edit `radar.yaml` under
   `catalog.plugins.tech-radar.config.data` and save. Tilt applies the
   ConfigMap and restarts the catalog pod.
2. Once the catalog pod is ready, trigger a sync from the portal's Plugins page, or
   `POST /v1/plugins/tech-radar:run` (or `POST /v1/plugins:run`).
3. Reload the **Tech Radar** page in the portal.

A `kubectl edit` of the ConfigMap lasts only until Tilt next applies the chart.

If the sync fails, the operation on the Plugins page shows the validation
errors. The previously synced radar keeps rendering until a valid config
syncs successfully.

Because the radar is driven by a plain mounted file, the mechanism composes
with any external GitOps tooling: keep `radar.yaml` in a reviewed repository
and let your delivery pipeline update the ConfigMap.

## Configuration schema

`schema_version` is required and must be `1`.

| Field | Required | Description |
| --- | --- | --- |
| `schema_version` | yes | Schema version; only `1` is accepted. |
| `radar.id` | no | Radar identifier, defaults to `default`. Becomes the node path prefix (`<radar.id>/<entry.id>`). |
| `radar.title` | yes | Display title of the radar. |
| `radar.edition` | yes | Free-form edition label, e.g. `2026-09`. |
| `radar.owner` | yes | Owning team or board. |
| `quadrants` | yes | Exactly **4** quadrants, in display order. Each has `id` and `name`. |
| `rings` | yes | 1-6 rings, ordered **innermost to outermost**. Each has `id`, `name`, and an optional `description`. |
| `entries` | yes | The radar entries. Must be present; use `[]` for a radar without entries. Omitting the key is a validation error, so an accidentally deleted block cannot silently wipe the radar. |
| `entries[].id` | yes | Stable identifier; with `radar.id` it forms the node path. |
| `entries[].name` | yes | Display name. |
| `entries[].quadrant` | yes | Must match a declared quadrant `id`. |
| `entries[].ring` | yes | Must match a declared ring `id`. |
| `entries[].moved` | no | `in`, `out`, or `none` (default). Movement since the previous edition. |
| `entries[].owner` | yes | Team accountable for the decision. |
| `entries[].rationale` | yes | Why the entry sits in its ring. |
| `entries[].catalog_refs` | no | List of refs linking the entry to catalog nodes. A node matches a ref when all of the ref's fields match it. Each ref needs `match`, `plugins`, or both. |
| `entries[].catalog_refs[].match` | no | Matched case-insensitively as a substring of the node path, so one ref finds a model under every provider serving it. At most 200 characters. |
| `entries[].catalog_refs[].kinds` | yes | Node kinds to match, for example `[model, inference_endpoint]`. |
| `entries[].catalog_refs[].plugins` | no | Names of the plugins that emitted the node, as configured in this deployment, for example `[litellm]`. |

All `id` fields must match `^[a-z0-9][a-z0-9_-]*$` and be at most 100
characters. Ids become node paths, so oversized ids are rejected rather than
clipped. Unknown fields are rejected, so typos surface as validation errors
instead of being silently ignored. Entry order in the file is canonical: it
drives the numbering on the radar chart and in the quadrant summaries. Values
in `catalog_refs` must not have leading or trailing whitespace, and refs and
list items must be unique within an entry.

The plugin's [`sample_config.yaml`](https://github.com/naira-project/naira/blob/main/plugins/cmd/tech_radar/sample_config.yaml)
is parsed by its tests, so it is always a valid, current example of the schema.

Free-form text is clipped rather than rejected, so an oversized value never
blocks a sync. Short labels (titles, names, owners, the edition) are capped at
200 characters and long-form text (an entry's rationale, a ring's description)
at 2000, each with a trailing ellipsis and a warning in the plugin log.

## Annotated example

```yaml
schema_version: 1            # required; only 1 accepted
radar:
  id: naira                  # optional, default "default"
  title: Naira Tech Radar    # required
  edition: 2026-09           # required; free-form edition label
  owner: platform-team       # required
quadrants:                   # required; exactly 4; order = display order
  - id: models
    name: Models
  - id: agentic
    name: Agentic Patterns
  - id: knowledge
    name: Knowledge Techniques
  - id: others
    name: Others
rings:                       # required; 1-6; order = innermost to outermost
  - id: adopt
    name: Adopt
    description: Proven; default choice for new work.
  - id: trial
    name: Trial
    description: Worth pursuing on projects that can absorb risk.
  - id: assess
    name: Assess
    description: Explore to understand impact.
  - id: hold
    name: Hold
    description: Do not start new work with this.
entries:
  - id: claude-sonnet
    name: Claude Sonnet
    quadrant: models         # must match a quadrant id
    ring: adopt              # must match a ring id
    moved: in                # in | out | none; default none
    owner: ml-platform
    rationale: >
      Default general-purpose model; served through the central gateway.
    catalog_refs:            # optional; links the entry to catalog nodes
      - match: claude-sonnet # substring of the node path, case-insensitive
        kinds: [model, inference_endpoint]
        plugins: [litellm]   # optional; only nodes from these plugins
  - id: naive-rag
    name: Naive RAG
    quadrant: knowledge
    ring: hold
    moved: out
    owner: ai-board
    rationale: >
      Superseded by hybrid retrieval; migrate existing pipelines.
```

## Out of scope

In-portal editing, historic editions, enforcement of radar decisions, multiple
radars per instance, and Git-based config sync are all out of scope for now.
The mounted-file mechanism composes with any external GitOps tooling.

The plugin's [README](https://github.com/naira-project/naira/tree/main/plugins/cmd/tech_radar)
documents its environment variables, and the chart README its Helm values.
