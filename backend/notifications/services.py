from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Q, Count
from datetime import timedelta
import logging
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import Notification, NotificationType, ChatMessage, NotificationPreference
from projects.models import Projet, Tache, Etape, MembreProjet
from accounts.models import Service

User = get_user_model()
logger = logging.getLogger(__name__)


class NotificationService:
    """
    Service pour la gestion des notifications
    """
    
    @staticmethod
    def create_notification(
        type_code,
        titre,
        message,
        destinataire=None,
        projet=None,
        tache=None,
        etape=None,
        service=None,
        priorite='normale',
        description_detaillee='',
        donnees_supplementaires=None,
        expire_le=None,
        cree_par=None
    ):
        """
        Créer une notification et l'envoyer via WebSocket
        """
        try:
            # Récupérer le type de notification
            type_notification = NotificationType.objects.get(code=type_code)
            
            # Créer la notification
            notification = Notification.objects.create(
                type_notification=type_notification,
                destinataire=destinataire,
                titre=titre,
                message=message,
                description_detaillee=description_detaillee,
                priorite=priorite,
                projet=projet,
                tache=tache,
                etape=etape,
                service=service,
                donnees_supplementaires=donnees_supplementaires or {},
                expire_le=expire_le,
                cree_par=cree_par
            )
            
            logger.info(f"Notification créée: {notification.titre}")
            
            # Envoyer via WebSocket en temps réel
            NotificationService.send_websocket_notification(notification)
            
            return notification
            
        except NotificationType.DoesNotExist:
            logger.error(f"Type de notification non trouvé: {type_code}")
            return None
        except Exception as e:
            logger.error(f"Erreur lors de la création de la notification: {e}")
            return None
    
    @staticmethod
    def create_general_notification(
        type_code,
        titre,
        message,
        projet=None,
        tache=None,
        priorite='normale',
        description_detaillee='',
        donnees_supplementaires=None
    ):
        """
        Créer une notification générale (pour tous les utilisateurs)
        """
        return NotificationService.create_notification(
            type_code=type_code,
            titre=titre,
            message=message,
            destinataire=None,  # None = notification générale
            projet=projet,
            tache=tache,
            priorite=priorite,
            description_detaillee=description_detaillee,
            donnees_supplementaires=donnees_supplementaires
        )
    
    @staticmethod
    def create_personal_notification(
        type_code,
        titre,
        message,
        destinataire,
        projet=None,
        tache=None,
        etape=None,
        priorite='normale',
        description_detaillee='',
        donnees_supplementaires=None
    ):
        """
        Créer une notification personnelle
        """
        return NotificationService.create_notification(
            type_code=type_code,
            titre=titre,
            message=message,
            destinataire=destinataire,
            projet=projet,
            tache=tache,
            etape=etape,
            priorite=priorite,
            description_detaillee=description_detaillee,
            donnees_supplementaires=donnees_supplementaires
        )
    
    @staticmethod
    def notify_project_delay(projet):
        """
        Notifier qu'un projet est en retard
        """
        if projet.fin and projet.fin.date() < timezone.now().date():
            # Notification générale
            NotificationService.create_general_notification(
                type_code='projet_retard',
                titre=f'Projet en retard: {projet.nom}',
                message=f'Le projet "{projet.nom}" est en retard. Date de fin prévue: {projet.fin}',
                projet=projet,
                priorite='elevee',
                description_detaillee=f'Le projet {projet.code} - {projet.nom} n\'a pas été terminé dans les délais prévus.',
                donnees_supplementaires={
                    'projet_id': projet.id,
                    'date_fin_prevue': projet.fin.isoformat(),
                    'jours_retard': (timezone.now().date() - projet.fin.date()).days
                }
            )
            
            # Notification personnelle au propriétaire
            NotificationService.create_personal_notification(
                type_code='projet_retard_perso',
                titre=f'Votre projet est en retard: {projet.nom}',
                message=f'Votre projet "{projet.nom}" est en retard de {(timezone.now().date() - projet.fin.date()).days} jour(s)',
                destinataire=projet.proprietaire,
                projet=projet,
                priorite='elevee'
            )
    
    @staticmethod
    def notify_task_delay(tache):
        """
        Notifier qu'une tâche est en retard
        """
        if tache.fin and tache.fin < timezone.now().date() and tache.statut != 'termine':
            # Notification générale
            NotificationService.create_general_notification(
                type_code='tache_retard',
                titre=f'Tâche en retard: {tache.titre}',
                message=f'La tâche "{tache.titre}" du projet "{tache.projet.nom}" est en retard',
                projet=tache.projet,
                tache=tache,
                priorite='normale'
            )
            
            # Notification personnelle à chaque personne assignée
            assignes = tache.assigne_a.all()
            for assigne in assignes:
                NotificationService.create_personal_notification(
                    type_code='tache_retard',
                    titre=f'Votre tâche est en retard: {tache.titre}',
                    message=f'Votre tâche "{tache.titre}" est en retard de {(timezone.now().date() - tache.fin).days} jour(s)',
                    destinataire=assigne,
                    projet=tache.projet,
                    tache=tache,
                    priorite='elevee'
                )
    
    @staticmethod
    def notify_task_assigned(tache, assigne_a):
        """
        Notifier qu'une tâche a été assignée
        """
        NotificationService.create_personal_notification(
            type_code='tache_assignee',
            titre=f'Nouvelle tâche assignée: {tache.titre}',
            message=f'Une nouvelle tâche vous a été assignée: "{tache.titre}" dans le projet "{tache.projet.nom}"',
            destinataire=assigne_a,
            projet=tache.projet,
            tache=tache,
            priorite='normale',
            description_detaillee=f'Tâche assignée le {timezone.now().strftime("%d/%m/%Y à %H:%M")}'
        )
    
    @staticmethod
    def notify_task_completed(tache):
        """
        Notifier qu'une tâche a été terminée
        """
        # Notification au chef de projet
        NotificationService.create_personal_notification(
            type_code='tache_terminee',
            titre=f'Tâche terminée: {tache.titre}',
            message=f'La tâche "{tache.titre}" du projet "{tache.projet.nom}" a été terminée',
            destinataire=tache.projet.proprietaire,
            projet=tache.projet,
            tache=tache,
            priorite='faible'
        )
        
        # Notification générale
        NotificationService.create_general_notification(
            type_code='tache_terminee',
            titre=f'Tâche terminée: {tache.titre}',
            message=f'La tâche "{tache.titre}" du projet "{tache.projet.nom}" a été terminée',
            projet=tache.projet,
            tache=tache,
            priorite='faible'
        )
    
    @staticmethod
    def notify_project_leader_assigned(projet, chef_projet):
        """
        Notifier qu'un utilisateur est devenu chef de projet
        """
        NotificationService.create_personal_notification(
            type_code='projet_chef',
            titre=f'Vous êtes chef de projet: {projet.nom}',
            message=f'Vous avez été nommé chef du projet "{projet.nom}"',
            destinataire=chef_projet,
            projet=projet,
            priorite='elevee',
            description_detaillee=f'Vous êtes maintenant responsable du projet {projet.code} - {projet.nom}'
        )
    
    @staticmethod
    def notify_team_member_added(projet, membre):
        """
        Notifier qu'un membre a été ajouté à une équipe
        """
        NotificationService.create_personal_notification(
            type_code='equipe_membre',
            titre=f'Ajouté à l\'équipe: {projet.nom}',
            message=f'Vous avez été ajouté à l\'équipe du projet "{projet.nom}"',
            destinataire=membre,
            projet=projet,
            priorite='normale'
        )
    
    @staticmethod
    def notify_user_login(user):
        """
        Notifier la connexion d'un utilisateur
        """
        # Notification générale
        return NotificationService.create_general_notification(
            type_code='session_connexion',
            titre=f'Connexion: {user.prenom or user.username}',
            message=f'{user.prenom or user.username} s\'est connecté',
            priorite='faible',
            donnees_supplementaires={
                'user_id': user.id,
                'username': user.username,
                'service': user.service.nom if user.service else None
            }
        )
    
    @staticmethod
    def notify_step_completed(etape):
        """
        Notifier qu'une étape a été terminée
        """
        # Notification au chef de projet
        NotificationService.create_personal_notification(
            type_code='etape_terminee',
            titre=f'Étape terminée: {etape.nom}',
            message=f'L\'étape "{etape.nom}" de la phase "{etape.phase_etat.phase.nom}" a été terminée',
            destinataire=etape.phase_etat.projet.proprietaire,
            projet=etape.phase_etat.projet,
            etape=etape,
            priorite='normale'
        )
    
    @staticmethod
    def get_user_notifications(user, notification_type='all', limit=50):
        """
        Récupérer les notifications d'un utilisateur
        """
        queryset = Notification.objects.select_related(
            'type_notification', 'projet', 'tache', 'etape', 'service'
        )
        
        if notification_type == 'general':
            queryset = queryset.filter(destinataire__isnull=True)
        elif notification_type == 'personal':
            queryset = queryset.filter(destinataire=user)
        else:  # 'all'
            queryset = queryset.filter(
                Q(destinataire=user) | Q(destinataire__isnull=True)
            )
        
        return queryset.order_by('-cree_le')[:limit]
    
    @staticmethod
    def get_notification_stats(user):
        """
        Récupérer les statistiques de notifications pour un utilisateur
        """
        # Notifications personnelles
        notifications_personnelles = Notification.objects.filter(destinataire=user)
        notifications_non_lues = notifications_personnelles.filter(statut='non_lue').count()
        
        # Notifications générales récentes
        notifications_generales = Notification.objects.filter(
            destinataire__isnull=True,
            cree_le__gte=timezone.now() - timedelta(days=7)
        ).count()
        
        # Par type
        notifications_par_type = {}
        for notification in notifications_personnelles.filter(statut='non_lue'):
            type_code = notification.type_notification.code
            notifications_par_type[type_code] = notifications_par_type.get(type_code, 0) + 1
        
        # Par priorité
        notifications_par_priorite = {}
        for notification in notifications_personnelles.filter(statut='non_lue'):
            priorite = notification.priorite
            notifications_par_priorite[priorite] = notifications_par_priorite.get(priorite, 0) + 1
        
        return {
            'total_notifications': notifications_personnelles.count(),
            'notifications_non_lues': notifications_non_lues,
            'notifications_generales': notifications_generales,
            'notifications_par_type': notifications_par_type,
            'notifications_par_priorite': notifications_par_priorite
        }
    
    @staticmethod
    def mark_notifications_read(user, notification_ids=None):
        """
        Marquer des notifications comme lues
        """
        queryset = Notification.objects.filter(destinataire=user, statut='non_lue')
        
        if notification_ids:
            queryset = queryset.filter(id__in=notification_ids)
        
        updated_count = 0
        for notification in queryset:
            notification.marquer_comme_lue()
            updated_count += 1
        
        # Envoyer le nouveau compteur via WebSocket
        if updated_count > 0:
            NotificationService.send_websocket_unread_count(user)
        
        return updated_count
    
    @staticmethod
    def archive_notifications(user, notification_ids=None):
        """
        Archiver des notifications
        """
        queryset = Notification.objects.filter(destinataire=user)
        
        if notification_ids:
            queryset = queryset.filter(id__in=notification_ids)
        
        updated_count = 0
        for notification in queryset:
            notification.archiver()
            updated_count += 1
        
        return updated_count
    
    @staticmethod
    def cleanup_old_notifications(days=30):
        """
        Nettoyer les anciennes notifications
        """
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Archiver les notifications lues anciennes
        old_read_notifications = Notification.objects.filter(
            statut='lue',
            lue_le__lt=cutoff_date
        )
        
        archived_count = 0
        for notification in old_read_notifications:
            notification.archiver()
            archived_count += 1
        
        logger.info(f"Nettoyage: {archived_count} notifications archivées")
        return archived_count
    
    @staticmethod
    def send_websocket_notification(notification):
        """
        Envoyer une notification via WebSocket en temps réel
        """
        try:
            channel_layer = get_channel_layer()
            if not channel_layer:
                logger.warning("Channel layer non configuré")
                return
            
            # Sérialiser la notification pour WebSocket
            from .serializers import NotificationListSerializer
            serializer = NotificationListSerializer(notification)
            notification_data = serializer.data
            
            # Déterminer le type de message WebSocket
            if notification.destinataire:
                # Notification personnelle
                message_type = 'notification_personal'
                group_name = f"notifications_personal_{notification.destinataire.id}"
            else:
                # Notification générale
                message_type = 'notification_general'
                group_name = "notifications_general"
            
            # Envoyer le message via WebSocket
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': message_type,
                    'notification': notification_data
                }
            )
            
            logger.info(f"Notification WebSocket envoyée: {notification.titre}")
            
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi WebSocket: {e}")
    
    @staticmethod
    def send_websocket_unread_count(user):
        """
        Envoyer le compteur de notifications non lues via WebSocket
        """
        try:
            channel_layer = get_channel_layer()
            if not channel_layer:
                return
            
            # Calculer le nombre de notifications non lues
            unread_count = Notification.objects.filter(
                destinataire=user,
                statut='non_lue'
            ).count()
            
            # Envoyer le message via WebSocket
            async_to_sync(channel_layer.group_send)(
                f"notifications_personal_{user.id}",
                {
                    'type': 'notifications_non_lues',
                    'unread_count': unread_count
                }
            )
            
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi du compteur WebSocket: {e}")


