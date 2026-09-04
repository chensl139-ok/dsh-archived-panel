# dsh-archived-panel

[English](#english) · [中文](#中文)

## 中文

`dsh-archived-panel` 是一个 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 社区插件，在侧边栏提供「已归档」面板：

- 支持标题 / 工作区 / ID 搜索、工作区筛选和更新时间排序。
- 保留缺少元数据的归档项，删除失败后仍可重试。
- 显示已归档会话的标题、工作区和相对时间。
- 点击会话即可重新打开。
- Host 支持 `unarchiveSession` 时可以取消归档。
- Host 支持 `deleteSession` 时可以**永久删除**已归档会话（删除前会二次确认）。
- Host 尚未安装补丁时自动隐藏对应的操作按钮，查看和打开功能不受影响。

插件以 DSH bundle 分发：`cordis.patch.yml` 挂载 Host 条目，浏览器功能由 `dsh.client` bundle 加载。

### 兼容性

| 组件 | 支持范围 |
|---|---|
| DeepSeek Harness | `>=0.1.0-rc.7 <0.2.0` |
| Node.js | `^22.19.0 || >=24.0.0` |
| pnpm | 11；git 安装需要允许 `prepare` 脚本 |

### 安装

从本地检出安装到 `web` profile：

```sh
dsh plugin --profile web add ./dsh-archived-panel
dsh --profile web
```

从 GitHub 安装：

```sh
dsh plugin --profile web add github:chensl139-ok/dsh-archived-panel
```

git 安装会从源码运行 `prepare`。pnpm 10 及以上版本默认可能阻止依赖的构建脚本；发生这种情况时，把 pnpm 输出的包名加入对应 profile 的 `pnpm-workspace.yaml`：

```yaml
allowBuilds:
  dsh-archived-panel: true
```

随后重新执行安装命令。安装成功后，`dsh plugin` 会根据本包的 `dsh.bundle` 声明自动把它加入 profile 的 bundle 列表。

### 启用取消归档

查看和打开功能无需修改 DSH。取消归档需要把仓库中的 Host/runtime 补丁应用到与其匹配的 DeepSeek Harness `0.1.0-rc.7` 源码检出：

```sh
# 在 deepseek-harness 仓库根目录执行
git apply --check /path/to/dsh-archived-panel/patches/unarchiveSession.diff
git apply --check /path/to/dsh-archived-panel/patches/unarchiveSession.tests.diff
git apply /path/to/dsh-archived-panel/patches/unarchiveSession.diff
git apply /path/to/dsh-archived-panel/patches/unarchiveSession.tests.diff

pnpm run build:lib:host
pnpm run build:lib:client
```

补丁提供以下完整链路：

```text
WorkspaceRegistry.unarchiveSession
  → workspace.unarchiveSession RPC
  → fetch client/runtime
  → ctx.workspaces.unarchiveSession
  → 已归档面板
```

补丁涉及的文件、测试支持和限制详见 [`patches/README.md`](./patches/README.md)。应用前务必运行 `git apply --check`；如果目标 DSH 版本不同，请重新生成或人工迁移补丁，不要强制应用。

> 未启用取消归档补丁时，仅能查看和打开。启用后可取消归档；启用删除补丁后可永久删除。删除会调用 `ctx.workspaces.deleteSession(id)`，由 Host 拆除会话日志（`sessionPersistence.delete`）并从所有工作区与归档集中移除该会话。正在进行的会话不会被删除（Host 返回 `session-live` 错误）。

### 修复删除不彻底（0.4.1）

仅更新前端不能修复 Host 删除。新增 [`deleteSession-complete.diff`](patches/deleteSession-complete.diff) 修复闲置 Agent 未释放和最终写入互相等待的问题；配套测试覆盖 JSONL / SQLite 重开后无残留。请按 [补丁说明](patches/README.md) 校验适用基线、应用补丁、重建并重启 DSH。运行中的会话仍会拒绝删除；删除失败保留归档入口供重试。

### 启用删除

删除是破坏性操作：它会永久删除会话的持久化日志，并从工作区和归档集中摘除。需要把删除补丁应用到已应用取消归档补丁的 DeepSeek Harness `0.1.0-rc.7` 源码检出：

```sh
# 在 deepseek-harness 仓库根目录执行（取消归档补丁已应用）
git apply --check /path/to/dsh-archived-panel/patches/deleteSession.diff
git apply --check /path/to/dsh-archived-panel/patches/deleteSession.tests.diff
git apply /path/to/dsh-archived-panel/patches/deleteSession.diff
git apply /path/to/dsh-archived-panel/patches/deleteSession.tests.diff

pnpm run build:lib:host
pnpm run build:lib:client
```

补丁提供的完整链路：

```text
WorkspaceRegistry.detachSession + sessionPersistence.delete
  → workspace.deleteSession RPC
  → fetch client/runtime
  → ctx.workspaces.deleteSession
  → 已归档面板 🗑 按钮
```

`deleteSession.diff` 基于“已应用 `unarchiveSession` 补丁”的源码生成；如果尚未应用取消归档补丁，先把两个补丁都应用一遍。涉及文件与限制详见 [`patches/README.md`](./patches/README.md)。

### 本地开发

```sh
pnpm install
pnpm run build
pnpm run pack:check
```

构建会生成：

- `lib/index.mjs`：Host 半部。
- `lib/client.cjs`：浏览器半部（DSH 客户端模块加载器使用的 CommonJS factory）。
- `lib/types/`：TypeScript 声明。

本仓库使用独立的 `tsdown.config.ts`，不依赖相邻的 Harness 检出。开发依赖固定为 DSH `0.1.0-rc.7`，运行时 peer 范围为 `>=0.1.0-rc.7 <0.2.0`。

### 接线原理

- `cordis.patch.yml` 插入 `dsh-archived-panel` Loader 条目。
- `package.json` 的 `dsh.bundle.patch` 让包成为 profile patch 层。
- `package.json` 的 `dsh.client` 声明浏览器依赖与平台。
- `exports["./client"]` 指向浏览器 bundle；根导出是无 Host 行为的 Cordis 插件。

## English

`dsh-archived-panel` is a community plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). It adds an Archived panel to the sidebar:

