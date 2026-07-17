# MediBook — End-to-End Showcase

## Seed Users

Created via `python manage.py seed_data` (or `python manage.py seed_data --force` to re-seed):

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| **Admin** | `admin@medibook.com` | `Admin@123` | Superuser — can access `/admin/` and manage all data |
| **Doctor** | `doctor@medibook.com` | `Doc@123` | Dr. John Doe — Cardiology, `is_approved=True`, `email_verified=True` |
| **Patient** | `patient@medibook.com` | `Patient@123` | Jane Smith — `is_approved=True`, `email_verified=True` |

### Pre-seeded Specialties

Cardiology, Dermatology, Pediatrics, Orthopedics, Neurology, Ophthalmology, ENT, Psychiatry

---

## Entity Reference

| Entity | File | Fields | Purpose |
|--------|------|--------|---------|
| `User` | `backend/users/models.py:13` | `role` (admin/doctor/patient), `is_approved`, `is_blocked`, `email_verified` | Custom auth user extending `AbstractUser` |
| `Specialty` | `backend/users/models.py:5` | `name` (unique), `description` | Medical specialties catalog |
| `DoctorProfile` | `backend/users/models.py:42` | `user` (1-to-1), `specialty` (FK), `bio`, `phone`, `photo_url` | Doctor-specific details |
| `PatientProfile` | `backend/users/models.py:62` | `user` (1-to-1), `phone`, `date_of_birth`, `emergency_contact` | Patient-specific details |
| `AvailabilitySlot` | `backend/appointments/models.py:9` | `doctor` (FK→User), `start_time`, `end_time`, `is_booked` | 30-min fixed slot, 30-min boundary constraint |
| `Appointment` | `backend/appointments/models.py:68` | `patient` (FK), `slot` (OneToOne), `status`, `doctor_notes` | Booking with state machine |

### State Machine

```
Pending ──► Confirmed ──► Completed
   │             │
   └──► Cancelled◄──┘
```

| Transition | Who can do it |
|---|---|
| Pending → Confirmed | Doctor only |
| Pending → Cancelled | Doctor or Patient |
| Confirmed → Completed | Doctor only |
| Confirmed → Cancelled | Doctor or Patient |
| Completed → anything | ❌ Forbidden (terminal) |
| Cancelled → anything | ❌ Forbidden (terminal) |

---

## Scene 1: Admin seeds specialties

**Actor:** Admin  
**Endpoint:** `POST /api/specialties/` [`IsAdminUser`]  
**Pre-requisite:** Admin must be logged in with a JWT token.

```
POST /api/specialties/
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{"name": "Cardiology", "description": "Heart & cardiovascular system"}
{"name": "Dermatology", "description": "Skin conditions"}
{"name": "Pediatrics", "description": "Child healthcare"}
{"name": "Neurology", "description": "Nervous system disorders"}
```

- **Constraint:** `Specialty.name` is `unique=True` — each name must be distinct.
- **Alternate:** Run `python manage.py seed_data` to seed 8 specialties automatically.

```sh
# Or create via curl:
curl -X POST http://localhost:8000/api/specialties/ \
  -H "Authorization: Bearer $(curl -s -X POST http://localhost:8000/api/auth/login/ \
    -H 'Content-Type: application/json' \
    -d '{\"email\":\"admin@medibook.com\",\"password\":\"Admin@123\"}' | python -c \"import sys,json;print(json.load(sys.stdin)['data']['access'])\")" \
  -H "Content-Type: application/json" \
  -d '{"name":"Cardiology","description":"Heart & cardiovascular system"}'
```

---

## Scene 2: Doctor signs up

**Actor:** Dr. John Doe  
**Endpoint:** `POST /api/auth/register/` [`AllowAny`]

```json
POST /api/auth/register/
Content-Type: application/json

{
  "email": "doctor@medibook.com",
  "password": "Doc@123",
  "role": "doctor",
  "first_name": "John",
  "last_name": "Doe",
  "specialty": "Cardiology",
  "bio": "Experienced cardiologist with 10+ years."
}
```

**What happens:**
1. `RegisterSerializer` validates:
   - Email not already taken
   - Specialty provided (required for doctors)
2. Creates `User` with `role="doctor"`, `is_approved=False`
3. Looks up `Specialty` by name ("Cardiology") — gets the existing row from Scene 1
4. Creates `DoctorProfile(user=user, specialty=specialty, bio=...)`
5. Sends email verification link
6. Returns JWT tokens

**Key rules:**
- Doctors are **not auto-approved** (`is_approved=False`) — admin must flip it
- `email_verified` must be `True` before login is allowed
- Username auto-derived from email prefix

---

## Scene 3: Patient signs up

**Actor:** Jane Smith  
**Endpoint:** `POST /api/auth/register/` [`AllowAny`]

```json
POST /api/auth/register/
Content-Type: application/json

{
  "email": "patient@medibook.com",
  "password": "Patient@123",
  "role": "patient",
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "01087654321",
  "date_of_birth": "1990-05-15",
  "emergency_contact": "+20 100 000 0000"
}
```

