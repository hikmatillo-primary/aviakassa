from django.contrib import admin
from .models import Payment, DebtOffset

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'partner', 'type', 'amount', 'payment_method', 'payment_date', 'created_at')
    list_filter = ('type', 'payment_method', 'payment_date', 'partner')
    search_fields = ('partner__name', 'notes')


@admin.register(DebtOffset)
class DebtOffsetAdmin(admin.ModelAdmin):
    list_display = ('id', 'from_partner', 'to_partner', 'amount', 'date', 'created_at')
    list_filter = ('date', 'from_partner', 'to_partner')
    search_fields = ('from_partner__name', 'to_partner__name', 'notes')
