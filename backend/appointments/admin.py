from django.contrib import admin

from .models import Appointment, AvailabilitySlot


@admin.register(AvailabilitySlot)
class AvailabilitySlotAdmin(admin.ModelAdmin):
    list_display = ("doctor", "start_time", "end_time", "is_booked")
    list_filter = ("is_booked", "doctor")
    search_fields = ("doctor__username", "doctor__email")


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ("patient", "slot", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("patient__username", "slot__doctor__username")
