from django.contrib.auth import get_user_model
from django.db import models
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.shortcuts import render
from django.http import HttpResponse, FileResponse
from django.views.static import serve
import os
import uuid
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

from .models import Role, Permission, RolePermission, Service
from .serializers import (
    RoleSerializer, PermissionSerializer, ServiceSerializer, RolePermissionSerializer, RolePermissionCreateSerializer,
    UserListSerializer, UserCreateUpdateSerializer, SetPasswordSerializer, MeSerializer,
    EmailOrUsernameTokenObtainPairSerializer, SignupSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer, EmailLoginSerializer
)
from .permissions import IsSelfOrAdmin

User = get_user_model()

# -------- Référentiels --------
class RoleViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des rôles.
    
    Endpoints disponibles :
    - GET /api/accounts/roles/ - Liste des rôles
    - POST /api/accounts/roles/ - Créer un rôle
    - GET /api/accounts/roles/{id}/ - Détails d'un rôle
    - PUT /api/accounts/roles/{id}/ - Modifier un rôle
    - DELETE /api/accounts/roles/{id}/ - Supprimer un rôle
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    
    @action(detail=True, methods=['get'])
    def permissions(self, request, pk=None):
        """Obtenir les permissions d'un rôle."""
        role = self.get_object()
        permissions = Permission.objects.filter(rolepermission__role=role)
        serializer = PermissionSerializer(permissions, many=True)
        return Response(serializer.data)


class PermissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des permissions.
    
    Endpoints disponibles :
    - GET /api/accounts/permissions/ - Liste des permissions
    - POST /api/accounts/permissions/ - Créer une permission
    - GET /api/accounts/permissions/{id}/ - Détails d'une permission
    - PUT /api/accounts/permissions/{id}/ - Modifier une permission
    - DELETE /api/accounts/permissions/{id}/ - Supprimer une permission
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer


class ServiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des services.
    
    Endpoints disponibles :
    - GET /api/accounts/services/ - Liste des services
    - POST /api/accounts/services/ - Créer un service
    - GET /api/accounts/services/{id}/ - Détails d'un service
    - PUT /api/accounts/services/{id}/ - Modifier un service
    - DELETE /api/accounts/services/{id}/ - Supprimer un service
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer


class RolePermissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des permissions des rôles.
    
    Endpoints disponibles :
    - GET /api/accounts/role-permissions/ - Liste des permissions de rôles
    - POST /api/accounts/role-permissions/ - Assigner une permission à un rôle
    - DELETE /api/accounts/role-permissions/{id}/ - Retirer une permission d'un rôle
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = RolePermission.objects.select_related('role', 'permission').all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return RolePermissionCreateSerializer
        return RolePermissionSerializer


# -------- Utilisateurs --------
class UserViewSet(viewsets.ModelViewSet):
    """
    /users/ CRUD admin
    Filtres:
      ?search=... (username/email/prenom/nom)
      ?role=marketing (code)
      ?service=dsi (code)
      ?is_active=true/false
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ["list","create","destroy","set_password","partial_update","update"]:
            return [permissions.IsAdminUser()]
        if self.action in ["retrieve"]:
            return [IsSelfOrAdmin()]
        return super().get_permissions()

    def get_queryset(self):
        qs = User.objects.select_related("role","service").all().order_by("id")
        req = self.request
        search = req.query_params.get("search")
        role_code = req.query_params.get("role")
        service_code = req.query_params.get("service")
        is_active = req.query_params.get("is_active")
        if search:
            qs = qs.filter(
                models.Q(username__icontains=search) |
                models.Q(email__icontains=search) |
                models.Q(prenom__icontains=search) |
                models.Q(nom__icontains=search)
            )
        if role_code:
            qs = qs.filter(role__code=role_code)
        if service_code:
            qs = qs.filter(service__code=service_code)
        if is_active in ["true","false"]:
            qs = qs.filter(is_active=(is_active == "true"))
        return qs

    def get_serializer_class(self):
        if self.action in ["list","retrieve"]:
            return UserListSerializer
        return UserCreateUpdateSerializer

    @action(detail=True, methods=["post"])
    def set_password(self, request, pk=None):
        user = self.get_object()
        ser = SetPasswordSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        # si non-admin, old_password requis et doit être correct
        if not request.user.is_staff:
            old = ser.validated_data.get("old_password")
            if not old or not user.check_password(old):
                return Response({"detail": "Ancien mot de passe incorrect."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(ser.validated_data["new_password"])
        user.save()
        return Response({"detail": "Mot de passe mis à jour."})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Obtenir les statistiques des utilisateurs."""
        from django.utils import timezone
        from datetime import timedelta
        
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Statistiques générales
        total_users = User.objects.count()
        active_today = User.objects.filter(last_login__date=today).count()
        active_this_week = User.objects.filter(last_login__date__gte=week_ago).count()
        active_this_month = User.objects.filter(last_login__date__gte=month_ago).count()
        
        # Statistiques par rôle
        role_stats = {}
        for user in User.objects.filter(is_active=True).select_related('role'):
            role_name = user.role.nom if user.role else 'Aucun rôle'
            role_stats[role_name] = role_stats.get(role_name, 0) + 1
        
        # Statistiques par service
        service_stats = {}
        for user in User.objects.filter(is_active=True).select_related('service'):
            service_name = user.service.nom if user.service else 'Aucun service'
            service_stats[service_name] = service_stats.get(service_name, 0) + 1
        
        return Response({
            'total_users': total_users,
            'active_today': active_today,
            'active_this_week': active_this_week,
            'active_this_month': active_this_month,
            'online_users': active_today,  # Pour l'affichage en temps réel
            'par_role': role_stats,
            'par_service': service_stats,
            'derniere_mise_a_jour': today.isoformat()
        })

