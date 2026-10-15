from rest_framework import serializers
from .models import Payment, DebtOffset
from apps.partners.models import Partner

class PaymentSerializer(serializers.ModelSerializer):
    partnerId = serializers.PrimaryKeyRelatedField(source='partner', queryset=Partner.objects.all())
    partnerName = serializers.CharField(source='partner.name', read_only=True)
    partnerType = serializers.CharField(source='partner.type', read_only=True)
    paymentDate = serializers.DateField(source='payment_date')
    paymentMethod = serializers.ChoiceField(
        source='payment_method',
        choices=Payment.PaymentMethod.choices,
        default=Payment.PaymentMethod.CASH,
    )
    amount = serializers.FloatField(min_value=0.01)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id',
            'partnerId',
            'partnerName',
            'partnerType',
            'type',
            'amount',
            'paymentDate',
            'paymentMethod',
            'notes',
            'createdAt',
        ]


class DebtOffsetSerializer(serializers.ModelSerializer):
    fromPartnerId = serializers.PrimaryKeyRelatedField(source='from_partner', queryset=Partner.objects.all())
    fromPartnerName = serializers.CharField(source='from_partner.name', read_only=True)
    toPartnerId = serializers.PrimaryKeyRelatedField(source='to_partner', queryset=Partner.objects.all())
    toPartnerName = serializers.CharField(source='to_partner.name', read_only=True)
    amount = serializers.FloatField(min_value=0.01)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    def validate(self, attrs):
        from_partner = attrs.get('from_partner') or getattr(self.instance, 'from_partner', None)
        to_partner = attrs.get('to_partner') or getattr(self.instance, 'to_partner', None)
        if from_partner and to_partner and from_partner == to_partner:
            raise serializers.ValidationError(
                {"toPartnerId": "Qarzdor va haqdor hamkor bir xil bo'lishi mumkin emas."}
            )
        return attrs

    class Meta:
        model = DebtOffset
        fields = [
            'id',
            'fromPartnerId',
            'fromPartnerName',
            'toPartnerId',
            'toPartnerName',
            'amount',
            'date',
            'notes',
            'createdAt',
        ]
