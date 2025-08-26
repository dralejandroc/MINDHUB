"""
Medical Audit Service - Healthcare Compliance Tracking
Inspired by OpenEMR audit system for regulatory compliance
"""

import uuid
import logging
from typing import Any, Dict, List, Optional, Union
from datetime import datetime, timedelta
from django.db import transaction
from django.utils import timezone
from django.contrib.auth.models import AnonymousUser

from .models import MedicalAuditLog, MedicalAccessLog, MedicalComplianceReport
from ..utils.processing_result import ProcessingResult

logger = logging.getLogger(__name__)


class MedicalAuditService:
    """
    Medical audit service for healthcare compliance
    Tracks all medical actions for regulatory requirements
    """
    
    def __init__(self, user=None, request=None):
        self.user = user or AnonymousUser()
        self.request = request
        self._context = {}
    
    def set_context(self, **context):
        """Set audit context (clinic_id, workspace_id, etc.)"""
        self._context.update(context)
        return self
    
    def log_medical_action(
        self,
        action: str,
        resource_type: str,
        resource_id: Optional[Union[str, uuid.UUID]] = None,
        patient_id: Optional[Union[str, uuid.UUID]] = None,
        changes: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> ProcessingResult:
        """
        Log a medical action for audit trail
        
        Args:
            action: Action performed (see ACTION_CHOICES in model)
            resource_type: Type of resource affected
            resource_id: ID of the resource affected
            patient_id: Patient context (if applicable)
            changes: Changes made (before/after values)
            metadata: Additional context information
        """
        try:
            # Get request context
            ip_address = None
            user_agent = None
            
            if self.request:
                ip_address = self.get_client_ip()
                user_agent = self.request.META.get('HTTP_USER_AGENT', '')
            
            # Create audit log entry
            audit_entry = MedicalAuditLog.objects.create(
                user_id=getattr(self.user, 'id', None),
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                patient_id=patient_id,
                changes=changes or {},
                metadata=metadata or {},
                ip_address=ip_address,
                user_agent=user_agent,
                clinic_id=self._context.get('clinic_id'),
                workspace_id=self._context.get('workspace_id')
            )
            
            logger.info(f"Medical audit logged: {action} on {resource_type} by user {self.user.id}")
            
            return ProcessingResult(
                data={'audit_id': str(audit_entry.id)},
                is_valid=True,
                message="Medical action logged for audit"
            )
            
        except Exception as e:
            logger.error(f"Failed to log medical action: {str(e)}")
            return ProcessingResult(
                data=None,
                is_valid=False,
                errors=[f"Audit logging failed: {str(e)}"]
            )
    
    def log_patient_access(
        self,
        patient_id: Union[str, uuid.UUID],
        access_type: str,
        data_type: str,
        resource_id: Optional[Union[str, uuid.UUID]] = None,
        purpose: str = ""
    ) -> ProcessingResult:
        """
        Log patient data access for HIPAA/GDPR compliance
        
        Args:
            patient_id: Patient whose data was accessed
            access_type: Type of access (view, create, update, delete, etc.)
            data_type: Type of data accessed (medical_history, assessment, etc.)
            resource_id: Specific resource accessed
            purpose: Purpose of access
        """
        try:
            # Get request context
            ip_address = None
            user_agent = None
            session_id = None
            
            if self.request:
                ip_address = self.get_client_ip()
                user_agent = self.request.META.get('HTTP_USER_AGENT', '')
                session_id = self.request.session.session_key
            
            # Create access log entry
            access_entry = MedicalAccessLog.objects.create(
                user_id=getattr(self.user, 'id', None),
                patient_id=patient_id,
                access_type=access_type,
                data_type=data_type,
                resource_id=resource_id,
                purpose=purpose,
                session_id=session_id,
                ip_address=ip_address,
                user_agent=user_agent,
                clinic_id=self._context.get('clinic_id'),
                workspace_id=self._context.get('workspace_id')
            )
            
            logger.info(f"Patient access logged: {access_type} {data_type} for patient {patient_id}")
            
            return ProcessingResult(
                data={'access_log_id': str(access_entry.id)},
                is_valid=True,
                message="Patient access logged"
            )
            
        except Exception as e:
            logger.error(f"Failed to log patient access: {str(e)}")
            return ProcessingResult(
                data=None,
                is_valid=False,
                errors=[f"Access logging failed: {str(e)}"]
            )
    
    def get_patient_access_history(
        self,
        patient_id: Union[str, uuid.UUID],
        days_back: int = 30
    ) -> ProcessingResult:
        """
        Get access history for a specific patient
        """
        try:
            since_date = timezone.now() - timedelta(days=days_back)
            
            access_logs = MedicalAccessLog.objects.filter(
                patient_id=patient_id,
                accessed_at__gte=since_date
            ).order_by('-accessed_at')
            
            # Apply security filtering based on context
            if self._context.get('clinic_id'):
                access_logs = access_logs.filter(clinic_id=self._context['clinic_id'])
            elif self._context.get('workspace_id'):
                access_logs = access_logs.filter(workspace_id=self._context['workspace_id'])
            
            access_data = []
            for log in access_logs:
                access_data.append({
                    'id': str(log.id),
                    'user_id': str(log.user_id),
                    'access_type': log.access_type,
                    'data_type': log.data_type,
                    'purpose': log.purpose,
                    'accessed_at': log.accessed_at.isoformat(),
                    'ip_address': log.ip_address,
                })
            
            return ProcessingResult(
                data=access_data,
                is_valid=True,
                message=f"Found {len(access_data)} access records for patient in last {days_back} days"
            )
            
        except Exception as e:
            logger.error(f"Failed to get patient access history: {str(e)}")
            return ProcessingResult(
                data=None,
                is_valid=False,
                errors=[f"Failed to retrieve access history: {str(e)}"]
            )
    
    def get_user_audit_trail(
        self,
        user_id: Union[str, uuid.UUID],
        days_back: int = 30
    ) -> ProcessingResult:
        """
        Get audit trail for a specific user
        """
        try:
            since_date = timezone.now() - timedelta(days=days_back)
            
            audit_logs = MedicalAuditLog.objects.filter(
                user_id=user_id,
                timestamp__gte=since_date
            ).order_by('-timestamp')
            
            # Apply security filtering
            if self._context.get('clinic_id'):
                audit_logs = audit_logs.filter(clinic_id=self._context['clinic_id'])
            elif self._context.get('workspace_id'):
                audit_logs = audit_logs.filter(workspace_id=self._context['workspace_id'])
            
            audit_data = []
            for log in audit_logs:
                audit_data.append({
                    'id': str(log.id),
                    'action': log.action,
                    'resource_type': log.resource_type,
                    'resource_id': str(log.resource_id) if log.resource_id else None,
                    'patient_id': str(log.patient_id) if log.patient_id else None,
                    'timestamp': log.timestamp.isoformat(),
                    'changes_summary': log.get_changes_summary(),
                })
            
            return ProcessingResult(
                data=audit_data,
                is_valid=True,
                message=f"Found {len(audit_data)} audit records for user in last {days_back} days"
            )
            
        except Exception as e:
            logger.error(f"Failed to get user audit trail: {str(e)}")
            return ProcessingResult(
                data=None,
                is_valid=False,
                errors=[f"Failed to retrieve audit trail: {str(e)}"]
            )
    
    def generate_compliance_report(
        self,
        report_type: str,
        date_from: datetime,
        date_to: datetime,
        title: str = "",
        description: str = ""
    ) -> ProcessingResult:
        """
        Generate a compliance report for regulatory audits
        """
        try:
            # Create report record
            report = MedicalComplianceReport.objects.create(
                report_type=report_type,
                title=title or f"{report_type.replace('_', ' ').title()} Report",
                description=description,
                date_from=date_from,
                date_to=date_to,
                generated_by=getattr(self.user, 'id', None),
                clinic_id=self._context.get('clinic_id'),
                workspace_id=self._context.get('workspace_id')
            )
            
            # Generate report data based on type
            report_data = self._generate_report_data(report_type, date_from, date_to)
            
            # Update report with data
            report.report_data = report_data['data']
            report.summary = report_data['summary']
            report.status = 'completed'
            report.completed_at = timezone.now()
            report.save()
            
            return ProcessingResult(
                data={
                    'report_id': str(report.id),
                    'summary': report_data['summary']
                },
                is_valid=True,
                message="Compliance report generated successfully"
            )
            
        except Exception as e:
            logger.error(f"Failed to generate compliance report: {str(e)}")
            # Mark report as failed if it was created
            if 'report' in locals():
                report.status = 'failed'
                report.save()
            
            return ProcessingResult(
                data=None,
                is_valid=False,
                errors=[f"Report generation failed: {str(e)}"]
            )
    
    def _generate_report_data(self, report_type: str, date_from: datetime, date_to: datetime) -> Dict[str, Any]:
        """Generate report data based on report type"""
        if report_type == 'access_log':
            return self._generate_access_log_report(date_from, date_to)
        elif report_type == 'user_activity':
            return self._generate_user_activity_report(date_from, date_to)
        elif report_type == 'patient_access':
            return self._generate_patient_access_report(date_from, date_to)
        elif report_type == 'hipaa_audit':
            return self._generate_hipaa_audit_report(date_from, date_to)
        else:
            return {'data': {}, 'summary': {'error': 'Unknown report type'}}
    
    def _generate_access_log_report(self, date_from: datetime, date_to: datetime) -> Dict[str, Any]:
        """Generate access log report"""
        access_logs = MedicalAccessLog.objects.filter(
            accessed_at__gte=date_from,
            accessed_at__lte=date_to
        )
        
        # Apply security filtering
        if self._context.get('clinic_id'):
            access_logs = access_logs.filter(clinic_id=self._context['clinic_id'])
        elif self._context.get('workspace_id'):
            access_logs = access_logs.filter(workspace_id=self._context['workspace_id'])
        
        # Aggregate data
        total_accesses = access_logs.count()
        unique_patients = access_logs.values('patient_id').distinct().count()
        unique_users = access_logs.values('user_id').distinct().count()
        
        # Access type breakdown
        access_types = {}
        for log in access_logs.values('access_type').annotate(count=models.Count('id')):
            access_types[log['access_type']] = log['count']
        
        return {
            'data': {
                'total_accesses': total_accesses,
                'unique_patients_accessed': unique_patients,
                'unique_users': unique_users,
                'access_type_breakdown': access_types,
                'date_range': {
                    'from': date_from.isoformat(),
                    'to': date_to.isoformat()
                }
            },
            'summary': {
                'total_accesses': total_accesses,
                'patients_accessed': unique_patients,
                'active_users': unique_users,
                'report_type': 'Access Log Report'
            }
        }
    
    def _generate_hipaa_audit_report(self, date_from: datetime, date_to: datetime) -> Dict[str, Any]:
        """Generate HIPAA compliance audit report"""
        # Get all medical actions that involve patient data
        audit_logs = MedicalAuditLog.objects.filter(
            timestamp__gte=date_from,
            timestamp__lte=date_to,
            patient_id__isnull=False  # Only patient-related actions
        )
        
        # Apply security filtering
        if self._context.get('clinic_id'):
            audit_logs = audit_logs.filter(clinic_id=self._context['clinic_id'])
        elif self._context.get('workspace_id'):
            audit_logs = audit_logs.filter(workspace_id=self._context['workspace_id'])
        
        # HIPAA compliance metrics
        total_patient_actions = audit_logs.count()
        unique_patients = audit_logs.values('patient_id').distinct().count()
        
        # Sensitive actions tracking
        sensitive_actions = [
            'patient_created', 'patient_updated', 'patient_viewed',
            'assessment_completed', 'prescription_created'
        ]
        
        sensitive_activity = audit_logs.filter(action__in=sensitive_actions).count()
        
        return {
            'data': {
                'total_patient_actions': total_patient_actions,
                'unique_patients_involved': unique_patients,
                'sensitive_actions': sensitive_activity,
                'compliance_period': {
                    'from': date_from.isoformat(),
                    'to': date_to.isoformat()
                }
            },
            'summary': {
                'total_actions': total_patient_actions,
                'patients_involved': unique_patients,
                'sensitive_actions': sensitive_activity,
                'compliance_status': 'Tracked',
                'report_type': 'HIPAA Audit Report'
            }
        }
    
    def get_client_ip(self) -> Optional[str]:
        """Get client IP address from request"""
        if not self.request:
            return None
        
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        
        return self.request.META.get('REMOTE_ADDR')


# Decorator for automatic audit logging
def audit_medical_action(action: str, resource_type: str):
    """
    Decorator for automatic medical audit logging
    
    Usage:
    @audit_medical_action('patient_updated', 'patient')
    def update_patient(self, patient_id, data):
        # Function implementation
        pass
    """
    def decorator(func):
        def wrapper(self, *args, **kwargs):
            # Execute the function first
            result = func(self, *args, **kwargs)
            
            # Log the action if successful
            try:
                audit_service = MedicalAuditService(
                    user=getattr(self, 'user', None),
                    request=getattr(self, 'request', None)
                )
                
                # Set context from service if available
                if hasattr(self, 'context'):
                    audit_service.set_context(**self.context)
                
                # Extract resource ID from result or args
                resource_id = None
                patient_id = None
                
                if hasattr(result, 'data') and isinstance(result.data, dict):
                    resource_id = result.data.get('id')
                    patient_id = result.data.get('patient_id')
                
                # Log the action
                audit_service.log_medical_action(
                    action=action,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    patient_id=patient_id,
                    metadata={
                        'function': func.__name__,
                        'success': getattr(result, 'is_valid', True)
                    }
                )
                
            except Exception as e:
                logger.warning(f"Failed to audit action {action}: {str(e)}")
            
            return result
        
        return wrapper
    return decorator