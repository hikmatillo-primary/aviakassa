from django.db import migrations, models
import django.db.models.deletion


PAYMENT_METHOD_LABELS = {
    'CASH': 'Naqd (Cash)',
    'CARD': "Karta / O'tkazma",
    'BANK': 'Bank hisob raqami',
    'NAQD_USD': 'Naqd ($ USD)',
    'NAQD_UZS': "Naqd (UZS so'm)",
    'BANK_KARTA': 'Bank / Karta',
    'HISOB_RAQAM': 'Hisob raqam (Perechislenie)',
}


def create_accounts_from_payments(apps, schema_editor):
    """Mavjud to'lov usullaridan standart hisoblarni yaratadi va to'lovlarni bog'laydi."""
    Payment = apps.get_model('cash', 'Payment')
    CashAccount = apps.get_model('cash', 'CashAccount')

    used_methods = list(
        Payment.objects.exclude(payment_method__isnull=True)
        .exclude(payment_method='')
        .values_list('payment_method', flat=True)
        .distinct()
    )

    if not used_methods:
        used_methods = ['CASH']

    for method in used_methods:
        name = PAYMENT_METHOD_LABELS.get(method, method)
        account, _ = CashAccount.objects.get_or_create(name=name)
        Payment.objects.filter(payment_method=method, account__isnull=True).update(account=account)


def drop_created_accounts(apps, schema_editor):
    CashAccount = apps.get_model('cash', 'CashAccount')
    CashAccount.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('cash', '0003_alter_payment_payment_method'),
    ]

    operations = [
        migrations.CreateModel(
            name='CashAccount',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True, verbose_name='Hisob nomi')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqti')),
            ],
            options={
                'verbose_name': 'Kassa hisobi',
                'verbose_name_plural': 'Kassa hisoblari',
                'ordering': ['name'],
            },
        ),
        migrations.AddField(
            model_name='payment',
            name='account',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='payments',
                to='cash.cashaccount',
                verbose_name='Hisob',
            ),
        ),
        migrations.RunPython(create_accounts_from_payments, drop_created_accounts),
    ]
