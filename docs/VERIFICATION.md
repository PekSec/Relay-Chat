# Verification record

The newest entry describes the current implementation. Older entries record the
scope and checks performed at the time; their pending-work notes are historical.

## Main chat / contract step 04 — 27 September 2026

The user selected A: a 320 px conversation list and flexible chat on desktop,
with list/chat navigation below 768 px. Chat controls now use the installed
Atlassian components and theme tokens. Textarea 10.2.7 and Tooltip 24.3.6 are
pinned direct dependencies with React 19-compatible peer ranges. The existing
safe avatar renderer, Frimousse selectors and destructive dialogs are preserved.

Composer and edit both support multiline text, the account send-key preference,
IME and the 2,000 UTF-16-unit limit. Errors appear inline and preserve drafts.
Shared timestamp-aware edit state updates message text and previews without
rolling back newer changes; deletion and clearing retain precedence. History
retry uses the failed older cursor. Reconnect refreshes the already-loaded range,
including older pages, and preserves the visible data if any refresh page fails.
Late send responses cannot replace newer previews. Backend payloads, schemas
and the two-read conversation aggregation remain unchanged.

| Check | Observed result |
| --- | --- |
| New chat Chromium | **45 checks passed** across desktop and mobile |
| New store regression | Edit before history, ordered updates, previews, late send, deletion, clearing and account reset passed |
| Existing chat / settings UI | **56 / 106 passed** |
| Emoji / delete / clear UI | **69 / 47 / 47 passed** |
| Full regression | `npm run test:all` passed, including auth/session, realtime, security, conversations, preferences, message concurrency and all dialogs |
| Build / lint | Passed; the existing >500 kB main-chunk advisory remains |
| CI | `test:chat` added; remote CI was not run in this session |

The full suite included the first 41 chat checks. Four subsequent long-name and
maximum unbroken-message layout checks were added and the complete chat suite
was rerun: **45/45**. Tests use Chromium and an explicitly supplied disposable
MongoDB 7 database. The reduced mobile keyboard height is a 320×500 viewport
simulation, not a claim of physical-device keyboard testing.

A read-only final review identified two pre-existing races relevant to this
step: a delayed send overwriting a newer preview, and offline edits/deletions to
older loaded pages remaining stale after reconnect. Both were reproduced by
failing tests and fixed in the shared state/history paths. No review findings
were deferred. Browser checks also caught invisible message actions intercepting
the jump-to-latest control; inactive hit targets and stacking were corrected.

Legacy tests were updated to use the searchbox role and the full emoji catalog:
thumbs-up search accepts its Unicode presentation selector, and the smoke test
rejects a non-emoji string instead of a now-supported catalog emoji.

Reproduce with `npm run build`, `npm run lint`, `npm run test:chat` and
`npm run test:all`, using an explicit disposable `MONGO_URI` and free `PORT`.
Local Windows port 5040 was occupied by a system service; completed tests used
ports 5029–5033. The temporary MongoDB container is removed after verification.
No deployment is claimed.

| Chat | Light | Dark |
| --- | --- | --- |
| Desktop | [View](screenshots/desktop-chat.png) | [View](screenshots/desktop-chat-dark.png) |
| Mobile | [View](screenshots/mobile-chat.png) | [View](screenshots/mobile-chat-dark.png) |
| Purple accent, large type, compact density | [Desktop](screenshots/chat-desktop-light-preferences.png) | [Mobile](screenshots/chat-mobile-dark-preferences.png) |

Implementation and next-step handoff: [04 chat contract](contracts/atlassian-overhaul/04-chat.md).

## Frimousse emoji picker / contract step 04c — 26 September 2026

The user approved replacing the temporary 13-choice/six-reaction selectors with
Frimousse 0.4.0 in both the composer and message reactions. Both use the full
English catalog/search, skin tones and Turkish UI messages, within the existing
desktop Popup/mobile Modal. Emojibase 17.0.0 JSON and its MIT license are vendored
locally; the picker and backend validation share the same catalog. Native Unicode
is retained; the browser's glyph support determines which choices Frimousse shows.

