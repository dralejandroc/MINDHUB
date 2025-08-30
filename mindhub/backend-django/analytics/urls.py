"""
Analytics URLs - Healthcare Indicators System
URL patterns for analytics API endpoints
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    IndicatorDefinitionViewSet,
    IndicatorValueViewSet,
    PatientClassificationViewSet,
    SatisfactionSurveyViewSet,
    PrescriptionRefillViewSet,
    ClinicalProtocolEvaluationViewSet,
    IndicatorSettingsViewSet
)

router = DefaultRouter()
router.register(r'indicator-definitions', IndicatorDefinitionViewSet)
router.register(r'indicator-values', IndicatorValueViewSet)
router.register(r'patient-classifications', PatientClassificationViewSet)
router.register(r'satisfaction-surveys', SatisfactionSurveyViewSet)
router.register(r'prescription-refills', PrescriptionRefillViewSet)
router.register(r'protocol-evaluations', ClinicalProtocolEvaluationViewSet)
router.register(r'settings', IndicatorSettingsViewSet)

urlpatterns = [
    path('', include(router.urls)),
]