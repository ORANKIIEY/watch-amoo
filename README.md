# watchamoo

Kids entertainment in **Sepedi**, **Sesotho**, and **Setswana**, plus an AI Discovery Assistant.

```
watch-amoo/
├── frontend/   # Next.js UI (port 3000) — rewrites /api/* → backend
└── backend/    # Express API + SQLite (port 4000)
```

## Setup

```bash
npm install
cp backend/.env.example backend/.env
# Edit backend/.env:
#   DATABASE_URL="file:../data/watchamoo.db"
#   RESEND_API_KEY=...   (or SMTP_*)
npm run db:setup        # migrate + seed SQLite → backend/data/watchamoo.db
```

## Run

```bash
npm run dev
```

Opens **http://localhost:3000** (UI) and **http://localhost:4000** (API).  
Next rewrites `/api/*` to the Express backend. Auth uses an HttpOnly `watchamoo_session` cookie.

### Env vars (`backend/.env`)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | SQLite path, e.g. `file:../data/watchamoo.db` (relative to `prisma/`) |
| `PORT` | Express port (default `4000`) |
| `FRONTEND_ORIGIN` | CORS origin (default `http://localhost:3000`) |
| `RESEND_API_KEY` + `EMAIL_FROM` | Email OTP (or use SMTP_*) |
| `EMAIL_DEV_LOG=true` | Local only: print OTP codes to the backend console |

`*.db` files are gitignored. Schema + migrations live under `backend/prisma/`.

## Phase 1 (done)

- SQLite via Prisma (`users`, `sessions`, `otp_codes`, `videos`, `discovery_logs`, `support_tickets`)
- Server-generated OTPs (hashed), bcrypt passwords, HttpOnly sessions
- Rate-limited send-code paths; no email-existence leak on password reset
- Frontend auth/support/discovery logging talk to Express — not localStorage secrets
