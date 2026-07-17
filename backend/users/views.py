import logging

from django.conf import settings
from django.contrib.auth import get_user_model, authenticate
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
import django_filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import SearchFilter
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView as SimpleJWTRefreshView

from .models import DoctorProfile, PatientProfile, Specialty, User
from .serializers import (
    DoctorProfileListSerializer,
    DoctorProfileSerializer,
    PatientProfileSerializer,
    RegisterSerializer,
    SpecialtySerializer,
    UserAdminSerializer,
    UserSerializer,
)
from .tokens import email_verification_token

logger = logging.getLogger(__name__)
UserModel = get_user_model()


@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {"success": False, "data": None, "error": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = serializer.save()

    # Send verification email
    token = email_verification_token.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    verification_url = (
        f"{settings.FRONTEND_URL}/verify-email?uid={uid}&token={token}"
    )

    try:
        text = (
            f"Hi {user.username},\n\n"
            f"Please verify your email by clicking the link below:\n"
            f"{verification_url}\n\n"
            f"Thank you,\nMediBook Team"
        )
        html = f"""<!DOCTYPE html>
<html><body style="font-family:sans-serif;padding:24px;background:#f4f7f9">
<table align="center" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#fff;border-radius:12px;overflow:hidden">
<tr><td style="background:#0d3b48;padding:24px;text-align:center;color:#fff;font-size:20px;font-weight:bold">MediBook</td></tr>
<tr><td style="padding:24px">
<p style="margin:0 0 16px;color:#333">Hi {user.username},</p>
<p style="margin:0 0 16px;color:#555">Please verify your email address to start booking appointments.</p>
<table cellpadding="0" cellspacing="0" style="margin:24px auto"><tr><td style="background:#0d3b48;border-radius:8px;padding:12px 32px">
<a href="{verification_url}" style="color:#fff;text-decoration:none;font-size:15px;font-weight:bold;display:inline-block">Verify Email</a>
</td></tr></table>
<p style="margin:16px 0 0;color:#999;font-size:13px">Or paste this link in your browser:<br><a href="{verification_url}" style="color:#0d3b48">{verification_url}</a></p>
</td></tr>
<tr><td style="background:#eee;padding:16px;text-align:center;color:#888;font-size:12px">MediBook &mdash; Medical Appointment System</td></tr>
</table></body></html>"""
        msg = EmailMultiAlternatives(
            subject="Verify your MediBook account",
            body=text,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        msg.attach_alternative(html, "text/html")
        msg.send(fail_silently=False)
    except Exception:
        logger.exception("Failed to send verification email to %s", user.email)

    refresh = RefreshToken.for_user(user)
    user_data = UserSerializer(user).data

    return Response(
        {
            "success": True,
            "data": {
                "user": user_data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            "error": None,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def verify_email_view(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = UserModel.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, UserModel.DoesNotExist):
        return Response(
            {"success": False, "data": None, "error": "Invalid verification link."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if email_verification_token.check_token(user, token):
        user.email_verified = True
        user.save(update_fields=["email_verified"])
        return Response(
            {"success": True, "data": {"message": "Email verified successfully."}, "error": None}
        )

    return Response(
        {"success": False, "data": None, "error": "Invalid or expired verification link."},
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response(
            {"success": False, "data": None, "error": "Email and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Find user by email and authenticate by username
    try:
        user = UserModel.objects.get(email=email)
    except UserModel.DoesNotExist:
        return Response(
            {"success": False, "data": None, "error": "Invalid credentials."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    user = authenticate(username=user.username, password=password)
    if user is None:
        return Response(
            {"success": False, "data": None, "error": "Invalid credentials."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.email_verified:
        return Response(
            {
                "success": False,
                "data": None,
                "error": "Please verify your email before logging in.",
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if user.is_blocked:
        return Response(
            {
                "success": False,
                "data": None,
                "error": "Your account has been blocked. Contact support.",
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    refresh = RefreshToken.for_user(user)
    return Response(
        {
            "success": True,
            "data": {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "role": user.role,
                },
            },
            "error": None,
        }
    )


class BlockedAwareRefreshView(SimpleJWTRefreshView):
    """Refresh endpoint that also rejects blocked accounts.

    A blocked user who already holds a valid refresh token would otherwise
    stay authenticated until the token expires. Decoding the refresh token
    lets us revoke their session as soon as the account is blocked.
    """

    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get("refresh")
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                user_id = token.payload.get("user_id")
                if user_id is not None:
                    user = get_user_model().objects.get(id=user_id)
                    if getattr(user, "is_blocked", False):
                        return Response(
                            {
                                "success": False,
                                "data": None,
                                "error": "Your account has been blocked. Contact support.",
                            },
                            status=status.HTTP_401_UNAUTHORIZED,
                        )
            except (InvalidToken, TokenError, get_user_model().DoesNotExist):
                # Let the parent view produce the canonical error for bad tokens.
                pass
        return super().post(request, *args, **kwargs)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    user = request.user
    serializer = UserSerializer(user)
    return Response(
        {"success": True, "data": serializer.data, "error": None}
    )


class SpecialtyViewSet(viewsets.ModelViewSet):
    queryset = Specialty.objects.all()
    serializer_class = SpecialtySerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdminUser()]
        return [AllowAny()]


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = UserAdminSerializer
    permission_classes = [IsAdminUser]
    http_method_names = ["get", "patch", "head", "options"]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["role"]
    search_fields = ["email", "username"]

    def perform_update(self, serializer):
        target = self.get_object()
        if target.role == "admin":
            raise PermissionDenied("Admins cannot modify other admin users.")
        serializer.save()


class IsProfileOwner(BasePermission):
    """Allow access only to the profile owner or admin users."""

    def has_object_permission(self, request, view, obj):
        return obj.user == request.user or request.user.is_staff


class DoctorFilter(django_filters.FilterSet):
    specialty = django_filters.CharFilter(
        field_name="specialty__name", lookup_expr="icontains"
    )

    class Meta:
        model = DoctorProfile
        fields = ["specialty"]


class DoctorProfileViewSet(viewsets.ModelViewSet):
    queryset = DoctorProfile.objects.select_related("user", "specialty").all()
    http_method_names = ["get", "patch", "head", "options"]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = DoctorFilter
    search_fields = ["user__username", "user__first_name", "user__last_name", "bio"]

    def get_serializer_class(self):
        if self.action == "list":
            return DoctorProfileListSerializer
        return DoctorProfileSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsAuthenticated(), IsProfileOwner()]

    def perform_update(self, serializer):
        if (
            serializer.instance.user != self.request.user
            and not self.request.user.is_staff
        ):
            self.permission_denied(self.request)
        serializer.save()


class PatientProfileViewSet(viewsets.ModelViewSet):
    queryset = PatientProfile.objects.select_related("user").all()
    serializer_class = PatientProfileSerializer
    http_method_names = ["get", "patch", "head", "options"]

    def get_permissions(self):
        if self.action == "list":
            return [IsAdminUser()]
        return [IsAuthenticated(), IsProfileOwner()]

    def perform_update(self, serializer):
        if (
            serializer.instance.user != self.request.user
            and not self.request.user.is_staff
        ):
            self.permission_denied(self.request)
        serializer.save()
