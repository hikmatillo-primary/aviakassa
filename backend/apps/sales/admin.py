from django.contrib import admin
from .models import Sale

@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'client',
        'route',
        'flight_date',
        'qty',
        'sell_price',
        'total_amount',
        'profit',
        'sale_date',
    )
    list_filter = ('sale_date', 'is_round_trip', 'client')
    search_fields = ('client__name', 'passenger_names', 'route', 'flight_number')
