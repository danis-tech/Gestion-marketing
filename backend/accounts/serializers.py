from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Role, Permission, RolePermission, Service

User = get_user_model()

# -------- Référentiels --------
class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ("id", "code", "nom")

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ("id", "code", "description")

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ("id", "code", "nom")

class RolePermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RolePermission
        fields = ("id", "role", "permission")


# -------- Users --------
class UserListSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    service = ServiceSerializer(read_only=True)

    class Meta:
        model = User
        fields = ("id","username","email","prenom","nom","phone","photo_url","role","service","is_active")


class UserCreateUpdateSerializer(serializers.ModelSerializer):
    role_code = serializers.CharField(write_only=True, required=False, allow_blank=True)
    service_code = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = User
        fields = ("id","username","email","prenom","nom","phone","photo_url","password","role_code","service_code","is_active")

    def create(self, validated_data):
        role_code = validated_data.pop("role_code", None) or None
        service_code = validated_data.pop("service_code", None) or None
        password = validated_data.pop("password", None)

        user = User(**validated_data)
        user.set_password(password or User.objects.make_random_password())

        if role_code:
            user.role = Role.objects.filter(code=role_code).first()
        if service_code:
            user.service = Service.objects.filter(code=service_code).first()

        user.save()
        return user

    def update(self, instance, validated_data):
        role_code = validated_data.pop("role_code", None)
        service_code = validated_data.pop("service_code", None)
        password = validated_data.pop("password", None)

        for k, v in validated_data.items():
            setattr(instance, k, v)

        if role_code is not None:
            instance.role = Role.objects.filter(code=role_code).first()
        if service_code is not None:
            instance.service = Service.objects.filter(code=service_code).first()
        if password:
            instance.set_password(password)

        instance.save()
        return instance


class SetPasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(min_length=8)
    old_password = serializers.CharField(required=False)


class MeSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    service = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id","username","email","prenom","nom","phone","photo_url","role","service","permissions")

    def get_role(self, obj):
        return {"id": obj.role_id, "code": obj.role.code, "nom": obj.role.nom} if obj.role_id else None

    def get_service(self, obj):
        return {"id": obj.service_id, "code": obj.service.code, "nom": obj.service.nom} if obj.service_id else None

    def get_permissions(self, obj):
        # Récupérer les permissions de l'utilisateur via son rôle
        if obj.role:
            # Récupérer toutes les permissions du rôle
            permissions = obj.role.rolepermission_set.select_related('permission').all()
            return [
                {
                    'id': rp.permission.id,
                    'code': rp.permission.code,
                    'description': rp.permission.description
                }
                for rp in permissions
            ]
        return []


# -------- Auth serializers --------
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

class EmailLoginSerializer(serializers.Serializer):
    """
    Serializer personnalisé pour la connexion avec email.
    Body attendu:
      { "email": "...", "password": "...", "remember_me": true/false }
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    remember_me = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        remember_me = attrs.get('remember_me', False)

        # Vérifier que l'utilisateur existe
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Aucun utilisateur trouvé avec cette adresse email.")

        # Vérifier le mot de passe
        if not user.check_password(password):
            raise serializers.ValidationError("Mot de passe incorrect.")

        # Vérifier que l'utilisateur est actif
        if not user.is_active:
            raise serializers.ValidationError("Ce compte est désactivé.")

        # Stocker l'utilisateur pour l'utiliser plus tard
        attrs['user'] = user
        return attrs

    def create(self, validated_data):
        user = validated_data['user']
        remember_me = validated_data.get('remember_me', False)

        # Créer les tokens JWT
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        # Si "se souvenir de moi" est activé, étendre la durée de vie
        if remember_me:
            from datetime import timedelta
            refresh.set_exp(lifetime=timedelta(days=30))
            access.set_exp(lifetime=timedelta(hours=24))

        # Utiliser MeSerializer pour obtenir toutes les informations
        user_data = MeSerializer(user).data

        return {
            'refresh': str(refresh),
            'access': str(access),
            'user': user_data
        }


class EmailOrUsernameTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Permet de se connecter avec email et mot de passe.
    Body attendu:
      { "email": "...", "password": "...", "remember_me": true/false }
    """
    email = serializers.EmailField(write_only=True)
    remember_me = serializers.BooleanField(write_only=True, required=False, default=False)
    username = serializers.CharField(required=False)  # Rendre optionnel car on utilise email

    def validate(self, attrs):
        email = attrs.pop("email", None)
        remember_me = attrs.pop("remember_me", False)
        
        if email:
            # Trouver l'utilisateur par email et utiliser son username
            try:
                user = User.objects.get(email__iexact=email)
                attrs["username"] = user.username
            except User.DoesNotExist:
                raise serializers.ValidationError("Aucun utilisateur trouvé avec cette adresse email.")
        else:
            raise serializers.ValidationError("L'adresse email est obligatoire.")
        
        # Validation standard
        data = super().validate(attrs)
        
        # Si "se souvenir de moi" est activé, étendre la durée de vie des tokens
        if remember_me:
            from rest_framework_simplejwt.settings import api_settings
            from datetime import datetime, timedelta
            
            # Étendre la durée de vie du refresh token à 30 jours
            refresh_lifetime = timedelta(days=30)
            access_lifetime = timedelta(hours=24)
            
            # Mettre à jour les tokens avec les nouvelles durées
            refresh = self.get_token(self.user)
            refresh.set_exp(lifetime=refresh_lifetime)
            
            access = refresh.access_token
            access.set_exp(lifetime=access_lifetime)
            
            data['refresh'] = str(refresh)
            data['access'] = str(access)
        
        return data

class SignupSerializer(UserCreateUpdateSerializer):
    """Inscription publique (pas d'élévation de droits via l'API)."""
    class Meta(UserCreateUpdateSerializer.Meta):
        read_only_fields = ("is_active",)


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer pour demander une réinitialisation de mot de passe.
    Body attendu: { "email": "..." }
    """
    email = serializers.EmailField()

    def validate_email(self, value):
        # Vérifier que l'email existe
        if not User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Aucun utilisateur trouvé avec cette adresse email.")
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer pour confirmer la réinitialisation de mot de passe.
    Body attendu: { "uidb64": "...", "token": "...", "new_password": "..." }
    """
    uidb64 = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

    def validate(self, attrs):
        # Vérifier que le token est valide
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_decode
        from django.utils.encoding import force_str
        
        try:
            # Décoder l'uid depuis l'uidb64
            uid = urlsafe_base64_decode(attrs['uidb64'])
            uid = force_str(uid)
            user = User.objects.get(pk=uid)
            
            # Vérifier que le token est valide
            if not default_token_generator.check_token(user, attrs['token']):
                raise serializers.ValidationError("Token invalide ou expiré.")
            
            return attrs
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError("Token invalide.")
