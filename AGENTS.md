# MediBook — AGENTS.md

Monorepo: `backend/` (Django 6.0) + `frontend/` (React 19 + Vite 8).

## Commands

```sh
# Frontend
cd frontend && npm run dev          # dev server (port 5173)
cd frontend && npm run build        # tsc --noEmit && vite build
cd frontend && npx vitest run       # single run
cd frontend && npm run lint:check   # oxlint
cd frontend && npm run fmt          # oxfmt (write)

# Backend
cd backend && python manage.py runserver
cd backend && pytest                 # TDD
```

## Architecture

**State boundary (critical)**
- `TanStack Query` = server cache (all API data). Never put server data in Zustand.
- `Zustand` = UI-only state (sidebar, modal toggles). No API calls here.
- `useAuthStore` in `shared/stores/authStore.ts` persists token to `localStorage`.

**Feature-based layout** — `features/<name>/pages/`, `features/<name>/components/`, `features/<name>/api/`
- No cross-feature imports. Shared code lives in `shared/`.
- Pages are `export default function PageName()` — lazy-loaded by router.

**Route `lazy` quirk (react-router v7)**
- Layout files (RootLayout, AuthLayout, DashboardLayout) use `export function Component()` — named export required by route-level `lazy`.
- Page components use `export default` — imported via React's `lazy()` and passed as `Component` on route objects.

**Route structure**
```
/               → RootLayout
  /login, /register  → AuthLayout
  /doctor/*          → DashboardLayout (sidebar)
  /patient/*         → DashboardLayout
  /admin             → DashboardLayout
```

## Frontend Stack

| Tool | Config | Notes |
|------|--------|-------|
| **Tailwind v4** | `vite.config.ts` via `@tailwindcss/vite` plugin | No `tailwind.config.js` — v4 uses CSS `@import "tailwindcss"` |
| **daisyUI 5** | `index.css` via `@plugin "daisyui"` | CSS-based plugin, not PostCSS |
| **oxlint** | `oxlint.config.ts` | Linter — not ESLint. Run via `npm run lint:check` |
| **oxfmt** | No config file | Formatter — not Prettier. Run via `npm run fmt` |
| **react-router v7** | `router.tsx` | `createBrowserRouter` + `RouterProvider` |
| **react-hook-form + zod** | Forms | `zodResolver` pattern |
| **react-grab** | `index.html` dev-only | `Cmd+C` on any element copies component context. Only loads in dev via `import.meta.env.DEV` |

## Backend Stack

| Tool | Config | Notes |
|------|--------|-------|
| **Django 6.0** | `config/settings.py` | SQLite, no custom `AUTH_USER_MODEL` set yet |
| **DRF** | — | ViewSets + routers |
| **JWT** | `djangorestframework-simplejwt` | TokenObtainPairView |
| **Pytest** | `pytest.ini` | `conftest.py` has `admin_user`, `doctor_user`, `patient_user` fixtures |
| **Email** | Console backend (dev) | Django `send_mail` |

## Domain Rules

- Appointment state machine: `Pending → Confirmed → Completed` or `Pending/Confirmed → Cancelled`. No other transitions allowed.
- Time slots are fixed 30-min increments (09:00, 09:30, 10:00…). No variable-length slots.
- `select_for_update` on slot row during booking — prevents race condition on SQLite.

## Gotchas

- `verbatimModuleSyntax: true` in tsconfig — use `import type` for type-only imports.
- `noUnusedLocals` + `noUnusedParameters` both strict — remove unused imports before commit.
- No `react-router-dom` — use `react-router` directly (v7 unified package).
- `tsc --noEmit` runs before `vite build` — a tsc error blocks production build.
- `.omo/` is gitignored. Plans live in `.omo/plans/`. Drafts are temporary.
