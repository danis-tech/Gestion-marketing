from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from django.core.exceptions import ValidationError
from datetime import datetime, timedelta

# Import du service de notifications
try:
    from notifications.services import NotificationService
except ImportError:
    NotificationService = None

from .models import Projet, MembreProjet, HistoriqueEtat, PermissionProjet, Tache, PhaseProjet, ProjetPhaseEtat, Etape
from .serializers import (
    ProjetListSerializer, ProjetDetailSerializer, ProjetDetailWithPhasesSerializer, ProjetCreateUpdateSerializer,
    ProjetStatutUpdateSerializer, ProjetStatsSerializer,
    MembreProjetSerializer, MembreProjetCreateSerializer,
    HistoriqueEtatSerializer, PermissionProjetSerializer, PermissionProjetCreateSerializer,
    PermissionProjetUpdateSerializer, UtilisateurPermissionsSerializer,
    TacheListSerializer, TacheDetailSerializer, TacheCreateUpdateSerializer, TacheStatutUpdateSerializer,
    PhaseProjetSerializer, ProjetPhaseEtatSerializer, ProjetPhaseEtatUpdateSerializer,
    EtapeSerializer, EtapeCreateSerializer, EtapeUpdateSerializer, ProjetPhaseEtatWithEtapesSerializer
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
            return ProjetDetailWithPhasesSerializer
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
        response = super().create(request, *args, **kwargs)
        
        # Envoyer une notification au nouveau membre
        if response.status_code == 201 and NotificationService:
            membre = MembreProjet.objects.get(id=response.data['id'])
            NotificationService.notify_team_member_added(membre.projet, membre.membre)
        
        return response
    
    def destroy(self, request, *args, **kwargs):
        """Supprimer un membre de projet et envoyer un email de notification."""
        instance = self.get_object()
        
        # Envoyer un email de notification pour la suppression du projet
        try:
            from accounts.email_service import TeamEmailService
            removed_by = request.user
            
            # Envoyer l'email de retrait
            TeamEmailService.send_team_removal_notification(
                instance.utilisateur,
                instance.service or instance.utilisateur.service,
                removed_by,
                project=instance.projet
            )
        except Exception as e:
            print(f"Erreur lors de l'envoi de l'email de retrait du projet : {str(e)}")
        
        return super().destroy(request, *args, **kwargs)
    
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
    
    def create(self, request, *args, **kwargs):
        """Créer une nouvelle tâche."""
        response = super().create(request, *args, **kwargs)
        
        # Envoyer une notification si la tâche est assignée
        if response.status_code == 201 and NotificationService:
            # Récupérer l'ID de la tâche créée depuis la réponse
            tache_id = response.data.get('id')
            if tache_id:
                try:
                    tache = Tache.objects.get(id=tache_id)
                    if tache.assigne_a:
                        NotificationService.notify_task_assigned(tache, tache.assigne_a)
                except Tache.DoesNotExist:
                    pass  # Ignorer si la tâche n'existe pas
        
        return response
    
    @action(detail=True, methods=['patch'])
    def update_statut(self, request, pk=None):
        """Mettre à jour le statut d'une tâche."""
        tache = self.get_object()
        ancien_statut = tache.statut
        serializer = self.get_serializer(tache, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        tache = serializer.save()
        
        # Envoyer une notification si la tâche est terminée
        if NotificationService and tache.statut == 'termine' and ancien_statut != 'termine':
            NotificationService.notify_task_completed(tache)
        
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


class PhaseProjetViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet en lecture seule pour les phases de projet.
    
    Endpoints disponibles :
    - GET /api/phases/ - Liste des phases standard
    - GET /api/phases/{id}/ - Détails d'une phase
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = PhaseProjet.objects.filter(active=True).order_by('ordre')
    serializer_class = PhaseProjetSerializer


class ProjetPhaseEtatViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des états des phases d'un projet.
    
    Endpoints disponibles :
    - GET /api/projects/{projet_id}/phases/ - Liste des phases du projet
    - PUT /api/projects/{projet_id}/phases/{id}/ - Modifier l'état d'une phase
    - PATCH /api/projects/{projet_id}/phases/{id}/ - Mettre à jour partiellement une phase
    - POST /api/projects/{projet_id}/phases/{id}/marquer-debut/ - Marquer le début d'une phase
    - POST /api/projects/{projet_id}/phases/{id}/marquer-fin/ - Marquer la fin d'une phase
    """
    permission_classes = [ProjetPermissions]
    serializer_class = ProjetPhaseEtatSerializer
    
    def get_queryset(self):
        """Filtrer par projet."""
        projet_id = self.kwargs.get('projet_pk')
        return ProjetPhaseEtat.objects.filter(projet_id=projet_id).select_related('phase')
    
    def get_serializer_class(self):
        """Choisir le bon sérialiseur."""
        if self.action in ['update', 'partial_update']:
            return ProjetPhaseEtatUpdateSerializer
        return ProjetPhaseEtatSerializer
    
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
    
    @action(detail=True, methods=['post'])
    def marquer_debut(self, request, projet_pk=None, pk=None):
        """Marquer le début d'une phase."""
        phase_etat = self.get_object()
        phase_etat.marquer_debut()
        
        return Response({
            'message': f'Phase "{phase_etat.phase.nom}" marquée comme débutée',
            'phase_etat': ProjetPhaseEtatSerializer(phase_etat).data
        })
    
    @action(detail=True, methods=['post'])
    def marquer_fin(self, request, projet_pk=None, pk=None):
        """Marquer la fin d'une phase."""
        phase_etat = self.get_object()
        
        # Log pour debug
        print(f"DEBUG: Tentative de termination de la phase {phase_etat.id} ({phase_etat.phase.nom})")
        print(f"DEBUG: État avant termination - terminee: {phase_etat.terminee}, date_fin: {phase_etat.date_fin}")
        
        try:
            phase_etat.marquer_fin()
            
            # Recharger l'objet depuis la base de données pour s'assurer d'avoir les données à jour
            phase_etat.refresh_from_db()
            print(f"DEBUG: État après termination - terminee: {phase_etat.terminee}, date_fin: {phase_etat.date_fin}")
            
            return Response({
                'message': f'Phase "{phase_etat.phase.nom}" marquée comme terminée',
                'phase_etat': ProjetPhaseEtatSerializer(phase_etat).data
            })
        except ValidationError as e:
            error_message = str(e)
            response_data = {
                'error': error_message,
                'message': 'Impossible de terminer cette phase'
            }
            
            # Ajouter les détails des étapes seulement si c'est le bon type d'erreur
            if "étapes ne sont pas terminées" in error_message:
                response_data['etapes_en_attente'] = EtapeSerializer(phase_etat.etapes_en_attente_ou_en_cours, many=True).data
            
            return Response(response_data, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def progression(self, request, projet_pk=None):
        """Obtenir la progression des phases du projet."""
        phases_etat = self.get_queryset()
        
        total_phases = phases_etat.count()
        phases_terminees = phases_etat.filter(terminee=True).count()
        phases_ignorees = phases_etat.filter(ignoree=True).count()
        phases_en_cours = phases_etat.filter(
            date_debut__isnull=False,
            terminee=False,
            ignoree=False
        ).count()
        
        progression_pourcentage = (phases_terminees / total_phases * 100) if total_phases > 0 else 0
        
        return Response({
            'total_phases': total_phases,
            'phases_terminees': phases_terminees,
            'phases_ignorees': phases_ignorees,
            'phases_en_cours': phases_en_cours,
            'progression_pourcentage': round(progression_pourcentage, 2),
            'phases_detail': ProjetPhaseEtatSerializer(phases_etat, many=True).data
        })


class EtapeViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des étapes d'une phase de projet.
    
    Endpoints disponibles :
    - GET /api/projects/{projet_id}/phases/{phase_id}/etapes/ - Liste des étapes d'une phase
    - POST /api/projects/{projet_id}/phases/{phase_id}/etapes/ - Créer une étape
    - GET /api/projects/{projet_id}/phases/{phase_id}/etapes/{id}/ - Détails d'une étape
    - PUT /api/projects/{projet_id}/phases/{phase_id}/etapes/{id}/ - Modifier une étape
    - PATCH /api/projects/{projet_id}/phases/{phase_id}/etapes/{id}/ - Mettre à jour partiellement une étape
    - DELETE /api/projects/{projet_id}/phases/{phase_id}/etapes/{id}/ - Supprimer une étape
    - POST /api/projects/{projet_id}/phases/{phase_id}/etapes/{id}/demarrer/ - Démarrer une étape
    - POST /api/projects/{projet_id}/phases/{phase_id}/etapes/{id}/terminer/ - Terminer une étape
    - POST /api/projects/{projet_id}/phases/{phase_id}/etapes/{id}/annuler/ - Annuler une étape
    """
    permission_classes = [ProjetPermissions]
    serializer_class = EtapeSerializer
    
    def get_queryset(self):
        """Filtrer par phase de projet."""
        projet_id = self.kwargs.get('projet_pk')
        phase_id = self.kwargs.get('phase_pk')
        return Etape.objects.filter(
            phase_etat__projet_id=projet_id,
            phase_etat_id=phase_id
        ).select_related('responsable', 'cree_par', 'phase_etat__phase')
    
    def get_serializer_class(self):
        """Choisir le bon sérialiseur."""
        if self.action == 'create':
            return EtapeCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return EtapeUpdateSerializer
        return EtapeSerializer
    
    def get_serializer_context(self):
        """Ajouter le contexte nécessaire au sérialiseur."""
        context = super().get_serializer_context()
        projet_id = self.kwargs.get('projet_pk')
        phase_id = self.kwargs.get('phase_pk')
        
        if projet_id and phase_id:
            try:
                context['projet'] = Projet.objects.get(pk=projet_id)
                context['phase_etat'] = ProjetPhaseEtat.objects.get(
                    projet_id=projet_id,
                    id=phase_id
                )
            except (Projet.DoesNotExist, ProjetPhaseEtat.DoesNotExist):
                pass
        
        return context
    
    def perform_create(self, serializer):
        """Créer une nouvelle étape."""
        phase_etat = self.get_serializer_context().get('phase_etat')
        if phase_etat:
            serializer.save(phase_etat=phase_etat)
    
    @action(detail=True, methods=['post'])
    def demarrer(self, request, projet_pk=None, phase_pk=None, pk=None):
        """Démarrer une étape."""
        etape = self.get_object()
        etape.demarrer()
        
        return Response({
            'message': f'Étape "{etape.nom}" démarrée avec succès',
            'etape': EtapeSerializer(etape).data
        })
    
    @action(detail=True, methods=['post'])
    def terminer(self, request, projet_pk=None, phase_pk=None, pk=None):
        """Terminer une étape."""
        etape = self.get_object()
        etape.terminer()
        
        return Response({
            'message': f'Étape "{etape.nom}" terminée avec succès',
            'etape': EtapeSerializer(etape).data
        })
    
    @action(detail=True, methods=['post'])
    def annuler(self, request, projet_pk=None, phase_pk=None, pk=None):
        """Annuler une étape."""
        etape = self.get_object()
        etape.annuler()
        
        return Response({
            'message': f'Étape "{etape.nom}" annulée avec succès',
            'etape': EtapeSerializer(etape).data
        })
    
    @action(detail=False, methods=['get'])
    def progression(self, request, projet_pk=None, phase_pk=None):
        """Obtenir la progression des étapes de la phase."""
        etapes = self.get_queryset()
        
        total_etapes = etapes.count()
        etapes_terminees = etapes.filter(statut='terminee').count()
        etapes_en_cours = etapes.filter(statut='en_cours').count()
        etapes_annulees = etapes.filter(statut='annulee').count()
        etapes_en_retard = etapes.filter(est_en_retard=True).count()
        
        progression_pourcentage = (etapes_terminees / total_etapes * 100) if total_etapes > 0 else 0
        
        return Response({
            'total_etapes': total_etapes,
            'etapes_terminees': etapes_terminees,
            'etapes_en_cours': etapes_en_cours,
            'etapes_annulees': etapes_annulees,
            'etapes_en_retard': etapes_en_retard,
            'progression_pourcentage': round(progression_pourcentage, 2),
            'etapes_detail': EtapeSerializer(etapes, many=True).data
        })
