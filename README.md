# dsh-archived-panel

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin that
adds an **已归档 (Archived)** side panel:

- A trigger anchored to the left rail (`shell.overlay` frame slot).
- A dropdown that lists every archived session (title, workspace, relative time).
- Click a row to open that session.
- Optionally **unarchive** a session (requires the `unarchiveSession` patch).

Everything is "everything is a plugin": this package is a **bundle** (ships a
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

## Contributing / upsteam

This is a community plugin. The DeepSeek Harness [`CONTRIBUTING.md`](https://github.com/deepseek-ai/deepseek-harness/blob/main/CONTRIBUTING.md)
states it does **not currently accept external pull requests**; the
`unarchiveSession` patch is provided so the feature works on a local source
checkout, and can be raised as a discussion for upstream consideration.

## License

MIT — see [LICENSE](./LICENSE).
