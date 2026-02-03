from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .authentication import SupabaseProxyAuthentication
from middleware.base_viewsets import ExpedixDualViewSet
from .models import Consultation
from .serializers import ConsultationSerializer

class AppointmentViewSet(ExpedixDualViewSet):
    """
    /appointments = consultas agendadas/confirmadas (proxy)
    """
    queryset = Consultation.objects.select_related('patient').all()
    serializer_class = ConsultationSerializer
    authentication_classes = [SupabaseProxyAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    ordering_fields = ['consultation_date', 'created_at']
    ordering = ['consultation_date']

    def get_queryset(self):
        qs = super().get_queryset()
        qs = qs.filter(status__in=['scheduled', 'confirmed'])
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        # si solo quieres futuras:
        qs = qs.filter(consultation_date__gte=timezone.now())
        return qs