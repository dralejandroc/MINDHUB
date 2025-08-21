"""
Assessment views for ClinimetrixPro
"""
from django.shortcuts import render, get_object_or_404
from django.views.generic import ListView, DetailView, CreateView, TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import Http404
from django.utils import timezone
from .models import Assessment, Patient, RemoteAssessmentLink


class HomeView(TemplateView):
    """Public home page view for ClinimetrixPro"""
    template_name = 'core/home.html'


class AssessmentListView(LoginRequiredMixin, ListView):
    """List of assessments"""
    model = Assessment
    template_name = 'assessments/list.html'
    context_object_name = 'assessments'
    
    def get_queryset(self):
        return Assessment.objects.filter(
            created_by=self.request.user
        ).select_related('patient', 'scale').order_by('-created_at')


class AssessmentDetailView(LoginRequiredMixin, DetailView):
    """Assessment detail view"""
    model = Assessment
    template_name = 'assessments/detail.html'


class TakeAssessmentView(LoginRequiredMixin, DetailView):
    """Take assessment view - using focused experience"""
    model = Assessment
    template_name = 'assessments/focused_take.html'
    context_object_name = 'assessment'
    
    def get_object(self):
        assessment = super().get_object()
        # Update status to in_progress if not started
        if assessment.status == Assessment.Status.NOT_STARTED:
            assessment.status = Assessment.Status.IN_PROGRESS
            assessment.save()
        return assessment


class FocusedTakeAssessmentView(LoginRequiredMixin, DetailView):
    """Focused assessment taking experience"""
    model = Assessment
    template_name = 'assessments/focused_take.html'
    context_object_name = 'assessment'
    
    def get_object(self):
        assessment = super().get_object()
        # Update status to in_progress if not started
        if assessment.status == Assessment.Status.NOT_STARTED:
            assessment.status = Assessment.Status.IN_PROGRESS
            assessment.save()
        return assessment


class AssessmentResultsView(LoginRequiredMixin, DetailView):
    """Assessment results view"""
    model = Assessment
    template_name = 'assessments/results.html'
    context_object_name = 'assessment'


class PatientListView(LoginRequiredMixin, ListView):
    """List of patients"""
    model = Patient
    template_name = 'assessments/patient_list.html'
    context_object_name = 'patients'
    
    def get_queryset(self):
        return Patient.objects.filter(
            created_by=self.request.user,
            is_active=True
        ).order_by('last_name', 'first_name')


class PatientDetailView(LoginRequiredMixin, DetailView):
    """Patient detail view"""
    model = Patient
    template_name = 'assessments/patient_detail.html'


class PatientCreateView(LoginRequiredMixin, CreateView):
    """Create patient view"""
    model = Patient
    template_name = 'assessments/patient_create.html'
    fields = ['first_name', 'last_name', 'date_of_birth', 'gender', 'email', 'phone']
    
    def form_valid(self, form):
        form.instance.created_by = self.request.user
        form.instance.consent_given = True  # Assumed for clinic use
        return super().form_valid(form)
    
    def get_success_url(self):
        from django.urls import reverse
        next_url = self.request.GET.get('next')
        if next_url:
            return f"{next_url}?patient={self.object.pk}"
        return reverse('assessments:patient_list')


class RemoteAssessmentView(DetailView):
    """Remote assessment taking via secure token"""
    model = Assessment
    template_name = 'assessments/remote_take.html'
    context_object_name = 'assessment'
    
    def get_object(self):
        token = self.kwargs.get('token')
        
        # Get the remote link
        try:
            remote_link = RemoteAssessmentLink.objects.get(token=token)
        except RemoteAssessmentLink.DoesNotExist:
            raise Http404("Enlace no válido")
        
        # Check if link is still valid
        if not remote_link.can_be_used():
            raise Http404("Enlace expirado o ya utilizado")
        
        # Create or get assessment from this remote link
        assessment, created = Assessment.objects.get_or_create(
            remote_link=remote_link,
            defaults={
                'patient': remote_link.patient,
                'scale': remote_link.scale,
                'created_by': remote_link.created_by,
                'clinical_context': remote_link.clinical_context,
                'mode': Assessment.Mode.REMOTE,
                'total_items': remote_link.scale.total_items,
                'status': Assessment.Status.NOT_STARTED
            }
        )
        
        # If new assessment, start it
        if created or assessment.status == Assessment.Status.NOT_STARTED:
            assessment.status = Assessment.Status.IN_PROGRESS
            if not assessment.started_at:
                assessment.started_at = timezone.now()
            assessment.save()
            
            # Increment usage count on remote link
            remote_link.uses_count += 1
            remote_link.save()
        
        return assessment
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        token = self.kwargs.get('token')
        
        try:
            remote_link = RemoteAssessmentLink.objects.get(token=token)
            context['remote_link'] = remote_link
            context['instructions'] = remote_link.instructions
            context['is_remote'] = True
        except RemoteAssessmentLink.DoesNotExist:
            pass
            
        return context


def focused_take(request, assessment_id):
    """
    Focused assessment view for React integration
    Handles return_url parameter for bridging back to React
    """
    assessment = get_object_or_404(Assessment, id=assessment_id)
    
    # Update status to in_progress if not started
    if assessment.status == Assessment.Status.NOT_STARTED:
        assessment.status = Assessment.Status.IN_PROGRESS
        if not assessment.started_at:
            assessment.started_at = timezone.now()
        assessment.save()
    
    # Get return URL from query params
    return_url = request.GET.get('return_url', '/dashboard/')
    
    context = {
        'assessment': assessment,
        'user': request.user,
        'return_url': return_url,
        'is_bridge_mode': True,  # Flag to indicate this came from React
    }
    
    return render(request, 'assessments/focused_take.html', context)
