# `shared/types/` — TypeScript Type Definitions

Shared interfaces and types used across the app.

**Current:**
- `Role` — `"admin" | "doctor" | "patient"`
- `User` — `{ id, username, email, role }`

**Dev instructions:**
- Add shared types here, feature-specific types in the feature folder
- Keep types pure (no runtime code) — they disappear at build time
- Align with backend API response shapes
