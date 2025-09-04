from rest_framework import permissions
from .models import Projet, PermissionProjet


class ProjetPermissions(permissions.BasePermission):
    """
    Permissions personnalisées pour les projets.
    """
    
    def has_permission(self, request, view):
        """Vérifier les permissions générales."""
        # Les superusers ont tous les droits
        if request.user.is_superuser:
            return True
        
        # Les utilisateurs authentifiés peuvent voir la liste des projets
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Seuls les utilisateurs authentifiés peuvent créer des projets
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """Vérifier les permissions sur un objet spécifique."""
        # Les superusers ont tous les droits
        if request.user.is_superuser:
            return True
        
        # Vérifier si l'utilisateur est le propriétaire du projet
        if obj.proprietaire == request.user:
            return True
        
        # Vérifier les permissions spécifiques selon l'action
        if view.action == 'retrieve':
            return self._has_permission(request.user, obj, 'voir')
        elif view.action in ['update', 'partial_update']:
            return self._has_permission(request.user, obj, 'modifier')
        elif view.action == 'destroy':
            return self._has_permission(request.user, obj, 'supprimer')
        elif view.action == 'update_statut':
            return self._has_permission(request.user, obj, 'valider')
        
        return False
    
    def _has_permission(self, user, projet, permission_code):
        """Vérifier si un utilisateur a une permission spécifique sur un projet."""
        return PermissionProjet.objects.filter(
            projet=projet,
            utilisateur=user,
            permission=permission_code,
            active=True
        ).exists()


class MembreProjetPermissions(permissions.BasePermission):
    """
    Permissions pour la gestion des membres de projet.
    """
    
    def has_permission(self, request, view):
        """Vérifier les permissions générales."""
        if not request.user.is_authenticated:
            return False
        
        # Récupérer le projet depuis l'URL
        projet_pk = view.kwargs.get('projet_pk')
        if not projet_pk:
            return False
        
        try:
            projet = Projet.objects.get(pk=projet_pk)
        except Projet.DoesNotExist:
            return False
        
        # Vérifier les permissions sur le projet
        if request.user.is_superuser or projet.proprietaire == request.user:
            return True
        
        # Vérifier la permission de gestion des membres
        has_gerer_membres = PermissionProjet.objects.filter(
            projet=projet,
            utilisateur=request.user,
            permission='gerer_membres',
            active=True
        ).exists()
        
        # Pour le développement, permettre aussi aux utilisateurs connectés d'ajouter des membres
        if request.method == 'POST' and request.user.is_authenticated:
            return True
        
        return has_gerer_membres
    
    def has_object_permission(self, request, view, obj):
        """Vérifier les permissions sur un membre spécifique."""
        if request.user.is_superuser:
            return True
        
        projet = obj.projet
        
        # Le propriétaire du projet peut tout faire
        if projet.proprietaire == request.user:
            return True
        
        # L'utilisateur peut se supprimer lui-même
        if obj.utilisateur == request.user and request.method == 'DELETE':
            return True
        
        # Vérifier la permission de gestion des membres
        return PermissionProjet.objects.filter(
            projet=projet,
            utilisateur=request.user,
            permission='gerer_membres',
            active=True
        ).exists()


class HistoriqueEtatPermissions(permissions.BasePermission):
    """
    Permissions pour l'historique des états.
    """
    
    def has_permission(self, request, view):
        """Vérifier les permissions générales."""
        if not request.user.is_authenticated:
            return False
        
        # Récupérer le projet depuis l'URL
        projet_pk = view.kwargs.get('projet_pk')
        if not projet_pk:
            return False
        
        try:
            projet = Projet.objects.get(pk=projet_pk)
        except Projet.DoesNotExist:
            return False
        
        # Vérifier les permissions sur le projet
        if request.user.is_superuser or projet.proprietaire == request.user:
            return True
        
        # Vérifier la permission de voir l'historique
        return PermissionProjet.objects.filter(
            projet=projet,
            utilisateur=request.user,
            permission='voir_historique',
            active=True
        ).exists()


class PermissionProjetPermissions(permissions.BasePermission):
    """
    Permissions pour la gestion des permissions de projet.
    """
    
    def has_permission(self, request, view):
        """Vérifier les permissions générales."""
        if not request.user.is_authenticated:
            return False
        
        # Récupérer le projet depuis l'URL
        projet_pk = view.kwargs.get('projet_pk')
        if not projet_pk:
            return False
        
        try:
            projet = Projet.objects.get(pk=projet_pk)
        except Projet.DoesNotExist:
            return False
        
        # Vérifier les permissions sur le projet
        if request.user.is_superuser or projet.proprietaire == request.user:
            return True
        
        # Vérifier la permission de gestion des permissions
        return PermissionProjet.objects.filter(
            projet=projet,
            utilisateur=request.user,
            permission='gerer_permissions',
            active=True
        ).exists()
    
    def has_object_permission(self, request, view, obj):
        """Vérifier les permissions sur une permission spécifique."""
        if request.user.is_superuser:
            return True
        
        projet = obj.projet
        
        # Le propriétaire du projet peut tout faire
        if projet.proprietaire == request.user:
            return True
        
        # Vérifier la permission de gestion des permissions
        return PermissionProjet.objects.filter(
            projet=projet,
            utilisateur=request.user,
            permission='gerer_permissions',
            active=True
        ).exists()
