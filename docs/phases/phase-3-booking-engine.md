# Phase 3 — Availability & Booking Engine

**Complexity: Medium-High** — Concurrency handling, overlap validation, dual UIs.
**Parallel Wave — Max 4 developers.**
**Blocked by: Phase 1 complete. Phase 2 task 7 (profile APIs) feeds into task 1 below.**

## Tasks

| # | Task | Profile | Owner |
|---|------|---------|-------|
| 9 | AvailabilitySlot Model + CRUD API (30-min enforcement) | `ultrabrain` | Dev 1 |
| 10 | Doctor Availability Calendar UI | `visual-engineering` | Dev 2 |
| 11 | Booking Engine API + `select_for_update` Concurrency | `ultrabrain` | Dev 3 |
| 12 | Doctor Search & Booking UI | `visual-engineering` | Dev 4 |

## Dependencies

```
9 → blocks 10, 11
10 → blocks 12
11 → blocks 12
12 depends on both 10 and 11 completing
```

## Task Details

### Task 9 — AvailabilitySlot CRUD API (Dev 1)
- Create `AvailabilitySlot` model:
  - `doctor` (FK to User with DoctorProfile), `start_time` (datetime), `end_time` (datetime), `is_booked` (bool, default=False)
  - Model-level validation: enforce exactly 30-min duration (`end_time - start_time == 30 min`)
  - Model-level validation: `start_time` must be in future
  - Model-level validation: no overlap with existing slots for same doctor
  - Constraint: slots can only be created on 30-min boundaries (09:00, 09:30, 10:00…)
- Create `/api/doctors/{id}/slots/` endpoint:
  - GET — list doctor's slots (date range filter: `?from=2026-07-01&to=2026-07-07`)
  - POST — create one or multiple slots (accept array of `{start_time, end_time}`)
  - DELETE `/{slot_id}/` — delete slot (only if not booked)
- Bulk creation: accept array of time ranges, create all valid slots in a single transaction, return list of created + list of rejected (with reasons)
- Pytest tests: slot creation, 30-min enforcement, overlap rejection, future-only validation, bulk creation partial failures, delete booked slot (should fail)

### Task 10 — Doctor Availability Calendar UI (Dev 2)
- Create Doctor Availability page (`/doctor/availability`):
  - Weekly calendar view (Mon–Sun, 09:00–17:00)
  - Each day shows 30-min time blocks
  - Existing slots shown as highlighted blocks (green = available, gray = booked)
  - Click empty block → create slot (POST)
  - Click own slot → delete (with confirmation dialog, only if not booked)
  - Week navigator (previous/next week)
- Create week template feature:
  - "Generate week" button: creates slots for all 30-min intervals in selected time range
  - Prevents duplicate/overlapping slots
  - Shows success count + error count
- TanStack Query: invalidate slots list after create/delete
- Vitest tests: calendar renders correct days/times, slot click creates/deletes, week generation

### Task 11 — Booking Engine API (Dev 3)
- Create `Appointment` model:
  - `patient` (FK to User with PatientProfile), `slot` (1-to-1 FK to AvailabilitySlot, unique)
  - `status` (choices: Pending, Confirmed, Completed, Cancelled, default=Pending)
  - `doctor_notes` (text field, nullable)
  - `created_at`, `updated_at`
- Create `/api/doctors/` endpoint (public):
  - GET — list doctors with search/filter: `?specialty= cardiology&name=ahmed&page=1`
  - Returns doctor name, specialty, bio, next available slot date
- Create `/api/doctors/{id}/available-slots/` endpoint (public):
  - GET — list unbooked slots for a doctor, date range filter
- Create `/api/appointments/` endpoint:
  - POST — book appointment (Patient only):
    1. Start transaction
    2. `select_for_update()` on the AvailabilitySlot row
    3. Validate slot exists, is not booked, is in future
    4. Mark slot as `is_booked=True`
    5. Create Appointment with status=Pending
    6. Commit transaction
    7. Return appointment details
  - GET — list appointments (filtered by role: Doctor sees own, Patient sees own)
- CRITICAL: `select_for_update` must be used inside a transaction (`@transaction.atomic`) to prevent double-booking race condition
- Pytest tests: successful booking, concurrent booking attempts (only one succeeds), booking already-booked slot, booking past slot, patient booking limits, list filtered by role

### Task 12 — Doctor Search & Booking UI (Dev 4)
- Create Doctor Search page (`/patient/search`):
  - Search bar (by name)
  - Specialty filter dropdown (fetched from `/api/specialties/`)
  - Doctor cards showing: name, specialty, bio preview, next available date
  - Click card → navigate to doctor detail
- Create Doctor Detail page (`/patient/doctors/{id}`):
  - Full profile info (name, specialty, bio, phone)
  - Weekly availability calendar (read-only, shows unbooked slots in green)
  - Click available slot → opens booking confirmation modal
- Create Booking Confirmation modal:
  - Shows: doctor name, date, time
  - "Confirm Booking" button → POST to `/api/appointments/`
  - On success → redirect to patient appointments page with success toast
  - On error (double-booking) → show "Slot just got booked" message, refresh calendar
- TanStack Query: invalidate appointments cache after booking, optimistic updates for slot state
- Vitest tests: search filters render, doctor detail loads, booking flow completes, double-booking error handled

## Critical: Race Condition Handling

The `select_for_update` row-level lock on the AvailabilitySlot row is the ONLY mechanism preventing double-booking. This must be tested with concurrent requests in Pytest.

## Deliverables

- AvailabilitySlot model with 30-min enforcement and overlap validation
- Availability CRUD API + Doctor calendar UI
- Appointment model + booking endpoint with `select_for_update` concurrency
- Doctor search/filter API + patient booking UI
- Doctor notes field on Appointment model

## Acceptance Criteria

- [ ] Pytest passes for slot creation and 30-min duration enforcement
- [ ] Pytest passes for overlap rejection (same doctor, overlapping time)
- [ ] Pytest passes for successful single booking
- [ ] Pytest passes for concurrent booking race condition (2 simultaneous requests — only 1 succeeds)
- [ ] Pytest passes for booking already-booked slot (rejected)
- [ ] Pytest passes for doctor search by specialty and name
- [ ] Pytest passes for role-filtered appointment listing
- [ ] Vitest passes for calendar rendering and slot create/delete
- [ ] Vitest passes for week template generation
- [ ] Vitest passes for doctor search filters
- [ ] Vitest passes for booking flow (success + double-booking error)
