"""Global DRF exception handler.

Guarantees the API never leaks Django's HTML debug/error pages. Any
exception that reaches DRF (including raw DB errors like OperationalError)
is converted into a JSON response shaped like the rest of the API:

    {"success": false, "data": null, "error": "<message>"}

In DEBUG mode the actual exception detail is included; in production only a
generic message is exposed to avoid leaking internals.
"""
from django.conf import settings
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.response import Response


def exception_handler(exc, context):
    # Let DRF handle its own APIExceptions first (validation, auth, etc.).
    response = drf_exception_handler(exc, context)

    if response is not None:
        # Normalize DRF's default {detail: ...} shape into our envelope.
        detail = response.data
        if isinstance(detail, dict) and "detail" in detail:
            message = detail["detail"]
        elif isinstance(detail, (list, dict)):
            message = detail
        else:
            message = str(detail)
        response.data = {"success": False, "data": None, "error": message}
        return response

    # Unhandled exception (e.g. OperationalError, unexpected bug). Never return
    # HTML — emit a JSON 500 envelope instead.
    if settings.DEBUG:
        message = str(exc)
    else:
        message = "An unexpected error occurred. Please try again later."
    return Response(
        {"success": False, "data": None, "error": message},
        status=500,
    )
