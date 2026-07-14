from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from users.models import DoctorProfile

from .models import Appointment, AvailabilitySlot
from .serializers import AppointmentSerializer, SlotSerializer


class SlotViewSet(viewsets.ModelViewSet):
    serializer_class = SlotSerializer
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        return AvailabilitySlot.objects.filter(
            doctor__doctor_profile__id=self.kwargs["doctor_pk"]
        )

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        doctor_pk = self.kwargs.get("doctor_pk")
        profile = get_object_or_404(DoctorProfile, pk=doctor_pk)
        if request.user.pk != profile.user_id and not request.user.is_staff:
            self.permission_denied(
                request,
                message="You can only manage your own availability slots.",
            )

    def perform_create(self, serializer):
        profile = get_object_or_404(DoctorProfile, pk=self.kwargs["doctor_pk"])
        start = serializer.validated_data["start_time"]
        end = serializer.validated_data["end_time"]
        if AvailabilitySlot.objects.filter(
            doctor_id=profile.user_id,
            start_time__lt=end,
            end_time__gt=start,
        ).exists():
            from rest_framework.exceptions import ValidationError as DRFValidationError
            raise DRFValidationError(
                {"start_time": "This slot overlaps with an existing slot."}
            )
        serializer.save(doctor_id=profile.user_id)

    def create(self, request, *args, **kwargs):
        if isinstance(request.data, list):
            return self._bulk_create(request, *args, **kwargs)
        return super().create(request, *args, **kwargs)

    def _bulk_create(self, request, *args, **kwargs):
        created = []
        rejected = []
        with transaction.atomic():
            for item in request.data:
                serializer = self.get_serializer(data=item)
                if serializer.is_valid():
                    self.perform_create(serializer)
                    created.append(serializer.data)
                else:
                    rejected.append({"data": item, "errors": serializer.errors})
        return Response(
            {"created": created, "rejected": rejected},
            status=status.HTTP_201_CREATED,
        )

    def perform_destroy(self, instance):
        if instance.is_booked:
            self.permission_denied(
                self.request,
                message="Cannot delete a booked slot. Cancel the appointment first.",
            )
        instance.delete()


VALID_TRANSITIONS = {
    "Cancelled": ["Pending", "Confirmed"],
}


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Appointment.objects.select_related("slot__doctor", "patient").all()
        if user.role == "doctor":
            return Appointment.objects.select_related("slot__doctor", "patient").filter(
                slot__doctor=user
            )
        return Appointment.objects.select_related("slot__doctor", "patient").filter(
            patient=user
        )

    def perform_create(self, serializer):
        serializer.save(patient=self.request.user)

    def perform_update(self, serializer):
        appointment = self.get_object()
        new_status = serializer.validated_data.get("status")
        if new_status:
            allowed_prior = VALID_TRANSITIONS.get(new_status, [])
            if appointment.status not in allowed_prior:
                from rest_framework.exceptions import ValidationError as DRFValidationError
                raise DRFValidationError(
                    f"Cannot transition from '{appointment.status}' to '{new_status}'."
                )
        serializer.save()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        new_status = request.data.get("status")

        if new_status == "Cancelled":
            allowed = VALID_TRANSITIONS.get("Cancelled", [])
            if instance.status not in allowed:
                return Response(
                    {"success": False, "error": f"Cannot cancel a {instance.status} appointment.", "code": "INVALID_TRANSITION"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            with transaction.atomic():
                slot = AvailabilitySlot.objects.select_for_update().get(pk=instance.slot_id)
                instance.status = "Cancelled"
                instance.save(update_fields=["status"])
                slot.is_booked = False
                slot.save(update_fields=["is_booked"])
            serializer = self.get_serializer(instance)
            return Response({"success": True, "data": serializer.data, "error": None})

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        slot_id = request.data.get("slot")
        if not slot_id:
            return Response(
                {"success": False, "error": "slot is required", "code": "VALIDATION_ERROR"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            slot = AvailabilitySlot.objects.select_for_update().get(id=slot_id)
        except AvailabilitySlot.DoesNotExist:
            return Response(
                {"success": False, "error": "Slot not found.", "code": "NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if slot.is_booked:
            return Response(
                {
                    "success": False,
                    "error": "Slot just got booked.",
                    "code": "DOUBLE_BOOKING",
                },
                status=status.HTTP_409_CONFLICT,
            )

        if slot.start_time <= timezone.now():
            return Response(
                {"success": False, "error": "Cannot book a past slot.", "code": "PAST_SLOT"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.user.role != "patient":
            return Response(
                {
                    "success": False,
                    "error": "Only patients can book appointments.",
                    "code": "FORBIDDEN",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        slot.is_booked = True
        slot.save(update_fields=["is_booked"])

        appointment = Appointment.objects.create(
            patient=request.user,
            slot=slot,
        )
        serializer = self.get_serializer(appointment)
        return Response(
            {"success": True, "data": serializer.data, "error": None},
            status=status.HTTP_201_CREATED,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def available_slots_view(request, doctor_pk):
    profile = get_object_or_404(DoctorProfile, pk=doctor_pk)
    slots = AvailabilitySlot.objects.filter(
        doctor_id=profile.user_id,
        is_booked=False,
        start_time__gt=timezone.now(),
    )

    from_date = request.query_params.get("from")
    to_date = request.query_params.get("to")
    if from_date:
        slots = slots.filter(start_time__gte=from_date)
    if to_date:
        slots = slots.filter(end_time__lte=to_date)

    slots = slots.order_by("start_time")
    serializer = SlotSerializer(slots, many=True)
    return Response(serializer.data)
