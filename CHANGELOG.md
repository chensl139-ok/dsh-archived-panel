# Changelog

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
