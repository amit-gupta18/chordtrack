# Chordtrack

Monorepo for the Guitar Practice AI app.

## Structure

- `client/` — React + Vite frontend (Zustand + TanStack Query)
- `server/` — Express + MongoDB backend (JWT auth, Socket.IO audio)

## Setup

1. Copy env files:
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

2. Set `MONGODB_URI` and `JWT_SECRET` in `server/.env`

3. Install and run:
   ```bash
   npm install
   npm run dev
   ```

Client: http://localhost:5173  
Server: http://localhost:3001

API calls are proxied through the Vite dev server (`/api` → server) so auth cookies stay same-origin. The login response also returns a JWT that the client sends as `Authorization: Bearer` on subsequent requests.

## Env vars

### Server (`server/.env`)
- `MONGODB_URI` — required
- `JWT_SECRET` — required
- `OPENAI_API_KEY` — optional (AI coaching)
- `PORT`, `JWT_EXPIRES_IN`, `COOKIE_SECURE`, `OPENAI_MODEL`, `OPENAI_INSIGHTS_MODEL`

### Client (`client/.env`)
- `VITE_API_URL` — default `/api` (proxied to server in dev)
- `VITE_WS_URL` — optional; defaults to same origin (proxied `/socket.io`)
