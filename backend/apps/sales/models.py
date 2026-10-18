from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import models, transaction

from apps.flights.models import Batch
from apps.partners.models import Partner
from core.db_state import get_active_alias
from core.money import ZERO, to_money


class Sale(models.Model):
    class Segment(models.TextChoices):
        OUTBOUND = 'OUTBOUND', 'Borish'
        RETURN = 'RETURN', 'Kelish'
        BOTH = 'BOTH', 'Borish-Kelish'

    batch = models.ForeignKey(
        Batch,
        on_delete=models.PROTECT,
        related_name="sales",
        verbose_name="Partiya"
    )
    client = models.ForeignKey(
        Partner,
        on_delete=models.PROTECT,
        related_name="sales",
        verbose_name="Xaridor (Mijoz)"
    )

    qty = models.PositiveIntegerField(default=1, verbose_name="Sotilgan chiptalar soni")
    buy_price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Tan narxi ($)")
    sell_price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Sotilgan narxi ($)")
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, verbose_name="Jami sotuv summasi ($)")
    profit = models.DecimalField(max_digits=14, decimal_places=2, verbose_name="Sof foyda ($)")

    passenger_names = models.TextField(blank=True, default="", verbose_name="Yo'lovchilar ismi")
    # Borish-kelish partiyalarida sotuvning qaysi qismi (borish/kelish/ikkalasi) sotilgani.
    # Oddiy (bir tomonlama) partiyalarda bo'sh qoladi.
    segment = models.CharField(
        max_length=20, choices=Segment.choices, blank=True, default="",
        verbose_name="Sotilgan qismi"
    )
    sale_date = models.DateField(verbose_name="Sotuv sanasi", db_index=True)

    # Reys ma'lumotlari (kiritish vaqtida partiyadan ko'chiriladi)
    route = models.CharField(max_length=255, blank=True, default="", verbose_name="Marshrut")
    flight_date = models.DateField(blank=True, null=True, verbose_name="Parvoz sanasi")
    flight_number = models.CharField(max_length=50, blank=True, default="", verbose_name="Reys raqami")
    departure_time = models.CharField(max_length=20, blank=True, default="", verbose_name="Uchish vaqti")
    arrival_time = models.CharField(max_length=20, blank=True, default="", verbose_name="Qo'nish vaqti")

    is_round_trip = models.BooleanField(default=False, verbose_name="Borish-kelish")
    return_date = models.DateField(blank=True, null=True, verbose_name="Qaytish sanasi")
    return_flight_number = models.CharField(max_length=50, blank=True, default="", verbose_name="Qaytish reys raqami")
    return_departure_time = models.CharField(max_length=20, blank=True, default="", verbose_name="Qaytish uchish vaqti")
    return_arrival_time = models.CharField(max_length=20, blank=True, default="", verbose_name="Qaytish qo'nish vaqti")

    notes = models.TextField(blank=True, null=True, verbose_name="Izoh")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True, verbose_name="Yaratilgan vaqti")

    class Meta:
        verbose_name = "Sotuv"
        verbose_name_plural = "Sotuvlar"
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(qty__gte=1),
                name="sale_qty_positive",
            ),
            models.CheckConstraint(
                condition=models.Q(total_amount__gte=0),
                name="sale_total_non_negative",
            ),
        ]

    def __str__(self):
        return f"Sotuv #{self.id} - {self.client.name} ({self.qty} ta)"

    @staticmethod
    def pool_usage(qty, segment):
        """Sotuv partiyadan qancha borish va qancha kelish o'rnini olayotganini qaytaradi (out, ret)."""
        from . import services
        return services.pool_usage(qty, segment)

    def clean(self):
        from . import services
        services.validate_sale_availability(self)

    def _normalize_for_save(self):
        """Pul maydonlarini Decimal'ga keltiradi va umumiy summalarni qayta hisoblaydi."""
        from . import services
        services.normalize_sale_for_save(self)

    def save(self, *args, **kwargs):
        from . import services
        db = kwargs.get("using") or get_active_alias()
        kwargs["using"] = db

        is_new = self.pk is None
        old_qty = 0
        old_batch_id = None
        old_segment = ""
        if not is_new:
            old_sale = (
                Sale.objects.using(db)
                .only("qty", "batch_id", "segment")
                .filter(pk=self.pk)
                .first()
            )
            if old_sale is None:
                is_new = True
            else:
                old_qty = old_sale.qty
                old_batch_id = old_sale.batch_id
                old_segment = old_sale.segment or ""

        services.normalize_sale_for_save(self)

        with transaction.atomic(using=db):
            services.apply_sale_inventory_change(
                self, is_new, old_qty, old_batch_id, old_segment, db
            )
            super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        from . import services
        db = kwargs.get("using") or get_active_alias()
        with transaction.atomic(using=db):
            services.restore_sale_inventory_on_delete(self, db)
            return super().delete(using=db, **{k: v for k, v in kwargs.items() if k != "using"})