# -------- Profil connecté --------
class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        return Response(MeSerializer(request.user).data)

    def patch(self, request):
        allowed = {"prenom","nom","phone","photo_url"}
        partial = {k:v for k,v in request.data.items() if k in allowed}
        ser = UserCreateUpdateSerializer(request.user, data=partial, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(MeSerializer(request.user).data, status=200)

# -------- Auth --------
class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = EmailLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Créer les tokens et retourner la réponse
        result = serializer.create(serializer.validated_data)
        return Response(result, status=status.HTTP_200_OK)

class SignupView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = SignupSerializer

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Pour des raisons de sécurité, on ne révèle pas si l'email existe
            return Response({
                "detail": "Si cet email existe dans notre système, vous recevrez un lien de réinitialisation."
            }, status=status.HTTP_200_OK)
        
        # Générer le token et l'URL de réinitialisation
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"
        
        # Envoyer l'email
        try:
            subject = "Réinitialisation de votre mot de passe"
            html_message = render_to_string('emails/password_reset.html', {
                'user': user,
                'reset_url': reset_url,
            })
            plain_message = strip_tags(html_message)
            
            send_mail(
                subject,
                plain_message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            return Response({
                "detail": "Email de réinitialisation envoyé avec succès."
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Erreur lors de l'envoi de l'email: {e}")
            # En développement, on peut retourner une réponse de succès même si l'email échoue
            if settings.DEBUG:
                return Response({
                    "detail": f"Email de réinitialisation envoyé avec succès. (Mode debug: {str(e)})"
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "detail": "Erreur lors de l'envoi de l'email. Veuillez réessayer."
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        uidb64 = serializer.validated_data['uidb64']
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({
                "detail": "Token invalide."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not default_token_generator.check_token(user, token):
            return Response({
                "detail": "Token invalide ou expiré."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mettre à jour le mot de passe
        user.set_password(new_password)
        user.save()
        
        return Response({
            "detail": "Mot de passe réinitialisé avec succès."
        }, status=status.HTTP_200_OK)

class PasswordResetConfirmPageView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, uidb64, token):
        """Page de confirmation de réinitialisation de mot de passe."""
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return HttpResponse("Token invalide.", status=400)
        
        if not default_token_generator.check_token(user, token):
            return HttpResponse("Token invalide ou expiré.", status=400)
        
        # Ici, vous pourriez rendre une page HTML avec un formulaire
        return HttpResponse(f"Token valide pour {user.email}. Vous pouvez maintenant réinitialiser votre mot de passe.")

# -------- Upload de photo --------
class PhotoUploadView(APIView):
    """
    Vue pour l'upload de photos de profil utilisateur.
    POST /accounts/upload-photo/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            # Vérifier qu'un fichier a été envoyé
            if 'photo' not in request.FILES:
                return Response({
                    "detail": "Aucun fichier photo fourni."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            photo_file = request.FILES['photo']
            
            # Vérifier le type de fichier
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
            print(f"Content-Type reçu: {photo_file.content_type}")
            print(f"Nom du fichier: {photo_file.name}")
            if photo_file.content_type not in allowed_types:
                return Response({
                    "detail": f"Type de fichier non supporté. Reçu: {photo_file.content_type}. Utilisez JPG, PNG ou GIF."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Vérifier la taille (500KB max)
            max_size = 500 * 1024  # 500KB en bytes
            if photo_file.size > max_size:
                return Response({
                    "detail": "La taille du fichier ne doit pas dépasser 500KB."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Générer un nom de fichier unique
            file_extension = os.path.splitext(photo_file.name)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            
            # Créer le répertoire photoUser s'il n'existe pas
            upload_dir = 'photoUser'
            if not os.path.exists(os.path.join(settings.MEDIA_ROOT, upload_dir)):
                os.makedirs(os.path.join(settings.MEDIA_ROOT, upload_dir))
            
            # Sauvegarder le fichier
            file_path = os.path.join(upload_dir, unique_filename)
            saved_path = default_storage.save(file_path, ContentFile(photo_file.read()))
            
            # Construire l'URL complète de la photo via notre API
            base_url = request.build_absolute_uri('/').rstrip('/')
            photo_url = f"{base_url}/api/accounts/media/{saved_path}"
            
            return Response({
                "detail": "Photo uploadée avec succès.",
                "photo_url": photo_url,
                "filename": unique_filename
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "detail": f"Erreur lors de l'upload: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MediaFileView(APIView):
    """
    Vue pour servir les fichiers médias en développement.
    """
    permission_classes = [AllowAny]

    def get(self, request, path):
        try:
            # Construire le chemin complet du fichier
            file_path = os.path.join(settings.MEDIA_ROOT, path)
            
            # Vérifier que le fichier existe
            if not os.path.exists(file_path):
                return Response({
                    "detail": "Fichier non trouvé",
                    "file_path": file_path
                }, status=404)
            
            # Déterminer le type MIME
            import mimetypes
            content_type, _ = mimetypes.guess_type(file_path)
            if content_type is None:
                content_type = 'application/octet-stream'
            
            # Servir le fichier
            with open(file_path, 'rb') as f:
                response = HttpResponse(f.read(), content_type=content_type)
                response['Content-Disposition'] = f'inline; filename="{os.path.basename(file_path)}"'
                return response
                
        except Exception as e:
            return Response({
                "detail": f"Erreur lors du chargement du fichier: {str(e)}"
            }, status=500)


