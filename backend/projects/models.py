from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
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
        
        # Vérifier si c'est une nouvelle création
        is_new = self.pk is None
        
        super().save(*args, **kwargs)
        
        # Si c'est un nouveau projet, créer automatiquement les phases standard
        if is_new:
            self._creer_phases_standard()
    
    def _creer_phases_standard(self):
        """
        Crée automatiquement les 6 phases standard pour ce projet.
        Cette méthode est appelée lors de la création d'un nouveau projet.
        """
        # S'assurer que les phases standard existent dans la base de données
        self._creer_phases_standard_si_inexistantes()
        
        # Récupérer toutes les phases standard actives
        phases_standard = PhaseProjet.objects.filter(active=True).order_by('ordre')
        
        # Créer les ProjetPhaseEtat pour chaque phase standard
        for phase in phases_standard:
            ProjetPhaseEtat.objects.get_or_create(
                projet=self,
                phase=phase,
                defaults={
                    'terminee': False,
                    'ignoree': False,
                }
            )
    
    @classmethod
    def _creer_phases_standard_si_inexistantes(cls):
        """
        Crée les phases standard dans la base de données si elles n'existent pas.
        Cette méthode est statique car elle peut être appelée depuis n'importe où.
        """
        phases_data = PhaseProjet.get_phases_standard()
        
        for phase_data in phases_data:
            PhaseProjet.objects.get_or_create(
                nom=phase_data['nom'],
                defaults={
                    'ordre': phase_data['ordre'],
                    'description': phase_data['description'],
                    'active': True
                }
            )


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


class PhaseProjet(models.Model):
    """
    Modèle pour les phases standard des projets marketing.
    Contient les 6 phases prédéfinies de l'application.
    """
    nom = models.CharField(max_length=100, unique=True, verbose_name="Nom de la phase")
    ordre = models.PositiveIntegerField(unique=True, verbose_name="Ordre de la phase")
    description = models.TextField(blank=True, null=True, verbose_name="Description de la phase")
    active = models.BooleanField(default=True, verbose_name="Phase active")
    
    class Meta:
        db_table = "phases_projet"
        verbose_name = "Phase de projet"
        verbose_name_plural = "Phases de projet"
        ordering = ['ordre']
        indexes = [
            models.Index(fields=['ordre']),
            models.Index(fields=['active']),
        ]
    
    def __str__(self):
        return f"{self.ordre}. {self.nom}"
    
    @classmethod
    def get_phases_standard(cls):
        """
        Retourne les 6 phases standard de l'application.
        """
        return [
            {'nom': 'Expression du besoin', 'ordre': 1, 'description': 'Phase de collecte et d\'analyse des besoins'},
            {'nom': 'Études de faisabilité', 'ordre': 2, 'description': 'Phase d\'étude de la faisabilité technique et commerciale'},
            {'nom': 'Conception', 'ordre': 3, 'description': 'Phase de conception détaillée du projet'},
            {'nom': 'Développement / Implémentation', 'ordre': 4, 'description': 'Phase de développement et d\'implémentation'},
            {'nom': 'Lancement commercial', 'ordre': 5, 'description': 'Phase de lancement commercial du projet'},
            {'nom': 'Suppression d\'une offre', 'ordre': 6, 'description': 'Phase de suppression ou d\'arrêt de l\'offre'},
        ]


