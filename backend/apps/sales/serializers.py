from rest_framework import serializers
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

    buyPrice = serializers.FloatField(source='buy_price', required=False, min_value=0)
    sellPrice = serializers.FloatField(source='sell_price', min_value=0.01)
    totalAmount = serializers.FloatField(source='total_amount', required=False, read_only=True)
    profit = serializers.FloatField(read_only=True)
    passengerNames = serializers.CharField(source='passenger_names', required=False, allow_blank=True)
    saleDate = serializers.DateField(source='sale_date')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    def validate(self, attrs):
        batch = attrs.get('batch')
        qty = attrs.get('qty', 1)
        if qty <= 0:
            raise serializers.ValidationError({"qty": "Chiptalar soni kamida 1 ta bo'lishi kerak."})
        if self.instance is None:
            if batch and batch.remaining_qty < qty:
                raise serializers.ValidationError({
                    "qty": f"Partiyada yetarli chipta yo'q! Qoldiq: {batch.remaining_qty} ta, so'ralgan: {qty} ta."
                })
        else:
            diff = qty - self.instance.qty
            if diff > 0 and batch and batch.remaining_qty < diff:
                raise serializers.ValidationError({
                    "qty": f"Partiyada qo'shimcha chipta yetarli emas! Qoldiq: {batch.remaining_qty} ta, qo'shimcha so'ralgan: {diff} ta."
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
            'saleDate',
            'notes',
            'createdAt',
        ]
