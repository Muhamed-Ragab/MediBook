import logging

from django.conf import settings
from django.contrib.auth import get_user_model, authenticate
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import RegisterSerializer, UserSerializer
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
            from_email="noreply@medibook.com",
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    user = request.user
    serializer = UserSerializer(user)
    return Response(
        {"success": True, "data": serializer.data, "error": None}
    )
