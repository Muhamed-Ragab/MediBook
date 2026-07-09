# API Contract — Medical Appointment System

## Auth Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register/` | None | Create account |
| POST | `/api/auth/login/` | None | Get JWT tokens |
| POST | `/api/auth/refresh/` | None | Refresh access token |

## User Management (Admin)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/users/` | Admin | List all users |
| PATCH | `/api/admin/users/{id}/` | Admin | Approve/block user |

## Doctor Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/doctors/` | Public | List doctors |
| GET | `/api/doctors/{id}/` | Public | Doctor detail |
| PATCH | `/api/doctors/{id}/` | Doctor | Update own profile |
| GET | `/api/doctors/{id}/slots/` | Doctor | List own slots |
| POST | `/api/doctors/{id}/slots/` | Doctor | Create slot |
| DELETE | `/api/doctors/{id}/slots/{slot_id}/` | Doctor | Delete slot |

## Patient Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/patients/me/` | Patient | Get own profile |
| PATCH | `/api/patients/me/` | Patient | Update profile |

## Appointment Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/appointments/` | Doctor/Patient | List (filtered by role) |
| POST | `/api/appointments/` | Patient | Book appointment |
| GET | `/api/appointments/{id}/` | Doctor/Patient | Detail |
| PATCH | `/api/appointments/{id}/status/` | Doctor/Patient | Update status |

## Response Format

```json
{
    "success": true,
    "data": { ... },
    "error": null
}
// or
{
    "success": false,
    "data": null,
    "error": "Slot already booked",
    "code": "DOUBLE_BOOKING"
}
```
