# `docs/phases/` — Execution Phases

4 balanced modules. Each module is a parallel wave (max 4 developers).
All missing requirements covered: email confirmation, specialties CRUD, Django admin, doctor notes, reschedule.

## Module Breakdown

| Module | Focus | Complexity | BE Tasks | FE Tasks |
|--------|-------|-----------|----------|----------|
| M1 | Scaffolding & Authentication | Medium | 3 | 3 |
| M2 | Admin & Profiles | Medium | 3 | 3 |
| M3 | Availability & Booking Engine | Medium-High | 3 | 3 |
| M4 | Appointment Lifecycle & Notifications | Medium | 3 | 3 |

## Dependency Graph

```
M1 (Auth) ──→ M2 (Admin+Profiles)
            ──→ M3 (Booking) ──→ M4 (Lifecycle+Notifications)
```

M1 blocks all downstream. M2 and M3 run in parallel after M1. M4 depends on M3.

## Files

- `phase-1-scaffolding-auth.md` — M1: Django/React setup, User model, JWT auth, email confirmation
- `phase-2-admin-profiles.md` — M2: Admin CRUD, specialties, profiles, Django admin
- `phase-3-booking-engine.md` — M3: Availability slots, booking with concurrency, search
- `phase-4-lifecycle-notifications.md` — M4: State machine, dashboards, cancel/reschedule, email triggers

## Dev Instructions

- Each phase is a parallel wave — up to 4 developers working simultaneously
- Read the phase file before starting to understand scope and dependencies
- All tasks within a phase are independent unless noted otherwise
- Tasks combine backend (DRF ViewSets + Pytest) and frontend (React + daisyUI)
- Follow TDD: write test first, then implementation
