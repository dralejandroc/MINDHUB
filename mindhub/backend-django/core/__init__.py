"""
Core module for Django backend
Contains shared utilities and services
"""

from .supabase_client import supabase_client

__all__ = ['supabase_client']