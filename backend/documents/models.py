from django.db import models
from django.core.validators import FileExtensionValidator
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.conf import settings
from projects.models import Projet, ProjetPhaseEtat, Etape
import os

User = get_user_model()


class DocumentProjet(models.Model):
    """
    Modèle pour les documents liés aux projets.
    Correspond à la table documents_projet.
    """
    
    TYPE_DOCUMENT_CHOICES = [
        # Phase 1 : Expression du besoin
        ('fiche_projet_marketing', 'Fiche projet marketing'),
        ('fiche_plan_projet', 'Fiche plan projet'),
        
        # Phase 2 : Études de faisabilité
        ('fiche_etude_si', 'Fiche d\'étude SI'),
        ('fiche_etude_technique', 'Fiche d\'étude technique'),
        ('fiche_etude_financiere', 'Fiche d\'étude financière'),
        
        # Phase 3 : Conception
        ('fiche_specifications_marketing', 'Fiche de spécifications marketing'),
        
        # Phase 4 : Développement / Implémentation
        ('fiche_implementation', 'Fiche d\'implémentation'),
        ('fiche_recette_uat', 'Fiche de recette utilisateur (UAT)'),
        
        # Phase 5 : Lancement Commercial
        ('fiche_lancement_commercial', 'Fiche de lancement commercial'),
        
        # Phase 6 : Suppression d'une offre & Bilan
        ('fiche_suppression', 'Fiche de suppression'),
        ('fiche_bilan_3_mois', 'Fiche de bilan à 3 mois'),
        ('fiche_bilan_6_mois', 'Fiche de bilan à 6 mois'),
        
        # Autres
        ('autre', 'Autre'),
    ]
    
    STATUT_CHOICES = [
        ('brouillon', 'Brouillon'),
        ('final', 'Final'),
        ('rejete', 'Rejeté'),
    ]
    
    ORIGINE_CHOICES = [
        ('genere', 'Généré'),
        ('manuel', 'Manuel'),
    ]
    
    # Relations principales
    projet = models.ForeignKey(
        Projet, 
        on_delete=models.CASCADE, 
        related_name='documents',
        verbose_name="Projet"
    )
    
    # Informations du document
    type_document = models.CharField(
        max_length=50, 
        choices=TYPE_DOCUMENT_CHOICES,
        null=True, 
        blank=True,
        verbose_name="Type de document"
    )
    
    version = models.PositiveIntegerField(
        default=1,
        verbose_name="Version"
    )
    
    chemin_fichier = models.CharField(
        max_length=500,
        verbose_name="Chemin du fichier"
    )
    
    statut = models.CharField(
        max_length=20, 
        choices=STATUT_CHOICES, 
        default='final',
        verbose_name="Statut"
    )
    
    origine = models.CharField(
        max_length=20, 
        choices=ORIGINE_CHOICES, 
        default='manuel',
        verbose_name="Origine"
    )
    
    # Relations avec les utilisateurs
    cree_par = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='documents_crees',
        verbose_name="Créé par"
    )
    
    depose_par = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='documents_deposes',
        verbose_name="Déposé par"
    )
    
    # Relations avec les phases et étapes (optionnelles)
    phase = models.ForeignKey(
        ProjetPhaseEtat, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='documents',
        verbose_name="Phase"
    )
    
    etape = models.ForeignKey(
        Etape, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='documents',
        verbose_name="Étape"
    )
    
    # Métadonnées
    cree_le = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    
    # Champs supplémentaires utiles
    nom_fichier = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Nom du fichier"
    )
    
    taille_fichier = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        verbose_name="Taille du fichier (bytes)"
    )
    
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name="Description"
    )
    
    # Suivi des modifications de fichier
    date_modification_fichier = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date de dernière modification du fichier"
    )
    
    class Meta:
        db_table = "documents_projet"
        verbose_name = "Document de projet"
        verbose_name_plural = "Documents de projet"
        ordering = ['-cree_le']
        indexes = [
            models.Index(fields=['projet', 'type_document', 'cree_le']),
            models.Index(fields=['statut']),
            models.Index(fields=['origine']),
            models.Index(fields=['phase']),
            models.Index(fields=['etape']),
        ]
    
    def __str__(self):
        return f"{self.get_type_document_display() or 'Document'} - {self.projet.nom} (v{self.version})"
    
    @property
    def taille_fichier_mb(self):
        """Retourne la taille du fichier en MB."""
        if self.taille_fichier:
            return round(self.taille_fichier / (1024 * 1024), 2)
        return None
    
    @property
    def est_brouillon(self):
        """Vérifie si le document est en brouillon."""
        return self.statut == 'brouillon'
    
    @property
    def est_final(self):
        """Vérifie si le document est final."""
        return self.statut == 'final'
    
    @property
    def est_rejete(self):
        """Vérifie si le document est rejeté."""
        return self.statut == 'rejete'
    
    @property
    def est_genere(self):
        """Vérifie si le document est généré automatiquement."""
        return self.origine == 'genere'
    
    @property
    def est_manuel(self):
        """Vérifie si le document est déposé manuellement."""
        return self.origine == 'manuel'
    
    def peut_etre_modifie(self):
        """Vérifie si le document peut être modifié."""
        return self.statut in ['brouillon', 'rejete']
    
    def peut_etre_supprime(self):
        """Vérifie si le document peut être supprimé."""
        return self.statut in ['brouillon', 'rejete']
    
    @classmethod
    def get_fiches_par_phase(cls, phase_ordre):
        """Retourne les types de fiches associés à une phase."""
        fiches_par_phase = {
            1: ['fiche_projet_marketing', 'fiche_plan_projet'],
            2: ['fiche_etude_si', 'fiche_etude_technique', 'fiche_etude_financiere'],
            3: ['fiche_specifications_marketing'],
            4: ['fiche_implementation', 'fiche_recette_uat'],
            5: ['fiche_lancement_commercial'],
            6: ['fiche_suppression', 'fiche_bilan_3_mois', 'fiche_bilan_6_mois']
        }
        return fiches_par_phase.get(phase_ordre, [])
    
    @classmethod
    def get_fiches_auto_generation(cls):
        """Retourne les types de fiches générées automatiquement."""
        return [
            'fiche_plan_projet',
            'fiche_specifications_marketing', 
            'fiche_recette_uat',
            'fiche_lancement_commercial',
            'fiche_bilan_3_mois',
            'fiche_bilan_6_mois'
        ]
    
    @classmethod
    def get_fiches_manuel(cls):
        """Retourne les types de fiches à remplir manuellement."""
        return [
            'fiche_projet_marketing',
            'fiche_etude_si',
            'fiche_etude_technique', 
            'fiche_etude_financiere',
            'fiche_implementation',
            'fiche_suppression'
        ]
    
    @property
    def est_fiche_auto_generation(self):
        """Vérifie si la fiche est générée automatiquement."""
        return self.type_document in self.get_fiches_auto_generation()
    
    @property
    def est_fiche_manuel(self):
        """Vérifie si la fiche est à remplir manuellement."""
        return self.type_document in self.get_fiches_manuel()
    
    @property
    def phase_associee(self):
        """Retourne le numéro de phase associé à ce type de fiche."""
        for phase_num, fiches in self.get_fiches_par_phase.items():
            if self.type_document in fiches:
                return phase_num
        return None