| Check | Observed result |
| --- | --- |
| Emoji Chromium | **69 desktop/mobile checks passed** |
| Insertion and state | Caret/selection, UTF-16 limit, ZWJ/skin tones/combining marks, late history, out-of-order events, deletion and reset passed |
| Reaction backend | Catalog examples, skin tones/ZWJ/flags/keycaps, invalid values, original-six presentation aliases, ownership and 20 concurrent participant/toggle/deletion rounds passed |
| Themes and layout | Light/dark surfaces, live account accent, large text and 320 px mobile layout with 44 px targets passed |
| Loading and recovery | Lazy same-origin data requests, failed data fetch/retry with draft preservation, API 404/500/offline errors and duplicate-request protection passed |
| Accessibility | Keyboard selection, focus return and valid saved-selection semantics on reaction gridcells passed |
| Build / lint | Passed; Vite's existing >500 kB main-chunk advisory remains |
| Docker | Image build passed; Node 22 runtime validated reactions and confirmed identical backend/static catalog files |

The expanded tests first failed against the old catalog. Browser checks also
exposed Popup autofocus overriding the search focus; that conflict was corrected.
A read-only review found saved reactions marked with unsupported aria-pressed on
gridcells; the implementation now uses aria-selected and a separate styling
attribute, verified by a test that failed before the correction.

Lazy EmojiPanel JS is **27.49 kB / 9.92 kB gzip** (previous temporary panel:
2.22 / 1.14 kB). Main JS is 620.75 / 189.67 kB; Home is 91.49 / 28.89 kB;
shared Modal is 72.11 / 23.31 kB. These figures exclude other shared chunks/CSS.
The separately loaded JSON files are 775,157 bytes (data) and 6,499 bytes
(messages), before transport compression; they are not bundled into the main JS.

Reproduce with `npm run build`, `npm run lint`, `npm run test:emoji` and
`npm run test:emoji-ui`, using an explicit disposable MONGO_URI. Local checks used
MongoDB 7 on port 27018 and Chromium. No deployment or remote CI result is claimed.

The browser test regenerates composer and reaction captures in both themes and
devices under `test-results/`; representative captures are checked into
`docs/screenshots/`. Length-limit captures remain separate test artifacts.

| Flow | Desktop light | Desktop dark | Mobile light | Mobile dark |
| --- | --- | --- | --- | --- |
| Composer | [View](screenshots/emoji-desktop-light.png) | [View](screenshots/emoji-desktop-dark.png) | [View](screenshots/emoji-mobile-light.png) | [View](screenshots/emoji-mobile-dark.png) |
| Reaction search | [View](screenshots/emoji-reaction-desktop-light.png) | [View](screenshots/emoji-reaction-desktop-dark.png) | [View](screenshots/emoji-reaction-mobile-light.png) | [View](screenshots/emoji-reaction-mobile-dark.png) |

Behavior, data provenance and update instructions: [emoji contract](contracts/atlassian-overhaul/emoji.md).

## History clearing / contract step 04b — 25 September 2026

User selected B (person name/avatar). The lazy modal uses the installed Modal,
Avatar, Button, SectionMessage and Spinner components. It captures the target,
focuses Cancel, prevents repeated pending requests, preserves history on failure,
and returns focus to the header action. Search resets after success. The result
empty state now says only “Henüz mesaj yok.” No new dependency was installed.

| Check | Observed result |
| --- | --- |
| New history-clearing Chromium | 47 checks passed on desktop/mobile |
| New backend/state checks | Pending/active account isolation, repeat clear, missing conversation, concurrent arrival, physical cleanup, stale responses and session reset passed |
| Previous deletion checks | 47 browser checks, store regression and 30 backend races passed |
| Existing smoke / security / realtime | 41 / 37 / 8 passed |
| Existing UI / settings Chromium | 56 / 106 passed |
| Conversation queries | Correct previews/status filtering, at most two reads |
| Build / lint / changed JavaScript syntax / CI YAML / diff | Passed |

The backend regression first failed because clearing an incoming pending request
deleted the sender's history too. Clearing now always applies to the authenticated
user. A captured highest message ID bounds the update using existing pagination
ordering. The API returns this `clearedThrough` boundary and sends an account-only
`conversationCleared` event. HTTP/socket updates preserve later messages, discard
cleared records from late history/list responses, and reset pagination. Pending
request hiding shares the same behavior. No new endpoint was added.

