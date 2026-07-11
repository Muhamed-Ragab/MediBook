import pytest
from django.contrib.auth import get_user_model
from django.core import mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status

from .models import DoctorProfile, PatientProfile, Specialty
from .tokens import email_verification_token

User = get_user_model()

pytestmark = pytest.mark.django_db


class TestRegister:
    def test_register_patient_success(self, client):
        """Happy path: patient registers and gets JWT tokens + verification email."""
        data = {
            "email": "patient@example.com",
            "password": "strongpass123",
            "role": "patient",
            "first_name": "John",
            "last_name": "Doe",
            "phone": "1234567890",
        }
        response = client.post("/api/auth/register/", data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["success"] is True
        assert "access" in response.data["data"]
        assert "refresh" in response.data["data"]
        assert response.data["data"]["user"]["role"] == "patient"
        assert response.data["data"]["user"]["email"] == "patient@example.com"
        # Email was sent
        assert len(mail.outbox) == 1
        assert "Verify your MediBook account" in mail.outbox[0].subject
        # Patient is auto-approved
        assert response.data["data"]["user"]["is_approved"] is True

    def test_register_doctor_success(self, client):
        """Doctor registers with specialty info."""
        data = {
            "email": "doctor@example.com",
            "password": "strongpass123",
            "role": "doctor",
            "first_name": "Jane",
            "last_name": "Smith",
            "specialty": "Cardiology",
            "bio": "Heart specialist",
        }
        response = client.post("/api/auth/register/", data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["data"]["user"]["role"] == "doctor"
        assert response.data["data"]["user"]["doctor_profile"]["specialty"] == "Cardiology"
        # Doctor not auto-approved
        assert response.data["data"]["user"]["is_approved"] is False

    def test_register_duplicate_email(self, client):
        """Edge case: duplicate email returns 400."""
        data = {
            "email": "existing@example.com",
            "password": "strongpass123",
            "role": "patient",
        }
        client.post("/api/auth/register/", data, format="json")
        response = client.post("/api/auth/register/", data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["success"] is False

    def test_register_weak_password(self, client):
        """Edge case: short password returns 400."""
        data = {
            "email": "weak@example.com",
            "password": "123",
            "role": "patient",
        }
        response = client.post("/api/auth/register/", data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["success"] is False

    def test_register_invalid_role(self, client):
        """Edge case: invalid role returns 400."""
        data = {
            "email": "invalid@example.com",
            "password": "strongpass123",
            "role": "superadmin",
        }
        response = client.post("/api/auth/register/", data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestLogin:
    def test_login_success(self, client, doctor_user):
        """Happy path: valid credentials return JWT tokens."""
        data = {"email": "doctor@test.com", "password": "docpass123"}
        response = client.post("/api/auth/login/", data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["success"] is True
        assert "access" in response.data["data"]
        assert "refresh" in response.data["data"]
        assert response.data["data"]["user"]["role"] == "doctor"

    def test_login_invalid_password(self, client, doctor_user):
        """Edge case: wrong password returns 401."""
        data = {"email": "doctor@test.com", "password": "wrongpassword"}
        response = client.post("/api/auth/login/", data, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_user(self, client):
        """Edge case: unknown email returns 401."""
        data = {"email": "nobody@test.com", "password": "pass12345"}
        response = client.post("/api/auth/login/", data, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_unverified_email(self, client):
        """Edge case: unverified email cannot login."""
        from users.models import User

        user = User.objects.create_user(
            username="unverified",
            email="unverified@test.com",
            password="testpass123",
            role="patient",
            email_verified=False,
        )
        data = {"email": "unverified@test.com", "password": "testpass123"}
        response = client.post("/api/auth/login/", data, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "verify your email" in response.data["error"].lower()

    def test_login_blocked_user(self, client):
        """Edge case: a blocked account cannot login even with valid credentials."""
        from users.models import User

        user = User.objects.create_user(
            username="blocked",
            email="blocked@test.com",
            password="testpass123",
            role="patient",
            email_verified=True,
            is_blocked=True,
        )
        data = {"email": "blocked@test.com", "password": "testpass123"}
        response = client.post("/api/auth/login/", data, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "blocked" in response.data["error"].lower()


class TestRefresh:
    def test_refresh_success(self, client, doctor_user):
        """Happy path: refresh token returns new access token."""
        from rest_framework_simplejwt.tokens import RefreshToken

        refresh = RefreshToken.for_user(doctor_user)
        response = client.post(
            "/api/auth/refresh/", {"refresh": str(refresh)}, format="json"
        )

        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data

    def test_refresh_invalid_token(self, client):
        """Edge case: invalid refresh token returns 401."""
        response = client.post(
            "/api/auth/refresh/", {"refresh": "invalidtoken"}, format="json"
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_refresh_blocked_user(self, client):
        """Edge case: a blocked user's refresh token is rejected."""
        from users.models import User
        from rest_framework_simplejwt.tokens import RefreshToken

        user = User.objects.create_user(
            username="blockedrefresh",
            email="blockedrefresh@test.com",
            password="testpass123",
            role="patient",
            email_verified=True,
            is_blocked=True,
        )
        refresh = RefreshToken.for_user(user)
        response = client.post(
            "/api/auth/refresh/", {"refresh": str(refresh)}, format="json"
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "blocked" in response.data["error"].lower()


class TestEmailVerification:
    def test_verify_email_success(self, client, doctor_user):
        """Happy path: valid token verifies email."""
        token = email_verification_token.make_token(doctor_user)
        uid = urlsafe_base64_encode(force_bytes(doctor_user.pk))

        response = client.get(f"/api/auth/verify-email/{uid}/{token}/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["success"] is True
        doctor_user.refresh_from_db()
        assert doctor_user.email_verified is True

    def test_verify_email_invalid_token(self, client, doctor_user):
        """Edge case: invalid token returns 400."""
        uid = urlsafe_base64_encode(force_bytes(doctor_user.pk))
        response = client.get(f"/api/auth/verify-email/{uid}/invalidtoken/")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_verify_email_invalid_uid(self, client):
        """Edge case: invalid user ID returns 400."""
        response = client.get("/api/auth/verify-email/abc/def/")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestMe:
    def test_me_authenticated(self, client, doctor_token):
        """Happy path: authenticated user gets their profile."""
        response = client.get(
            "/api/auth/me/", HTTP_AUTHORIZATION=f"Bearer {doctor_token}"
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["success"] is True
        assert response.data["data"]["email"] == "doctor@test.com"
        assert response.data["data"]["role"] == "doctor"
        assert response.data["data"]["doctor_profile"]["specialty"] == "Cardiology"

    def test_me_unauthenticated(self, client):
        """Edge case: unauthenticated request returns 401."""
        response = client.get("/api/auth/me/")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestFixtures:
    def test_admin_user_fixture(self, admin_user):
        assert admin_user.role == "admin"
        assert admin_user.is_superuser

    def test_doctor_user_fixture(self, doctor_user):
        assert doctor_user.role == "doctor"
        assert hasattr(doctor_user, "doctor_profile")
        assert doctor_user.doctor_profile.specialty.name == "Cardiology"

    def test_patient_user_fixture(self, patient_user):
        assert patient_user.role == "patient"
        assert hasattr(patient_user, "patient_profile")


class TestAdminSpecialties:
    def test_admin_creates_specialty(self, client, admin_token):
        response = client.post(
            "/api/specialties/",
            {"name": "Cardiology", "description": "Heart"},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {admin_token}",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Cardiology"

    def test_public_list_specialties(self, client):
        Specialty.objects.create(name="Dermatology")
        response = client.get("/api/specialties/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_non_admin_cannot_create_specialty(self, client, doctor_token):
        response = client.post(
            "/api/specialties/",
            {"name": "Cardiology", "description": "Heart"},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_non_admin_cannot_update_specialty(self, client, patient_token):
        spec = Specialty.objects.create(name="Neurology")
        response = client.patch(
            f"/api/specialties/{spec.id}/",
            {"description": "Brain"},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_deletes_specialty(self, client, admin_token):
        spec = Specialty.objects.create(name="Radiology")
        response = client.delete(
            f"/api/specialties/{spec.id}/",
            HTTP_AUTHORIZATION=f"Bearer {admin_token}",
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT


class TestAdminUsers:
    def test_admin_lists_users(self, client, admin_token, doctor_user, patient_user):
        response = client.get(
            "/api/users/",
            HTTP_AUTHORIZATION=f"Bearer {admin_token}",
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 2

    def test_admin_blocks_user(self, client, admin_token, patient_user):
        response = client.patch(
            f"/api/users/{patient_user.id}/",
            {"is_blocked": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {admin_token}",
        )
        assert response.status_code == status.HTTP_200_OK
        patient_user.refresh_from_db()
        assert patient_user.is_blocked is True

    def test_admin_approves_user(self, client, admin_token, doctor_user):
        doctor_user.is_approved = False
        doctor_user.save()
        response = client.patch(
            f"/api/users/{doctor_user.id}/",
            {"is_approved": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {admin_token}",
        )
        assert response.status_code == status.HTTP_200_OK
        doctor_user.refresh_from_db()
        assert doctor_user.is_approved is True

    def test_non_admin_cannot_access_users(self, client, patient_token):
        response = client.get(
            "/api/users/",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_filter_by_role(self, client, admin_token, doctor_user, patient_user):
        response = client.get(
            "/api/users/?role=doctor",
            HTTP_AUTHORIZATION=f"Bearer {admin_token}",
        )
        assert response.status_code == status.HTTP_200_OK
        assert all(u["role"] == "doctor" for u in response.data)

    def test_admin_cannot_block_admin(self, client, admin_token, admin_user):
        """Admin cannot block/approve another admin user."""
        other_admin = User.objects.create_superuser(
            username="admin2",
            email="admin2@test.com",
            password="adminpass123",
            role="admin",
            is_approved=True,
            email_verified=True,
        )
        response = client.patch(
            f"/api/users/{other_admin.id}/",
            {"is_blocked": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {admin_token}",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestDoctorProfiles:
    def test_doctor_updates_own_profile(self, client, doctor_user, doctor_token):
        profile_id = doctor_user.doctor_profile.id
        response = client.patch(
            f"/api/doctors/{profile_id}/",
            {"bio": "Updated bio"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["bio"] == "Updated bio"

    def test_doctor_cannot_update_other_doctor(self, client, doctor_user, doctor_token):
        other_doctor = User.objects.create_user(
            username="otherdoctor",
            email="other@test.com",
            password="pass12345",
            role="doctor",
            is_approved=True,
            email_verified=True,
        )
        specialty = Specialty.objects.get_or_create(name="Neurology")[0]
        DoctorProfile.objects.create(user=other_doctor, specialty=specialty)
        response = client.patch(
            f"/api/doctors/{other_doctor.doctor_profile.id}/",
            {"bio": "Hacked bio"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_non_admin_cannot_list_doctors(self, client, patient_user, patient_token):
        response = client.get(
            "/api/doctors/",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_list_doctors(self, client, admin_token, doctor_user):
        response = client.get(
            "/api/doctors/",
            HTTP_AUTHORIZATION=f"Bearer {admin_token}",
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1


class TestPatientProfiles:
    def test_patient_updates_own_profile(self, client, patient_user, patient_token):
        profile_id = patient_user.patient_profile.id
        response = client.patch(
            f"/api/patients/{profile_id}/",
            {"phone": "1112223333"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["phone"] == "1112223333"

    def test_doctor_cannot_update_patient(self, client, patient_user, doctor_token):
        response = client.patch(
            f"/api/patients/{patient_user.patient_profile.id}/",
            {"phone": "9998887777"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
