# Verification record

## Account personalization / contract step 01 — 25 September 2026

Implemented the approved sectioned Atlaskit settings modal and account-persisted
preferences. The [contract index](contracts/atlassian-overhaul/README.md) is the
handoff for later sessions; only step 01 is implemented in this delivery.

| Check | Observed result |
| --- | --- |
| Frontend lint / Vite production build | Passed |
| Preferences API regression | Defaults, legacy records, partial writes, validation, isolation and all accents passed |
| Settings Chromium suite | 106 checks passed, desktop and mobile |
| Accent contrast | 28 light/dark combinations; minimum measured text contrast 4.51:1; focus >= 3:1 |
| Existing HTTP / realtime / security suites | 41 / 8 / 37 passed |
| Existing Chromium UI suite | 56 passed |
| Conversation query regression | Passed; 2 read commands per list |
| Concurrent-message regression | 40 sends succeeded; exact history, newest bounded preview and active status verified |

The settings tests reproduced a pre-existing concurrent-send `VersionError`:
messages persisted but the later conversation save could return HTTP 500. An
atomic bounded preview update now fixes that race. Before the fix 18/20 parallel
sends failed; after it 40/40 succeeded. No public message API changed.

Tests used disposable MongoDB 7 databases on local port 27018, separate app ports,
and Chromium. Settings screenshots: [desktop](screenshots/settings-desktop.png),
[mobile](screenshots/settings-mobile.png). Reproducible checks are `npm run
test:preferences`, `npm run test:settings`, and `npm run test:message-concurrency`;
set `MONGO_URI` to a disposable database first. Browser tests require `npm run build`.
Detailed contrast JSON and test logs are in ignored `test-results/` and uploaded
by the updated CI workflow. No remote CI run, deployment or push was made.

The modal's dependencies load on demand: Settings JS 422.48 kB (126.37 kB gzip),
Home JS 59.22 kB (17.52 kB gzip), measured by the production build. Future emoji
and icon migrations remain documented, not implemented globally in this step.

Follow-up copy correction: removed slogans and redundant descriptions from settings,
authentication and empty states; removed user-facing theme-provider names, including
accessible labels. Both rules are required by the shared contract. Build, lint and
both Chromium suites (106 + 56 checks) passed again after the correction; settings
screenshots were refreshed and inspected. The requested commit includes the pending
overhaul and these corrections on `codex/settings-copy-contracts`.

## Previous partial frontend overhaul — 25 September 2026

Selected layout A is implemented on `codex/frontend-overhaul`. Strict-peer clean
install, lint, production build, 41 API checks, 8 realtime checks, 37 security
checks, 56 browser checks and the new conversation-query regression passed.
The query check covers preview filtering and bounded database reads. Current
desktop/mobile chat images below show this baseline implementation. Current
migration decisions and limits are maintained in the [contract index](contracts/atlassian-overhaul/README.md).

## Previous release verification

Local verification on **21 September 2026**, from the `release/production-ready`
branch. This records observed results; it is not a penetration-test certificate.

| Check | Result |
| --- | --- |
| Frontend ESLint | Passed |
| Vite production build | Passed |
| Backend and test JavaScript syntax | Passed |
| HTTP smoke suite | 41 checks passed |
| Authenticated Socket.IO suite | 8 checks passed |
| Security regression suite | 37 checks passed |
| Chromium desktop/mobile suite | 38 checks passed |
| `npm audit` backend and frontend | 0 reported vulnerabilities at scan time |
| Gitleaks full Git history | Passed, no findings |
| GitHub Actions actionlint and YAML parsing | Passed |
| Local and optional production Compose validation | Passed |
| Actual Docker build and startup | Both services healthy |
| Docker auth, live delivery, restart persistence | Passed |
| Runtime restrictions | UID 1000, read-only root, MongoDB unpublished |
| Trivy 0.74.0 runtime image scan | No HIGH/CRITICAL findings with available fixes |

The initial runtime scan detected vulnerable dependencies inside the base image's
bundled npm installation. Package managers are now removed after dependency
installation because the final image only needs Node to run the app. The rebuilt
image passed the same severity/fix-availability policy used by CI.

Tests used explicitly selected disposable MongoDB databases and separate app ports.
Existing local data was backed up before updating the local Compose stack; no
public deployment or GitHub push was performed.

The [desktop](screenshots/desktop-chat.png) and [mobile](screenshots/mobile-chat.png)
images are actual browser captures using test accounts. Browser traces and scan
reports are local ignored artifacts. Future GitHub runs upload fresh evidence.

## Not verified remotely

GitHub Actions and CodeQL have not run on GitHub for this branch yet. Required
checks, branch rules, repository settings and any public hosting must be verified
after the remote is configured. No public-domain HTTPS/proxy deployment was tested.

Dependency/advisory data changes over time. Repeat the pipeline when publishing or
updating the image; a passing result does not establish the absence of other bugs.
