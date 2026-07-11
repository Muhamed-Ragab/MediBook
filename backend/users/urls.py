from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"users", views.UserViewSet, basename="user")
router.register(r"specialties", views.SpecialtyViewSet, basename="specialty")
router.register(r"doctors", views.DoctorProfileViewSet, basename="doctor")
router.register(r"patients", views.PatientProfileViewSet, basename="patient")

urlpatterns = [
    path("auth/register/", views.register_view, name="auth-register"),
    path("auth/login/", views.login_view, name="auth-login"),
    path("auth/refresh/", views.BlockedAwareRefreshView.as_view(), name="auth-refresh"),
    path("auth/me/", views.me_view, name="auth-me"),
    path(
        "auth/verify-email/<uidb64>/<token>/",
        views.verify_email_view,
        name="auth-verify-email",
    ),
]

urlpatterns += router.urls
