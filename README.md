# dsh-archived-panel

[English](#english) · [中文](#中文)

---

# 中文

`dsh-archived-panel` 是一个 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 插件,在侧边栏添加一个 **已归档 (Archived)** 面板:

- 一个锚定在左栏的触发器(挂载在 `shell.overlay` 全屏槽位)。
- 一个下拉面板,列出所有已归档会话(标题 / 所属工作区 / 相对时间)。
- 点击某一行即可打开该会话。
- 可选地**取消归档**某个会话(需要 `unarchiveSession` 补丁)。

DSH 的设计哲学是"一切皆插件":本包是一个 **bundle**(携带一层 `cordis.patch.yml` patch),其浏览器半部分是一个 `dsh.client` 插件。

---

## 安装

在任一个已有 `deepseek-harness` 检出/工具链的目录下:

```sh
dsh plugin --profile <name> add ./dsh-archived-panel
dsh --profile <name>
```

`dsh plugin add` 会链接该检出目录、用 pnpm 安装,并且因为本包声明了 `dsh.bundle`,`dsh` 会把这个 bundle 追加到该 profile 的 `dsh.profile.bundles` 列表里。打开 Web UI 后,左侧栏会出现「已归档」触发器。

### 从 GitHub 安装(git 安装)

```sh
dsh plugin --profile <name> add github:you/dsh-archived-panel
```

git 安装拉取的是**源码,而非构建产物**,所以会运行本包的 `prepare` 脚本。pnpm ≥ 10 默认阻止运行 git 依赖的 `prepare`,直到你把它加入白名单 —— 把 pnpm 打印出的那个包名贴到 profile 的 `pnpm-workspace.yaml`:

```yaml
allowBuilds:
  dsh-archived-panel: true
```

然后重新运行 `add`。或者直接分发构建产物(`pnpm pack` 打 tarball,或发布到 npm),这样就不需要任何构建授权。

---

## 构建(在本仓库内)

```sh
pnpm install
pnpm run build   # 产出 lib/index.js (host) + lib/client.js (浏览器) + lib/types
```

构建使用本仓库**自包含**的 `tsdown.config.ts`(不需要 sibling harness 检出)。`react` 与 DSH 平台模块(`@deepseek-ai/cordis`、`@deepseek-ai/dsh-client-ui-slots` 等)被保留为 **external** —— 它们在运行时由 DSH 客户端模块表解析 —— 其余全部内联。

---

## 功能

### 查看 + 打开(标准 DSH)

使用公共 client-runtime 服务 `useSessions`、`useWorkspaces` 与 `ctx.sessions.open`。在**未打补丁**的标准 DeepSeek Harness 检出处即可运行。此时面板退化为「查看 + 打开」(取消归档按钮会被特性检测自动隐藏)。

### 取消归档(可选 —— 需要补丁)

取消归档会调用 `ctx.workspaces.unarchiveSession(id)`。该方法在标准检出处**不存在**;它来自 [`patches/`](./patches/) 里的官方源码补丁。把它应用到 `deepseek-harness` 的**源码检出**:

```sh
# 在 deepseek-harness 检出的根目录
git apply --directory=deepseek-harness /path/to/dsh-archived-panel/patches/unarchiveSession.diff
git apply --directory=deepseek-harness /path/to/dsh-archived-panel/patches/unarchiveSession.tests.diff
pnpm run build:lib:host
pnpm run build:lib:client
```

完整改动清单及补丁存在原因见 [`patches/README.md`](./patches/README.md)。如果没有该补丁,取消归档按钮会被隐藏而不是抛错。

---

## 接线原理

- `cordis.patch.yml` 插入一行 Loader 条目 `name: dsh-archived-panel`。
- `package.json` 声明 `dsh.bundle.patch`(patch 层)**和** `dsh.client`(`platform: web`),这样 `@deepseek-ai/dsh-client-modules` 会把浏览器半部分打进 `window.__DSH_BOOT__`。
- `exports["./client"]` → `lib/client.js` 是浏览器半部分;根 `"."` 导出 → `lib/index.js` 是 host 半部分(一个空 `apply`,只是为了让该行出现在 host 名册里)。

---

## 贡献 / 上游

这是一个社区插件。DeepSeek Harness 的 [`CONTRIBUTING.md`](https://github.com/deepseek-ai/deepseek-harness/blob/main/CONTRIBUTING.md) 说明它**目前不接受外部 pull request**;`unarchiveSession` 补丁的提供是为了让该功能能在本地源码检出上工作,也可作为 discussion 提交上游考虑。

## License

MIT —— 见 [LICENSE](./LICENSE)。

---

# English

`dsh-archived-panel` is a [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin
that adds an **已归档 (Archived)** side panel:

- A trigger anchored to the left rail (`shell.overlay` frame slot).
- A dropdown listing every archived session (title, workspace, relative time).
- Click a row to open that session.
- Optionally **unarchive** a session (requires the `unarchiveSession` patch).

Everything follows "everything is a plugin": this package is a **bundle** (ships a
`cordis.patch.yml` patch layer) whose browser half is a `dsh.client` plugin.

---

## Install

From any directory that has a `deepseek-harness` checkout/provisioned toolchain:

```sh
dsh plugin --profile <name> add ./dsh-archived-panel
dsh --profile <name>
```

`dsh plugin add` links the checkout, pnpm installs it, and `dsh` appends this
bundle to that profile's `dsh.profile.bundles` list because it declares
`dsh.bundle`. Open the web UI; the 已归档 trigger appears at the left rail.

### From GitHub (git install)

```sh
dsh plugin --profile <name> add github:you/dsh-archived-panel
```

A git install fetches **sources, not built artifacts**, so it runs this
package's `prepare` script. pnpm ≥ 10 blocks a git dependency's `prepare` until
you allowlist it — copy the exact package key pnpm printed into the profile's
`pnpm-workspace.yaml`:

```yaml
allowBuilds:
  dsh-archived-panel: true
```

and re-run the `add`. Alternatively, distribute built artifacts
(`pnpm pack` a tarball, or publish to npm) so no build permission is required.

---

## Build (from this repo)

```sh
pnpm install
pnpm run build   # emits lib/index.js (host) + lib/client.js (browser) + lib/types
```

The build uses this repo's own **self-contained** `tsdown.config.ts` (no sibling
harness checkout required). `react` and the DSH platform modules
(`@deepseek-ai/cordis`, `@deepseek-ai/dsh-client-ui-slots`, …) are left
**external** — they resolve through the DSH client module table at runtime —
while everything else inlines.

---

## Features

### View + open (stock DSH)

Uses the public client-runtime services `useSessions`, `useWorkspaces`, and
`ctx.sessions.open`. Works on a stock DeepSeek Harness checkout with **no patch**.
On a stock host the panel degrades to **view + open** (the unarchive button is
hidden by feature-detection).

### Unarchive (optional — patch required)

The unarchive action calls `ctx.workspaces.unarchiveSession(id)`. That method
does **not** exist on a stock checkout; it comes from the official-source patch
in [`patches/`](./patches/). Apply it to a **source checkout** of
`deepseek-harness`:

```sh
# from the root of a deepseek-harness checkout
git apply --directory=deepseek-harness /path/to/dsh-archived-panel/patches/unarchiveSession.diff
git apply --directory=deepseek-harness /path/to/dsh-archived-panel/patches/unarchiveSession.tests.diff
pnpm run build:lib:host
pnpm run build:lib:client
```

See [`patches/README.md`](./patches/README.md) for the full change list and why
the patch exists. Without it, unarchive is hidden instead of throwing.

---

## How it's wired

- `cordis.patch.yml` inserts one Loader row `name: dsh-archived-panel`.
- `package.json` declares `dsh.bundle.patch` (the patch layer) **and**
  `dsh.client` (`platform: web`) so `@deepseek-ai/dsh-client-modules` bundles
  the browser half into `window.__DSH_BOOT__`.
- `exports["./client"]` → `lib/client.js` is the browser half; the root `"."`
  export → `lib/index.js` is the host half (an empty `apply`, so the row shows
  in the host roster).

---

## Contributing / upstream

This is a community plugin. The DeepSeek Harness [`CONTRIBUTING.md`](https://github.com/deepseek-ai/deepseek-harness/blob/main/CONTRIBUTING.md)
states it does **not currently accept external pull requests**; the
`unarchiveSession` patch is provided so the feature works on a local source
checkout, and can be raised as a discussion for upstream consideration.

## License

MIT — see [LICENSE](./LICENSE).
