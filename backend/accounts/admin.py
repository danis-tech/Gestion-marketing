from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Role, Permission, RolePermission, Service, JwtJtiInvalide

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("id","code","nom")
    search_fields = ("code","nom")

@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ("id","code","description")
    search_fields = ("code","description")

@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ("role","permission")
    list_filter = ("role",)
    search_fields = ("role__code","permission__code")

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("id","code","nom")
    search_fields = ("code","nom")

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = (
        (None, {"fields": ("username","password")}),
        ("Identité", {"fields": ("email","prenom","nom","phone","photo_url")}),
        ("Organisation", {"fields": ("role","service")}),
        ("Permissions", {"fields": ("is_active","is_staff","is_superuser","groups","user_permissions")}),
        ("Dates", {"fields": ("last_login","derniere_connexion_le","date_joined","cree_le","mis_a_jour_le")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("username","email","prenom","nom","phone","photo_url","password1","password2")}),
    )
    list_display = ("id","username","email","prenom","nom","photo_url","role","service","is_active")
    list_filter = ("role","service","is_active","is_staff")
    search_fields = ("username","email","prenom","nom")
    ordering = ("id",)

@admin.register(JwtJtiInvalide)
class JwtJtiInvalideAdmin(admin.ModelAdmin):
    list_display = ("id","utilisateur","jti","invalide_le","raison")
    search_fields = ("jti","utilisateur__username","utilisateur__email")
    list_filter = ("invalide_le",)
