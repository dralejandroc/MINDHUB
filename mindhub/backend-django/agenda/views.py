"""
Agenda Views - Django REST Framework
Replaces Node.js Express routes with Django ViewSets
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone
from datetime import datetime, timedelta, time
import uuid

from .models import (
    Appointment, AppointmentHistory, AppointmentConfirmation,
    ProviderSchedule, ScheduleBlock, WaitingList
)
from .serializers import (
    AppointmentSerializer, AppointmentCreateSerializer, AppointmentSummarySerializer,
    AppointmentHistorySerializer, AppointmentConfirmationSerializer,
    ProviderScheduleSerializer, ScheduleBlockSerializer, WaitingListSerializer,
    AppointmentStatsSerializer, ProviderAvailabilitySerializer,
    AppointmentCalendarSerializer
)


class AppointmentViewSet(viewsets.ModelViewSet):
    """
    Appointment management ViewSet
    Replaces /api/expedix/appointments/* endpoints from Node.js
    """
    queryset = Appointment.objects.select_related('patient', 'provider', 'scheduled_by').all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['patient__first_name', 'patient__paternal_last_name', 'reason', 'appointment_number']
    filterset_fields = ['status', 'appointment_type', 'patient', 'provider']
    ordering_fields = ['appointment_date', 'created_at']
    ordering = ['appointment_date']

    def get_serializer_class(self):
        if self.action == 'create':
            return AppointmentCreateSerializer
        elif self.action == 'list':
            return AppointmentSummarySerializer
        return AppointmentSerializer

    def perform_create(self, serializer):
        # Generate appointment number
        appointment_number = self._generate_appointment_number()
        serializer.save(
            scheduled_by=self.request.user,
            appointment_number=appointment_number
        )
        
        # Create history entry
        appointment = serializer.instance
        AppointmentHistory.objects.create(
            appointment=appointment,
            action='SCHEDULED',
            changes={
                'status': 'scheduled',
                'appointment_date': appointment.appointment_date.isoformat(),
                'duration': appointment.duration,
                'appointment_type': appointment.appointment_type
            },
            reason=f'Cita agendada: {appointment.reason}',
            modified_by=self.request.user
        )

    @action(detail=False, methods=['get'])
    def by_patient(self, request):
        """Get appointments by patient ID"""
        patient_id = request.query_params.get('patient_id')
        if not patient_id:
            return Response({'error': 'patient_id parameter required'}, status=400)
            
        appointments = self.queryset.filter(patient_id=patient_id)
        
        # Apply additional filters
        status_filter = request.query_params.get('status')
        if status_filter:
            appointments = appointments.filter(status=status_filter)
            
        from_date = request.query_params.get('from')
        to_date = request.query_params.get('to')
        if from_date:
            appointments = appointments.filter(appointment_date__gte=from_date)
        if to_date:
            appointments = appointments.filter(appointment_date__lte=to_date)
            
        serializer = self.get_serializer(appointments, many=True)
        
        # Calculate statistics
        stats = {
            'total': appointments.count(),
            'scheduled': appointments.filter(status='scheduled').count(),
            'confirmed': appointments.filter(status='confirmed').count(),
            'completed': appointments.filter(status='completed').count(),
            'upcoming': appointments.filter(
                appointment_date__gt=timezone.now(),
                status__in=['scheduled', 'confirmed']
            ).count()
        }
        
        return Response({
            'appointments': serializer.data,
            'statistics': stats
        })

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming appointments"""
        upcoming = self.queryset.filter(
            appointment_date__gte=timezone.now(),
            status__in=['scheduled', 'confirmed']
        ).order_by('appointment_date')[:10]
        
        serializer = self.get_serializer(upcoming, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Appointment statistics for dashboard"""
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)
        
        stats = {
            'total_appointments': self.queryset.count(),
            'scheduled_appointments': self.queryset.filter(status='scheduled').count(),
            'confirmed_appointments': self.queryset.filter(status='confirmed').count(),
            'completed_appointments': self.queryset.filter(status='completed').count(),
            'cancelled_appointments': self.queryset.filter(status='cancelled').count(),
            'upcoming_appointments': self.queryset.filter(
                appointment_date__gte=timezone.now(),
                status__in=['scheduled', 'confirmed']
            ).count(),
            'appointments_today': self.queryset.filter(
                appointment_date__date=today
            ).count(),
            'appointments_this_week': self.queryset.filter(
                appointment_date__date__gte=week_start
            ).count(),
            'appointments_this_month': self.queryset.filter(
                appointment_date__date__gte=month_start
            ).count(),
        }
        
        serializer = AppointmentStatsSerializer(stats)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm appointment"""
        appointment = self.get_object()
        confirmation_type = request.data.get('confirmation_type', 'staff')
        confirmation_method = request.data.get('confirmation_method', 'email')
        notes = request.data.get('notes', '')
        
        # Validate appointment can be confirmed
        if not appointment.can_be_confirmed:
            return Response(
                {'error': 'Cannot confirm this appointment'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check patient access for patient confirmations
        if (confirmation_type == 'patient' and 
            hasattr(request.user, 'patient') and 
            request.user.patient.id != appointment.patient.id):
            return Response(
                {'error': 'Patients can only confirm their own appointments'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update appointment
        appointment.status = 'confirmed'
        appointment.confirmed_at = timezone.now()
        appointment.confirmed_by = request.user
        appointment.save()
        
        # Create confirmation record
        confirmation = AppointmentConfirmation.objects.create(
            appointment=appointment,
            confirmation_type=confirmation_type,
            confirmation_method=confirmation_method,
            confirmed_by=request.user,
            notes=notes
        )
        
        # Create history entry
        AppointmentHistory.objects.create(
            appointment=appointment,
            action='CONFIRMED',
            changes={
                'status': 'confirmed',
                'confirmation_type': confirmation_type,
                'confirmation_method': confirmation_method
            },
            reason=f'Cita confirmada por {confirmation_type}',
            modified_by=request.user
        )
        
        serializer = self.get_serializer(appointment)
        return Response({
            'appointment': serializer.data,
            'confirmation': AppointmentConfirmationSerializer(confirmation).data
        })

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel appointment"""
        appointment = self.get_object()
        reason = request.data.get('reason')
        cancelled_by = request.data.get('cancelled_by', 'staff')
        reschedule_requested = request.data.get('reschedule_requested', False)
        
        if not reason:
            return Response(
                {'error': 'Cancellation reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate appointment can be cancelled
        if not appointment.can_be_cancelled:
            return Response(
                {'error': 'Cannot cancel this appointment'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check patient access for patient cancellations
        if (cancelled_by == 'patient' and 
            hasattr(request.user, 'patient') and 
            request.user.patient.id != appointment.patient.id):
            return Response(
                {'error': 'Patients can only cancel their own appointments'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update appointment
        appointment.status = 'cancelled'
        appointment.cancelled_at = timezone.now()
        appointment.cancelled_by = request.user
        appointment.cancellation_reason = reason
        appointment.reschedule_requested = reschedule_requested
        appointment.save()
        
        # Create history entry
        AppointmentHistory.objects.create(
            appointment=appointment,
            action='CANCELLED',
            changes={
                'status': 'cancelled',
                'cancellation_reason': reason,
                'cancelled_by': cancelled_by,
                'reschedule_requested': reschedule_requested
            },
            reason=f'Cita cancelada por {cancelled_by}: {reason}',
            modified_by=request.user
        )
        
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def provider_schedule(self, request):
        """Get provider's schedule for appointment booking"""
        provider_id = request.query_params.get('provider_id')
        date_str = request.query_params.get('date')
        duration = int(request.query_params.get('duration', 60))
        
        if not provider_id or not date_str:
            return Response(
                {'error': 'provider_id and date parameters required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            target_date = datetime.fromisoformat(date_str).date()
        except ValueError:
            return Response(
                {'error': 'Invalid date format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get available slots
        available_slots = self._get_provider_availability(provider_id, target_date, duration)
        
        serializer = ProviderAvailabilitySerializer(available_slots, many=True)
        return Response({
            'provider_id': provider_id,
            'date': date_str,
            'duration': duration,
            'available_slots': serializer.data
        })

    def _generate_appointment_number(self):
        """Generate unique appointment number"""
        year = timezone.now().year
        month = timezone.now().month
        prefix = f"APT-{year}{month:02d}"
        
        count = Appointment.objects.filter(
            appointment_number__startswith=prefix
        ).count()
        
        sequence = str(count + 1).zfill(4)
        return f"{prefix}-{sequence}"

    def _get_provider_availability(self, provider_id, target_date, duration):
        """Get available appointment slots for a provider"""
        # Get provider's schedule for the weekday
        weekday = target_date.weekday()
        schedule = ProviderSchedule.objects.filter(
            provider_id=provider_id,
            weekday=weekday,
            is_active=True
        ).first()
        
        if not schedule:
            return []
        
        # Check for schedule blocks (holidays, vacations, etc.)
        blocks = ScheduleBlock.objects.filter(
            provider_id=provider_id,
            start_date__lte=target_date,
            end_date__gte=target_date
        )
        
        if blocks.filter(all_day=True).exists():
            return []  # Provider unavailable all day
        
        # Generate time slots
        slots = []
        current_time = datetime.combine(target_date, schedule.start_time)
        end_time = datetime.combine(target_date, schedule.end_time)
        
        while current_time + timedelta(minutes=duration) <= end_time:
            # Check if slot conflicts with existing appointments
            slot_end = current_time + timedelta(minutes=duration)
            
            conflicting_appointment = Appointment.objects.filter(
                provider_id=provider_id,
                status__in=['scheduled', 'confirmed'],
                appointment_date__lt=slot_end,
                appointment_date__gte=current_time
            ).exists()
            
            # Check if slot conflicts with schedule blocks
            slot_conflicts_with_block = blocks.filter(
                all_day=False,
                start_time__lte=current_time.time(),
                end_time__gte=slot_end.time()
            ).exists()
            
            # Check break time
            in_break = False
            if schedule.break_start and schedule.break_end:
                break_start = datetime.combine(target_date, schedule.break_start)
                break_end = datetime.combine(target_date, schedule.break_end)
                if current_time < break_end and slot_end > break_start:
                    in_break = True
            
            if not conflicting_appointment and not slot_conflicts_with_block and not in_break:
                slots.append({
                    'time': current_time,
                    'available': True,
                    'duration': duration
                })
            
            current_time += timedelta(minutes=schedule.slot_duration)
        
        return slots


class AppointmentHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Appointment history ViewSet"""
    queryset = AppointmentHistory.objects.select_related('appointment', 'modified_by').all()
    serializer_class = AppointmentHistorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['appointment', 'action']
    ordering_fields = ['created_at']
    ordering = ['-created_at']


class ProviderScheduleViewSet(viewsets.ModelViewSet):
    """Provider schedule management ViewSet"""
    queryset = ProviderSchedule.objects.select_related('provider').all()
    serializer_class = ProviderScheduleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['provider', 'weekday', 'is_active']
    ordering_fields = ['weekday', 'start_time']
    ordering = ['weekday', 'start_time']


class ScheduleBlockViewSet(viewsets.ModelViewSet):
    """Schedule block management ViewSet"""
    queryset = ScheduleBlock.objects.select_related('provider').all()
    serializer_class = ScheduleBlockSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['provider', 'block_type']
    ordering_fields = ['start_date', 'created_at']
    ordering = ['-start_date']


class WaitingListViewSet(viewsets.ModelViewSet):
    """Waiting list management ViewSet"""
    queryset = WaitingList.objects.select_related('patient', 'provider', 'added_by').all()
    serializer_class = WaitingListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['patient__first_name', 'patient__paternal_last_name', 'reason']
    filterset_fields = ['provider', 'status', 'priority', 'appointment_type']
    ordering_fields = ['created_at', 'priority']
    ordering = ['priority', 'created_at']

    def perform_create(self, serializer):
        serializer.save(added_by=self.request.user)

    @action(detail=True, methods=['post'])
    def contact(self, request, pk=None):
        """Mark waiting list entry as contacted"""
        entry = self.get_object()
        entry.status = 'contacted'
        entry.contacted_at = timezone.now()
        entry.save()
        
        serializer = self.get_serializer(entry)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def schedule(self, request, pk=None):
        """Convert waiting list entry to appointment"""
        entry = self.get_object()
        appointment_data = request.data
        
        # Create appointment
        appointment = Appointment.objects.create(
            patient=entry.patient,
            provider=entry.provider,
            appointment_date=appointment_data['appointment_date'],
            duration=appointment_data.get('duration', 60),
            appointment_type=entry.appointment_type,
            reason=entry.reason,
            notes=f"Programado desde lista de espera: {entry.notes}",
            scheduled_by=request.user,
            appointment_number=AppointmentViewSet()._generate_appointment_number()
        )
        
        # Update waiting list entry
        entry.status = 'scheduled'
        entry.save()
        
        appointment_serializer = AppointmentSerializer(appointment)
        entry_serializer = self.get_serializer(entry)
        
        return Response({
            'appointment': appointment_serializer.data,
            'waiting_list_entry': entry_serializer.data
        })
