# Marginal — local-first collaborative document editor (frontend)

Next.js (App Router) frontend for the assignment: a local-first, collaborative
document editor with offline sync, deterministic conflict resolution, and
granular version history.

## How the requirements are met

| Requirement | How |
|---|---|
| Works fully offline | Every document is a **Yjs** CRDT persisted to **IndexedDB** (`y-indexeddb`) on every change. The editor reads/writes the local copy regardless of network state. |
| Automatic reconciliation on reconnect | `y-websocket`'s `WebsocketProvider` reconnects automatically and exchanges only the state-vector diff with the server, which rebroadcasts to other clients. |
| Deterministic conflict resolution | Conflict resolution is Yjs's CRDT merge itself: concurrent edits (including edits made entirely offline, from any number of clients) always converge to the same final document, with no last-writer-wins data loss and no manual merge step. |
| Granular version control | Two layers: (1) **Yjs `UndoManager`** for instant local undo/redo of your own edits, and (2) a **named version history** panel that snapshots the full CRDT state (`Y.encodeStateAsUpdate`) to the backend on demand, lists prior snapshots, and restores any of them back into the live document as an ordinary collaborative edit (via ProseMirror `setContent`, so it merges into history rather than destructively overwriting it). |
| Collaborative editing | Tiptap + `@tiptap/extension-collaboration` + `@tiptap/extension-collaboration-cursor`, giving shared editing with live collaborator cursors and a presence bar. |
| Auth / authorization | JWT-based; token is attached to both REST calls and the WebSocket connection (`?token=`). Documents carry a `role` (`owner` / `editor` / `viewer`) — viewers get a read-only editor. |
| Basic editing features | Bold, italic, strikethrough, headings, bullet/numbered lists, blockquote, code block, undo/redo. |

## Pages

- `/login`, `/signup` — auth
- `/documents` — document list (create, rename, delete, share indicator); works offline via a cached copy + a queued-operations log that replays when connectivity returns
- `/documents/[id]` — the editor: toolbar, presence bar, sync status badge, share modal, version history panel

## Setup

```bash
npm install
cp .env.local.example .env.local   # point at your backend
npm run dev
```

## Backend contract this frontend expects

The backend (Node/Express + MongoDB, to be built next) needs to expose:

**REST (`NEXT_PUBLIC_API_URL`, JWT via `Authorization: Bearer <token>`)**

```
POST   /auth/signup            { name, email, password } -> { token, user }
POST   /auth/login             { email, password }        -> { token, user }
GET    /auth/me                                            -> { user }

GET    /documents                                           -> { documents: DocumentSummary[] }
POST   /documents              { title }                   -> { document }
GET    /documents/:id                                       -> { document } (includes role for requesting user)
PATCH  /documents/:id          { title }                   -> { document }
DELETE /documents/:id

POST   /documents/:id/collaborators   { email, role }      -> invite a collaborator

GET    /documents/:id/versions                              -> { versions: DocumentVersion[] }
POST   /documents/:id/versions        { label, update }    -> save a version (update = base64 Yjs state)
GET    /documents/:id/versions/:vId                          -> { update } (base64 Yjs state at that point)
POST   /documents/:id/versions/:vId/restore                 -> marks a version as restored (audit trail)
```

**WebSocket (`NEXT_PUBLIC_WS_URL`)**

A `y-websocket`-compatible server (the reference [`y-websocket` server](https://github.com/yjs/y-websocket) works,
or a custom Express server upgrading to WS on the same port) keyed by document id, authenticating the `token`
query param, checking the user's role before allowing writes, and persisting each document's Yjs state to MongoDB
(e.g. via `y-mongodb-provider` or periodic `Y.encodeStateAsUpdate` snapshots) so state survives server restarts.

Say the word and I'll build that backend next — it'll implement exactly this contract.
