"""Hamkorlar moliyaviy hisob-kitoblari xizmati (Service Layer)."""
from typing import Dict
from core.money import ZERO, as_number, money_sum, to_money


def compute_partner_financials(partner) -> Dict:
    """Hamkor bo'yicha barcha moliyaviy ko'rsatkichlarni aniq Decimal bilan hisoblaydi."""
    # Faqat hisobga olingan partiyalar qarzga qo'shiladi (avto-xarid
    # «Hisobga qo'shish» bosilgunga qadar balansda ko'rinmaydi).
    total_sold_to_us = money_sum(
        b.total_cost for b in partner.batches.all() if b.accounted_at is not None
    )
    total_paid_by_us = money_sum(
        p.amount for p in partner.payments.all() if p.type == 'EXPENSE'
    )
    total_bought_from_us = money_sum(s.total_amount for s in partner.sales.all())
    total_paid_to_us = money_sum(
        p.amount for p in partner.payments.all() if p.type == 'INCOME'
    )
    total_offset_from = money_sum(o.amount for o in partner.offsets_from.all())
    total_offset_to = money_sum(o.amount for o in partner.offsets_to.all())

    # Bizdan qarzi bo'lsa: manfiy (-); Haqi bo'lsa: musbat (+)
    client_debt = total_bought_from_us - total_paid_to_us
    supplier_debt = total_sold_to_us - total_paid_by_us
    balance = to_money(
        supplier_debt - client_debt + total_offset_from - total_offset_to, ZERO
    )

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
