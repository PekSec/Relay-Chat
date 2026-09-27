# Graph Report - Relay-Chat  (2026-09-27)

## Corpus Check
- 193 files · ~113,955 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 6, .css 2, .example 1)

## Summary
- 744 nodes · 1687 edges · 61 communities (58 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.85)
- Token cost: unavailable. Host-agent tools did not expose usage; numeric zeros in cost.json are placeholders, not zero consumption. AST extraction uses no LLM tokens.

## Community Hubs (Navigation)
- React Views and Requests
- Conversation and Socket State
- Friends and Sidebar Navigation
- Conversation Storage and History
- Backend Package Dependencies
- Repository Build Commands
- Server and Socket Infrastructure
- Architecture and Operational Guidance
- Frontend Build Configuration
- Frontend Runtime Dependencies
- Browser Test Infrastructure
- Authentication and Session Creation
- Session Verification and Users
- Interface and Emoji Contracts
- Message Delivery and Reactions
- Friend Request Validation
- Theme and Sound Preferences
- Settings Accessibility Checks
- Frontend Development Dependencies
- Concurrent Updates and Preferences
- Responsive Interface Checks
- Realtime Integration Checks
- Security Integration Checks
- Application Smoke Checks
- Chat Layout Checks
- React Dependency Overrides
- Frontend Entry and Styles
- Delete Dialog Checks
- Edited Message State Checks
- Frontend Build Commands
- Desktop Chat Preferences
- Mobile Chat Preferences
- Desktop Clear History Dialog
- Desktop Delete Message Dialog
- Mobile Delete Message Dialog
- Desktop Light Chat
- Desktop Dark Chat
- Mobile Clear History Dialog
- Desktop Dark Emoji Picker
- Desktop Light Emoji Picker
- Mobile Dark Emoji Picker
- Mobile Light Emoji Picker
- Desktop Dark Reaction Picker
- Desktop Light Reaction Picker
- Mobile Dark Reaction Picker
- Mobile Light Reaction Picker
- Desktop Login Form
- Desktop Login Failure
- Mobile Light Login
- Mobile Dark Login Failure
- Mobile Light Conversation
- Mobile Dark Conversation
- Desktop Appearance Settings
- Mobile Appearance Settings
- Desktop Signup Form
- Mobile Dark Signup Failure
- Mobile Light Signup
- Relay Favicon Design
- Default Avatar Design