**What happens:**
1. Creates `User` with `role="patient"`, `is_approved=True` (patients auto-approved)
2. Creates `PatientProfile(user=user, phone=..., date_of_birth=..., emergency_contact=...)`
3. Sends email verification link

---

## Scene 4: Admin approves the doctor

**Actor:** Admin  
**Endpoint:** `PATCH /api/users/{id}/` [`IsAdminUser`]  
**Alternative:** Django admin at `/admin/`

```json
PATCH /api/users/2/
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{"is_approved": true}
```

**Safeguard:** `perform_update` blocks modifying another admin user.

---

## Scene 5: Email verification

**Actor:** John Doe / Jane Smith  
**Endpoint:** `GET /api/auth/verify-email/{uidb64}/{token}/` [`AllowAny`]

The verification link is sent via email (console backend in dev — check terminal output):

```
Hi {username},

Please verify your email by clicking the link below:
http://localhost:5173/verify-email?uid=...&token=...
```

When clicked, `verify_email_view` sets `user.email_verified = True`.

**Login gateway** — `login_view` checks before issuing tokens:
```
email_verified?  ✅
is_blocked?      ✅ (must be False)
```

---

## Scene 6: Doctor logs in

**Actor:** Dr. John Doe  
**Endpoint:** `POST /api/auth/login/` [`AllowAny`]

```json
POST /api/auth/login/
Content-Type: application/json

{"email": "doctor@medibook.com", "password": "Doc@123"}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access": "<jwt>",
    "refresh": "<jwt>",
    "user": { "id": 2, "role": "doctor", ... }
  },
  "error": null
}
```

---

## Scene 7: Doctor sets availability slots

**Actor:** Dr. John Doe (logged in)  
**Endpoint:** `POST /api/doctors/{doctor_profile_pk}/slots/` [`IsAuthenticated`, owner only]  
**Bulk create supported** — pass a JSON array.

```json
POST /api/doctors/2/slots/
Authorization: Bearer <doctor-jwt>
Content-Type: application/json

[
  {"start_time": "2026-07-20T09:00:00Z", "end_time": "2026-07-20T09:30:00Z"},
  {"start_time": "2026-07-20T09:30:00Z", "end_time": "2026-07-20T10:00:00Z"},
  {"start_time": "2026-07-20T10:00:00Z", "end_time": "2026-07-20T10:30:00Z"},
  {"start_time": "2026-07-20T11:00:00Z", "end_time": "2026-07-20T11:30:00Z"}
]
```

**Validation (`SlotSerializer.validate`):**
- Start time on `:00` or `:30` boundary only
- Duration exactly 30 minutes
- Start time must be in the future
- No overlap with existing slots (checked in `perform_create`)

**Permission check (`SlotViewSet.initial`):**
- Only the profile owner (Dr. John Doe) can manage his slots

**Bulk response:**
```json
{
  "created": [ /* successfully created slots */ ],
  "rejected": [ /* items that failed validation + errors */ ]
}
```

**Delete a slot:**
```http
DELETE /api/doctors/2/slots/{id}/
```
Cannot delete a booked slot — must cancel the appointment first.

---

## Scene 8: Patient browses doctors and slots

**Actor:** Jane Smith (logged in)  
**Endpoints:** Both are [`AllowAny`]

```http
# List all doctors (or filter by specialty)
GET /api/doctors/?specialty=Cardiology

# Response includes next_available — earliest unbooked future slot
```

**Response shape (`DoctorProfileListSerializer`):**
```json
{
  "id": 2,
  "name": "John Doe",
  "specialty": "Cardiology",
  "bio": "Experienced cardiologist with 10+ years.",
  "phone": "01012345678",
  "photo_url": "",
  "next_available": "2026-07-20T09:00:00Z"
}
```

```http
# Check available slots for a specific doctor (optional date range)
GET /api/doctors/2/available-slots/?from=2026-07-20&to=2026-07-20
```

Returns only `is_booked=False` and `start_time > now`.

---

## Scene 9: Patient books an appointment

**Actor:** Jane Smith (logged in, role=patient)  
**Endpoint:** `POST /api/appointments/` [`IsAuthenticated`, patients only]

```json
POST /api/appointments/
Authorization: Bearer <patient-jwt>
Content-Type: application/json

{"slot": 1}
```

**Race condition protection** (`select_for_update` on the slot row):

| Check | Failure response |
|---|---|
| Slot exists? | 404 NOT_FOUND |
| Slot already booked? | 409 CONFLICT (code: `DOUBLE_BOOKING`) |
| Slot is in the past? | 400 PAST_SLOT |
| User role is patient? | 403 FORBIDDEN |

**On success:**
1. `slot.is_booked = True`
2. `Appointment.objects.create(patient=jane, slot=slot, status="Pending")`
3. Email notification sent
4. Returns appointment with `slot_details`

---

## Scene 10: Doctor confirms then completes