class ProjetPhaseEtat(models.Model):
    """
    Modèle pour lier chaque projet à ses phases et gérer leur état.
    Chaque projet a automatiquement les 6 phases standard.
    """
    projet = models.ForeignKey(
        Projet, 
        on_delete=models.CASCADE, 
        related_name='phases_etat',
        verbose_name="Projet"
    )
    phase = models.ForeignKey(
        PhaseProjet, 
        on_delete=models.CASCADE,
        related_name='projets_etat',
        verbose_name="Phase"
    )
    terminee = models.BooleanField(default=False, verbose_name="Phase terminée")
    ignoree = models.BooleanField(default=False, verbose_name="Phase ignorée")
    date_debut = models.DateTimeField(null=True, blank=True, verbose_name="Date de début")
    date_fin = models.DateTimeField(null=True, blank=True, verbose_name="Date de fin")
    commentaire = models.TextField(blank=True, null=True, verbose_name="Commentaire sur la phase")
    
    # Métadonnées
    cree_le = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    mis_a_jour_le = models.DateTimeField(auto_now=True, verbose_name="Date de mise à jour")
    
    class Meta:
        db_table = "projets_phases_etat"
        verbose_name = "État de phase de projet"
        verbose_name_plural = "États de phases de projet"
        unique_together = ['projet', 'phase']
        ordering = ['phase__ordre']
        indexes = [
            models.Index(fields=['projet', 'phase']),
            models.Index(fields=['terminee']),
            models.Index(fields=['ignoree']),
            models.Index(fields=['date_debut']),
            models.Index(fields=['date_fin']),
        ]
    
    def __str__(self):
        return f"{self.projet.code} - {self.phase.nom} ({'Terminée' if self.terminee else 'En cours' if self.date_debut else 'En attente'})"
    
    @property
    def est_en_cours(self):
        """Vérifie si la phase est en cours (débutée mais pas terminée)"""
        return self.date_debut and not self.terminee and not self.ignoree
    
    @property
    def est_en_attente(self):
        """Vérifie si la phase est en attente (pas encore débutée)"""
        return not self.date_debut and not self.terminee and not self.ignoree
    
    @property
    def peut_etre_terminee(self):
        """Vérifie si la phase peut être terminée (toutes les étapes sont terminées ou annulées)"""
        if self.terminee or self.ignoree:
            return False
        
        # Vérifier qu'il n'y a pas d'étapes en attente ou en cours
        etapes_non_terminees = self.etapes.exclude(
            statut__in=['terminee', 'annulee']
        ).exists()
        
        return not etapes_non_terminees
    
    @property
    def etapes_en_attente_ou_en_cours(self):
        """Retourne les étapes qui ne sont pas terminées ou annulées"""
        return self.etapes.exclude(statut__in=['terminee', 'annulee'])
    
    def marquer_debut(self):
        """Marque le début de la phase"""
        if not self.date_debut:
            from django.utils import timezone
            self.date_debut = timezone.now()
            self.save(update_fields=['date_debut', 'mis_a_jour_le'])
    
    def marquer_fin(self):
        """Marque la fin de la phase"""
        # Vérifier si la phase est déjà terminée
        if self.terminee:
            from django.core.exceptions import ValidationError
            raise ValidationError(
                "Cette phase est déjà terminée."
            )
        
        # Vérifier que toutes les étapes sont terminées ou annulées
        etapes_non_terminees = self.etapes.exclude(
            statut__in=['terminee', 'annulee']
        ).exists()
        
        if etapes_non_terminees:
            from django.core.exceptions import ValidationError
            raise ValidationError(
                "Impossible de terminer cette phase car certaines étapes ne sont pas terminées ou annulées."
            )
        
        # Marquer la phase comme terminée (même si elle a déjà une date_fin)
        from django.utils import timezone
        self.date_fin = timezone.now()
        self.terminee = True
        self.save(update_fields=['date_fin', 'terminee', 'mis_a_jour_le'])


