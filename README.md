# Marginal — Local-First Collaborative Document Editor

A full-stack collaborative document editor with offline support, real-time sync, and version history. Built for the House of EdTech assignment.

| Layer | Stack |
|---|---|
| Frontend | Next.js 14 (App Router), React, Tiptap, Yjs, Tailwind CSS |
| Backend | Node.js, Express, MongoDB, WebSockets (Yjs collab server) |

## Features

- **Local-first editing** — documents persist to IndexedDB and work fully offline
- **Real-time collaboration** — shared editing with live cursors and presence
- **Automatic sync** — reconnects and merges changes via Yjs CRDT (no manual conflict resolution)
- **Version history** — named snapshots with restore
- **Auth & sharing** — JWT auth with owner / editor / viewer roles

## Project structure

```
.
├── frontend/          # Next.js app (Vercel)
├── backend/           # Express API + WebSocket server (Render)
└── docker-compose.yml # Optional local Postgres (not used by the app today)
```

See also:

- [`frontend/README.md`](frontend/README.md) — frontend pages, offline behavior, API contract
- [`backend/README.md`](backend/README.md) — backend routes, WebSocket protocol, project layout

## Quick start (local)

### Prerequisites

- Node.js 18+
- MongoDB (local `mongod` or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # set MONGODB_URI and JWT_SECRET
npm run dev            # http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev            # http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000), sign up, and create a document.

## Environment variables

Keep frontend and backend URLs in sync. **Do not hardcode production URLs in source** — use env vars on each platform.

### Frontend (`frontend/.env.local` or Vercel)

| Variable | Local | Production example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api` | `https://your-backend.onrender.com/api` |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:4000/collab` | `wss://your-backend.onrender.com/collab` |

Notes:

- If `NEXT_PUBLIC_WS_URL` is omitted, it is derived from `NEXT_PUBLIC_API_URL` (`https` → `wss`, `http` → `ws`).
- On HTTPS pages, `ws://` is automatically upgraded to `wss://` to avoid mixed-content errors.

### Backend (`backend/.env` or Render)

| Variable | Description |
|---|---|
| `PORT` | Server port (default `4000`) |
| `CLIENT_ORIGIN` | Allowed browser origin(s), comma-separated. Use `*` to allow all. |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing auth tokens |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |

`.vercel.app` subdomains are allowed automatically for preview deployments.

## Deployment

Typical setup:

| Service | Hosts | Env to set |
|---|---|---|
| **Frontend** | [Vercel](https://vercel.com) | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL` |
| **Backend** | [Render](https://render.com) | `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` |
| **Database** | MongoDB Atlas | connection string in `MONGODB_URI` |

### Checklist

1. Deploy the backend and confirm `GET /api/health` returns `{ "ok": true }`.
2. Set Vercel env vars pointing at the Render backend:
   - `NEXT_PUBLIC_API_URL=https://<backend-host>/api`
   - `NEXT_PUBLIC_WS_URL=wss://<backend-host>/collab` (**must use `wss://` in production**)
3. Set Render `CLIENT_ORIGIN` to your Vercel URL (or `*` during testing).
4. Redeploy the frontend after changing env vars so Next.js picks them up at build time.

## Scripts

**Frontend** (`frontend/`)

```bash
npm run dev      # development server
npm run build    # production build
npm run start    # serve production build
```

**Backend** (`backend/`)

```bash
npm run dev        # ts-node-dev with hot reload
npm run build      # compile TypeScript to dist/
npm run start      # run compiled server
npm run typecheck  # type check only
```

## API overview

**REST** — base path `/api`, JWT via `Authorization: Bearer <token>`

```
POST   /auth/signup | /auth/login
GET    /auth/me
GET    /documents
POST   /documents
GET    /documents/:id
PATCH  /documents/:id
DELETE /documents/:id
POST   /documents/:id/collaborators
GET    /documents/:id/versions
POST   /documents/:id/versions
GET    /documents/:id/versions/:versionId
POST   /documents/:id/versions/:versionId/restore
GET    /health
```

**WebSocket** — real-time document sync

```
wss://<backend-host>/collab/:docId?token=<jwt>
```

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| CORS errors in browser | Backend `CLIENT_ORIGIN` mismatch | Set `CLIENT_ORIGIN` to your frontend URL on Render |
| `Mixed Content` / WebSocket blocked | Frontend using `ws://` on an HTTPS page | Set `NEXT_PUBLIC_WS_URL=wss://...` on Vercel and redeploy |
| API calls hit localhost in production | Env vars missing at build time | Add `NEXT_PUBLIC_*` vars in Vercel and trigger a new deploy |
| Collab not syncing | WS URL or token issue | Confirm `wss://` URL, open doc while logged in, check backend logs |

## License

Private — assignment project.
