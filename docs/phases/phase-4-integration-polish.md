# Phase 4 — Integrations & Polish

**Parallel Wave — Max 4 developers**

## Tasks

| # | Task | Profile | Owner |
|---|------|---------|-------|
| 13 | Appointment State Machine API (Status Updates) | `deep` | Dev 1 |
| 14 | Doctor & Patient Appointments Dashboard UI | `visual-engineering` | Dev 2 |
| 15 | SMTP Email Notification Triggers | `quick` | Dev 3 |
| 16 | Admin Appointments Overview | `quick` | Dev 4 |

## Dependencies

```
11 (Phase 3) → blocks 13, 15
13 → blocks 14, 15, 16
12 (Phase 3) → blocks 14
6 (Phase 2) → blocks 16
```

## Deliverables

- Appointment status transitions with validation
- Role-based dashboard views (Doctor/Patient)
- Email notifications on booking and status changes
- Admin global appointments view

## State Machine Enforcement

All transitions validated against:
```python
VALID_TRANSITIONS = {
    "Pending": ["Confirmed", "Cancelled"],
    "Confirmed": ["Completed", "Cancelled"],
    "Completed": [],
    "Cancelled": [],
}
```

## Acceptance Criteria

- [ ] Pytest passes for valid/invalid state transitions
- [ ] Vitest passes for dashboard rendering by role
- [ ] Pytest passes for email outbox assertions
- [ ] Admin can view all appointments