Browser checks cover the captured person, cancel/focus trap/return, desktop overlay,
light/dark, large text, 404/500/network failure, double submit, two account sessions,
peer history preservation, a new message before the clear response arrives, reload,
empty/repeated clearing, search reset, pending requests, new requests after clearing,
conversation switch with a delayed response, and logout.

Read-only review and follow-up checks caught stale preview and unread snapshot
races. Each was reproduced before its fix. The state check covers old-ID and null
previews and old pending request snapshots without losing a known newer message.
The browser check delays a count response after clearing, delivers a new message
while both own tabs have no conversation selected, and verifies the unread count
remains one after a fresh snapshot. Aborted responses cannot close a later modal.

Reproduce with `npm run test:clear-history` and `npm run test:clear-dialog`, both
included in `test:all` and CI. Set an explicit disposable `MONGO_URI`; the browser
suite requires a build and defaults to port 5028. Local tests used disposable
MongoDB 7 on port 27018 and Chromium. Inspected screenshots:
[desktop light](screenshots/clear-desktop-light.png), [mobile dark](screenshots/clear-mobile-dark.png).

ClearHistoryModal JS: 2.28 kB / 1.20 kB gzip, plus shared Avatar
19.15 kB / 6.93 kB gzip and Modal 76.88 kB / 24.60 kB gzip. Main JS:
619.85 kB / 189.38 kB gzip. The existing Vite >500 kB advisory remains.
No remote CI run, deployment, commit or push was performed in this step.
04c emoji selection/provider assets and the main chat design still require
separate decisions; see the [dialog contract](contracts/atlassian-overhaul/04-dialogs.md).

## Message deletion / contract step 04a — 25 September 2026

Implemented the approved B modal with a 240-grapheme message preview, safe initial
focus, inline errors, retry, and a single pending request. The modal loads lazily
and uses existing Atlaskit dependencies. No provider branding or slogans are shown.
04b history clearing, 04c emoji integration, and the main chat design remain unapproved.

| Check | Observed result |
| --- | --- |
| Deletion Chromium | 47 checks passed on desktop/mobile |
| Deletion state regression | Unloaded targets, stale history/page/list/edit, previews, repeat events, session reset passed |
| Deletion backend regression | Ownership, invalid/missing ID, idempotent retry and 30 edit/delete races passed |
| Existing smoke / security / realtime | 41 / 37 / 8 passed |
| Existing UI / settings Chromium | 56 / 106 passed |
| Conversation queries | All/pending/active results correct, at most two reads |
| Production build / frontend lint / changed JavaScript syntax / diff | Passed |

The backend test first reproduced a repeated deletion returning 400. Deletion now
uses an atomic update and returns 200 on an owner's retry. Editing atomically
excludes deleted records. The unchanged `{ messageId }` socket payload reaches
all sessions of both accounts. HTTP and socket results share the store action.

The final read-only review found two additional races. A deletion arriving before
history loaded was lost, and a sender's other tab retained an open editor after
deletion. Both were reproduced by failing checks, then fixed: session-scoped
deletion IDs normalize later message/list writes, and a deleted row cannot render
its editor. IDs are discarded on account reset. The second-tab browser test now
keeps an editor open when the first tab deletes the message.

Browser coverage includes light/dark, large text, grapheme boundaries, focus trap
and return, cancel/desktop overlay, 403/404/non-JSON server/network failures,
duplicate submit, latest/older message previews, HTTP-only filtered deletion focus,
conversation change with a delayed response, and logout. Mobile uses the installed
Modal's full-screen layout. Screenshots inspected: [desktop](screenshots/delete-desktop-light.png),
[mobile dark](screenshots/delete-mobile-dark.png). Unicode is preserved; the official
emoji provider/asset work remains in 04c.

`npm run test:delete-message` and `npm run test:delete-dialog` are included in
`test:all` and CI. Both require an explicit disposable `MONGO_URI`; the browser
suite requires a production build and defaults to port 5027. Local runs used
MongoDB 7 on port 27018 and Chromium. No remote CI run or deployment was performed.

Deletion modal JS: 2.17 kB / 1.18 kB gzip, plus the shared modal chunk
76.88 kB / 24.60 kB gzip. Main JS: 618.40 kB / 188.93 kB gzip; the existing
Vite >500 kB advisory remains. No download timing is inferred from these sizes.
Scope and next decision: [04-dialogs contract](contracts/atlassian-overhaul/04-dialogs.md).

