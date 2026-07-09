# `features/auth/` — Authentication

Handles user registration, login, and session management.

| Directory | Content |
|---|---|
| `pages/` | `LoginPage`, `RegisterPage` |
| `components/` | Auth-specific forms and UI (e.g., `LoginForm`, `OAuthButton`) |

**Dev instructions:**
- Login/Register use `react-hook-form` + `zod` for validation
- Auth state is stored in Zustand: `useAuthStore` in `shared/stores/`
- After login, redirect user to their role-based dashboard
- Email confirmation flow — handle `/confirmed/:token` route if needed
