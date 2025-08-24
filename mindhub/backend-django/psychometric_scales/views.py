"""
Views for psychometric scales
"""
from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic import ListView, DetailView, CreateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib import messages
from django.urls import reverse
from django.http import JsonResponse
from django.views import View
from django.conf import settings
from .models import PsychometricScale, ScaleCategory, ScaleTag
from assessments.models import Assessment, Patient
import json
import os


class ScaleCatalogView(LoginRequiredMixin, ListView):
    """Catalog view showing all available scales"""
    model = PsychometricScale
    template_name = 'scales/mindhub_catalog.html'
    context_object_name = 'scales'
    paginate_by = 12
    
    def get_queryset(self):
        queryset = PsychometricScale.objects.filter(is_active=True).prefetch_related('tags')
        
        # Filter by category
        category = self.request.GET.get('category')
        if category:
            queryset = queryset.filter(category__name=category)
        
        # Filter by population
        population = self.request.GET.get('population')
        if population:
            queryset = queryset.filter(population=population)
        
        # Filter by tag
        tag = self.request.GET.get('tag')
        if tag:
            queryset = queryset.filter(tags__slug=tag)
        
        # Search
        search = self.request.GET.get('search')
        if search:
            queryset = queryset.filter(
                name__icontains=search
            ) | queryset.filter(
                description__icontains=search
            ) | queryset.filter(
                abbreviation__icontains=search
            ) | queryset.filter(
                tags__name__icontains=search
            )
        
        return queryset.distinct().order_by('name')
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categories'] = ScaleCategory.objects.all().order_by('name')
        context['tags'] = ScaleTag.objects.all().order_by('tag_type', 'name')
        context['selected_category'] = self.request.GET.get('category', '')
        context['selected_population'] = self.request.GET.get('population', '')
        context['selected_tag'] = self.request.GET.get('tag', '')
        context['search_query'] = self.request.GET.get('search', '')
        return context


class ScaleDetailView(LoginRequiredMixin, DetailView):
    """Detailed view of a specific scale"""
    model = PsychometricScale
    template_name = 'scales/detail.html'
    context_object_name = 'scale'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user
        
        # Get user's patients for assessment creation
        context['patients'] = Patient.objects.filter(
            created_by=user,
            is_active=True
        ).order_by('last_name', 'first_name')
        
        # Get recent assessments with this scale
        context['recent_assessments'] = Assessment.objects.filter(
            scale=self.object,
            created_by=user
        ).select_related('patient').order_by('-created_at')[:5]
        
        # Load JSON data for the scale
        json_data = self.load_scale_json_data()
        context['scale_json_data'] = json_data
        
        # Extract specific values for easier template access
        if json_data:
            context['json_metadata'] = json_data.get('metadata', {})
            context['json_documentation'] = json_data.get('documentation', {})
            context['json_structure'] = json_data.get('structure', {})
            
            # Extract nested values
            context['json_target_population'] = json_data.get('metadata', {}).get('targetPopulation', {})
            context['json_psychometric'] = json_data.get('documentation', {}).get('psychometricProperties', {})
            context['json_validity'] = json_data.get('documentation', {}).get('psychometricProperties', {}).get('validity', {})
            context['json_reliability'] = json_data.get('documentation', {}).get('psychometricProperties', {}).get('reliability', {})
        
        return context
    
    def load_scale_json_data(self):
        """Load JSON data for the scale from the JSON file"""
        try:
            # The json_file_path already includes the 'scales/' directory
            json_file_path = os.path.join(settings.BASE_DIR, self.object.json_file_path)
            
            if os.path.exists(json_file_path):
                with open(json_file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            else:
                return None
        except (FileNotFoundError, json.JSONDecodeError):
            return None


class StartAssessmentView(LoginRequiredMixin, CreateView):
    """Start a new assessment with selected scale"""
    model = Assessment
    fields = ['patient', 'mode', 'instructions', 'assessment_reason']
    template_name = 'scales/start_assessment.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        self.scale = get_object_or_404(PsychometricScale, pk=self.kwargs['pk'])
        context['scale'] = self.scale
        return context
    
    def get_form(self, form_class=None):
        form = super().get_form(form_class)
        # Filter patients to current user's patients
        form.fields['patient'].queryset = Patient.objects.filter(
            created_by=self.request.user,
            is_active=True
        ).order_by('last_name', 'first_name')
        return form
    
    def form_valid(self, form):
        self.scale = get_object_or_404(PsychometricScale, pk=self.kwargs['pk'])
        form.instance.scale = self.scale
        form.instance.created_by = self.request.user
        form.instance.total_items = self.scale.total_items
        
        response = super().form_valid(form)
        
        messages.success(
            self.request,
            f'Evaluación "{self.scale.name}" creada exitosamente.'
        )
        
        return response
    
    def get_success_url(self):
        return reverse('assessments:take', kwargs={'pk': self.object.pk})


class ActiveScalesAPIView(LoginRequiredMixin, View):
    """API endpoint to get active scales for dropdowns"""
    
    def get(self, request):
        scales = PsychometricScale.objects.filter(is_active=True)
        
        scales_data = []
        for scale in scales:
            scales_data.append({
                'id': str(scale.id),
                'name': scale.name,
                'abbreviation': scale.abbreviation,
                'category': getattr(scale.category, 'name', 'Sin categoría') if hasattr(scale, 'category') and scale.category else 'Sin categoría',
                'description': scale.description,
                'duration_minutes': scale.estimated_duration_minutes,
                'population': scale.get_population_display() if scale.population else 'General',
            })
        
        return JsonResponse(scales_data, safe=False)


class ScaleCatalogAPIView(View):
    """API endpoint for scale catalog - compatible with ClinimetrixPro frontend"""
    
    def get(self, request):
        scales = PsychometricScale.objects.filter(is_active=True).prefetch_related('tags')
        
        scales_data = []
        for scale in scales:
            scale_data = {
                'id': str(scale.id),
                'name': scale.name,
                'abbreviation': scale.abbreviation,
                'category': getattr(scale.category, 'name', 'General') if hasattr(scale, 'category') and scale.category else 'General',
                'description': scale.description,
                'estimated_duration_minutes': scale.estimated_duration_minutes,
                'total_items': scale.total_items,
                'population': scale.get_population_display() if scale.population else 'Todas las edades',
                'application_type': scale.get_application_type_display() if scale.application_type else 'Autoaplicada',
                'is_validated': scale.is_validated,
                'usage_count': scale.usage_count,
                'tags': [tag.name for tag in scale.tags.all()],
                'created_at': scale.created_at.isoformat() if scale.created_at else None,
            }
            scales_data.append(scale_data)
        
        return JsonResponse({
            'success': True,
            'data': scales_data,
            'total': len(scales_data)
        })