- Search titles, workspaces and IDs; filter by workspace and sort by update time.
- Keep archive entries with missing metadata visible for retry after deletion failures.
- Shows each archived session's title, workspace, and relative time.
- Opens a session when its row is selected.
- Unarchives sessions when the Host exposes `unarchiveSession`.
- Permanently deletes archived sessions when the Host exposes `deleteSession` (with a confirmation prompt).
- Hides the action buttons when their patch is unavailable; browsing and opening still work.

The plugin is distributed as a DSH bundle: `cordis.patch.yml` mounts the Host entry and the browser feature is loaded through its `dsh.client` bundle.

### Compatibility

| Component | Supported range |
|---|---|
| DeepSeek Harness | `>=0.1.0-rc.7 <0.2.0` |
| Node.js | `^22.19.0 || >=24.0.0` |
| pnpm | 11; git installs must allow the `prepare` script |

### Install

Install a local checkout into the `web` profile:

```sh
dsh plugin --profile web add ./dsh-archived-panel
dsh --profile web
```

Install directly from GitHub:

```sh
dsh plugin --profile web add github:chensl139-ok/dsh-archived-panel
```

A git install runs `prepare` from source. pnpm 10 and newer may block dependency build scripts by default. If that happens, add the exact package key printed by pnpm to the profile's `pnpm-workspace.yaml`:

```yaml
allowBuilds:
  dsh-archived-panel: true
```

Run the install command again. After a successful install, `dsh plugin` detects the package's `dsh.bundle` declaration and adds it to the profile bundle list.

### Enable unarchive

