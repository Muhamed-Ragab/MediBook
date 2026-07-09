# Phase 2 — Auth & Profiles

**Parallel Wave — Max 4 developers**

## Tasks

| # | Task | Profile | Owner |
|---|------|---------|-------|
| 5 | Frontend Auth Context & Login/Register UI | `visual-engineering` | Dev 1 |
| 6 | Admin Dashboard UI & API (User Management) | `deep` | Dev 2 |
| 7 | Doctor Profile API & UI | `deep` | Dev 3 |
| 8 | Patient Profile API & UI | `deep` | Dev 4 |

## Dependencies

```
Blocked by: Phase 1 complete
5 → blocks 6, 7, 8
```

## Deliverables

- Login/Register pages with Zod validation
- Protected routes with role-based redirects
- Admin user management (view/approve/block)
- Doctor profile (bio, specialty)
- Patient profile (contact info)

## Acceptance Criteria

- [ ] Vitest passes for form validation
- [ ] Pytest passes for Admin CRUD, Doctor/Patient profile updates
- [ ] 403 Forbidden for unauthorized access
