# `features/availability/` — Doctor Availability

Doctors manage their available time slots here.

| Directory | Content |
|---|---|
| `pages/` | `AvailabilityPage` — date picker + slot grid |
| `components/` | Slot creator, slot list, week view |

**Dev instructions:**
- Doctors select a date, generate 30-min slots, delete individual slots
- Slots are fetched by date range — use TanStack Query with date param
- Mutations: create slots in bulk, delete single slot
- Visual feedback: green = available, grey = booked, remove button for empty slots
- Slot times are fixed 30-min intervals (09:00, 09:30, 10:00…)
