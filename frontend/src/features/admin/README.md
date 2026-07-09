# `features/admin/` — Admin Panel

System oversight: user management, appointment monitoring.

| Directory | Content |
|---|---|
| `pages/` | `AdminDashboard` — user table, stats, appointment overview |

**Dev instructions:**
- Admin-only — protected by route guard + backend permission check
- Users table: view all, search, approve/block toggle
- Appointments overview: filter by date, doctor, status
- No charts/analytics — just tables and status badges
