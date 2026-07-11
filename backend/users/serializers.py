from django.contrib.auth import get_user_model
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
