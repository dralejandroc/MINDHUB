"""
Finance views for MindHub Finance API
Handles income tracking, financial statistics, and cash register management
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import datetime, timedelta
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Income, CashRegisterCut, FinancialService, PaymentMethodConfiguration
from .serializers import (
    IncomeSerializer, IncomeCreateSerializer, CashRegisterCutSerializer,
    FinancialServiceSerializer, PaymentMethodConfigSerializer,
    FinancialStatsSerializer, IncomeStatsQuerySerializer, 
    IncomeListQuerySerializer, DashboardStatsSerializer
)


class IncomeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing income records
    """
    queryset = Income.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'source', 'payment_method', 'clinic_id', 'professional_id']
    search_fields = ['description', 'patient_name', 'professional_name', 'reference']
    ordering_fields = ['received_date', 'amount', 'created_at']
    ordering = ['-received_date', '-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return IncomeCreateSerializer
        return IncomeSerializer

    def get_queryset(self):
        """Filter queryset based on user permissions and clinic access"""
        queryset = super().get_queryset()
        
        # Filter by clinic_id if provided in query params
        clinic_id = self.request.query_params.get('clinic_id')
        if clinic_id:
            queryset = queryset.filter(clinic_id=clinic_id)
            
        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            try:
                start_date = datetime.fromisoformat(start_date).date()
                queryset = queryset.filter(received_date__gte=start_date)
            except ValueError:
                pass
                
        if end_date:
            try:
                end_date = datetime.fromisoformat(end_date).date()
                queryset = queryset.filter(received_date__lte=end_date)
            except ValueError:
                pass
        
        return queryset

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get financial statistics
        """
        # Validate query parameters
        query_serializer = IncomeStatsQuerySerializer(data=request.query_params)
        if not query_serializer.is_valid():
            return Response(query_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = query_serializer.validated_data
        period = validated_data.get('period', 'month')
        start_date = validated_data.get('start_date')
        end_date = validated_data.get('end_date')
        clinic_id = validated_data.get('clinic_id')
        professional_id = validated_data.get('professional_id')

        # Build queryset
        queryset = Income.objects.filter(status='confirmed')
        
        if clinic_id:
            queryset = queryset.filter(clinic_id=clinic_id)
        if professional_id:
            queryset = queryset.filter(professional_id=professional_id)

        # Set date range based on period
        now = timezone.now().date()
        if not start_date or not end_date:
            if period == 'week':
                start_date = now - timedelta(days=7)
                end_date = now
            elif period == 'year':
                start_date = now.replace(month=1, day=1)
                end_date = now
            else:  # month
                start_date = now.replace(day=1)
                end_date = now

        queryset = queryset.filter(
            received_date__gte=start_date,
            received_date__lte=end_date
        )

        # Calculate summary statistics
        summary_stats = queryset.aggregate(
            total_amount=Sum('amount') or 0,
            total_transactions=Count('id'),
            average_amount=Avg('amount') or 0
        )

        # Breakdown by source
        source_breakdown = list(
            queryset.values('source')
            .annotate(
                total=Sum('amount'),
                count=Count('id')
            )
            .order_by('-total')
        )

        # Breakdown by payment method
        payment_method_breakdown = list(
            queryset.values('payment_method')
            .annotate(
                total=Sum('amount'),
                count=Count('id')
            )
            .order_by('-total')
        )

        # Breakdown by professional
        professional_breakdown = list(
            queryset.values('professional_id', 'professional_name')
            .annotate(
                total=Sum('amount'),
                count=Count('id')
            )
            .order_by('-total')
        )

        # Daily trends for the period
        daily_trends = []
        current_date = start_date
        while current_date <= end_date:
            daily_total = queryset.filter(received_date=current_date).aggregate(
                total=Sum('amount')
            )['total'] or 0
            
            daily_trends.append({
                'date': current_date.isoformat(),
                'amount': float(daily_total)
            })
            current_date += timedelta(days=1)

        stats_data = {
            'summary': {
                'totalAmount': float(summary_stats['total_amount']),
                'totalTransactions': summary_stats['total_transactions'],
                'averageAmount': float(summary_stats['average_amount']),
                'period': {
                    'from': start_date.isoformat(),
                    'to': end_date.isoformat()
                }
            },
            'breakdown': {
                'bySource': source_breakdown,
                'byPaymentMethod': payment_method_breakdown,
                'byProfessional': professional_breakdown
            },
            'trends': {
                'daily': daily_trends
            }
        }

        return Response({
            'success': True,
            'data': stats_data
        })

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Get dashboard statistics for quick overview
        """
        clinic_id = request.query_params.get('clinic_id')
        
        # Base queryset
        base_queryset = Income.objects.filter(status='confirmed')
        if clinic_id:
            base_queryset = base_queryset.filter(clinic_id=clinic_id)

        # Date calculations
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today.replace(day=1)

        # Summary stats
        total_stats = base_queryset.aggregate(
            total_income=Sum('amount') or 0,
            total_transactions=Count('id'),
            average_transaction=Avg('amount') or 0
        )

        # Period stats
        today_income = base_queryset.filter(received_date=today).aggregate(
            total=Sum('amount')
        )['total'] or 0

        week_income = base_queryset.filter(received_date__gte=week_ago).aggregate(
            total=Sum('amount')
        )['total'] or 0

        month_income = base_queryset.filter(received_date__gte=month_ago).aggregate(
            total=Sum('amount')
        )['total'] or 0

        # Breakdowns
        income_by_source = dict(
            base_queryset.filter(received_date__gte=month_ago)
            .values_list('source')
            .annotate(total=Sum('amount'))
        )

        income_by_payment_method = dict(
            base_queryset.filter(received_date__gte=month_ago)
            .values_list('payment_method')
            .annotate(total=Sum('amount'))
        )

        income_by_professional = dict(
            base_queryset.filter(received_date__gte=month_ago)
            .values_list('professional_name')
            .annotate(total=Sum('amount'))
        )

        # Trends
        daily_trends = []
        weekly_trends = []
        monthly_trends = []

        # Last 30 days daily trends
        for i in range(30):
            date = today - timedelta(days=i)
            daily_total = base_queryset.filter(received_date=date).aggregate(
                total=Sum('amount')
            )['total'] or 0
            daily_trends.append({
                'date': date.isoformat(),
                'amount': float(daily_total)
            })

        dashboard_data = {
            'total_income': float(total_stats['total_income']),
            'total_transactions': total_stats['total_transactions'],
            'average_transaction': float(total_stats['average_transaction']),
            'today_income': float(today_income),
            'week_income': float(week_income),
            'month_income': float(month_income),
            'income_by_source': {k: float(v) for k, v in income_by_source.items()},
            'income_by_payment_method': {k: float(v) for k, v in income_by_payment_method.items()},
            'income_by_professional': {k: float(v) for k, v in income_by_professional.items()},
            'daily_trends': daily_trends,
            'weekly_trends': weekly_trends,
            'monthly_trends': monthly_trends,
        }

        serializer = DashboardStatsSerializer(dashboard_data)
        return Response({
            'success': True,
            'data': serializer.data
        })


class CashRegisterCutViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing cash register cuts
    """
    queryset = CashRegisterCut.objects.all()
    serializer_class = CashRegisterCutSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['clinic_id', 'cut_date', 'responsible_professional_id']
    ordering_fields = ['cut_date', 'created_at']
    ordering = ['-cut_date', '-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by clinic_id if provided
        clinic_id = self.request.query_params.get('clinic_id')
        if clinic_id:
            queryset = queryset.filter(clinic_id=clinic_id)
            
        return queryset

    def perform_create(self, serializer):
        """
        Calculate totals when creating a cash register cut
        """
        instance = serializer.save()
        
        # Calculate expected cash based on income records for the day
        day_income = Income.objects.filter(
            clinic_id=instance.clinic_id,
            received_date=instance.cut_date,
            status='confirmed'
        )
        
        totals = day_income.aggregate(
            cash=Sum('amount', filter=Q(payment_method='cash')) or 0,
            cards=Sum('amount', filter=Q(payment_method__in=['credit_card', 'debit_card'])) or 0,
            transfers=Sum('amount', filter=Q(payment_method='transfer')) or 0,
            other=Sum('amount', filter=~Q(payment_method__in=['cash', 'credit_card', 'debit_card', 'transfer'])) or 0
        )
        
        # Update the cut with calculated totals
        instance.expected_cash = totals['cash']
        instance.total_cash_income = totals['cash']
        instance.total_card_income = totals['cards'] 
        instance.total_transfer_income = totals['transfers']
        instance.total_other_income = totals['other']
        instance.save()


class FinancialServiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing financial services catalog
    """
    queryset = FinancialService.objects.all()
    serializer_class = FinancialServiceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['clinic_id', 'category', 'is_active']
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'standard_price', 'category']
    ordering = ['category', 'name']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by clinic_id if provided
        clinic_id = self.request.query_params.get('clinic_id')
        if clinic_id:
            queryset = queryset.filter(clinic_id=clinic_id)
            
        # Filter by active status by default
        if 'is_active' not in self.request.query_params:
            queryset = queryset.filter(is_active=True)
            
        return queryset


class PaymentMethodConfigViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing payment method configurations
    """
    queryset = PaymentMethodConfiguration.objects.all()
    serializer_class = PaymentMethodConfigSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['clinic_id', 'payment_method', 'is_enabled']
    ordering_fields = ['display_order', 'display_name']
    ordering = ['display_order', 'display_name']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by clinic_id if provided
        clinic_id = self.request.query_params.get('clinic_id')
        if clinic_id:
            queryset = queryset.filter(clinic_id=clinic_id)
            
        # Filter by enabled status by default
        if 'is_enabled' not in self.request.query_params:
            queryset = queryset.filter(is_enabled=True)
            
        return queryset
