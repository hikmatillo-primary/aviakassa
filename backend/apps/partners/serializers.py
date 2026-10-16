from rest_framework import serializers
from .models import Partner

class PartnerSerializer(serializers.ModelSerializer):
    totalSoldToUs = serializers.SerializerMethodField()
    totalPaidByUs = serializers.SerializerMethodField()
    totalBoughtFromUs = serializers.SerializerMethodField()
    totalPaidToUs = serializers.SerializerMethodField()
    theyOweUs = serializers.SerializerMethodField()
    weOweThem = serializers.SerializerMethodField()
    balance = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    def _financials(self, obj):
        # Har bir hamkor uchun moliyaviy ko'rsatkichlar bitta o'tishda hisoblanadi
        # va serializer nusxasida keshlanadi (avval ~3x takrorlanardi).
        cache = getattr(self, "_financials_cache", None)
        if cache is None:
            cache = {}
            self._financials_cache = cache
        if obj.pk not in cache:
            cache[obj.pk] = obj.compute_financials()
        return cache[obj.pk]

    def get_totalSoldToUs(self, obj):
        return self._financials(obj)["total_sold_to_us"]

    def get_totalPaidByUs(self, obj):
        return self._financials(obj)["total_paid_by_us"]

    def get_totalBoughtFromUs(self, obj):
        return self._financials(obj)["total_bought_from_us"]

    def get_totalPaidToUs(self, obj):
        return self._financials(obj)["total_paid_to_us"]

    def get_theyOweUs(self, obj):
        return self._financials(obj)["they_owe_us"]

    def get_weOweThem(self, obj):
        return self._financials(obj)["we_owe_them"]

    def get_balance(self, obj):
        return self._financials(obj)["balance"]

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
            'totalSoldToUs',
            'totalPaidByUs',
            'totalBoughtFromUs',
            'totalPaidToUs',
            'theyOweUs',
            'weOweThem',
            'balance',
        ]
