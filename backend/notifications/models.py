from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from projects.models import Projet, Tache
from accounts.models import Service

User = get_user_model()


class NotificationType(models.Model):
    """
    Types de notifications prédéfinis
    """
    TYPE_CHOICES = [
        # Notifications générales
        ('projet_retard', 'Projet en retard'),
        ('tache_retard', 'Tâche en retard'),
        ('projet_debut', 'Projet qui commence'),
        ('tache_debut', 'Tâche qui commence'),
        ('session_connexion', 'Session de connexion'),
        ('message_chat', 'Message de chat'),
        ('systeme_maintenance', 'Maintenance système'),
        ('annonce_generale', 'Annonce générale'),
        ('projet_valide', 'Projet validé'),
        ('projet_en_cours', 'Projet en cours'),
        ('document_valide', 'Document validé'),
        ('document_rejete', 'Document rejeté'),
        ('phase_terminee', 'Phase terminée'),
        ('permission_accordee', 'Permission accordée'),
        ('commentaire_document', 'Commentaire sur document'),
        ('historique_document', 'Historique document'),
        ('document_televerse', 'Document téléversé'),
        ('utilisateur_inscrit', 'Nouvel utilisateur'),
        ('service_cree', 'Nouveau service'),
        ('role_cree', 'Nouveau rôle'),
        ('projet_supprime', 'Projet supprimé'),
        ('tache_supprimee', 'Tâche supprimée'),
        ('document_supprime', 'Document supprimé'),
        
        # Notifications personnelles
        ('tache_assignee', 'Tâche assignée'),
        ('tache_terminee', 'Tâche terminée'),
        ('projet_chef', 'Chef de projet'),
        ('projet_retard_perso', 'Projet en retard (personnel)'),
        ('equipe_membre', 'Membre d\'équipe'),
        ('permission_projet', 'Permission sur projet'),
        ('notification_personnelle', 'Notification personnelle'),
    ]
    
    code = models.CharField(max_length=50, choices=TYPE_CHOICES, unique=True)
    nom = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icone = models.CharField(max_length=50, default='bell')
    couleur = models.CharField(max_length=20, default='blue')
    est_generale = models.BooleanField(default=False, help_text="True pour notifications générales, False pour personnelles")
    
    class Meta:
        db_table = "notification_types"
        verbose_name = "Type de notification"
        verbose_name_plural = "Types de notifications"
    
    def __str__(self):
        return f"{self.nom} ({'Générale' if self.est_generale else 'Personnelle'})"


class Notification(models.Model):
    """
    Modèle principal pour les notifications
    """
    PRIORITE_CHOICES = [
        ('faible', 'Faible'),
        ('normale', 'Normale'),
        ('elevee', 'Élevée'),
        ('critique', 'Critique'),
    ]
    
    STATUT_CHOICES = [
        ('non_lue', 'Non lue'),
        ('lue', 'Lue'),
        ('archivee', 'Archivée'),
    ]
    
    # Relations
    type_notification = models.ForeignKey(NotificationType, on_delete=models.CASCADE)
    destinataire = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, 
                                   help_text="Null pour notifications générales")
    
    # Contenu
    titre = models.CharField(max_length=200)
    message = models.TextField()
    description_detaillee = models.TextField(blank=True)
    
    # Métadonnées
    priorite = models.CharField(max_length=20, choices=PRIORITE_CHOICES, default='normale')
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='non_lue')
    
    # Relations optionnelles avec les objets métier
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE, null=True, blank=True)
    tache = models.ForeignKey(Tache, on_delete=models.CASCADE, null=True, blank=True)
    service = models.ForeignKey(Service, on_delete=models.CASCADE, null=True, blank=True)
    
    # Données supplémentaires (JSON)
    donnees_supplementaires = models.JSONField(default=dict, blank=True)
    
    # Dates
    cree_le = models.DateTimeField(auto_now_add=True)
    lue_le = models.DateTimeField(null=True, blank=True)
    expire_le = models.DateTimeField(null=True, blank=True)
    
    # Créateur (pour les notifications manuelles)
    cree_par = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                               related_name='notifications_creees')
    
    class Meta:
        db_table = "notifications"
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        ordering = ['-cree_le']
        indexes = [
            models.Index(fields=['destinataire', 'statut', 'cree_le']),
            models.Index(fields=['type_notification', 'cree_le']),
            models.Index(fields=['projet', 'cree_le']),
            models.Index(fields=['tache', 'cree_le']),
        ]
    
    def __str__(self):
        destinataire_str = f" → {self.destinataire.username}" if self.destinataire else " (Générale)"
        return f"{self.titre}{destinataire_str}"
    
    def marquer_comme_lue(self):
        """Marquer la notification comme lue"""
        if self.statut == 'non_lue':
            self.statut = 'lue'
            self.lue_le = timezone.now()
            self.save(update_fields=['statut', 'lue_le'])
    
    def archiver(self):
        """Archiver la notification"""
        self.statut = 'archivee'
        self.save(update_fields=['statut'])
    
    @property
    def est_expiree(self):
        """Vérifier si la notification est expirée"""
        if self.expire_le:
            return timezone.now() > self.expire_le
        return False
    
    @property
    def est_generale(self):
        """Vérifier si c'est une notification générale"""
        return self.destinataire is None
    
    @property
    def est_personnelle(self):
        """Vérifier si c'est une notification personnelle"""
        return self.destinataire is not None


