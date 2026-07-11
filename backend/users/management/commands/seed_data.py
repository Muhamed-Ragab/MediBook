from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import DoctorProfile, PatientProfile, Specialty

User = get_user_model()


class Command(BaseCommand):
    help = "Seed database with specialties and 3 test users (admin, doctor, patient)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Delete existing users and specialties before seeding",
        )

    def handle(self, *args, **options):
        if options["force"]:
            self.stdout.write("Clearing existing data...")
            User.objects.all().delete()
            Specialty.objects.all().delete()
            DoctorProfile.objects.all().delete()
            PatientProfile.objects.all().delete()

        if User.objects.filter(email="admin@medibook.com").exists():
            self.stdout.write(self.style.WARNING("Seed data already exists. Use --force to re-seed."))
            return

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

        self.stdout.write(self.style.SUCCESS("\nSeed complete. 3 users ready."))