## God Nodes (most connected - your core abstractions)
1. `useConversation` - 52 edges
2. `react` - 49 edges
3. `apiFetch()` - 42 edges
4. `useSocket` - 39 edges
5. `useAuth` - 34 edges
6. `useFriendStore` - 31 edges
7. `scripts` - 30 edges
8. `@atlaskit/button` - 19 edges
9. `useTheme` - 17 edges
10. `mongoose` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Unverified request-direction inconsistency candidate` --conceptually_related_to--> `useGetMessageRequests()`  [AMBIGUOUS]
  docs/contracts/atlassian-overhaul/07-requests.md → frontend/src/hooks/friends/useGetMessageRequests.js
- `Documented invalid-session versus infrastructure-failure distinction` --references--> `verifySession()`  [EXTRACTED]
  docs/contracts/atlassian-overhaul/02-login.md → backend/utils/session.js
- `Approved delete, clear and emoji dialog contracts` --references--> `EmojiPanel()`  [EXTRACTED]
  docs/contracts/atlassian-overhaul/04-dialogs.md → frontend/src/components/emoji/EmojiPanel.jsx
- `Person-search contract: username/code query bounds and draft-only chat selection` --references--> `useSearchUsers()`  [EXTRACTED]
  docs/contracts/atlassian-overhaul/06-new-chat.md → frontend/src/hooks/friends/useSearchUsers.js
- `Message-request contract: hide changes only own history visibility` --references--> `clearConversationHistory()`  [EXTRACTED]
  docs/contracts/atlassian-overhaul/07-requests.md → frontend/src/utils/clearConversationHistory.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Contract requirement: shared pending-request lists, actions and notification counts** — docs_contracts_atlassian_overhaul_05_friends_friends_contract, docs_contracts_atlassian_overhaul_07_requests_message_requests_contract, docs_contracts_atlassian_overhaul_08_notifications_notifications_contract, docs_contracts_atlassian_overhaul_08_notifications_pending_request_count [EXTRACTED 1.00]
- **Persisted history and race-resistant realtime account state** — docs_architecture_persist_before_notify, docs_api_message_deletion, docs_api_history_clearing, docs_api_versioned_reactions, docs_api_history_pagination [INFERRED 0.85]

## Communities (61 total, 3 thin omitted)

### Community 0 - "React Views and Requests"
Cohesion: 0.06
Nodes (54): Unapproved person-search redesign contract: sidebar, modal or workspace, Person-search contract: username/code query bounds and draft-only chat selection, Message-request contract: hide changes only own history visibility, React 19 frontend development and production integration guide, Login, SignUp, EmojiPanel, EmojiPicker() (+46 more)

### Community 1 - "Conversation and Socket State"
Cohesion: 0.11
Nodes (39): App(), Home, MessageContainer(), NoChatSelected(), MessageInput(), Conversation(), shortTime(), Conversations() (+31 more)

### Community 2 - "Friends and Sidebar Navigation"
Cohesion: 0.09
Nodes (34): Login contract: centered card documented as implemented, Documented invalid-session versus infrastructure-failure distinction, Signup contract: single-column card documented as implemented, Documented friend-code collision and session-creation recovery, Friends contract: all friends, incoming requests and outgoing requests remain distinct, Unapproved friends redesign contract: three layout alternatives, Unapproved message-request redesign contract: review, accept or hide, Unverified request-direction inconsistency candidate (+26 more)

### Community 3 - "Conversation Storage and History"
Cohesion: 0.09
Nodes (23): acceptConversation(), getConversations(), getConversationsByStatus(), listConversations(), Conversation, conversationSchema, Message, messageSchema (+15 more)

### Community 4 - "Backend Package Dependencies"
Cohesion: 0.06
Nodes (32): author, dependencies, bcryptjs, compression, cookie-parser, dotenv, express, express-rate-limit (+24 more)

### Community 5 - "Repository Build Commands"
Cohesion: 0.07
Nodes (30): scripts, build, client, dev, docker:down, docker:up, install:all, lint (+22 more)

### Community 6 - "Server and Socket Infrastructure"
Cohesion: 0.11
Nodes (22): connectToMongoDB(), isAllowedOrigin(), protectOrigin(), router, router, router, authIpLimit, authLimiter (+14 more)

### Community 7 - "Architecture and Operational Guidance"
Cohesion: 0.10
Nodes (26): Weekly npm, Docker and GitHub Actions dependency updates, Pull request behavior summary and verification checklist, CI quality and container verification workflow, Compose readiness, runtime restrictions and Trivy checks, Node 22 and MongoDB 7 integration and Chromium checks, CodeQL, lockfile audit and full-history Gitleaks workflow, GitHub branch protection requires repository-side setup, Contribution workflow and disposable-database test policy (+18 more)

### Community 8 - "Frontend Build Configuration"
Cohesion: 0.10
Nodes (21): socket.io-client, name, private, type, version, @atlaskit/popup, @atlaskit/radio, @atlaskit/toggle (+13 more)

### Community 9 - "Frontend Runtime Dependencies"
Cohesion: 0.08
Nodes (24): dependencies, @atlaskit/avatar, @atlaskit/button, @atlaskit/form, @atlaskit/icon, @atlaskit/modal-dialog, @atlaskit/popup, @atlaskit/radio (+16 more)

### Community 10 - "Browser Test Infrastructure"
Cohesion: 0.13
Nodes (10): ref_node_child_process, ref_node_crypto, ref_node_fs, ref_node_net, ref_node_timers, playwright, api(), signup() (+2 more)

### Community 11 - "Authentication and Session Creation"
Cohesion: 0.19
Nodes (16): cookieSameSite, cookieSecure, changePassword(), getMe(), login(), logout(), signup(), updatePreferences() (+8 more)

### Community 12 - "Session Verification and Users"
Cohesion: 0.14
Nodes (11): getUsersForSidebar(), protectRoute(), preferenceFields, User, userSchema, server, verifySession(), jsonwebtoken (+3 more)

### Community 13 - "Interface and Emoji Contracts"
Cohesion: 0.12
Nodes (17): Documented immediate preference preview with save/cancel rollback, Settings contract: sectioned modal documented as implemented, Main chat contract: approved two-column layout documented as implemented, Documented timestamp-ordered edits and loaded-range reconnect recovery, Documented account-only clear modal and clear boundary, Documented lazy deletion modal with 240-grapheme preview, Approved delete, clear and emoji dialog contracts, Frimousse 0.4.0 and native Unicode emoji contract (+9 more)

### Community 14 - "Message Delivery and Reactions"
Cohesion: 0.18
Nodes (14): clearConversation(), deleteMessage(), editMessage(), getMessage(), getUnreadCounts(), reactToMessage(), sendMessage(), getReceiverSocketId() (+6 more)

### Community 15 - "Friend Request Validation"
Cohesion: 0.24
Nodes (13): cancelFriendRequest(), getFriendRequests(), getFriends(), getSentFriendRequests(), removeFriend(), respondToFriendRequest(), searchUsers(), sendFriendRequest() (+5 more)

### Community 16 - "Theme and Sound Preferences"
Cohesion: 0.23
Nodes (12): ThemeSelect, options, ThemeSelect(), applyPreferences(), applyTheme(), guestPreferences(), initializeTheme(), samePreferences() (+4 more)

### Community 17 - "Settings Accessibility Checks"
Cohesion: 0.17
Nodes (9): ACCENTS, DEFAULT_PREFERENCES, api(), choose(), contrast(), contrastEvidence, luminance(), section() (+1 more)

### Community 18 - "Frontend Development Dependencies"
Cohesion: 0.15
Nodes (13): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, postcss (+5 more)

### Community 19 - "Concurrent Updates and Preferences"
Cohesion: 0.20
Nodes (10): mongodb, accounts, api(), mongo, signup(), accounts, api(), defaults (+2 more)

### Community 20 - "Responsive Interface Checks"
Cohesion: 0.29
Nodes (7): api(), assertLayout(), check(), contexts, showActions(), signup(), visible()

### Community 21 - "Realtime Integration Checks"
Cohesion: 0.46
Nodes (7): api(), check(), cookieFrom(), run(), user(), waitFor(), waitForServer()

### Community 22 - "Security Integration Checks"
Cohesion: 0.36
Nodes (6): api(), connect(), cookieOf(), event(), signup(), sockets

### Community 23 - "Application Smoke Checks"
Cohesion: 0.46
Nodes (7): api(), check(), cookieFrom(), run(), user(), waitForServer(), startTestServer()

### Community 24 - "Chat Layout Checks"
Cohesion: 0.33
Nodes (3): api(), mongo, signup()

### Community 25 - "React Dependency Overrides"
Cohesion: 0.33
Nodes (6): @atlaskit/analytics-next-stable-react-context, react, overrides, @atlaskit/analytics-next, react, react-dom

### Community 26 - "Frontend Entry and Styles"
Cohesion: 0.33
Nodes (5): frontend_src_index, render(), frontend_src_preferences, react-dom, react-router-dom

### Community 27 - "Delete Dialog Checks"
Cohesion: 0.47
Nodes (4): api(), open(), signup(), visible()

### Community 28 - "Edited Message State Checks"
Cohesion: 0.33
Nodes (4): conversation, latest, newer, original

### Community 29 - "Frontend Build Commands"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 30 - "Desktop Chat Preferences"
Cohesion: 0.50
Nodes (4): Outgoing message marked as edited, Non-friend banner with add friend action, Composer shows Ctrl/Cmd+Enter to send and Shift+Enter for newline, Relay desktop chat in light theme

### Community 31 - "Mobile Chat Preferences"
Cohesion: 0.50
Nodes (4): Non-friend banner with add friend action, Visible reaction edit and delete message controls, Bottom message composer with emoji and send controls, Relay mobile chat in dark theme

### Community 32 - "Desktop Clear History Dialog"
Cohesion: 0.50
Nodes (4): Dialog says history is hidden only from own account and other participant messages are preserved, Cancel and red clear-history buttons, Connection failed alert with retry instruction, Desktop light theme clear-history confirmation

### Community 33 - "Desktop Delete Message Dialog"
Cohesion: 0.50
Nodes (4): Warning that message deletion affects both participants and cannot be undone, Connection failed alert with cancel and delete controls, Repeated emoji message preview, Desktop light theme message deletion dialog

### Community 34 - "Mobile Delete Message Dialog"
Cohesion: 0.50
Nodes (4): Irreversible deletion warning for both participants, Connection failed alert with bottom cancel and delete actions, Repeated emoji message preview, Mobile dark theme full-screen message deletion dialog

### Community 35 - "Desktop Light Chat"
Cohesion: 0.50
Nodes (4): Chats people and requests tabs above searchable conversation list, Bottom composer with Enter to send and Shift+Enter newline hint, Thumbs-up reaction beneath outgoing message, Relay desktop two-pane chat in light theme

### Community 36 - "Desktop Dark Chat"
Cohesion: 0.50
Nodes (4): Reaction edit and delete controls beside outgoing message, Thumbs-up reaction beneath outgoing coffee invitation, Green online presence for Ece Demir, Relay desktop two-pane chat in dark theme

### Community 37 - "Mobile Clear History Dialog"
Cohesion: 0.67
Nodes (3): History removal explained as own-account-only hiding, Connection failed alert above bottom cancel and clear actions, Mobile dark theme full-screen clear-history confirmation

### Community 38 - "Desktop Dark Emoji Picker"
Cohesion: 0.67
Nodes (3): Smileys and emotion grid beside hand icon control, Focused emoji search field requests English terms, Desktop dark chat with emoji picker above composer

### Community 39 - "Desktop Light Emoji Picker"
Cohesion: 0.67
Nodes (3): Six-column smileys and emotion grid above message composer, Focused English-language emoji search, Desktop light chat with floating emoji picker

### Community 40 - "Mobile Dark Emoji Picker"
Cohesion: 0.67
Nodes (3): Cancel button at lower right of full-screen view, English search and five-column smileys grid, Mobile dark full-screen add-emoji interface

### Community 41 - "Mobile Light Emoji Picker"
Cohesion: 0.67
Nodes (3): Cancel button at lower right, Focused English search above five-column smileys grid, Mobile light full-screen add-emoji interface

### Community 42 - "Desktop Dark Reaction Picker"
Cohesion: 0.67
Nodes (3): Fire search groups emoji results by category, Reaction picker positioned above outgoing target message controls, Desktop dark chat with reaction picker beside target message

### Community 43 - "Desktop Light Reaction Picker"
Cohesion: 0.67
Nodes (3): Fire search shows categorized fire-related emoji, Popover anchored above target message action toolbar, Desktop light chat with reaction emoji popover

### Community 44 - "Mobile Dark Reaction Picker"
Cohesion: 0.67
Nodes (3): Cancel button at bottom of reaction view, Fire search with grouped heart firefighter phoenix engine and flame emoji, Mobile dark full-screen reaction selection

### Community 45 - "Mobile Light Reaction Picker"
Cohesion: 0.67
Nodes (3): Emoji results grouped by category, Emoji search for fire, Mobile light reaction picker

### Community 46 - "Desktop Login Form"
Cohesion: 0.67
Nodes (3): Empty username and password form, Desktop login screen, Registration link below login button

### Community 47 - "Desktop Login Failure"
Cohesion: 0.67
Nodes (3): Username and masked password form, Login failure alert, Desktop light login screen

### Community 48 - "Mobile Light Login"
Cohesion: 0.67
Nodes (3): Empty username and password form, Light theme selector, Mobile light login screen

### Community 49 - "Mobile Dark Login Failure"
Cohesion: 0.67
Nodes (3): Dark theme selector, Login failure alert, Mobile dark login screen

### Community 50 - "Mobile Light Conversation"
Cohesion: 0.67
Nodes (3): Mobile light conversation with Ece Demir, Thumbs up reaction below outgoing message, Online contact status in conversation header

### Community 51 - "Mobile Dark Conversation"
Cohesion: 0.67
Nodes (3): Mobile dark conversation with Ece Demir, Bottom message input with emoji and send controls, Thumbs up reaction below outgoing message

### Community 52 - "Desktop Appearance Settings"
Cohesion: 0.67
Nodes (3): Accent preview with sample message button and link, Desktop appearance settings modal, Dark theme and Iris accent selected

### Community 53 - "Mobile Appearance Settings"
Cohesion: 0.67
Nodes (3): Mobile appearance settings screen, Settings section dropdown showing appearance, Dark theme and Iris accent selected

### Community 54 - "Desktop Signup Form"
Cohesion: 0.67
Nodes (3): Password guidance requiring at least eight characters, Name username password confirmation and gender fields, Desktop account creation screen

### Community 55 - "Mobile Dark Signup Failure"
Cohesion: 0.67
Nodes (3): Populated registration fields with masked passwords and female selection, Account creation failure alert, Mobile dark account creation screen

### Community 56 - "Mobile Light Signup"
Cohesion: 0.67
Nodes (3): Password guidance requiring at least eight characters, Empty name username password confirmation and gender fields, Mobile light account creation screen

### Community 57 - "Relay Favicon Design"
Cohesion: 0.67
Nodes (3): Two white conversation bubbles joined by an R shaped connection, Rounded square with blue to teal gradient, Relay favicon SVG asset

## Ambiguous Edges - Review These
- `useGetMessageRequests()` → `Unverified request-direction inconsistency candidate`  [AMBIGUOUS]
  docs/contracts/atlassian-overhaul/07-requests.md · relation: conceptually_related_to

## Knowledge Gaps
- **236 isolated node(s):** `conversationSchema`, `friendRequestSchema`, `messageSchema`, `sessionSchema`, `userSchema` (+231 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 291 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `useGetMessageRequests()` and `Unverified request-direction inconsistency candidate`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `playwright` connect `Browser Test Infrastructure` to `Backend Package Dependencies`, `Settings Accessibility Checks`, `Responsive Interface Checks`, `Chat Layout Checks`, `Delete Dialog Checks`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `useConversation` connect `Conversation and Socket State` to `React Views and Requests`, `Friends and Sidebar Navigation`, `Edited Message State Checks`, `Interface and Emoji Contracts`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `scripts` connect `Repository Build Commands` to `Backend Package Dependencies`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **What connects `conversationSchema`, `friendRequestSchema`, `messageSchema` to the rest of the system?**
  _236 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `React Views and Requests` be split into smaller, more focused modules?**
  _Cohesion score 0.06406112253893623 - nodes in this community are weakly interconnected._
- **Should `Conversation and Socket State` be split into smaller, more focused modules?**
  _Cohesion score 0.10615079365079365 - nodes in this community are weakly interconnected._

## Extraction Limitations
- Audio assets frontend/public/message.mp3 and frontend/public/notification.mp3 were not transcribed: optional faster-whisper dependency unavailable.
- Emoji data.json and messages.json produced no AST nodes.
- Undirected graph: call direction is not preserved by graph traversal. Documentation contracts describe requirements, not proof of implemented behavior.
- Graph health: 2 dangling endpoint edges; 2 self-loops; 67 same-endpoint relationships collapsed in the undirected representation. See graph-health.json.

## Query Benchmark Estimate
- Graphify estimates 4.5x fewer tokens per query: approximately 49,600 naive tokens versus 10,971 query tokens.
- This is a heuristic benchmark (its corpus estimate is 37,200 words); detected corpus size is 113,955 words. It is not measured model usage or a coverage score.
- Documentation implementation and historical test claims were extracted, not independently reverified.
