# `backend/config/` — Django Project Configuration

Django project settings, root URL config, WSGI/ASGI entry points.

**Dev instructions:**
- `settings.py`: installed apps, middleware, database, auth backends, REST framework config
- `urls.py`: top-level URL routing — include app URLs, DRF router, admin
- Add `djangorestframework-simplejwt` config here (access/refresh token lifetimes)
- Email backend: console for dev, SMTP for production
