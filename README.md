# dsh-archived-panel

[中文](#中文) · [English](#english) · [Release v0.4.1](https://github.com/chensl139-ok/dsh-archived-panel/releases/tag/v0.4.1)

## 中文

DeepSeek Harness 社区归档面板。当前版本 **0.4.1**。

- 搜索会话标题、工作区或 ID；按工作区筛选、按更新时间排序。
- 打开已归档会话、取消归档、永久删除。
- 居中删除确认框，支持键盘操作；请求执行期间防止重复提交。
- 删除失败显示原因并保留入口，缺少会话元数据的归档项也可重试。

### 0.4.1 修复了什么

后端补丁覆盖新建、历史恢复和分叉会话的删除路径：保留释放句柄，先释放闲置 Agent / Session，等待最终写入结束，再删除持久化日志、展示缓存、工作区成员和归档索引。它修复了误报 `session-live`、删除卡住以及删除后残留或重新出现的问题。

**只安装前端不能修复后端。应用匹配的 Host 补丁后，必须重建并重启 DSH。** 正在运行、正在切换生命周期或确实由其他组件持有的会话仍会拒绝删除。永久删除不删除项目工作目录和用户导出的文件。

### 安装插件

下载 [Release](https://github.com/chensl139-ok/dsh-archived-panel/releases/tag/v0.4.1) 中已构建的 `dsh-archived-panel-0.4.1.tgz`，然后执行：

```sh
dsh plugin --profile web add ./dsh-archived-panel-0.4.1.tgz
dsh --profile web
```

也可以从固定版本源码安装：

```sh
dsh plugin --profile web add github:chensl139-ok/dsh-archived-panel#v0.4.1
```

Git 安装需要运行 `prepare` 构建脚本。若 pnpm 阻止该脚本，按其提示在对应 profile 的 `pnpm-workspace.yaml` 中授权本包：

```yaml
allowBuilds:
  dsh-archived-panel: true
```

### 选择后端补丁

| 当前 Host | 操作 |
|---|---|
| 已应用本仓库 0.4.0 的完整删除补丁 | 仅应用 `deleteSession-0.4.1.diff` |
| 基于 `chensl139-ok/deepseek-harness` 的 `8eb6aa069af605a3d6277dc301190ddeea3bb972`，尚未应用完整修复 | 应用更新后的 `deleteSession-complete.diff` 和 `deleteSession-complete.tests.diff` |
| 官方 rc.7 或其他源码版本 | 按 [补丁说明](patches/README.md) 迁移；不要强制应用或叠加重叠补丁 |

先运行 `git apply --check`。应用成功后执行 `pnpm run build:lib:host`，重启 Host，再刷新页面。完整命令和测试见 [patches/README.md](patches/README.md)。Release 同时提供这些补丁及 SHA-256 校验文件。

### 兼容性与验证

- 前端 peer 范围：DSH `>=0.1.0-rc.7 <0.2.0`；后端补丁只承诺上述源码基线。
- Node.js：`^22.19.0 || >=24.0.0`；开发使用 pnpm 11。
- Host 未提供取消归档或删除方法时，对应按钮隐藏。
- 验证包括 JSONL / SQLite 删除后重开、存储失败重试、展示缓存清理，以及真实 Web 组合中新建 / 恢复 / 分叉会话的删除快照。

### 开发

```sh
pnpm install
pnpm test
pnpm build
npm pack --dry-run
# 生成 dsh-plugins 中的本地版浏览器文件：
pnpm export:local /path/to/dsh-plugins/dsh-ui-archived-local
```

构建输出为 `lib/index.mjs`、`lib/client.cjs` 和 `lib/types/`。本地插件版本为 `dsh-ui-archived-local@0.2.1`，与此包共享面板源码；不要手工修改生成的 `client.js`。

## English

A community archive panel for DeepSeek Harness. Current version: **0.4.1**.

Search titles, workspaces and IDs; filter by workspace; sort by update time; open, unarchive and permanently delete sessions. Centered confirmation supports keyboard use. Pending operations block duplicate submission, and failed or metadata-missing archive entries remain available for retry.

### Deletion fix

The Host patches cover newly created, resumed and forked sessions. They retain disposal handles, release idle agents and sessions, drain pending writes, then delete durable logs, projection caches and workspace/archive references. This fixes false `session-live` errors, queue deadlocks and records surviving or reappearing after deletion.

**A frontend update alone does not fix the Host. Apply the matching patch, rebuild and restart DSH.** Running sessions, lifecycle transitions and sessions genuinely owned by another component still reject deletion. Project working directories and user-exported files are retained.

### Install and upgrade

Download the built `dsh-archived-panel-0.4.1.tgz` from the [Release](https://github.com/chensl139-ok/dsh-archived-panel/releases/tag/v0.4.1):

```sh
dsh plugin --profile web add ./dsh-archived-panel-0.4.1.tgz
dsh --profile web
```

Alternatively install `github:chensl139-ok/dsh-archived-panel#v0.4.1`. Git installation runs `prepare`; if pnpm blocks it, allow this package's build in the profile's `pnpm-workspace.yaml` as shown above.

- Already using the complete 0.4.0 Host patches: apply only `deleteSession-0.4.1.diff`.
- Starting from fork commit `8eb6aa069af605a3d6277dc301190ddeea3bb972`: apply the updated complete implementation and test patches.
- Other versions: port the changes; do not force-apply or stack overlapping legacy patches.

See [patch instructions](patches/README.md), always run `git apply --check`, then rebuild with `pnpm run build:lib:host`, restart the Host and reload the browser. Release assets include the patches and SHA-256 checksums.

Frontend peers support DSH `>=0.1.0-rc.7 <0.2.0`; patch compatibility is limited to the stated source baseline. Node requires `^22.19.0 || >=24.0.0`. Development uses pnpm 11. Unsupported Host actions are hidden.

Verification covers JSONL/SQLite reopening after deletion, failure retry, checkpoint cleanup and real Web composition snapshots for created, resumed and forked sessions. The development commands above build the package and generate the local plugin distribution from the same source.

## Contributing and license

[Contributing](CONTRIBUTING.md) · [Changelog](CHANGELOG.md) · [MIT License](LICENSE). This is not an official DeepSeek Harness package.
