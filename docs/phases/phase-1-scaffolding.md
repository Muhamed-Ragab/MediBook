# Phase 1 — Scaffolding & Core Architecture

**Parallel Wave — Max 4 developers**

## Tasks

| # | Task | Profile | Owner |
|---|------|---------|-------|
| 1 | Django Scaffolding & AbstractUser Setup | `quick` | Dev 1 |
| 2 | React Scaffolding & MUI Theme | `quick` | Dev 2 |
| 3 | RTK Query API Setup & Zustand Store | `quick` | Dev 3 |
| 4 | JWT Auth Backend endpoints & Pytest Setup | `quick` | Dev 4 |

## Dependencies

```
None — all 4 tasks run in parallel
```

## Deliverables

- Django project with custom User model (roles: Admin, Doctor, Patient)
- React+Vite project with MUI theme and Vitest
- RTK Query `apiSlice` and Zustand `uiStore`
- Auth endpoints (`/api/auth/register/`, `/api/auth/login/`)
- Pytest fixtures for 3 user roles

## Acceptance Criteria

- [ ] Pytest passes for creating Admin, Doctor, Patient users
- [ ] Vitest passes for Layout rendering
- [ ] Vitest passes for Zustand store access
- [ ] Pytest passes for login/register APIs
