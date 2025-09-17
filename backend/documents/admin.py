from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import DocumentProjet, HistoriqueDocumentProjet, CommentaireDocumentProjet


@admin.register(DocumentProjet)
class DocumentProjetAdmin(admin.ModelAdmin):
    """Administration des documents de projet."""
    
    list_display = [
        'nom_fichier', 'projet_link', 'type_document', 'version', 
        'statut_badge', 'origine_badge', 'phase_link', 'etape_link',
        'cree_par', 'depose_par', 'cree_le'
    ]
    list_filter = [
        'statut', 'origine', 'type_document', 'cree_le', 'projet'
    ]
    search_fields = ['nom_fichier', 'description', 'chemin_fichier']
    ordering = ['-cree_le']
    readonly_fields = ['cree_le']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('projet', 'type_document', 'version', 'description')
        }),
        ('Fichier', {
            'fields': ('chemin_fichier', 'nom_fichier', 'taille_fichier')
        }),
        ('Statut et origine', {
            'fields': ('statut', 'origine')
        }),
        ('Relations', {
            'fields': ('phase', 'etape')
        }),
        ('Utilisateurs', {
            'fields': ('cree_par', 'depose_par')
        }),
        ('Métadonnées', {
            'fields': ('cree_le',)
        })
    )
    
    def projet_link(self, obj):
        """Lien vers le projet."""
        url = reverse('admin:projects_projet_change', args=[obj.projet.id])
        return format_html('<a href="{}">{}</a>', url, obj.projet.nom)
    projet_link.short_description = 'Projet'
    
    def phase_link(self, obj):
        """Lien vers la phase."""
        if obj.phase:
            url = reverse('admin:projects_projetphaseetat_change', args=[obj.phase.id])
            return format_html('<a href="{}">{}</a>', url, obj.phase.phase.nom)
        return '-'
    phase_link.short_description = 'Phase'
    
    def etape_link(self, obj):
        """Lien vers l'étape."""
        if obj.etape:
            url = reverse('admin:projects_etape_change', args=[obj.etape.id])
            return format_html('<a href="{}">{}</a>', url, obj.etape.nom)
        return '-'
    etape_link.short_description = 'Étape'
    
    def statut_badge(self, obj):
        """Badge du statut."""
        colors = {
            'brouillon': '#F59E0B',
            'final': '#10B981',
            'rejete': '#EF4444'
        }
        color = colors.get(obj.statut, '#6B7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">{}</span>',
            color, obj.get_statut_display()
        )
    statut_badge.short_description = 'Statut'
    
    def origine_badge(self, obj):
        """Badge de l'origine."""
        colors = {
            'genere': '#8B5CF6',
            'manuel': '#3B82F6'
        }
        color = colors.get(obj.origine, '#6B7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">{}</span>',
            color, obj.get_origine_display()
        )
    origine_badge.short_description = 'Origine'


@admin.register(HistoriqueDocumentProjet)
class HistoriqueDocumentProjetAdmin(admin.ModelAdmin):
    """Administration de l'historique des documents de projet."""
    
    list_display = [
        'document_link', 'action_badge', 'utilisateur', 'description_short', 
        'date_action', 'changement_statut'
    ]
    list_filter = ['action', 'date_action', 'utilisateur']
    search_fields = ['document__nom_fichier', 'description', 'utilisateur__username']
    ordering = ['-date_action']
    readonly_fields = ['date_action']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('document', 'action', 'utilisateur', 'description')
        }),
        ('Changement de statut', {
            'fields': ('ancien_statut', 'nouveau_statut'),
            'classes': ('collapse',)
        }),
        ('Métadonnées', {
            'fields': ('date_action', 'ip_address'),
            'classes': ('collapse',)
        })
    )
    
    def document_link(self, obj):
        """Lien vers le document."""
        url = reverse('admin:documents_documentprojet_change', args=[obj.document.id])
        return format_html('<a href="{}">{}</a>', url, obj.document.nom_fichier or 'Document')
    document_link.short_description = 'Document'
    
    def action_badge(self, obj):
        """Badge de l'action."""
        colors = {
            'creation': '#10B981',
            'modification': '#3B82F6',
            'changement_statut': '#F59E0B',
            'upload': '#8B5CF6',
            'suppression': '#EF4444',
            'validation': '#10B981',
            'rejet': '#EF4444'
        }
        color = colors.get(obj.action, '#6B7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">{}</span>',
            color, obj.get_action_display()
        )
    action_badge.short_description = 'Action'
    
    def description_short(self, obj):
        """Description courte."""
        if obj.description:
            return obj.description[:50] + '...' if len(obj.description) > 50 else obj.description
        return '-'
    description_short.short_description = 'Description'
    
    def changement_statut(self, obj):
        """Affichage du changement de statut."""
        if obj.ancien_statut and obj.nouveau_statut:
            return format_html(
                '{} → {}',
                obj.ancien_statut, obj.nouveau_statut
            )
        return '-'
    changement_statut.short_description = 'Changement de statut'


@admin.register(CommentaireDocumentProjet)
class CommentaireDocumentProjetAdmin(admin.ModelAdmin):
    """Administration des commentaires de documents de projet."""
    
    list_display = [
        'document_link', 'auteur', 'contenu_short', 'parent', 
        'date_creation', 'modifie'
    ]
    list_filter = ['date_creation', 'modifie', 'auteur']
    search_fields = ['document__nom_fichier', 'contenu', 'auteur__username']
    ordering = ['-date_creation']
    readonly_fields = ['date_creation', 'date_modification']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('document', 'auteur', 'parent')
        }),
        ('Contenu', {
            'fields': ('contenu',)
        }),
        ('Métadonnées', {
            'fields': ('date_creation', 'date_modification', 'modifie')
        })
    )
    
    def document_link(self, obj):
        """Lien vers le document."""
        url = reverse('admin:documents_documentprojet_change', args=[obj.document.id])
        return format_html('<a href="{}">{}</a>', url, obj.document.nom_fichier or 'Document')
    document_link.short_description = 'Document'
    
    def contenu_short(self, obj):
        """Contenu court."""
        if obj.contenu:
            return obj.contenu[:50] + '...' if len(obj.contenu) > 50 else obj.contenu
        return '-'
    contenu_short.short_description = 'Contenu'


# Configuration de l'admin
admin.site.site_header = "Administration - Gestion Marketing"
admin.site.site_title = "Admin Gestion Marketing"
admin.site.index_title = "Tableau de bord"