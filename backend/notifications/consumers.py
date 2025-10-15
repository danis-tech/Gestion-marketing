import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Notification, ChatMessage, NotificationType
from .services import NotificationService

User = get_user_model()
logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    Consumer WebSocket pour les notifications en temps réel
    """
    
    async def connect(self):
        """Connexion WebSocket"""
        self.user = self.scope["user"]
        
        # Pour les tests, accepter les connexions même sans authentification
        if self.user.is_anonymous:
            # Créer un utilisateur temporaire pour les tests
            self.user = await self.get_or_create_test_user()
        
        # Groupes pour les notifications
        self.general_group = "notifications_general"
        self.personal_group = f"notifications_personal_{self.user.id}"
        self.chat_group = "chat_general"
        self.online_group = "online_users"
        
        # Rejoindre les groupes
        await self.channel_layer.group_add(self.general_group, self.channel_name)
        await self.channel_layer.group_add(self.personal_group, self.channel_name)
        await self.channel_layer.group_add(self.chat_group, self.channel_name)
        await self.channel_layer.group_add(self.online_group, self.channel_name)
        
        await self.accept()
        
        # Marquer l'utilisateur comme en ligne
        await self.mark_user_online()
        
        # Envoyer les notifications non lues
        await self.send_notifications_non_lues()
        
        # Les messages de connexion sont maintenant gérés par le composant ConnectionStatus
        
        # Diffuser la liste des utilisateurs en ligne
        await self.broadcast_online_users()
    
    @database_sync_to_async
    def get_or_create_test_user(self):
        """Créer ou récupérer un utilisateur de test"""
        try:
            # Essayer de récupérer le premier utilisateur actif
            user = User.objects.filter(is_active=True).first()
            if user:
                return user
            
            # Si aucun utilisateur, créer un utilisateur de test
            user = User.objects.create_user(
                username='test_user',
                email='test@example.com',
                password='testpass123',
                first_name='Test',
                last_name='User'
            )
            return user
        except Exception as e:
            logger.error(f"Erreur lors de la création de l'utilisateur de test: {e}")
            # Retourner un utilisateur anonyme avec des attributs par défaut
            class AnonymousUser:
                id = 0
                username = 'anonymous'
                is_anonymous = True
                is_active = True
                prenom = 'Anonymous'
                nom = 'User'
                service = None
                last_login = timezone.now()
            return AnonymousUser()
    
    async def disconnect(self, close_code):
        """Déconnexion WebSocket"""
        if hasattr(self, 'user') and not self.user.is_anonymous:
            # Marquer l'utilisateur comme hors ligne
            await self.mark_user_offline()
            
            # Notifier la déconnexion dans le chat
            await self.notifier_deconnexion()
            
            # Diffuser la liste des utilisateurs en ligne mise à jour
            await self.broadcast_online_users()
            
            # Quitter les groupes
            await self.channel_layer.group_discard(self.general_group, self.channel_name)
            await self.channel_layer.group_discard(self.personal_group, self.channel_name)
            await self.channel_layer.group_discard(self.chat_group, self.channel_name)
            await self.channel_layer.group_discard(self.online_group, self.channel_name)
            
            logger.info(f"Utilisateur {self.user.username} déconnecté des notifications WebSocket")
    
    async def receive(self, text_data):
        """Réception de messages WebSocket"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'chat_message':
                await self.handle_chat_message(data)
            elif message_type == 'delete_message':
                await self.handle_delete_message(data)
            elif message_type == 'mark_notification_read':
                await self.handle_mark_notification_read(data)
            elif message_type == 'get_notifications':
                await self.handle_get_notifications(data)
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Type de message non reconnu'
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Format JSON invalide'
            }))
        except Exception as e:
            logger.error(f"Erreur dans receive: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Erreur interne du serveur'
            }))
    
    async def handle_chat_message(self, data):
        """Gérer l'envoi d'un message de chat"""
        message_text = data.get('message', '').strip()
        
        if not message_text:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Message vide'
            }))
            return
        
        # Créer le message de chat
        chat_message = await self.create_chat_message(message_text)
        
        # Diffuser le message à tous les utilisateurs connectés
        await self.channel_layer.group_send(
            self.chat_group,
            {
                'type': 'chat_message',
                'message': {
                    'id': chat_message['id'],
                    'expediteur': chat_message['expediteur'],
                    'message': chat_message['message'],
                    'cree_le': chat_message['cree_le'],
                    'service_nom': chat_message.get('service_nom')
                }
            }
        )
    
    async def handle_delete_message(self, data):
        """Gérer la suppression d'un message de chat"""
        message_id = data.get('message_id')
        delete_all = data.get('delete_all', False)
        
        if not message_id and not delete_all:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'ID du message manquant'
            }))
            return
        
        # Si suppression de tous les messages, vérifier que l'utilisateur est super admin
        if delete_all and not self.user.is_superuser:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Seuls les super utilisateurs peuvent supprimer tous les messages'
            }))
            return
        
        if delete_all:
            # Supprimer tous les messages
            success = await self.delete_all_chat_messages()
            if success:
                await self.channel_layer.group_send(
                    self.chat_group,
                    {
                        'type': 'all_messages_deleted',
                        'deleted_by': {
                            'id': self.user.id,
                            'prenom': self.user.prenom,
                            'nom': self.user.nom
                        }
                    }
                )
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Erreur lors de la suppression de tous les messages'
                }))
        else:
            # Supprimer un message spécifique
            success = await self.delete_chat_message(message_id, self.user)
            
            if success:
                # Diffuser la suppression à tous les utilisateurs connectés
                await self.channel_layer.group_send(
                    self.chat_group,
                    {
                        'type': 'message_deleted',
                        'message_id': message_id,
                        'deleted_by': {
                            'id': self.user.id,
                            'prenom': self.user.prenom,
                            'nom': self.user.nom
                        }
                    }
                )
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Message non trouvé ou vous n\'avez pas le droit de le supprimer'
                }))
    
    async def handle_mark_notification_read(self, data):
        """Marquer une notification comme lue"""
        notification_id = data.get('notification_id')
        if notification_id:
            await self.mark_notification_read(notification_id)
    
    async def handle_get_notifications(self, data):
        """Récupérer les notifications"""
        notification_type = data.get('type', 'all')  # 'general', 'personal', 'all'
        await self.send_notifications(notification_type)
    
    async def chat_message(self, event):
        """Diffuser un message de chat"""
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'data': event['message']
        }))
    
    async def notification_general(self, event):
        """Diffuser une notification générale"""
        await self.send(text_data=json.dumps({
            'type': 'notification_general',
            'data': event['notification']
        }))
    
    async def notification_personal(self, event):
        """Diffuser une notification personnelle"""
        await self.send(text_data=json.dumps({
            'type': 'notification_personal',
            'data': event['notification']
        }))
    
    async def notification_system(self, event):
        """Diffuser une notification système"""
        await self.send(text_data=json.dumps({
            'type': 'notification_system',
            'data': event['notification']
        }))
    
    @database_sync_to_async
    def create_chat_message(self, message_text):
        """Créer un message de chat"""
        chat_message = ChatMessage.objects.create(
            expediteur=self.user,
            message=message_text,
            service=self.user.service
        )
        
        return {
            'id': chat_message.id,
            'expediteur': {
                'id': self.user.id,
                'username': self.user.username,
                'prenom': self.user.prenom,
                'nom': self.user.nom,
                'service': {
                    'id': self.user.service.id if self.user.service else None,
                    'nom': self.user.service.nom if self.user.service else None
                }
            },
            'message': chat_message.message,
            'cree_le': chat_message.cree_le.isoformat(),
            'service_nom': self.user.service.nom if self.user.service else None
        }
    
    @database_sync_to_async
    def delete_chat_message(self, message_id, user):
        """Supprimer un message de chat"""
        try:
            chat_message = ChatMessage.objects.get(id=message_id)
            
            # Vérifier que l'utilisateur peut supprimer ce message
            # (propriétaire du message ou super admin)
            if chat_message.expediteur != user and not user.is_superuser:
                return False
            
            chat_message.delete()
            return True
        except ChatMessage.DoesNotExist:
            return False
        except Exception as e:
            logger.error(f"Erreur lors de la suppression du message {message_id}: {e}")
            return False
    
    @database_sync_to_async
    def delete_all_chat_messages(self):
        """Supprimer tous les messages de chat"""
        try:
            ChatMessage.objects.all().delete()
            return True
        except Exception as e:
            logger.error(f"Erreur lors de la suppression de tous les messages: {e}")
            return False
    
    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """Marquer une notification comme lue"""
        try:
            notification = Notification.objects.get(
                id=notification_id,
                destinataire=self.user
            )
            notification.marquer_comme_lue()
            return True
        except Notification.DoesNotExist:
            return False
    
    @database_sync_to_async
    def get_notifications_non_lues(self):
        """Récupérer les notifications non lues"""
        # Notifications personnelles non lues
        notifications_personnelles = Notification.objects.filter(
            destinataire=self.user,
            statut='non_lue'
        ).select_related('type_notification', 'projet', 'tache')[:10]
        
        # Notifications générales récentes
        notifications_generales = Notification.objects.filter(
            destinataire__isnull=True,
            cree_le__gte=timezone.now() - timezone.timedelta(days=7)
        ).select_related('type_notification', 'projet', 'tache')[:10]
        
        return {
            'personnelles': [
                {
                    'id': n.id,
                    'type': n.type_notification.code,
                    'titre': n.titre,
                    'message': n.message,
                    'priorite': n.priorite,
                    'cree_le': n.cree_le.isoformat(),
                    'projet_nom': n.projet.nom if n.projet else None,
                    'tache_titre': n.tache.titre if n.tache else None
                }
                for n in notifications_personnelles
            ],
            'generales': [
                {
                    'id': n.id,
                    'type': n.type_notification.code,
                    'titre': n.titre,
                    'message': n.message,
                    'priorite': n.priorite,
                    'cree_le': n.cree_le.isoformat(),
                    'projet_nom': n.projet.nom if n.projet else None,
                    'tache_titre': n.tache.titre if n.tache else None
                }
                for n in notifications_generales
            ]
        }
    
    async def send_notifications_non_lues(self):
        """Envoyer les notifications non lues au client"""
        notifications = await self.get_notifications_non_lues()
        
        await self.send(text_data=json.dumps({
            'type': 'notifications_non_lues',
            'data': notifications
        }))
    
    async def send_notifications(self, notification_type):
        """Envoyer les notifications selon le type"""
        notifications = await self.get_notifications_non_lues()
        
        if notification_type == 'general':
            data = notifications['generales']
        elif notification_type == 'personal':
            data = notifications['personnelles']
        else:
            data = notifications
        
        await self.send(text_data=json.dumps({
            'type': 'notifications_list',
            'data': data
        }))
    
    @database_sync_to_async
    def notifier_connexion(self):
        """Notifier la connexion de l'utilisateur"""
        # Vérifier si une notification de connexion a déjà été envoyée récemment
        recent_time = timezone.now() - timezone.timedelta(minutes=2)
        recent_connection = ChatMessage.objects.filter(
            message__icontains=f"{self.user.prenom or self.user.username} s'est connecté",
            cree_le__gte=recent_time
        ).exists()
        
        if not recent_connection:
            # Créer un message système de connexion
            ChatMessage.objects.create(
                expediteur=self.user,
                message=f"{self.user.prenom or self.user.username} s'est connecté",
                est_systeme=True,
                service=self.user.service
            )
    
    @database_sync_to_async
    def notifier_deconnexion(self):
        """Notifier la déconnexion de l'utilisateur"""
        # Vérifier si une notification de déconnexion a déjà été envoyée récemment
        recent_time = timezone.now() - timezone.timedelta(minutes=2)
        recent_disconnection = ChatMessage.objects.filter(
            message__icontains=f"{self.user.prenom or self.user.username} s'est déconnecté",
            cree_le__gte=recent_time
        ).exists()
        
        if not recent_disconnection:
            # Créer un message système de déconnexion
            ChatMessage.objects.create(
                expediteur=self.user,
                message=f"{self.user.prenom or self.user.username} s'est déconnecté",
                est_systeme=True,
                service=self.user.service
            )
    
    @database_sync_to_async
    def mark_user_online(self):
        """Marquer l'utilisateur comme en ligne"""
        from .services import ChatService
        try:
            # Vérifier si l'utilisateur n'est pas anonyme avant de le marquer en ligne
            if not self.user.is_anonymous and hasattr(self.user, 'save'):
                logger.info(f"Marquage en ligne de l'utilisateur: {self.user.username}")
                ChatService.mark_user_online(self.user)
                logger.info(f"Utilisateur {self.user.username} marqué comme en ligne")
            else:
                logger.warning(f"Utilisateur anonyme ou sans méthode save: {self.user}")
        except Exception as e:
            logger.warning(f"Erreur lors du marquage en ligne: {e}")
            pass
    
    @database_sync_to_async
    def mark_user_offline(self):
        """Marquer l'utilisateur comme hors ligne"""
        from .services import ChatService
        try:
            # Vérifier si l'utilisateur n'est pas anonyme avant de le marquer hors ligne
            if not self.user.is_anonymous and hasattr(self.user, 'save'):
                ChatService.mark_user_offline(self.user)
        except Exception as e:
            logger.warning(f"Erreur lors du marquage hors ligne: {e}")
            pass
    
    @database_sync_to_async
    def get_online_users_list(self):
        """Récupérer la liste des utilisateurs en ligne"""
        from .services import ChatService
        users = ChatService.get_online_users()
        
        return [
            {
                'id': user.id,
                'username': user.username,
                'prenom': user.prenom,
                'nom': user.nom,
                'service': user.service.nom if user.service else None,
                'last_login': user.last_login.isoformat() if user.last_login else None
            }
            for user in users
        ]
    
    async def broadcast_online_users(self):
        """Diffuser la liste des utilisateurs en ligne"""
        online_users = await self.get_online_users_list()
        
        await self.channel_layer.group_send(
            self.online_group,
            {
                'type': 'online_users_update',
                'users': online_users,
                'count': len(online_users)
            }
        )
    
    async def online_users_update(self, event):
        """Diffuser la mise à jour des utilisateurs en ligne"""
        await self.send(text_data=json.dumps({
            'type': 'online_users_update',
            'data': {
                'users': event['users'],
                'count': event['count']
            }
        }))


