# StaffClock Frontend → Backend Integration

## Overview

This package contains the files needed to connect the StaffClock React frontend to the Express backend API. The integration replaces the seed-data/localStorage system with real HTTP calls to the backend.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  React Frontend (Vite, port 5173)                   │
│                                                     │
│  Pages → useAuth() → Services → fetch(/api/...)     │
│                                    │                 │
│                         Vite proxy │ (dev only)      │
│                                    ▼                 │
│  ┌─────────────────────────────────────────────┐    │
│  │  Express Backend (port 3000)                │    │
│  │  /api/auth, /api/users, /api/attendance...  │    │
│  │  JWT auth → Sequelize → PostgreSQL          │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

## Files to Copy

Copy these into your existing frontend project, **replacing** the originals:

### New files (add these)
```
src/services/
  ├── api.js                  # Base fetch client with JWT handling
  ├── auth.service.js         # Login, signup, verify, reset
  ├── attendance.service.js   # Clock in/out, breaks, status
  ├── leave.service.js        # Leave CRUD, approve/reject
  ├── user.service.js         # User management (admin)
  ├── department.service.js   # Department CRUD
  ├── location.service.js     # Location CRUD
  ├── shift.service.js        # Shift scheduling
  ├── report.service.js       # Report export downloads
  └── index.js                # Barrel export

.env                          # VITE_API_URL config
```

### Modified files (replace these)
```
src/context/AuthContext.jsx   # Core rewrite — API calls instead of seed data
src/config/seedUsers.js       # Compatibility bridge (re-exports helpers)
src/pages/LoginStaff.jsx      # async/await login
src/pages/LoginAdmin.jsx      # async/await login
src/pages/LoginSecurity.jsx   # async/await login
src/pages/LoginCEO.jsx        # async/await login
vite.config.js                # Added /api proxy to backend
```

## How It Works

### 1. API Client (`src/services/api.js`)

A thin fetch wrapper that:
- Reads the JWT from `localStorage` (`sc_token`)
- Attaches it as `Authorization: Bearer <token>`
- Parses JSON responses
- On 401, clears auth so the app redirects to login
- Provides `get`, `post`, `put`, `delete`, `download` helpers

### 2. Service Modules (`src/services/*.service.js`)

Each service maps to a backend route group:

| Service | Backend Routes | Purpose |
|---------|---------------|---------|
| `authService` | `/api/auth/*` | Login, signup, verify, password reset |
| `attendanceService` | `/api/attendance/*` | Clock in/out, breaks, history |
| `leaveService` | `/api/leaves/*` | Request, approve, reject leave |
| `userService` | `/api/users/*` | User CRUD (admin) |
| `departmentService` | `/api/departments/*` | Department CRUD |
| `locationService` | `/api/locations/*` | Location CRUD |
| `shiftService` | `/api/shifts/*` | Shift scheduling |
| `reportService` | `/api/reports/*` | CSV/Excel export downloads |

### 3. AuthContext (`src/context/AuthContext.jsx`)

The context was **completely rewritten** to:
- Call real backend APIs instead of mutating localStorage objects
- Store only the JWT token and user profile locally
- Load reference data (departments, locations, users) from the API after login
- Keep the **same interface** so existing pages don't need major changes

Key differences:
- `login()` is now **async** — calls `POST /api/auth/login`
- `clockIn()` / `clockOut()` call the attendance API
- `submitLeaveRequest()` calls `POST /api/leaves`
- `processLeaveRequest()` calls approve/reject endpoints
- `registerStaff()` calls `POST /api/users`
- Reference data refreshes automatically after mutations

### 4. Compatibility Bridge (`src/config/seedUsers.js`)

The original `seedUsers.js` was a large seed data file. The new version is a thin bridge that re-exports helper functions (`getFullName`, `isCEO`, etc.) so that existing component imports don't break. The actual seed data objects are exported as empty shells.

### 5. Vite Proxy (`vite.config.js`)

In development, Vite proxies `/api` requests to `http://localhost:3000` (the Express backend), so the frontend and backend run on different ports without CORS issues.

## Quick Start

### Prerequisites
- Backend running at `http://localhost:3000` (see backend README)
- PostgreSQL database migrated and seeded

### Steps

```bash
# 1. Start the backend
cd staffclock-backend
npm install
npm run db:migrate
npm run db:seed
npm run dev          # → http://localhost:3000

# 2. Start the frontend
cd staffclock-frontend
npm install
npm run dev          # → http://localhost:5173

# 3. Login with seeded credentials
#    Email: ceo@staffclock.com  Password: Password123
#    Email: admin@staffclock.com  Password: Password123
```

## What Pages Need Further Updates

Most pages will work with the new AuthContext, but some pages that directly access seed data will need adjustments:

### Works immediately
- All login pages (updated)
- Staff Clock (Clock.jsx)
- Staff Dashboard (Dashboard.jsx)
- Request Leave (RequestLeave.jsx)

### Needs minor async adjustments
- **Admin ClockActivities** — currently reads `clockActivities` from context. Should call `attendanceService.getAll()` directly for real data, and use `reportService` for exports.
- **Admin ManageStaff** — reads `allUsers` from context (works for admin/CEO since we load users).
- **Admin RegisterStaff** — `registerStaff()` is now async, form handlers need `await`.
- **Manager LeaveRequests** — `processLeaveRequest()` is now async.
- **CEO Dashboard** — reads computed stats from context data.
- **Security Dashboard** — reads filtered users from context.

### Pattern for async handlers

The original pages used synchronous try/catch:
```jsx
// OLD (doesn't catch async errors)
const onSubmit = (e) => {
  e.preventDefault()
  try { login({ email, password }) }
  catch (err) { setError(err.message) }
}
```

Update to:
```jsx
// NEW
const onSubmit = async (e) => {
  e.preventDefault()
  try { await login({ email, password }) }
  catch (err) { setError(err.message) }
}
```

## API Endpoint Mapping

| Frontend Action | Backend Endpoint | Method |
|----------------|-----------------|--------|
| Login | `/api/auth/login` | POST |
| Logout | `/api/auth/logout` | POST |
| Get Profile | `/api/auth/me` | GET |
| Clock In | `/api/attendance/clock-in` | POST |
| Clock Out | `/api/attendance/clock-out` | POST |
| Get Clock Status | `/api/attendance/status` | GET |
| My Attendance | `/api/attendance/my` | GET |
| Submit Leave | `/api/leaves` | POST |
| My Leaves | `/api/leaves/my` | GET |
| Approve Leave | `/api/leaves/:id/approve` | POST |
| Reject Leave | `/api/leaves/:id/reject` | POST |
| Cancel Leave | `/api/leaves/:id/cancel` | POST |
| List Users | `/api/users` | GET |
| Create User | `/api/users` | POST |
| Update User | `/api/users/:id` | PUT |
| List Departments | `/api/departments` | GET |
| List Locations | `/api/locations` | GET |
| Export Attendance | `/api/reports/attendance` | GET |
| Export Leaves | `/api/reports/leaves` | GET |

## Production Deployment

For production, set `VITE_API_URL` to the full backend URL:

```env
VITE_API_URL=https://api.staffclock.com/api
```

Or serve frontend and backend from the same origin (e.g., Express serves the built React app as static files).
