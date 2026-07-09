# `src/features/` — Feature Modules

Each folder is a self-contained domain slice. Features follow a consistent structure:

```
features/<feature>/
├── pages/        # Route-level page components (lazy-loaded)
├── components/   # Feature-specific UI components
├── api/          # API hooks or TanStack Query mutations
└── hooks/        # Feature-specific React hooks
```

**Dev instructions:**
- Features are independent — no cross-feature imports (use `shared/` for common code)
- Each feature page has one default export — the router lazy-imports it
- Add new features by creating a new folder here following the same pattern
