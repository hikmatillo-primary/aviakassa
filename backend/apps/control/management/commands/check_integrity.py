"""Ma'lumotlar butunligini tekshiruvchi buyruq.

Hisob-kitobda "jim" xato qolib ketmasligi uchun barcha asosiy invariantlar
tekshiriladi:

  * partiya qoldig'i = jami − sotilgan (borish/kelish alohida),
  * partiya tannarxi = tan narx × soni,
  * sotuv summasi va foydasi = (sotish − tannarx) × soni,
  * sotuvning reys ma'lumotlari partiyasi bilan mos,
  * faol baza yagona.

Xato topsa — 1 kod bilan chiqadi (CI/deploy tekshiruvi uchun).
"""
from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db.models import Q, Sum

from apps.cash.models import DebtOffset, Payment
from apps.flights.models import Batch
from apps.partners.models import Partner
from apps.sales.models import Sale
from core.db_state import get_active_alias
from core.money import to_money


class Command(BaseCommand):
    help = "Qoldiq, foyda va balans invariantlarini tekshiradi (o'zgartirmaydi)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit", type=int, default=50,
            help="Har bir turdagi xatolikdan ko'pi bilan nechtasini ko'rsatish.",
        )

    def handle(self, *args, **options):
        db = get_active_alias()
        limit = options["limit"]
        problems = []

        def report(kind, detail):
            problems.append((kind, detail))

        # --- Partiyalar ---
        batches = list(Batch.objects.using(db).all())
        usage = {
            row["batch_id"]: row
            for row in Sale.objects.using(db)
            .values("batch_id")
            .annotate(
                out=Sum("qty", filter=Q(segment__in=["", "OUTBOUND", "BOTH"])),
                ret=Sum("qty", filter=Q(segment__in=["RETURN", "BOTH"])),
                total=Sum("qty"),
            )
        }

        for batch in batches:
            row = usage.get(batch.pk, {})
            sold_out = row.get("out") or 0
            sold_ret = row.get("ret") or 0
            expected_out = batch.total_qty - sold_out
            if batch.remaining_qty != expected_out:
                report(
                    "QOLDIQ",
                    f"{batch.batch_number}: qoldiq={batch.remaining_qty}, "
                    f"kutilgan={expected_out} (jami {batch.total_qty}, sotilgan {sold_out})",
                )

            if batch.is_round_trip:
                expected_ret = batch.total_qty - sold_ret
                actual_ret = batch.return_remaining_qty
                if actual_ret is None:
                    actual_ret = batch.total_qty
                if actual_ret != expected_ret:
                    report(
                        "QOLDIQ",
                        f"{batch.batch_number}: kelish qoldig'i={actual_ret}, "
                        f"kutilgan={expected_ret} (sotilgan {sold_ret})",
                    )

            expected_cost = to_money(batch.buy_price * batch.total_qty)
            if to_money(batch.total_cost) != expected_cost:
                report(
                    "TANNARX",
                    f"{batch.batch_number}: total_cost={batch.total_cost}, kutilgan={expected_cost}",
                )

            expected_status = (
                "COMPLETED"
                if batch.remaining_qty == 0
                and (
                    not batch.is_round_trip
                    or (batch.return_remaining_qty
                        if batch.return_remaining_qty is not None
                        else batch.total_qty) == 0
                )
                else "ACTIVE"
            )
            if batch.status != expected_status:
                report(
                    "HOLAT",
                    f"{batch.batch_number}: status={batch.status}, kutilgan={expected_status}",
                )

        # --- Sotuvlar ---
        batch_by_id = {b.pk: b for b in batches}
        sales = list(Sale.objects.using(db).all())
        for sale in sales:
            expected_total = to_money(sale.sell_price * sale.qty)
            if to_money(sale.total_amount) != expected_total:
                report(
                    "SUMMA",
                    f"Sotuv #{sale.pk}: total_amount={sale.total_amount}, kutilgan={expected_total}",
                )
            expected_profit = to_money(expected_total - sale.buy_price * sale.qty)
            if to_money(sale.profit) != expected_profit:
                report(
                    "FOYDA",
                    f"Sotuv #{sale.pk}: profit={sale.profit}, kutilgan={expected_profit}",
                )
            batch = batch_by_id.get(sale.batch_id)
            if batch:
                if to_money(sale.buy_price) != to_money(batch.buy_price):
                    report(
                        "TAN_NARX",
                        f"Sotuv #{sale.pk}: buy_price={sale.buy_price}, "
                        f"partiya tannarxi={batch.buy_price}",
                    )
                if sale.flight_number != batch.flight_number:
                    report(
                        "REYS",
                        f"Sotuv #{sale.pk}: reys='{sale.flight_number}', "
                        f"partiyada='{batch.flight_number}'",
                    )
                if not batch.is_round_trip and sale.segment:
                    report(
                        "SEGMENT",
                        f"Sotuv #{sale.pk}: oddiy partiyada segment='{sale.segment}'",
                    )

        # --- Kassa ---
        for payment in Payment.objects.using(db).all():
            if to_money(payment.amount) <= Decimal("0.00"):
                report("TO'LOV", f"To'lov #{payment.pk}: summa={payment.amount} (musbat bo'lishi kerak)")
        for offset in DebtOffset.objects.using(db).all():
            if offset.from_partner_id == offset.to_partner_id:
                report("SALDO", f"Qarz surish #{offset.pk}: hamkorlar bir xil")

        # --- Hamkor balansi ---
        for partner in Partner.objects.using(db).prefetch_related(
            "batches", "sales", "payments", "offsets_from", "offsets_to"
        ):
            data = partner.compute_financials()
            expected = to_money(
                (data["total_sold_to_us"] - data["total_paid_by_us"])
                - (data["total_bought_from_us"] - data["total_paid_to_us"])
                + data["total_offset_from"]
                - data["total_offset_to"]
            )
            if to_money(data["balance"]) != expected:
                report("BALANS", f"{partner.name}: balance={data['balance']}, kutilgan={expected}")

        # --- Faol baza yagonaligi ---
        try:
            from apps.control.models import DatabaseRegistry

            registry = DatabaseRegistry.objects.using("default")
            total_databases = registry.count()
            active_count = registry.filter(is_active=True).count()
            # Ro'yxat hali bo'sh bo'lsa (birinchi ishga tushirish) — bu xato emas.
            if active_count > 1 or (total_databases > 0 and active_count == 0):
                report(
                    "BAZA",
                    f"Faol bazalar soni {active_count} (1 bo'lishi kerak, "
                    f"jami {total_databases} ta baza)",
                )
        except Exception:  # pragma: no cover - jadval hali yo'q bo'lishi mumkin
            pass

        # --- Natija ---
        if not problems:
            self.stdout.write(self.style.SUCCESS(
                f"OK: {len(batches)} partiya, {len(sales)} sotuv tekshirildi — xato yo'q."
            ))
            return

        by_kind = {}
        for kind, detail in problems:
            by_kind.setdefault(kind, []).append(detail)

        self.stderr.write(self.style.ERROR(f"{len(problems)} ta muammo topildi:"))
        for kind, details in by_kind.items():
            self.stderr.write(f"\n[{kind}] {len(details)} ta")
            for detail in details[:limit]:
                self.stderr.write(f"  - {detail}")
            if len(details) > limit:
                self.stderr.write(f"  ... yana {len(details) - limit} ta")

        raise CommandError("Ma'lumotlarda nomuvofiqlik bor — yuqoridagi ro'yxatni ko'ring.")
