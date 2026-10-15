from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    return Response({
        "status": "ok",
        "service": "Aviakassa API",
        "version": "1.0.0"
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    return Response({
        "id": request.user.id,
        "username": request.user.username,
        "name": request.user.get_full_name() or request.user.username,
        "isStaff": request.user.is_staff,
    })

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check, name="health-check"),
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/user/", current_user, name="current_user"),
    path("api/partners/", include("apps.partners.urls")),
    path("api/batches/", include("apps.flights.urls")),
    path("api/sales/", include("apps.sales.urls")),
    path("api/cash/", include("apps.cash.urls")),
]

