# API and realtime reference

## HTTP API

All routes below are prefixed with `/api`. Every route except signup, login and health probes
requires the authentication cookie.

Protected routes return **401** for an invalid, expired or revoked session and
**503** when a database failure prevents session verification. A 503 does not
invalidate the cookie. Socket handshake errors expose the equivalent
`error.data.code`: `UNAUTHORIZED` or `SESSION_UNAVAILABLE`. Packets that cannot
be authenticated are rejected and their socket is disconnected.

### Health

| Method | Endpoint  | Description                              |
| ------ | --------- | ---------------------------------------- |
| GET    | `/health` | Liveness probe, no authentication needed |
| GET    | `/ready`  | Database readiness, 200 or 503           |

### Auth

| Method | Endpoint            | Description                                       |
| ------ | ------------------- | ------------------------------------------------- |
| POST   | `/auth/signup`      | Create an account                                 |
| POST   | `/auth/login`       | Log in                                            |
| POST   | `/auth/logout`      | Log out                                           |
| GET    | `/auth/me`          | Current session user                              |
| PUT    | `/auth/profile`     | Update name / avatar                              |
| PUT    | `/auth/password`    | Change password                                   |
| PATCH  | `/auth/preferences` | Save account appearance and messaging preferences |

Signup keeps its successful **201** `{ message, user }` response. Errors add a
machine-readable `code` where recovery differs:

- **400**, `USERNAME_TAKEN`: the requested username already exists, including a concurrent insert.
- **503**, `ACCOUNT_CREATED_LOGIN_REQUIRED`: the account was saved but session creation failed; use login instead of creating it again.
- **503**, no code: friend-code allocation exhausted five insert attempts; retry signup later. No account was created.

The four-character friend-code format and unique index are unchanged. Only
friend-code duplicate errors retry; other duplicate keys are not reported as
username conflicts.

### Friends

| Method | Endpoint                 | Description                |
| ------ | ------------------------ | -------------------------- |
| GET    | `/friends/search?query=` | Search by username or code |
| POST   | `/friends/send/:id`      | Send a friend request      |
| POST   | `/friends/respond`       | Accept or reject a request |
| GET    | `/friends/list`          | List friends               |
| GET    | `/friends/requests`      | Incoming requests          |
| GET    | `/friends/sentRequests`  | Outgoing requests          |
| DELETE | `/friends/cancel/:id`    | Cancel a sent request      |
| DELETE | `/friends/remove/:id`    | Remove a friend            |

Search accepts 1–20 ASCII letters, digits or underscores and returns at most 20
public profiles (`_id`, `fullName`, `username`, `profilePic`, `friendCode`), excluding
the authenticated user. Matching is by username or friend code, not full name.
The New chat UI trims whitespace and starts after 2 characters and 350 ms;
`#` is not accepted. Opening a result selects a conversation/draft without sending.

Sending a request shares the existing in-process pair guard with acceptance and
removal. Concurrent same-direction or opposite-direction sends cannot create two
pending requests in the supported single-instance server. Existing friends or
pending requests return 400; an active pair operation returns 409. No schema or
response-envelope changes were introduced.

Accept/reject/cancel compete for the pending request. Once acceptance starts,
rejection and cancellation return 400; a failed acceptance remains in the pending
list and can be retried to finish its idempotent writes. An overlapping send, acceptance
or removal for the same pair returns 409 in the supported single-instance server.
Removal retires unfinished acceptance for that pair, so retrying an older request
cannot restore a removed friendship. Friendship removal preserves conversation
status and both participants' message histories.

Successful send/respond/cancel/remove operations emit `friendListsChanged` with
no payload to both accounts' rooms, including the initiating account's other tabs.
Clients refresh the existing three friend-list endpoints and discard older
snapshots. The existing friend notification events remain available. Successful
acceptance also emits `conversationAccepted` to the accepting account's room to
refresh its pending message requests and conversation status.

### Messages

| Method | Endpoint                  | Description                |
| ------ | ------------------------- | -------------------------- |
| GET    | `/messages/:id`           | Conversation with a user   |
| POST   | `/messages/send/:id`      | Send a message             |
| PUT    | `/messages/edit/:id`      | Edit your own message      |
| DELETE | `/messages/:id`           | Delete your own message    |
| POST   | `/messages/react/:id`     | Add or remove a reaction   |
| GET    | `/messages/unread/counts` | Unread count per sender    |
| DELETE | `/messages/clear/:id`     | Clear conversation history |

Message deletion is owner-only: invalid IDs return **400**, missing messages
**404**, and another user's message **403**. Deleting your already deleted message
returns **200**, with the same `{ message, deletedMessage }` response as the first
deletion. The atomic update stores the deletion marker; concurrent edits cannot
restore the content. Editing a deleted message returns **400**.

Successful deletion emits `messageDeleted` with `{ messageId }` to all connected
sessions of both sender and receiver, including the requesting session. Consumers
must tolerate repeated events and update any matching conversation preview.

