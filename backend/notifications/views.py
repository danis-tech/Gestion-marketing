from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta

from .models import Notification, NotificationType, ChatMessage, NotificationPreference
from .serializers import (
    NotificationSerializer, NotificationListSerializer, NotificationCreateSerializer,
    NotificationTypeSerializer, ChatMessageSerializer, ChatMessageCreateSerializer,
    NotificationPreferenceSerializer, NotificationPreferenceUpdateSerializer,
    NotificationStatsSerializer, NotificationMarkReadSerializer, NotificationArchiveSerializer
)
from .services import NotificationService, ChatService

User = get_user_model()


class NotificationTypeListView(generics.ListAPIView):
    """
    Liste des types de notifications
    """
    queryset = NotificationType.objects.all()
    serializer_class = NotificationTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


class NotificationListView(generics.ListAPIView):
    """
    Liste des notifications pour l'utilisateur connecté
    """
    serializer_class = NotificationListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        notification_type = self.request.query_params.get('type', 'all')
        
        queryset = Notification.objects.select_related(
            'type_notification', 'projet', 'tache', 'service'
        )
        
        # Si l'utilisateur est super admin, il peut voir toutes les notifications
        if user.is_superuser:
            if notification_type == 'general':
                # Notifications générales (pour tous)
                queryset = queryset.filter(destinataire__isnull=True)
            elif notification_type == 'personal':
                # Toutes les notifications personnelles (tous les destinataires)
                queryset = queryset.filter(destinataire__isnull=False)
            else:  # 'all'
                # Toutes les notifications (générales + personnelles)
                pass  # Pas de filtre, on garde tout
        else:
            # Utilisateur normal : seulement ses notifications
            if notification_type == 'general':
                # Notifications générales (pour tous)
                queryset = queryset.filter(destinataire__isnull=True)
            elif notification_type == 'personal':
                # Notifications personnelles de l'utilisateur
                queryset = queryset.filter(destinataire=user)
            else:  # 'all'
                # Toutes les notifications (personnelles + générales)
                queryset = queryset.filter(
                    Q(destinataire=user) | Q(destinataire__isnull=True)
                )
        
        # Filtrer par statut
        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut)
        
        # Filtrer par priorité
        priorite = self.request.query_params.get('priorite')
        if priorite:
            queryset = queryset.filter(priorite=priorite)
        
        # Limiter les notifications générales aux 30 derniers jours (plus généreux)
        if notification_type in ['general', 'all']:
            cutoff_date = timezone.now() - timedelta(days=30)
            queryset = queryset.filter(
                Q(destinataire=user) | Q(cree_le__gte=cutoff_date)
            )
        
        return queryset.order_by('-cree_le')


class NotificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Détail d'une notification
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Notification.objects.filter(
            Q(destinataire=user) | Q(destinataire__isnull=True)
        ).select_related('type_notification', 'projet', 'tache', 'service')
    
    def retrieve(self, request, *args, **kwargs):
        """Récupérer une notification et la marquer comme lue"""
        instance = self.get_object()
        
        # Marquer comme lue si c'est une notification personnelle
        if instance.destinataire == request.user and instance.statut == 'non_lue':
            instance.marquer_comme_lue()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Supprimer une notification (Super Admin uniquement)"""
        if not request.user.is_superuser:
            return Response(
                {'error': 'Seuls les super administrateurs peuvent supprimer des notifications'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().destroy(request, *args, **kwargs)


class NotificationCreateView(generics.CreateAPIView):
    """
    Créer une notification (admin seulement)
    """
    serializer_class = NotificationCreateSerializer
    permission_classes = [permissions.IsAdminUser]


class NotificationStatsView(APIView):
    """
    Statistiques des notifications pour l'utilisateur connecté
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        stats = NotificationService.get_notification_stats(request.user)
        
        # Ajouter les notifications récentes
        recent_notifications = NotificationService.get_user_notifications(
            request.user, limit=5
        )
        
        stats['notifications_recentes'] = recent_notifications
        
        serializer = NotificationStatsSerializer(stats)
        return Response(serializer.data)


