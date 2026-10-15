from django.db import models
from django.db.models import Sum

class Partner(models.Model):
    class PartnerType(models.TextChoices):
        SUPPLIER = 'SUPPLIER', 'Vendor (Ta\'minotchi)'
        CLIENT = 'CLIENT', 'Mijoz (Xaridor)'
        BOTH = 'BOTH', 'Universal (Ikkisi ham)'

    name = models.CharField(max_length=255, verbose_name="Hamkor nomi")
    type = models.CharField(
        max_length=20,
        choices=PartnerType.choices,
        default=PartnerType.BOTH,
        verbose_name="Hamkor turi"
    )
    tags = models.JSONField(default=list, blank=True, verbose_name="Teglar")
    phone = models.CharField(max_length=50, blank=True, null=True, verbose_name="Telefon raqami")
    notes = models.TextField(blank=True, null=True, verbose_name="Qo'shimcha izoh")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan vaqti")

    class Meta:
        verbose_name = "Hamkor"
        verbose_name_plural = "Hamkorlar"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    @property
    def total_sold_to_us(self) -> float:
        """Ushbu hamkordan sotib olingan partiyalar summasi (Vendor sifatida)."""
        val = self.batches.aggregate(total=Sum('total_cost'))['total']
        return float(val or 0)

    @property
    def total_paid_by_us(self) -> float:
        """Biz ushbu hamkorga to'lagan xarajatlarimiz (Vendor ga to'lov)."""
        val = self.payments.filter(type='EXPENSE').aggregate(total=Sum('amount'))['total']
        return float(val or 0)

    @property
    def total_bought_from_us(self) -> float:
        """Ushbu hamkor bizdan xarid qilgan chiptalar summasi (Mijoz sifatida)."""
        val = self.sales.aggregate(total=Sum('total_amount'))['total']
        return float(val or 0)

    @property
    def total_paid_to_us(self) -> float:
        """Ushbu hamkor bizga to'lagan tushumlar (Mijoz to'lovi)."""
        val = self.payments.filter(type='INCOME').aggregate(total=Sum('amount'))['total']
        return float(val or 0)

    @property
    def total_offset_from(self) -> float:
        """Ushbu hamkordan boshqa hamkorga surilgan qarz summasi."""
        val = self.offsets_from.aggregate(total=Sum('amount'))['total']
        return float(val or 0)

    @property
    def total_offset_to(self) -> float:
        """Boshqa hamkordan ushbu hamkor foydasiga o'tkazilgan qarz summasi."""
        val = self.offsets_to.aggregate(total=Sum('amount'))['total']
        return float(val or 0)

    @property
    def net_balance(self) -> float:
        """
        Hamkor balansi (DebtOffset - qarz surishlar hisobga olingan):
        Bizdan qarzi bo'lsa: manfiy (-)
        Haqi bo'lsa: musbat (+)
        """
        client_debt = self.total_bought_from_us - self.total_paid_to_us
        supplier_debt = self.total_sold_to_us - self.total_paid_by_us
        return float(supplier_debt - client_debt + self.total_offset_from - self.total_offset_to)

    @property
    def they_owe_us(self) -> float:
        bal = self.net_balance
        return abs(bal) if bal < 0 else 0

    @property
    def we_owe_them(self) -> float:
        bal = self.net_balance
        return bal if bal > 0 else 0
