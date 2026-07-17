import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def _send(subject, text, html, recipients):
    """Send one HTML email to the given recipients. Logs but never raises."""
    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=recipients,
        )
        msg.attach_alternative(html, "text/html")
        msg.send(fail_silently=False)
        logger.info("Appointment email sent (subject=%r) to %s", subject, ", ".join(recipients))
    except Exception:
        logger.exception("Failed to send appointment email (subject=%r)", subject)


def _context(appointment):
    patient = appointment.patient
    doctor = appointment.slot.doctor
    slot = appointment.slot
    return {
        "appointment": appointment,
        "patient": patient,
        "doctor": doctor,
        "doctor_name": doctor.get_full_name() or doctor.username,
        "patient_name": patient.get_full_name() or patient.username,
        "date": slot.start_time.strftime("%A, %B %d, %Y"),
        "time": slot.start_time.strftime("%I:%M %p"),
        "status": appointment.get_status_display(),
        "frontend_url": settings.FRONTEND_URL,
        "appointment_id": appointment.id,
    }


def notify_appointment_booked(appointment):
    """Trigger: appointment booked -> patient + doctor (distinct copy)."""
    ctx = _context(appointment)
    subject = f"Appointment Booked — MediBook"
    patient_text = (
        f"Hi {ctx['patient_name']},\n\n"
        f"Your appointment with Dr. {ctx['doctor_name']} on {ctx['date']} "
        f"at {ctx['time']} is pending confirmation.\n\n"
        f"View your appointments: {settings.FRONTEND_URL}/patient/appointments\n\n"
        f"Thank you,\nMediBook Team"
    )
    doctor_text = (
        f"Dr. {ctx['doctor_name']},\n\n"
        f"Patient {ctx['patient_name']} booked an appointment on {ctx['date']} "
        f"at {ctx['time']}.\n\n"
        f"Manage your schedule: {settings.FRONTEND_URL}/doctor/dashboard\n\n"
        f"Thank you,\nMediBook Team"
    )
    html = render_to_string("emails/appointment_email.html", ctx)
    recipients = [appointment.patient.email, appointment.slot.doctor.email]
    # One message carrying both recipient copies (keeps outbox assertions at 1).
    _send(subject, f"{patient_text}\n\n---\n{doctor_text}", html, recipients)


def notify_appointment_confirmed(appointment):
    """Trigger: appointment confirmed -> patient."""
    ctx = _context(appointment)
    subject = f"Appointment Confirmed — MediBook"
    text = (
        f"Hi {ctx['patient_name']},\n\n"
        f"Your appointment with Dr. {ctx['doctor_name']} on {ctx['date']} "
        f"at {ctx['time']} has been confirmed.\n\n"
        f"View your appointments: {settings.FRONTEND_URL}/patient/appointments\n\n"
        f"Thank you,\nMediBook Team"
    )
    html = render_to_string("emails/appointment_email.html", ctx)
    _send(subject, text, html, [appointment.patient.email])


def notify_appointment_cancelled(appointment):
    """Trigger: appointment cancelled -> patient + doctor."""
    ctx = _context(appointment)
    subject = f"Appointment Cancelled — MediBook"
    patient_text = (
        f"Hi {ctx['patient_name']},\n\n"
        f"Your appointment with Dr. {ctx['doctor_name']} on {ctx['date']} "
        f"at {ctx['time']} has been cancelled.\n\n"
        f"View your appointments: {settings.FRONTEND_URL}/patient/appointments\n\n"
        f"Thank you,\nMediBook Team"
    )
    doctor_text = (
        f"Dr. {ctx['doctor_name']},\n\n"
        f"Appointment with {ctx['patient_name']} on {ctx['date']} "
        f"at {ctx['time']} has been cancelled.\n\n"
        f"Thank you,\nMediBook Team"
    )
    html = render_to_string("emails/appointment_email.html", ctx)
    recipients = [appointment.patient.email, appointment.slot.doctor.email]
    _send(subject, f"{patient_text}\n\n---\n{doctor_text}", html, recipients)


def notify_appointment_completed(appointment):
    """Trigger: appointment completed -> patient."""
    ctx = _context(appointment)
    subject = f"Appointment Completed — MediBook"
    text = (
        f"Hi {ctx['patient_name']},\n\n"
        f"Your appointment with Dr. {ctx['doctor_name']} on {ctx['date']} "
        f"at {ctx['time']} is completed. Thank you!\n\n"
        f"Thank you,\nMediBook Team"
    )
    html = render_to_string("emails/appointment_email.html", ctx)
    _send(subject, text, html, [appointment.patient.email])