Browsing and opening work without changing DSH. Unarchive requires the included Host/runtime patch, based on the DeepSeek Harness `0.1.0-rc.7` source tree:

```sh
# Run from the root of the deepseek-harness repository
git apply --check /path/to/dsh-archived-panel/patches/unarchiveSession.diff
git apply --check /path/to/dsh-archived-panel/patches/unarchiveSession.tests.diff
git apply /path/to/dsh-archived-panel/patches/unarchiveSession.diff
git apply /path/to/dsh-archived-panel/patches/unarchiveSession.tests.diff

pnpm run build:lib:host
pnpm run build:lib:client
```

The patch supplies the complete path:

```text
WorkspaceRegistry.unarchiveSession
  → workspace.unarchiveSession RPC
  → fetch client/runtime
  → ctx.workspaces.unarchiveSession
  → Archived panel
```

See [`patches/README.md`](./patches/README.md) for affected files, test support, and limitations. Always run `git apply --check` first. If the target DSH version differs, regenerate or port the patch instead of forcing it.

> Without the unarchive patch you can only browse and open. With it you can unarchive; with the delete patch you can permanently delete. Delete calls `ctx.workspaces.deleteSession(id)`, which has the Host tear down the session log (`sessionPersistence.delete`) and remove the session from every workspace and the archive set. A live session is refused with a `session-live` error.

### Fix incomplete deletion (0.4.1)

Updating the frontend alone cannot fix Host deletion. The new [`deleteSession-complete.diff`](patches/deleteSession-complete.diff) releases owned idle agents and drains retirement outside the write queue. Tests verify absence after reopening JSONL / SQLite. Follow the [patch instructions](patches/README.md), check the baseline, rebuild and restart DSH. Running sessions are still refused; failed deletions remain available to retry.

### Enable delete

Delete is destructive: it permanently removes the session's durable log and detaches it from workspace and archive sets. Apply the delete patch to a DeepSeek Harness `0.1.0-rc.7` source checkout that already has the unarchive patch applied:

```sh
# Run from the root of the deepseek-harness repository (unarchive patch already applied)
git apply --check /path/to/dsh-archived-panel/patches/deleteSession.diff
git apply --check /path/to/dsh-archived-panel/patches/deleteSession.tests.diff
git apply /path/to/dsh-archived-panel/patches/deleteSession.diff
git apply /path/to/dsh-archived-panel/patches/deleteSession.tests.diff

pnpm run build:lib:host
pnpm run build:lib:client
```

The patch supplies the complete path:

```text
WorkspaceRegistry.detachSession + sessionPersistence.delete
  → workspace.deleteSession RPC
  → fetch client/runtime
  → ctx.workspaces.deleteSession
  → Archived panel 🗑 button
```

`deleteSession.diff` is generated against a source tree that already has `unarchiveSession` applied; if you have not applied unarchive yet, apply both patches. See [`patches/README.md`](./patches/README.md) for the affected files and limitations.

### Local development

```sh
pnpm install
pnpm run build
pnpm run pack:check
```

The build emits:

- `lib/index.mjs`: Host half.
- `lib/client.cjs`: browser half (the CommonJS factory consumed by the DSH client module loader).
- `lib/types/`: TypeScript declarations.

The repository uses a self-contained `tsdown.config.ts`; no sibling Harness checkout is required. Development dependencies are pinned to DSH `0.1.0-rc.7`, while runtime peers accept `>=0.1.0-rc.7 <0.2.0`.

### Wiring

- `cordis.patch.yml` inserts the `dsh-archived-panel` Loader entry.
- `package.json`'s `dsh.bundle.patch` makes the package a profile patch layer.
- `package.json`'s `dsh.client` declares browser dependencies and platform.
- `exports["./client"]` points to the browser bundle; the root export is a Cordis plugin with no Host behavior.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). This repository is a community plugin and is not an official DeepSeek Harness package.

## License

MIT — see [LICENSE](./LICENSE).
