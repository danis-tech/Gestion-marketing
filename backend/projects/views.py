from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.http import Http404
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
    queryset = Projet.objects.all().select_related('proprietaire').prefetch_related('phases_etat__phase')
    
    def get_queryset(self):
        """Filtrer les projets selon les permissions de l'utilisateur."""
        user = self.request.user
        
        # Les superusers voient tous les projets
        if user.is_superuser:
            return super().get_queryset().prefetch_related('phases_etat__phase')
        
        # Les utilisateurs normaux voient leurs projets et ceux où ils ont des permissions
        return Projet.objects.filter(
            Q(proprietaire=user) |
            Q(permissions_utilisateurs__utilisateur=user, permissions_utilisateurs__active=True)
        ).distinct().select_related('proprietaire').prefetch_related('phases_etat__phase')
    
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
    
    def destroy(self, request, *args, **kwargs):
        """Supprimer un projet et tous ses éléments associés."""
        instance = self.get_object()
        projet_id = instance.id
        projet_nom = instance.nom
        
        import os
        
        # Utiliser une transaction pour garantir la cohérence
        with transaction.atomic():
            # 0. DÉSACTIVER TEMPORAIREMENT LES SIGNALS qui créent des notifications
            #    pour éviter qu'ils ne créent de nouvelles notifications pendant la suppression
            from django.db.models.signals import post_delete, post_save
            from notifications.signals import (
                notify_project_deletion, notify_task_deletion, notify_document_deletion,
                notify_project_changes, notify_task_changes, notify_document_changes,
                notify_uploaded_document_changes
            )
            from projects.models import Projet, Tache
            from documents.models import DocumentProjet, DocumentTeleverse
            
            # Désactiver les signaux
            post_delete.disconnect(notify_project_deletion, sender=Projet)
            post_delete.disconnect(notify_task_deletion, sender=Tache)
            post_delete.disconnect(notify_document_deletion, sender=DocumentProjet)
            post_save.disconnect(notify_project_changes, sender=Projet)
            post_save.disconnect(notify_task_changes, sender=Tache)
            post_save.disconnect(notify_document_changes, sender=DocumentProjet)
            post_save.disconnect(notify_uploaded_document_changes, sender=DocumentTeleverse)
            
            try:
                # 0.5. Créer la notification de suppression AVANT de supprimer le projet
                #    (on doit le faire avant car après le projet n'existera plus)
                from notifications.services import NotificationService
                from notifications.models import NotificationType
                
                # Récupérer le type de notification
                try:
                    type_notif = NotificationType.objects.get(code='projet_supprime')
                    # Créer la notification directement pour avoir son ID
                    notification_suppression = NotificationService.create_general_notification(
                        type_code='projet_supprime',
                        titre=f'Projet supprimé: {projet_nom}',
                        message=f'Le projet "{projet_nom}" a été supprimé par {request.user.prenom} {request.user.nom}',
                        projet=instance,  # Lier au projet avant suppression
                        priorite='elevee'
                    )
                    notification_suppression_id = notification_suppression.id if notification_suppression else None
                except Exception:
                    notification_suppression_id = None
                
                # 1. Supprimer TOUTES les notifications liées au projet via SQL brut
                #    (cela évite les problèmes de contraintes et de signaux)
                #    MAIS on garde la notification de suppression qu'on vient de créer
                from django.db import connection
                from projects.models import Tache, Etape
                
                # Récupérer toutes les tâches et étapes du projet
                taches_ids = list(Tache.objects.filter(projet_id=projet_id).values_list('id', flat=True))
                etapes_ids = list(Etape.objects.filter(phase_etat__projet_id=projet_id).values_list('id', flat=True))
                
                with connection.cursor() as cursor:
                    # Supprimer les notifications liées directement au projet
                    # SAUF la notification de suppression qu'on vient de créer
                    if notification_suppression_id:
                        cursor.execute(
                            "DELETE FROM notifications WHERE projet_id = %s AND id != %s",
                            [projet_id, notification_suppression_id]
                        )
                    else:
                        cursor.execute("DELETE FROM notifications WHERE projet_id = %s", [projet_id])
                    deleted_projet = cursor.rowcount
                    
                    # Supprimer les notifications liées aux tâches
                    deleted_taches = 0
                    if taches_ids:
                        placeholders = ','.join(['%s'] * len(taches_ids))
                        cursor.execute(f"DELETE FROM notifications WHERE tache_id IN ({placeholders})", taches_ids)
                        deleted_taches = cursor.rowcount
                    
                    # Supprimer les notifications liées aux étapes
                    deleted_etapes = 0
                    if etapes_ids:
                        placeholders = ','.join(['%s'] * len(etapes_ids))
                        cursor.execute(f"DELETE FROM notifications WHERE etape_id IN ({placeholders})", etapes_ids)
                        deleted_etapes = cursor.rowcount
                
                # 2. Supprimer les documents et leurs fichiers physiques
                try:
                    from documents.models import DocumentProjet, DocumentTeleverse
                    
                    # Supprimer les fichiers physiques des documents de projet
                    documents = DocumentProjet.objects.filter(projet_id=projet_id)
                    files_deleted = 0
                    files_locked = 0
                    for doc in documents:
                        if doc.chemin_fichier and os.path.exists(doc.chemin_fichier):
                            try:
                                os.remove(doc.chemin_fichier)
                                files_deleted += 1
                            except PermissionError:
                                # Fichier verrouillé (probablement ouvert dans un autre programme)
                                files_locked += 1
                            except Exception:
                                pass
                    
                    # Supprimer les fichiers physiques des documents téléversés
                    documents_televerses = DocumentTeleverse.objects.filter(projet_id=projet_id)
                    for doc in documents_televerses:
                        if doc.chemin_fichier and os.path.exists(doc.chemin_fichier):
                            try:
                                os.remove(doc.chemin_fichier)
                                files_deleted += 1
                            except PermissionError:
                                # Fichier verrouillé (probablement ouvert dans un autre programme)
                                files_locked += 1
                            except Exception:
                                pass
                    
                    # Les documents seront supprimés automatiquement par CASCADE
                except Exception:
                    pass
                
                # 3. Supprimer le projet (cascade supprimera automatiquement):
                #    - MembreProjet (membres)
                #    - HistoriqueEtat (historiques)
                #    - PermissionProjet (permissions)
                #    - Tache (tâches)
                #    - ProjetPhaseEtat (phases) -> Etape (étapes)
                #    - DocumentProjet (documents) -> CommentaireDocumentProjet (commentaires)
                #    - DocumentTeleverse (documents téléversés)
                instance.delete()
                
            except Exception:
                raise
            finally:
                # TOUJOURS réactiver les signaux, même en cas d'erreur
                try:
                    post_delete.connect(notify_project_deletion, sender=Projet)
                    post_delete.connect(notify_task_deletion, sender=Tache)
                    post_delete.connect(notify_document_deletion, sender=DocumentProjet)
                    post_save.connect(notify_project_changes, sender=Projet)
                    post_save.connect(notify_task_changes, sender=Tache)
                    post_save.connect(notify_document_changes, sender=DocumentProjet)
                    post_save.connect(notify_uploaded_document_changes, sender=DocumentTeleverse)
                except Exception:
                    pass
        
        return Response({
            'message': f'Projet "{projet_nom}" supprimé avec succès',
            'id': projet_id
        }, status=status.HTTP_200_OK)
    
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
    queryset = Tache.objects.all().select_related('projet', 'tache_dependante').prefetch_related('assigne_a')
    
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
            'projet', 'tache_dependante'
        ).prefetch_related('assigne_a')
    
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
        # Log pour déboguer
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Données reçues pour création de tâche: {request.data}")
        logger.info(f"Type de phase reçu: {type(request.data.get('phase'))}, valeur: {request.data.get('phase')}")
        try:
            response = super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Erreur lors de la création de la tâche: {str(e)}")
            logger.error(f"Type d'erreur: {type(e).__name__}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
        
        # Envoyer une notification si la tâche est assignée
        if response.status_code == 201 and NotificationService:
            # Récupérer l'ID de la tâche créée depuis la réponse
            tache_id = response.data.get('id')
            if tache_id:
                try:
                    tache = Tache.objects.prefetch_related('assigne_a').get(id=tache_id)
                    assignes = tache.assigne_a.all()
                    # Envoyer une notification à chaque utilisateur assigné
                    for assigne in assignes:
                        NotificationService.notify_task_assigned(tache, assigne)
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
        """Filtrer par projet avec toutes les relations nécessaires."""
        projet_id = self.kwargs.get('projet_pk')
        return ProjetPhaseEtat.objects.filter(
            projet_id=projet_id
        ).select_related(
            'phase', 'projet'
        ).prefetch_related(
            'etapes__responsable', 'etapes__cree_par'
        ).order_by('phase__ordre')
    
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


class ProjetCompletionViewSet(viewsets.ViewSet):
    """
    ViewSet pour la gestion de la completion des projets.
    
    Endpoints disponibles :
    - POST /api/projects/{projet_id}/marquer-termine/ - Marquer le projet comme terminé
    - POST /api/projects/{projet_id}/marquer-non-termine/ - Marquer le projet comme non terminé
    - GET /api/projects/{projet_id}/peut-etre-termine/ - Vérifier si le projet peut être terminé
    """
    permission_classes = [IsAuthenticated]
    
    def get_projet(self, projet_pk):
        """Récupérer le projet."""
        try:
            return Projet.objects.get(pk=projet_pk)
        except Projet.DoesNotExist:
            raise Http404("Projet non trouvé")
    
    @action(detail=False, methods=['post'], url_path='marquer-termine')
    def marquer_termine(self, request, projet_pk=None):
        """Marquer le projet comme terminé."""
        projet = self.get_projet(projet_pk)
        
        if not projet.peut_etre_termine():
            phases_non_terminees = projet.phases_etat.exclude(
                terminee=True
            ).exclude(
                ignoree=True
            )
            phases_noms = [p.phase.nom for p in phases_non_terminees]
            
            return Response({
                'error': 'Impossible de terminer le projet',
                'message': f'Toutes les phases doivent être terminées ou ignorées avant de terminer le projet. Phases non terminées : {", ".join(phases_noms)}',
                'phases_non_terminees': phases_noms
            }, status=400)
        
        projet.marquer_termine()
        
        return Response({
            'message': f'Projet "{projet.nom}" marqué comme terminé avec succès',
            'projet': ProjetSerializer(projet).data
        })
    
    @action(detail=False, methods=['post'], url_path='marquer-non-termine')
    def marquer_non_termine(self, request, projet_pk=None):
        """Marquer le projet comme non terminé."""
        projet = self.get_projet(projet_pk)
        
        projet.marquer_non_termine()
        
        return Response({
            'message': f'Projet "{projet.nom}" marqué comme non terminé avec succès',
            'projet': ProjetSerializer(projet).data
        })
    
    @action(detail=False, methods=['get'], url_path='peut-etre-termine')
    def peut_etre_termine(self, request, projet_pk=None):
        """Vérifier si le projet peut être terminé."""
        projet = self.get_projet(projet_pk)
        
        peut_etre_termine = projet.peut_etre_termine()
        
        phases_non_terminees = []
        if not peut_etre_termine:
            phases_non_terminees = [
                {
                    'id': p.id,
                    'nom': p.phase.nom,
                    'terminee': p.terminee,
                    'ignoree': p.ignoree
                }
                for p in projet.phases_etat.exclude(terminee=True).exclude(ignoree=True)
            ]
        
        return Response({
            'peut_etre_termine': peut_etre_termine,
            'phases_non_terminees': phases_non_terminees,
            'projet': {
                'id': projet.id,
                'nom': projet.nom,
                'statut': projet.statut,
                'est_termine': projet.est_termine
            }
        })
