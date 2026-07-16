from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers

from .models import Appointment, AvailabilitySlot


class SlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AvailabilitySlot
        fields = ["id", "start_time", "end_time", "is_booked", "doctor"]
        read_only_fields = ["id", "is_booked", "doctor"]

    def validate(self, data):
        if data["start_time"].minute not in (0, 30) or data["start_time"].second != 0:
            raise serializers.ValidationError(
                {"start_time": "Start time must be on a 30-minute boundary (e.g., 09:00, 09:30)."}
            )

        if data["end_time"] - data["start_time"] != timedelta(minutes=30):
            raise serializers.ValidationError(
                {"end_time": "Slot must be exactly 30 minutes long."}
            )

        if data["start_time"] <= timezone.now():
            raise serializers.ValidationError(
                {"start_time": "Start time must be in the future."}
            )

        return data


class NestedSlotSerializer(serializers.ModelSerializer):
    doctor_name = serializers.SerializerMethodField()

    class Meta:
        model = AvailabilitySlot
        fields = ["id", "doctor_name", "start_time", "end_time", "is_booked"]

    def get_doctor_name(self, obj):
        return obj.doctor.get_full_name() or obj.doctor.username


class AppointmentSerializer(serializers.ModelSerializer):
    slot_details = NestedSlotSerializer(source="slot", read_only=True)
    patient_name = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            "id", "patient", "patient_name", "slot", "slot_details",
            "status", "doctor_notes", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "patient", "patient_name", "status",
            "created_at", "updated_at", "slot_details",
        ]
        extra_kwargs = {"slot": {"write_only": True}}

    def get_patient_name(self, obj):
        return obj.patient.get_full_name() or obj.patient.username


class SlotCreateResponseSerializer(serializers.Serializer):
    created = SlotSerializer(many=True, read_only=True)
    rejected = serializers.ListField(read_only=True)
