# `features/dashboard/` — Role Dashboards

Hub pages for Doctors and Patients after login.

| File | Route | Role |
|---|---|---|
| `DoctorDashboard.tsx` | `/doctor` | Doctor |
| `PatientDashboard.tsx` | `/patient` | Patient |
| `AppointmentsPage.tsx` | `/doctor/appointments`, `/patient/appointments` | Both |

**Dev instructions:**
- Dashboards are navigation hubs — cards/links to sub-features
- Doctor dashboard links: Availability, Appointments, Profile
- Patient dashboard links: Find Doctor, My Appointments, Profile
- AppointmentsPage is shared across roles — conditionally render actions based on role from `useAuthStore`
