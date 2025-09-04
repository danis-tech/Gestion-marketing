from django.db import models
from django.contrib.auth import get_user_model
from accounts.models import Service, Role, Permission

User = get_user_model()


class Projet(models.Model):
    """
    Modèle pour les projets marketing.
    Mappe la table 'projets' du schéma SQL.
    """
    STATUT_CHOICES = [
        ('termine', 'Terminé'),
        ('en_attente', 'En attente'),
        ('hors_delai', 'Hors délai'),
        ('rejete', 'Rejeté'),
    ]
    
    PRIORITE_CHOICES = [
        ('haut', 'Haute'),
        ('moyen', 'Moyenne'),
        ('intermediaire', 'Intermédiaire'),
        ('bas', 'Basse'),
    ]
    
    ETAT_CHOICES = [
        ('On', 'Actif'),
        ('Off', 'Inactif'),
    ]
    
    # Champs d'identification
    id = models.BigAutoField(primary_key=True)
    code = models.CharField(max_length=30, unique=True, verbose_name="Code du projet")
    nom = models.CharField(max_length=200, verbose_name="Nom du projet")
    
    # Informations générales
    nom_createur = models.CharField(max_length=150, null=True, blank=True, verbose_name="Nom du créateur")
    description = models.TextField(verbose_name="Description")
    objectif = models.TextField(verbose_name="Objectif")
    budget = models.CharField(max_length=250, null=True, blank=True, verbose_name="Budget")
    
    # Classification
    type = models.CharField(max_length=250, verbose_name="Type de projet")
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente', verbose_name="Statut")
    priorite = models.CharField(max_length=20, choices=PRIORITE_CHOICES, default='haut', verbose_name="Priorité")
    etat = models.CharField(max_length=3, choices=ETAT_CHOICES, default='On', verbose_name="État")
    
    # Relations
    proprietaire = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='projets_proprietaire',
        verbose_name="Propriétaire du projet"
    )
    
    # Dates
    cree_le = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    mis_a_jour_le = models.DateTimeField(auto_now=True, verbose_name="Date de mise à jour")
    nom_update = models.CharField(max_length=250, null=True, blank=True, verbose_name="Nom de la personne qui a mis à jour")
    
    # Planning
    debut = models.DateTimeField(null=True, blank=True, verbose_name="Date de début")
    fin = models.DateTimeField(null=True, blank=True, verbose_name="Date de fin")
    estimation_jours = models.IntegerField(null=True, blank=True, verbose_name="Estimation en jours")
    
    class Meta:
        db_table = "projets"
        verbose_name = "Projet"
        verbose_name_plural = "Projets"
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['statut']),
            models.Index(fields=['priorite']),
            models.Index(fields=['etat']),
            models.Index(fields=['proprietaire']),
            models.Index(fields=['cree_le']),
        ]
    
    def __str__(self):
        return f"{self.code} - {self.nom}"
    
    def save(self, *args, **kwargs):
        # Calculer l'estimation en jours si début et fin sont définis
        if self.debut and self.fin:
            from datetime import datetime
            delta = self.fin - self.debut
            self.estimation_jours = delta.days
        
        super().save(*args, **kwargs)


class MembreProjet(models.Model):
    """
    Modèle pour les membres d'un projet.
    Mappe la table 'membres_projet' du schéma SQL.
    """
    projet = models.ForeignKey(
        Projet, 
        on_delete=models.CASCADE, 
        related_name='membres',
        verbose_name="Projet"
    )
    utilisateur = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='projets_membre',
        verbose_name="Utilisateur"
    )
    service = models.ForeignKey(
        Service, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name="Service"
    )
    role_projet = models.CharField(max_length=80, verbose_name="Rôle dans le projet")
    ajoute_le = models.DateTimeField(auto_now_add=True, verbose_name="Date d'ajout")
    
    class Meta:
        db_table = "membres_projet"
        verbose_name = "Membre de projet"
        verbose_name_plural = "Membres de projet"
        unique_together = ['projet', 'utilisateur']
        indexes = [
            models.Index(fields=['projet']),
            models.Index(fields=['utilisateur']),
            models.Index(fields=['service']),
            models.Index(fields=['role_projet']),
        ]
    
    def __str__(self):
        return f"{self.utilisateur.prenom} {self.utilisateur.nom} - {self.role_projet}"


class HistoriqueEtat(models.Model):
    """
    Modèle pour l'historique des changements d'état des projets.
    Mappe la table 'historiques_etat' du schéma SQL.
    """
    projet = models.ForeignKey(
        Projet, 
        on_delete=models.CASCADE, 
        related_name='historiques_etat',
        verbose_name="Projet"
    )
    de_etat = models.CharField(max_length=50, verbose_name="État de départ")
    vers_etat = models.CharField(max_length=50, verbose_name="État d'arrivée")
    par_utilisateur = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='historiques_etat_crees',
        verbose_name="Utilisateur qui a effectué le changement"
    )
    effectue_le = models.DateTimeField(auto_now_add=True, verbose_name="Date du changement")
    
    class Meta:
        db_table = "historiques_etat"
        verbose_name = "Historique d'état"
        verbose_name_plural = "Historiques d'état"
        indexes = [
            models.Index(fields=['projet', 'effectue_le']),
            models.Index(fields=['par_utilisateur']),
        ]
    
    def __str__(self):
        return f"{self.projet.code}: {self.de_etat} → {self.vers_etat} par {self.par_utilisateur.prenom}"


