from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import models

from apps.partners.models import Partner
from core.db_state import get_active_alias
from core.money import ZERO, to_money


class Batch(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Faol'
        COMPLETED = 'COMPLETED', 'Tugagan'

    batch_number = models.CharField(max_length=100, unique=True, verbose_name="Partiya raqami")
    route = models.CharField(max_length=255, verbose_name="Marshrut (Yo'nalish)")
    flight_date = models.DateField(db_index=True, verbose_name="Parvoz sanasi")
    flight_number = models.CharField(max_length=50, blank=True, default="", verbose_name="Reys raqami")
    departure_time = models.CharField(max_length=20, blank=True, default="08:00", verbose_name="Uchish vaqti")
    arrival_time = models.CharField(max_length=20, blank=True, default="11:30", verbose_name="Qo'nish vaqti")

    is_round_trip = models.BooleanField(default=False, verbose_name="Borish-kelish (Obratno)")
    return_date = models.DateField(blank=True, null=True, verbose_name="Qaytish sanasi")
    return_flight_number = models.CharField(max_length=50, blank=True, default="", verbose_name="Qaytish reys raqami")
    return_departure_time = models.CharField(max_length=20, blank=True, default="14:00", verbose_name="Qaytish uchish vaqti")
    return_arrival_time = models.CharField(max_length=20, blank=True, default="17:30", verbose_name="Qaytish qo'nish vaqti")

    purchase_date = models.DateField(blank=True, null=True, db_index=True, verbose_name="Xarid sanasi")
    baggage = models.CharField(max_length=50, blank=True, default="20kg", verbose_name="Bagaj")

    supplier = models.ForeignKey(
        Partner,
        on_delete=models.PROTECT,
        related_name="batches",
        verbose_name="Yetkazib beruvchi (Vendor)"
    )

    total_qty = models.PositiveIntegerField(verbose_name="Jami chiptalar soni")
    remaining_qty = models.PositiveIntegerField(verbose_name="Qolgan chiptalar soni")
    # Borish-kelish partiyalarida kelish o'rinlari alohida yuritiladi.
    return_remaining_qty = models.PositiveIntegerField(blank=True, null=True, verbose_name="Qolgan kelish chiptalari")
    buy_price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="1 ta chipta tan narxi ($)")
    total_cost = models.DecimalField(max_digits=14, decimal_places=2, verbose_name="Jami xarid summasi ($)")
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ACTIVE,
        db_index=True, verbose_name="Holati",
    )
    notes = models.TextField(blank=True, null=True, verbose_name="Izoh")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True, verbose_name="Yaratilgan vaqti")

    class Meta:
        verbose_name = "Partiya (Chiptalar bloki)"
        verbose_name_plural = "Partiyalar"
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(total_qty__gte=1),
                name="batch_total_qty_positive",
            ),
            models.CheckConstraint(
                condition=models.Q(remaining_qty__lte=models.F("total_qty")),
                name="batch_remaining_lte_total",
            ),
        ]

    FLIGHT_FIELDS = (
        "route", "flight_date", "flight_number", "departure_time", "arrival_time",
        "is_round_trip", "return_date", "return_flight_number",
        "return_departure_time", "return_arrival_time",
    )

    def __str__(self):
        return f"{self.batch_number} - {self.route} ({self.flight_date})"

    @classmethod
    def generate_next_batch_number(cls, db=None):
        import re

        db = db or get_active_alias()
        all_numbers = cls.objects.using(db).values_list('batch_number', flat=True)
        max_existing = 0
        count = 0
        for bn in all_numbers:
            count += 1
            if not bn:
                continue
            match = re.match(r'^P(\d+)$', str(bn).strip())
            if match:
                try:
                    max_existing = max(max_existing, int(match.group(1)))
                except ValueError:
                    pass
        return f"P{max(max_existing, count) + 1:05d}"

    def recalc_status(self):
        """Holatni qoldiqlarga qarab qayta hisoblash.
        Borish-kelish partiyasi faqat ikkala qoldiq ham 0 bo'lganda tugagan hisoblanadi."""
        out_left = self.remaining_qty or 0
        ret_left = self.return_remaining_qty or 0
        finished = out_left == 0 and (not self.is_round_trip or ret_left == 0)
        self.status = self.Status.COMPLETED if finished else self.Status.ACTIVE

    def _old_values(self, db):
        if self._state.adding or not self.pk:
            return None
        return (
            Batch.objects.using(db)
            .filter(pk=self.pk)
            .values(*(tuple(self.FLIGHT_FIELDS) + ("batch_number",)))
            .first()
        )

    def save(self, *args, **kwargs):
        db = kwargs.get("using") or get_active_alias()
        kwargs["using"] = db
        update_fields = kwargs.get("update_fields")

        is_new = self._state.adding or not self.pk
        should_sync_flights = update_fields is None or bool(
            set(self.FLIGHT_FIELDS) & set(update_fields)
        )
        # Faqat kerak bo'lganda eski qiymatlarni o'qiymiz (har saqlashda emas).
        old_values = None
        if not is_new and (should_sync_flights or update_fields is None):
            old_values = self._old_values(db)

        if not self.batch_number or not str(self.batch_number).strip():
            self.batch_number = self.generate_next_batch_number(db)
        else:
            self.batch_number = str(self.batch_number).strip()
            number_changed = is_new or (
                old_values is not None
                and old_values.get("batch_number") != self.batch_number
            )
            if number_changed:
                duplicate = (
                    Batch.objects.using(db)
                    .filter(batch_number=self.batch_number)
                    .exclude(pk=self.pk)
                    .exists()
                )
                if duplicate:
                    raise ValidationError(
                        {"batch_number": f"'{self.batch_number}' raqamli partiya allaqachon mavjud."}
                    )

        self.buy_price = to_money(self.buy_price, ZERO)
        self.total_qty = int(self.total_qty or 0)
        self.total_cost = to_money(self.buy_price * self.total_qty)
        if self.remaining_qty is None:
            self.remaining_qty = self.total_qty
        if self.return_remaining_qty is None:
            self.return_remaining_qty = self.total_qty
        self.recalc_status()

        super().save(*args, **kwargs)

        if not should_sync_flights:
            return

        # Reys maydonlari haqiqatan o'zgarganini tekshiramiz: har saqlashda
        # barcha sotuvlarni yangilash ortiqcha va sekin.
        changed = old_values is None
        if old_values is not None:
            for field in self.FLIGHT_FIELDS:
                if old_values.get(field) != getattr(self, field):
                    changed = True
                    break
        if not changed:
            return

        # Reys ma'lumotlari partiyadan sotuvlarga denormalizatsiya qilinadi.
        # Partiya reysi o'zgarsa, undagi sotuvlar ham sinxronlanadi (drift oldini olish).
        from apps.sales.models import Sale

        Sale.objects.using(db).filter(batch=self).update(
            route=self.route,
            flight_date=self.flight_date,
            flight_number=self.flight_number,
            departure_time=self.departure_time,
            arrival_time=self.arrival_time,
            is_round_trip=self.is_round_trip,
            return_date=self.return_date,
            return_flight_number=self.return_flight_number,
            return_departure_time=self.return_departure_time,
            return_arrival_time=self.return_arrival_time,
        )