## Signup / contract step 03 — 25 September 2026

Implemented the approved A single-column card using the existing auth layout,
Atlaskit form fields, password visibility icons, status messages and RadioGroup.
Gender remains a required male/female choice. Signup preserves input on errors,
focuses invalid fields, and prevents duplicate requests. No slogans or provider
branding were added. Step 04 still requires a separate design selection.

| Check | Observed result |
| --- | --- |
| Signup API regression | 29 checks passed |
| Signup Chromium | 38 checks passed; desktop/mobile and short 320×480 viewport |
| Existing login / UI / settings Chromium | 48 / 56 / 106 passed |
| Existing smoke / security / realtime | 41 / 37 / 8 passed |
| Build / lint / syntax / CI YAML / diff | Passed |

The signup API test first failed on an injected friend-code duplicate. The fix
uses the unique index with at most five save attempts, hashing once; username
conflicts get their own stable code. The test also verifies that session creation
failure leaves the saved account intact and returns `ACCOUNT_CREATED_LOGIN_REQUIRED`.
Validation boundaries include 3/20-character usernames and 72/73-byte UTF-8 passwords.
Fault injection is at the database boundary; successful records use real MongoDB.

Browser coverage includes linked field errors/focus, password confirmation after
editing the first password, both visibility buttons, radio keyboard selection,
real duplicate username, 429/500/503/offline, non-JSON errors, duplicate submit,
themes, short-screen scrolling, default preferences, redirect and login link.
New tests run through `npm run test:signup-api` and `npm run test:signup`; both need
an explicitly supplied disposable `MONGO_URI`. The browser test needs a build and
defaults to port 5020. CI and `test:all` include both tests.

Screenshots inspected: [desktop](screenshots/signup-desktop.png),
[mobile](screenshots/signup-mobile.png), [dark error](screenshots/signup-mobile-dark.png).
SignUp JS is 7.03 kB / 3.29 kB gzip plus shared form/icon/Textfield chunks.
Main JS is 617.86 kB / 188.75 kB gzip; the existing Vite >500 kB advisory remains.
No network timing claim or remote CI execution is implied by these local checks.

The independent read-only review reported no important finding. Details and next
step: [03 contract](contracts/atlassian-overhaul/03-signup.md). No deployment or push
was performed in this step.

## Login and session states / contract step 02 — 25 September 2026

User selected A (centered card), then approved implementation. Login now uses
Atlaskit fields, form validation, status messages, loading indicator and password
visibility icons. Guest theme selection uses a lazy Select. No provider branding
or slogans appear in the UI. Step 03 remains unapproved.

- Production build and lint passed. Login JS: 39.20 kB / 14.05 kB gzip; shared
  Textfield and theme Select load separately. Main JS: 617.76 kB / 188.70 kB gzip;
  Vite still reports its >500 kB chunk advisory. No download-time claim is made.
- New login Chromium suite: **48 checks** across desktop/mobile, light/dark,
  validation, password visibility, loading, duplicate submit, 400/429/500/offline,
  session 401/503/retry, Enter, reload, real cross-tab logout/account change,
  preference isolation and signup navigation.
- Session fault regression: invalid/revoked/deleted-user sessions remain 401;
  DB failures return 503. Real Socket.IO handshakes distinguish these errors;
  unverified packets never reach handlers. Before the fix the DB failure
  assertion failed with 401 instead of 503. The initial browser test reproduced
  the server error being incorrectly displayed as a network error.
- Existing smoke **41**, security **37**, realtime **8**, UI **56**, settings
  **106** checks passed using disposable MongoDB 7 and production Chromium.
  The shared guest theme selector test now uses combobox keyboard interaction.
- Run `npm run test:session-errors` without Mongo, and `npm run test:login` after
  a build with explicit disposable `MONGO_URI` (default app port 5013). Both are
  included in `test:all` and CI. Local evidence is in `test-results/login*.log`.
- Screenshots inspected: [desktop](screenshots/login-desktop.png),
  [mobile](screenshots/login-mobile.png),
  [light error](screenshots/login-desktop-light.png),
  [dark error](screenshots/login-mobile-dark.png).

Implementation and handoff: [02 contract](contracts/atlassian-overhaul/02-login.md).
No remote CI run, deployment or push was performed.

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
