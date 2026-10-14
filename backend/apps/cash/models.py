from django.db import models
from apps.partners.models import Partner

class Payment(models.Model):
    class PaymentType(models.TextChoices):
        INCOME = 'INCOME', 'Kirim (Mijoz to\'lovi)'
        EXPENSE = 'EXPENSE', 'Chiqim (Vendor to\'lovi)'

    class PaymentMethod(models.TextChoices):
        NAQD_USD = 'NAQD_USD', 'Naqd ($ USD)'
        NAQD_UZS = 'NAQD_UZS', 'Naqd (UZS so\'m)'
        BANK_KARTA = 'BANK_KARTA', 'Bank / Karta'
        HISOB_RAQAM = 'HISOB_RAQAM', 'Hisob raqam (Perechislenie)'

    partner = models.ForeignKey(
        Partner,
        on_delete=models.PROTECT,
        related_name="payments",
        verbose_name="Hamkor"
    )
    type = models.CharField(
        max_length=20,
        choices=PaymentType.choices,
        verbose_name="To'lov turi"
    )
    amount = models.DecimalField(max_digits=14, decimal_places=2, verbose_name="Summa ($)")
    payment_date = models.DateField(verbose_name="To'lov sanasi")
    payment_method = models.CharField(
        max_length=50,
        choices=PaymentMethod.choices,
        default=PaymentMethod.NAQD_USD,
        verbose_name="To'lov usuli"
    )
    notes = models.TextField(blank=True, null=True, verbose_name="Izoh")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan vaqti")

    class Meta:
        verbose_name = "To'lov"
        verbose_name_plural = "Kassa to'lovlari"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_type_display()}: {self.partner.name} - ${self.amount:,.2f}"


class DebtOffset(models.Model):
    from_partner = models.ForeignKey(
        Partner,
        on_delete=models.PROTECT,
        related_name="offsets_from",
        verbose_name="Qarzdor hamkor"
    )
    to_partner = models.ForeignKey(
        Partner,
        on_delete=models.PROTECT,
        related_name="offsets_to",
        verbose_name="Haqdor hamkor"
    )
    amount = models.DecimalField(max_digits=14, decimal_places=2, verbose_name="Qoplangan summa ($)")
    date = models.DateField(verbose_name="O'tkazilgan sana")
    notes = models.TextField(blank=True, null=True, verbose_name="Izoh")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan vaqti")

    class Meta:
        verbose_name = "O'zaro hisob-kitob (Sal'do qoplash)"
        verbose_name_plural = "O'zaro hisob-kitoblar"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Sal'do: {self.from_partner.name} ➔ {self.to_partner.name} (${self.amount:,.2f})"
