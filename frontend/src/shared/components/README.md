# `shared/components/` — Shared UI Components

Reusable components used across multiple features.

**Current:**
- `Navbar` — top navigation bar (public + authenticated states)
- `ProtectedRoute` — redirects unauthenticated users, checks role

**Dev instructions:**
- daisyUI classes only — no custom CSS
- Named exports preferred (avoids confusion with page default exports)
- Each component is a single file, or a folder with `index.tsx` + `.test.tsx` if complex
