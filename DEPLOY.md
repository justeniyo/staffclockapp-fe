# StaffClock Deployment

Free-tier stack: **Render** (backend), **Neon** (PostgreSQL), **Cloudflare Pages** (frontend).

Total cost: $0/mo. Time to deploy: ~15 minutes.

## Architecture

```
Cloudflare Pages (CDN, SPA)
        ↓ HTTPS
Render (free Web Service, Node 22)
        ↓ SSL
Neon (free PostgreSQL, 0.5 GB)
```

## Prerequisites

- GitHub account
- Backend and frontend each in their own GitHub repo

## 1 — Database (Neon, ~2 min)

1. Sign up at [neon.tech](https://neon.tech) with GitHub.
2. **New Project** → name `staffclock` → pick the region closest to your users.
3. On the project dashboard, switch the connection dropdown to **Pooled connection** (this matters).
4. Copy the full connection string — it looks like:
   ```
   postgresql://owner:password@ep-name-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```

Why Neon and not Render's free Postgres: Render's free DB is deleted after 30 days. Neon has no expiry on the free tier.

## 2 — Backend (Render, ~5 min)

### Option A — Blueprint (recommended)

The backend repo includes `render.yaml`. In the Render dashboard:

1. **New → Blueprint** → connect the backend repo.
2. Render detects `render.yaml` and prompts for the secret env vars.
3. Click **Apply**.

### Option B — Manual

1. **New → Web Service** → connect the backend repo.
2. Settings:
   - Region: closest to your users
   - Branch: `main`
   - Runtime: Node (auto-detected from `.nvmrc`)
   - Build command: `npm install`
   - Start command: `npm run db:setup && npm start` (first deploy only — revert to `npm start` after)
   - Plan: Free

### Environment variables

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | the Neon pooled URL from step 1 |
| `JWT_SECRET` | generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `CORS_ORIGIN` | `*` (update after frontend deploys) |
| `APP_URL` | leave blank for now |
| `FRONTEND_URL` | leave blank for now |
| `BCRYPT_ROUNDS` | `10` |

### After first deploy

1. Visit `https://staffclock.onrender.com/health` — expect `{ "status": "ok", "checks": { "database": "ok" } }`.
2. Visit `/api/docs` for the Swagger UI.
3. In Render: **Settings → Start Command** → change to `npm start` (don't re-seed on every deploy).

### Render free-tier notes

- 750 compute hours/month
- 512 MB RAM, 0.1 CPU
- Sleeps after 15 min idle. Cold start: 30–60 seconds.
- Auto-deploys on push to the linked branch.

## 3 — Frontend (Cloudflare Pages, ~3 min)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Pages → Connect to Git**.
2. Select the frontend repo, branch `main`.
3. Build settings:
   - Framework preset: None (or Vite)
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Environment variable: `VITE_API_URL = https://staffclock.onrender.com/api` (use your Render URL).
5. **Save and Deploy**.

The Vite build copies `index.html` → `404.html` so unmatched SPA routes still serve the React app. No `_redirects` file is needed.

## 4 — Connect the two (~2 min)

In Render → **Environment** for the backend service, update:

| Variable | Value |
|---|---|
| `CORS_ORIGIN` | your Cloudflare URL (no trailing slash), e.g. `https://staffclock.pages.dev` |
| `APP_URL` | your Render URL, e.g. `https://staffclock.onrender.com` |
| `FRONTEND_URL` | same as `CORS_ORIGIN` — used in the welcome email |

Render redeploys automatically. Log into the Cloudflare URL with a seeded test account (see README).

## 5 — Keep the backend warm (recommended)

Render's free tier sleeps after 15 min of inactivity, so the first request after a pause is slow. Two options:

### UptimeRobot (no setup)

[uptimerobot.com](https://uptimerobot.com) → new HTTP(s) monitor → URL `https://your-app.onrender.com/health` → 5-minute interval.

### GitHub Actions (already included)

`.github/workflows/keep-alive.yml` pings `/health` on a schedule. To enable:

1. GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**.
2. Name: `BACKEND_HEALTH_URL`, value: `https://your-app.onrender.com/health`.

The workflow retries up to four times with 20-second gaps, so a slow Render cold start doesn't fail the job. A 503 response (DB temporarily unreachable) is treated as awake (a warning, not a failure).

## Custom domain (optional)

### Frontend
Cloudflare Pages → **Custom domains → Set up a custom domain**. Add the CNAME as instructed. SSL is automatic.

### Backend
Render → **Settings → Custom Domains**. Add `api.yourdomain.com`. Then add a CNAME `api.yourdomain.com → your-app.onrender.com` at your DNS provider. Update `CORS_ORIGIN`, `APP_URL`, `FRONTEND_URL`, and the frontend's `VITE_API_URL` to the new domains.
