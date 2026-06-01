# StaffClock Deployment Guide

Deploy StaffClock for free using **Neon** (database), **Render** (backend), and **Cloudflare Pages** (frontend).

**Total cost:** $0/month
**Total time:** ~15 minutes
**Result:** A live full-stack app with HTTPS, custom domain support, and auto-deploy on git push.

---

## Architecture

```
┌─────────────────────────────┐
│   Cloudflare Pages (CDN)    │  ← React SPA (global edge, 0ms cold start)
│   staffclock.pages.dev      │
└──────────┬──────────────────┘
           │ HTTPS API calls
           ▼
┌─────────────────────────────┐
│   Render (Free Web Service) │  ← Express API (auto-deploy on git push)
│   staffclock.onrender.com   │
└──────────┬──────────────────┘
           │ SSL connection
           ▼
┌─────────────────────────────┐
│   Neon (Free Tier)          │  ← PostgreSQL (serverless, 0.5 GB, no expiry)
│   ep-xxx.us-east-2.neon.tech│
└─────────────────────────────┘
```

---

## Prerequisites

- A GitHub account (for all three services)
- The StaffClock backend and frontend code pushed to **two separate GitHub repos**
  - e.g. `github.com/you/staffclock-backend`
  - e.g. `github.com/you/staffclock-frontend`

---

## Step 1: Database — Neon (2 minutes)

### 1.1 Create Account
1. Go to **https://neon.tech** and sign up with GitHub
2. Click **"New Project"**
3. Name: `staffclock`
4. Region: Pick the closest to your users (e.g. `US East` for Africa/Europe)
5. Click **Create Project**

### 1.2 Copy Connection String
1. On the project dashboard, find the **Connection Details** panel
2. Change the connection type dropdown to **"Pooled connection"** (important!)
3. Copy the full connection string — it looks like:
   ```
   postgresql://neondb_owner:AbCdEf123@ep-cool-name-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **Save this string** — you'll paste it into Render as `DATABASE_URL`

### 1.3 Why Neon (not Render Postgres)?
- Free: 0.5 GB storage, no expiration
- Render's free Postgres expires after **30 days** and gets deleted
- Built-in connection pooling (the `-pooler` URL)
- SSL by default
- Scales to zero after 5 min idle, wakes in ~500ms

---

## Step 2: Backend — Render (5 minutes)

### 2.1 Create Account
1. Go to **https://render.com** and sign up with GitHub
2. No credit card required

### 2.2 Option A — One-Click Deploy via `render.yaml` (Recommended)

The backend repo already includes a `render.yaml` file. To use it:

1. In the Render Dashboard, click **New → Blueprint**
2. Connect your `staffclock-backend` repo
3. Render detects `render.yaml` and shows the service definition
4. Click **Apply**
5. Fill in the required env vars when prompted (Render shows you exactly which ones)
6. Click **Create Resources**

Skip to Step 2.5.

### 2.2 Option B — Manual Setup (if you prefer the UI)

1. In the Render Dashboard, click **New → Web Service**
2. Connect your `staffclock-backend` repo
3. Configure:

   | Setting | Value |
   |---------|-------|
   | Name | `staffclock` |
   | Region | Closest to your users |
   | Branch | `main` |
   | Runtime | `Node` (auto-detected from `.nvmrc` → Node 22) |
   | Build Command | `npm install` |
   | Start Command | `npm run db:setup && npm start` *(for first deploy only)* |
   | Plan | `Free` |

### 2.3 Set Environment Variables

In **Environment → Add Environment Variable**, add each of these:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | *(paste your Neon pooled connection string from Step 1.2)* |
| `JWT_SECRET` | *(generate one — see below)* |
| `CORS_ORIGIN` | `*` *(update this after frontend deploys)* |
| `APP_URL` | *(leave blank for now, update after deploy)* |
| `FRONTEND_URL` | *(leave blank for now, update after deploy)* |
| `BCRYPT_ROUNDS` | `10` |

**Generate a JWT secret** — run this locally:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 2.4 Deploy
1. Click **Create Web Service**
2. Render starts building. The first build takes 3-5 minutes (slower than subsequent ones)
3. Once deployed, you'll get a URL like `https://staffclock.onrender.com`
4. Test it: visit `https://staffclock.onrender.com/health` — you should see:
   ```json
   { "status": "ok", "environment": "production", ... }
   ```
