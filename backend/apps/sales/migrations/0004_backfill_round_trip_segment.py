"""Borish-kelish partiyalaridagi eski sotuvlarga `BOTH` segmentini qo'yadi.

Segment maydoni paydo bo'lgunga qadar har bir sotuv butun borish-kelish
chiptasini (ikki o'rin) egallagan. Kelish qoldig'i ham shu tariqa
to'ldirilgani uchun (flights.0004) sotuvlarni `BOTH` deb belgilash
hisob-kitobni izchil qiladi.
"""
from django.db import migrations


def backfill(apps, schema_editor):
    Sale = apps.get_model("sales", "Sale")
    Sale.objects.using(schema_editor.connection.alias).filter(
        batch__is_round_trip=True, segment=""
    ).update(segment="BOTH")


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("sales", "0003_alter_sale_created_at_alter_sale_sale_date_and_more"),
        ("flights", "0004_backfill_return_remaining"),
    ]

    operations = [
        migrations.RunPython(backfill, noop),
    ]
