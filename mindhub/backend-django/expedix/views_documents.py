import uuid
import boto3
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication

from .models import UserDocument, Profile
from .serializers import UserDocumentSerializer

class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication sin verificación CSRF.
    Útil para APIs que no usan cookies (como Postman / front con JWT).
    """
    def enforce_csrf(self, request):
        return  # simplemente no hace nada => no lanza CSRF error


class UserDocumentViewSet(viewsets.ModelViewSet):
    """
    Endpoint para:
    - POST /api/expedix/documents/  (subir archivo a S3)
    - GET  /api/expedix/documents/  (listar documentos del usuario)
    """
    serializer_class = UserDocumentSerializer
    permission_classes = [IsAuthenticated]

    # 👇 Usamos nuestra SessionAuthentication sin CSRF
    authentication_classes = [CsrfExemptSessionAuthentication]

    def get_queryset(self):
        # Filtrar por usuario logueado
        user = self.request.user
        try:
            profile = Profile.objects.get(email=user.email)
        except Profile.DoesNotExist:
            return UserDocument.objects.none()

        return UserDocument.objects.filter(owner=profile)

    def create(self, request, *args, **kwargs):
        """
        Espera:
        - file: archivo (multipart/form-data)
        - tags: string separado por comas, ej: "receta, laboratorio, estudio"
        """
        user = request.user

        # 1) Resolver Profile del usuario
        try:
            profile = Profile.objects.get(email=user.email)
        except Profile.DoesNotExist:
            return Response(
                {"detail": "Perfil no encontrado para el usuario autenticado"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2) Obtener archivo
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response(
                {"detail": "Debe enviar un archivo en el campo 'file'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 3) Parsear tags desde string separado por comas
        raw_tags = request.data.get("tags", "")
        # Ej: "receta, laboratorio,   estudio" → ["receta", "laboratorio", "estudio"]
        tags_list = [
            t.strip()
            for t in raw_tags.split(",")
            if t.strip()
        ]

        # 4) Subir a S3
        bucket_name = settings.AWS_STORAGE_BUCKET_NAME
        region_name = getattr(settings, "AWS_S3_REGION_NAME", "us-west-2")

        s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=region_name,
        )

        # Path en el bucket: expedix/user_<profile_id>/UUID_nombre.ext
        s3_key = f"expedix/user_{profile.id}/{uuid.uuid4()}_{file_obj.name}"

        try:
            s3_client.upload_fileobj(
                file_obj,
                bucket_name,
                s3_key,
                ExtraArgs={
                    "ContentType": file_obj.content_type or "application/octet-stream"
                },
            )
        except Exception as e:
            return Response(
                {"detail": f"Error subiendo a S3: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        file_url = f"https://{bucket_name}.s3.{region_name}.amazonaws.com/{s3_key}"

        # 5) Guardar registro en BD
        document = UserDocument.objects.create(
            owner=profile,
            s3_key=s3_key,
            file_url=file_url,
            original_name=file_obj.name,
            size=file_obj.size,
            content_type=file_obj.content_type or "",
            tags=tags_list,
        )

        serializer = self.get_serializer(document)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