class PermissionProjet(models.Model):
    """
    Modèle pour les permissions spécifiques des utilisateurs sur les projets.
    Ce modèle est différent de Permission du module accounts qui définit les permissions générales.
    Ici, on définit quelles permissions spécifiques un utilisateur a sur un projet particulier.
    """
    PERMISSION_CHOICES = [
        ('voir', 'Voir le projet'),
        ('modifier', 'Modifier le projet'),
        ('supprimer', 'Supprimer le projet'),
        ('valider', 'Valider le projet'),
        ('gerer_membres', 'Gérer les membres'),
        ('gerer_permissions', 'Gérer les permissions'),
        ('voir_historique', 'Voir l\'historique'),
        ('exporter', 'Exporter le projet'),
    ]
    
    projet = models.ForeignKey(
        Projet, 
        on_delete=models.CASCADE, 
        related_name='permissions_utilisateurs',
        verbose_name="Projet"
    )
    utilisateur = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='permissions_projets',
        verbose_name="Utilisateur"
    )
    permission = models.CharField(
        max_length=20, 
        choices=PERMISSION_CHOICES,
        verbose_name="Permission"
    )
    accordee_par = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='permissions_accordees',
        verbose_name="Accordée par"
    )
    accordee_le = models.DateTimeField(auto_now_add=True, verbose_name="Date d'accord")
    active = models.BooleanField(default=True, verbose_name="Active")
    
    class Meta:
        db_table = "permissions_projet"
        verbose_name = "Permission de projet"
        verbose_name_plural = "Permissions de projet"
        unique_together = ['projet', 'utilisateur', 'permission']
        indexes = [
            models.Index(fields=['projet', 'utilisateur']),
            models.Index(fields=['permission']),
            models.Index(fields=['active']),
        ]
    
    def __str__(self):
        return f"{self.utilisateur.prenom} - {self.get_permission_display()} sur {self.projet.code}"


class Tache(models.Model):
    """
    Modèle pour les tâches des projets marketing.
    Mappe la table 'taches' du schéma SQL.
    """
    STATUT_CHOICES = [
        ('termine', 'Terminé'),
        ('en_attente', 'En attente'),
        ('hors_delai', 'Hors délai'),
        ('rejete', 'Rejeté'),
    ]
    
    PRIORITE_CHOICES = [
        ('haut', 'Haute'),
        ('moyen', 'Moyenne'),
        ('intermediaire', 'Intermédiaire'),
        ('bas', 'Basse'),
    ]
    
    PHASE_CHOICES = [
        ('conception', 'Conception'),
        ('build', 'Build'),
        ('uat', 'UAT'),
        ('lancement', 'Lancement'),
        ('suivi', 'Suivi'),
        ('fin_de_vie', 'Fin de vie'),
    ]
    
    # Champs d'identification
    id = models.BigAutoField(primary_key=True)
    projet = models.ForeignKey(
        Projet, 
        on_delete=models.CASCADE, 
        related_name='taches',
        verbose_name="Projet"
    )
    titre = models.CharField(max_length=200, verbose_name="Titre de la tâche")
    description = models.TextField(verbose_name="Description de la tâche", null=True, blank=True)
    
    # Classification
    statut = models.CharField(
        max_length=20, 
        choices=STATUT_CHOICES, 
        default='en_attente', 
        verbose_name="Statut"
    )
    priorite = models.CharField(
        max_length=20, 
        choices=PRIORITE_CHOICES, 
        default='haut', 
        verbose_name="Priorité"
    )
    phase = models.CharField(
        max_length=50, 
        choices=PHASE_CHOICES,
        verbose_name="Phase"
    )
    
    # Planning
    debut = models.DateField(null=True, blank=True, verbose_name="Date de début")
    fin = models.DateField(null=True, blank=True, verbose_name="Date de fin")
    nbr_jour_estimation = models.IntegerField(
        null=True, 
        blank=True, 
        verbose_name="Nombre de jours d'estimation"
    )
    
    # Relations
    tache_dependante = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='taches_dependantes',
        verbose_name="Tâche dépendante"
    )
    assigne_a = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='taches_assignees',
        verbose_name="Assigné à"
    )
    
    # Métadonnées
    cree_le = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    mise_a_jour_le = models.DateTimeField(auto_now=True, verbose_name="Date de mise à jour")
    
    class Meta:
        db_table = "taches"
        verbose_name = "Tâche"
        verbose_name_plural = "Tâches"
        indexes = [
            models.Index(fields=['projet', 'statut', 'phase'], name='idx_taches'),
            models.Index(fields=['projet']),
            models.Index(fields=['statut']),
            models.Index(fields=['phase']),
            models.Index(fields=['assigne_a']),
            models.Index(fields=['tache_dependante']),
            models.Index(fields=['debut']),
            models.Index(fields=['fin']),
        ]
    
    def __str__(self):
        return f"{self.projet.code} - {self.titre}"
    
    def save(self, *args, **kwargs):
        # Calculer l'estimation en jours si début et fin sont définis
        if self.debut and self.fin:
            delta = self.fin - self.debut
            self.nbr_jour_estimation = delta.days
        
        super().save(*args, **kwargs)
    
    @property
    def est_en_retard(self):
        """Vérifie si la tâche est en retard"""
        if self.fin and self.statut != 'termine':
            from datetime import date
            return date.today() > self.fin
        return False
    
    @property
    def progression(self):
        """Calcule la progression de la tâche basée sur le statut"""
        progression_map = {
            'en_attente': 0,
            'rejete': 0,
            'hors_delai': 50,
            'termine': 100,
        }
        return progression_map.get(self.statut, 0)
