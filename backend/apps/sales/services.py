"""Sotuv va partiya o'rinlari qoldig'i bilan ishlovchi xizmatlar (Service Layer).

Chiptalar savdosi, qoldiqlarni tekshirish, atomik tranzaksiyalar va poyga holatlaridan
(race conditions) himoya qilish uchun yagona mas'ul qatlam.
"""
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.db import transaction

from apps.flights.models import Batch
from core.db_state import get_active_alias
from core.money import ZERO, to_money


def pool_usage(qty, segment):
    """Sotuv partiyadan qancha borish va qancha kelish o'rnini olayotganini qaytaradi (out, ret)."""
    qty = int(qty or 0)
    seg = (segment or "").upper()
    if seg == "RETURN":
        return 0, qty
    if seg == "BOTH":
        return qty, qty
    # OUTBOUND yoki bo'sh (oddiy bir tomonlama partiya) — faqat borish o'rni.
    return qty, 0


def current_batch_left(batch: Batch):
    """Partiyadagi borish va kelish o'rinlari qoldig'ini qaytaradi."""
    ret_left = batch.return_remaining_qty
    if ret_left is None:
        ret_left = batch.total_qty
    return batch.remaining_qty, ret_left


def validate_sale_availability(sale, db=None):
    """Sotuv uchun partiyada yetarli o'rin bor-yo'qligini tekshiradi."""
    if not sale.batch_id:
        return
    db = db or get_active_alias()
    batch = Batch.objects.using(db).get(pk=sale.batch_id)
    new_out, new_ret = pool_usage(sale.qty, sale.segment)
    old_out = old_ret = 0
    if sale.pk is not None:
        from apps.sales.models import Sale
        old = Sale.objects.using(db).filter(pk=sale.pk).first()
        if old is not None:
            old_out, old_ret = pool_usage(old.qty, old.segment)
    add_out = new_out - old_out
    add_ret = new_ret - old_ret
    out_left, ret_left = current_batch_left(batch)
    if add_out > 0 and out_left < add_out:
        raise ValidationError(
            f"Partiyada yetarli chipta yo'q! Qoldiq: {out_left} ta, so'ralgan: {add_out} ta."
        )
    if add_ret > 0 and ret_left < add_ret:
        raise ValidationError(
            f"Partiyada yetarli kelish chiptasi yo'q! Qoldiq: {ret_left} ta, so'ralgan: {add_ret} ta."
        )


def normalize_sale_for_save(sale):
    """Sotuv ma'lumotlarini Decimal formatga keltiradi va summalarni qayta hisoblaydi."""
    sale.qty = int(sale.qty or 0)
    if sale.qty < 1:
        raise ValidationError({"qty": "Chiptalar soni kamida 1 ta bo'lishi kerak."})

    sale.sell_price = to_money(sale.sell_price, ZERO)
    if sale.sell_price < ZERO:
        raise ValidationError({"sell_price": "Sotuv narxi manfiy bo'lishi mumkin emas."})

    if sale.buy_price is None or sale.buy_price == "":
        sale.buy_price = to_money(sale.batch.buy_price, ZERO) if sale.batch_id else ZERO
    else:
        sale.buy_price = to_money(sale.buy_price, ZERO)
    if sale.buy_price < ZERO:
        raise ValidationError({"buy_price": "Tan narxi manfiy bo'lishi mumkin emas."})

    sale.total_amount = to_money(sale.sell_price * sale.qty)
    sale.profit = to_money(sale.total_amount - sale.buy_price * sale.qty)

    if sale.batch_id:
        batch = sale.batch
        if batch.is_round_trip:
            if not sale.segment:
                sale.segment = "BOTH"
        else:
            sale.segment = ""

        # Partiyadan reys ma'lumotlarini to'ldirish
        if not sale.route:
            sale.route = batch.route
        if not sale.flight_date:
            sale.flight_date = batch.flight_date
        if not sale.flight_number:
            sale.flight_number = batch.flight_number
        if not sale.departure_time:
            sale.departure_time = batch.departure_time
        if not sale.arrival_time:
            sale.arrival_time = batch.arrival_time
        if sale.is_round_trip is None:
            sale.is_round_trip = batch.is_round_trip
        if not sale.return_date and batch.return_date:
            sale.return_date = batch.return_date
        if not sale.return_flight_number and batch.return_flight_number:
            sale.return_flight_number = batch.return_flight_number
        if not sale.return_departure_time and batch.return_departure_time:
            sale.return_departure_time = batch.return_departure_time
        if not sale.return_arrival_time and batch.return_arrival_time:
            sale.return_arrival_time = batch.return_arrival_time


def apply_sale_inventory_change(sale, is_new, old_qty, old_batch_id, old_segment, db):
    """Partiya o'rinlarini atomik tranzaksiya va select_for_update bilan yangilaydi."""
    if not sale.batch_id:
        return

    new_batch_id = sale.batch_id
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

        old_out, old_ret = pool_usage(old_qty, old_segment)
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

        new_out, new_ret = pool_usage(sale.qty, sale.segment)
        if new_out and new_batch.remaining_qty < new_out:
            raise ValidationError({"qty": "Partiyada yetarli chipta qolmagan!"})
        if new_ret and (new_batch.return_remaining_qty or 0) < new_ret:
            raise ValidationError({"qty": "Partiyada yetarli kelish chiptasi qolmagan!"})
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

        new_out, new_ret = pool_usage(sale.qty, sale.segment)
        if is_new:
            old_out = old_ret = 0
        else:
            old_out, old_ret = pool_usage(old_qty, old_segment)

        d_out = new_out - old_out
        d_ret = new_ret - old_ret

        if d_out > 0:
            if batch.remaining_qty < d_out:
                raise ValidationError({"qty": "Partiyada yetarli chipta qolmagan!"})
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


def restore_sale_inventory_on_delete(sale, db):
    """Sotuv o'chirilganda o'rinlarni partiyaga qaytaradi."""
    if not sale.batch_id:
        return
    batch = Batch.objects.using(db).select_for_update().get(pk=sale.batch_id)
    out, ret = pool_usage(sale.qty, sale.segment)
    batch.remaining_qty += out
    if ret:
        batch.return_remaining_qty = (batch.return_remaining_qty or 0) + ret
    batch.recalc_status()
    batch.save(
        using=db,
        update_fields=["remaining_qty", "return_remaining_qty", "status"],
    )
