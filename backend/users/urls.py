from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path("auth/register/", views.register_view, name="auth-register"),
    path("auth/login/", views.login_view, name="auth-login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("auth/me/", views.me_view, name="auth-me"),
    path(
        "auth/verify-email/<uidb64>/<token>/",
        views.verify_email_view,
        name="auth-verify-email",
    ),
]
