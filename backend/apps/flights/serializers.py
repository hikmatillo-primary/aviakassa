from decimal import Decimal

from rest_framework import serializers

from core.db_state import get_active_alias
from core.fields import MoneyField
from core.money import to_money

from .models import Batch, BatchCategory
from apps.partners.models import Partner
from apps.sales.models import Sale


class BatchCategorySerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = BatchCategory
        fields = ['id', 'name', 'createdAt']

    def validate_name(self, value):
        name = (value or "").strip()
        if not name:
            raise serializers.ValidationError("Xarid turi nomi bo'sh bo'lishi mumkin emas.")
        return name

class BatchSerializer(serializers.ModelSerializer):
    batchNumber = serializers.CharField(source='batch_number', required=False, allow_blank=True)
    flightDate = serializers.DateField(source='flight_date')
    flightNumber = serializers.CharField(source='flight_number', required=False, allow_blank=True)
    departureTime = serializers.CharField(source='departure_time', required=False, allow_blank=True)
    arrivalTime = serializers.CharField(source='arrival_time', required=False, allow_blank=True)
    isRoundTrip = serializers.BooleanField(source='is_round_trip', required=False)
    returnDate = serializers.DateField(source='return_date', required=False, allow_null=True)
    returnFlightNumber = serializers.CharField(source='return_flight_number', required=False, allow_blank=True)
    returnDepartureTime = serializers.CharField(source='return_departure_time', required=False, allow_blank=True)
    returnArrivalTime = serializers.CharField(source='return_arrival_time', required=False, allow_blank=True)
    purchaseDate = serializers.DateField(source='purchase_date', required=False, allow_null=True)
    supplierId = serializers.PrimaryKeyRelatedField(source='supplier', queryset=Partner.objects.all())
    supplierName = serializers.CharField(source='supplier.name', read_only=True)
    totalQty = serializers.IntegerField(source='total_qty', min_value=1)
    remainingQty = serializers.IntegerField(source='remaining_qty', read_only=True)
    # Borish-kelish partiyalarida kelish o'rinlari qoldig'i (oddiy partiyada ahamiyatsiz).
    returnRemainingQty = serializers.IntegerField(source='return_remaining_qty', read_only=True)
    buyPrice = MoneyField(source='buy_price', min_value=Decimal("0"))
    totalCost = MoneyField(source='total_cost', max_digits=14, read_only=True)
    # Holat qoldiqdan avtomatik hisoblanadi (Batch.save), shuning uchun faqat o'qish uchun.
    status = serializers.ChoiceField(choices=Batch.Status.choices, read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    # --- Avto xarid / hisobga olish / kategoriya ---
    categoryId = serializers.PrimaryKeyRelatedField(
        source='category', queryset=BatchCategory.objects.all(),
        required=False, allow_null=True,
    )
    categoryName = serializers.SerializerMethodField()

    def get_categoryName(self, obj):
        return obj.category.name if obj.category_id else None
    isAuto = serializers.BooleanField(source='is_auto', read_only=True)
    accountedAt = serializers.DateTimeField(source='accounted_at', read_only=True)
    seriesId = serializers.UUIDField(source='series_id', read_only=True, allow_null=True)
    returnGapDays = serializers.IntegerField(source='return_gap_days', read_only=True, allow_null=True)
    # Vaqt o'zgarganda shu seriyadagi keyingi reyslarga ham qo'llash.
    propagateToFuture = serializers.BooleanField(required=False, write_only=True)

    class Meta:
        model = Batch
        fields = [
            'id',
            'batchNumber',
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
            'purchaseDate',
            'baggage',
            'supplierId',
            'supplierName',
            'totalQty',
            'remainingQty',
            'returnRemainingQty',
            'buyPrice',
            'totalCost',
            'status',
            'notes',
            'createdAt',
            'categoryId',
            'categoryName',
            'isAuto',
            'accountedAt',
            'seriesId',
            'returnGapDays',
            'propagateToFuture',
        ]

    def create(self, validated_data):
        # Raqam bo'sh bo'lsa model o'zi generatsiya qiladi; band bo'lsa model
        # aniq xato qaytaradi (jim ravishda boshqa raqam qo'yilmaydi).
        validated_data.pop('propagateToFuture', None)
        return super().create(validated_data)

    def validate(self, attrs):
        # Sotilgan chiptadan kam qilib jami sonni o'zgartirib bo'lmaydi.
        # Borish-kelish partiyada ikkita qoldiq (borish/kelish) alohida yuritiladi —
        # jami son ikkalasidan ham kichik bo'lmasligi kerak.
        total_qty = attrs.get('total_qty', getattr(self.instance, 'total_qty', None))
        if self.instance is not None and total_qty is not None:
            sold_out = self.instance.total_qty - self.instance.remaining_qty
            sold_ret = 0
            if self.instance.is_round_trip:
                ret_left = self.instance.return_remaining_qty
                if ret_left is None:
                    ret_left = self.instance.total_qty
                sold_ret = self.instance.total_qty - ret_left
            sold = max(sold_out, sold_ret)
            if total_qty < sold:
                if sold_ret > sold_out:
                    detail = (
                        f"Jami son sotilgan kelish chiptalari ({sold} ta) dan kam bo'lishi mumkin emas. "
                        f"Borish: {sold_out} ta, kelish: {sold_ret} ta sotilgan."
                    )
                else:
                    detail = f"Jami son sotilgan ({sold} ta) dan kam bo'lishi mumkin emas."
                raise serializers.ValidationError({"totalQty": detail})
        return attrs

    def update(self, instance, validated_data):
        propagate = validated_data.pop('propagateToFuture', False)
        # total_qty o'zgarsa, qoldiqni shu farqqa moslab o'zgartiramiz (sotilganlar saqlanadi).
        # Borish-kelish partiyada ikkala pool ham delta bo'yicha moslashadi.
        if 'total_qty' in validated_data:
            delta = validated_data['total_qty'] - instance.total_qty
            if delta:
                validated_data['remaining_qty'] = max(0, instance.remaining_qty + delta)
                new_round_trip = validated_data.get('is_round_trip', instance.is_round_trip)
                if new_round_trip:
                    ret_left = instance.return_remaining_qty
                    if ret_left is None:
                        ret_left = instance.total_qty
                    validated_data['return_remaining_qty'] = max(0, ret_left + delta)

        old_buy_price = instance.buy_price
        obj = super().update(instance, validated_data)

        # Tan narx o'zgargan bo'lsa, shu partiyaga tegishli sotuvlarning
        # tan narxi va sof foydasini aniq Decimal bilan qayta hisoblaymiz.
        if 'buy_price' in validated_data and obj.buy_price != old_buy_price:
            new_price = to_money(obj.buy_price)
            db = get_active_alias()
            sales = list(
                Sale.objects.using(db).filter(batch=obj).only("pk", "total_amount", "qty")
            )
            for sale in sales:
                sale.buy_price = new_price
                sale.profit = to_money(sale.total_amount - new_price * sale.qty)
            if sales:
                Sale.objects.using(db).bulk_update(sales, ["buy_price", "profit"], batch_size=500)

        # Vaqt/reys o'zgarishi shu seriyadagi KEYINGI reyslarga ham qo'llanadi
        # (o'tgan sanalardagi reyslar tegilmaydi — ular allaqachon sotilgan).
        if propagate and obj.series_id:
            propagate_fields = (
                'flight_number', 'departure_time', 'arrival_time',
                'return_flight_number', 'return_departure_time', 'return_arrival_time',
                'baggage',
            )
            updates = {
                field: getattr(obj, field)
                for field in propagate_fields
                if field in validated_data
            }
            if updates:
                Batch.objects.using(get_active_alias()).filter(
                    series_id=obj.series_id, flight_date__gte=obj.flight_date
                ).exclude(pk=obj.pk).update(**updates)
        return obj
