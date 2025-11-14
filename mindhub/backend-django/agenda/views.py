"""
Agenda Views - Django REST Framework DUAL SYSTEM
Replaces Node.js Express routes with Django ViewSets
Supports:
- LICENCIA CLÍNICA: Multi-professional shared agenda with clinic-wide appointments
- LICENCIA INDIVIDUAL: Single professional private agenda with multiple locations
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

# Import Supabase authentication
from expedix.authentication import SupabaseProxyAuthentication
from middleware.base_viewsets import AgendaDualViewSet, DualSystemReadOnlyViewSet, DualSystemModelViewSet

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


class AppointmentViewSet(AgendaDualViewSet):
    """
    🎯 SIMPLIFIED SYSTEM Appointment management ViewSet
    Automatically filters by ownership:
    - CLINIC SHARED: WHERE clinic_id = true (shared agenda)
    - INDIVIDUAL: WHERE user_id = auth.uid() (private agenda)
    """
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    authentication_classes = [SupabaseProxyAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['reason', 'notes']
    filterset_fields = ['status', 'appointment_type', 'patient_id', 'professional_id']
    ordering_fields = ['appointment_date', 'created_at']
    ordering = ['appointment_date']

    def get_serializer_class(self):
        if self.action == 'create':
            return AppointmentCreateSerializer
        elif self.action == 'list':
            return AppointmentSummarySerializer
        return AppointmentSerializer

    def perform_create(self, serializer):
        # Save appointment - no scheduled_by field in real table
        appointment = serializer.save()
        
        # Set status to scheduled if not provided
        if not appointment.status:
            appointment.status = 'scheduled'
            appointment.save()
        
        # Create history entry (only if AppointmentHistory table exists)
        try:
            AppointmentHistory.objects.create(
                appointment=appointment,
                action='SCHEDULED',
                changes={
                    'status': 'scheduled',
                    'appointment_date': appointment.appointment_date.isoformat(),
                    'appointment_type': appointment.appointment_type
                },
                reason=f'Cita agendada: {appointment.reason or "Nueva cita"}',
                modified_by=self.request.user
            )
        except Exception:
            # AppointmentHistory table might not exist in real DB
            pass

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
                appointment_date__gt=timezone.now().date(),
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
            appointment_date__gte=timezone.now().date(),
            status__in=['scheduled', 'confirmed']
        ).order_by('appointment_date', 'start_time')[:10]
        
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
                appointment_date__gte=timezone.now().date(),
                status__in=['scheduled', 'confirmed']
            ).count(),
            'appointments_today': self.queryset.filter(
                appointment_date=today
            ).count(),
            'appointments_this_week': self.queryset.filter(
                appointment_date__gte=week_start
            ).count(),
            'appointments_this_month': self.queryset.filter(
                appointment_date__gte=month_start
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
        
        # Update appointment - using only real fields
        appointment.status = 'confirmed'
        appointment.confirmation_sent = True
        appointment.confirmation_date = timezone.now()
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
        
        # Update appointment - using only real fields
        appointment.status = 'cancelled'
        # Note: cancelled_at, cancelled_by, cancellation_reason don't exist in real table
        # Store in notes instead
        appointment.notes = f"{appointment.notes or ''}\nCancelado: {reason}"
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

    # def _generate_appointment_number(self):
    #     """Generate unique appointment number - DISABLED: field doesn't exist in real table"""
    #     year = timezone.now().year
    #     month = timezone.now().month
    #     prefix = f"APT-{year}{month:02d}"
    #     
    #     count = Appointment.objects.filter(
    #         appointment_number__startswith=prefix
    #     ).count()
    #     
    #     sequence = str(count + 1).zfill(4)
    #     return f"{prefix}-{sequence}"

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

    @action(detail=True, methods=['put'])
    def status(self, request, pk=None):
        """Update appointment status - compatible with frontend PUT /appointments/{id}/status"""
        appointment = self.get_object()
        new_status = request.data.get('status')
        with_deposit = request.data.get('withDeposit', False)
        deposit_amount = request.data.get('depositAmount', 0)
        payment_method = request.data.get('paymentMethod', 'cash')
        
        if not new_status:
            return Response(
                {'error': 'Status is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Handle different status updates
        if new_status == 'confirmed':
            # Validate appointment can be confirmed
            if not appointment.can_be_confirmed:
                return Response(
                    {'error': 'Cannot confirm this appointment'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update appointment status
            appointment.status = 'confirmed'
            appointment.confirmation_sent = True
            appointment.confirmation_date = timezone.now()
            appointment.save()
            
            # Handle deposit logic
            if with_deposit and deposit_amount > 0:
                # Create payment record in Finance
                try:
                    from finance.models import Income, Service
                    
                    # Get or create service for deposit
                    service, created = Service.objects.get_or_create(
                        name=f"Depósito - {appointment.appointment_type or 'Consulta'}",
                        defaults={
                            'price': deposit_amount,
                            'category': 'Depósitos',
                            'description': f'Depósito para cita médica'
                        }
                    )
                    
                    # Create income record
                    income = Income.objects.create(
                        patient_id=appointment.patient.id,
                        service=service,
                        amount=deposit_amount,
                        payment_method=payment_method,
                        description=f'Depósito para cita del {appointment.start_datetime.strftime("%d/%m/%Y")}',
                        appointment_id=appointment.id
                    )
                    
                    # Update appointment with deposit info
                    appointment.notes = f"{appointment.notes or ''}\nDepósito recibido: ${deposit_amount} ({payment_method})"
                    appointment.save()
                    
                except Exception as e:
                    # Log error but don't fail the confirmation
                    print(f"Error creating payment record: {e}")
            
            else:
                # Create debt record for patient (no deposit)
                try:
                    from finance.models import Service
                    
                    # Get service price for this appointment type
                    service = Service.objects.filter(
                        name__icontains=appointment.appointment_type or 'consulta'
                    ).first()
                    
                    if service:
                        # Create pending payment record
                        from finance.models import Income
                        Income.objects.create(
                            patient_id=appointment.patient.id,
                            service=service,
                            amount=service.price,
                            payment_method='pending',
                            description=f'Consulta confirmada sin depósito - {appointment.start_datetime.strftime("%d/%m/%Y")}',
                            appointment_id=appointment.id,
                            is_paid=False
                        )
                        
                        appointment.notes = f"{appointment.notes or ''}\nCita confirmada sin depósito - Deuda pendiente: ${service.price}"
                        appointment.save()
                        
                except Exception as e:
                    print(f"Error creating debt record: {e}")
            
            # Create confirmation record
            AppointmentConfirmation.objects.create(
                appointment=appointment,
                confirmation_type='staff',
                confirmation_method='system',
                confirmed_by=request.user,
                notes=f'Confirmed via API - Deposit: {"Yes" if with_deposit else "No"}'
            )
            
            # Create history entry
            AppointmentHistory.objects.create(
                appointment=appointment,
                action='CONFIRMED',
                changes={
                    'status': 'confirmed',
                    'with_deposit': with_deposit,
                    'deposit_amount': deposit_amount if with_deposit else 0
                },
                modified_by=request.user,
                notes=f'Status updated to confirmed via API'
            )
            
        else:
            # Handle other status changes
            appointment.status = new_status
            appointment.save()
            
            # Create history entry
            AppointmentHistory.objects.create(
                appointment=appointment,
                action=f'STATUS_CHANGED_TO_{new_status.upper()}',
                changes={'status': new_status},
                modified_by=request.user,
                notes=f'Status updated to {new_status} via API'
            )
        
        # Return updated appointment
        serializer = self.get_serializer(appointment)
        return Response({
            'appointment': serializer.data,
            'message': f'Appointment status updated to {new_status}',
            'with_deposit': with_deposit,
            'deposit_amount': deposit_amount if with_deposit else 0
        })


class AppointmentHistoryViewSet(DualSystemReadOnlyViewSet):
    """🎯 DUAL SYSTEM Appointment history ViewSet"""
    queryset = AppointmentHistory.objects.select_related('appointment', 'modified_by').all()
    serializer_class = AppointmentHistorySerializer
    authentication_classes = [SupabaseProxyAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['appointment', 'action']
    ordering_fields = ['created_at']
    ordering = ['-created_at']


class ProviderScheduleViewSet(DualSystemModelViewSet):
    """🎯 DUAL SYSTEM Provider schedule management ViewSet"""
    queryset = ProviderSchedule.objects.select_related('provider').all()
    serializer_class = ProviderScheduleSerializer
    authentication_classes = [SupabaseProxyAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['provider', 'weekday', 'is_active']
    ordering_fields = ['weekday', 'start_time']
    ordering = ['weekday', 'start_time']


class ScheduleBlockViewSet(DualSystemModelViewSet):
    """🎯 DUAL SYSTEM Schedule block management ViewSet"""
    queryset = ScheduleBlock.objects.select_related('provider').all()
    serializer_class = ScheduleBlockSerializer
    authentication_classes = [SupabaseProxyAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['provider', 'block_type']
    ordering_fields = ['start_date', 'created_at']
    ordering = ['-start_date']


class WaitingListViewSet(AgendaDualViewSet):
    """🎯 DUAL SYSTEM Waiting list management ViewSet"""
    queryset = WaitingList.objects.select_related('patient', 'provider', 'added_by').all()
    serializer_class = WaitingListSerializer
    authentication_classes = [SupabaseProxyAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['reason', 'notes']
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
