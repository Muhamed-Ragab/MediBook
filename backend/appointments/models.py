from datetime import timedelta

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class AvailabilitySlot(models.Model):
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="availability_slots",
        limit_choices_to={"role": "doctor"},
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_booked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["doctor", "start_time"],
                name="unique_doctor_start_time",
            ),
        ]
        ordering = ["start_time"]

    def clean(self):
        errors = {}

        if self.start_time and self.end_time:
            if self.end_time <= self.start_time:
                errors["end_time"] = "End time must be after start time."

            duration = self.end_time - self.start_time
            if duration != timedelta(minutes=30):
                errors["end_time"] = "Slot must be exactly 30 minutes long."

        if self.start_time:
            if self.start_time.minute not in (0, 30) or self.start_time.second != 0:
                errors["start_time"] = (
                    "Start time must be on a 30-minute boundary (e.g., 09:00, 09:30)."
                )

            if self.start_time <= timezone.now():
                errors["start_time"] = "Start time must be in the future."

        if self.start_time and self.end_time and self.doctor_id and not errors.get("end_time"):
            qs = AvailabilitySlot.objects.filter(
                doctor=self.doctor,
                start_time__lt=self.end_time,
                end_time__gt=self.start_time,
            )
            if self.pk:
                qs = qs.exclude(pk=self.pk)
            if qs.exists():
                errors["start_time"] = "This slot overlaps with an existing slot."

        if errors:
            raise ValidationError(errors)

    def __str__(self):
        return f"{self.doctor.username} — {self.start_time.strftime('%a %d %b %H:%M')}"


class Appointment(models.Model):
    class Status(models.TextChoices):
        PENDING = "Pending", "Pending"
        CONFIRMED = "Confirmed", "Confirmed"
        COMPLETED = "Completed", "Completed"
        CANCELLED = "Cancelled", "Cancelled"

    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="appointments",
        limit_choices_to={"role": "patient"},
    )
    slot = models.OneToOneField(
        AvailabilitySlot,
        on_delete=models.CASCADE,
        related_name="appointment",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    doctor_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.patient.username} → Dr.{self.slot.doctor.username} @ {self.slot.start_time}"
