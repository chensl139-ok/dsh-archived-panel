# unarchiveSession — official-source patch

The 已归档 panel's **unarchive** action calls `ctx.workspaces.unarchiveSession(id)`.
That service method does **not** exist on a stock deepseek-harness checkout. To
enable unarchive, apply this patch to a **source checkout of
[`deepseek-ai/deepseek-harness`](https://github.com/deepseek-ai/deepseek-harness)**.

This bundle itself only *consumes* the method (feature-detected, see
`src/client/index.ts`); it does **not** carry the official-source change.
Without the patch the button is hidden and the panel degrades to **view + open**.

## What the patch adds

A new `unarchiveSession` capability wired end-to-end, mirroring the existing
`archiveSession`:

| Layer | File | Adds |
|---|---|---|
| Workspace registry | `packages/workspace/workspace/src/index.ts` | `WorkspaceRegistry.unarchiveSession(sessionId)` |
| Host API interface | `packages/host/apiproxy/src/api/workspace.ts` | `WorkspaceApi.unarchiveSession(...)` |
| Wire schemas | `packages/host/apiproxy/src/api/workspace.schema.ts` | `workspaceUnarchiveSession{Request,Value}Schema` |
| RPC map | `packages/host/apiproxy/src/api/rpc-map.ts` | `'workspace.unarchiveSession'` key |
| RPC handler | `packages/host/apiproxy/src/api-proxy.ts` | `unarchiveSession(request)` handler |
| Fetch client | `packages/host/apiproxy/src/fetch/client.ts` | `IApiClient['workspace'].unarchiveSession`, value schema, `callUnary` |
| Fetch handler | `packages/host/apiproxy/src/fetch/handler.ts` | unary route |
| Client contract | `packages/client/runtime/src/client/contract/workspaces.ts` | `IWorkspaces.unarchiveSession` |
| Client manager | `packages/client/runtime/src/client/workspaces/manager.ts` | `WorkspaceManager.unarchiveSession` |
| Client service | `packages/client/runtime/src/client/workspaces/service.ts` | `WorkspaceRuntime.unarchiveSession` |

## Applying

```sh
# from the root of a deepseek-harness checkout
git apply --directory=deepseek-harness /path/to/dsh-archived-panel/patches/unarchiveSession.diff
```

Then rebuild the affected packages:

```sh
pnpm run build:lib:host
pnpm run build:lib:client
```

(Regenerates the `RequestPayload`/`ResponseValue<'workspace.unarchiveSession'>`
wire types from the schema, and rebuilds the host + client libs.)

> Note: the project's official CONTRIBUTING states it does **not** currently
> accept external pull requests. This patch is provided so the feature works on
> a local source checkout; for upstream inclusion, open a discussion.

## Definition

See the `git diff` in [`unarchiveSession.diff`](./unarchiveSession.diff).
