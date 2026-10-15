from decimal import Decimal
from rest_framework import serializers
from .models import Batch
from apps.partners.models import Partner
from apps.sales.models import Sale

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
    buyPrice = serializers.FloatField(source='buy_price', min_value=0)
    totalCost = serializers.FloatField(source='total_cost', read_only=True)
    status = serializers.ChoiceField(choices=Batch.Status.choices, required=False)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

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
            'buyPrice',
            'totalCost',
            'status',
            'notes',
            'createdAt',
        ]

    def create(self, validated_data):
        if not validated_data.get('batch_number'):
            validated_data['batch_number'] = Batch.generate_next_batch_number()
        else:
            if Batch.objects.filter(batch_number=validated_data['batch_number']).exists():
                validated_data['batch_number'] = Batch.generate_next_batch_number()

        validated_data['remaining_qty'] = validated_data['total_qty']
        validated_data['total_cost'] = validated_data['buy_price'] * validated_data['total_qty']
        return super().create(validated_data)

    def validate(self, attrs):
        # Sotilgan chiptadan kam qilib jami sonni o'zgartirib bo'lmaydi
        total_qty = attrs.get('total_qty', getattr(self.instance, 'total_qty', None))
        if self.instance is not None and total_qty is not None:
            sold = self.instance.total_qty - self.instance.remaining_qty
            if total_qty < sold:
                raise serializers.ValidationError({
                    "totalQty": f"Jami son sotilgan ({sold} ta) dan kam bo'lishi mumkin emas."
                })
        return attrs

    def update(self, instance, validated_data):
        # total_qty o'zgarsa, qoldiqni shu farqqa moslab o'zgartiramiz (sotilganlar saqlanadi)
        if 'total_qty' in validated_data:
            delta = validated_data['total_qty'] - instance.total_qty
            if delta:
                validated_data['remaining_qty'] = max(0, instance.remaining_qty + delta)

        old_buy_price = instance.buy_price
        obj = super().update(instance, validated_data)

        # Tan narx o'zgargan bo'lsa, shu partiyaga tegishli sotuvlarning
        # tan narxi va sof foydasini qayta hisoblaymiz (total_amount o'zgarmaydi).
        if 'buy_price' in validated_data and obj.buy_price != old_buy_price:
            new_price = Decimal(str(obj.buy_price))
            for sale in obj.sales.all():
                profit = sale.total_amount - new_price * Decimal(sale.qty)
                Sale.objects.filter(pk=sale.pk).update(buy_price=new_price, profit=profit)
        return obj
