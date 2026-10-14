from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(["GET"])
def health_check(request):
    return Response({
        "status": "ok",
        "service": "Aviakassa API",
        "version": "1.0.0"
    })

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check, name="health-check"),
    path("api/partners/", include("apps.partners.urls")),
    path("api/batches/", include("apps.flights.urls")),
    path("api/sales/", include("apps.sales.urls")),
    path("api/cash/", include("apps.cash.urls")),
]
