from django.urls import path

from . import views

urlpatterns = [
    path(
        "doctors/<int:doctor_pk>/slots/",
        views.SlotViewSet.as_view({"get": "list", "post": "create"}),
        name="slot-list",
    ),
    path(
        "doctors/<int:doctor_pk>/slots/<int:pk>/",
        views.SlotViewSet.as_view({"delete": "destroy"}),
        name="slot-detail",
    ),
    path(
        "doctors/<int:doctor_pk>/available-slots/",
        views.available_slots_view,
        name="available-slots",
    ),
    path(
        "appointments/",
        views.AppointmentViewSet.as_view({"get": "list", "post": "create"}),
        name="appointment-list",
    ),
    path(
        "appointments/<int:pk>/",
        views.AppointmentViewSet.as_view({"get": "retrieve", "patch": "partial_update"}),
        name="appointment-detail",
    ),
]
