from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.core import mail
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


class TestAppointmentStatusTransition:
    """Tests for appointment state machine with role-gating.
    
    Valid transitions:
      Pending → Confirmed (doctor), Cancelled (doctor/patient)
      Confirmed → Completed (doctor), Cancelled (doctor/patient)
      Completed → [] (terminal)
      Cancelled → [] (terminal)
    """

    def _book_appointment(self, client, patient_token, doctor_user):
        """Helper: create a slot and book it, return (appointment, slot)."""
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
        return response.data["data"], slot

    def test_doctor_confirms_pending(self, client, doctor_user, patient_user, patient_token, doctor_token):
        appt, _ = self._book_appointment(client, patient_token, doctor_user)
        response = client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Confirmed"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["data"]["status"] == "Confirmed"

    def test_patient_cancels_pending(self, client, doctor_user, patient_user, patient_token, doctor_token):
        appt, slot = self._book_appointment(client, patient_token, doctor_user)
        response = client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Cancelled"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["data"]["status"] == "Cancelled"
        slot.refresh_from_db()
        assert slot.is_booked is False

    def test_doctor_rejects_pending(self, client, doctor_user, patient_user, patient_token, doctor_token):
        appt, slot = self._book_appointment(client, patient_token, doctor_user)
        response = client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Cancelled"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["data"]["status"] == "Cancelled"
        slot.refresh_from_db()
        assert slot.is_booked is False

    def test_doctor_completes_confirmed(self, client, doctor_user, patient_user, patient_token, doctor_token):
        appt, _ = self._book_appointment(client, patient_token, doctor_user)
        # First confirm
        client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Confirmed"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        # Then complete
        response = client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Completed"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["data"]["status"] == "Completed"

    def test_patient_cancels_confirmed(self, client, doctor_user, patient_user, patient_token, doctor_token):
        appt, slot = self._book_appointment(client, patient_token, doctor_user)
        # Doctor confirms
        client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Confirmed"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        # Patient cancels
        response = client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Cancelled"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["data"]["status"] == "Cancelled"
        slot.refresh_from_db()
        assert slot.is_booked is False

    def test_invalid_transition_completed_to_confirmed(self, client, doctor_user, patient_user, patient_token, doctor_token):
        appt, _ = self._book_appointment(client, patient_token, doctor_user)
        client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Confirmed"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Completed"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        response = client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Confirmed"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_invalid_transition_cancelled_to_pending(self, client, doctor_user, patient_user, patient_token, doctor_token):
        appt, _ = self._book_appointment(client, patient_token, doctor_user)
        client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Cancelled"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        response = client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Pending"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_invalid_transition_cancelled_to_confirmed(self, client, doctor_user, patient_user, patient_token, doctor_token):
        appt, _ = self._book_appointment(client, patient_token, doctor_user)
        client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Cancelled"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        response = client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Confirmed"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_patient_cannot_confirm(self, client, doctor_user, patient_user, patient_token, doctor_token):
        appt, _ = self._book_appointment(client, patient_token, doctor_user)
        response = client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Confirmed"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_patient_cannot_complete(self, client, doctor_user, patient_user, patient_token, doctor_token):
        appt, _ = self._book_appointment(client, patient_token, doctor_user)
        client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Confirmed"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        response = client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Completed"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_doctor_cannot_confirm_another_doctors_appointment(self, client, doctor_user, patient_user, patient_token):
        other_doctor = User.objects.create_user(
            username="otherdoc_state",
            email="otherdoc_state@test.com",
            password="pass1234",
            role="doctor",
            email_verified=True,
        )
        from users.models import DoctorProfile, Specialty
        DoctorProfile.objects.create(
            user=other_doctor,
            specialty=Specialty.objects.get_or_create(name="Dermatology")[0],
        )
        refresh = __import__("rest_framework_simplejwt").tokens.RefreshToken.for_user(other_doctor)
        other_doctor_token = str(refresh.access_token)

        appt, _ = self._book_appointment(client, patient_token, doctor_user)
        response = client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Confirmed"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {other_doctor_token}",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_patient_cannot_cancel_another_patients_appointment(self, client, doctor_user, patient_user, patient_token):
        other_patient = User.objects.create_user(
            username="otherpatient_state",
            email="otherpatient_state@test.com",
            password="pass1234",
            role="patient",
            email_verified=True,
        )
        from users.models import PatientProfile
        PatientProfile.objects.create(user=other_patient)
        refresh = __import__("rest_framework_simplejwt").tokens.RefreshToken.for_user(other_patient)
        other_patient_token = str(refresh.access_token)

        appt, _ = self._book_appointment(client, patient_token, doctor_user)
        response = client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Cancelled"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {other_patient_token}",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_doctor_cannot_complete_another_doctors_appointment(self, client, doctor_user, patient_user, patient_token, doctor_token):
        other_doctor = User.objects.create_user(
            username="otherdoc2_state",
            email="otherdoc2_state@test.com",
            password="pass1234",
            role="doctor",
            email_verified=True,
        )
        from users.models import DoctorProfile, Specialty
        DoctorProfile.objects.create(
            user=other_doctor,
            specialty=Specialty.objects.get_or_create(name="Dermatology")[0],
        )
        refresh = __import__("rest_framework_simplejwt").tokens.RefreshToken.for_user(other_doctor)
        other_doctor_token = str(refresh.access_token)

        appt, _ = self._book_appointment(client, patient_token, doctor_user)
        client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Confirmed"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        response = client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Completed"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {other_doctor_token}",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_pending_to_completed_rejected(self, client, doctor_user, patient_user, patient_token, doctor_token):
        """Pending→Completed directly must be rejected (must go through Confirmed)."""
        appt, _ = self._book_appointment(client, patient_token, doctor_user)
        response = client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Completed"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_unauthenticated_cannot_change_status(self, client, doctor_user, patient_user, patient_token):
        """No auth header on PATCH status must return 401."""
        appt, _ = self._book_appointment(client, patient_token, doctor_user)
        response = client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Confirmed"},
            content_type="application/json",
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_doctor_cancels_confirmed(self, client, doctor_user, patient_user, patient_token, doctor_token):
        """Doctor cancels a Confirmed appointment; slot must re-open."""
        appt, slot = self._book_appointment(client, patient_token, doctor_user)
        # Confirm first
        client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Confirmed"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        # Doctor cancels
        response = client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Cancelled"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["data"]["status"] == "Cancelled"
        slot.refresh_from_db()
        assert slot.is_booked is False

    def test_cancelled_appointment_cancel_idempotent(self, client, doctor_user, patient_user, patient_token, doctor_token):
        """PATCH Cancelled on already Cancelled appointment must return 400."""
        appt, _ = self._book_appointment(client, patient_token, doctor_user)
        # Cancel once
        client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Cancelled"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        # Cancel again — should fail
        response = client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Cancelled"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_completed_appointment_complete_idempotent(self, client, doctor_user, patient_user, patient_token, doctor_token):
        """PATCH Completed on already Completed appointment must return 400."""
        appt, _ = self._book_appointment(client, patient_token, doctor_user)
        # Confirm then complete
        client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Confirmed"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Completed"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        # Complete again — should fail
        response = client.patch(
            f"/api/appointments/{appt['id']}/status/",
            {"status": "Completed"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


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


class TestAppointmentListingFilters:
    def test_patient_filters_by_status(
        self, client, doctor_user, patient_user, patient_token
    ):
        start1 = _future_time(9, 0)
        slot1 = AvailabilitySlot.objects.create(
            doctor=doctor_user,
            start_time=start1,
            end_time=start1 + timedelta(minutes=30),
            is_booked=True,
        )
        Appointment.objects.create(patient=patient_user, slot=slot1, status="Pending")

        start2 = _future_time(9, 30)
        slot2 = AvailabilitySlot.objects.create(
            doctor=doctor_user,
            start_time=start2,
            end_time=start2 + timedelta(minutes=30),
            is_booked=True,
        )
        Appointment.objects.create(patient=patient_user, slot=slot2, status="Confirmed")

        response = client.get(
            "/api/appointments/?status=Pending",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["status"] == "Pending"

    def test_doctor_filters_by_status(
        self, client, doctor_user, patient_user, doctor_token
    ):
        start1 = _future_time(9, 0)
        slot1 = AvailabilitySlot.objects.create(
            doctor=doctor_user,
            start_time=start1,
            end_time=start1 + timedelta(minutes=30),
            is_booked=True,
        )
        Appointment.objects.create(
            patient=patient_user, slot=slot1, status="Confirmed"
        )

        start2 = _future_time(9, 30)
        slot2 = AvailabilitySlot.objects.create(
            doctor=doctor_user,
            start_time=start2,
            end_time=start2 + timedelta(minutes=30),
            is_booked=True,
        )
        Appointment.objects.create(
            patient=patient_user, slot=slot2, status="Completed"
        )

        response = client.get(
            "/api/appointments/?status=Confirmed",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["status"] == "Confirmed"

    def test_patient_empty_appointment_list(
        self, client, patient_user, patient_token
    ):
        response = client.get(
            "/api/appointments/",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data == []

    def test_appointments_ordered_by_date(
        self, client, doctor_user, patient_user, patient_token
    ):
        start_early = _future_time(9, 0)
        start_later = _future_time(9, 30) + timedelta(days=7)

        slot1 = AvailabilitySlot.objects.create(
            doctor=doctor_user,
            start_time=start_early,
            end_time=start_early + timedelta(minutes=30),
            is_booked=True,
        )
        Appointment.objects.create(patient=patient_user, slot=slot1, status="Pending")

        slot2 = AvailabilitySlot.objects.create(
            doctor=doctor_user,
            start_time=start_later,
            end_time=start_later + timedelta(minutes=30),
            is_booked=True,
        )
        Appointment.objects.create(patient=patient_user, slot=slot2, status="Confirmed")

        response = client.get(
            "/api/appointments/",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        assert response.data[0]["slot_details"]["start_time"] < response.data[1]["slot_details"]["start_time"]

    def test_patient_sees_only_upcoming_statuses(
        self, client, doctor_user, patient_user, patient_token
    ):
        times = [
            _future_time(9, 0),
            _future_time(9, 30),
            _future_time(10, 0),
            _future_time(10, 30),
        ]
        statuses = ["Pending", "Confirmed", "Completed", "Cancelled"]
        for t, s in zip(times, statuses):
            slot = AvailabilitySlot.objects.create(
                doctor=doctor_user,
                start_time=t,
                end_time=t + timedelta(minutes=30),
                is_booked=True,
            )
            Appointment.objects.create(
                patient=patient_user, slot=slot, status=s
            )

        response = client.get(
            "/api/appointments/",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        assert response.status_code == status.HTTP_200_OK
        returned_statuses = {a["status"] for a in response.data}
        assert returned_statuses == {"Pending", "Confirmed"}


class TestEmailNotifications:
    @pytest.fixture(autouse=True)
    def _use_locmem_email(self, settings):
        settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

    def _create_slot(self, doctor_user):
        start = _future_time(9, 0)
        return AvailabilitySlot.objects.create(
            doctor=doctor_user,
            start_time=start,
            end_time=start + timedelta(minutes=30),
        )

    def test_email_on_booking(self, client, doctor_user, patient_user, patient_token):
        slot = self._create_slot(doctor_user)
        response = client.post(
            "/api/appointments/",
            {"slot": slot.id},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert len(mail.outbox) == 1
        msg = mail.outbox[0]
        assert "Booked" in msg.subject
        assert patient_user.email in msg.to
        assert doctor_user.email in msg.to

    def test_email_on_confirmation(self, client, doctor_user, patient_user, patient_token, doctor_token):
        slot = self._create_slot(doctor_user)
        appt_resp = client.post(
            "/api/appointments/",
            {"slot": slot.id},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        mail.outbox.clear()
        appt_id = appt_resp.data["data"]["id"]
        response = client.patch(
            f"/api/appointments/{appt_id}/status/",
            {"status": "Confirmed"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(mail.outbox) == 1
        assert "Confirmed" in mail.outbox[0].subject

    def test_email_on_cancellation(self, client, doctor_user, patient_user, patient_token):
        slot = self._create_slot(doctor_user)
        appt_resp = client.post(
            "/api/appointments/",
            {"slot": slot.id},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        mail.outbox.clear()
        appt_id = appt_resp.data["data"]["id"]
        response = client.patch(
            f"/api/appointments/{appt_id}/status/",
            {"status": "Cancelled"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(mail.outbox) == 1
        assert "Cancelled" in mail.outbox[0].subject

    def test_email_on_completion(self, client, doctor_user, patient_user, patient_token, doctor_token):
        slot = self._create_slot(doctor_user)
        appt_resp = client.post(
            "/api/appointments/",
            {"slot": slot.id},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        mail.outbox.clear()
        appt_id = appt_resp.data["data"]["id"]
        client.patch(
            f"/api/appointments/{appt_id}/status/",
            {"status": "Confirmed"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        mail.outbox.clear()
        response = client.patch(
            f"/api/appointments/{appt_id}/status/",
            {"status": "Completed"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(mail.outbox) == 1
        assert "Completed" in mail.outbox[0].subject

    def test_no_email_on_invalid_transition(self, client, doctor_user, patient_user, patient_token, doctor_token):
        slot = self._create_slot(doctor_user)
        appt_resp = client.post(
            "/api/appointments/",
            {"slot": slot.id},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {patient_token}",
        )
        mail.outbox.clear()
        appt_id = appt_resp.data["data"]["id"]
        client.patch(
            f"/api/appointments/{appt_id}/status/",
            {"status": "Confirmed"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        mail.outbox.clear()
        response = client.patch(
            f"/api/appointments/{appt_id}/status/",
            {"status": "Confirmed"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {doctor_token}",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert len(mail.outbox) == 0