class ChatService:
    """
    Service pour la gestion du chat
    """
    
    @staticmethod
    def get_recent_messages(limit=50):
        """
        Récupérer les derniers messages de chat
        """
        return ChatMessage.objects.select_related(
            'expediteur', 'service'
        ).order_by('-cree_le')[:limit]
    
    @staticmethod
    def get_online_users():
        """
        Récupérer les utilisateurs en ligne (basé sur last_login et WebSocket)
        """
        # Utilisateurs connectés récemment (dans les 5 dernières minutes pour plus de flexibilité)
        cutoff_time = timezone.now() - timedelta(minutes=5)
        recent_users = User.objects.filter(
            last_login__gte=cutoff_time,
            is_active=True
        ).select_related('service')
        
        # Filtrer pour ne garder que les utilisateurs vraiment actifs
        # (ceux qui ont une session récente)
        active_users = []
        for user in recent_users:
            # Vérifier si l'utilisateur a une session récente
            if user.last_login:
                time_diff = timezone.now() - user.last_login
                # Seulement les utilisateurs connectés dans les 5 dernières minutes
                if time_diff.total_seconds() < 300:  # 5 minutes
                    active_users.append(user)
        
        return active_users
    
    @staticmethod
    def mark_user_online(user):
        """
        Marquer un utilisateur comme en ligne (pour WebSocket)
        """
        try:
            # Vérifier si l'utilisateur a une méthode save (utilisateur Django)
            if hasattr(user, 'save') and not user.is_anonymous and hasattr(user, 'last_login'):
                logger.info(f"Marquage en ligne de {user.username}")
                user.last_login = timezone.now()
                user.save(update_fields=['last_login'])
                logger.info(f"Utilisateur {user.username} marqué comme en ligne à {user.last_login}")
            else:
                logger.warning(f"Utilisateur sans méthode save ou anonyme: {user}")
        except Exception as e:
            # Ignorer les erreurs pour les utilisateurs anonymes ou de test
            logger.warning(f"Impossible de marquer l'utilisateur comme en ligne: {e}")
            pass
    
    @staticmethod
    def mark_user_offline(user):
        """
        Marquer un utilisateur comme hors ligne
        """
        # Dans une implémentation complète, on supprimerait l'utilisateur
        # de la liste Redis des utilisateurs en ligne
        pass
    
    @staticmethod
    def create_system_message(message, user=None):
        """
        Créer un message système
        """
        return ChatMessage.objects.create(
            expediteur=user or User.objects.first(),
            message=message,
            est_systeme=True
        )
