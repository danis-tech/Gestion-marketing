from django.contrib import admin
from django.utils.html import format_html
from .models import Projet, MembreProjet, HistoriqueEtat, PermissionProjet, Tache

# Register your models here.

@admin.register(Tache)
class TacheAdmin(admin.ModelAdmin):
    """Configuration admin pour le modèle Tache."""
    list_display = [
        'titre', 'projet', 'statut', 'priorite', 'phase', 
        'assigne_a', 'debut', 'fin', 'est_en_retard', 'progression'
    ]
    list_filter = [
        'statut', 'priorite', 'phase', 'projet', 'assigne_a', 
        'debut', 'fin', 'cree_le'
    ]
    search_fields = ['titre', 'projet__nom', 'projet__code', 'assigne_a__prenom', 'assigne_a__nom']
    list_editable = ['phase']
    readonly_fields = ['cree_le', 'mise_a_jour_le', 'nbr_jour_estimation', 'progression']
    date_hierarchy = 'cree_le'
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('projet', 'titre', 'phase')
        }),
        ('Classification', {
            'fields': ('statut', 'priorite')
        }),
        ('Planning', {
            'fields': ('debut', 'fin', 'nbr_jour_estimation')
        }),
        ('Assignation', {
            'fields': ('assigne_a', 'tache_dependante')
        }),
        ('Métadonnées', {
            'fields': ('cree_le', 'mise_a_jour_le', 'progression'),
            'classes': ('collapse',)
        }),
    )
    
    def est_en_retard(self, obj):
        """Afficher si la tâche est en retard."""
        if obj.est_en_retard:
            return "En retard"
        return "À jour"
    est_en_retard.short_description = 'État'
    
    def get_queryset(self, request):
        """Optimiser les requêtes."""
        return super().get_queryset(request).select_related('projet', 'assigne_a', 'tache_dependante')
    

