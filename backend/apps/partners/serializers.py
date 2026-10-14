from rest_framework import serializers
from .models import Partner

class PartnerSerializer(serializers.ModelSerializer):
    totalSoldToUs = serializers.FloatField(source='total_sold_to_us', read_only=True)
    totalPaidByUs = serializers.FloatField(source='total_paid_by_us', read_only=True)
    totalBoughtFromUs = serializers.FloatField(source='total_bought_from_us', read_only=True)
    totalPaidToUs = serializers.FloatField(source='total_paid_to_us', read_only=True)
    theyOweUs = serializers.FloatField(source='they_owe_us', read_only=True)
    weOweThem = serializers.FloatField(source='we_owe_them', read_only=True)
    balance = serializers.FloatField(source='net_balance', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Partner
        fields = [
            'id',
            'name',
            'type',
            'tags',
            'phone',
            'notes',
            'createdAt',
            'created_at',
            'totalSoldToUs',
            'totalPaidByUs',
            'totalBoughtFromUs',
            'totalPaidToUs',
            'theyOweUs',
            'weOweThem',
            'balance',
        ]
