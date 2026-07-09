# ERD — Medical Appointment System

## Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    User {
        int id PK
        string username UK
        string email UK
        string password
        string role "Admin | Doctor | Patient"
        bool is_approved
        bool is_blocked
        datetime date_joined
    }

    DoctorProfile {
        int id PK
        int user_id FK "1-to-1"
        string specialty
        text bio
        string phone
        string photo_url
    }

    PatientProfile {
        int id PK
        int user_id FK "1-to-1"
        string phone
        date date_of_birth
        string emergency_contact
    }

    Specialty {
        int id PK
        string name UK
        string description
    }

    AvailabilitySlot {
        int id PK
        int doctor_id FK
        datetime start_time
        datetime end_time "enforced 30-min difference"
        bool is_booked "default false"
    }

    Appointment {
        int id PK
        int patient_id FK
        int slot_id FK UK
        string status "Pending | Confirmed | Completed | Cancelled"
        text doctor_notes
        datetime created_at
        datetime updated_at
    }

    User ||--o| DoctorProfile : has
    User ||--o| PatientProfile : has
    DoctorProfile ||--o{ AvailabilitySlot : offers
    DoctorProfile }o--|| Specialty : belongs_to
    PatientProfile ||--o{ Appointment : books
    AvailabilitySlot ||--o| Appointment : reserves
```

## Key Constraints

| Constraint | Implementation |
|---|---|
| No double booking | `AvailabilitySlot.is_booked` flag + `select_for_update` |
| 30-min slots | `start_time` → `end_time` diff enforced at model level |
| State machine | `Appointment.status` transitions validated in serializer |
| Unique per slot | `Appointment.slot_id` is UK (one appointment per slot) |