**Actor:** Dr. John Doe

### 10a — Confirm

```http
PATCH /api/appointments/{id}/status/
Authorization: Bearer <doctor-jwt>
Content-Type: application/json

{"status": "Confirmed"}
```

**State machine:** Pending → Confirmed ✅  
**Role check:** Only `["doctor"]` can confirm ✅  
**Scope check:** Only the slot's doctor can manage this appointment ✅

### 10b — Add doctor notes

```http
PATCH /api/appointments/{id}/
Authorization: Bearer <doctor-jwt>
Content-Type: application/json

{"doctor_notes": "Patient presented with mild hypertension. Prescribed lisinopril 10mg."}
```

`perform_update` strips any `status` field — status changes **must** go through `/status/`.

### 10c — Complete

```http
PATCH /api/appointments/{id}/status/
Authorization: Bearer <doctor-jwt>
Content-Type: application/json

{"status": "Completed"}
```

**State machine:** Confirmed → Completed ✅  
**Role check:** Only `["doctor"]` can complete ✅  
**Terminal state:** No further transitions allowed.

---

## Scene 11: Patient cancels an appointment

**Actor:** Jane Smith  
**Endpoint:** `PATCH /api/appointments/{id}/status/` [`IsAuthenticated`]

```json
PATCH /api/appointments/1/status/
Authorization: Bearer <patient-jwt>
Content-Type: application/json

{"status": "Cancelled"}
```

**What happens inside the transaction:**
1. `AvailabilitySlot.objects.select_for_update().get(pk=appointment.slot_id)` — row lock
2. `appointment.status = "Cancelled"`
3. `slot.is_booked = False` — **slot is freed** for someone else to book
4. Email notification sent

**Cancellation rules:**
- Patient can only cancel their **own** appointments
- Doctor can cancel appointments on their **own** slots
- Both `Pending → Cancelled` and `Confirmed → Cancelled` are valid
- Cancelled is terminal — no re-activation

---

## Scene 12: Admin blocks a user (bonus)

**Actor:** Admin  
**Endpoint:** `PATCH /api/users/{id}/` [`IsAdminUser`]

```json
PATCH /api/users/3/
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{"is_blocked": true}
```

**Effect:**
- `BlockedAwareRefreshView` rejects refresh token renewal — blocked user locked out immediately even with valid tokens
- `login_view` returns 401 — "Your account has been blocked. Contact support."
- Reversible — admin sets `is_blocked: false` to unblock

---

## API Reference Summary

### Auth (`/api/auth/`)

| Method | Endpoint | Permission | Purpose |
|--------|----------|------------|---------|
| POST | `/api/auth/register/` | AllowAny | Sign up (doctor or patient) |
| POST | `/api/auth/login/` | AllowAny | Get JWT tokens |
| POST | `/api/auth/refresh/` | AllowAny | Refresh access token (blocking-aware) |
| GET | `/api/auth/me/` | IsAuthenticated | Current user profile |
| GET | `/api/auth/verify-email/{uid}/{token}/` | AllowAny | Verify email address |

### Users (`/api/`)

| Method | Endpoint | Permission | Purpose |
|--------|----------|------------|---------|
| GET | `/api/users/` | IsAdminUser | List all users (filterable by role) |
| PATCH | `/api/users/{id}/` | IsAdminUser | Approve/block users |
| GET | `/api/doctors/` | AllowAny | List doctors (filterable by specialty) |
| GET/PATCH | `/api/doctors/{id}/` | AllowAny/IsAuthenticated+Owner | Doctor profile detail/edit |
| GET/PATCH | `/api/patients/{id}/` | IsAdminUser/IsAuthenticated+Owner | Patient profile detail/edit |
| GET | `/api/specialties/` | AllowAny | List specialties |
| POST | `/api/specialties/` | IsAdminUser | Create specialty |

### Appointments (`/api/`)

| Method | Endpoint | Permission | Purpose |
|--------|----------|------------|---------|
| GET/POST | `/api/doctors/{pk}/slots/` | IsAuthenticated+Owner | List/create availability slots |
| DELETE | `/api/doctors/{pk}/slots/{id}/` | IsAuthenticated+Owner | Delete slot (if not booked) |
| GET | `/api/doctors/{pk}/available-slots/` | AllowAny | Public: view free slots |
| GET/POST | `/api/appointments/` | IsAuthenticated | List appointments / book (patient only) |
| PATCH | `/api/appointments/{id}/` | IsAuthenticated | Update notes, etc. |
| PATCH | `/api/appointments/{id}/status/` | IsAuthenticated | State machine transition |

---

## Quick Start from Scratch

```sh
# 1. Seed database (creates 3 users + 8 specialties)
cd backend
python manage.py seed_data

# 2. Run dev server
python manage.py runserver

# 3. Login and use the API
#    Admin:   admin@medibook.com  / Admin@123
#    Doctor:  doctor@medibook.com / Doc@123
#    Patient: patient@medibook.com / Patient@123
```
