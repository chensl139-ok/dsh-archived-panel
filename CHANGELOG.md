# Changelog

## 0.3.0

- Add permanent session deletion: a trash button on each archived row calls `ctx.workspaces.deleteSession` after a confirmation prompt. The button is feature-detected and stays hidden on a stock host.
- Refuse to delete a session whose Agent is running a turn (`session-live`), and broadcast `host/session-removed` so the client drops the stale row instead of bucketing it under Ungrouped.
- Ship `patches/deleteSession.diff` and `patches/deleteSession.tests.diff`, generated against a 0.1.0-rc.7 source tree that already has `unarchiveSession` applied.
- Document the delete feature, the patch application order, and the `session-live` semantics in the README (zh + en).

## 0.2.0

- Fix standalone installation by using published DeepSeek Harness and Cordis versions.
- Point the client export at the actual `lib/client.cjs` build artifact.
- Build and publish the previously missing `lib/index.mjs` Host entry.
- Document the supported DSH, Node.js, and pnpm ranges.
- Correct the GitHub installation command for this repository.
- Correct patch application commands and add mandatory `git apply --check` preflight steps.
- Clarify that browsing/opening works without Host changes while unarchive is capability-detected.
- Add package metadata, a package-content check, and continuous integration.

## 0.1.0

- Initial archived-session sidebar panel.
- Optional end-to-end `unarchiveSession` source patch for DeepSeek Harness.
