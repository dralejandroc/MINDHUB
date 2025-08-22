"""
Finance URL configuration for MindHub Finance API
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    IncomeViewSet, CashRegisterCutViewSet, 
    FinancialServiceViewSet, PaymentMethodConfigViewSet
)

# Create router and register viewsets
router = DefaultRouter()
router.register(r'income', IncomeViewSet, basename='income')
router.register(r'cash-register-cuts', CashRegisterCutViewSet, basename='cash-register-cuts')
router.register(r'services', FinancialServiceViewSet, basename='financial-services')
router.register(r'payment-methods', PaymentMethodConfigViewSet, basename='payment-methods')

app_name = 'finance'

urlpatterns = [
    # API endpoints
    path('api/', include(router.urls)),
    
    # Custom endpoints that map to frontend expectations
    path('api/stats/', IncomeViewSet.as_view({'get': 'stats'}), name='finance-stats'),
    path('api/dashboard/', IncomeViewSet.as_view({'get': 'dashboard'}), name='finance-dashboard'),
]