# Phase 4 — Appointment Lifecycle & Notifications

**Complexity: Medium** — State machine validation, email triggers, dashboard views.
**Parallel Wave — Max 4 developers.**
**Blocked by: Phase 3 complete (Appointment model + booking endpoint exist).**

## Tasks

| # | Task | Profile | Owner |
|---|------|---------|-------|
| 13 | Appointment Status Transition API + State Machine | `deep` | Dev 1 |
| 14 | Doctor Appointments Dashboard + Approve/Reject + Notes | `visual-engineering` | Dev 2 |
| 15 | Patient Appointments Dashboard + Cancel/Rebook | `visual-engineering` | Dev 3 |
| 16 | Email Notification Triggers + Integration Testing | `deep` | Dev 4 |

## Dependencies

```
13 → blocks 14, 15, 16
14 and 15 are independent (parallel)
16 depends on 13 (needs status transitions for email triggers)
```

## Task Details

### Task 13 — State Machine API (Dev 1)
- Create `/api/appointments/{id}/status/` endpoint (PATCH):
  - Accepts `{ "status": "confirmed" }` and optionally `{ "doctor_notes": "..." }`
  - Validates transition against state machine rules (see below)
  - Validates role permission for the transition
  - Returns updated appointment
- State machine rules:
  ```python
  VALID_TRANSITIONS = {
      "Pending": ["Confirmed", "Cancelled"],
      "Confirmed": ["Completed", "Cancelled"],
      "Completed": [],
      "Cancelled": [],
  }
  ALLOWED_ROLES = {
      ("Pending", "Confirmed"): ["doctor"],
      ("Pending", "Cancelled"): ["doctor", "patient"],
      ("Confirmed", "Completed"): ["doctor"],
      ("Confirmed", "Cancelled"): ["doctor", "patient"],
  }
  ```
- Patient can only cancel their own appointment (not another patient's)
- Doctor can confirm/reject their own appointments only
- When cancelling a booked appointment: mark slot `is_booked=False` (free it up)
- When confirming: slot stays booked
- When completing: slot stays booked (historical record)
- Pytest tests: all valid transitions succeed, all invalid transitions fail, wrong-role transitions fail, cancel frees slot, patient cannot cancel another patient's appointment

### Task 14 — Doctor Appointments Dashboard (Dev 2)
- Create Doctor Dashboard page (`/doctor/dashboard`):
  - Upcoming appointments tab:
    - Cards/table showing: patient name, date, time, status badge
    - Color-coded status: Pending=yellow, Confirmed=blue, Completed=green, Cancelled=red
    - Action buttons per Pending appointment: Approve (→ Confirmed), Reject (→ Cancelled)
    - "Add Notes" expandable section per appointment (saves to `doctor_notes`)
  - Past appointments tab:
    - Filter by date range
    - Read-only view (no actions)
  - Stats cards: total upcoming, pending approval, completed today
- TanStack Query: auto-refetch on status change, cache invalidation
- Vitest tests: dashboard renders appointments, approve/reject buttons appear only for Pending, notes save, past appointments are read-only

### Task 15 — Patient Appointments Dashboard (Dev 3)
- Create Patient Dashboard page (`/patient/dashboard`):
  - Upcoming appointments tab:
    - Cards showing: doctor name, specialty, date, time, status badge
    - Cancel button (only for Pending or Confirmed appointments)
    - Cancel confirmation modal
  - Past appointments tab:
    - Read-only history
  - Reschedule flow:
    - "Reschedule" button on upcoming appointments (Pending/Confirmed only)
    - Click → confirms cancellation of current appointment
    - Then redirects to doctor search page for that doctor
    - Then book new slot (reuses Phase 3 booking flow)
    - This is a two-step cancel→rebook, not a direct date change
  - Empty state: "No upcoming appointments. Find a doctor →" link to search
- TanStack Query: invalidate after cancel/reschedule
- Vitest tests: dashboard renders appointments, cancel flow, reschedule redirects correctly, empty state shown

### Task 16 — Email Notifications (Dev 4)
- Implement email triggers via Django signals or utility functions:

| Trigger | Recipient | Template Content |
|---------|-----------|-----------------|
| Appointment booked | Patient | "Your appointment with Dr. X on date at time is pending confirmation" |
| Appointment booked | Doctor | "Patient Y booked an appointment on date at time" |
| Appointment confirmed | Patient | "Your appointment with Dr. X has been confirmed" |
| Appointment cancelled | Patient | "Your appointment with Dr. X has been cancelled" |
| Appointment cancelled | Doctor | "Appointment with Patient Y has been cancelled" |
| Appointment completed | Patient | "Your appointment with Dr. X is completed. Thank you!" |

- Use Django's `send_mail()` with console backend for dev
- Create email template files (plain text — can be HTML later)
- Structure the notification system as a utility module `backend/appointments/notifications.py`:
  - Each trigger is a standalone function
  - Functions are idempotent (safe to call multiple times)
  - Log when email is sent (for debugging)
- Pytest tests:
  - Mail outbox assertions for each trigger
  - Verify correct recipient
  - Verify email content contains expected text (appointment date, doctor/patient name)
  - Verify no email sent on invalid transitions
- Integration test: full flow — register → login → book → confirm → complete, verify emails at each step

## Deliverables

- Appointment state machine API with role-gated transitions
- Doctor dashboard (upcoming/past appointments, approve/reject, notes)
- Patient dashboard (upcoming/past, cancel, reschedule as cancel→rebook)
- Email notification system with triggers for every status change
- Full integration flow test

## Acceptance Criteria

- [ ] Pytest passes for all 6 valid state transitions
- [ ] Pytest passes for all invalid transitions (rejected with 400)
- [ ] Pytest passes for wrong-role transitions (rejected with 403)
- [ ] Pytest passes for cancel freeing the slot (`is_booked=False`)
- [ ] Pytest passes for each email trigger (outbox assertions on booking, confirm, cancel, complete)
- [ ] Pytest passes for email content checks (correct recipient, contains expected text)
- [ ] Pytest integration test: register → verify → book → confirm → complete (full happy path)
- [ ] Vitest passes for doctor dashboard (appointments list, approve, reject, notes)
- [ ] Vitest passes for patient dashboard (cancel flow, reschedule redirect, empty state)
- [ ] Vitest passes for status badge colors