class Etape(models.Model):
    """
    Modèle pour les étapes d'une phase de projet.
    Les étapes sont des sous-tâches détaillées d'une phase.
    L'utilisateur peut ajouter, modifier ou supprimer ces étapes selon ses besoins.
    """
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('en_cours', 'En cours'),
        ('terminee', 'Terminée'),
        ('annulee', 'Annulée'),
    ]
    
    PRIORITE_CHOICES = [
        ('faible', 'Faible'),
        ('normale', 'Normale'),
        ('elevee', 'Élevée'),
        ('critique', 'Critique'),
    ]
    
    # Relations
    phase_etat = models.ForeignKey(
        ProjetPhaseEtat,
        on_delete=models.CASCADE,
        related_name='etapes',
        verbose_name="Phase du projet"
    )
    responsable = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='etapes_responsable',
        verbose_name="Responsable de l'étape"
    )
    
    # Informations de base
    nom = models.CharField(max_length=200, verbose_name="Nom de l'étape")
    description = models.TextField(blank=True, null=True, verbose_name="Description de l'étape")
    ordre = models.PositiveIntegerField(verbose_name="Ordre dans la phase")
    
    # Statut et priorité
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='en_attente',
        verbose_name="Statut de l'étape"
    )
    priorite = models.CharField(
        max_length=20,
        choices=PRIORITE_CHOICES,
        default='normale',
        verbose_name="Priorité"
    )
    
    # Dates
    date_debut_prevue = models.DateTimeField(null=True, blank=True, verbose_name="Date de début prévue")
    date_fin_prevue = models.DateTimeField(null=True, blank=True, verbose_name="Date de fin prévue")
    date_debut_reelle = models.DateTimeField(null=True, blank=True, verbose_name="Date de début réelle")
    date_fin_reelle = models.DateTimeField(null=True, blank=True, verbose_name="Date de fin réelle")
    
    # Progression
    progression_pourcentage = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name="Progression (%)"
    )
    
    # Commentaires et notes
    commentaire = models.TextField(blank=True, null=True, verbose_name="Commentaire")
    notes_internes = models.TextField(blank=True, null=True, verbose_name="Notes internes")
    
    # Métadonnées
    cree_par = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='etapes_creees',
        verbose_name="Créé par"
    )
    cree_le = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    mis_a_jour_le = models.DateTimeField(auto_now=True, verbose_name="Date de mise à jour")
    
    class Meta:
        db_table = "etapes"
        verbose_name = "Étape"
        verbose_name_plural = "Étapes"
        ordering = ['phase_etat__phase__ordre', 'ordre']
        unique_together = ['phase_etat', 'ordre']
        indexes = [
            models.Index(fields=['phase_etat', 'ordre']),
            models.Index(fields=['statut']),
            models.Index(fields=['priorite']),
            models.Index(fields=['responsable']),
            models.Index(fields=['date_debut_prevue']),
            models.Index(fields=['date_fin_prevue']),
        ]
    
    def __str__(self):
        return f"{self.phase_etat.phase.nom} - {self.nom}"
    
    @property
    def est_en_retard(self):
        """Vérifie si l'étape est en retard"""
        if not self.date_fin_prevue or self.statut == 'terminee':
            return False
        from django.utils import timezone
        return timezone.now() > self.date_fin_prevue and self.statut != 'terminee'
    
    @property
    def duree_prevue(self):
        """Calcule la durée prévue en jours"""
        if self.date_debut_prevue and self.date_fin_prevue:
            delta = self.date_fin_prevue - self.date_debut_prevue
            return delta.days
        return None
    
    @property
    def duree_reelle(self):
        """Calcule la durée réelle en jours"""
        if self.date_debut_reelle and self.date_fin_reelle:
            delta = self.date_fin_reelle - self.date_debut_reelle
            return delta.days
        return None
    
    def demarrer(self):
        """Démarre l'étape"""
        if self.statut == 'en_attente':
            from django.utils import timezone
            self.statut = 'en_cours'
            self.date_debut_reelle = timezone.now()
            self.save(update_fields=['statut', 'date_debut_reelle', 'mis_a_jour_le'])
    
    def terminer(self):
        """Termine l'étape"""
        if self.statut == 'en_cours':
            from django.utils import timezone
            self.statut = 'terminee'
            self.date_fin_reelle = timezone.now()
            self.progression_pourcentage = 100
            self.save(update_fields=['statut', 'date_fin_reelle', 'progression_pourcentage', 'mis_a_jour_le'])
    
    def annuler(self):
        """Annule l'étape"""
        self.statut = 'annulee'
        self.save(update_fields=['statut', 'mis_a_jour_le'])
