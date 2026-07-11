import pytest
from django.contrib.auth import get_user_model
from django.core import mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status

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
        assert doctor_user.doctor_profile.specialty == "Cardiology"

    def test_patient_user_fixture(self, patient_user):
        assert patient_user.role == "patient"
        assert hasattr(patient_user, "patient_profile")
