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
from django.http import HttpResponse

from .models import Role, Permission, RolePermission, Service
from .serializers import (
    RoleSerializer, PermissionSerializer, ServiceSerializer, RolePermissionSerializer,
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


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet en lecture seule pour les permissions.
    
    Endpoints disponibles :
    - GET /api/accounts/permissions/ - Liste des permissions
    - GET /api/accounts/permissions/{id}/ - Détails d'une permission
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer


class ServiceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet en lecture seule pour les services.
    
    Endpoints disponibles :
    - GET /api/accounts/services/ - Liste des services
    - GET /api/accounts/services/{id}/ - Détails d'un service
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
    queryset = RolePermission.objects.all()
    serializer_class = RolePermissionSerializer

# -------- Users --------
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
        return Response({"detail": "Mot de passe mis à jour."}, status=200)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Obtenir les statistiques des utilisateurs."""
        from django.utils import timezone
        from datetime import timedelta
        
        # Calculer les statistiques
        total_users = User.objects.filter(is_active=True).count()
        
        # Utilisateurs connectés aujourd'hui (dernière connexion dans les dernières 24h)
        today = timezone.now()
        yesterday = today - timedelta(hours=24)
        active_today = User.objects.filter(
            is_active=True,
            last_login__gte=yesterday
        ).count()
        
        # Utilisateurs connectés cette semaine
        week_ago = today - timedelta(days=7)
        active_this_week = User.objects.filter(
            is_active=True,
            last_login__gte=week_ago
        ).count()
        
        # Utilisateurs connectés ce mois
        month_ago = today - timedelta(days=30)
        active_this_month = User.objects.filter(
            is_active=True,
            last_login__gte=month_ago
        ).count()
        
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
    """
    Vue pour demander une réinitialisation de mot de passe.
    POST /accounts/password-reset-request/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
            return Response({
                "detail": "Si un compte avec cet email existe, un email de réinitialisation a été envoyé."
            }, status=status.HTTP_200_OK)
        
        # Générer le token de réinitialisation
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Construire l'URL de réinitialisation
        reset_url = f"{request.scheme}://{request.get_host()}/password-reset-confirm/{uid}/{token}/"
        
        # Envoyer l'email
        try:
            # Sujet de l'email
            subject = "Réinitialisation de votre mot de passe - Gestion Marketing"
            
            # Contenu HTML de l'email
            html_message = f"""
            <html>
            <body>
                <h2>Réinitialisation de votre mot de passe</h2>
                <p>Bonjour,</p>
                <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Gestion Marketing.</p>
                <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
                <p><a href="{reset_url}" style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Réinitialiser mon mot de passe</a></p>
                <p>Ou copiez ce lien dans votre navigateur :</p>
                <p>{reset_url}</p>
                <p>Ce lien expirera dans 24 heures.</p>
                <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
                <br>
                <p>Cordialement,<br>L'équipe Gestion Marketing</p>
            </body>
            </html>
            """
            
            # Contenu texte simple
            plain_message = f"""
            Réinitialisation de votre mot de passe
            
            Bonjour,
            
            Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Gestion Marketing.
            
            Cliquez sur le lien suivant pour réinitialiser votre mot de passe :
            {reset_url}
            
            Ce lien expirera dans 24 heures.
            
            Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
            
            Cordialement,
            L'équipe Gestion Marketing
            """
            
            # Envoyer l'email
            send_mail(
                subject=subject,
                message=strip_tags(plain_message),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False,
            )
            
            return Response({
                "detail": "Email de réinitialisation envoyé avec succès. Vérifiez votre boîte de réception."
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
    """
    Vue pour confirmer la réinitialisation de mot de passe.
    POST /accounts/password-reset-confirm/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        uidb64 = serializer.validated_data['uidb64']
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        
        try:
            # Décoder l'uid depuis l'uidb64
            uid = urlsafe_base64_decode(uidb64)
            uid = force_str(uid)
            user = User.objects.get(pk=uid)
            
            # Vérifier que le token est valide
            if not default_token_generator.check_token(user, token):
                return Response({
                    "detail": "Token invalide ou expiré."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Mettre à jour le mot de passe
            user.set_password(new_password)
            user.save()
            
            return Response({
                "detail": "Mot de passe mis à jour avec succès."
            }, status=status.HTTP_200_OK)
            
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({
                "detail": "Token invalide."
            }, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmPageView(APIView):
    """
    Vue pour afficher la page de réinitialisation (GET) et traiter la soumission (POST).
    GET/POST /accounts/password-reset-confirm/<uidb64>/<token>/
    """
    permission_classes = [AllowAny]
    
    def get(self, request, uidb64, token):
        """
        Afficher la page de réinitialisation (pour React Router)
        """
        try:
            # Vérifier que le token est valide
            uid = urlsafe_base64_decode(uidb64)
            uid = force_str(uid)
            user = User.objects.get(pk=uid)
            
            if not default_token_generator.check_token(user, token):
                return HttpResponse("""
                <html>
                <head>
                    <title>Token invalide</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        .error { color: #dc2626; }
                    </style>
                </head>
                <body>
                    <h1 class="error">Token invalide ou expiré</h1>
                    <p>Le lien de réinitialisation n'est plus valide.</p>
                    <p><a href="/">Retour à la page d'accueil</a></p>
                </body>
                </html>
                """, status=400)
            
            # Si le token est valide, rediriger vers la page React
            return HttpResponse("""
            <html>
            <head>
                <title>Réinitialisation du mot de passe</title>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { 
                        margin: 0; 
                        padding: 0; 
                        font-family: Arial, sans-serif; 
                        background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .loading {
                        background: white;
                        padding: 40px;
                        border-radius: 10px;
                        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                        text-align: center;
                    }
                    .spinner {
                        width: 40px;
                        height: 40px;
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #0066cc;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 20px;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            </head>
            <body>
                <div class="loading">
                    <div class="spinner"></div>
                    <h2>Chargement de la page de réinitialisation...</h2>
                    <p>Si la page ne se charge pas automatiquement, <a href="http://localhost:5173/password-reset-confirm/""" + uidb64 + "/" + token + """" target="_blank">cliquez ici</a></p>
                </div>
                <script>
                    // Rediriger vers l'application React
                    window.location.href = 'http://localhost:5173/password-reset-confirm/""" + uidb64 + "/" + token + """';
                </script>
            </body>
            </html>
            """)
            
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return HttpResponse("""
            <html>
            <head>
                <title>Token invalide</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .error { color: #dc2626; }
                </style>
            </head>
            <body>
                <h1 class="error">Token invalide</h1>
                <p>Le lien de réinitialisation n'est pas valide.</p>
                <p><a href="/">Retour à la page d'accueil</a></p>
            </body>
            </html>
            """, status=400)
    
    def post(self, request, uidb64, token):
        """
        Traiter la réinitialisation du mot de passe
        """
        try:
            # Décoder l'uid depuis l'URL
            uid = urlsafe_base64_decode(uidb64)
            uid = force_str(uid)
            user = User.objects.get(pk=uid)
            
            # Vérifier que le token est valide
            if not default_token_generator.check_token(user, token):
                return Response({
                    "detail": "Token invalide ou expiré."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Valider le nouveau mot de passe
            new_password = request.data.get('new_password')
            if not new_password or len(new_password) < 8:
                return Response({
                    "detail": "Le mot de passe doit contenir au moins 8 caractères."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Mettre à jour le mot de passe
            user.set_password(new_password)
            user.save()
            
            return Response({
                "detail": "Mot de passe mis à jour avec succès."
            }, status=status.HTTP_200_OK)
            
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({
                "detail": "Token invalide."
            }, status=status.HTTP_400_BAD_REQUEST)
