# 0.4.1 — 2026-09-05

- Fix false `session-live` rejection after opening history through the Remote/Typert resolver or forking a session: retain disposal handles on both paths.
- Remove durable projection checkpoints and block delayed writes from restoring deleted cache rows.
- Verify all three creation paths with real Web composition snapshots. Add an incremental upgrade patch for hosts already using 0.4.0.

# 0.4.0 — 2026-09-05

- Fix deletion lifecycle in the new `deleteSession-complete.diff` Host patch: dispose owned idle agents, drain retired writes outside the queue, then remove durable records and indexes.
- Preserve failed deletions for retry, including archive IDs whose session metadata is missing.
- Add search, workspace filtering, recent-first ordering, operation locking, accessible centered confirmation and error feedback.
- Generate the local plugin browser artifact from this source with `pnpm export:local`.

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
