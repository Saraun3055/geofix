# GeoFix Web Platform

Three-portal web platform sharing the **same Express + MongoDB backend** as the GeoFix mobile app: **Customer**, **Worker**, and **Admin** portals in one React codebase, gated by role after login.

## Stack

- React 19 + TypeScript, Vite 8
- React Router v6 (role-guarded `/customer/*`, `/worker/*`, `/admin/*`)
- TanStack Query (API data/caching) + Zustand (local UI state)
- Tailwind CSS v4 + shadcn-style Radix primitives, **heavily restyled**
- Express + MongoDB Atlas backend (`server/`), `@react-google-maps/api`, `recharts`

## Data sources

The app runs against one of two backends, resolved at build/runtime:

| Mode | Backend | When |
|---|---|---|
| `local-api` | Express + MongoDB Atlas (`server/`) | Default — `VITE_API_BASE_URL` points at your server |
| `demo` | localStorage sample data | When `VITE_DATA_MODE=demo` is set in `.env.local` |

No Firebase is used anywhere in this codebase.

## Try it now (demo mode)

To explore the full UI without a backend server, create `.env.local` with:

```
VITE_DATA_MODE=demo
```

Then run:

```bash
npm install
npm run dev
```

Open http://localhost:5173 (Vite prints the exact URL). The login page shows pre-built demo accounts you can enter with one click, or log in with the credentials below.

### Demo accounts

| Role | Name | Email | Password | What's in the portal |
|---|---|---|---|---|
| Customer | Aisha Patel | `customer@demo.geofix` | `demo1234` | 1 active request + history |
| Worker | Rajan Kumar | `worker@demo.geofix` | `demo1234` | Verified · online · incoming job waiting |
| Worker | Luca Bertoni | `worker2@demo.geofix` | `demo1234` | Awaiting ID verification |
| Admin | Admin User | `admin@geofix.app` | `admin1234` | Full operations access |

Demo data is localStorage-backed and resets via `localStorage.removeItem('geofix-demo-store')` or by opening the app fresh in an incognito window.

## Local API mode (real backend)

Set `.env.local` to point at the Express server, then run both the API and the frontend:

```bash
# Terminal 1 — backend
cd server
npm install
cp .env.example .env   # fill in MONGO_URI (MongoDB Atlas), JWT secrets
npm run seed           # seed the database with sample users
npm run dev

# Terminal 2 — frontend
npm run dev
```

`.env.local`:

```
VITE_API_BASE_URL=http://localhost:4000
```

Seeded accounts for `local-api` mode:

| Role | Email | Password |
|---|---|---|
| Admin | `ops@geofix.app` | `admin1234` |
| Customer | `customer.demo@geofix.app` | `customer1234` |
| Worker | `worker.demo@geofix.app` | `worker1234` |

## Data model

The Express backend stores `users`, `worker_profiles`, `service_requests`, `ratings`, plus admin-only collections:

```
admins/{uid}              role: "superadmin" | "support"
verification_queue/{uid}  govIdUrl, status pending|approved|rejected
disputes/{disputeId}      raisedBy customer|worker, status open|resolved
audit_logs/{logId}        actorId, actorRole, action, targetId
```

Worker geo data uses the `g: {geohash, geopoint}` shape (`geopoint` is `{latitude, longitude}`) so nearby-worker queries match the mobile flow.

## Core flows implemented

1. Customer creates a request (`searching`) → sees nearby workers **sorted by rating** with verified badge and distance.
2. Customer requests a worker → request moves to `pending_worker_response`.
3. Worker Accepts (`accepted`) or Rejects (worker added to `rejectedBy`, customer returns to the list minus that worker).
4. Accepted → **WhatsApp handoff** (`wa.me` link + Google Maps URL, with manual fallback).
5. Customer rates after completion (aggregate rolls into `worker_profiles.rating`).
6. Admin: live map + recharts analytics, verification queue, request table with per-request timeline, disputes, user suspension, read-only audit log.

## Design notes

- Warm terracotta/amber identity (not default shadcn slate/blue), Sora + Archivo + JetBrains Mono type.
- Each portal has its own visual scope: customer = warm parchment, worker = amber, admin = dense neutral "operations" with dark sidebar + monospace stats.
- Bespoke empty/loading/error states throughout; a stylized offline map replaces Google Maps when no key is set.
- Madurai is the launch city — copy, localities, and seeded coordinates are localized to Madurai.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc -b` typecheck + production build |
| `npm run lint` | Oxlint |
| `npm run preview` | Preview the production build |

## Out of scope (MVP)

In-app payments, in-app chat (WhatsApp handles comms), multi-language.