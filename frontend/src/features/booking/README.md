# `features/booking/` — Appointment Booking

Patient-facing flow: search doctors → select slot → confirm booking.

| Directory | Content |
|---|---|
| `pages/` | `DoctorSearchPage`, `BookAppointmentPage` |
| `components/` | Doctor cards, slot picker, booking summary |
| `api/` | TanStack Query hooks for doctor list, slot availability, booking mutations |

**Dev instructions:**
- `DoctorSearchPage`: filters by specialty/name, shows available doctors
- `BookAppointmentPage`: receives `doctorId` from route params, renders time slots
- Use TanStack Query mutations for booking — invalidate queries on success
- No double-booking enforced by backend — show optimistic UI on success, rollback on error
