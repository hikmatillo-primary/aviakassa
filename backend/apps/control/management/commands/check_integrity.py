"""Ma'lumotlar butunligini tekshiruvchi buyruq.

Hisob-kitobda "jim" xato qolib ketmasligi uchun barcha asosiy invariantlar
tekshiriladi:

  * partiya qoldig'i = jami − sotilgan (borish/kelish alohida),
  * partiya tannarxi = tan narx × soni,
  * sotuv summasi va foydasi = (sotish − tannarx) × soni,
  * sotuvning reys ma'lumotlari partiyasi bilan mos,
  * faol baza yagona.

Standart rejimda HTTP so'rovlarga xizmat qilayotgan **faol baza** tekshiriladi
(middleware bo'lmagan buyruqda avval `default` olinardi — ko'p-bazali rejimda
bu xato xulosaga olib kelardi). Qo'shimcha:

  * `--database ALIAS` — aniq baza (alias yoki db_name),
  * `--all` — asosiy baza + ro'yxatdagi barcha bazalar ketma-ket.

Xato topsa — 1 kod bilan chiqadi (CI/deploy tekshiruvi uchun).
"""
from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db import connections
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
        parser.add_argument(
            "--database", dest="database", default=None,
            help="Tekshiriladigan baza (alias yoki db_name). Standart: faol baza.",
        )
        parser.add_argument(
            "--all", dest="all", action="store_true",
            help="Asosiy baza va ro'yxatdagi barcha bazalarni ketma-ket tekshiradi.",
        )

    # ---------- Maqsad bazalarni aniqlash ----------

    @staticmethod
    def _db_name(alias: str) -> str:
        try:
            return str(connections[alias].settings_dict.get("NAME") or alias)
        except Exception:  # pragma: no cover - himoyaviy
            return alias

    def _resolve_alias(self, value: str) -> str:
        """Berilgan qiymatni Django ulanish aliasiga aylantiradi.

        `default` yoki allaqachon ulangan alias bo'lsa — o'zini qaytaradi;
        aks holda uni db_name deb qabul qiladi (ko'p-bazali rejim).
        """
        if value in connections.databases:
            return value
        from apps.control.services import ensure_alias

        return ensure_alias(value)

    def _targets(self, options):
        """Tekshiriladigan (label, alias) juftliklar ro'yxatini qaytaradi."""
        if options["database"]:
            alias = self._resolve_alias(options["database"])
            return [(self._db_name(alias), alias)]

        if options["all"]:
            targets = [(self._db_name("default"), "default")]
            try:
                from apps.control.models import DatabaseRegistry
                from apps.control.services import ensure_alias

                for registry in DatabaseRegistry.objects.using("default").all():
                    alias = ensure_alias(registry.db_name)
                    targets.append((registry.db_name, alias))
            except Exception as exc:  # pragma: no cover - jadval yo'q bo'lishi mumkin
                self.stderr.write(
                    f"Bazalar ro'yxatini o'qib bo'lmadi ({exc}) — faqat asosiy baza tekshiriladi."
                )

            # db_name bo'yicha takrorlarni olib tashlaymiz.
            seen = set()
            unique = []
            for label, alias in targets:
                if label in seen:
                    continue
                seen.add(label)
                unique.append((label, alias))
            return unique

        # Standart: HTTP so'rovlarga xizmat qiladigan faol baza.
        try:
            from apps.control.services import resolve_active_alias

            alias = resolve_active_alias()
        except Exception:  # pragma: no cover - himoyaviy
            alias = get_active_alias()
        return [(self._db_name(alias), alias)]

    # ---------- Tekshiruvlar ----------

    def _check_alias(self, db: str, limit: int):
        """Bitta bazani tekshiradi va (xatolar, partiyalar soni, sotuvlar soni) qaytaradi."""
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
                ret_total = batch.return_total_qty if batch.return_total_qty is not None else batch.total_qty
                expected_ret = ret_total - sold_ret
                actual_ret = batch.return_remaining_qty
                if actual_ret is None:
                    actual_ret = ret_total
                if actual_ret != expected_ret:
                    report(
                        "QOLDIQ",
                        f"{batch.batch_number}: kelish qoldig'i={actual_ret}, "
                        f"kutilgan={expected_ret} (sotilgan {sold_ret})",
                    )

            if batch.is_round_trip and batch.return_buy_price is not None and batch.return_total_qty is not None:
                expected_cost = to_money(
                    (batch.buy_price * batch.total_qty)
                    + (batch.return_buy_price * batch.return_total_qty)
                )
            else:
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

        return problems, len(batches), len(sales)

    def _check_single_active(self, limit: int):
        """Ro'yxatda bir vaqtda faqat bitta faol baza bo'lishi shart."""
        try:
            from apps.control.models import DatabaseRegistry

            registry = DatabaseRegistry.objects.using("default")
            total_databases = registry.count()
            active_count = registry.filter(is_active=True).count()
            # Ro'yxat hali bo'sh bo'lsa (birinchi ishga tushirish) — bu xato emas.
            if active_count > 1 or (total_databases > 0 and active_count == 0):
                return [(
                    "BAZA",
                    f"Faol bazalar soni {active_count} (1 bo'lishi kerak, "
                    f"jami {total_databases} ta baza)",
                )]
        except Exception:  # pragma: no cover - jadval hali yo'q bo'lishi mumkin
            pass
        return []

    # ---------- Kirish nuqtasi ----------

    def handle(self, *args, **options):
        limit = options["limit"]
        targets = self._targets(options)
        multi = len(targets) > 1
        total_problems = 0
        checked = 0

        for label, alias in targets:
            if multi:
                self.stdout.write(f"\n=== {label} ===")
            try:
                problems, n_batches, n_sales = self._check_alias(alias, limit)
            except Exception as exc:
                total_problems += 1
                self.stderr.write(
                    self.style.ERROR(f"[{label}] tekshirib bo'lmadi: {exc}")
                )
                continue

            checked += 1
            if not problems:
                self.stdout.write(self.style.SUCCESS(
                    f"OK: {n_batches} partiya, {n_sales} sotuv tekshirildi — xato yo'q."
                ))
                continue

            total_problems += len(problems)
            self.stderr.write(self.style.ERROR(f"[{label}] {len(problems)} ta muammo topildi:"))
            by_kind = {}
            for kind, detail in problems:
                by_kind.setdefault(kind, []).append(detail)
            for kind, details in by_kind.items():
                self.stderr.write(f"\n[{kind}] {len(details)} ta")
                for detail in details[:limit]:
                    self.stderr.write(f"  - {detail}")
                if len(details) > limit:
                    self.stderr.write(f"  ... yana {len(details) - limit} ta")

        # Faol baza yagonaligi — bazadan qat'i nazar bir marta tekshiriladi.
        registry_problems = self._check_single_active(limit)
        for kind, detail in registry_problems:
            total_problems += 1
            self.stderr.write(self.style.ERROR(f"\n[{kind}] {detail}"))

        if total_problems:
            raise CommandError("Ma'lumotlarda nomuvofiqlik bor — yuqoridagi ro'yxatni ko'ring.")

        if checked == 0:  # pragma: no cover - himoyaviy
            raise CommandError("Tekshirish uchun baza topilmadi.")
