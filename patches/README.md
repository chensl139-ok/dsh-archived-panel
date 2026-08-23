# archived-panel patches — official-source patches / 官方源码补丁

[English](#english) · [中文](#中文)

---

# 中文

本目录提供两套官方源码补丁，均以 DeepSeek Harness `0.1.0-rc.7` 源码树为基线。其他版本必须先用 `git apply --check` 验证；检查失败时应重新生成或人工迁移补丁，不要强制应用。

| 补丁 | 动作 | 依赖 |
|---|---|---|
| `unarchiveSession{.diff,.tests.diff}` | 取消归档（从归档集中移除，会话日志保留） | 无，基于干净 `0.1.0-rc.7` |
| `deleteSession{.diff,.tests.diff}` | 永久删除（拆除会话日志并从工作区/归档集摘除） | 须先应用 `unarchiveSession` 补丁 |

`dsh-archived-panel` bundle 只是*消费*这两个方法（特性检测，见 `src/client/index.ts`）；它**不携带**官方源码改动。没有对应补丁时，相关按钮会被隐藏，面板退化为「查看 + 打开」。

## unarchiveSession 补丁添加了什么

一条端到端接线的新 `unarchiveSession` 能力，完全镜像现有的 `archiveSession`：

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

## deleteSession 补丁添加了什么

一条端到端接线的 `deleteSession` 能力。与 `unarchiveSession` 不同，删除调用两个已有底层原语：

- `sessionPersistence.delete(id)` —— 拆除会话的持久化日志（JSONL/SQLite 后端均已实现）。
- `WorkspaceRegistry.detachSession(id)` —— 从所有工作区 `sessionIds` 账户**和**注册表全局 `archivedSessionIds` 集合中摘除该 id（其文档字符串明确标注“used by session deletion”）。

Host handler 还会拒绝正在进行的 live 会话，返回新错误码 `session-live`：

| 层 | 文件 | 新增 |
|---|---|---|
| Host API 接口 | `packages/host/apiproxy/src/api/workspace.ts` | `WorkspaceApi.deleteSession(...)` |
| Wire schemas | `packages/host/apiproxy/src/api/workspace.schema.ts` | `workspaceDeleteSession{Request,Value}Schema` |
| RPC map | `packages/host/apiproxy/src/api/rpc-map.ts` | `'workspace.deleteSession'` 键 |
| RPC handler | `packages/host/apiproxy/src/api-proxy.ts` | `deleteSession(request)`：`session-live` 守卫 + `persistence.delete` + `detachSession` |
| 错误码表 | `packages/host/apiproxy/src/api/rpc.ts` | `'session-live': { sessionId }` |
| 错误码 schema | `packages/host/apiproxy/src/api/rpc.schema.ts` | `session-live` discriminated union 分支 |
| Fetch client | `packages/host/apiproxy/src/fetch/client.ts` | `IApiClient['workspace'].deleteSession`、value schema、`callUnary` |
| Fetch handler | `packages/host/apiproxy/src/fetch/handler.ts` | unary route |
| Client contract | `packages/client/runtime/src/client/contract/workspaces.ts` | `IWorkspaces.deleteSession` |
| Client manager | `packages/client/runtime/src/client/workspaces/manager.ts` | `WorkspaceManager.deleteSession` |
| Client service | `packages/client/runtime/src/client/workspaces/service.ts` | `WorkspaceRuntime.deleteSession` |

`deleteSession.diff` 是在**已应用 `unarchiveSession` 补丁**的源码树上生成的 `git diff`。在干净的 `0.1.0-rc.7` 上单独应用 `deleteSession.diff` 也能成功（它会同时带上 unarchive 的改动），但推荐先应用 unarchive，再应用 delete。

## 应用

```sh
# 在 deepseek-harness 检出的根目录
# 1) 取消归档
git apply --check /path/to/dsh-archived-panel/patches/unarchiveSession.diff
git apply --check /path/to/dsh-archived-panel/patches/unarchiveSession.tests.diff
git apply /path/to/dsh-archived-panel/patches/unarchiveSession.diff
git apply /path/to/dsh-archived-panel/patches/unarchiveSession.tests.diff

# 2) 永久删除（在 1) 之后）
git apply --check /path/to/dsh-archived-panel/patches/deleteSession.diff
git apply --check /path/to/dsh-archived-panel/patches/deleteSession.tests.diff
git apply /path/to/dsh-archived-panel/patches/deleteSession.diff
git apply /path/to/dsh-archived-panel/patches/deleteSession.tests.diff

pnpm run build:lib:host
pnpm run build:lib:client
```

> 注意：项目的官方 CONTRIBUTING 说明它**目前不接受外部 pull request**。本补丁的提供是为了让该功能能在本地源码检出上工作；若要并入上游，请发起一个 discussion。

## 定义

见各 `.diff` 文件中的 `git diff`。

---

# English

This directory ships two official-source patches, both based on the DeepSeek Harness `0.1.0-rc.7` source tree. Always run `git apply --check` on other versions; regenerate or port the patch when the check fails — do not force-apply.

| Patch | Action | Depends on |
|---|---|---|
| `unarchiveSession{.diff,.tests.diff}` | Unarchive (remove from archive set; session log retained) | none, clean `0.1.0-rc.7` |
| `deleteSession{.diff,.tests.diff}` | Permanently delete (tear down session log; detach from workspaces + archive set) | `unarchiveSession` applied first |

The `dsh-archived-panel` bundle only *consumes* these methods (feature-detected, see `src/client/index.ts`); it does **not** carry the official-source change. Without the matching patch the relevant button is hidden and the panel degrades to **view + open**.

## What the unarchiveSession patch adds

A new `unarchiveSession` capability wired end-to-end, mirroring the existing `archiveSession`:

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

## What the deleteSession patch adds

A `deleteSession` capability wired end-to-end. Unlike `unarchiveSession`, delete composes two pre-existing primitives:

- `sessionPersistence.delete(id)` — tears down the session's durable log (both the JSONL and SQLite backends already implement it).
- `WorkspaceRegistry.detachSession(id)` — removes the id from every workspace `sessionIds` account **and** the registry-global `archivedSessionIds` set (its docstring is explicitly "used by session deletion").

The host handler also refuses a live session with a new `session-live` error code:

| Layer | File | Adds |
|---|---|---|
| Host API interface | `packages/host/apiproxy/src/api/workspace.ts` | `WorkspaceApi.deleteSession(...)` |
| Wire schemas | `packages/host/apiproxy/src/api/workspace.schema.ts` | `workspaceDeleteSession{Request,Value}Schema` |
| RPC map | `packages/host/apiproxy/src/api/rpc-map.ts` | `'workspace.deleteSession'` key |
| RPC handler | `packages/host/apiproxy/src/api-proxy.ts` | `deleteSession(request)`: `session-live` guard + `persistence.delete` + `detachSession` |
| Error-code table | `packages/host/apiproxy/src/api/rpc.ts` | `'session-live': { sessionId }` |
| Error-code schema | `packages/host/apiproxy/src/api/rpc.schema.ts` | `session-live` discriminated-union branch |
| Fetch client | `packages/host/apiproxy/src/fetch/client.ts` | `IApiClient['workspace'].deleteSession`, value schema, `callUnary` |
| Fetch handler | `packages/host/apiproxy/src/fetch/handler.ts` | unary route |
| Client contract | `packages/client/runtime/src/client/contract/workspaces.ts` | `IWorkspaces.deleteSession` |
| Client manager | `packages/client/runtime/src/client/workspaces/manager.ts` | `WorkspaceManager.deleteSession` |
| Client service | `packages/client/runtime/src/client/workspaces/service.ts` | `WorkspaceRuntime.deleteSession` |

`deleteSession.diff` is generated as a `git diff` against a source tree that **already has `unarchiveSession` applied**. Applying `deleteSession.diff` alone on a clean `0.1.0-rc.7` also works (it carries the unarchive changes too), but applying unarchive first then delete is the recommended order.

## Applying

```sh
# from the root of a deepseek-harness checkout
# 1) unarchive
git apply --check /path/to/dsh-archived-panel/patches/unarchiveSession.diff
git apply --check /path/to/dsh-archived-panel/patches/unarchiveSession.tests.diff
git apply /path/to/dsh-archived-panel/patches/unarchiveSession.diff
git apply /path/to/dsh-archived-panel/patches/unarchiveSession.tests.diff

# 2) permanent delete (after 1)
git apply --check /path/to/dsh-archived-panel/patches/deleteSession.diff
git apply --check /path/to/dsh-archived-panel/patches/deleteSession.tests.diff
git apply /path/to/dsh-archived-panel/patches/deleteSession.diff
git apply /path/to/dsh-archived-panel/patches/deleteSession.tests.diff

pnpm run build:lib:host
pnpm run build:lib:client
```

> Note: the project's official CONTRIBUTING states it does **not** currently accept external pull requests. This patch is provided so the feature works on a local source checkout; for upstream inclusion, open a discussion.

## Definition

See the `git diff` in each `.diff` file.
