"""
Appointment Validator - Healthcare appointment validation
Inspired by OpenEMR validation patterns for medical scheduling
"""

from typing import Dict, Any, List
from datetime import date, datetime, time, timedelta
import uuid

from core.validators.base_validator import MedicalValidator


class AppointmentValidator(MedicalValidator):
    """
    Appointment-specific validation for healthcare scheduling
    """
    
    def get_required_fields(self) -> List[str]:
        """Required fields for appointment creation"""
        return [
            'patient_id',
            'professional_id', 
            'appointment_date',
            'start_time',
            'end_time'
        ]
    
    def get_field_types(self) -> Dict[str, type]:
        """Field type mapping for appointment data"""
        return {
            'appointment_date': (str, date),
            'start_time': (str, time),
            'end_time': (str, time),
            'appointment_type': str,
            'status': str,
            'reason': str,
            'notes': str,
            'internal_notes': str,
            'is_recurring': bool,
            'confirmation_sent': bool,
            'reminder_sent': bool,
            'recurring_pattern': dict,
        }
    
    def validate_business_rules(self, data: Dict[str, Any]) -> None:
        """
        Appointment-specific business rules validation
        """
        # Validate dual system constraint (clinic_id XOR workspace_id)
        clinic_id = data.get('clinic_id')
        workspace_id = data.get('workspace_id')
        
        if clinic_id and workspace_id:
            self.add_error("Appointment cannot belong to both clinic and workspace")
        elif not clinic_id and not workspace_id:
            self.add_error("Appointment must belong to either a clinic or workspace")
        
        # Validate UUID fields
        uuid_fields = ['patient_id', 'professional_id', 'clinic_id', 'workspace_id']
        for field in uuid_fields:
            if field in data and data[field]:
                if not self.validate_uuid(data[field]):
                    self.add_error(f"Invalid UUID format for {field}")
        
        # Validate appointment date
        if 'appointment_date' in data and data['appointment_date']:
            appointment_date = data['appointment_date']
            
            # Convert string to date if needed
            if isinstance(appointment_date, str):
                try:
                    appointment_date = datetime.fromisoformat(appointment_date.replace('Z', '+00:00')).date()
                except ValueError:
                    self.add_error("Invalid appointment date format")
                    return
            
            # Check if appointment is not too far in the past
            days_ago = (date.today() - appointment_date).days
            if days_ago > 30:
                self.add_warning("Appointment is more than 30 days in the past")
            
            # Check if appointment is not too far in the future (1 year limit)
            days_ahead = (appointment_date - date.today()).days
            if days_ahead > 365:
                self.add_warning("Appointment is more than 1 year in the future")
        
        # Validate time fields
        self.validate_appointment_times(data)
        
        # Validate appointment type
        if 'appointment_type' in data and data['appointment_type']:
            valid_types = [
                'consultation', 'follow_up', 'emergency', 'therapy', 
                'evaluation', 'medication_review'
            ]
            if data['appointment_type'] not in valid_types:
                self.add_error(f"Invalid appointment type. Must be one of: {', '.join(valid_types)}")
        
        # Validate appointment status
        if 'status' in data and data['status']:
            valid_statuses = [
                'scheduled', 'confirmed', 'cancelled', 'no_show', 
                'completed', 'rescheduled'
            ]
            if data['status'] not in valid_statuses:
                self.add_error(f"Invalid appointment status. Must be one of: {', '.join(valid_statuses)}")
        
        # Validate recurring pattern if provided
        if 'is_recurring' in data and data['is_recurring']:
            if 'recurring_pattern' not in data or not data['recurring_pattern']:
                self.add_error("Recurring pattern must be specified for recurring appointments")
            else:
                self.validate_recurring_pattern(data['recurring_pattern'])
    
    def validate_appointment_times(self, data: Dict[str, Any]) -> None:
        """
        Validate appointment time logic
        """
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        
        if not start_time or not end_time:
            return
        
        # Convert strings to time objects if needed
        if isinstance(start_time, str):
            try:
                start_time = datetime.strptime(start_time, '%H:%M:%S').time()
            except ValueError:
                try:
                    start_time = datetime.strptime(start_time, '%H:%M').time()
                except ValueError:
                    self.add_error("Invalid start time format")
                    return
        
        if isinstance(end_time, str):
            try:
                end_time = datetime.strptime(end_time, '%H:%M:%S').time()
            except ValueError:
                try:
                    end_time = datetime.strptime(end_time, '%H:%M').time()
                except ValueError:
                    self.add_error("Invalid end time format")
                    return
        
        # Check that end time is after start time
        if end_time <= start_time:
            self.add_error("End time must be after start time")
        
        # Check reasonable appointment duration (5 minutes to 8 hours)
        start_datetime = datetime.combine(date.today(), start_time)
        end_datetime = datetime.combine(date.today(), end_time)
        duration = end_datetime - start_datetime
        
        if duration < timedelta(minutes=5):
            self.add_error("Appointment duration must be at least 5 minutes")
        
        if duration > timedelta(hours=8):
            self.add_error("Appointment duration cannot exceed 8 hours")
        
        # Check business hours (6 AM to 10 PM)
        if start_time < time(6, 0) or end_time > time(22, 0):
            self.add_warning("Appointment is outside typical business hours (6 AM - 10 PM)")
    
    def validate_recurring_pattern(self, pattern: Dict[str, Any]) -> None:
        """
        Validate recurring appointment pattern
        """
        if not isinstance(pattern, dict):
            self.add_error("Recurring pattern must be a dictionary")
            return
        
        # Check required fields for recurring pattern
        required_pattern_fields = ['frequency', 'interval']
        for field in required_pattern_fields:
            if field not in pattern:
                self.add_error(f"Recurring pattern must include '{field}'")
        
        # Validate frequency
        if 'frequency' in pattern:
            valid_frequencies = ['daily', 'weekly', 'monthly', 'yearly']
            if pattern['frequency'] not in valid_frequencies:
                self.add_error(f"Invalid frequency. Must be one of: {', '.join(valid_frequencies)}")
        
        # Validate interval
        if 'interval' in pattern:
            try:
                interval = int(pattern['interval'])
                if interval < 1 or interval > 52:  # Max once per week for a year
                    self.add_error("Interval must be between 1 and 52")
            except (ValueError, TypeError):
                self.add_error("Interval must be a valid number")
        
        # Validate end condition
        if 'end_date' in pattern and pattern['end_date']:
            try:
                end_date = datetime.fromisoformat(pattern['end_date'].replace('Z', '+00:00')).date()
                if end_date <= date.today():
                    self.add_error("Recurring appointment end date must be in the future")
            except ValueError:
                self.add_error("Invalid end date format in recurring pattern")
        
        if 'occurrences' in pattern and pattern['occurrences']:
            try:
                occurrences = int(pattern['occurrences'])
                if occurrences < 1 or occurrences > 100:
                    self.add_error("Number of occurrences must be between 1 and 100")
            except (ValueError, TypeError):
                self.add_error("Occurrences must be a valid number")
    
    def validate_create_specific(self, data: Dict[str, Any]) -> None:
        """
        Create-specific validation rules for appointments
        """
        # Check for scheduling conflicts (would need database access)
        # This is a placeholder for future implementation
        pass
    
    def validate_update_specific(self, data: Dict[str, Any]) -> None:
        """
        Update-specific validation rules for appointments
        """
        # Validate that critical changes are allowed
        if 'status' in data:
            # Business rule: completed appointments cannot be rescheduled
            if data['status'] == 'scheduled' and hasattr(self, '_original_status'):
                if self._original_status == 'completed':
                    self.add_error("Cannot reschedule a completed appointment")
    
    def validate_appointment_conflicts(self, data: Dict[str, Any]) -> None:
        """
        Validate appointment scheduling conflicts
        This would need database access in real implementation
        """
        # Placeholder for conflict detection:
        # 1. Check professional availability
        # 2. Check patient double-booking
        # 3. Check room/resource availability
        # 4. Check recurring appointment overlaps
        pass
    
    def validate_healthcare_scheduling_rules(self, data: Dict[str, Any]) -> None:
        """
        Validate healthcare-specific scheduling rules
        """
        appointment_type = data.get('appointment_type')
        
        # Different appointment types have different duration recommendations
        if appointment_type:
            duration_recommendations = {
                'emergency': (15, 60),    # 15min - 1hour
                'consultation': (30, 90), # 30min - 1.5hours
                'therapy': (45, 120),     # 45min - 2hours
                'evaluation': (60, 180),  # 1hour - 3hours
                'follow_up': (15, 45),    # 15min - 45min
                'medication_review': (15, 30),  # 15min - 30min
            }
            
            if appointment_type in duration_recommendations:
                min_duration, max_duration = duration_recommendations[appointment_type]
                
                # Calculate actual duration if times are provided
                start_time = data.get('start_time')
                end_time = data.get('end_time')
                
                if start_time and end_time:
                    try:
                        if isinstance(start_time, str):
                            start_time = datetime.strptime(start_time, '%H:%M').time()
                        if isinstance(end_time, str):
                            end_time = datetime.strptime(end_time, '%H:%M').time()
                        
                        start_datetime = datetime.combine(date.today(), start_time)
                        end_datetime = datetime.combine(date.today(), end_time)
                        duration_minutes = (end_datetime - start_datetime).total_seconds() / 60
                        
                        if duration_minutes < min_duration:
                            self.add_warning(f"{appointment_type} appointments typically require at least {min_duration} minutes")
                        
                        if duration_minutes > max_duration:
                            self.add_warning(f"{appointment_type} appointments typically don't exceed {max_duration} minutes")
                        
                    except (ValueError, TypeError):
                        pass  # Time validation already handled elsewhere
    
    def validate_patient_consent(self, data: Dict[str, Any]) -> None:
        """
        Validate patient consent for scheduling (would need patient data)
        """
        # Placeholder for consent validation:
        # 1. Check if patient has consented to treatment
        # 2. Check if patient has consented to data processing
        # 3. Validate emergency contact information if needed
        pass
    
    def get_scheduling_summary(self) -> Dict[str, Any]:
        """
        Get validation summary for scheduling audit
        """
        return {
            'total_errors': len(self.errors),
            'total_warnings': len(self.warnings),
            'errors': self.errors.copy(),
            'warnings': self.warnings.copy(),
            'validation_timestamp': datetime.now().isoformat(),
            'validator': 'AppointmentValidator',
            'healthcare_checks': [
                'appointment_time_validation',
                'business_hours_check',
                'duration_appropriateness',
                'dual_system_constraint',
                'healthcare_scheduling_rules'
            ]
        }