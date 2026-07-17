from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

from .models import DoctorProfile, PatientProfile, Specialty

User = get_user_model()


class SpecialtySerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialty
        fields = "__all__"


class UserAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "username", "email", "role",
            "first_name", "last_name",
            "is_approved", "is_blocked", "email_verified",
        ]
        read_only_fields = ["id", "email_verified"]


class DoctorProfileSerializer(serializers.ModelSerializer):
    specialty = serializers.SlugRelatedField(
        slug_field="name", queryset=Specialty.objects.all(), required=False
    )

    class Meta:
        model = DoctorProfile
        fields = ["id", "specialty", "bio", "phone", "photo_url"]
        read_only_fields = ["id"]


class PatientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientProfile
        fields = ["id", "phone", "date_of_birth", "emergency_contact"]
        read_only_fields = ["id"]


class DoctorProfileListSerializer(serializers.ModelSerializer):
    specialty = serializers.SlugRelatedField(
        slug_field="name", queryset=Specialty.objects.all(), required=False
    )
    next_available = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()

    class Meta:
        model = DoctorProfile
        fields = ["id", "name", "specialty", "bio", "phone", "photo_url", "next_available"]
        read_only_fields = ["id"]

    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_next_available(self, obj):
        from appointments.models import AvailabilitySlot

        next_slot = (
            AvailabilitySlot.objects.filter(
                doctor=obj.user,
                is_booked=False,
                start_time__gt=timezone.now(),
            )
            .order_by("start_time")
            .first()
        )
        if next_slot:
            return next_slot.start_time
        return None


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=["doctor", "patient"])
    first_name = serializers.CharField(required=False, default="")
    last_name = serializers.CharField(required=False, default="")
    # Doctor-specific
    specialty = serializers.CharField(required=False, allow_blank=True, default="")
    bio = serializers.CharField(required=False, allow_blank=True, default="")
    # Patient-specific
    phone = serializers.CharField(required=False, allow_blank=True, default="")
    date_of_birth = serializers.DateField(required=False, allow_null=True, default=None)
    emergency_contact = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate(self, data):
        if data.get("role") == "doctor" and not data.get("specialty"):
            raise serializers.ValidationError({"specialty": "Specialty is required for doctors."})
        if data.get("role") == "doctor" and data.get("specialty"):
            specialty_qs = Specialty.objects.filter(name__iexact=data["specialty"])
            if specialty_qs.exists():
                data["specialty"] = specialty_qs.first().name
        return data

    def create(self, validated_data):
        role = validated_data["role"]
        username = validated_data["email"].split("@")[0]
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        user = User.objects.create_user(
            username=username,
            email=validated_data["email"],
            password=validated_data["password"],
            role=role,
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            is_approved=(role == "patient"),  # Patients auto-approved
        )

        if role == "doctor":
            specialty_obj, _ = Specialty.objects.get_or_create(
                name=validated_data.get("specialty", "") or "General"
            )
            DoctorProfile.objects.create(
                user=user,
                specialty=specialty_obj,
                bio=validated_data.get("bio", ""),
            )
        elif role == "patient":
            PatientProfile.objects.create(
                user=user,
                phone=validated_data.get("phone", ""),
                date_of_birth=validated_data.get("date_of_birth"),
                emergency_contact=validated_data.get("emergency_contact", ""),
            )

        return user


class UserSerializer(serializers.ModelSerializer):
    doctor_profile = DoctorProfileSerializer(read_only=True)
    patient_profile = PatientProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "role",
            "first_name", "last_name",
            "is_approved", "is_blocked", "email_verified",
            "doctor_profile", "patient_profile",
        ]
        read_only_fields = ["id", "email_verified"]
