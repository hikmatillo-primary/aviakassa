from django.contrib import admin
from .models import Batch

@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = (
        'batch_number',
        'route',
        'flight_date',
        'flight_number',
        'supplier',
        'remaining_qty_display',
        'buy_price',
        'status',
    )
    list_filter = ('status', 'is_round_trip', 'flight_date', 'supplier')
    search_fields = ('batch_number', 'route', 'flight_number', 'supplier__name')

    @admin.display(description="Qoldiq chiptalar")
    def remaining_qty_display(self, obj):
        return f"{obj.remaining_qty} / {obj.total_qty} ta"
