# unarchiveSession — official-source patch / 官方源码补丁

[English](#english) · [中文](#中文)

---

# 中文

已归档面板的**取消归档**动作会调用 `ctx.workspaces.unarchiveSession(id)`。
该方法在标准的 deepseek-harness 检出处**不存在**。要启用取消归档,请把这个补丁应用到
[`deepseek-ai/deepseek-harness`](https://github.com/deepseek-ai/deepseek-harness) 的**源码检出**。

本 bundle 本身只是*消费*这个方法(特性检测,见 `src/client/index.ts`);
它**不携带**官方源码改动。没有该补丁时,取消归档按钮会被隐藏,面板退化为「查看 + 打开」。

这些补丁以 DeepSeek Harness `0.1.0-rc.7` 源码树为基线。其他版本必须先用
`git apply --check` 验证；检查失败时应重新生成或人工迁移补丁。

## 这个补丁添加了什么

一条端到端接线的新 `unarchiveSession` 能力,完全镜像现有的 `archiveSession`:

| 层 | 文件 | 新增 |
|---|---|---|
| Workspace registry | `packages/workspace/workspace/src/index.ts` | `WorkspaceRegistry.unarchiveSession(sessionId)` |
| Host API 接口 | `packages/host/apiproxy/src/api/workspace.ts` | `WorkspaceApi.unarchiveSession(...)` |
| Wire schemas | `packages/host/apiproxy/src/api/workspace.schema.ts` | `workspaceUnarchiveSession{Request,Value}Schema` |
| RPC map | `packages/host/apiproxy/src/api/rpc-map.ts` | `'workspace.unarchiveSession'` 键 |
| RPC handler | `packages/host/apiproxy/src/api-proxy.ts` | `unarchiveSession(request)` handler |
| Fetch client | `packages/host/apiproxy/src/fetch/client.ts` | `IApiClient['workspace'].unarchiveSession`、value schema、`callUnary` |
| Fetch handler | `packages/host/apiproxy/src/fetch/handler.ts` | unary route |
| Client contract | `packages/client/runtime/src/client/contract/workspaces.ts` | `IWorkspaces.unarchiveSession` |
| Client manager | `packages/client/runtime/src/client/workspaces/manager.ts` | `WorkspaceManager.unarchiveSession` |
| Client service | `packages/client/runtime/src/client/workspaces/service.ts` | `WorkspaceRuntime.unarchiveSession` |

## 应用

```sh
# 在 deepseek-harness 检出的根目录
git apply --check /path/to/dsh-archived-panel/patches/unarchiveSession.diff
git apply --check /path/to/dsh-archived-panel/patches/unarchiveSession.tests.diff
git apply /path/to/dsh-archived-panel/patches/unarchiveSession.diff
git apply /path/to/dsh-archived-panel/patches/unarchiveSession.tests.diff
```

然后重建受影响包:

```sh
pnpm run build:lib:host
pnpm run build:lib:client
```

(会从 schema 重新生成 `RequestPayload`/`ResponseValue<'workspace.unarchiveSession'>`
wire 类型,并重建 host + client libs。)

> 注意:项目的官方 CONTRIBUTING 说明它**目前不接受外部 pull request**。本补丁的
> 提供是为了让该功能能在本地源码检出上工作;若要并入上游,请发起一个 discussion。

## 定义

见 [`unarchiveSession.diff`](./unarchiveSession.diff) 中的 `git diff`。

---

# English

The 已归档 panel's **unarchive** action calls `ctx.workspaces.unarchiveSession(id)`.
That service method does **not** exist on a stock deepseek-harness checkout. To
enable unarchive, apply this patch to a **source checkout of
[`deepseek-ai/deepseek-harness`](https://github.com/deepseek-ai/deepseek-harness)**.

This bundle itself only *consumes* the method (feature-detected, see
`src/client/index.ts`); it does **not** carry the official-source change.
Without the patch the button is hidden and the panel degrades to **view + open**.

The patches are based on the DeepSeek Harness `0.1.0-rc.7` source tree. Always
run `git apply --check` on other versions; regenerate or port the patch when the
check fails.

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
git apply --check /path/to/dsh-archived-panel/patches/unarchiveSession.diff
git apply --check /path/to/dsh-archived-panel/patches/unarchiveSession.tests.diff
git apply /path/to/dsh-archived-panel/patches/unarchiveSession.diff
git apply /path/to/dsh-archived-panel/patches/unarchiveSession.tests.diff
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
