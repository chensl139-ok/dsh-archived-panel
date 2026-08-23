# Contributing / 贡献

This is a community plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).
感谢你愿意为本项目贡献。

## 中文

**开发**

- `pnpm install` 安装依赖。
- `pnpm run build` 构建 host 半(`lib/index.js`)与浏览器半(`lib/client.js`)。
- 用 `dsh plugin --profile <name> add .` 在本地 profile 中试用。

**提交变更**

- 请以一次逻辑提交为单位,commit message 使用 imperative 语气(如
  `feat: add X`、`docs: update Y`、`fix: Z`)。
- 涉及 `src/client/index.ts` 的功能改动,请同时更新 `README.md`(中英两段)。
- 更改 `unarchiveSession` 相关的官方源码补丁时,请**重新生成** `patches/*.diff`(在
  `deepseek-harness` 检出处执行 `git diff <files> > patches/unarchiveSession.diff`),
  以保证补丁与源码一致。

**补丁说明**

`patches/` 里的 diff 是对 `deepseek-harness` 官方源码的改动,用于启用「取消归档」。
本仓库本身不携带这些改动;它们只作为可应用的补丁提供。详见
[patches/README.md](./patches/README.md)。

**上游**

DeepSeek Harness 目前不接受外部 pull request。若你希望对上游的 `unarchiveSession`
改动有所建议,请在
[deepseek-harness discussions](https://github.com/deepseek-ai/deepseek-harness/discussions) 发起讨论。

---

## English

**Development**

- `pnpm install` to install dependencies.
- `pnpm run build` builds the host half (`lib/index.js`) and browser half (`lib/client.js`).
- Try it locally with `dsh plugin --profile <name> add .`.

**Submitting changes**

- Keep one logical change per commit; use an imperative message (`feat:` / `docs:` / `fix:`).
- For functional changes in `src/client/index.ts`, update `README.md` (both the Chinese and
  English sections).
- When you change the official-source patch behind `unarchiveSession`, **regenerate**
  `patches/*.diff` (run `git diff <files> > patches/unarchiveSession.diff` in a
  `deepseek-harness` checkout) so the patch stays in sync.

**The patch**

The diffs under `patches/` are changes to the `deepseek-harness` *official source* that enable
unarchive. This repo does not carry those changes; it ships them as applicable patches only. See
[patches/README.md](./patches/README.md).

**Upstream**

DeepSeek Harness does not currently accept external pull requests. To suggest upstream changes
to `unarchiveSession`, open a discussion in the
[deepseek-harness discussions](https://github.com/deepseek-ai/deepseek-harness/discussions).
