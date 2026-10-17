"""Pul bilan ishlash uchun yagona qoida.

Butun tizimda pul faqat `Decimal` bilan hisoblanadi va har bir operatsiyadan
keyin 2 xonagacha yaxlitlanadi (ROUND_HALF_UP). Float faqat API/brauzer
chegarasida ishlatiladi.
"""
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

CENT = Decimal("0.01")
ZERO = Decimal("0.00")


def to_money(value, default=None):
    """Qiymatni aniq Decimal pulga aylantiradi (2 xona, ROUND_HALF_UP).

    `None` yoki bo'sh qiymat uchun `default` qaytaradi.
    Noto'g'ri qiymatda ValueError ko'taradi — chaqiruvchi uni 400 ga aylantiradi.
    """
    if value is None or value == "":
        return default
    if isinstance(value, Decimal):
        dec = value
    elif isinstance(value, bool):
        raise ValueError("Pul qiymati mantiqiy (true/false) bo'lishi mumkin emas.")
    elif isinstance(value, float):
        # float -> str orqali: 0.1 uchun Decimal('0.1') olinadi, 0.1000000000000000055 emas.
        dec = Decimal(str(value))
    else:
        dec = Decimal(str(value).strip())
    try:
        return dec.quantize(CENT, rounding=ROUND_HALF_UP)
    except InvalidOperation as exc:  # pragma: no cover - himoyaviy
        raise ValueError(f"Pul qiymati noto'g'ri: {value!r}") from exc


def money_sum(values):
    """Decimal yig'indi (bo'sh ro'yxat uchun 0.00)."""
    total = ZERO
    for value in values:
        if value is None:
            continue
        total += value if isinstance(value, Decimal) else to_money(value, ZERO)
    return total.quantize(CENT, rounding=ROUND_HALF_UP)


def as_number(value):
    """Decimal -> API uchun son (float). Faqat javob chegarasida ishlatiladi."""
    return float(to_money(value, ZERO))
