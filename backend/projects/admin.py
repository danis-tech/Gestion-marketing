from django.contrib import admin
from django.utils.html import format_html
from .models import Projet, MembreProjet, HistoriqueEtat, PermissionProjet, Tache, PhaseProjet, ProjetPhaseEtat, Etape

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


@admin.register(PhaseProjet)
class PhaseProjetAdmin(admin.ModelAdmin):
    """Configuration admin pour le modèle PhaseProjet."""
    list_display = ['ordre', 'nom', 'active', 'description_short']
    list_filter = ['active', 'ordre']
    search_fields = ['nom', 'description']
    list_editable = ['active']
    ordering = ['ordre']
    
    def description_short(self, obj):
        """Afficher une version courte de la description."""
        if obj.description:
            return obj.description[:50] + '...' if len(obj.description) > 50 else obj.description
        return '-'
    description_short.short_description = 'Description'


@admin.register(ProjetPhaseEtat)
class ProjetPhaseEtatAdmin(admin.ModelAdmin):
    """Configuration admin pour le modèle ProjetPhaseEtat."""
    list_display = [
        'projet', 'phase', 'etat_phase', 'date_debut', 'date_fin', 
        'terminee', 'ignoree', 'duree_phase'
    ]
    list_filter = [
        'terminee', 'ignoree', 'phase', 'projet', 'date_debut', 'date_fin'
    ]
    search_fields = [
        'projet__nom', 'projet__code', 'phase__nom', 'commentaire'
    ]
    list_editable = ['terminee', 'ignoree']
    readonly_fields = ['cree_le', 'mis_a_jour_le']
    date_hierarchy = 'date_debut'
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('projet', 'phase')
        }),
        ('État de la phase', {
            'fields': ('terminee', 'ignoree', 'commentaire')
        }),
        ('Planning', {
            'fields': ('date_debut', 'date_fin')
        }),
        ('Métadonnées', {
            'fields': ('cree_le', 'mis_a_jour_le'),
            'classes': ('collapse',)
        }),
    )
    
    def etat_phase(self, obj):
        """Afficher l'état de la phase."""
        if obj.terminee:
            return "Terminée"
        elif obj.ignoree:
            return "Ignorée"
        elif obj.date_debut:
            return "En cours"
        else:
            return "En attente"
    etat_phase.short_description = 'État'
    
    def duree_phase(self, obj):
        """Calculer la durée de la phase."""
        if obj.date_debut and obj.date_fin:
            delta = obj.date_fin - obj.date_debut
            return f"{delta.days} jours"
        elif obj.date_debut:
            from django.utils import timezone
            delta = timezone.now() - obj.date_debut
            return f"{delta.days} jours (en cours)"
        return "-"
    duree_phase.short_description = 'Durée'
    
    def get_queryset(self, request):
        """Optimiser les requêtes."""
        return super().get_queryset(request).select_related('projet', 'phase')


@admin.register(Etape)
class EtapeAdmin(admin.ModelAdmin):
    """Configuration admin pour le modèle Etape."""
    list_display = [
        'nom', 'phase_etat', 'ordre', 'statut', 'priorite', 
        'responsable', 'progression_pourcentage', 'est_en_retard',
        'date_debut_prevue', 'date_fin_prevue', 'duree_prevue'
    ]
    list_filter = [
        'statut', 'priorite', 'phase_etat__phase', 'phase_etat__projet',
        'responsable', 'date_debut_prevue', 'date_fin_prevue', 'cree_le'
    ]
    search_fields = [
        'nom', 'description', 'phase_etat__phase__nom', 
        'phase_etat__projet__nom', 'phase_etat__projet__code',
        'responsable__prenom', 'responsable__nom'
    ]
    list_editable = ['ordre', 'statut', 'priorite', 'progression_pourcentage']
    readonly_fields = ['cree_le', 'mis_a_jour_le', 'est_en_retard', 'duree_prevue', 'duree_reelle']
    date_hierarchy = 'date_debut_prevue'
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('phase_etat', 'nom', 'description', 'ordre')
        }),
        ('Statut et priorité', {
            'fields': ('statut', 'priorite', 'progression_pourcentage')
        }),
        ('Responsable', {
            'fields': ('responsable',)
        }),
        ('Planning prévu', {
            'fields': ('date_debut_prevue', 'date_fin_prevue')
        }),
        ('Planning réel', {
            'fields': ('date_debut_reelle', 'date_fin_reelle'),
            'classes': ('collapse',)
        }),
        ('Commentaires', {
            'fields': ('commentaire', 'notes_internes'),
            'classes': ('collapse',)
        }),
        ('Métadonnées', {
            'fields': ('cree_par', 'cree_le', 'mis_a_jour_le'),
            'classes': ('collapse',)
        }),
    )
    
    def duree_prevue(self, obj):
        """Calculer la durée prévue."""
        if obj.duree_prevue:
            return f"{obj.duree_prevue} jours"
        return "-"
    duree_prevue.short_description = 'Durée prévue'
    
    def get_queryset(self, request):
        """Optimiser les requêtes."""
        return super().get_queryset(request).select_related(
            'phase_etat__phase', 'phase_etat__projet', 'responsable', 'cree_par'
        )

