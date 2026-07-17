from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from users.models import DoctorProfile, PatientProfile, Specialty
from appointments.models import AvailabilitySlot, Appointment

User = get_user_model()


def _next_slot_time(base: timezone.datetime) -> timezone.datetime:
    """Round up to the next 30-minute boundary."""
    if base.minute < 30:
        return base.replace(minute=30, second=0, microsecond=0)
    return (base + timedelta(hours=1)).replace(minute=0, second=0, microsecond=0)


class Command(BaseCommand):
    help = "Seed database with specialties, 3 test users, and sample appointments"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Delete existing users, specialties, slots and appointments before seeding",
        )

    def handle(self, *args, **options):
        if options["force"]:
            self.stdout.write("Clearing existing data...")
            User.objects.all().delete()
            Specialty.objects.all().delete()
            DoctorProfile.objects.all().delete()
            PatientProfile.objects.all().delete()
            AvailabilitySlot.objects.all().delete()
            Appointment.objects.all().delete()

        if User.objects.filter(email="admin@medibook.com").exists():
            self.stdout.write(self.style.WARNING("Seed data already exists. Use --force to re-seed."))
        else:
            # Specialties
            specialties = [
                "Cardiology",
                "Dermatology",
                "Pediatrics",
                "Orthopedics",
                "Neurology",
                "Ophthalmology",
                "ENT",
                "Psychiatry",
            ]
            for name in specialties:
                Specialty.objects.get_or_create(name=name)
            self.stdout.write(f"  Created {len(specialties)} specialties")

            # Admin
            admin = User.objects.create_superuser(
                username="admin",
                email="admin@medibook.com",
                password="Admin@123",
                role="admin",
                first_name="Root",
                last_name="Admin",
                is_approved=True,
                email_verified=True,
            )
            self.stdout.write(f"  Admin: {admin.email} / Admin@123")

            # Doctor
            doctor = User.objects.create_user(
                username="doctor",
                email="doctor@medibook.com",
                password="Doc@123",
                role="doctor",
                first_name="John",
                last_name="Doe",
                is_approved=True,
                email_verified=True,
            )
            specialty = Specialty.objects.get(name="Cardiology")
            DoctorProfile.objects.create(
                user=doctor,
                specialty=specialty,
                bio="Experienced cardiologist with 10+ years in interventional cardiology.",
                phone="01012345678",
            )
            self.stdout.write(f"  Doctor: {doctor.email} / Doc@123 (Cardiology)")

            # Patient
            patient = User.objects.create_user(
                username="patient",
                email="patient@medibook.com",
                password="Patient@123",
                role="patient",
                first_name="Jane",
                last_name="Smith",
                is_approved=True,
                email_verified=True,
            )
            PatientProfile.objects.create(
                user=patient,
                phone="01087654321",
                date_of_birth="1990-05-15",
                emergency_contact="+20 100 000 0000",
            )
            self.stdout.write(f"  Patient: {patient.email} / Patient@123")

        # Sample appointments (idempotent: only if doctor has no slots yet)
        doctor = User.objects.filter(email="doctor@medibook.com").first()
        patient = User.objects.filter(email="patient@medibook.com").first()
        if doctor and patient and not AvailabilitySlot.objects.filter(doctor=doctor).exists():
            self._seed_appointments(doctor, patient)
        else:
            self.stdout.write(self.style.WARNING("Slots/appointments already present; skipping."))

        # Available (unbooked) slots so patients can book on the doctor page.
        # Idempotent: only seeds if no unbooked slots exist yet.
        if doctor and not AvailabilitySlot.objects.filter(doctor=doctor, is_booked=False).exists():
            self._seed_available_slots(doctor)
        else:
            self.stdout.write(self.style.WARNING("Available slots already present; skipping."))

        self.stdout.write(self.style.SUCCESS("\nSeed complete."))

    def _seed_appointments(self, doctor, patient):
        base = _next_slot_time(timezone.now() + timedelta(hours=1))

        # Four sequential 30-min slots across the next two days.
        slots_spec = [
            (base, Appointment.Status.PENDING),
            (base + timedelta(days=1), Appointment.Status.CONFIRMED),
            (base + timedelta(days=2), Appointment.Status.COMPLETED),
            (base + timedelta(days=3), Appointment.Status.CANCELLED),
        ]

        for start, status in slots_spec:
            end = start + timedelta(minutes=30)
            slot = AvailabilitySlot.objects.create(
                doctor=doctor,
                start_time=start,
                end_time=end,
                is_booked=True,
            )
            appt = Appointment.objects.create(
                patient=patient,
                slot=slot,
                status=status,
                doctor_notes=(
                    "Routine follow-up." if status != Appointment.Status.CANCELLED
                    else "Cancelled by patient."
                ),
            )
            self.stdout.write(
                f"  Appointment #{appt.id}: {status} @ {start:%Y-%m-%d %H:%M}"
            )

        self.stdout.write("  Created 4 sample appointments (Pending/Confirmed/Completed/Cancelled)")

    def _seed_available_slots(self, doctor):
        """Create unbooked future slots so patients can book on the doctor page."""
        base = _next_slot_time(timezone.now() + timedelta(hours=2))
        # Daily 09:00–16:30 windows for the next 5 days, two slots per day.
        hours = [9, 14]
        created = 0
        for day in range(5):
            day_start = base + timedelta(days=day)
            for h in hours:
                start = day_start.replace(hour=h, minute=0, second=0, microsecond=0)
                end = start + timedelta(minutes=30)
                if start <= timezone.now():
                    continue
                AvailabilitySlot.objects.create(
                    doctor=doctor,
                    start_time=start,
                    end_time=end,
                    is_booked=False,
                )
                created += 1
        self.stdout.write(f"  Created {created} available (unbooked) slots for booking")