`DELETE /messages/clear/:id` hides history only for the authenticated account,
including pending message requests. It does not decline/delete a conversation for
the peer or change its status. The successful response is
`{ message, deletedCount, clearedThrough }`. `clearedThrough` is the highest existing
message ID captured before the update (or a retained conversation reference when
both users already cleared the records); it can be null for an empty conversation.
Only IDs at or below that boundary are cleared, using the same ordering as history
pagination. Later IDs remain visible. Missing conversations return 404; clearing
an existing empty/already-cleared history succeeds. Physical cleanup removes records
only when both participants have cleared them.

`conversationCleared { peerId, clearedThrough }` is emitted only to the clearing
account's sessions. Clients apply the boundary to messages, previews and pending
requests, refresh pagination/unread counts, and ignore older out-of-order boundaries.

`POST /messages/react/:id` accepts `{ emoji: string }` from either participant.
The allowed values come from the vendored Emojibase 17.0.0 catalog, including
skin-tone variants and ZWJ sequences. Standalone components/modifiers, empty or
non-string values, plain text and multiple emojis return 400. Catalog aliases
without the emoji presentation selector are accepted; the original six reaction
spellings remain compatible with existing records (for example, `👍️` toggles `👍`).
Repeating your current emoji removes it; choosing another
replaces only your reaction. Updates are atomic, including concurrent toggles.
Invalid/deleted messages return 400, missing messages 404, nonparticipants 403.
The response is `{ message, reactions, reactionVersion }`; the monotonically
increasing per-message version is also included in `messageReaction` events:
`{ messageId, reactions, reactionVersion }`, sent to both participants' account
rooms, including the initiator's other sessions. Consumers ignore older versions
and never restore a deleted message from a late reaction response/event.

### Conversations

| Method | Endpoint                        | Description              |
| ------ | ------------------------------- | ------------------------ |
| GET    | `/conversations`                | List conversations       |
| GET    | `/conversations/status/:status` | Filter by status         |
| PUT    | `/conversations/accept/:id`     | Accept a message request |

## Socket Events

| Event                   | Direction                 | Purpose                                           |
| ----------------------- | ------------------------- | ------------------------------------------------- |
| `conversationAccepted`  | server → client           | Message request accepted                          |
| `getOnlineUsers`        | server → client           | Current online user IDs                           |
| `newMessage`            | server → client           | Incoming message                                  |
| `messageEdited`         | server → client           | A message was edited                              |
| `messageDeleted`        | server → client           | A message was deleted                             |
| `conversationCleared`   | server → clearing account | History hidden through a message ID               |
| `messageReaction`       | server → client           | A reaction changed                                |
| `messagesRead`          | server → client           | Recipient read your messages                      |
| `userTyping`            | server → client           | Peer is typing                                    |
| `userStoppedTyping`     | server → client           | Peer stopped typing                               |
| `newFriendRequest`      | server → client           | Incoming friend request                           |
| `friendRequestResponse` | server → client           | Your request was accepted                         |
| `friendRequestRejected` | server → client           | Your request was rejected                         |
| `friendListsChanged`    | server → both accounts    | Refresh friendship lists after a persisted change |
| `typing`                | client → server           | User started typing                               |
| `stopTyping`            | client → server           | User stopped typing                               |
| `chatOpened`            | client → server           | Mark messages as read                             |

## Pagination and sessions

`PATCH /api/auth/preferences` accepts a non-empty partial object with `theme`
(`system`, `light`, `dark`), `accent` (the 14 named palette IDs), `density`
(`comfortable`, `compact`), `fontSize` (`standard`, `large`), `sendKey`
(`enter`, `mod-enter`), and boolean `chatSound`, `notificationSound`,
`messagePreviews`. Unknown keys and invalid types/values return 400. The authenticated
account alone is updated, atomically per supplied field; the response is
`{ preferences: <complete preferences> }`. Signup, login, `/auth/me` and profile
responses also include `user.preferences`. Older accounts receive defaults without
a data backfill. Other devices pick up changes on their next session load.
See the [preference contract](contracts/atlassian-overhaul/shared.md) for the full
palette IDs and defaults.

`GET /api/messages/:id` returns the latest 50 messages in chronological order.
Request older history with `?before=<oldest-message-id>&limit=50` (maximum 50).
`X-Has-More: true` indicates another page. Search in the UI covers loaded messages.

`GET /api/ready` returns 200 while MongoDB is connected, otherwise 503.

Login/signup and password changes issue an HttpOnly session cookie. Logout revokes
that session; password changes invalidate all previous sessions. Socket.IO uses
the same cookie; a query-string user ID is ignored.

Messages are limited to 2,000 characters; JSON request bodies to 16 KiB. New
passwords require at least 8 characters and at most 72 UTF-8 bytes. Public profile
images must use HTTPS; an empty URL uses initials.

Authenticated clients can emit `typing` and `stopTyping` with `{ receiverId }`,
and `chatOpened` with `{ otherUserId }`. IDs must identify an existing conversation.
Socket events are limited per connection. Reconnect clients should refresh stored
state through the API because disconnected clients do not receive old events.
