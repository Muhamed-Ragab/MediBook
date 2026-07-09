# `src/shared/` — Shared Code

Reusable code consumed by any feature. No feature-specific logic.

| Directory | Purpose |
|---|---|
| `components/` | Generic UI components (Navbar, ProtectedRoute, Loader) |
| `layouts/` | Page layout wrappers (RootLayout, AuthLayout, DashboardLayout) |
| `stores/` | Zustand stores for global state (auth, UI) |
| `types/` | TypeScript interfaces and type definitions |
| `utils/` | Helper functions, formatters, constants |

**Dev instructions:**
- Code here has zero knowledge of any feature — it must be generic
- If a component is only used by one feature, keep it in that feature's folder
- When 2+ features need the same utility, promote it here
- Zustand stores: keep them lean — one concern per store
