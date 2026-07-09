import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        username="admin",
        email="admin@test.com",
        password="adminpass123",
    )


@pytest.fixture
def doctor_user(db):
    return User.objects.create_user(
        username="doctor",
        email="doctor@test.com",
        password="docpass123",
        role="doctor",
    )


@pytest.fixture
def patient_user(db):
    return User.objects.create_user(
        username="patient",
        email="patient@test.com",
        password="patientpass123",
        role="patient",
    )
