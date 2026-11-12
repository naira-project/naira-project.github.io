# Catalog API

The catalog exposes an HTTP API under `/v1`. The portal uses it, and so can scripts, CI jobs and other tools. The API follows the resource-oriented conventions of the [Google API Improvement Proposals](https://google.aip.dev/) for naming, listing and long-running operations.

## Authentication

Every request under `/v1` needs a bearer token issued by the Keycloak realm the catalog is configured with. Only `/healthz` is open.

In the local environment, fetch a token with the password grant of the portal client and pass it in the `Authorization` header:

```bash
TOKEN=$(curl -s -d grant_type=password -d client_id=naira-portal \
  -d client_secret=naira-local-dev-secret \
  -d username=testuser -d password=testpass \
  http://localhost:8080/realms/naira/protocol/openid-connect/token | jq -r .access_token)

curl -s -H "Authorization: Bearer $TOKEN" 'http://localhost:8090/v1/nodes?filter=kind="model"' | jq
```

`GET /v1/auth/verify` returns a success status when the token is valid, which is a quick way to check credentials.

## Endpoints

| Method and path | Purpose |
| --- | --- |
| `GET /v1/nodes` | List nodes |
| `GET /v1/nodes/{kind}/{path}` | Get one node. The path may contain slashes |
| `GET /v1/relations` | List relations |
| `GET /v1/kinds` | List the node kinds present in the catalog |
| `GET /v1/plugins` | List configured plugins with their schedules |
| `GET /v1/plugins/{plugin}` | Get one plugin |
| `POST /v1/plugins:run` | Run all plugins |
| `POST /v1/plugins/{plugin}:run` | Run one plugin |
| `GET /v1/operations` | List plugin runs |
| `GET /v1/operations/{operationId}` | Get one plugin run |
| `GET /v1/auth/verify` | Check the bearer token |
| `GET /healthz` | Liveness, no authentication |

## Listing, paging and filtering

List endpoints share the same parameters:

- `pageSize` limits the number of items. The default is 50, the maximum 1000.
- `pageToken` continues a listing. Each response that has more items carries a `nextPageToken` to pass on the next request.
- `filter` restricts the listing to items where one field equals a value. The syntax is a single equality, `field="value"`. Chained expressions and other operators are not supported yet.

Every list response has the items, `totalSize` and, if there is more, `nextPageToken`.

The filterable fields:

| Resource | Fields |
| --- | --- |
| nodes | `name`, `kind`, `path` |
| relations | `name`, `kind`, `fromNode`, `toNode` |
| operations | `plugin` |

For example, all relations of one kind:

```
GET /v1/relations?filter=kind="serves_model"
```

## Resources

### Node

```json
{
  "name": "nodes/model/litellm/gpt-4o",
  "kind": "model",
  "path": "litellm/gpt-4o",
  "pluginClaims": [
    { "plugin": "litellm", "props": { "provider": "openai", "mode": "chat" } }
  ]
}
```

`name` is the resource name, `nodes/<kind>/<path>`. `pluginClaims` holds the properties per plugin that reported the node, in a stable order.

### Relation

```json
{
  "name": "relations/serves_model/nodes%2Finference_endpoint%2Flitellm%2Fgpt-4o|nodes%2Fmodel%2Flitellm%2Fgpt-4o",
  "kind": "serves_model",
  "fromNode": "nodes/inference_endpoint/litellm/gpt-4o",
  "toNode": "nodes/model/litellm/gpt-4o",
  "pluginClaims": [ { "plugin": "litellm", "props": {} } ]
}
```

`fromNode` and `toNode` are node resource names.

### Plugin

```json
{ "name": "litellm", "schedule": "0 0 * * *" }
```

`schedule` is a cron expression or empty for plugins that only run on demand.

### Operation

Running a plugin returns an operation and the run continues in the background. Poll the operation to see the outcome.

```json
{
  "name": "plugin-run-6d0b2c4e-1f7a-4c2e-9b51-0e3a8f1d2c47",
  "metadata": {
    "plugin": "litellm",
    "startTime": "2026-10-27T09:00:00Z",
    "endTime": "2026-10-27T09:00:04Z",
    "createdAt": "2026-10-27T09:00:00Z"
  },
  "done": true,
  "response": { "nodesUpserted": 12, "relationsUpserted": 8 }
}
```

A failed run has `done: true` and an `error` object with a `message` instead of `response`. `POST /v1/plugins:run` returns one operation per plugin.

## Stability

The API is versioned under `/v1` but Naira is in alpha, and the API may change in breaking ways between releases. The design is described in [RFC-004](https://github.com/naira-project/architecture/blob/main/rfc/rfc-004-core-api-v1-design.md).