class HistoriqueDocumentProjet(models.Model):
    """
    Modèle pour l'historique des modifications des documents de projet.
    """
    
    ACTION_CHOICES = [
        ('creation', 'Création'),
        ('modification', 'Modification'),
        ('changement_statut', 'Changement de statut'),
        ('upload', 'Upload de fichier'),
        ('suppression', 'Suppression'),
        ('validation', 'Validation'),
        ('rejet', 'Rejet'),
        ('synchronisation_forcee', 'Synchronisation forcée'),
        ('modification_synchronisee', 'Modification synchronisée'),
    ]
    
    document = models.ForeignKey(
        DocumentProjet, 
        on_delete=models.CASCADE, 
        related_name='historique',
        verbose_name="Document"
    )
    
    action = models.CharField(
        max_length=50, 
        choices=ACTION_CHOICES,
        verbose_name="Action"
    )
    
    utilisateur = models.ForeignKey(
        User, 
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        verbose_name="Utilisateur"
    )
    
    description = models.TextField(
        verbose_name="Description"
    )
    
    ancien_statut = models.CharField(
        max_length=20, 
        blank=True, 
        null=True, 
        verbose_name="Ancien statut"
    )
    
    nouveau_statut = models.CharField(
        max_length=20, 
        blank=True, 
        null=True, 
        verbose_name="Nouveau statut"
    )
    
    # Métadonnées
    date_action = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de l'action"
    )
    
    ip_address = models.GenericIPAddressField(
        null=True, 
        blank=True, 
        verbose_name="Adresse IP"
    )
    
    class Meta:
        db_table = "documents_projet_historique"
        verbose_name = "Historique de document de projet"
        verbose_name_plural = "Historiques de documents de projet"
        ordering = ['-date_action']
        indexes = [
            models.Index(fields=['document', 'date_action']),
            models.Index(fields=['utilisateur']),
            models.Index(fields=['action']),
        ]
    
    def __str__(self):
        return f"{self.document} - {self.get_action_display()} par {self.utilisateur.username}"