5. Visit `https://staffclock.onrender.com/api/docs` for the Swagger UI

### 2.5 After First Successful Deploy

The `db:setup` command runs migrations + seeds on first deploy. After it succeeds:

1. Go to **Settings → Start Command**
2. Change it to just: `npm start`
3. Click **Save Changes** (Render will redeploy automatically)

This prevents re-seeding on every deploy.

### 2.6 Render Free Tier Notes
- **750 hours/month** free compute (enough for one always-running service)
- **512 MB RAM, 0.1 CPU** — fine for low-to-medium traffic APIs
- **Sleeps after 15 minutes of inactivity** — first request takes 30-60s to wake
- **Solution**: Set up keep-alive in Step 5 to minimize this
- Auto-deploys on every push to your linked branch

---

## Step 3: Frontend — Cloudflare Pages (3 minutes)

### 3.1 Create Account
1. Go to **https://dash.cloudflare.com** and sign up
2. In the sidebar, click **Workers & Pages → Pages**

### 3.2 Connect GitHub
1. Click **Connect to Git**
2. Select your `staffclock-frontend` repo
3. Select the `main` branch

### 3.3 Configure Build

| Setting | Value |
|---------|-------|
| Framework preset | `None` (or `Vite` if listed) |
| Build command | `npm run build` |
| Build output directory | `dist` |

### 3.4 Set Environment Variable

Click **Environment variables → Add variable**:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://staffclock.onrender.com/api` |

Replace with your actual Render app URL from Step 2.4.

### 3.5 Deploy
1. Click **Save and Deploy**
2. Wait ~1 minute for the build
3. Your app is live at `https://staffclock-frontend.pages.dev` (or similar)

