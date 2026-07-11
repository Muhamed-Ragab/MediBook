from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import DoctorProfile, PatientProfile

User = get_user_model()


class DoctorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorProfile
        fields = ["specialty", "bio", "phone", "photo_url"]


class PatientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientProfile
        fields = ["phone", "date_of_birth", "emergency_contact"]


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

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

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
            DoctorProfile.objects.create(
                user=user,
                specialty=validated_data.get("specialty", ""),
                bio=validated_data.get("bio", ""),
            )
        elif role == "patient":
            PatientProfile.objects.create(
                user=user,
                phone=validated_data.get("phone", ""),
                date_of_birth=validated_data.get("date_of_birth"),
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