class CommentaireDocumentProjet(models.Model):
    """
    Modèle pour les commentaires sur les documents de projet.
    """
    
    document = models.ForeignKey(
        DocumentProjet, 
        on_delete=models.CASCADE, 
        related_name='commentaires',
        verbose_name="Document"
    )
    
    auteur = models.ForeignKey(
        User, 
        on_delete=models.PROTECT,
        verbose_name="Auteur"
    )
    
    contenu = models.TextField(
        verbose_name="Contenu"
    )
    
    parent = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='reponses',
        verbose_name="Commentaire parent"
    )
    
    # Métadonnées
    date_creation = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    
    date_modification = models.DateTimeField(
        auto_now=True,
        verbose_name="Date de modification"
    )
    
    date_modification_fichier = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date de dernière modification du fichier"
    )
    
    modifie = models.BooleanField(
        default=False,
        verbose_name="Modifié"
    )
    
    class Meta:
        db_table = "documents_projet_commentaires"
        verbose_name = "Commentaire de document de projet"
        verbose_name_plural = "Commentaires de documents de projet"
        ordering = ['date_creation']
        indexes = [
            models.Index(fields=['document', 'date_creation']),
            models.Index(fields=['auteur']),
        ]
    
    def __str__(self):
        return f"Commentaire sur {self.document} par {self.auteur.username}"


