"""
Account views for ClinimetrixPro
"""
from django.shortcuts import render
from django.views.generic import TemplateView, UpdateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from .models import User


class ProfileView(LoginRequiredMixin, TemplateView):
    """User profile view"""
    template_name = 'accounts/profile.html'


class ProfileEditView(LoginRequiredMixin, UpdateView):
    """Edit user profile"""
    model = User
    template_name = 'accounts/profile_edit.html'
    fields = ['first_name', 'last_name', 'specialization', 'professional_license', 
              'institution', 'phone', 'bio', 'preferred_language', 'timezone']
    success_url = reverse_lazy('accounts:profile')
    
    def get_object(self):
        return self.request.user