class ChatMessage(models.Model):
    """
    Messages du chat en temps réel (notifications générales)
    """
    expediteur = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    cree_le = models.DateTimeField(auto_now_add=True)
    
    # Métadonnées
    est_systeme = models.BooleanField(default=False, help_text="Message système (connexion/déconnexion)")
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        db_table = "chat_messages"
        verbose_name = "Message de chat"
        verbose_name_plural = "Messages de chat"
        ordering = ['-cree_le']
        indexes = [
            models.Index(fields=['cree_le']),
            models.Index(fields=['expediteur', 'cree_le']),
        ]
    
    def __str__(self):
        return f"{self.expediteur.username}: {self.message[:50]}..."


class NotificationPreference(models.Model):
    """
    Préférences de notification par utilisateur
    """
    utilisateur = models.OneToOneField(User, on_delete=models.CASCADE)
    
    # Préférences générales
    notifications_email = models.BooleanField(default=True)
    notifications_push = models.BooleanField(default=True)
    notifications_chat = models.BooleanField(default=True)
    
    # Préférences par type
    preferences_par_type = models.JSONField(default=dict, blank=True)
    
    # Horaires de réception
    heure_debut = models.TimeField(default='08:00')
    heure_fin = models.TimeField(default='18:00')
    jours_semaine = models.JSONField(default=list, blank=True)  # [1,2,3,4,5] pour lun-ven
    
    # Fréquence
    frequence_digest = models.CharField(max_length=20, choices=[
        ('immediat', 'Immédiat'),
        ('quotidien', 'Quotidien'),
        ('hebdomadaire', 'Hebdomadaire'),
    ], default='immediat')
    
    class Meta:
        db_table = "notification_preferences"
        verbose_name = "Préférence de notification"
        verbose_name_plural = "Préférences de notifications"
    
    def __str__(self):
        return f"Préférences de {self.utilisateur.username}"


class NotificationLog(models.Model):
    """
    Log des notifications envoyées (pour audit et debug)
    """
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE)
    methode_envoi = models.CharField(max_length=50, choices=[
        ('websocket', 'WebSocket'),
        ('email', 'Email'),
        ('push', 'Push'),
        ('sms', 'SMS'),
    ])
    statut_envoi = models.CharField(max_length=20, choices=[
        ('envoye', 'Envoyé'),
        ('echec', 'Échec'),
        ('en_attente', 'En attente'),
    ])
    message_erreur = models.TextField(blank=True)
    envoye_le = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = "notification_logs"
        verbose_name = "Log de notification"
        verbose_name_plural = "Logs de notifications"
        ordering = ['-envoye_le']
    
    def __str__(self):
        return f"{self.notification.titre} - {self.methode_envoi} ({self.statut_envoi})"