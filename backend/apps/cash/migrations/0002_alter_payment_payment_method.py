# To'lov usuli variantlariga CASH/BANK qo'shildi (frontend bilan moslashtirish)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("cash", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="payment",
            name="payment_method",
            field=models.CharField(
                choices=[
                    ("CASH", "Naqd (Cash)"),
                    ("BANK", "Bank hisob raqami"),
                    ("NAQD_USD", "Naqd ($ USD)"),
                    ("NAQD_UZS", "Naqd (UZS so'm)"),
                    ("BANK_KARTA", "Bank / Karta"),
                    ("HISOB_RAQAM", "Hisob raqam (Perechislenie)"),
                ],
                default="CASH",
                max_length=50,
                verbose_name="To'lov usuli",
            ),
        ),
    ]
