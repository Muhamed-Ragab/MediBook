import pytest
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import DoctorProfile, PatientProfile

User = get_user_model()


@pytest.fixture
def admin_user(db):
    user = User.objects.create_superuser(
        username="admin",
        email="admin@test.com",
        password="adminpass123",
        role="admin",
        is_approved=True,
        email_verified=True,
    )
    return user


@pytest.fixture
def doctor_user(db):
    user = User.objects.create_user(
        username="doctor",
        email="doctor@test.com",
        password="docpass123",
        role="doctor",
        is_approved=True,
        email_verified=True,
    )
    DoctorProfile.objects.create(
        user=user, specialty="Cardiology", bio="Experienced cardiologist", phone="1234567890"
    )
    return user


@pytest.fixture
def patient_user(db):
    user = User.objects.create_user(
        username="patient",
        email="patient@test.com",
        password="patientpass123",
        role="patient",
        is_approved=True,
        email_verified=True,
    )
    PatientProfile.objects.create(user=user, phone="0987654321")
    return user


@pytest.fixture
def doctor_token(doctor_user):
    refresh = RefreshToken.for_user(doctor_user)
    return str(refresh.access_token)


@pytest.fixture
def patient_token(patient_user):
    refresh = RefreshToken.for_user(patient_user)
    return str(refresh.access_token)


@pytest.fixture
def admin_token(admin_user):
    refresh = RefreshToken.for_user(admin_user)
    return str(refresh.access_token)
