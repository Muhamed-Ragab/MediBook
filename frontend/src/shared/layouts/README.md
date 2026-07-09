# `shared/layouts/` — Page Layouts

Layout wrappers that compose the app shell.

| Layout | Route | Description |
|---|---|---|
| `RootLayout` | `/` | Navbar + main content area + footer |
| `AuthLayout` | `/login`, `/register` | Centered card layout, no navbar |
| `DashboardLayout` | `/doctor/*`, `/patient/*`, `/admin/*` | Sidebar + header + content |

**Dev instructions:**
- Each layout exports `function Component()` (named) — required by react-router route-level `lazy()`
- Layouts render `<Outlet />` for child routes
- DashboardLayout should read user role from `useAuthStore` to render role-appropriate sidebar