class DocumentTeleverse(models.Model):
    """
    Modèle pour les documents téléversés par les utilisateurs.
    Distinction avec les documents générés automatiquement.
    """
    
    TYPE_FICHIER_CHOICES = [
        ('pdf', 'PDF'),
        ('docx', 'Document Word'),
        ('doc', 'Document Word (ancien format)'),
        ('xlsx', 'Fichier Excel'),
        ('xls', 'Fichier Excel (ancien format)'),
        ('pptx', 'Présentation PowerPoint'),
        ('ppt', 'Présentation PowerPoint (ancien format)'),
        ('jpg', 'Image JPEG'),
        ('jpeg', 'Image JPEG'),
        ('png', 'Image PNG'),
        ('gif', 'Image GIF'),
        ('bmp', 'Image BMP'),
        ('tiff', 'Image TIFF'),
        ('txt', 'Fichier texte'),
        ('csv', 'Fichier CSV'),
        ('zip', 'Archive ZIP'),
        ('rar', 'Archive RAR'),
        ('autre', 'Autre'),
    ]
    
    STATUT_CHOICES = [
        ('en_attente', 'En attente de validation'),
        ('valide', 'Validé'),
        ('rejete', 'Rejeté'),
        ('archive', 'Archivé'),
    ]
    
    # Relations
    projet = models.ForeignKey(
        Projet,
        on_delete=models.CASCADE,
        related_name='documents_televerses',
        verbose_name="Projet associé"
    )
    
    phase = models.ForeignKey(
        ProjetPhaseEtat,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documents_televerses',
        verbose_name="Phase associée"
    )
    
    etape = models.ForeignKey(
        Etape,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documents_televerses',
        verbose_name="Étape associée"
    )
    
    # Informations du fichier
    nom_fichier_original = models.CharField(
        max_length=255,
        verbose_name="Nom du fichier original"
    )
    
    nom_fichier_stocke = models.CharField(
        max_length=255,
        verbose_name="Nom du fichier stocké"
    )
    
    chemin_fichier = models.CharField(
        max_length=500,
        verbose_name="Chemin du fichier"
    )
    
    taille_fichier = models.BigIntegerField(
        verbose_name="Taille du fichier (en octets)"
    )
    
    type_fichier = models.CharField(
        max_length=10,
        choices=TYPE_FICHIER_CHOICES,
        verbose_name="Type de fichier"
    )
    
    extension_fichier = models.CharField(
        max_length=10,
        verbose_name="Extension du fichier"
    )
    
    # Métadonnées
    titre = models.CharField(
        max_length=200,
        verbose_name="Titre du document"
    )
    
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name="Description du document"
    )
    
    mots_cles = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name="Mots-clés"
    )
    
    version = models.CharField(
        max_length=20,
        default='1.0',
        verbose_name="Version du document"
    )
    
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='en_attente',
        verbose_name="Statut du document"
    )
    
    # Relations utilisateur
    televerse_par = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='documents_televerses',
        verbose_name="Téléversé par"
    )
    
    valide_par = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documents_valides',
        verbose_name="Validé par"
    )
    
    # Dates
    date_televersement = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de téléversement"
    )
    
    date_validation = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date de validation"
    )
    
    date_modification = models.DateTimeField(
        auto_now=True,
        verbose_name="Date de dernière modification"
    )
    
    # Champs de validation
    commentaire_validation = models.TextField(
        blank=True,
        null=True,
        verbose_name="Commentaire de validation"
    )
    
    nom_validateur = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Nom du validateur"
    )
    
    fonction_validateur = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Fonction du validateur"
    )
    
    # Sécurité
    est_public = models.BooleanField(
        default=False,
        verbose_name="Document public"
    )
    
    # Métadonnées techniques
    hash_fichier = models.CharField(
        max_length=64,
        blank=True,
        null=True,
        verbose_name="Hash du fichier (SHA-256)"
    )
    
    class Meta:
        db_table = "documents_televerses"
        verbose_name = "Document téléversé"
        verbose_name_plural = "Documents téléversés"
        ordering = ['-date_televersement']
        indexes = [
            models.Index(fields=['projet', 'date_televersement']),
            models.Index(fields=['phase', 'date_televersement']),
            models.Index(fields=['etape', 'date_televersement']),
            models.Index(fields=['televerse_par', 'date_televersement']),
            models.Index(fields=['statut', 'date_televersement']),
            models.Index(fields=['type_fichier', 'date_televersement']),
        ]
    
    def __str__(self):
        return f"{self.titre} - {self.projet.nom} ({self.type_fichier.upper()})"
    
    def save(self, *args, **kwargs):
        # Déterminer le type de fichier basé sur l'extension
        if not self.type_fichier or self.type_fichier == 'autre':
            self.type_fichier = self._determiner_type_fichier()
        
        # Déterminer l'extension
        if not self.extension_fichier:
            self.extension_fichier = self._determiner_extension()
        
        super().save(*args, **kwargs)
    
    def _determiner_type_fichier(self):
        """Détermine le type de fichier basé sur l'extension."""
        if not self.nom_fichier_original:
            return 'autre'
        
        extension = self.nom_fichier_original.lower().split('.')[-1]
        
        type_mapping = {
            'pdf': 'pdf',
            'docx': 'docx',
            'doc': 'doc',
            'xlsx': 'xlsx',
            'xls': 'xls',
            'pptx': 'pptx',
            'ppt': 'ppt',
            'jpg': 'jpg',
            'jpeg': 'jpeg',
            'png': 'png',
            'gif': 'gif',
            'bmp': 'bmp',
            'tiff': 'tiff',
            'txt': 'txt',
            'csv': 'csv',
            'zip': 'zip',
            'rar': 'rar',
        }
        
        return type_mapping.get(extension, 'autre')
    
    def _determiner_extension(self):
        """Détermine l'extension du fichier."""
        if not self.nom_fichier_original:
            return ''
        
        return self.nom_fichier_original.lower().split('.')[-1]
    
    @property
    def taille_fichier_mb(self):
        """Retourne la taille du fichier en MB."""
        return round(self.taille_fichier / (1024 * 1024), 2)
    
    @property
    def est_image(self):
        """Retourne True si le fichier est une image."""
        return self.type_fichier in ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff']
    
    @property
    def est_document_office(self):
        """Retourne True si le fichier est un document Office."""
        return self.type_fichier in ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt']
    
    @property
    def est_archive(self):
        """Retourne True si le fichier est une archive."""
        return self.type_fichier in ['zip', 'rar']
    
    def get_chemin_complet(self):
        """Retourne le chemin complet du fichier."""
        return os.path.join(settings.MEDIA_ROOT, self.chemin_fichier)
    
    def get_url_fichier(self):
        """Retourne l'URL du fichier."""
        return f"{settings.MEDIA_URL}{self.chemin_fichier}"