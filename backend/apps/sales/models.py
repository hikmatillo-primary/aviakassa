from decimal import Decimal
from django.db import models, transaction
from django.core.exceptions import ValidationError
from apps.flights.models import Batch
from apps.partners.models import Partner

class Sale(models.Model):
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
    sale_date = models.DateField(verbose_name="Sotuv sanasi")

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
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan vaqti")

    class Meta:
        verbose_name = "Sotuv"
        verbose_name_plural = "Sotuvlar"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Sotuv #{self.id} - {self.client.name} ({self.qty} ta)"

    def clean(self):
        if self.batch:
            if self.pk is None:
                if self.batch.remaining_qty < self.qty:
                    raise ValidationError(
                        f"Partiyada yetarli chipta yo'q! Qoldiq: {self.batch.remaining_qty} ta, so'ralgan: {self.qty} ta."
                    )
            else:
                try:
                    old = Sale.objects.get(pk=self.pk)
                    diff = self.qty - old.qty
                    if diff > 0 and self.batch.remaining_qty < diff:
                        raise ValidationError(
                            f"Partiyada qo‘shimcha chipta yetarli emas! Qoldiq: {self.batch.remaining_qty} ta, qo‘shimcha so‘ralgan: {diff} ta."
                        )
                except Sale.DoesNotExist:
                    pass

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_qty = 0
        if not is_new:
            try:
                old_sale = Sale.objects.get(pk=self.pk)
                old_qty = old_sale.qty
            except Sale.DoesNotExist:
                is_new = True

        # Narxlar va foydani avtomatik hisoblash
        if self.sell_price is not None:
            self.sell_price = Decimal(str(self.sell_price))
        if not self.buy_price and self.batch:
            self.buy_price = self.batch.buy_price
        if self.buy_price is not None:
            self.buy_price = Decimal(str(self.buy_price))

        if self.sell_price is not None and self.qty is not None:
            self.total_amount = self.sell_price * Decimal(str(self.qty))
            if self.buy_price is not None:
                self.profit = self.total_amount - (self.buy_price * Decimal(str(self.qty)))
            else:
                self.profit = Decimal("0.00")

        # Partiyadan reys ma'lumotlarini to'ldirish
        if self.batch:
            if not self.route:
                self.route = self.batch.route
            if not self.flight_date:
                self.flight_date = self.batch.flight_date
            if not self.flight_number:
                self.flight_number = self.batch.flight_number
            if not self.departure_time:
                self.departure_time = self.batch.departure_time
            if not self.arrival_time:
                self.arrival_time = self.batch.arrival_time
            if self.is_round_trip is None:
                self.is_round_trip = self.batch.is_round_trip
            if not self.return_date and self.batch.return_date:
                self.return_date = self.batch.return_date
            if not self.return_flight_number and self.batch.return_flight_number:
                self.return_flight_number = self.batch.return_flight_number
            if not self.return_departure_time and self.batch.return_departure_time:
                self.return_departure_time = self.batch.return_departure_time
            if not self.return_arrival_time and self.batch.return_arrival_time:
                self.return_arrival_time = self.batch.return_arrival_time

        with transaction.atomic():
            if self.batch:
                # Partiyadan qoldiqni ayirish yoki qaytarish (Race condition bo'lmasligi uchun)
                batch = Batch.objects.select_for_update().get(pk=self.batch.pk)
                if is_new:
                    if batch.remaining_qty < self.qty:
                        raise ValidationError("Partiyada yetarli chipta qolmagan!")
                    batch.remaining_qty -= self.qty
                else:
                    diff = self.qty - old_qty
                    if diff > 0:
                        if batch.remaining_qty < diff:
                            raise ValidationError("Partiyada yetarli chipta qolmagan!")
                        batch.remaining_qty -= diff
                    elif diff < 0:
                        batch.remaining_qty += abs(diff)

                if batch.remaining_qty == 0:
                    batch.status = Batch.Status.COMPLETED
                elif batch.remaining_qty > 0 and batch.status == Batch.Status.COMPLETED:
                    batch.status = Batch.Status.ACTIVE
                batch.save(update_fields=["remaining_qty", "status"])

            super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        with transaction.atomic():
            if self.batch:
                batch = Batch.objects.select_for_update().get(pk=self.batch.pk)
                batch.remaining_qty += self.qty
                if batch.status == Batch.Status.COMPLETED and batch.remaining_qty > 0:
                    batch.status = Batch.Status.ACTIVE
                batch.save(update_fields=["remaining_qty", "status"])
            super().delete(*args, **kwargs)