class ChatConsumer(AsyncWebsocketConsumer):
    """
    Consumer WebSocket dédié au chat (alternative plus simple)
    """
    
    async def connect(self):
        """Connexion au chat"""
        self.user = self.scope["user"]
        
        # Pour les tests, accepter les connexions même sans authentification
        if self.user.is_anonymous:
            # Créer un utilisateur temporaire pour les tests
            self.user = await self.get_or_create_test_user()
        
        self.room_group_name = "chat_general"
        
        # Rejoindre le groupe de chat
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Envoyer les derniers messages
        await self.send_recent_messages()
        
        # Les messages de connexion sont maintenant gérés par le composant ConnectionStatus
    
    @database_sync_to_async
    def get_or_create_test_user(self):
        """Créer ou récupérer un utilisateur de test"""
        try:
            # Essayer de récupérer le premier utilisateur actif
            user = User.objects.filter(is_active=True).first()
            if user:
                return user
            
            # Si aucun utilisateur, créer un utilisateur de test
            user = User.objects.create_user(
                username='test_user',
                email='test@example.com',
                password='testpass123',
                first_name='Test',
                last_name='User'
            )
            return user
        except Exception as e:
            logger.error(f"Erreur lors de la création de l'utilisateur de test: {e}")
            # Retourner un utilisateur anonyme avec des attributs par défaut
            class AnonymousUser:
                id = 0
                username = 'anonymous'
                is_anonymous = True
                is_active = True
                prenom = 'Anonymous'
                nom = 'User'
                service = None
                last_login = timezone.now()
            return AnonymousUser()
    
    async def disconnect(self, close_code):
        """Déconnexion du chat"""
        if hasattr(self, 'user') and not self.user.is_anonymous:
            # Notifier la déconnexion
            await self.notifier_deconnexion()
            
            # Quitter le groupe
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Réception d'un message de chat"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'chat_message':
                message = data.get('message', '').strip()
                if message:
                    # Créer et diffuser le message
                    await self.create_and_broadcast_message(message)
            elif message_type == 'delete_message':
                # Gérer la suppression de message
                message_id = data.get('message_id')
                if message_id and self.user.is_superuser:
                    await self.delete_message(message_id)
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Format JSON invalide'
            }))
    
    async def chat_message(self, event):
        """Diffuser un message de chat"""
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'data': event['message']
        }))
    
    async def create_and_broadcast_message(self, message_text):
        """Créer et diffuser un message"""
        chat_message = await self.create_chat_message(message_text)
        
        # Diffuser à tous les utilisateurs connectés
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': chat_message
            }
        )
    
    @database_sync_to_async
    def create_chat_message(self, message_text):
        """Créer un message de chat"""
        chat_message = ChatMessage.objects.create(
            expediteur=self.user,
            message=message_text,
            service=self.user.service
        )
        
        return {
            'id': chat_message.id,
            'expediteur': {
                'id': self.user.id,
                'username': self.user.username,
                'prenom': self.user.prenom,
                'nom': self.user.nom
            },
            'message': chat_message.message,
            'cree_le': chat_message.cree_le.isoformat(),
            'service_nom': self.user.service.nom if self.user.service else None,
            'est_systeme': chat_message.est_systeme
        }
    
    @database_sync_to_async
    def get_recent_messages(self):
        """Récupérer les derniers messages de chat"""
        messages = ChatMessage.objects.select_related('expediteur', 'service').order_by('-cree_le')[:50]
        
        return [
            {
                'id': msg.id,
                'expediteur': {
                    'id': msg.expediteur.id,
                    'username': msg.expediteur.username,
                    'prenom': msg.expediteur.prenom,
                    'nom': msg.expediteur.nom
                },
                'message': msg.message,
                'cree_le': msg.cree_le.isoformat(),
                'service_nom': msg.service.nom if msg.service else None,
                'est_systeme': msg.est_systeme
            }
            for msg in messages
        ]
    
    async def send_recent_messages(self):
        """Envoyer les derniers messages"""
        messages = await self.get_recent_messages()
        
        await self.send(text_data=json.dumps({
            'type': 'recent_messages',
            'data': messages
        }))
    
    @database_sync_to_async
    def notifier_connexion(self):
        """Notifier la connexion"""
        # Vérifier si une notification de connexion a déjà été envoyée récemment
        recent_time = timezone.now() - timezone.timedelta(minutes=2)
        recent_connection = ChatMessage.objects.filter(
            message__icontains=f"{self.user.prenom or self.user.username} s'est connecté",
            cree_le__gte=recent_time
        ).exists()
        
        if not recent_connection:
            ChatMessage.objects.create(
                expediteur=self.user,
                message=f"🟢 {self.user.prenom or self.user.username} s'est connecté",
                est_systeme=True,
                service=self.user.service
            )
    
    @database_sync_to_async
    def notifier_deconnexion(self):
        """Notifier la déconnexion"""
        # Vérifier si une notification de déconnexion a déjà été envoyée récemment
        recent_time = timezone.now() - timezone.timedelta(minutes=2)
        recent_disconnection = ChatMessage.objects.filter(
            message__icontains=f"{self.user.prenom or self.user.username} s'est déconnecté",
            cree_le__gte=recent_time
        ).exists()
        
        if not recent_disconnection:
            ChatMessage.objects.create(
                expediteur=self.user,
                message=f"🔴 {self.user.prenom or self.user.username} s'est déconnecté",
                est_systeme=True,
                service=self.user.service
            )
    
    @database_sync_to_async
    def delete_message(self, message_id):
        """Supprimer un message"""
        try:
            message = ChatMessage.objects.get(id=message_id)
            message.delete()
            return True
        except ChatMessage.DoesNotExist:
            return False
    
    async def message_deleted(self, event):
        """Diffuser la suppression d'un message"""
        await self.send(text_data=json.dumps({
            'type': 'message_deleted',
            'message_id': event['message_id']
        }))
