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
        qty = int(qty or 0)
        seg = (segment or "").upper()
        if seg == Sale.Segment.RETURN:
            return 0, qty
        if seg == Sale.Segment.BOTH:
            return qty, qty
        # OUTBOUND yoki bo'sh (oddiy bir tomonlama partiya) — faqat borish o'rni.
        return qty, 0

    def _current_batch_left(self, batch):
        ret_left = batch.return_remaining_qty
        if ret_left is None:
            ret_left = batch.total_qty
        return batch.remaining_qty, ret_left

    def clean(self):
        if not self.batch_id:
            return
        db = get_active_alias()
        batch = Batch.objects.using(db).get(pk=self.batch_id)
        new_out, new_ret = Sale.pool_usage(self.qty, self.segment)
        old_out = old_ret = 0
        if self.pk is not None:
            old = Sale.objects.using(db).filter(pk=self.pk).first()
            if old is not None:
                old_out, old_ret = Sale.pool_usage(old.qty, old.segment)
        add_out = new_out - old_out
        add_ret = new_ret - old_ret
        out_left, ret_left = self._current_batch_left(batch)
        if add_out > 0 and out_left < add_out:
            raise ValidationError(
                f"Partiyada yetarli chipta yo'q! Qoldiq: {out_left} ta, so'ralgan: {add_out} ta."
            )
        if add_ret > 0 and ret_left < add_ret:
            raise ValidationError(
                f"Partiyada yetarli kelish chiptasi yo'q! Qoldiq: {ret_left} ta, so'ralgan: {add_ret} ta."
            )

    def _normalize_for_save(self):
        """Pul maydonlarini Decimal'ga keltiradi va umumiy summalarni qayta hisoblaydi."""
        self.qty = int(self.qty or 0)
        if self.qty < 1:
            raise ValidationError({"qty": "Chiptalar soni kamida 1 ta bo'lishi kerak."})

        self.sell_price = to_money(self.sell_price, ZERO)
        if self.sell_price < ZERO:
            raise ValidationError({"sell_price": "Sotuv narxi manfiy bo'lishi mumkin emas."})

        if self.buy_price is None or self.buy_price == "":
            self.buy_price = to_money(self.batch.buy_price, ZERO) if self.batch_id else ZERO
        else:
            self.buy_price = to_money(self.buy_price, ZERO)
        if self.buy_price < ZERO:
            raise ValidationError({"buy_price": "Tan narxi manfiy bo'lishi mumkin emas."})

        self.total_amount = to_money(self.sell_price * self.qty)
        self.profit = to_money(self.total_amount - self.buy_price * self.qty)

        # Segment normalizatsiyasi: borish-kelish partiyada standart BOTH,
        # oddiy partiyada segment bo'lmaydi.
        if self.batch_id:
            batch = self.batch
            if batch.is_round_trip:
                if not self.segment:
                    self.segment = Sale.Segment.BOTH
            else:
                self.segment = ""

            # Partiyadan reys ma'lumotlarini to'ldirish
            if not self.route:
                self.route = batch.route
            if not self.flight_date:
                self.flight_date = batch.flight_date
            if not self.flight_number:
                self.flight_number = batch.flight_number
            if not self.departure_time:
                self.departure_time = batch.departure_time
            if not self.arrival_time:
                self.arrival_time = batch.arrival_time
            if self.is_round_trip is None:
                self.is_round_trip = batch.is_round_trip
            if not self.return_date and batch.return_date:
                self.return_date = batch.return_date
            if not self.return_flight_number and batch.return_flight_number:
                self.return_flight_number = batch.return_flight_number
            if not self.return_departure_time and batch.return_departure_time:
                self.return_departure_time = batch.return_departure_time
            if not self.return_arrival_time and batch.return_arrival_time:
                self.return_arrival_time = batch.return_arrival_time

    def save(self, *args, **kwargs):
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

        self._normalize_for_save()

        with transaction.atomic(using=db):
            if self.batch_id:
                new_batch_id = self.batch_id
                moved = (
                    not is_new
                    and old_batch_id is not None
                    and old_batch_id != new_batch_id
                )

                if moved:
                    # Partiya almashtirilgan: eski partiyaga o'rinlarni qaytaramiz,
                    # yangi partiyadan ayiramiz. Deadlock oldini olish uchun
                    # ikkala partiya pk tartibida qulflanadi.
                    locked = {
                        b.pk: b
                        for b in Batch.objects.using(db)
                        .select_for_update()
                        .filter(pk__in={old_batch_id, new_batch_id})
                        .order_by("pk")
                    }
                    old_batch = locked[old_batch_id]
                    new_batch = locked[new_batch_id]

                    old_out, old_ret = Sale.pool_usage(old_qty, old_segment)
                    old_batch.remaining_qty += old_out
                    if old_ret:
                        old_batch.return_remaining_qty = (
                            old_batch.return_remaining_qty or 0
                        ) + old_ret
                    old_batch.recalc_status()
                    old_batch.save(
                        using=db,
                        update_fields=["remaining_qty", "return_remaining_qty", "status"],
                    )

                    new_out, new_ret = Sale.pool_usage(self.qty, self.segment)
                    if new_out and new_batch.remaining_qty < new_out:
                        raise ValidationError({"qty": "Partiyada yetarli chipta qolmagan!"})
                    if new_ret and (new_batch.return_remaining_qty or 0) < new_ret:
                        raise ValidationError(
                            {"qty": "Partiyada yetarli kelish chiptasi qolmagan!"}
                        )
                    new_batch.remaining_qty -= new_out
                    if new_ret:
                        new_batch.return_remaining_qty = (
                            new_batch.return_remaining_qty or 0
                        ) - new_ret
                    new_batch.recalc_status()
                    new_batch.save(
                        using=db,
                        update_fields=["remaining_qty", "return_remaining_qty", "status"],
                    )
                else:
                    # Bir xil partiyada qoldiqlarni delta bo'yicha moslash
                    # (race condition bo'lmasligi uchun qulflab olamiz).
                    batch = Batch.objects.using(db).select_for_update().get(pk=new_batch_id)

                    new_out, new_ret = Sale.pool_usage(self.qty, self.segment)
                    if is_new:
                        old_out = old_ret = 0
                    else:
                        old_out, old_ret = Sale.pool_usage(old_qty, old_segment)

                    d_out = new_out - old_out
                    d_ret = new_ret - old_ret

                    if d_out > 0:
                        if batch.remaining_qty < d_out:
                            raise ValidationError(
                                {"qty": "Partiyada yetarli chipta qolmagan!"}
                            )
                        batch.remaining_qty -= d_out
                    elif d_out < 0:
                        batch.remaining_qty += abs(d_out)

                    if d_ret != 0:
                        ret_left = batch.return_remaining_qty
                        if ret_left is None:
                            ret_left = batch.total_qty
                        if d_ret > 0:
                            if ret_left < d_ret:
                                raise ValidationError(
                                    {"qty": "Partiyada yetarli kelish chiptasi qolmagan!"}
                                )
                            ret_left -= d_ret
                        else:
                            ret_left += abs(d_ret)
                        batch.return_remaining_qty = ret_left

                    batch.recalc_status()
                    batch.save(
                        using=db,
                        update_fields=["remaining_qty", "return_remaining_qty", "status"],
                    )

            super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        db = kwargs.get("using") or get_active_alias()
        with transaction.atomic(using=db):
            if self.batch_id:
                batch = Batch.objects.using(db).select_for_update().get(pk=self.batch_id)
                out, ret = Sale.pool_usage(self.qty, self.segment)
                batch.remaining_qty += out
                if ret:
                    batch.return_remaining_qty = (batch.return_remaining_qty or 0) + ret
                batch.recalc_status()
                batch.save(
                    using=db,
                    update_fields=["remaining_qty", "return_remaining_qty", "status"],
                )
            return super().delete(using=db, **{k: v for k, v in kwargs.items() if k != "using"})
