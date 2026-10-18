from django.db import models

from core.money import ZERO, as_number, money_sum, to_money

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
    # Barcha ko'rsatkichlar `compute_financials` da bir joyda hisoblanadi.

    def compute_financials(self) -> dict:
        """Hamkor bo'yicha barcha moliyaviy ko'rsatkichlarni bitta o'tishda hisoblaydi.

        Hisob-kitob faqat Decimal bilan bajariladi — float yaxlitlash xatosi yo'q.
        """
        # Faqat hisobga olingan partiyalar qarzga qo'shiladi (avto-xarid
        # «Hisobga qo'shish» bosilgunga qadar balansda ko'rinmaydi).
        total_sold_to_us = money_sum(
            b.total_cost for b in self.batches.all() if b.accounted_at is not None
        )
        total_paid_by_us = money_sum(
            p.amount for p in self.payments.all() if p.type == 'EXPENSE'
        )
        total_bought_from_us = money_sum(s.total_amount for s in self.sales.all())
        total_paid_to_us = money_sum(
            p.amount for p in self.payments.all() if p.type == 'INCOME'
        )
        total_offset_from = money_sum(o.amount for o in self.offsets_from.all())
        total_offset_to = money_sum(o.amount for o in self.offsets_to.all())

        # Bizdan qarzi bo'lsa: manfiy (-); Haqi bo'lsa: musbat (+)
        client_debt = total_bought_from_us - total_paid_to_us
        supplier_debt = total_sold_to_us - total_paid_by_us
        balance = to_money(supplier_debt - client_debt + total_offset_from - total_offset_to, ZERO)

        return {
            "total_sold_to_us": total_sold_to_us,
            "total_paid_by_us": total_paid_by_us,
            "total_bought_from_us": total_bought_from_us,
            "total_paid_to_us": total_paid_to_us,
            "total_offset_from": total_offset_from,
            "total_offset_to": total_offset_to,
            "balance": balance,
            "they_owe_us": abs(balance) if balance < 0 else ZERO,
            "we_owe_them": balance if balance > 0 else ZERO,
        }

    @property
    def total_sold_to_us(self) -> float:
        """Ushbu hamkordan sotib olingan partiyalar summasi (Vendor sifatida)."""
        return as_number(self.compute_financials()["total_sold_to_us"])

    @property
    def total_paid_by_us(self) -> float:
        """Biz ushbu hamkorga to'lagan xarajatlarimiz (Vendor ga to'lov)."""
        return as_number(self.compute_financials()["total_paid_by_us"])

    @property
    def total_bought_from_us(self) -> float:
        """Ushbu hamkor bizdan xarid qilgan chiptalar summasi (Mijoz sifatida)."""
        return as_number(self.compute_financials()["total_bought_from_us"])

    @property
    def total_paid_to_us(self) -> float:
        """Ushbu hamkor bizga to'lagan tushumlar (Mijoz to'lovi)."""
        return as_number(self.compute_financials()["total_paid_to_us"])

    @property
    def total_offset_from(self) -> float:
        """Ushbu hamkordan boshqa hamkorga surilgan qarz summasi."""
        return as_number(self.compute_financials()["total_offset_from"])

    @property
    def total_offset_to(self) -> float:
        """Boshqa hamkordan ushbu hamkor foydasiga o'tkazilgan qarz summasi."""
        return as_number(self.compute_financials()["total_offset_to"])

    @property
    def net_balance(self) -> float:
        """
        Hamkor balansi (DebtOffset - qarz surishlar hisobga olingan):
        Bizdan qarzi bo'lsa: manfiy (-)
        Haqi bo'lsa: musbat (+)
        """
        return as_number(self.compute_financials()["balance"])

    @property
    def they_owe_us(self) -> float:
        return as_number(self.compute_financials()["they_owe_us"])

    @property
    def we_owe_them(self) -> float:
        return as_number(self.compute_financials()["we_owe_them"])
