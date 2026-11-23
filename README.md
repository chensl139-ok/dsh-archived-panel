# dsh-archived-panel

[中文](#中文) · [English](#english)

## 中文

DeepSeek Harness 社区归档面板。当前版本 **0.5.1**，面向 **DSH 0.2.2-rc.5**。

### 功能

- 在左侧导航增加“已归档会话”原生面板，不再使用固定悬浮按钮。
- 搜索标题、工作区或会话 ID；按工作区筛选，按更新时间排序。
- 保留缺少会话元数据的归档 ID，加载失败后可以重试。
- 支持“恢复”“恢复并打开”和“永久删除”。操作期间防止重复提交，并显示权限、进度和错误状态。
- 使用中英文界面、DSH 主题变量和响应式布局，支持窄屏与键盘焦点。

### 删除范围

DSH 0.2.2 没有官方 `deleteSession` 接口。本插件的宿主端只处理已归档会话：拒绝正在运行或仍被占用的会话，确认写入锁可释放后，删除该会话自己的 JSONL 目录，再从工作区成员、置顶和归档索引中摘除。项目目录和已导出的文件不会删除。

仓库里的 `patches/deleteSession*` 是旧版源码补丁，**不能应用到 DSH 0.2.2**。0.5.1 不需要这些补丁。

“恢复并打开”会先等待恢复成功，因为当前版本不能直接打开归档会话。

### 安装

下载 [Release](https://github.com/chensl139-ok/dsh-archived-panel/releases/tag/v0.5.1) 中的 `dsh-archived-panel-0.5.1.tgz`：

```sh
dsh plugin --profile desktop add ./dsh-archived-panel-0.5.1.tgz
```

Web 配置把 `desktop` 换成 `web`。也可以在 **Plugins → Add plugin** 中选择本目录。清单要求 `engines.dsh >=0.2.2-rc.5 <0.3.0`。安装或升级后需要重启 DSH，然后从左侧导航打开“已归档会话”。

### 开发与验证

需要 Node.js 24.9 或更高版本、pnpm 11。

```sh
pnpm install
pnpm test
pnpm build
pnpm pack:check
```

构建生成 Host 入口 `lib/index.mjs` 和符合当前 Module Loader 格式的 `lib/client.js`。浏览器端仅把 React 留作运行时外部依赖；DSH Client 包只用于类型检查，不打包进产物。

## English

A community archived-session panel for DeepSeek Harness. Current version **0.5.1**, targeting **DSH 0.2.2-rc.5**.

- Adds a native **Archived sessions** entry to the left sidebar.
- Searches titles, workspaces, and session IDs; filters by workspace and sorts by update time.
- Preserves archive IDs when Session metadata is temporarily unavailable.
- Offers **Restore**, **Restore and open**, and **Delete permanently**, with duplicate-submit protection plus progress, access, and error feedback.
- Includes Chinese and English text, theme-token styling, responsive layouts, and visible keyboard focus.

DSH 0.2.2 has no official `deleteSession` API. This plugin deletes only an archived session: it refuses a running or owned session, removes that session's own JSONL directory, then detaches workspace, pin, and archive indexes. Project folders and exported files stay. The legacy `patches/deleteSession*` files target older source and must not be applied to 0.2.2.

**Restore and open** waits for restoration because this DSH release cannot open an archived session directly.

Install `dsh-archived-panel-0.5.1.tgz` from the [Release](https://github.com/chensl139-ok/dsh-archived-panel/releases/tag/v0.5.1):

```sh
dsh plugin --profile desktop add ./dsh-archived-panel-0.5.1.tgz
```

Use `web` instead of `desktop` for a Web profile. A local directory can also be added from **Plugins → Add plugin**. The declared range is `engines.dsh >=0.2.2-rc.5 <0.3.0`. Restart DSH after installation, then open **Archived sessions** from the sidebar.

For development, use Node.js 24.9+ and pnpm 11, then run `pnpm install`, `pnpm test`, `pnpm build`, and `pnpm pack:check`. The build emits `lib/index.mjs` and a current Module Loader artifact at `lib/client.js`; React is the only runtime external.

## License

[MIT](LICENSE). This is not an official DeepSeek Harness package.
