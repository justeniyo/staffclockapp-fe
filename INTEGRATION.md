# StaffClock Frontend → Backend Integration

React + Vite frontend wired to the Express + Sequelize backend.

## Architecture

```
React (Vite, :5173)
  Pages → useAuth() → src/services/* → fetch(/api/...)
                                          ↓ Vite dev proxy
Express (:3000)
  /api/* → JWT auth → Sequelize → PostgreSQL
```

In production the frontend is on Cloudflare Pages and `VITE_API_URL` points to the Render backend URL.

## Project Layout

```
src/
├── components/
│   ├── Layout/    Navbar, Sidebar, Layout shell
│   └── ui/        DataTable, StatCard, PageHeader, ConfirmModal, DownloadFilteredButton
├── config/        Helpers, role checks, seedUsers compatibility bridge
├── context/       AuthContext (real backend, JWT-based)
├── pages/         Login, VerifyAccount, Forgot/ResetPassword, dashboards, admin pages
├── router/        AppRouter, RequireAuth guard
├── services/      One service per backend route group
├── styles/        theme.css (Bootstrap + StaffClock overrides)
└── utils/         Data transforms (normalize, enrich)
```

## Services

| Service | Backend routes | Purpose |
|---|---|---|
| `authService` | `/api/auth/*` | Login, signup, OTP verification, OTP password reset |
| `attendanceService` | `/api/attendance/*` | Clock in/out, status, history |
| `leaveService` | `/api/leaves/*` | Request, approve, reject leave |
| `userService` | `/api/users/*` | User CRUD (admin) |
| `departmentService` | `/api/departments/*` | Department CRUD |
| `locationService` | `/api/locations/*` | Location CRUD |
| `shiftService` | `/api/shifts/*` | Shift scheduling |
| `reportService` | `/api/reports/*` | CSV / Excel / PDF exports |

All services use `src/services/api.js` — a fetch wrapper that:

- Reads the JWT from `localStorage.sc_token` and attaches `Authorization: Bearer <token>`.
- Translates server validator arrays into a single readable string.
- Falls back to plain-English messages for unstyled HTTP errors (401, 403, 500…).
- Catches network errors with "Can't reach the server. Please check your internet connection and try again."

## AuthContext

`src/context/AuthContext.jsx` is the single source of truth:

- `login()`, `logout()`, `clockIn/Out()`, `submitLeaveRequest()`, `processLeaveRequest()`, `registerStaff()`, `updateStaff()`, etc. — all async, all backed by real API calls.
- After login it loads departments, locations, all users (if privileged), leaves, and attendance, then exposes them through context.
- `loadAllData()` swallows non-auth errors silently (logs them to the console with a `[load] {label} failed` prefix so they're visible in DevTools) and re-throws 401s so the global handler clears the session.
- The `window.__sc_cache` object is populated for the legacy `seedUsers.js` bridge so any component still importing `getUserById` from `../../config/seedUsers` keeps working.

## Quick Start

```bash
# Backend
cd staffclock-backend
npm install
cp .env.example .env
createdb staffclock
npm run db:migrate && npm run db:seed
npm run dev     # → http://localhost:3000

# Frontend (separate terminal)
cd staffclock-frontend
npm install
npm run dev     # → http://localhost:5173
```

Seeded test accounts (all use password `Password123`):

- `ceo@mtn-company.rw` — CEO
- `admin@mtn-company.rw` — Admin
- `it.manager@mtn-company.rw` — Staff with manager rights
- `security1@mtn-company.rw` — Security
- `developer1@mtn-company.rw` — Staff

## Production

Set `VITE_API_URL` to your backend URL (with `/api` suffix):

```env
VITE_API_URL=https://your-app.onrender.com/api
```

See `DEPLOY.md` for the full Render + Neon + Cloudflare Pages walkthrough.

## Real-time Updates (Socket.IO)

Pages stay in sync without manual refresh. When the backend changes attendance, leave, or user state, connected clients are notified through Socket.IO.

### Setup

Add `socket.io-client` to your frontend dependencies:

```bash
npm install socket.io-client
```

That's it — `AuthContext` automatically opens a connection after login (using the same JWT as the REST API) and tears it down on logout.

### How it works

The backend assigns each socket to rooms based on the user:

- `user:{id}` — personal channel (the user's own tabs)
- `role:admin`, `role:ceo`, `role:admins` (combined) — role-wide
- `manager:{id}` — direct-report events for a manager
- `location:{id}` — security guards at a site

Server services emit events on state changes:

| Event | Goes to |
|---|---|
| `attendance:clock-in` / `clock-out` / `break-*` | user + admins + manager + location |
| `leave:created` | user + admins + manager |
| `leave:approved` / `rejected` | user + admins + manager |
| `user:updated` | user + admins |
| `user:deactivated` | the affected user (then their sockets are force-closed) |
| `shift:created` / `updated` / `cancelled` | assigned user + admins |

### Subscribing in a component

For most needs, AuthContext already refreshes data on these events automatically (with a 250ms debounce so a burst of events causes one refetch, not several). If you need finer-grained reactions (showing a toast, animating a row, playing a sound), use the `useSocketEvents` hook:

```jsx
import useSocketEvents from '../../hooks/useSocketEvents'
import { EVENTS } from '../../services/socket'

function ManagerLeaveRequests() {
  useSocketEvents({
    [EVENTS.LEAVE_CREATED]: (data) => {
      toast.info(`New leave request from ${data.leave.user.firstName}`)
    },
  }, [/* deps */])

  // ...
}
```

### Live status indicator

The navbar shows the current realtime connection state via `useSocketStatus()`:

- **Live** (green dot, pulsing) — socket connected, updates flowing
- **Connecting…** (amber) — handshake in progress or reconnecting
- **Offline** (red) — disconnected (the app still works, but page data won't auto-update)

The hook lives at `src/hooks/useSocketStatus.js` if you want to use it elsewhere.



### Async form handlers
All mutating context methods return promises. Wrap in `try`/`catch`:

```jsx
const onSubmit = async (e) => {
  e.preventDefault()
  setError('')
  try {
    await login({ email, password })
  } catch (err) {
    setError(err.message)
  }
}
```

### Filtered downloads
Any list page can offer a CSV export of the currently visible rows:

```jsx
import { DownloadFilteredButton } from '../../components/ui'

<DownloadFilteredButton
  rows={filteredRows}
  filename="staff-list"
  columns={[
    { key: 'staffName', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'department', label: 'Department' },
  ]}
/>
```

### Custom error messages
If you need to show a server-side error inline, use `err.message` — it's already a clean user-friendly string by the time the service layer rethrows it:

```jsx
try {
  await userService.update(id, payload)
} catch (err) {
  setError(err.message)   // "Phone number is invalid" or similar
}
```
