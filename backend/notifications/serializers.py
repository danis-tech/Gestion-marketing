from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Notification, NotificationType, ChatMessage, NotificationPreference, NotificationLog
from projects.serializers import ProjetListSerializer, TacheListSerializer
from accounts.serializers import UserListSerializer

User = get_user_model()


class NotificationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationType
        fields = ['id', 'code', 'nom', 'description', 'icone', 'couleur', 'est_generale']


class NotificationSerializer(serializers.ModelSerializer):
    type_notification = NotificationTypeSerializer(read_only=True)
    type_notification_id = serializers.IntegerField(write_only=True)
    destinataire = UserListSerializer(read_only=True)
    destinataire_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    projet = ProjetListSerializer(read_only=True)
    projet_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    tache = TacheListSerializer(read_only=True)
    tache_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    cree_par = UserListSerializer(read_only=True)
    cree_par_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    # Champs calculés
    est_generale = serializers.BooleanField(read_only=True)
    est_personnelle = serializers.BooleanField(read_only=True)
    est_expiree = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'type_notification', 'type_notification_id',
            'destinataire', 'destinataire_id',
            'titre', 'message', 'description_detaillee',
            'priorite', 'statut',
            'projet', 'projet_id', 'tache', 'tache_id', 'etape', 'service',
            'donnees_supplementaires',
            'cree_le', 'lue_le', 'expire_le',
            'cree_par', 'cree_par_id',
            'est_generale', 'est_personnelle', 'est_expiree'
        ]
        read_only_fields = ['cree_le', 'lue_le']


class NotificationListSerializer(serializers.ModelSerializer):
    """Sérialiseur simplifié pour les listes"""
    type_notification = NotificationTypeSerializer(read_only=True)
    destinataire = UserListSerializer(read_only=True)
    destinataire_nom = serializers.CharField(source='destinataire.username', read_only=True)
    projet_nom = serializers.CharField(source='projet.nom', read_only=True)
    tache_titre = serializers.CharField(source='tache.titre', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'type_notification', 'titre', 'message',
            'priorite', 'statut', 'cree_le', 'lue_le',
            'destinataire', 'destinataire_nom', 'projet_nom', 'tache_titre',
            'est_generale', 'est_personnelle'
        ]


class NotificationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'type_notification_id', 'destinataire_id',
            'titre', 'message', 'description_detaillee',
            'priorite', 'projet_id', 'tache_id', 'etape_id', 'service_id',
            'donnees_supplementaires', 'expire_le', 'cree_par_id'
        ]
    
    def create(self, validated_data):
        # Déterminer si c'est une notification générale ou personnelle
        if validated_data.get('destinataire_id') is None:
            # Notification générale
            validated_data['type_notification'] = NotificationType.objects.get(
                id=validated_data.pop('type_notification_id')
            )
        else:
            # Notification personnelle
            validated_data['type_notification'] = NotificationType.objects.get(
                id=validated_data.pop('type_notification_id')
            )
            validated_data['destinataire'] = User.objects.get(
                id=validated_data.pop('destinataire_id')
            )
        
        return super().create(validated_data)


class ChatMessageSerializer(serializers.ModelSerializer):
    expediteur = UserListSerializer(read_only=True)
    expediteur_id = serializers.IntegerField(write_only=True)
    service_nom = serializers.CharField(source='service.nom', read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = [
            'id', 'expediteur', 'expediteur_id', 'message',
            'cree_le', 'est_systeme', 'service', 'service_nom'
        ]
        read_only_fields = ['cree_le']


class ChatMessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['message', 'est_systeme']
    
    def create(self, validated_data):
        # Le service sera défini automatiquement depuis l'utilisateur si nécessaire
        return super().create(validated_data)


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    utilisateur = UserListSerializer(read_only=True)
    
    class Meta:
        model = NotificationPreference
        fields = [
            'id', 'utilisateur',
            'notifications_email', 'notifications_push', 'notifications_chat',
            'preferences_par_type',
            'heure_debut', 'heure_fin', 'jours_semaine',
            'frequence_digest'
        ]


class NotificationPreferenceUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            'notifications_email', 'notifications_push', 'notifications_chat',
            'preferences_par_type',
            'heure_debut', 'heure_fin', 'jours_semaine',
            'frequence_digest'
        ]


class NotificationStatsSerializer(serializers.Serializer):
    """Sérialiseur pour les statistiques de notifications"""
    total_notifications = serializers.IntegerField()
    notifications_non_lues = serializers.IntegerField()
    notifications_generales = serializers.IntegerField()
    notifications_par_type = serializers.DictField()
    notifications_par_priorite = serializers.DictField()
    notifications_recentes = NotificationListSerializer(many=True)


class NotificationMarkReadSerializer(serializers.Serializer):
    """Sérialiseur pour marquer les notifications comme lues"""
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True
    )
    marquer_toutes = serializers.BooleanField(default=False)


class NotificationArchiveSerializer(serializers.Serializer):
    """Sérialiseur pour archiver les notifications"""
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True
    )
    archiver_toutes = serializers.BooleanField(default=False)
