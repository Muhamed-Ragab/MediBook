# Phase 2 — Admin Panel & User Profiles

**Complexity: Medium** — Standard CRUD operations, no concurrency or complex validation.
**Parallel Wave — Max 4 developers.**
**Blocked by: Phase 1 complete.**

## Tasks

| # | Task | Profile | Owner |
|---|------|---------|-------|
| 5 | Admin User Management API + Specialties CRUD | `deep` | Dev 1 |
| 6 | Admin Dashboard UI (User Management + Specialties) | `visual-engineering` | Dev 2 |
| 7 | DoctorProfile & PatientProfile APIs + Django Admin | `deep` | Dev 3 |
| 8 | Profile Edit Pages (Doctor + Patient) | `visual-engineering` | Dev 4 |

## Dependencies

```
5 → blocks 6
7 → blocks 8
5 and 7 are independent (parallel)
```

## Task Details

### Task 5 — Admin API + Specialties CRUD (Dev 1)
- Create `/api/admin/users/` endpoint:
  - GET — list all users with role, status, date_joined (Admin only)
  - PATCH `/{id}/` — approve/block user, change role (Admin only)
  - Filter params: `?role=doctor&status=approved&search=name`
- Create `Specialty` model: `name` (unique), `description`
- Create `/api/specialties/` endpoint:
  - GET — list all specialties (public)
  - POST — create specialty (Admin only)
  - PATCH `/{id}/` — update specialty (Admin only)
  - DELETE `/{id}/` — delete specialty (Admin only)
- Link `DoctorProfile.specialty` as FK to `Specialty` model (update model if needed)
- DRF permissions: `IsAdminUser` for admin endpoints, custom `IsAdminOrReadOnly` for specialties
- Pytest tests: admin list users, approve/block, non-admin 403, specialty CRUD, specialty uniqueness

### Task 6 — Admin Dashboard UI (Dev 2)
- Create Admin Dashboard page (`/admin/dashboard`):
  - Stats cards: total users, doctors, patients, appointments
  - Recent registrations list (needs approval badge)
- Create User Management page (`/admin/users`):
  - Table with columns: name, email, role, status (approved/blocked/pending), date joined
  - Approve/Block toggle button per row
  - Search input + role filter dropdown
  - Pagination
- Create Specialties Management page (`/admin/specialties`):
  - Table: name, description, actions (edit, delete)
  - Add specialty form (inline modal)
  - Edit specialty form
  - Delete confirmation dialog
- All pages use TanStack Query for data fetching with cache invalidation on mutations
- Vitest tests: table renders data, approve/block toggle, specialty CRUD flow

### Task 7 — Profile APIs + Django Admin (Dev 3)
- Create `DoctorProfile` model (if not already): 1-to-1 with User, `specialty` (FK), `bio`, `phone`, `photo_url`
- Create `PatientProfile` model (if not already): 1-to-1 with User, `phone`, `date_of_birth`, `emergency_contact`
- Create `/api/doctors/{id}/` endpoint:
  - GET — public doctor detail (name, specialty, bio, phone)
  - PATCH — update own profile (Doctor only)
- Create `/api/patients/me/` endpoint:
  - GET — own profile (Patient only)
  - PATCH — update own profile (Patient only)
- Configure Django admin:
  - Register User, DoctorProfile, PatientProfile, Specialty, Appointment (once created)
  - Customize list display, search fields, filters for each model
  - Add action to approve/block users from admin
- Pytest tests: doctor profile CRUD, patient profile CRUD, unauthorized access 403, photo URL validation

### Task 8 — Profile Edit Pages (Dev 4)
- Create Doctor Profile Edit page (`/doctor/profile`):
  - Form fields: bio (textarea), phone, photo upload (file input)
  - Specialty is read-only (set during registration)
  - Save button with confirmation toast
  - Preview uploaded photo before save
- Create Patient Profile Edit page (`/patient/profile`):
  - Form fields: phone, date_of_birth, emergency_contact
  - Save button with confirmation toast
- Profile view page (shared for both roles): display all profile info
- All forms use react-hook-form + zod validation
- Vitest tests: form validation, photo upload preview, save mutation invalidates cache

## Deliverables

- Admin user management API + UI (approve/block/search)
- Specialties CRUD API + management UI
- DoctorProfile and PatientProfile APIs with role-gated access
- Profile edit pages with form validation
- Django admin configuration for all models

## Acceptance Criteria

- [ ] Pytest passes for admin listing/approving/blocking users
- [ ] Pytest passes for non-admin 403 on admin endpoints
- [ ] Pytest passes for specialties CRUD (create, read, update, delete)
- [ ] Pytest passes for doctor and patient profile CRUD
- [ ] Pytest verifies profile photo URL is valid URL format
- [ ] Vitest passes for admin user table rendering + approve/block
- [ ] Vitest passes for specialties CRUD UI flow
- [ ] Vitest passes for profile form validation
- [ ] Vitest passes for photo upload preview
