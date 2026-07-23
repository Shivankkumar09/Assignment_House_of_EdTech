# Marginal — backend (Node + Express + MongoDB, TypeScript)

TypeScript port of the backend — same routes, same WebSocket collaboration
contract, same behavior as the JS version, just fully typed (including a
typed `Express.Request.user` and hand-written declarations for
`y-websocket/bin/utils`, which ships with no types of its own).

## Setup

```bash
npm install
cp .env.example .env       # set MONGODB_URI and a real JWT_SECRET
npm run dev                # ts-node-dev with auto-reload, http://localhost:4000
```

```bash
npm run build && npm start  # compile to dist/ and run the compiled JS
npm run typecheck           # tsc --noEmit only
```

Needs a MongoDB instance — local (`mongod`) or [Atlas](https://www.mongodb.com/atlas).

## Project layout

```
src/
  server.ts                   entry point: connects DB, starts HTTP + WS
  app.ts                       express app: middleware, routes, error handler
  config/db.ts                 mongoose connection
  models/
    User.ts                    name, email, bcrypt passwordHash
    Document.ts                 title, owner, collaborators[], yState (Buffer)
    Version.ts                  label, update (Buffer), createdBy, isAutosave
  middleware/
    auth.ts                    JWT bearer-token authentication
    errorHandler.ts            asyncHandler wrapper + centralized error responses
  utils/
    jwt.ts, HttpError.ts, permissions.ts
  controllers/
    auth.controller.ts         signup / login / me
    documents.controller.ts    list / create / get / rename / delete / invite
    versions.controller.ts     list / save / getSnapshot / restore
  routes/
    auth.routes.ts, documents.routes.ts
  ws/
    collabServer.ts            Yjs sync + awareness + Mongo-backed persistence
  types/
    express.d.ts                augments Request with `user: IUser`
    y-websocket-utils.d.ts      hand-written types for the untyped y-websocket server API
```

## API reference

Identical to the JS version — see below. All `/api/documents*` routes require
`Authorization: Bearer <token>`.

```
POST   /api/auth/signup          { name, email, password }        -> 201 { token, user }
POST   /api/auth/login           { email, password }               -> 200 { token, user }
GET    /api/auth/me                                                -> 200 { user }

GET    /api/documents                                              -> 200 { documents: [...] }
POST   /api/documents            { title }                        -> 201 { document }
GET    /api/documents/:id                                          -> 200 { document } (+ base64 `snapshot`)
PATCH  /api/documents/:id        { title }                        -> 200 { document }        (editor+)
DELETE /api/documents/:id                                          -> 204                     (owner only)
POST   /api/documents/:id/collaborators   { email, role }         -> 200 { document, invited } (owner only)

GET    /api/documents/:id/versions                                 -> 200 { versions: [...] }
POST   /api/documents/:id/versions       { label, update }        -> 201 { version }          (editor+)
GET    /api/documents/:id/versions/:versionId                      -> 200 { update }  (base64 Yjs state)
POST   /api/documents/:id/versions/:versionId/restore              -> 200 { ok, restoredAt }   (editor+)

GET    /api/health                                                  -> 200 { ok: true }
```

**WebSocket:** `ws://<host>/collab/:docId?token=<jwt>` — matches the URL
`y-websocket`'s `WebsocketProvider(WS_URL, docId, ydoc, { params: { token } })`
produces on the frontend when `NEXT_PUBLIC_WS_URL=ws://<host>/collab`.

## Notes on the TS conversion

- `y-websocket/bin/utils` ships no type declarations; `src/types/y-websocket-utils.d.ts`
  declares just the two functions this project uses (`setupWSConnection`,
  `setPersistence`).
- The HTTP `upgrade` event hands you a `stream.Duplex`, not a `net.Socket` —
  that's what the reject-upgrade helper in `collabServer.ts` is typed against.
- `req.user` (set by the `authenticate` middleware) is added to Express's
  `Request` type globally via `src/types/express.d.ts`, so every controller
  gets it fully typed with no casting.

## Known scope limitation (unchanged from the JS version)

Viewer-vs-editor write protection is enforced **client-side** plus a
collaborator-role check on WebSocket connect, but the collab server doesn't
inspect individual Yjs sync frames to block a *modified client* from writing
after connecting as a viewer. See the comment in `collabServer.ts` — happy to
add a stricter message-level filter if you want that.
