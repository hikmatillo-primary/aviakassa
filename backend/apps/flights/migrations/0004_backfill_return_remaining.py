"""Mavjud partiyalarda kelish qoldig'ini to'ldiradi.

Yangi maydon (`return_remaining_qty`) qo'shilganda eski partiyalarda u NULL
bo'lib qoladi. Tarixan "qoldiq" butun borish-kelish chiptasini anglatgan
(ya'ni borish va kelish o'rinlari bir xil sonda sotilgan), shuning uchun
kelish qoldig'ini borish qoldig'iga tenglashtiramiz. Bu mavjud qoldiqni
o'zgartirmaydi va tugallangan partiyalarni tugallangan holatda saqlaydi.
"""
from django.db import migrations, models


def backfill(apps, schema_editor):
    Batch = apps.get_model("flights", "Batch")
    Batch.objects.using(schema_editor.connection.alias).filter(
        return_remaining_qty__isnull=True
    ).update(return_remaining_qty=models.F("remaining_qty"))


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("flights", "0003_alter_batch_created_at_alter_batch_flight_date_and_more"),
    ]

    operations = [
        migrations.RunPython(backfill, noop),
    ]
