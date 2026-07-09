# `backend/` — Django REST API

Django 6.0 project serving the REST API for the medical appointment system.

| App | Purpose |
|---|---|
| `config/` | Django project settings, URL configuration |
| `users/` | Custom User model (AbstractUser), auth endpoints |
| `appointments/` | Booking, availability, appointment state machine |

**Dev instructions:**
- TDD with `pytest` + `pytest-django` — all tests in each app's `tests/` folder
- DRF ViewSets with router registration
- JWT auth via `djangorestframework-simplejwt`
- Permissions: `IsAdminUser`, `IsAuthenticated`, custom role-based permissions
- SQLite for development (no concurrent write testing — acceptable for dev)
