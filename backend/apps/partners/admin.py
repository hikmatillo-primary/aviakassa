from django.contrib import admin
from .models import Partner

@admin.register(Partner)
class PartnerAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'phone', 'net_balance_display', 'created_at')
    list_filter = ('type', 'created_at')
    search_fields = ('name', 'phone', 'notes')

    @admin.display(description="Sal'do ($)")
    def net_balance_display(self, obj):
        bal = obj.net_balance
        if bal > 0:
            return f"+${bal:,.2f} (Mijoz qarzi)"
        elif bal < 0:
            return f"-${abs(bal):,.2f} (Bizning qarz)"
        return "$0.00"
