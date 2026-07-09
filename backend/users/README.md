# `backend/users/` — Users & Authentication

Custom User model, registration, login, and role management.

**Models:**
- `User` — extends `AbstractUser` with `role` field (Admin, Doctor, Patient)
- `DoctorProfile` — 1-to-1 with User: specialty, bio, phone, photo
- `PatientProfile` — 1-to-1 with User: phone, date of birth, emergency contact

**Endpoints:**
- `POST /api/auth/register/` — create account
- `POST /api/auth/login/` — JWT token
- `POST /api/auth/refresh/` — refresh token

**Dev instructions:**
- Use `AUTH_USER_MODEL = "users.User"` in settings
- Pytest fixtures for admin/doctor/patient users in `conftest.py`
- Email confirmation on registration (Django SMTP or console backend)
- Admin can approve/block users via `/api/admin/users/` endpoint
