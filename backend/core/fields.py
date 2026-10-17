from decimal import Decimal

from rest_framework import serializers

from core.money import to_money


class MoneyField(serializers.DecimalField):
    """Pul maydoni: kirishda float shovqinini tozalaydi, chiqishda son qaytaradi.

    `serializers.DecimalField` 2 xonadan ortiq qiymatni rad etadi. Brauzer
    hisob-kitobidan kelgan `123.45000000000002` kabi qiymatlar 400 xato
    bermasligi uchun ular oldindan 2 xonaga yaxlitlanadi.
    """

    def __init__(self, **kwargs):
        kwargs.setdefault("max_digits", 12)
        kwargs.setdefault("decimal_places", 2)
        super().__init__(**kwargs)

    def to_internal_value(self, data):
        if isinstance(data, bool):
            raise serializers.ValidationError("Pul qiymati mantiqiy bo'lishi mumkin emas.")
        if isinstance(data, (int, float)):
            try:
                data = str(to_money(data))
            except ValueError as exc:
                raise serializers.ValidationError(str(exc)) from exc
        elif isinstance(data, Decimal):
            data = str(to_money(data))
        return super().to_internal_value(data)
