"""
User models for ClinimetrixPro
Professional medical user management
"""

from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator


class CustomUserManager(UserManager):
    """Custom manager for User model"""
    
    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError('El email es obligatorio')
        email = self.normalize_email(email)
        # Use email as username for compatibility
        extra_fields.setdefault('username', email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('user_type', 'admin')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('El superusuario debe tener is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('El superusuario debe tener is_superuser=True.')
        
        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom User model for ClinimetrixPro
    Extends Django's AbstractUser with medical professional fields
    """
    
    class UserType(models.TextChoices):
        ADMIN = 'admin', _('Administrador')
        CLINICIAN = 'clinician', _('Clínico')
        EVALUATOR = 'evaluator', _('Evaluador')
        RESEARCHER = 'researcher', _('Investigador')
    
    class Specialization(models.TextChoices):
        PSYCHOLOGY = 'psychology', _('Psicología')
        PSYCHIATRY = 'psychiatry', _('Psiquiatría')
        NEUROLOGY = 'neurology', _('Neurología')
        GERIATRICS = 'geriatrics', _('Geriatría')
        PEDIATRICS = 'pediatrics', _('Pediatría')
        OTHER = 'other', _('Otra')
    
    # Basic Information
    email = models.EmailField(_('email address'), unique=True)
    first_name = models.CharField(_('first name'), max_length=150, blank=False)
    last_name = models.CharField(_('last name'), max_length=150, blank=False)
    
    # Professional Information
    user_type = models.CharField(
        max_length=20,
        choices=UserType.choices,
        default=UserType.CLINICIAN,
        verbose_name=_('Tipo de usuario')
    )
    
    specialization = models.CharField(
        max_length=20,
        choices=Specialization.choices,
        blank=True,
        verbose_name=_('Especialización')
    )
    
    professional_license = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_('Cédula profesional')
    )
    
    institution = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_('Institución')
    )
    
    # Contact Information
    phone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name=_('Teléfono')
    )
    
    # Profile
    bio = models.TextField(
        blank=True,
        verbose_name=_('Biografía profesional')
    )
    
    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        null=True,
        verbose_name=_('Avatar')
    )
    
    # Preferences
    preferred_language = models.CharField(
        max_length=5,
        choices=[('es', 'Español'), ('en', 'English')],
        default='es',
        verbose_name=_('Idioma preferido')
    )
    
    timezone = models.CharField(
        max_length=50,
        default='America/Mexico_City',
        verbose_name=_('Zona horaria')
    )
    
    # Permissions and Status
    is_verified = models.BooleanField(
        default=False,
        verbose_name=_('Verificado profesionalmente')
    )
    
    can_create_assessments = models.BooleanField(
        default=True,
        verbose_name=_('Puede crear evaluaciones')
    )
    
    can_view_all_results = models.BooleanField(
        default=False,
        verbose_name=_('Puede ver todos los resultados')
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    
    # Django settings
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    objects = CustomUserManager()
    
    class Meta:
        verbose_name = _('Usuario')
        verbose_name_plural = _('Usuarios')
        db_table = 'clinimetrix_users'
        ordering = ['last_name', 'first_name']
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"
    
    def get_full_name(self):
        """Return the first_name plus the last_name, with a space in between."""
        full_name = f"{self.first_name} {self.last_name}"
        return full_name.strip()
    
    def get_short_name(self):
        """Return the short name for the user."""
        return self.first_name
    
    @property
    def is_clinician(self):
        """Check if user is a clinician"""
        return self.user_type == self.UserType.CLINICIAN
    
    @property
    def is_evaluator(self):
        """Check if user is an evaluator"""
        return self.user_type == self.UserType.EVALUATOR
    
    @property
    def is_researcher(self):
        """Check if user is a researcher"""
        return self.user_type == self.UserType.RESEARCHER
    
    @property
    def can_see_results(self):
        """Check if user can see assessment results"""
        return self.is_clinician or self.is_researcher or self.can_view_all_results


class MedicalProfile(models.Model):
    """
    Extended medical professional profile
    Additional information required for platform validation
    """
    
    class WorkEnvironment(models.TextChoices):
        PUBLIC = 'public', _('Sector Público')
        PRIVATE = 'private', _('Sector Privado')  
        STUDENT = 'student', _('Estudiante')
        RESEARCHER = 'researcher', _('Investigador')
    
    class DiscoverySource(models.TextChoices):
        GOOGLE = 'google', _('Google/Búsqueda web')
        COLLEAGUE = 'colleague', _('Recomendación de colega')
        SOCIAL_MEDIA = 'social_media', _('Redes sociales')
        CONFERENCE = 'conference', _('Conferencia/Congreso')
        UNIVERSITY = 'university', _('Universidad/Institución educativa')
        PUBLICATION = 'publication', _('Publicación científica')
        OTHER = 'other', _('Otro')
    
    class ThemePreference(models.TextChoices):
        AUTO = 'auto', _('Automático (sistema)')
        LIGHT = 'light', _('Claro siempre')
        DARK = 'dark', _('Oscuro siempre')
        DISABLED = 'disabled', _('Desactivar tema dinámico')
    
    class DefaultPage(models.TextChoices):
        DASHBOARD = 'dashboard', _('Dashboard')
        PATIENTS = 'patients', _('Lista de Pacientes')  
        SCALES = 'scales', _('Catálogo de Escalas')
        ASSESSMENTS = 'assessments', _('Evaluaciones')
    
    # Relacionar con User
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='medical_profile')
    
    # Información Personal Adicional  
    date_of_birth = models.DateField(
        null=True, blank=True,
        verbose_name=_('Fecha de nacimiento')
    )
    
    phone_validator = RegexValidator(
        regex=r'^\+?1?\d{9,15}$', 
        message="Formato: '+999999999'. Hasta 15 dígitos."
    )
    mobile_phone = models.CharField(
        validators=[phone_validator], 
        max_length=17, 
        verbose_name=_('Teléfono celular'),
        help_text=_('Requerido para notificaciones importantes')
    )
    
    city = models.CharField(
        max_length=100,
        verbose_name=_('Ciudad de residencia')
    )
    
    # Información Profesional Detallada
    work_environment = models.JSONField(
        default=list,
        verbose_name=_('Ámbito de trabajo'),
        help_text=_('Puede seleccionar múltiples opciones')
    )
    
    institution_name = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_('Nombre de la institución'),
        help_text=_('Opcional - Si aplica')
    )
    
    # Credenciales Profesionales (REQUERIDO)
    professional_id = models.CharField(
        max_length=50,
        verbose_name=_('Cédula profesional'),
        help_text=_('Médico, Psicólogo o profesión relacionada - REQUERIDO')
    )
    
    specialty_id = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_('Cédula de especialidad'), 
        help_text=_('Si aplica')
    )
    
    profession_type = models.CharField(
        max_length=100,
        verbose_name=_('Profesión'),
        help_text=_('Ej: Médico, Psicólogo, Psiquiatra, etc.')
    )
    
    # Descubrimiento de la plataforma
    discovery_source = models.CharField(
        max_length=20,
        choices=DiscoverySource.choices,
        verbose_name=_('¿Cómo encontró ClinimetrixPro?')
    )
    
    discovery_other = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_('Otro - especificar')
    )
    
    # Configuraciones de Usuario
    theme_preference = models.CharField(
        max_length=20,
        choices=ThemePreference.choices,
        default=ThemePreference.AUTO,
        verbose_name=_('Preferencia de tema')
    )
    
    default_landing_page = models.CharField(
        max_length=20,
        choices=DefaultPage.choices,
        default=DefaultPage.DASHBOARD,
        verbose_name=_('Página de entrada predeterminada')
    )
    
    # Estados de Verificación
    profile_complete = models.BooleanField(
        default=False,
        verbose_name=_('Perfil completo')
    )
    
    credentials_verified = models.BooleanField(
        default=False,
        verbose_name=_('Credenciales verificadas')
    )
    
    verification_notes = models.TextField(
        blank=True,
        verbose_name=_('Notas de verificación'),
        help_text=_('Para uso interno del equipo de revisión')
    )
    
    # Consentimientos
    data_processing_consent = models.BooleanField(
        default=False,
        verbose_name=_('Consentimiento procesamiento de datos')
    )
    
    marketing_consent = models.BooleanField(
        default=False,
        verbose_name=_('Acepta comunicaciones de marketing')
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    verification_date = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = _('Perfil Médico')
        verbose_name_plural = _('Perfiles Médicos')
        db_table = 'clinimetrix_medical_profiles'
    
    def __str__(self):
        return f"Perfil Médico - {self.user.get_full_name()}"
    
    def get_work_environments_display(self):
        """Return human-readable work environments"""
        env_choices = dict(self.WorkEnvironment.choices)
        return [env_choices.get(env, env) for env in self.work_environment]
    
    def is_profile_complete(self):
        """Check if all required fields are filled"""
        required_fields = [
            self.mobile_phone, 
            self.city, 
            self.professional_id,
            self.profession_type,
            self.discovery_source
        ]
        return all(field for field in required_fields) and self.data_processing_consent
    
    def save(self, *args, **kwargs):
        """Auto-update profile_complete status"""
        self.profile_complete = self.is_profile_complete()
        super().save(*args, **kwargs)