from django.db import models

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

    # Eslatma: bu xossalar Python tomonida hisoblanadi (prefetch_related bilan N+1
    # so'rovlarning oldi olinadi). ViewSet'da `prefetch_related` ishlatiladi.

    @property
    def total_sold_to_us(self) -> float:
        """Ushbu hamkordan sotib olingan partiyalar summasi (Vendor sifatida)."""
        return float(sum((b.total_cost or 0) for b in self.batches.all()))

    @property
    def total_paid_by_us(self) -> float:
        """Biz ushbu hamkorga to'lagan xarajatlarimiz (Vendor ga to'lov)."""
        return float(sum((p.amount or 0) for p in self.payments.all() if p.type == 'EXPENSE'))

    @property
    def total_bought_from_us(self) -> float:
        """Ushbu hamkor bizdan xarid qilgan chiptalar summasi (Mijoz sifatida)."""
        return float(sum((s.total_amount or 0) for s in self.sales.all()))

    @property
    def total_paid_to_us(self) -> float:
        """Ushbu hamkor bizga to'lagan tushumlar (Mijoz to'lovi)."""
        return float(sum((p.amount or 0) for p in self.payments.all() if p.type == 'INCOME'))

    @property
    def total_offset_from(self) -> float:
        """Ushbu hamkordan boshqa hamkorga surilgan qarz summasi."""
        return float(sum((o.amount or 0) for o in self.offsets_from.all()))

    @property
    def total_offset_to(self) -> float:
        """Boshqa hamkordan ushbu hamkor foydasiga o'tkazilgan qarz summasi."""
        return float(sum((o.amount or 0) for o in self.offsets_to.all()))

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
