# dsh-archived-panel

[English](#english) · [中文](#中文)

## 中文

`dsh-archived-panel` 是一个 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 社区插件，在侧边栏提供「已归档」面板：

- 显示已归档会话的标题、工作区和相对时间。
- 点击会话即可重新打开。
- Host 支持 `unarchiveSession` 时可以取消归档。
- Host 尚未安装补丁时自动隐藏取消归档按钮，查看和打开功能不受影响。

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

- Shows each archived session's title, workspace, and relative time.
- Opens a session when its row is selected.
- Unarchives sessions when the Host exposes `unarchiveSession`.
- Hides the unarchive action when the patch is unavailable; browsing and opening still work.

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
