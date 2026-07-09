# `src/app/` — App-Wide Setup

Glue that wires the application together.

| File | Responsibility |
|---|---|
| `router.tsx` | All route definitions (lazy-loaded pages, layouts) |
| `providers.tsx` | Provider composition: QueryClient → RouterProvider → ReactQueryDevtools |

**Dev instructions:**
- Add new providers here (e.g., theme provider, toast provider)
- Route changes go in `router.tsx` — each page is lazy imported from its feature folder
- Do NOT put feature logic here — this is just wiring
