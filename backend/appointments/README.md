# `backend/appointments/` — Booking & Availability

Core domain: doctor availability, patient booking, appointment lifecycle.

**Models:**
- `AvailabilitySlot` — doctor, start_time, end_time (30-min enforced), is_booked
- `Appointment` — patient, slot (unique), status, doctor_notes

**Endpoints:**
- `GET/POST /api/slots/` — Doctor manages availability
- `GET/POST /api/appointments/` — Patient books, both roles view
- `PATCH /api/appointments/{id}/status/` — Update status with state machine validation

**Dev instructions:**
- `select_for_update` on slot row during booking to prevent race conditions
- State machine: `Pending → Confirmed → Completed | Cancelled` — validate transitions
- No double booking: slot `is_booked` flag + unique constraint on Appointment.slot
- Email notification on booking (Django signals or utility function)