class NotificationMarkReadView(APIView):
    """
    Marquer des notifications comme lues
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = NotificationMarkReadSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            notification_ids = serializer.validated_data.get('notification_ids', [])
            marquer_toutes = serializer.validated_data.get('marquer_toutes', False)
            
            if marquer_toutes:
                # Marquer toutes les notifications non lues
                updated_count = NotificationService.mark_notifications_read(user)
            else:
                # Marquer les notifications spécifiées
                updated_count = NotificationService.mark_notifications_read(
                    user, notification_ids
                )
            
            return Response({
                'message': f'{updated_count} notification(s) marquée(s) comme lue(s)',
                'updated_count': updated_count
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NotificationArchiveView(APIView):
    """
    Archiver des notifications
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = NotificationArchiveSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            notification_ids = serializer.validated_data.get('notification_ids', [])
            archiver_toutes = serializer.validated_data.get('archiver_toutes', False)
            
            if archiver_toutes:
                # Archiver toutes les notifications
                updated_count = NotificationService.archive_notifications(user)
            else:
                # Archiver les notifications spécifiées
                updated_count = NotificationService.archive_notifications(
                    user, notification_ids
                )
            
            return Response({
                'message': f'{updated_count} notification(s) archivée(s)',
                'updated_count': updated_count
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NotificationDeleteBulkView(APIView):
    """
    Supprimer des notifications en masse (Super Admin uniquement)
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # Vérifier que l'utilisateur est super admin
        if not request.user.is_superuser:
            return Response(
                {'error': 'Seuls les super administrateurs peuvent supprimer des notifications'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = NotificationArchiveSerializer(data=request.data)
        if serializer.is_valid():
            notification_ids = serializer.validated_data.get('notification_ids', [])
            
            if not notification_ids:
                return Response(
                    {'error': 'Aucune notification spécifiée pour la suppression'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Supprimer les notifications spécifiées
            deleted_count = Notification.objects.filter(
                id__in=notification_ids
            ).delete()[0]
            
            return Response({
                'message': f'{deleted_count} notification(s) supprimée(s)',
                'deleted_count': deleted_count
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Vues pour le chat
class ChatMessageListView(generics.ListCreateAPIView):
    """
    Liste et création des messages de chat
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ChatMessageCreateSerializer
        return ChatMessageSerializer
    
    def get_queryset(self):
        return ChatService.get_recent_messages(limit=100)
    
    def perform_create(self, serializer):
        serializer.save(expediteur=self.request.user)


class ChatMessageDetailView(generics.RetrieveDestroyAPIView):
    """
    Détail et suppression d'un message de chat
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChatMessageSerializer
    
    def get_queryset(self):
        return ChatService.get_recent_messages(limit=1000)
    
    def destroy(self, request, *args, **kwargs):
        """
        Supprimer un message (seulement pour les super utilisateurs)
        """
        if not request.user.is_superuser:
            return Response(
                {'error': 'Seuls les super utilisateurs peuvent supprimer des messages'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        message = self.get_object()
        message_id = message.id
        message.delete()
        
        # Notifier la suppression via WebSocket
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'chat_general',
            {
                'type': 'message_deleted',
                'message_id': message_id
            }
        )
        
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChatOnlineUsersView(APIView):
    """
    Liste des utilisateurs en ligne
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        online_users = ChatService.get_online_users()
        
        users_data = []
        for user in online_users:
            users_data.append({
                'id': user.id,
                'username': user.username,
                'prenom': user.prenom,
                'nom': user.nom,
                'service': user.service.nom if user.service else None,
                'last_login': user.last_login.isoformat() if user.last_login else None
            })
        
        return Response({
            'online_users': users_data,
            'count': len(users_data)
        })


# Vues pour les préférences
class NotificationPreferenceView(generics.RetrieveUpdateAPIView):
    """
    Préférences de notification de l'utilisateur connecté
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return NotificationPreferenceSerializer
        return NotificationPreferenceUpdateSerializer
    
    def get_object(self):
        preference, created = NotificationPreference.objects.get_or_create(
            utilisateur=self.request.user
        )
        return preference


# Vues utilitaires
@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def create_general_notification(request):
    """
    Créer une notification générale (admin seulement)
    """
    type_code = request.data.get('type_code')
    titre = request.data.get('titre')
    message = request.data.get('message')
    priorite = request.data.get('priorite', 'normale')
    
    if not all([type_code, titre, message]):
        return Response({
            'error': 'type_code, titre et message sont requis'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    notification = NotificationService.create_general_notification(
        type_code=type_code,
        titre=titre,
        message=message,
        priorite=priorite,
        description_detaillee=request.data.get('description_detaillee', ''),
        donnees_supplementaires=request.data.get('donnees_supplementaires', {})
    )
    
    if notification:
        serializer = NotificationSerializer(notification)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    else:
        return Response({
            'error': 'Erreur lors de la création de la notification'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def create_personal_notification(request):
    """
    Créer une notification personnelle (admin seulement)
    """
    type_code = request.data.get('type_code')
    titre = request.data.get('titre')
    message = request.data.get('message')
    destinataire_id = request.data.get('destinataire_id')
    priorite = request.data.get('priorite', 'normale')
    
    if not all([type_code, titre, message, destinataire_id]):
        return Response({
            'error': 'type_code, titre, message et destinataire_id sont requis'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        destinataire = User.objects.get(id=destinataire_id)
    except User.DoesNotExist:
        return Response({
            'error': 'Utilisateur destinataire non trouvé'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    notification = NotificationService.create_personal_notification(
        type_code=type_code,
        titre=titre,
        message=message,
        destinataire=destinataire,
        priorite=priorite,
        description_detaillee=request.data.get('description_detaillee', ''),
        donnees_supplementaires=request.data.get('donnees_supplementaires', {})
    )
    
    if notification:
        serializer = NotificationSerializer(notification)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    else:
        return Response({
            'error': 'Erreur lors de la création de la notification'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def cleanup_old_notifications(request):
    """
    Nettoyer les anciennes notifications (admin seulement)
    """
    days = request.data.get('days', 30)
    archived_count = NotificationService.cleanup_old_notifications(days)
    
    return Response({
        'message': f'{archived_count} notifications archivées',
        'archived_count': archived_count
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def notification_unread_count(request):
    """
    Nombre de notifications non lues
    """
    user = request.user
    count = Notification.objects.filter(
        destinataire=user,
        statut='non_lue'
    ).count()
    
    return Response({
        'unread_count': count
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_assigned_tasks(request):
    """
    Récupérer les tâches assignées à l'utilisateur connecté
    """
    from projects.models import Tache
    
    user = request.user
    
    # Récupérer les tâches assignées à l'utilisateur
    assigned_tasks = Tache.objects.filter(
        assigne_a=user,
        statut__in=['en_attente', 'en_cours']
    ).select_related('projet').prefetch_related('assigne_a')
    
    # Sérialiser les tâches
    tasks_data = []
    for task in assigned_tasks:
        tasks_data.append({
            'id': task.id,
            'titre': task.titre,
            'description': task.description,
            'statut': task.statut,
            'priorite': task.priorite,
            'debut': task.debut,
            'fin': task.fin,
            'projet': {
                'id': task.projet.id,
                'nom': task.projet.nom,
                'code': task.projet.code
            },
            'assigne_a': [
                {
                    'id': assigne.id,
                    'prenom': assigne.prenom,
                    'nom': assigne.nom
                }
                for assigne in task.assigne_a.all()
            ] if task.assigne_a.exists() else [],
            'cree_le': task.cree_le,
            'mise_a_jour_le': task.mise_a_jour_le
        })
    
    return Response({
        'assigned_tasks': tasks_data,
        'count': len(tasks_data)
    })