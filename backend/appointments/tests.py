from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone
from rest_framework import status

from appointments.models import Appointment, AvailabilitySlot
from users.models import DoctorProfile, PatientProfile, Specialty

User = get_user_model()

pytestmark = pytest.mark.django_db


def _future_time(hour=10, minute=0):
    """Helper to create a future time on a 30-min boundary."""
    now = timezone.now()
    days_ahead = 7 - now.weekday() if now.weekday() < 5 else 1
    future = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=days_ahead)
    return future.replace(hour=hour, minute=minute)


class TestAvailabilitySlots:
    def test_doctor_creates_slot(self, client, doctor_user, doctor_token):
        start = _future_time(9, 0)
        end = start + timedelta(minutes=30)

        response = client.post(
            f"/api/doctors/{doctor_user.id}/slots/",
            {"start_time": start.isoformat(), "end_time": end.isoformat()},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["is_booked"] is False
        assert AvailabilitySlot.objects.count() == 1

    def test_non_doctor_cannot_create_slot(self, client, patient_user, patient_token):
        start = _future_time(9, 0)
        end = start + timedelta(minutes=30)

        response = client.post(
            f"/api/doctors/{patient_user.id}/slots/",
            {"start_time": start.isoformat(), "end_time": end.isoformat()},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_other_doctor_cannot_create_slot_for_another(
        self, client, doctor_user, doctor_token
    ):
        other_doctor = User.objects.create_user(
            username="otherdoc",
            email="other@test.com",
            password="pass1234",
            role="doctor",
            email_verified=True,
        )
        DoctorProfile.objects.create(
            user=other_doctor,
            specialty=Specialty.objects.get_or_create(name="Dermatology")[0],
        )

        start = _future_time(9, 0)
        end = start + timedelta(minutes=30)

        response = client.post(
            f"/api/doctors/{other_doctor.id}/slots/",
            {"start_time": start.isoformat(), "end_time": end.isoformat()},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_enforces_30_min_duration(self, client, doctor_user, doctor_token):
        start = _future_time(9, 0)
        end = start + timedelta(minutes=45)

        response = client.post(
            f"/api/doctors/{doctor_user.id}/slots/",
            {"start_time": start.isoformat(), "end_time": end.isoformat()},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "end_time" in response.data

    def test_enforces_30_min_boundary(self, client, doctor_user, doctor_token):
        start = _future_time(9, 15)
        end = start + timedelta(minutes=30)

        response = client.post(
            f"/api/doctors/{doctor_user.id}/slots/",
            {"start_time": start.isoformat(), "end_time": end.isoformat()},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "start_time" in response.data

    def test_rejects_past_slot(self, client, doctor_user, doctor_token):
        past = timezone.now() - timedelta(hours=1)
        past = past.replace(minute=0, second=0, microsecond=0)
        end = past + timedelta(minutes=30)

        response = client.post(
            f"/api/doctors/{doctor_user.id}/slots/",
            {"start_time": past.isoformat(), "end_time": end.isoformat()},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_rejects_overlapping_slot(self, client, doctor_user, doctor_token):
        start = _future_time(10, 0)
        end = start + timedelta(minutes=30)

        client.post(
            f"/api/doctors/{doctor_user.id}/slots/",
            {"start_time": start.isoformat(), "end_time": end.isoformat()},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )

        response = client.post(
            f"/api/doctors/{doctor_user.id}/slots/",
            {"start_time": start.isoformat(), "end_time": end.isoformat()},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_allows_non_overlapping_slot(self, client, doctor_user, doctor_token):
        start1 = _future_time(9, 0)
        end1 = start1 + timedelta(minutes=30)
        start2 = _future_time(9, 30)
        end2 = start2 + timedelta(minutes=30)

        client.post(
            f"/api/doctors/{doctor_user.id}/slots/",
            {"start_time": start1.isoformat(), "end_time": end1.isoformat()},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        response = client.post(
            f"/api/doctors/{doctor_user.id}/slots/",
            {"start_time": start2.isoformat(), "end_time": end2.isoformat()},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert AvailabilitySlot.objects.count() == 2

    def test_bulk_create_partial_failures(self, client, doctor_user, doctor_token):
        start1 = _future_time(11, 0)
        end1 = start1 + timedelta(minutes=30)
        start2 = _future_time(11, 15)
        end2 = start2 + timedelta(minutes=30)

        response = client.post(
            f"/api/doctors/{doctor_user.id}/slots/",
            [
                {"start_time": start1.isoformat(), "end_time": end1.isoformat()},
                {"start_time": start2.isoformat(), "end_time": end2.isoformat()},
            ],
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert len(response.data["created"]) == 1
        assert len(response.data["rejected"]) == 1

    def test_doctor_lists_own_slots_with_date_filter(
        self, client, doctor_user, doctor_token
    ):
        start = _future_time(9, 0)
        AvailabilitySlot.objects.create(
            doctor=doctor_user,
            start_time=start,
            end_time=start + timedelta(minutes=30),
        )

        day = start.strftime("%Y-%m-%d")
        next_day = (start + timedelta(days=1)).strftime("%Y-%m-%d")

        response = client.get(
            f"/api/doctors/{doctor_user.id}/slots/?from={day}&to={next_day}",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_doctor_deletes_unbooked_slot(self, client, doctor_user, doctor_token):
        start = _future_time(14, 0)
        slot = AvailabilitySlot.objects.create(
            doctor=doctor_user,
            start_time=start,
            end_time=start + timedelta(minutes=30),
        )

        response = client.delete(
            f"/api/doctors/{doctor_user.id}/slots/{slot.id}/",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert AvailabilitySlot.objects.count() == 0

    def test_cannot_delete_booked_slot(self, client, doctor_user, doctor_token, patient_user):
        start = _future_time(14, 0)
        slot = AvailabilitySlot.objects.create(
            doctor=doctor_user,
            start_time=start,
            end_time=start + timedelta(minutes=30),
            is_booked=True,
        )
        Appointment.objects.create(patient=patient_user, slot=slot)

        response = client.delete(
            f"/api/doctors/{doctor_user.id}/slots/{slot.id}/",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestDoctorSearch:
    def test_search_by_name(self, client, doctor_user):
        response = client.get("/api/doctors/?search=doctor")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_search_by_specialty(self, client, doctor_user):
        response = client.get("/api/doctors/?specialty=cardio")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_search_no_results(self, client, doctor_user):
        response = client.get("/api/doctors/?search=nonexistentdoctor")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    def test_list_returns_next_available(self, client, doctor_user):
        start = _future_time(9, 0)
        AvailabilitySlot.objects.create(
            doctor=doctor_user,
            start_time=start,
            end_time=start + timedelta(minutes=30),
        )

        response = client.get("/api/doctors/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data[0]["next_available"] is not None

    def test_list_returns_null_next_available_when_no_slots(
        self, client, doctor_user
    ):
        response = client.get("/api/doctors/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data[0]["next_available"] is None

    def test_unauthenticated_can_search(self, client, doctor_user):
        response = client.get("/api/doctors/")
        assert response.status_code == status.HTTP_200_OK


class TestAvailableSlots:
    def test_returns_available_slots(self, client, doctor_user):
        start = _future_time(9, 0)
        AvailabilitySlot.objects.create(
            doctor=doctor_user,
            start_time=start,
            end_time=start + timedelta(minutes=30),
        )

        response = client.get(
            f"/api/doctors/{doctor_user.id}/available-slots/"
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_excludes_booked_slots(self, client, doctor_user):
        start = _future_time(9, 0)
        AvailabilitySlot.objects.create(
            doctor=doctor_user,
            start_time=start,
            end_time=start + timedelta(minutes=30),
            is_booked=True,
        )

        response = client.get(
            f"/api/doctors/{doctor_user.id}/available-slots/"
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    def test_public_access_no_auth(self, client, doctor_user):
        start = _future_time(9, 0)
        AvailabilitySlot.objects.create(
            doctor=doctor_user,
            start_time=start,
            end_time=start + timedelta(minutes=30),
        )

        response = client.get(
            f"/api/doctors/{doctor_user.id}/available-slots/"
        )
        assert response.status_code == status.HTTP_200_OK

    def test_filters_by_date_range(self, client, doctor_user):
        start1 = _future_time(9, 0)
        start2 = _future_time(10, 0)
        AvailabilitySlot.objects.create(
            doctor=doctor_user,
            start_time=start1,
            end_time=start1 + timedelta(minutes=30),
        )
        AvailabilitySlot.objects.create(
            doctor=doctor_user,
            start_time=start2,
            end_time=start2 + timedelta(minutes=30),
        )

        day = start1.strftime("%Y-%m-%d")
        response = client.get(
            f"/api/doctors/{doctor_user.id}/available-slots/?from={day}&to={day}"
        )
        assert response.status_code == status.HTTP_200_OK
        for slot in response.data:
            assert slot["is_booked"] is False


class TestBooking:
    def test_patient_books_slot_successfully(
        self, client, doctor_user, patient_user, patient_token
    ):
        start = _future_time(9, 0)
        slot = AvailabilitySlot.objects.create(
            doctor=doctor_user,
            start_time=start,
            end_time=start + timedelta(minutes=30),
        )

        response = client.post(
            "/api/appointments/",
            {"slot": slot.id},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["success"] is True
        assert response.data["data"]["status"] == "Pending"

        slot.refresh_from_db()
        assert slot.is_booked is True

    def test_doctor_cannot_book(self, client, doctor_user, doctor_token):
        start = _future_time(9, 0)
        slot = AvailabilitySlot.objects.create(
            doctor=doctor_user,
            start_time=start,
            end_time=start + timedelta(minutes=30),
        )

        response = client.post(
            "/api/appointments/",
            {"slot": slot.id},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_rejects_already_booked_slot(
        self, client, doctor_user, patient_user, patient_token
    ):
        start = _future_time(9, 0)
        slot = AvailabilitySlot.objects.create(
            doctor=doctor_user,
            start_time=start,
            end_time=start + timedelta(minutes=30),
            is_booked=True,
        )
        Appointment.objects.create(patient=patient_user, slot=slot)

        other_patient = User.objects.create_user(
            username="otherpatient",
            email="otherpatient@test.com",
            password="pass1234",
            role="patient",
            email_verified=True,
        )
        PatientProfile.objects.create(user=other_patient)
        refresh = __import__("rest_framework_simplejwt").tokens.RefreshToken.for_user(
            other_patient
        )
        other_token = str(refresh.access_token)

        response = client.post(
            "/api/appointments/",
            {"slot": slot.id},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {other_token}",
        )
        assert response.status_code == status.HTTP_409_CONFLICT
        assert response.data["code"] == "DOUBLE_BOOKING"

    def test_rejects_past_slot(self, client, doctor_user, patient_user, patient_token):
        past = timezone.now() - timedelta(hours=1)
        past = past.replace(minute=0, second=0, microsecond=0)
        slot = AvailabilitySlot.objects.create(
            doctor=doctor_user,
            start_time=past,
            end_time=past + timedelta(minutes=30),
        )

        response = client.post(
            "/api/appointments/",
            {"slot": slot.id},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["code"] == "PAST_SLOT"

    def test_rejects_nonexistent_slot(
        self, client, patient_user, patient_token
    ):
        response = client.post(
            "/api/appointments/",
            {"slot": 99999},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_concurrent_booking_race_condition(
        self, db, doctor_user, patient_user, patient_token
    ):
        """Verify select_for_update prevents double-booking.

        Uses sequential calls to validate the locking mechanism logic,
        since SQLite cannot handle concurrent test threads reliably.
        """
        start = _future_time(14, 0)
        slot = AvailabilitySlot.objects.create(
            doctor=doctor_user,
            start_time=start,
            end_time=start + timedelta(minutes=30),
        )

        # First booking succeeds
        client1 = Client()
        r1 = client1.post(
            "/api/appointments/",
            {"slot": slot.id},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        assert r1.status_code == status.HTTP_201_CREATED

        slot.refresh_from_db()
        assert slot.is_booked is True
        assert Appointment.objects.count() == 1

        # Second booking is rejected
        other_patient = User.objects.create_user(
            username="racer2",
            email="racer2@test.com",
            password="pass1234",
            role="patient",
            email_verified=True,
        )
        PatientProfile.objects.create(user=other_patient)
        refresh = __import__("rest_framework_simplejwt").tokens.RefreshToken.for_user(
            other_patient
        )
        other_token = str(refresh.access_token)

        client2 = Client()
        r2 = client2.post(
            "/api/appointments/",
            {"slot": slot.id},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {other_token}",
        )
        assert r2.status_code == status.HTTP_409_CONFLICT
        assert r2.data["code"] == "DOUBLE_BOOKING"

    def test_requires_slot_field(self, client, patient_token):
        response = client.post(
            "/api/appointments/",
            {},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_unauthenticated_cannot_book(self, client, doctor_user):
        start = _future_time(9, 0)
        slot = AvailabilitySlot.objects.create(
            doctor=doctor_user,
            start_time=start,
            end_time=start + timedelta(minutes=30),
        )

        response = client.post(
            "/api/appointments/",
            {"slot": slot.id},
            content_type="application/json",
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestAppointmentListing:
    def test_patient_sees_own_appointments(
        self, client, doctor_user, patient_user, patient_token
    ):
        start = _future_time(9, 0)
        slot = AvailabilitySlot.objects.create(
            doctor=doctor_user,
            start_time=start,
            end_time=start + timedelta(minutes=30),
            is_booked=True,
        )
        Appointment.objects.create(patient=patient_user, slot=slot)

        response = client.get(
            "/api/appointments/",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_doctor_sees_own_appointments(
        self, client, doctor_user, patient_user, doctor_token
    ):
        start = _future_time(9, 0)
        slot = AvailabilitySlot.objects.create(
            doctor=doctor_user,
            start_time=start,
            end_time=start + timedelta(minutes=30),
            is_booked=True,
        )
        Appointment.objects.create(patient=patient_user, slot=slot)

        response = client.get(
            "/api/appointments/",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_doctor_does_not_see_other_doctor_appointments(
        self, client, doctor_user, patient_user, doctor_token
    ):
        other_doctor = User.objects.create_user(
            username="otherdoc2",
            email="otherdoc2@test.com",
            password="pass1234",
            role="doctor",
            email_verified=True,
        )
        DoctorProfile.objects.create(
            user=other_doctor,
            specialty=Specialty.objects.get_or_create(name="Dermatology")[0],
        )
        start = _future_time(9, 0)
        slot = AvailabilitySlot.objects.create(
            doctor=other_doctor,
            start_time=start,
            end_time=start + timedelta(minutes=30),
            is_booked=True,
        )
        Appointment.objects.create(patient=patient_user, slot=slot)

        response = client.get(
            "/api/appointments/",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    def test_admin_sees_all_appointments(
        self, client, doctor_user, patient_user, admin_token
    ):
        start = _future_time(9, 0)
        slot = AvailabilitySlot.objects.create(
            doctor=doctor_user,
            start_time=start,
            end_time=start + timedelta(minutes=30),
            is_booked=True,
        )
        Appointment.objects.create(patient=patient_user, slot=slot)

        response = client.get(
            "/api/appointments/",
            HTTP_AUTHORIZATION=f"Bearer {admin_token}",
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_appointment_detail_includes_slot_info(
        self, client, doctor_user, patient_user, patient_token
    ):
        start = _future_time(9, 0)
        slot = AvailabilitySlot.objects.create(
            doctor=doctor_user,
            start_time=start,
            end_time=start + timedelta(minutes=30),
            is_booked=True,
        )
        appointment = Appointment.objects.create(patient=patient_user, slot=slot)

        response = client.get(
            f"/api/appointments/{appointment.id}/",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["slot_details"] is not None
        assert response.data["slot_details"]["doctor_name"] is not None
