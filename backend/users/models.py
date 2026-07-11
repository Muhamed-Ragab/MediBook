from django.contrib.auth.models import AbstractUser
from django.db import models


class Specialty(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        DOCTOR = "doctor", "Doctor"
        PATIENT = "patient", "Patient"

    role = models.CharField(
        max_length=10, choices=Role.choices, default=Role.PATIENT
    )
    is_approved = models.BooleanField(default=False)
    is_blocked = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)

    groups = models.ManyToManyField(
        "auth.Group",
        related_name="custom_user_set",
        blank=True,
        help_text="The groups this user belongs to.",
    )
    user_permissions = models.ManyToManyField(
        "auth.Permission",
        related_name="custom_user_permissions_set",
        blank=True,
    )

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class DoctorProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="doctor_profile"
    )
    specialty = models.ForeignKey(
        Specialty,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="doctor_profiles",
    )
    bio = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    photo_url = models.URLField(blank=True)

    def __str__(self):
        specialty_name = self.specialty.name if self.specialty else "No specialty"
        return f"Dr. {self.user.get_full_name() or self.user.username} - {specialty_name}"


class PatientProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="patient_profile"
    )
    phone = models.CharField(max_length=20, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    emergency_contact = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username}"
