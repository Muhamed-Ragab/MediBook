# Architecture — Medical Appointment System

## Monorepo Structure

```
React_Django/
├── backend/                    # Django REST API
│   ├── config/                 # Django project settings
│   ├── users/                  # Custom User model + Auth
│   ├── appointments/           # Booking + Availability
│   └── requirements.txt
├── frontend/                   # React + Vite + TypeScript
│   ├── src/
│   │   ├── app/                # App-wide setup
│   │   │   ├── providers.tsx   # Provider composition
│   │   │   ├── router.tsx      # Route definitions
│   │   │   └── store.ts       # TanStack Query + Zustand store setup
│   │   ├── features/           # Feature modules
│   │   │   ├── auth/           # Authentication (pages/, api.ts)
│   │   │   ├── home/           # Landing page
│   │   │   ├── dashboard/      # Role-based dashboards
│   │   │   ├── booking/        # Appointment booking
│   │   │   ├── admin/          # Admin panel
│   │   │   └── profile/        # User profiles
│   │   ├── shared/             # Shared code
│   │   │   ├── components/     # Navbar, ProtectedRoute
│   │   │   ├── layouts/        # RootLayout
│   │   │   ├── stores/         # Zustand (UI state)
│   │   │   ├── types/          # TypeScript interfaces
│   │   │   └── utils/          # Helpers
│   │   ├── main.tsx
│   │   └── index.css           # Tailwind + daisyUI
│   └── package.json
└── docs/                       # Planning & design
```

## System Architecture

```
[Browser] ←→ [React SPA] ←→ [Django REST API] ←→ [SQLite]
                  │                     │
            Zustand (UI state)    DRF ViewSets
            TanStack Query        JWT Auth (simplejwt)
            daisyUI + Tailwind    Pytest (TDD)
```

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth | JWT (simplejwt) | Stateless, scalable |
| Routing | react-router v7 | Declarative, nested routes |
| API | DRF ViewSets | Rapid CRUD, router auto-gen |
| Client state | Zustand | Lightweight, no boilerplate |
| Server cache | TanStack Query | Auto-cache, tag invalidation, no Redux boilerplate |
| Forms | react-hook-form + zod | Performant with schema validation |
| UI | daisyUI 5 + Tailwind v4 | Utility-first, component-rich, lightweight |
| Testing | Pytest / Vitest | TDD enforced |
| DB | SQLite | Zero-config for dev |

## Role-Based Access

```
Anonymous → Login/Register
├── Admin   →  /admin/*         (manage users, view all)
├── Doctor  →  /doctor/*        (manage slots, appointments)
└── Patient →  /patient/*       (book, manage own appointments)
```

Routing is enforced frontend (protected routes) and backend (DRF permissions).
