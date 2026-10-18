"""Mavjud partiyalarni hisobga olingan deb belgilaydi.

Yangi `accounted_at` maydoni `None` bo'lsa partiya hamkor qarzida ko'rinmaydi.
Tarixan barcha partiyalar hisobga olingan, shuning uchun ularning `accounted_at`
qiymatini yaratilgan vaqtiga tenglashtiramiz.
"""
from django.db import migrations, models


def backfill(apps, schema_editor):
    Batch = apps.get_model("flights", "Batch")
    Batch.objects.using(schema_editor.connection.alias).filter(
        accounted_at__isnull=True
    ).update(accounted_at=models.F("created_at"))


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("flights", "0005_batchcategory_batch_accounted_at_batch_is_auto_and_more"),
    ]

    operations = [
        migrations.RunPython(backfill, noop),
    ]
