from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from datetime import datetime, timedelta

from .models import Projet, MembreProjet, HistoriqueEtat, PermissionProjet, Tache
from .serializers import (
    ProjetListSerializer, ProjetDetailSerializer, ProjetCreateUpdateSerializer,
    ProjetStatutUpdateSerializer, ProjetStatsSerializer,
    MembreProjetSerializer, MembreProjetCreateSerializer,
    HistoriqueEtatSerializer, PermissionProjetSerializer, PermissionProjetCreateSerializer,
    PermissionProjetUpdateSerializer, UtilisateurPermissionsSerializer,
    TacheListSerializer, TacheDetailSerializer, TacheCreateUpdateSerializer, TacheStatutUpdateSerializer
)
from .permissions import (
    ProjetPermissions, MembreProjetPermissions, HistoriqueEtatPermissions,
    PermissionProjetPermissions
)


class ProjetViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des projets.
    
    Endpoints disponibles :
    - GET /api/projects/ - Liste des projets
    - POST /api/projects/ - Créer un projet
    - GET /api/projects/{id}/ - Détails d'un projet
    - PUT /api/projects/{id}/ - Modifier un projet
    - DELETE /api/projects/{id}/ - Supprimer un projet
    - PATCH /api/projects/{id}/update_statut/ - Mettre à jour le statut
    - GET /api/projects/stats/ - Statistiques des projets
    """
    permission_classes = [ProjetPermissions]
    queryset = Projet.objects.all().select_related('proprietaire')
    
    def get_queryset(self):
        """Filtrer les projets selon les permissions de l'utilisateur."""
        user = self.request.user
        
        # Les superusers voient tous les projets
        if user.is_superuser:
            return super().get_queryset()
        
        # Les utilisateurs normaux voient leurs projets et ceux où ils ont des permissions
        return Projet.objects.filter(
            Q(proprietaire=user) |
            Q(permissions_utilisateurs__utilisateur=user, permissions_utilisateurs__active=True)
        ).distinct().select_related('proprietaire')
    
    def get_serializer_class(self):
        """Choisir le bon sérialiseur selon l'action."""
        if self.action == 'list':
            return ProjetListSerializer
        elif self.action == 'retrieve':
            return ProjetDetailSerializer
        elif self.action == 'create' or self.action == 'update' or self.action == 'partial_update':
            return ProjetCreateUpdateSerializer
        elif self.action == 'update_statut':
            return ProjetStatutUpdateSerializer
        elif self.action == 'stats':
            return ProjetStatsSerializer
        return ProjetListSerializer
    
    @action(detail=True, methods=['patch'])
    def update_statut(self, request, pk=None):
        """Mettre à jour le statut d'un projet avec historique."""
        projet = self.get_object()
        serializer = self.get_serializer(projet, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        projet = serializer.save()
        
        return Response({
            'message': f'Statut mis à jour de {serializer.ancien_statut} vers {projet.statut}',
            'projet': ProjetDetailSerializer(projet).data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Obtenir les statistiques des projets."""
        queryset = self.get_queryset()
        
        # Statistiques générales
        total_projets = queryset.count()
        
        # Par statut
        projets_par_statut = dict(queryset.values('statut').annotate(
            count=Count('id')
        ).values_list('statut', 'count'))
        
        # Par priorité
        projets_par_priorite = dict(queryset.values('priorite').annotate(
            count=Count('id')
        ).values_list('priorite', 'count'))
        
        # Par type
        types_projets = dict(queryset.values('type').annotate(
            count=Count('id')
        ).values_list('type', 'count'))
        
        data = {
            'total_projets': total_projets,
            'projets_par_statut': projets_par_statut,
            'projets_par_priorite': projets_par_priorite,
            'types_projets': types_projets,
        }
        
        serializer = self.get_serializer(data)
        return Response(serializer.data)


class MembreProjetViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des membres de projet.
    
    Endpoints disponibles :
    - GET /api/projects/{projet_id}/membres/ - Liste des membres
    - POST /api/projects/{projet_id}/membres/ - Ajouter un membre
    - GET /api/projects/{projet_id}/membres/{id}/ - Détails d'un membre
    - PUT /api/projects/{projet_id}/membres/{id}/ - Modifier un membre
    - DELETE /api/projects/{projet_id}/membres/{id}/ - Supprimer un membre
    """
    permission_classes = [MembreProjetPermissions]
    serializer_class = MembreProjetSerializer
    
    def get_queryset(self):
        """Filtrer par projet."""
        projet_id = self.kwargs.get('projet_pk')
        return MembreProjet.objects.filter(projet_id=projet_id).select_related('utilisateur', 'service')
    
    def get_serializer_class(self):
        """Choisir le bon sérialiseur."""
        if self.action == 'create':
            return MembreProjetCreateSerializer
        return MembreProjetSerializer
    
    def create(self, request, *args, **kwargs):
        """Créer un nouveau membre de projet."""
        return super().create(request, *args, **kwargs)
    
    def get_serializer_context(self):
        """Ajouter le projet au contexte du sérialiseur."""
        context = super().get_serializer_context()
        projet_id = self.kwargs.get('projet_pk')
        
        if projet_id:
            try:
                projet = Projet.objects.get(pk=projet_id)
                context['projet'] = projet
            except Projet.DoesNotExist:
                pass
        
        return context


class HistoriqueEtatViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet en lecture seule pour l'historique des états.
    
    Endpoints disponibles :
    - GET /api/projects/{projet_id}/historiques/ - Liste de l'historique
    - GET /api/projects/{projet_id}/historiques/{id}/ - Détails d'un historique
    """
    permission_classes = [HistoriqueEtatPermissions]
    serializer_class = HistoriqueEtatSerializer
    
    def get_queryset(self):
        """Filtrer par projet."""
        projet_id = self.kwargs.get('projet_pk')
        return HistoriqueEtat.objects.filter(projet_id=projet_id).select_related('par_utilisateur')


class PermissionProjetViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des permissions de projet.
    
    Endpoints disponibles :
    - GET /api/projects/{projet_id}/permissions/ - Liste des permissions
    - POST /api/projects/{projet_id}/permissions/ - Accorder une permission
    - PUT /api/projects/{projet_id}/permissions/{id}/ - Modifier une permission
    - DELETE /api/projects/{projet_id}/permissions/{id}/ - Révoquer une permission
    """
    permission_classes = [PermissionProjetPermissions]
    serializer_class = PermissionProjetSerializer
    
    def get_queryset(self):
        """Filtrer par projet."""
        projet_id = self.kwargs.get('projet_pk')
        return PermissionProjet.objects.filter(projet_id=projet_id).select_related('utilisateur', 'accordee_par')
    
    def get_serializer_class(self):
        """Choisir le bon sérialiseur."""
        if self.action == 'create':
            return PermissionProjetCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PermissionProjetUpdateSerializer
        return PermissionProjetSerializer
    
    def get_serializer_context(self):
        """Ajouter le projet au contexte du sérialiseur."""
        context = super().get_serializer_context()
        projet_id = self.kwargs.get('projet_pk')
        if projet_id:
            try:
                context['projet'] = Projet.objects.get(pk=projet_id)
            except Projet.DoesNotExist:
                pass
        return context
    
    @action(detail=False, methods=['get'])
    def utilisateur_permissions(self, request, projet_pk=None):
        """Obtenir les permissions d'un utilisateur spécifique sur le projet."""
        utilisateur_id = request.query_params.get('utilisateur')
        
        if not utilisateur_id:
            return Response(
                {'error': 'Paramètre utilisateur requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from accounts.models import User
            utilisateur = User.objects.get(pk=utilisateur_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Utilisateur non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        permissions = PermissionProjet.objects.filter(
            projet_id=projet_pk,
            utilisateur=utilisateur,
            active=True
        )
        
        permissions_list = [p.permission for p in permissions]
        
        data = {
            'utilisateur': utilisateur,
            'permissions': permissions_list,
            'permissions_details': permissions
        }
        
        serializer = UtilisateurPermissionsSerializer(data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def accorder_multiple(self, request, projet_pk=None):
        """Accorder plusieurs permissions à un utilisateur."""
        utilisateur_id = request.data.get('utilisateur')
        permissions = request.data.get('permissions', [])
        
        if not utilisateur_id or not permissions:
            return Response(
                {'error': 'Utilisateur et permissions requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from accounts.models import User
            utilisateur = User.objects.get(pk=utilisateur_id)
            projet = Projet.objects.get(pk=projet_pk)
        except (User.DoesNotExist, Projet.DoesNotExist):
            return Response(
                {'error': 'Utilisateur ou projet non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        permissions_crees = []
        for permission_code in permissions:
            permission, created = PermissionProjet.objects.get_or_create(
                projet=projet,
                utilisateur=utilisateur,
                permission=permission_code,
                defaults={
                    'accordee_par': request.user,
                    'active': True
                }
            )
            if created:
                permissions_crees.append(permission)
        
        return Response({
            'message': f'{len(permissions_crees)} permissions accordées',
            'permissions_crees': PermissionProjetSerializer(permissions_crees, many=True).data
        })


class TacheViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des tâches.
    
    Endpoints disponibles :
    - GET /api/taches/ - Liste des tâches
    - POST /api/taches/ - Créer une tâche
    - GET /api/taches/{id}/ - Détails d'une tâche
    - PUT /api/taches/{id}/ - Modifier une tâche
    - DELETE /api/taches/{id}/ - Supprimer une tâche
    - PATCH /api/taches/{id}/update_statut/ - Mettre à jour le statut
    - GET /api/taches/projet/{projet_id}/ - Tâches d'un projet
    - GET /api/taches/mes_taches/ - Tâches assignées à l'utilisateur
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = Tache.objects.all().select_related('projet', 'assigne_a', 'tache_dependante')
    
    def get_queryset(self):
        """Filtrer les tâches selon les permissions de l'utilisateur."""
        user = self.request.user
        
        # Les superusers voient toutes les tâches
        if user.is_superuser:
            return super().get_queryset()
        
        # Les utilisateurs normaux voient les tâches des projets où ils ont des permissions
        projets_accessibles = Projet.objects.filter(
            Q(proprietaire=user) |
            Q(permissions_utilisateurs__utilisateur=user, permissions_utilisateurs__active=True)
        ).distinct()
        
        return Tache.objects.filter(projet__in=projets_accessibles).select_related(
            'projet', 'assigne_a', 'tache_dependante'
        )
    
    def get_serializer_class(self):
        """Choisir le bon sérialiseur selon l'action."""
        if self.action == 'list':
            return TacheListSerializer
        elif self.action == 'retrieve':
            return TacheDetailSerializer
        elif self.action == 'create' or self.action == 'update' or self.action == 'partial_update':
            return TacheCreateUpdateSerializer
        elif self.action == 'update_statut':
            return TacheStatutUpdateSerializer
        return TacheListSerializer
    
    @action(detail=True, methods=['patch'])
    def update_statut(self, request, pk=None):
        """Mettre à jour le statut d'une tâche."""
        tache = self.get_object()
        ancien_statut = tache.statut
        serializer = self.get_serializer(tache, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        tache = serializer.save()
        
        return Response({
            'message': f'Statut mis à jour de {ancien_statut} vers {tache.statut}',
            'tache': TacheDetailSerializer(tache).data
        })
    
    @action(detail=False, methods=['get'])
    def projet_taches(self, request):
        """Obtenir toutes les tâches d'un projet spécifique."""
        projet_id = request.query_params.get('projet_id')
        if not projet_id:
            return Response(
                {'error': 'Le paramètre projet_id est requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            taches = self.get_queryset().filter(projet_id=projet_id)
            serializer = TacheListSerializer(taches, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la récupération des tâches: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def mes_taches(self, request):
        """Obtenir les tâches assignées à l'utilisateur connecté."""
        user = request.user
        taches = self.get_queryset().filter(assigne_a=user)
        
        # Filtres optionnels
        statut = request.query_params.get('statut')
        if statut:
            taches = taches.filter(statut=statut)
        
        priorite = request.query_params.get('priorite')
        if priorite:
            taches = taches.filter(priorite=priorite)
        
        phase = request.query_params.get('phase')
        if phase:
            taches = taches.filter(phase=phase)
        
        serializer = TacheListSerializer(taches, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def en_retard(self, request):
        """Obtenir les tâches en retard."""
        taches = self.get_queryset().filter(
            Q(fin__lt=timezone.now().date()) & 
            ~Q(statut='termine')
        )
        serializer = TacheListSerializer(taches, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Obtenir les statistiques des tâches."""
        queryset = self.get_queryset()
        
        # Statistiques générales
        total_taches = queryset.count()
        taches_terminees = queryset.filter(statut='termine').count()
        taches_en_retard = queryset.filter(
            Q(fin__lt=timezone.now().date()) & 
            ~Q(statut='termine')
        ).count()
        
        # Par statut
        taches_par_statut = dict(queryset.values('statut').annotate(
            count=Count('id')
        ).values_list('statut', 'count'))
        
        # Par priorité
        taches_par_priorite = dict(queryset.values('priorite').annotate(
            count=Count('id')
        ).values_list('priorite', 'count'))
        
        # Par phase
        taches_par_phase = dict(queryset.values('phase').annotate(
            count=Count('id')
        ).values_list('phase', 'count'))
        
        return Response({
            'total_taches': total_taches,
            'taches_terminees': taches_terminees,
            'taches_en_retard': taches_en_retard,
            'taux_completion': (taches_terminees / total_taches * 100) if total_taches > 0 else 0,
            'par_statut': taches_par_statut,
            'par_priorite': taches_par_priorite,
            'par_phase': taches_par_phase,
        })
