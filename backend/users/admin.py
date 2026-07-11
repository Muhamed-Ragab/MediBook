from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import DoctorProfile, PatientProfile, User


class DoctorProfileInline(admin.StackedInline):
    model = DoctorProfile
    can_delete = False


class PatientProfileInline(admin.StackedInline):
    model = PatientProfile
    can_delete = False


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "username",
        "email",
        "role",
        "is_approved",
        "is_blocked",
        "email_verified",
        "is_active",
    )
    list_filter = ("role", "is_approved", "is_blocked", "is_active")
    fieldsets = UserAdmin.fieldsets + (
        ("Role Info", {"fields": ("role", "is_approved", "is_blocked", "email_verified")}),
    )
    inlines = [DoctorProfileInline, PatientProfileInline]


@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "specialty", "phone")
    search_fields = ("user__username", "user__email", "specialty")


@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "phone", "date_of_birth")
    search_fields = ("user__username", "user__email")
