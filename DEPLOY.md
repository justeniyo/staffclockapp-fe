# StaffClock Deployment Guide

Deploy StaffClock for free using Neon (database), Koyeb (backend), and Cloudflare Pages (frontend).

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
│   Koyeb (Starter Plan)      │  ← Express API (auto-deploy, ~200ms wake)
│   staffclock-api.koyeb.app  │
└──────────┬──────────────────┘
           │ SSL connection
           ▼
┌─────────────────────────────┐
│   Neon (Free Tier)          │  ← PostgreSQL (serverless, 0.5 GB, auto-suspend)
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
4. **Save this string** — you'll paste it into Koyeb as `DATABASE_URL`

### 1.3 Why Neon?
- Free: 0.5 GB storage, 100 compute-hours/month (enough for 24/7 low-traffic)
- No expiration (unlike Render's 30-day DB deletion)
- Built-in connection pooling (the `-pooler` URL)
- SSL by default
- Scales to zero after 5 min idle, wakes in ~500ms

---

## Step 2: Backend — Koyeb (5 minutes)

### 2.1 Create Account
1. Go to **https://app.koyeb.com** and sign up with GitHub
2. No credit card required

### 2.2 Deploy the Backend
1. Click **"Create Web Service"**
2. Select **GitHub** as the deployment source
3. Authorize Koyeb to access your `staffclock-backend` repo
4. Select the repo and the `main` branch

### 2.3 Configure Build
| Setting | Value |
|---------|-------|
| Builder | **Buildpack** (auto-detected Node.js) |
| Build command | `npm install` |
| Run command | `npm run db:setup && npm start` |
| Port | `3000` |

### 2.4 Set Environment Variables

Click **"Environment Variables"** and add each of these:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | *(paste your Neon pooled connection string from Step 1.2)* |
| `JWT_SECRET` | *(generate one — see below)* |
| `CORS_ORIGIN` | `*` *(we'll update this after frontend deploys)* |
| `APP_URL` | *(leave blank for now, update after deploy)* |
| `BCRYPT_ROUNDS` | `10` |

**Generate a JWT secret** — run this in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Or just type 64 random characters.

### 2.5 Deploy
1. Click **"Deploy"**
2. Wait 2–3 minutes for the build
3. Once deployed, you'll get a URL like `https://staffclock-api-xxxx.koyeb.app`
4. Test it: visit `https://staffclock-api-xxxx.koyeb.app/health` — you should see:
   ```json
   { "status": "ok", "environment": "production", ... }
   ```
5. Visit `https://staffclock-api-xxxx.koyeb.app/api/docs` to see the Swagger UI

### 2.6 After First Successful Deploy
The `db:setup` command runs migrations + seeds on first deploy. After it succeeds:
1. Go to **Settings → Run command**
2. Change it to just: `npm start`
3. Redeploy

This prevents re-seeding on every deploy.

### 2.7 Why Koyeb?
- Free: 512 MB RAM, 0.1 vCPU, 100 GB egress, 5 custom domains
- Free managed Postgres (0.25 vCPU, 1 GB) — but we use Neon for reliability
- Git-push auto-deploy
- ~200ms Light Sleep wake (users won't notice)
- No database expiration clock

---

## Step 3: Frontend — Cloudflare Pages (3 minutes)

### 3.1 Create Account
1. Go to **https://dash.cloudflare.com** and sign up
2. In the sidebar, click **"Workers & Pages"** → **"Pages"**

### 3.2 Connect GitHub
1. Click **"Connect to Git"**
2. Select your `staffclock-frontend` repo
3. Select the `main` branch

### 3.3 Configure Build

| Setting | Value |
|---------|-------|
| Framework preset | `None` (or `Vite` if listed) |
| Build command | `npm run build` |
| Build output directory | `dist` |

### 3.4 Set Environment Variable

Click **"Environment variables"** and add:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://staffclock-api-xxxx.koyeb.app/api` |

Replace `xxxx` with your actual Koyeb app subdomain from Step 2.5.

### 3.5 Deploy
1. Click **"Save and Deploy"**
2. Wait ~1 minute for the build
3. Your app is live at `https://staffclock-frontend.pages.dev` (or similar)

### 3.6 Why Cloudflare Pages?
- Unlimited bandwidth (no egress charges ever)
- Commercial use allowed (unlike Vercel's free tier)
- Global CDN — your React app loads instantly worldwide
- The `_redirects` file handles SPA routing automatically
- Auto-deploy on git push

---

## Step 4: Connect Everything (2 minutes)

### 4.1 Update CORS on Koyeb
Now that the frontend URL exists:
1. Go to your Koyeb service → **Settings → Environment Variables**
2. Change `CORS_ORIGIN` from `*` to your Cloudflare Pages URL:
   ```
   https://staffclock-frontend.pages.dev
   ```
3. Set `APP_URL` to the same Koyeb URL:
   ```
   https://staffclock-api-xxxx.koyeb.app
   ```
4. Redeploy

### 4.2 Test the Full Stack
1. Open your Cloudflare Pages URL in a browser
2. Log in with seeded credentials:

| Email | Password | Role |
|-------|----------|------|
| `ceo@staffclock.com` | `Password123` | CEO |
| `admin@staffclock.com` | `Password123` | Admin |
| `security1@staffclock.com` | `Password123` | Security |
| `developer1@staffclock.com` | `Password123` | Staff |

3. If login works, you're done!

---

## Step 5: Keep-Alive (Optional, 2 minutes)

Koyeb's free tier scales to zero after idle. The first request takes ~200ms (Light Sleep) or 1–5s (Deep Sleep). To keep it fast:

### Option A: UptimeRobot (Easiest)
1. Go to **https://uptimerobot.com** and sign up (free)
2. Add a new monitor:
   - Type: **HTTP(s)**
   - URL: `https://staffclock-api-xxxx.koyeb.app/health`
   - Interval: **5 minutes**
3. Done — your backend will stay warm

### Option B: GitHub Actions (Already Included)
The backend repo includes `.github/workflows/keep-alive.yml`. To activate it:
1. Go to your GitHub repo → **Settings → Secrets and variables → Actions**
2. Add a secret:
   - Name: `BACKEND_HEALTH_URL`
   - Value: `https://staffclock-api-xxxx.koyeb.app/health`
3. The workflow pings every 10 min during business hours, every 30 min otherwise

---

## Custom Domain (Optional)

### Frontend (Cloudflare Pages)
1. In Cloudflare Pages → **Custom domains** → **Set up a custom domain**
2. Enter `app.staffclock.rw` (or your domain)
3. Add the CNAME record as instructed
4. SSL is automatic

### Backend (Koyeb)
1. In Koyeb → **Settings → Custom domains**
2. Enter `api.staffclock.rw`
3. Add the CNAME record as instructed
4. Update `CORS_ORIGIN` to `https://app.staffclock.rw`
5. Update frontend's `VITE_API_URL` to `https://api.staffclock.rw/api`

---

## Troubleshooting

### "Invalid credentials" on login
The database may not have been seeded. SSH into Koyeb or check the deploy logs. Re-run with:
```
Run command: npm run db:seed && npm start
```
Then change back to `npm start` after.

### CORS errors in browser console
- Check that `CORS_ORIGIN` on Koyeb matches your frontend URL exactly (no trailing slash)
- Make sure it's `https://`, not `http://`

### "Database connection failed" in Koyeb logs
- Verify `DATABASE_URL` is the **pooled** Neon URL (contains `-pooler` in hostname)
- Make sure the URL ends with `?sslmode=require`
- Check Neon dashboard to confirm the project isn't suspended

### Frontend loads but API calls fail
- Open browser DevTools → Network tab → check the API request URL
- It should be `https://staffclock-api-xxxx.koyeb.app/api/auth/login`, not `http://localhost:3000/api/...`
- Rebuild the frontend on Cloudflare Pages if `VITE_API_URL` was set after the first build

### Cold start timeout
First request after idle may take 1–5 seconds. This is normal on free tier. Set up the keep-alive from Step 5 to minimize this.

---

## Free Tier Limits Summary

| Service | Limit | Enough? |
|---------|-------|---------|
| **Neon** | 0.5 GB storage, 100 CU-hours/mo | Yes — 50 users won't exceed this |
| **Koyeb** | 512 MB RAM, 0.1 vCPU, 100 GB egress | Yes — API traffic is lightweight |
| **Cloudflare Pages** | Unlimited bandwidth, 500 builds/mo | Yes — only rebuilds on git push |

### When to upgrade
- If you need always-on (no cold starts): Koyeb Starter paid → $7/mo
- If you exceed 0.5 GB database: Neon Launch → $19/mo
- If you need email verification working: Add SMTP (Resend free tier, or Brevo 300 emails/day free)

---

## Environment Variables Reference

### Backend (Koyeb)

| Variable | Required | Example |
|----------|----------|---------|
| `NODE_ENV` | Yes | `production` |
| `DATABASE_URL` | Yes | `postgresql://user:pass@ep-xxx-pooler.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Yes | `a1b2c3d4...` (64+ chars) |
| `CORS_ORIGIN` | Yes | `https://staffclock-frontend.pages.dev` |
| `APP_URL` | No | `https://staffclock-api-xxxx.koyeb.app` |
| `BCRYPT_ROUNDS` | No | `10` (lower = faster login, less secure) |
| `SMTP_HOST` | No | `smtp.resend.com` |
| `SMTP_PORT` | No | `587` |
| `SMTP_USER` | No | `resend` |
| `SMTP_PASS` | No | `re_xxxx` |
| `SMTP_FROM` | No | `noreply@staffclock.rw` |

### Frontend (Cloudflare Pages)

| Variable | Required | Example |
|----------|----------|---------|
| `VITE_API_URL` | Yes | `https://staffclock-api-xxxx.koyeb.app/api` |
