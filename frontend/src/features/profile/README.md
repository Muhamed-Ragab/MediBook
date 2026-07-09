# `features/profile/` — User Profiles

Doctors and Patients manage their personal information.

| Directory | Content |
|---|---|
| `pages/` | `DoctorProfilePage`, `PatientProfilePage` |
| `components/` | Profile form fields, avatar upload |

**Dev instructions:**
- Doctor: specialty, bio, phone, photo
- Patient: phone, date of birth, emergency contact
- Use `react-hook-form` + `zod` — pre-fill from API on load
- Mutations via TanStack Query — optimistic update on save
- Each role only edits their own profile — enforce via user ID from `useAuthStore`
