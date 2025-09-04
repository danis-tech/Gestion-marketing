from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import User, Role, Permission, Service, RolePermission, JwtJtiInvalide


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    """Configuration admin pour les rôles."""
    list_display = ['code', 'nom', 'nombre_permissions', 'nombre_utilisateurs']
    search_fields = ['code', 'nom']
    ordering = ['code']
    
    def nombre_permissions(self, obj):
        return obj.rolepermission_set.count()
    nombre_permissions.short_description = 'Permissions'
    
    def nombre_utilisateurs(self, obj):
        return obj.user_set.count()
    nombre_utilisateurs.short_description = 'Utilisateurs'


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    """Configuration admin pour les permissions."""
    list_display = ['code', 'description', 'nombre_roles']
    search_fields = ['code', 'description']
    ordering = ['code']
    
    def nombre_roles(self, obj):
        return obj.rolepermission_set.count()
    nombre_roles.short_description = 'Rôles'


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    """Configuration admin pour les services."""
    list_display = ['code', 'nom', 'nombre_utilisateurs']
    search_fields = ['code', 'nom']
    ordering = ['code']
    
    def nombre_utilisateurs(self, obj):
        return obj.user_set.count()
    nombre_utilisateurs.short_description = 'Utilisateurs'


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    """Configuration admin pour les permissions des rôles."""
    list_display = ['role', 'permission']
    list_filter = ['role', 'permission']
    search_fields = ['role__code', 'role__nom', 'permission__code', 'permission__description']
    ordering = ['role__code', 'permission__code']


@admin.register(JwtJtiInvalide)
class JwtJtiInvalideAdmin(admin.ModelAdmin):
    """Configuration admin pour les tokens JWT invalidés."""
    list_display = ['utilisateur', 'jti', 'invalide_le', 'raison']
    list_filter = ['invalide_le']
    search_fields = ['utilisateur__username', 'utilisateur__email', 'jti', 'raison']
    readonly_fields = ['invalide_le']
    ordering = ['-invalide_le']


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Configuration admin personnalisée pour les utilisateurs."""
    
    list_display = [
        'username', 'email', 'prenom', 'nom', 'role', 'service', 
        'is_active', 'is_staff', 'is_superuser', 'date_joined', 'derniere_connexion'
    ]
    list_filter = [
        'is_active', 'is_staff', 'is_superuser', 'role', 'service', 
        'date_joined', 'last_login'
    ]
    search_fields = ['username', 'email', 'prenom', 'nom']
    ordering = ['-date_joined']
    
    fieldsets = (
        ('Informations de connexion', {
            'fields': ('username', 'password')
        }),
        ('Informations personnelles', {
            'fields': ('email', 'prenom', 'nom', 'phone', 'photo_url')
        }),
        ('Rôles et permissions', {
            'fields': ('role', 'service', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Dates importantes', {
            'fields': ('date_joined', 'last_login'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'prenom', 'nom', 'password1', 'password2', 'is_staff', 'is_superuser'),
        }),
    )
    
    readonly_fields = ['date_joined', 'last_login']
    
    def derniere_connexion(self, obj):
        """Afficher la dernière connexion de manière lisible."""
        if obj.last_login:
            return obj.last_login.strftime('%d/%m/%Y %H:%M')
        return 'Jamais connecté'
    derniere_connexion.short_description = 'Dernière connexion'
    
    def get_queryset(self, request):
        """Optimiser les requêtes avec select_related."""
        return super().get_queryset(request).select_related('role', 'service')
    
    def save_model(self, request, obj, form, change):
        """Personnaliser la sauvegarde pour synchroniser les champs."""
        if not change:  # Nouvel utilisateur
            obj.first_name = obj.prenom
            obj.last_name = obj.nom
        
        # Si l'utilisateur devient superuser, s'assurer qu'il est aussi staff
        if obj.is_superuser and not obj.is_staff:
            obj.is_staff = True
        
        super().save_model(request, obj, form, change)
    
    @admin.action(description="Déclarer comme super admin")
    def make_superuser(self, request, queryset):
        """Déclarer des utilisateurs comme super admin."""
        updated = queryset.update(is_superuser=True, is_staff=True)
        self.message_user(
            request,
            f'{updated} utilisateur(s) déclaré(s) comme super admin avec succès.'
        )
    
    @admin.action(description="Retirer le statut super admin")
    def remove_superuser(self, request, queryset):
        """Retirer le statut super admin."""
        updated = queryset.update(is_superuser=False)
        self.message_user(
            request,
            f'{updated} utilisateur(s) n\'est/sont plus super admin.'
        )
    
    @admin.action(description="Activer les utilisateurs sélectionnés")
    def activate_users(self, request, queryset):
        """Activer des utilisateurs."""
        updated = queryset.update(is_active=True)
        self.message_user(
            request,
            f'{updated} utilisateur(s) activé(s) avec succès.'
        )
    
    @admin.action(description="Désactiver les utilisateurs sélectionnés")
    def deactivate_users(self, request, queryset):
        """Désactiver des utilisateurs."""
        updated = queryset.update(is_active=False)
        self.message_user(
            request,
            f'{updated} utilisateur(s) désactivé(s) avec succès.'
        )
    

