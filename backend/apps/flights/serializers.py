from rest_framework import serializers
from .models import Batch
from apps.partners.models import Partner

class BatchSerializer(serializers.ModelSerializer):
    batchNumber = serializers.CharField(source='batch_number')
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
    totalQty = serializers.IntegerField(source='total_qty')
    remainingQty = serializers.IntegerField(source='remaining_qty', required=False)
    buyPrice = serializers.FloatField(source='buy_price')
    totalCost = serializers.FloatField(source='total_cost', required=False)
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
        if 'remaining_qty' not in validated_data:
            validated_data['remaining_qty'] = validated_data['total_qty']
        if 'total_cost' not in validated_data:
            validated_data['total_cost'] = validated_data['buy_price'] * validated_data['total_qty']
        return super().create(validated_data)
