# `src/` — Frontend Application

Entry point for the React app. All source code lives under this tree.

| Subdirectory | Purpose |
|---|---|
| `app/` | App-wide setup: providers, router, store |
| `features/` | Feature modules (one per domain) |
| `shared/` | Reusable code: layouts, components, stores, types, utils |

**Dev instructions:**
- Pages use `export default function PageName()` — lazy-loaded by the router
- Shared components use named exports
- No code outside `features/` should import from another feature directly — go through `shared/`
