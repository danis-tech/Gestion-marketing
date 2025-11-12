from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
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
        ('en_cours', 'En cours'),
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
    
    def marquer_termine(self):
        """Marque le projet comme terminé et termine automatiquement toutes les phases et étapes"""
        self.statut = 'termine'
        self.save(update_fields=['statut', 'mis_a_jour_le'])
        
        # Terminer automatiquement toutes les phases non terminées
        from django.utils import timezone
        phases_non_terminees = self.phases_etat.exclude(terminee=True).exclude(ignoree=True)
        for phase_etat in phases_non_terminees:
            champs_a_mettre_a_jour = ['terminee', 'mis_a_jour_le']
            phase_etat.terminee = True
            if not phase_etat.date_debut:
                phase_etat.date_debut = timezone.now()
                champs_a_mettre_a_jour.append('date_debut')
            if not phase_etat.date_fin:
                phase_etat.date_fin = timezone.now()
                champs_a_mettre_a_jour.append('date_fin')
            phase_etat.save(update_fields=champs_a_mettre_a_jour)
            
            # Terminer automatiquement toutes les tâches de cette phase
            phase_etat.taches.exclude(statut='termine').update(
                statut='termine',
                mise_a_jour_le=timezone.now()
            )
            phase_etat.recalculer_depuis_taches()
        
        print(f"🎯 Projet '{self.nom}' marqué comme terminé - Toutes les phases et étapes terminées automatiquement")
    
    def marquer_non_termine(self):
        """Marque le projet comme non terminé"""
        self.statut = 'en_attente'
        self.save(update_fields=['statut', 'mis_a_jour_le'])
        print(f"🔄 Projet '{self.nom}' marqué comme non terminé")
    
    def peut_etre_termine(self):
        """Vérifie si le projet peut être terminé (toutes les phases sont terminées ou ignorées)"""
        # Si le projet n'a pas de phases, il peut toujours être terminé
        if not self.phases_etat.exists():
            return True
        
        # Si le projet a des phases, toutes doivent être terminées ou ignorées
        phases_non_terminees = self.phases_etat.exclude(
            terminee=True
        ).exclude(
            ignoree=True
        ).exists()
        return not phases_non_terminees
    
    @property
    def progression_globale(self):
        """Calcule la progression globale du projet basée sur les tâches des utilisateurs"""
        # Utiliser les tâches préchargées si disponibles, sinon faire une requête
        if hasattr(self, '_prefetched_objects_cache') and 'taches' in self._prefetched_objects_cache:
            toutes_les_taches = list(self._prefetched_objects_cache['taches'])
        else:
            toutes_les_taches = list(Tache.objects.filter(projet=self))
        
        if len(toutes_les_taches) == 0:
            # Si aucune tâche, calculer basé sur les phases comme fallback
            phases_etat = self.phases_etat.all()
            if not phases_etat.exists():
                return 0
            
            total_phases = phases_etat.count()
            phases_terminees = phases_etat.filter(terminee=True).count()
            phases_ignorees = phases_etat.filter(ignoree=True).count()
            phases_completes = phases_terminees + phases_ignorees
            progression = (phases_completes / total_phases * 100) if total_phases > 0 else 0
            return round(progression, 1)
        
        # Compter les tâches terminées
        taches_terminees = sum(1 for tache in toutes_les_taches if tache.statut == 'termine')
        
        # Calculer la progression basée sur les tâches
        progression = (taches_terminees / len(toutes_les_taches) * 100) if len(toutes_les_taches) > 0 else 0
        
        return round(progression, 2)
    
    @property
    def phase_actuelle(self):
        """Retourne la phase actuelle du projet (la première phase non terminée et non ignorée)"""
        phases_etat = self.phases_etat.filter(terminee=False, ignoree=False).order_by('phase__ordre')
        if phases_etat.exists():
            phase_actuelle = phases_etat.first()
            return {
                'nom': phase_actuelle.phase.nom,
                'ordre': phase_actuelle.phase.ordre,
                'progression': phase_actuelle.progression_pourcentage
            }
        # Si toutes les phases sont terminées ou ignorées, retourner la dernière phase
        derniere_phase = self.phases_etat.order_by('-phase__ordre').first()
        if derniere_phase:
            return {
                'nom': derniere_phase.phase.nom,
                'ordre': derniere_phase.phase.ordre,
                'progression': 100
            }
        return None
    
    @property
    def est_termine(self):
        """Vérifie si le projet est terminé"""
        return self.statut == 'termine'


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
        ('en_cours', 'En cours'),
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
        ('expression_besoin', 'Expression du besoin'),
        ('etudes_faisabilite', 'Études de faisabilité'),
        ('conception', 'Conception'),
        ('developpement', 'Développement / Implémentation'),
        ('lancement_commercial', 'Lancement commercial'),
        ('suppression_offre', 'Suppression d\'une offre'),
    ]
    
    # Champs d'identification
    id = models.BigAutoField(primary_key=True)
    projet = models.ForeignKey(
        Projet,
        on_delete=models.CASCADE,
        related_name='taches',
        verbose_name="Projet"
    )
    phase_etat = models.ForeignKey(
        'ProjetPhaseEtat',
        on_delete=models.CASCADE,
        related_name='taches',
        null=True,
        blank=True,
        verbose_name="Phase du projet"
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
        null=True,
        blank=True,
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
    assigne_a = models.ManyToManyField(
        User, 
        related_name='taches_assignees',
        blank=True,
        verbose_name="Assignés à"
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
            models.Index(fields=['phase_etat']),
            models.Index(fields=['statut']),
            models.Index(fields=['phase']),
            models.Index(fields=['tache_dependante']),
            models.Index(fields=['debut']),
            models.Index(fields=['fin']),
        ]
    
    def __str__(self):
        return f"{self.projet.code} - {self.titre}"
    
    def save(self, *args, **kwargs):
        # Si une phase est assignée, déduire le projet et la phase fonctionnelle
        if self.phase_etat:
            self.projet = self.phase_etat.projet
            if not self.phase:
                phase_nom = self.phase_etat.phase.nom if self.phase_etat.phase else None
                phase_mapping = {
                    'Expression du besoin': 'expression_besoin',
                    'Études de faisabilité': 'etudes_faisabilite',
                    'Conception': 'conception',
                    'Développement / Implémentation': 'developpement',
                    'Lancement commercial': 'lancement_commercial',
                    'Suppression d\'une offre': 'suppression_offre',
                }
                self.phase = phase_mapping.get(phase_nom, self.phase)
        
        # Calculer l'estimation en jours si début et fin sont définis
        if self.debut and self.fin:
            delta = self.fin - self.debut
            self.nbr_jour_estimation = delta.days
        
        # Récupérer l'ancien statut si la tâche existe déjà
        old_statut = None
        old_phase_etat_id = None
        if self.pk:
            try:
                old_instance = Tache.objects.get(pk=self.pk)
                old_statut = old_instance.statut
                old_phase_etat_id = old_instance.phase_etat_id
            except Tache.DoesNotExist:
                pass
        
        super().save(*args, **kwargs)
        
        # Mettre à jour la progression de la phase si une tâche est liée
        if self.phase_etat:
            self.phase_etat.recalculer_depuis_taches()
        
        # Si la tâche a été déplacée d'une phase à une autre, mettre à jour l'ancienne phase également
        if old_phase_etat_id and (not self.phase_etat or self.phase_etat_id != old_phase_etat_id):
            try:
                ancienne_phase = ProjetPhaseEtat.objects.get(id=old_phase_etat_id)
                ancienne_phase.recalculer_depuis_taches()
            except ProjetPhaseEtat.DoesNotExist:
                pass
    
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
            'en_cours': 50,
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
    
    def save(self, *args, **kwargs):
        # Récupérer l'ancien statut si la phase existe déjà
        old_terminee = None
        if self.pk:
            try:
                old_instance = ProjetPhaseEtat.objects.get(pk=self.pk)
                old_terminee = old_instance.terminee
            except ProjetPhaseEtat.DoesNotExist:
                pass
        
        super().save(*args, **kwargs)
        
        # Vérifier si la phase a été marquée comme terminée et si le projet doit être mis à jour
        if self.terminee and old_terminee != self.terminee:
            # Vérifier si toutes les phases du projet sont terminées
            self._verifier_et_mettre_a_jour_projet()
    
    def _verifier_et_mettre_a_jour_projet(self):
        """Vérifie si toutes les phases du projet sont terminées et met à jour le projet automatiquement"""
        if not self.projet:
            return
        
        # Récupérer toutes les phases du projet (sauf celles ignorées)
        toutes_les_phases = ProjetPhaseEtat.objects.filter(projet=self.projet).exclude(ignoree=True)
        
        # Vérifier si toutes les phases sont terminées
        toutes_terminees = toutes_les_phases.exclude(terminee=True).count() == 0
        
        if toutes_terminees and toutes_les_phases.count() > 0:
            # Si le projet n'est pas déjà terminé, le terminer automatiquement
            if self.projet.statut != 'termine':
                self.projet.statut = 'termine'
                from django.utils import timezone
                self.projet.fin = timezone.now()
                self.projet.save(update_fields=['statut', 'fin', 'mis_a_jour_le'])
    
    @property
    def est_en_cours(self):
        """Vérifie si la phase est en cours (a des tâches démarrées mais non terminées)"""
        if self.terminee or self.ignoree:
            return False
        
        return self.taches.exclude(statut__in=['en_attente', 'termine', 'rejete']).exists() or \
            self.taches.filter(statut='hors_delai').exists()
    
    @property
    def est_en_attente(self):
        """Vérifie si la phase est en attente (aucune tâche démarrée)"""
        if self.terminee or self.ignoree:
            return False
        
        if not self.taches.exists():
            return True
        
        return self.taches.filter(statut='en_attente').count() == self.taches.count()
    
    @property
    def peut_etre_terminee(self):
        """Vérifie si la phase peut être terminée (toutes les tâches sont terminées)"""
        if self.terminee or self.ignoree:
            return False
        
        if not self.taches.exists():
            return False
        
        return self.taches.exclude(statut='termine').count() == 0
    
    @property
    def progression_pourcentage(self):
        """Calcule la progression de la phase basée sur les tâches des étapes"""
        if self.terminee:
            return 100
        
        # Récupérer toutes les tâches directement liées à cette phase
        toutes_les_taches = self.taches.all()
        
        if toutes_les_taches.count() == 0:
            return 0
        
        # Compter les tâches terminées
        taches_terminees = toutes_les_taches.filter(statut='termine').count()
        
        # Calculer la progression basée sur les tâches
        progression = (taches_terminees / toutes_les_taches.count() * 100) if toutes_les_taches.count() > 0 else 0
        
        return round(progression, 2)
    
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
        
        # Vérifier que toutes les tâches sont terminées
        taches_non_terminees = self.taches.exclude(statut='termine').exists()
        
        if taches_non_terminees:
            from django.core.exceptions import ValidationError
            raise ValidationError(
                "Impossible de terminer cette phase car certaines tâches ne sont pas terminées."
            )
        
        # Marquer la phase comme terminée (même si elle a déjà une date_fin)
        from django.utils import timezone
        self.date_fin = timezone.now()
        self.terminee = True
        self.save(update_fields=['date_fin', 'terminee', 'mis_a_jour_le'])

    def recalculer_depuis_taches(self):
        """Met à jour automatiquement le statut et les dates de la phase en fonction des tâches"""
        from django.utils import timezone
        
        taches = self.taches.all()
        total_taches = taches.count()
        if total_taches == 0:
            # Si aucune tâche n'est liée, on ne touche pas au statut automatiquement
            return
        
        terminees = taches.filter(statut='termine').count()
        en_attente = taches.filter(statut='en_attente').count()
        en_cours = total_taches - terminees - en_attente
        
        champs_a_mettre_a_jour = set()
        maintenant = timezone.now()
        
        # Définir la date de début si nécessaire (au moins une tâche démarrée)
        if (en_cours > 0 or terminees > 0) and not self.date_debut:
            self.date_debut = maintenant
            champs_a_mettre_a_jour.add('date_debut')
        
        # Gestion du statut terminee / date_fin
        toutes_terminees = terminees == total_taches
        if toutes_terminees and not self.ignoree:
            if not self.terminee:
                self.terminee = True
                champs_a_mettre_a_jour.add('terminee')
            if not self.date_fin:
                self.date_fin = maintenant
                champs_a_mettre_a_jour.add('date_fin')
        else:
            if self.terminee and not self.ignoree:
                self.terminee = False
                champs_a_mettre_a_jour.add('terminee')
            if self.date_fin and not toutes_terminees:
                self.date_fin = None
                champs_a_mettre_a_jour.add('date_fin')
        
        if champs_a_mettre_a_jour:
            champs_a_mettre_a_jour.add('mis_a_jour_le')
            self.save(update_fields=list(champs_a_mettre_a_jour))
        
        # Vérifier si toutes les phases du projet sont terminées et mettre à jour le projet automatiquement
        if toutes_terminees and not self.ignoree:
            projet = self.projet
            if projet and projet.statut != 'termine':
                # Vérifier si toutes les phases sont terminées ou ignorées
                phases_non_terminees = projet.phases_etat.exclude(terminee=True).exclude(ignoree=True).exists()
                if not phases_non_terminees:
                    # Toutes les phases sont terminées, mettre à jour le projet automatiquement
                    projet.statut = 'termine'
                    if not projet.fin:
                        projet.fin = timezone.now()
                    projet.save(update_fields=['statut', 'fin', 'mis_a_jour_le'])
