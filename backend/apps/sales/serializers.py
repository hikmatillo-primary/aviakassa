from decimal import Decimal

from django.utils import timezone
from rest_framework import serializers

from core.fields import MoneyField

from .models import Sale
from apps.flights.models import Batch
from apps.partners.models import Partner


class SaleSerializer(serializers.ModelSerializer):
    batchId = serializers.PrimaryKeyRelatedField(source='batch', queryset=Batch.objects.all())
    clientId = serializers.PrimaryKeyRelatedField(source='client', queryset=Partner.objects.all())
    clientName = serializers.CharField(source='client.name', read_only=True)
    batchNumber = serializers.CharField(source='batch.batch_number', read_only=True)

    flightDate = serializers.DateField(source='flight_date', required=False, allow_null=True)
    flightNumber = serializers.CharField(source='flight_number', required=False, allow_blank=True)
    departureTime = serializers.CharField(source='departure_time', required=False, allow_blank=True)
    arrivalTime = serializers.CharField(source='arrival_time', required=False, allow_blank=True)
    isRoundTrip = serializers.BooleanField(source='is_round_trip', required=False)
    returnDate = serializers.DateField(source='return_date', required=False, allow_null=True)
    returnFlightNumber = serializers.CharField(source='return_flight_number', required=False, allow_blank=True)
    returnDepartureTime = serializers.CharField(source='return_departure_time', required=False, allow_blank=True)
    returnArrivalTime = serializers.CharField(source='return_arrival_time', required=False, allow_blank=True)

    buyPrice = MoneyField(source='buy_price', required=False, min_value=Decimal("0"))
    sellPrice = MoneyField(source='sell_price', min_value=Decimal("0.01"))
    totalAmount = MoneyField(source='total_amount', max_digits=14, read_only=True)
    profit = MoneyField(max_digits=14, read_only=True)
    passengerNames = serializers.CharField(source='passenger_names', required=False, allow_blank=True)
    segment = serializers.ChoiceField(choices=Sale.Segment.choices, required=False, allow_blank=True)
    saleDate = serializers.DateField(source='sale_date')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    def validate(self, attrs):
        # PATCH'da maydonlar to'liq kelmasligi mumkin — mavjud qiymatlarni olamiz.
        prev_batch = self.instance.batch if self.instance else None
        prev_qty = self.instance.qty if self.instance else 0
        prev_segment = (self.instance.segment or "") if self.instance else ""

        batch = attrs.get('batch', prev_batch)
        qty = attrs.get('qty', prev_qty or 1)
        segment = attrs.get('segment', prev_segment)
        if qty <= 0:
            raise serializers.ValidationError({"qty": "Chiptalar soni kamida 1 ta bo'lishi kerak."})

        # Sotuv sanasi kelajakda bo'lishi mumkin emas (sotuv bugun yoki undan oldin amalga oshirilgan).
        sale_date = attrs.get('sale_date')
        if sale_date and sale_date > timezone.localdate():
            raise serializers.ValidationError({
                "saleDate": "Sotuv sanasi bugundan keyin bo'lishi mumkin emas."
            })

        if batch is None:
            return attrs

        # Segment normalizatsiyasi: oddiy partiyada bo'sh, borish-kelishda standart BOTH.
        if not batch.is_round_trip:
            segment = ""
            attrs['segment'] = ""
        elif not segment:
            segment = Sale.Segment.BOTH
            attrs['segment'] = Sale.Segment.BOTH

        batch_changed = batch != prev_batch
        segment_changed = self.instance is None or segment != prev_segment

        # Segment bo'yicha muddatlar: parvoz (borish) sanasi o'tgan bo'lsa faqat
        # kelish qoldiriladi; qaytish sanasi o'tgan bo'lsa o'sha qism sotilmaydi.
        today = timezone.localdate()
        if batch_changed or segment_changed:
            out_date = batch.flight_date
            ret_date = batch.return_date or batch.flight_date
            out_expired = bool(out_date and out_date < today)
            ret_expired = bool(ret_date and ret_date < today)
            fmt = lambda d: d.strftime('%d.%m.%Y') if d else "-"
            if not batch.is_round_trip:
                if out_expired:
                    raise serializers.ValidationError({
                        "batchId": f"Bu partiyaning muddati o'tgan ({fmt(out_date)}) — chipta sotib bo'linmaydi."
                    })
            else:
                if segment == Sale.Segment.OUTBOUND and out_expired:
                    raise serializers.ValidationError({
                        "segment": (
                            f"Borish muddati o'tgan ({fmt(out_date)}) — bu qismni sotib bo'linmaydi. "
                            "Faqat kelishni sotishingiz mumkin."
                        )
                    })
                if segment == Sale.Segment.RETURN and ret_expired:
                    raise serializers.ValidationError({
                        "segment": f"Kelish muddati o'tgan ({fmt(ret_date)}) — bu qismni sotib bo'linmaydi."
                    })
                if segment == Sale.Segment.BOTH:
                    if out_expired and ret_expired:
                        raise serializers.ValidationError({
                            "batchId": (
                                f"Partiyaning ikkala yo'nalish muddati ham o'tgan "
                                f"(borish {fmt(out_date)}, kelish {fmt(ret_date)})."
                            )
                        })
                    if out_expired:
                        raise serializers.ValidationError({
                            "segment": (
                                f"Borish muddati o'tgan ({fmt(out_date)}) — borish-kelish "
                                "variantini tanlab bo'lmaydi. Faqat kelishni sotish mumkin."
                            )
                        })
                    if ret_expired:
                        raise serializers.ValidationError({
                            "segment": f"Kelish muddati o'tgan ({fmt(ret_date)}) — borish-kelish variantini tanlab bo'lmaydi."
                        })

        # Qoldiq yetarliligini har bir yo'nalish (pool) bo'yicha tekshiramiz.
        new_out, new_ret = Sale.pool_usage(qty, segment)
        if self.instance is None or batch_changed:
            old_out = old_ret = 0
        else:
            old_out, old_ret = Sale.pool_usage(prev_qty, prev_segment)

        add_out = new_out - old_out
        add_ret = new_ret - old_ret
        if add_out > 0 and batch.remaining_qty < add_out:
            label = "Borish" if batch.is_round_trip else "Partiya"
            raise serializers.ValidationError({
                "qty": f"{label} qoldig'i yetarli emas! Qoldiq: {batch.remaining_qty} ta, qo'shimcha so'ralgan: {add_out} ta."
            })
        if add_ret > 0:
            ret_left = batch.return_remaining_qty
            if ret_left is None:
                ret_left = batch.total_qty
            if ret_left < add_ret:
                raise serializers.ValidationError({
                    "qty": f"Kelish qoldig'i yetarli emas! Qoldiq: {ret_left} ta, qo'shimcha so'ralgan: {add_ret} ta."
                })
        return attrs

    class Meta:
        model = Sale
        fields = [
            'id',
            'batchId',
            'batchNumber',
            'clientId',
            'clientName',
            'route',
            'flightDate',
            'flightNumber',
            'departureTime',
            'arrivalTime',
            'isRoundTrip',
            'returnDate',
            'returnFlightNumber',
            'returnDepartureTime',
            'returnArrivalTime',
            'buyPrice',
            'qty',
            'sellPrice',
            'totalAmount',
            'profit',
            'passengerNames',
            'segment',
            'saleDate',
            'notes',
            'createdAt',
        ]
