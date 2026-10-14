from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, DebtOffsetViewSet

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'offsets', DebtOffsetViewSet, basename='debt-offset')

urlpatterns = [
    path('', include(router.urls)),
]
