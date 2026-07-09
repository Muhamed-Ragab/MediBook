# `shared/stores/` — Zustand Global Stores

Lightweight client-state stores. Server state lives in TanStack Query.

| Store | Purpose |
|---|---|
| `uiStore` | UI state: sidebar open/close, active modal, theme |
| `authStore` | Auth state: user, token, login/logout actions |

**Dev instructions:**
- Never store server-fetched data in Zustand — that's what TanStack Query is for
- Zustand = UI-only state (modals, toggles, form wizards)
- Keep stores small and focused — one concern per store
- Persist auth token to `localStorage` in the store actions
