# Phase 1 — Scaffolding & Authentication

**Complexity: Medium** — Standard project setup + JWT auth patterns.
**Parallel Wave — Max 4 developers.**

## Tasks

| # | Task | Profile | Owner |
|---|------|---------|-------|
| 1 | Django Scaffolding + Custom User Model + DRF + simplejwt | `quick` | Dev 1 |
| 2 | React + Vite + Tailwind v4 + daisyUI 5 + Routing Skeleton | `quick` | Dev 2 |
| 3 | Register/Login API + JWT Tokens + Email Confirmation | `ultrabrain` | Dev 3 |
| 4 | Login/Register UI + AuthProvider + Protected Routes | `visual-engineering` | Dev 4 |

## Dependencies

```
None — all 4 tasks run in parallel
```

## Task Details

### Task 1 — Django Scaffolding (Dev 1)
- Finish Django project setup (`config/` already exists)
- Configure `AUTH_USER_MODEL = "users.User"` in settings
- Set up `User(AbstractUser)` with `role` field (choices: Admin, Doctor, Patient), `is_approved`, `is_blocked`
- Add `rest_framework`, `rest_framework_simplejwt` to INSTALLED_APPS
- Configure `SIMPLE_JWT` settings (access token lifetime, etc.)
- Set DEFAULT_AUTHENTICATION_CLASSES and DEFAULT_PERMISSION_CLASSES
- Install/configure `django-cors-headers` for frontend communication
- Pytest fixtures for 3 user roles in `conftest.py`

### Task 2 — React Scaffolding (Dev 2)
- Finish Vite + React 19 + TypeScript setup
- Install and configure Tailwind v4 (`@tailwindcss/vite` plugin) + daisyUI 5 (`@plugin "daisyui"` in CSS)
- Set up project structure (`app/`, `features/`, `shared/` per architecture.md)
- Create `router.tsx` with route skeleton (placeholder pages for each role)
- Set up `providers.tsx` with QueryClientProvider + RouterProvider
- Configure Vitest with jsdom + testing-library
- Run `npm run build` to verify zero TypeScript/build errors

### Task 3 — Auth API + Email Confirmation (Dev 3)
- Create `/api/auth/register/` endpoint (POST):
  - Accepts email, password, role (doctor|patient), profile data
  - Validates role choice, creates User + corresponding profile (DoctorProfile/PatientProfile)
  - Sends confirmation email with verification link
  - Returns JWT tokens on success
- Create `/api/auth/login/` endpoint (POST):
  - Accepts email + password
  - Returns access + refresh JWT tokens
- Create `/api/auth/refresh/` endpoint (POST)
- Create `/api/auth/verify-email/<uidb64>/<token>/` endpoint (GET):
  - Verifies email confirmation token
  - Marks user email as verified
- Configure Django email backend to console (dev) — `EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'`
- CRITICAL: `select_related` on User queries to avoid N+1 on profile access
- Pytest tests: register success, register duplicate email, login valid/invalid, email token verification, unverified user cannot login

### Task 4 — Auth UI + Protected Routes (Dev 4)
- Create Login page (`/login`):
  - react-hook-form + zod validation (email, password)
  - Submit calls login API → stores tokens in localStorage via authStore
  - Redirect to role-based dashboard on success
- Create Register page (`/register`):
  - Role selection toggle (Doctor / Patient)
  - Conditional fields per role (specialty for doctor, phone for both)
  - Submit calls register API → show email verification prompt
- Create Email Verification page (`/verify-email`):
  - Reads token from URL params, calls verify endpoint
  - Shows success/error states
- Create `AuthProvider` context:
  - Reads token from localStorage on mount
  - Provides `user`, `login()`, `logout()`, `isAuthenticated`, `userRole`
  - Refreshes token automatically on 401
- Create `ProtectedRoute` component:
  - Redirects to `/login` if not authenticated
  - Redirects to appropriate dashboard if wrong role
  - Shows 403 page if role mismatch
- Create `uiStore` (Zustand): sidebar toggle, theme toggle
- Vitest tests: form validation messages, protected route redirects, auth store token persistence

## Deliverables

- Django project with custom User model (roles: Admin, Doctor, Patient)
- React + Vite project with Tailwind v4 + daisyUI 5 + Vitest
- Auth endpoints with JWT and email verification flow
- Login/Register pages with zod validation
- AuthProvider, ProtectedRoute, role-based routing
- Zustand `uiStore` for UI-only state

## Stack Confirmations

| Decision | Choice |
|----------|--------|
| UI Framework | daisyUI 5 + Tailwind v4 (NOT MUI) |
| State Management | TanStack Query (server) + Zustand (UI) |
| HTTP Client | plain fetch / RTK Query |

## Acceptance Criteria

- [ ] Pytest passes for creating Admin, Doctor, Patient users
- [ ] Pytest passes for register, login, refresh, email verification
- [ ] Pytest verifies email is sent on registration (mail outbox)
- [ ] Pytest verifies unverified email cannot login
- [ ] Vitest passes for form validation (empty fields, invalid email, short password)
- [ ] Vitest passes for ProtectedRoute redirect (unauthenticated → /login)
- [ ] Vitest passes for ProtectedRoute role gate (wrong role → redirect)
- [ ] Vitest passes for auth store token persistence
- [ ] `npm run build` passes (tsc --noEmit + vite build)
