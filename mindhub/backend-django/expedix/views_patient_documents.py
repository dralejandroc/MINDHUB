import uuid
import logging
import boto3

from django.conf import settings
from django.utils import timezone

from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Patient, PatientDocument, Profile
from .serializers import PatientDocumentSerializer

logger = logging.getLogger(__name__)


from rest_framework.authentication import SessionAuthentication

class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication sin verificación CSRF.
    Útil para APIs que no usan cookies (como Postman / front con JWT).
    """
    def enforce_csrf(self, request):
        return  # simplemente no hace nada => no lanza CSRF error

class PatientDocumentViewSet(viewsets.ModelViewSet):
    """
    CRUD de documentos asociados a un paciente.
    - list: ?patient_id=<uuid> para obtener los documentos de ese paciente
    - create: multipart/form-data con file + patient_id
    - destroy: borra el registro y (opcional) el archivo en S3
    """
    queryset = PatientDocument.objects.all().select_related('patient')
    serializer_class = PatientDocumentSerializer
    permission_classes = [IsAuthenticated]

    # 👇 Usamos nuestra SessionAuthentication sin CSRF
    authentication_classes = [CsrfExemptSessionAuthentication]

    def get_queryset(self):
        qs = super().get_queryset()
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs

    def create(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        patient_id = request.data.get('patient_id')

        if not file_obj or not patient_id:
            return Response(
                {'detail': 'Se requiere file y patient_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar paciente
        try:
            patient = Patient.objects.get(pk=patient_id)
        except Patient.DoesNotExist:
            return Response(
                {'detail': 'Paciente no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Cliente S3
        s3_client = boto3.client(
            's3',
            aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', None),
            aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
            region_name=getattr(settings, 'AWS_S3_REGION_NAME', None),
        )
        bucket_name = settings.AWS_STORAGE_BUCKET_NAME

        # Key organizada por paciente y fecha
        unique_id = uuid.uuid4()
        # today = timezone.now().strftime('%Y/%m/%d')
        s3_key = f"patients/{patient_id}/{unique_id}_{file_obj.name}"

        try:
            s3_client.upload_fileobj(
                file_obj,
                bucket_name,
                s3_key,
                ExtraArgs={
                    "ContentType": file_obj.content_type or 'application/octet-stream'
                }
            )
        except Exception as e:
            logger.exception("Error subiendo archivo de paciente a S3")
            return Response(
                {'detail': f'Error subiendo a S3: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Construir URL pública (asumiendo bucket público o CloudFront/domain)
        custom_domain = getattr(settings, 'AWS_S3_CUSTOM_DOMAIN', None)
        region = getattr(settings, 'AWS_S3_REGION_NAME', 'us-west-2')

        if custom_domain:
            file_url = f"https://{custom_domain}/{s3_key}"
        else:
            file_url = f"https://{bucket_name}.s3.{region}.amazonaws.com/{s3_key}"

        # Buscar perfil del usuario (si aplica)
        uploaded_by = None
        user = request.user
        if user and user.is_authenticated and getattr(user, 'email', None):
            try:
                uploaded_by = Profile.objects.get(email=user.email)
            except Profile.DoesNotExist:
                uploaded_by = None

        patient_doc = PatientDocument.objects.create(
            patient=patient,
            file_name=file_obj.name,
            file_type=file_obj.content_type or '',
            file_size=file_obj.size,
            file_url=file_url,
            s3_key=s3_key,
            uploaded_by=uploaded_by,
            uploaded_at=timezone.now(),
        )

        serializer = self.get_serializer(patient_doc)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        instance: PatientDocument = self.get_object()
        s3_key = instance.s3_key

        # Primero borramos el objeto de la BD
        response = super().destroy(request, *args, **kwargs)

        # Luego intentamos borrar el archivo en S3 (opcional)
        if s3_key:
            try:
                s3_client = boto3.client(
                    's3',
                    aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', None),
                    aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
                    region_name=getattr(settings, 'AWS_S3_REGION_NAME', None),
                )
                bucket_name = settings.AWS_STORAGE_BUCKET_NAME
                s3_client.delete_object(Bucket=bucket_name, Key=s3_key)
            except Exception as e:
                logger.warning(f"Error borrando archivo de paciente en S3: {e}")

        return response
