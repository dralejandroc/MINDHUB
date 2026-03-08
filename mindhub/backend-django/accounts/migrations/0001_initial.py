# accounts/migrations/0001_initial.py
# Uses SeparateDatabaseAndState: defines models in migration STATE only,
# no SQL runs (tables already exist in Supabase / were created externally).

from django.db import migrations, models
import django.contrib.auth.models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.CreateModel(
                    name='User',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('password', models.CharField(max_length=128, verbose_name='password')),
                        ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                        ('is_superuser', models.BooleanField(default=False, verbose_name='superuser status')),
                        ('username', models.CharField(max_length=150, unique=True, verbose_name='username')),
                        ('is_staff', models.BooleanField(default=False, verbose_name='staff status')),
                        ('is_active', models.BooleanField(default=True, verbose_name='active')),
                        ('date_joined', models.DateTimeField(default=django.utils.timezone.now, verbose_name='date joined')),
                        ('email', models.EmailField(max_length=254, unique=True, verbose_name='email address')),
                        ('first_name', models.CharField(max_length=150, verbose_name='first name')),
                        ('last_name', models.CharField(max_length=150, verbose_name='last name')),
                        ('user_type', models.CharField(
                            choices=[('admin', 'Administrador'), ('clinician', 'Clínico'), ('evaluator', 'Evaluador'), ('researcher', 'Investigador')],
                            default='clinician', max_length=20, verbose_name='Tipo de usuario',
                        )),
                        ('specialization', models.CharField(
                            blank=True,
                            choices=[('psychology', 'Psicología'), ('psychiatry', 'Psiquiatría'), ('neurology', 'Neurología'), ('geriatrics', 'Geriatría'), ('pediatrics', 'Pediatría'), ('other', 'Otra')],
                            max_length=20, verbose_name='Especialización',
                        )),
                        ('professional_license', models.CharField(blank=True, max_length=50, verbose_name='Cédula profesional')),
                        ('institution', models.CharField(blank=True, max_length=200, verbose_name='Institución')),
                        ('phone', models.CharField(blank=True, max_length=20, verbose_name='Teléfono')),
                        ('bio', models.TextField(blank=True, verbose_name='Biografía profesional')),
                        ('avatar', models.ImageField(blank=True, null=True, upload_to='avatars/', verbose_name='Avatar')),
                        ('preferred_language', models.CharField(
                            choices=[('es', 'Español'), ('en', 'English')], default='es', max_length=5, verbose_name='Idioma preferido',
                        )),
                        ('timezone', models.CharField(default='America/Mexico_City', max_length=50, verbose_name='Zona horaria')),
                        ('is_verified', models.BooleanField(default=False, verbose_name='Verificado profesionalmente')),
                        ('can_create_assessments', models.BooleanField(default=True, verbose_name='Puede crear evaluaciones')),
                        ('can_view_all_results', models.BooleanField(default=False, verbose_name='Puede ver todos los resultados')),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('updated_at', models.DateTimeField(auto_now=True)),
                        ('last_login_ip', models.GenericIPAddressField(blank=True, null=True)),
                        ('groups', models.ManyToManyField(
                            blank=True, related_name='user_set', related_query_name='user',
                            to='auth.group', verbose_name='groups',
                        )),
                        ('user_permissions', models.ManyToManyField(
                            blank=True, related_name='user_set', related_query_name='user',
                            to='auth.permission', verbose_name='user permissions',
                        )),
                    ],
                    options={
                        'verbose_name': 'Usuario',
                        'verbose_name_plural': 'Usuarios',
                        'db_table': 'clinimetrix_users',
                        'ordering': ['last_name', 'first_name'],
                    },
                    managers=[
                        ('objects', django.contrib.auth.models.UserManager()),
                    ],
                ),
                migrations.CreateModel(
                    name='MedicalProfile',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('date_of_birth', models.DateField(blank=True, null=True, verbose_name='Fecha de nacimiento')),
                        ('mobile_phone', models.CharField(max_length=17, verbose_name='Teléfono celular')),
                        ('city', models.CharField(max_length=100, verbose_name='Ciudad de residencia')),
                        ('work_environment', models.JSONField(default=list, verbose_name='Ámbito de trabajo')),
                        ('institution_name', models.CharField(blank=True, max_length=200, verbose_name='Nombre de la institución')),
                        ('professional_id', models.CharField(max_length=50, verbose_name='Cédula profesional')),
                        ('specialty_id', models.CharField(blank=True, max_length=50, verbose_name='Cédula de especialidad')),
                        ('profession_type', models.CharField(max_length=100, verbose_name='Profesión')),
                        ('discovery_source', models.CharField(
                            choices=[('google', 'Google/Búsqueda web'), ('colleague', 'Recomendación de colega'), ('social_media', 'Redes sociales'), ('conference', 'Conferencia/Congreso'), ('university', 'Universidad/Institución educativa'), ('publication', 'Publicación científica'), ('other', 'Otro')],
                            max_length=20, verbose_name='¿Cómo encontró la plataforma?',
                        )),
                        ('discovery_other', models.CharField(blank=True, max_length=200, verbose_name='Otro - especificar')),
                        ('theme_preference', models.CharField(
                            choices=[('auto', 'Automático (sistema)'), ('light', 'Claro siempre'), ('dark', 'Oscuro siempre'), ('disabled', 'Desactivar tema dinámico')],
                            default='auto', max_length=20, verbose_name='Preferencia de tema',
                        )),
                        ('default_landing_page', models.CharField(
                            choices=[('dashboard', 'Dashboard'), ('patients', 'Lista de Pacientes'), ('scales', 'Catálogo de Escalas'), ('assessments', 'Evaluaciones')],
                            default='dashboard', max_length=20, verbose_name='Página de entrada predeterminada',
                        )),
                        ('profile_complete', models.BooleanField(default=False, verbose_name='Perfil completo')),
                        ('credentials_verified', models.BooleanField(default=False, verbose_name='Credenciales verificadas')),
                        ('verification_notes', models.TextField(blank=True, verbose_name='Notas de verificación')),
                        ('data_processing_consent', models.BooleanField(default=False, verbose_name='Consentimiento procesamiento de datos')),
                        ('marketing_consent', models.BooleanField(default=False, verbose_name='Acepta comunicaciones de marketing')),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('updated_at', models.DateTimeField(auto_now=True)),
                        ('verification_date', models.DateTimeField(blank=True, null=True)),
                        ('user', models.OneToOneField(
                            on_delete=django.db.models.deletion.CASCADE,
                            related_name='medical_profile',
                            to='accounts.user',
                        )),
                    ],
                    options={
                        'verbose_name': 'Perfil Médico',
                        'verbose_name_plural': 'Perfiles Médicos',
                        'db_table': 'clinimetrix_medical_profiles',
                    },
                ),
            ],
        ),
    ]
