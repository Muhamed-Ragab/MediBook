import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def send_appointment_email(appointment, subject, template_name="emails/appointment_email.html"):
    """Send an HTML email about an appointment to both patient and doctor.

    Args:
        appointment: Appointment instance with select_related slot__doctor, patient.
        subject: Email subject line.
        template_name: Template path relative to appointments/templates/.
    """
    patient = appointment.patient
    doctor = appointment.slot.doctor
    slot = appointment.slot
    context = {
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

    html = render_to_string(template_name, context)
    text = (
        f"Hi {patient.username},\n\n"
        f"Your appointment with Dr. {doctor.username} on {context['date']} "
        f"at {context['time']} is {context['status']}.\n\n"
        f"View your appointments: {settings.FRONTEND_URL}/patient/appointments\n\n"
        f"Thank you,\nMediBook Team"
    )

    recipients = [patient.email]
    if doctor.email:
        recipients.append(doctor.email)

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=recipients,
        )
        msg.attach_alternative(html, "text/html")
        msg.send(fail_silently=False)
        logger.info(
            "Appointment email sent (id=%s, status=%s) to %s",
            appointment.id,
            appointment.status,
            ", ".join(recipients),
        )
    except Exception:
        logger.exception(
            "Failed to send appointment email (id=%s, status=%s)",
            appointment.id,
            appointment.status,
        )