### 3.6 Why Cloudflare Pages?
- Unlimited bandwidth (no egress charges ever)
- Commercial use allowed (unlike Vercel's free tier)
- Global CDN — your React app loads instantly worldwide
- The `_redirects` file in `public/` handles SPA routing automatically
- Auto-deploy on git push

---

## Step 4: Connect Everything (2 minutes)

### 4.1 Update Backend Env Vars on Render
Now that the frontend URL exists, go to your Render service → **Environment**:

| Variable | New Value |
|----------|-----------|
| `CORS_ORIGIN` | `https://staffclock-frontend.pages.dev` *(your Cloudflare URL, no trailing slash)* |
| `APP_URL` | `https://staffclock.onrender.com` *(your Render URL)* |
| `FRONTEND_URL` | `https://staffclock-frontend.pages.dev` *(needed for email verify links)* |

Click **Save Changes** — Render redeploys automatically (~2 min).

### 4.2 Test the Full Stack
1. Open your Cloudflare Pages URL in a browser
2. Log in with seeded credentials:

| Email | Password | Role |
|-------|----------|------|
| `ceo@staffclock.com` | `Password123` | CEO |
| `admin@staffclock.com` | `Password123` | Admin |
| `it.manager@staffclock.com` | `Password123` | Staff Manager |
| `security1@staffclock.com` | `Password123` | Security |
| `developer1@staffclock.com` | `Password123` | Staff |

3. If login works, you're done!

---

## Step 5: Keep-Alive (Recommended, 2 minutes)

Render's free tier sleeps after 15 min inactivity. Cold start = 30-60s. To keep it warm:

### Option A: UptimeRobot (Easiest)
1. Go to **https://uptimerobot.com** and sign up (free)
2. Add a new monitor:
   - Type: **HTTP(s)**
   - URL: `https://staffclock.onrender.com/health`
   - Interval: **5 minutes**
3. Done — your backend stays warm

### Option B: GitHub Actions (Already Included)
The backend repo includes `.github/workflows/keep-alive.yml`. To activate it:
1. Go to your GitHub repo → **Settings → Secrets and variables → Actions**
2. Add a secret:
   - Name: `BACKEND_HEALTH_URL`
   - Value: `https://staffclock.onrender.com/health`
3. The workflow pings every 10 min during business hours, every 30 min otherwise

**Note**: Both keep-alive methods use the free 750-hour compute quota. If your service runs 24/7 it'll use ~720 hrs/mo — within the free limit.

---

## Custom Domain (Optional)

### Frontend (Cloudflare Pages)
1. In Cloudflare Pages → **Custom domains → Set up a custom domain**
2. Enter `app.staffclock.rw` (or your domain)
3. Add the CNAME record as instructed
4. SSL is automatic

### Backend (Render)
1. In Render → **Settings → Custom Domains → Add Custom Domain**
2. Enter `api.staffclock.rw`
3. Add the CNAME record `api.staffclock.rw → staffclock.onrender.com` in your DNS provider
4. Render auto-issues a Let's Encrypt cert (~1 min)
5. Update `CORS_ORIGIN` to `https://app.staffclock.rw`
6. Update `FRONTEND_URL` to `https://app.staffclock.rw`
7. Update frontend's `VITE_API_URL` to `https://api.staffclock.rw/api`

---

## Troubleshooting

### "Invalid credentials" on login
The database may not have been seeded. Check Render's **Logs** tab. If migrations didn't run:
1. **Settings → Start Command** → change to `npm run db:seed && npm start`
2. Wait for redeploy
3. Change back to `npm start`

### CORS errors in browser console
- Check that `CORS_ORIGIN` on Render matches your frontend URL **exactly** (no trailing slash)
- Make sure it's `https://`, not `http://`

### "Database connection failed" in Render logs
- Verify `DATABASE_URL` is the **pooled** Neon URL (contains `-pooler` in hostname)
- Make sure the URL ends with `?sslmode=require`
- Check Neon dashboard to confirm the project isn't suspended

### Frontend loads but API calls fail
- Open DevTools → Network tab → check the API request URL
- It should be `https://staffclock.onrender.com/api/auth/login`, not `http://localhost:3000/api/...`
- If `VITE_API_URL` was changed after the first build, trigger a fresh deploy on Cloudflare Pages

### Verification email link doesn't open the frontend page
- Make sure `FRONTEND_URL` env var is set on Render to your Cloudflare URL (not Render's URL)
- Email links use `${FRONTEND_URL}/verify-account?token=...` — they must point to the React app

### Cold start timeout on first request
First request after 15 min idle takes 30-60s on Render free tier. This is by design. Mitigations:
- Set up the keep-alive from Step 5
- Upgrade to Render Starter ($7/mo) for no cold starts

### Build fails: "Cannot find module"
- Confirm `package.json` has all required deps in `dependencies` (not `devDependencies`)
- Render only installs `dependencies` in production builds

---

## Free Tier Limits Summary

| Service | Limit | Enough? |
|---------|-------|---------|
| **Neon** | 0.5 GB storage, 100 CU-hours/mo, no expiry | Yes — 50 users won't exceed this |
| **Render** | 512 MB RAM, 0.1 CPU, 750 hrs/mo, 100 GB egress | Yes — fine for API workloads |
| **Cloudflare Pages** | Unlimited bandwidth, 500 builds/mo | Yes — only rebuilds on git push |

### When to upgrade
- **No cold starts**: Render Starter → $7/mo per service
- **>0.5 GB database**: Neon Launch → $19/mo
- **Email delivery**: Add SMTP (Resend free tier 100/day, or Brevo 300/day)

---

## Environment Variables Reference

### Backend (Render)

| Variable | Required | Example |
|----------|----------|---------|
| `NODE_ENV` | Yes | `production` |
| `DATABASE_URL` | Yes | `postgresql://user:pass@ep-xxx-pooler.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Yes | `a1b2c3d4...` (64+ chars) |
| `CORS_ORIGIN` | Yes | `https://staffclock-frontend.pages.dev` |
| `APP_URL` | Yes | `https://staffclock.onrender.com` |
| `FRONTEND_URL` | Yes | `https://staffclock-frontend.pages.dev` |
| `BCRYPT_ROUNDS` | No | `10` |
| `SMTP_HOST` | No | `smtp.resend.com` |
| `SMTP_PORT` | No | `587` |
| `SMTP_USER` | No | `resend` |
| `SMTP_PASS` | No | `re_xxxx` |
| `SMTP_FROM` | No | `noreply@staffclock.rw` |

**Note**: Render automatically sets `PORT` to `10000`. The app reads from `process.env.PORT`, so you don't need to set it manually.

### Frontend (Cloudflare Pages)

| Variable | Required | Example |
|----------|----------|---------|
| `VITE_API_URL` | Yes | `https://staffclock.onrender.com/api` |
