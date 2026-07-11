# Generated manually — create Specialty model, populate from existing data, alter DoctorProfile FK

from django.db import migrations, models
import django.db.models.deletion


def populate_specialties(apps, schema_editor):
    Specialty = apps.get_model("users", "Specialty")
    DoctorProfile = apps.get_model("users", "DoctorProfile")
    names = (
        DoctorProfile.objects.values_list("specialty", flat=True).distinct()
    )
    for name in names:
        if name:
            Specialty.objects.get_or_create(name=name)


def migrate_specialty_fk(apps, schema_editor):
    Specialty = apps.get_model("users", "Specialty")
    DoctorProfile = apps.get_model("users", "DoctorProfile")
    for dp in DoctorProfile.objects.all():
        if dp.specialty:
            specialty, _ = Specialty.objects.get_or_create(name=dp.specialty)
            dp.specialty_new = specialty
            dp.save()


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Specialty",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "name",
                    models.CharField(max_length=100, unique=True),
                ),
                (
                    "description",
                    models.TextField(blank=True),
                ),
            ],
        ),
        migrations.RunPython(populate_specialties),
        migrations.AddField(
            model_name="doctorprofile",
            name="specialty_new",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="doctor_profiles",
                to="users.specialty",
            ),
        ),
        migrations.RunPython(migrate_specialty_fk),
        migrations.RemoveField(
            model_name="doctorprofile",
            name="specialty",
        ),
        migrations.RenameField(
            model_name="doctorprofile",
            old_name="specialty_new",
            new_name="specialty",
        ),
    ]
