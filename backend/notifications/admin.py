from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import (
    Notification, NotificationType, ChatMessage, 
    NotificationPreference, NotificationLog
)


@admin.register(NotificationType)
class NotificationTypeAdmin(admin.ModelAdmin):
    list_display = ['code', 'nom', 'est_generale', 'icone', 'couleur']
    list_filter = ['est_generale', 'couleur']
    search_fields = ['code', 'nom', 'description']
    readonly_fields = ['code']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('code', 'nom', 'description')
        }),
        ('Apparence', {
            'fields': ('icone', 'couleur')
        }),
        ('Configuration', {
            'fields': ('est_generale',)
        }),
    )


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        'titre', 'type_notification', 'destinataire_display', 
        'priorite', 'statut', 'cree_le', 'est_expiree_display'
    ]
    list_filter = [
        'type_notification', 'priorite', 'statut', 'cree_le',
        ('destinataire', admin.EmptyFieldListFilter)
    ]
    search_fields = ['titre', 'message', 'destinataire__username']
    readonly_fields = ['cree_le', 'lue_le']
    date_hierarchy = 'cree_le'
    
    fieldsets = (
        ('Contenu', {
            'fields': ('type_notification', 'titre', 'message', 'description_detaillee')
        }),
        ('Destinataire', {
            'fields': ('destinataire',)
        }),
        ('Métadonnées', {
            'fields': ('priorite', 'statut', 'donnees_supplementaires')
        }),
        ('Relations', {
            'fields': ('projet', 'tache', 'etape', 'service'),
            'classes': ('collapse',)
        }),
        ('Dates', {
            'fields': ('cree_le', 'lue_le', 'expire_le'),
            'classes': ('collapse',)
        }),
        ('Créateur', {
            'fields': ('cree_par',),
            'classes': ('collapse',)
        }),
    )
    
    def destinataire_display(self, obj):
        if obj.destinataire:
            return obj.destinataire.username
        return "Générale"
    destinataire_display.short_description = "Destinataire"
    
    def est_expiree_display(self, obj):
        if obj.est_expiree:
            return format_html('<span style="color: red;">Expirée</span>')
        return "Valide"
    est_expiree_display.short_description = "Statut"
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'type_notification', 'destinataire', 'projet', 'tache', 'cree_par'
        )


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['expediteur', 'message_short', 'est_systeme', 'service', 'cree_le']
    list_filter = ['est_systeme', 'service', 'cree_le']
    search_fields = ['message', 'expediteur__username']
    readonly_fields = ['cree_le']
    date_hierarchy = 'cree_le'
    
    def message_short(self, obj):
        return obj.message[:50] + "..." if len(obj.message) > 50 else obj.message
    message_short.short_description = "Message"
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('expediteur', 'service')


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ['utilisateur', 'notifications_email', 'notifications_push', 'notifications_chat']
    list_filter = ['notifications_email', 'notifications_push', 'notifications_chat']
    search_fields = ['utilisateur__username']
    
    fieldsets = (
        ('Utilisateur', {
            'fields': ('utilisateur',)
        }),
        ('Préférences générales', {
            'fields': ('notifications_email', 'notifications_push', 'notifications_chat')
        }),
        ('Préférences par type', {
            'fields': ('preferences_par_type',),
            'classes': ('collapse',)
        }),
        ('Horaires', {
            'fields': ('heure_debut', 'heure_fin', 'jours_semaine'),
            'classes': ('collapse',)
        }),
        ('Fréquence', {
            'fields': ('frequence_digest',),
            'classes': ('collapse',)
        }),
    )


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ['notification', 'methode_envoi', 'statut_envoi', 'envoye_le']
    list_filter = ['methode_envoi', 'statut_envoi', 'envoye_le']
    search_fields = ['notification__titre', 'message_erreur']
    readonly_fields = ['envoye_le']
    date_hierarchy = 'envoye_le'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('notification')


# Actions personnalisées
@admin.action(description="Marquer comme lues")
def marquer_comme_lues(modeladmin, request, queryset):
    updated = 0
    for notification in queryset:
        if notification.statut == 'non_lue':
            notification.marquer_comme_lue()
            updated += 1
    
    modeladmin.message_user(request, f"{updated} notification(s) marquée(s) comme lue(s).")

@admin.action(description="Archiver")
def archiver_notifications(modeladmin, request, queryset):
    updated = 0
    for notification in queryset:
        notification.archiver()
        updated += 1
    
    modeladmin.message_user(request, f"{updated} notification(s) archivée(s).")

# Ajouter les actions aux admins
NotificationAdmin.actions = [marquer_comme_lues, archiver_notifications]