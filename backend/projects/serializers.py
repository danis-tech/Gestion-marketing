from rest_framework import serializers
from .models import Projet, MembreProjet, HistoriqueEtat, PermissionProjet, PhaseProjet, ProjetPhaseEtat, Etape
from accounts.serializers import UserListSerializer, ServiceSerializer
from .email_service import ProjectEmailService
from .models import Tache


class MembreProjetSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les membres d'un projet."""
    utilisateur = UserListSerializer(read_only=True)
    service = ServiceSerializer(read_only=True)
    
    class Meta:
        model = MembreProjet
        fields = [
            'id', 'projet', 'utilisateur', 'service', 'role_projet', 'ajoute_le'
        ]
        read_only_fields = ['ajoute_le']


class MembreProjetCreateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour créer un membre de projet."""
    
    class Meta:
        model = MembreProjet
        fields = ['utilisateur', 'service', 'role_projet']
    
    def validate(self, data):
        """Validation personnalisée."""
        projet = self.context.get('projet')
        utilisateur = data.get('utilisateur')
        
        if projet and utilisateur:
            # Vérifier si le membre existe déjà
            if MembreProjet.objects.filter(projet=projet, utilisateur=utilisateur).exists():
                raise serializers.ValidationError(
                    f"L'utilisateur est déjà membre de ce projet."
                )
        
        return data
    
    def create(self, validated_data):
        # Assigner automatiquement le projet
        validated_data['projet'] = self.context['projet']
        membre = super().create(validated_data)
        
        # Envoyer un email de notification pour l'ajout à un projet
        try:
            from accounts.email_service import TeamEmailService
            added_by = self.context.get('request').user if self.context.get('request') else None
            
            # Envoyer l'email avec les informations du projet
            TeamEmailService.send_team_assignment_notification(
                membre.utilisateur,
                membre.service or membre.utilisateur.service,  # Utiliser le service du membre ou de l'utilisateur
                added_by,
                project=membre.projet
            )
        except Exception as e:
            print(f"Erreur lors de l'envoi de l'email d'ajout au projet : {str(e)}")
        
        return membre


class HistoriqueEtatSerializer(serializers.ModelSerializer):
    """Sérialiseur pour l'historique des états."""
    par_utilisateur = UserListSerializer(read_only=True)
    
    class Meta:
        model = HistoriqueEtat
        fields = [
            'id', 'projet', 'de_etat', 'vers_etat', 'par_utilisateur', 'effectue_le'
        ]
        read_only_fields = ['effectue_le']


class ProjetListSerializer(serializers.ModelSerializer):
    """Sérialiseur pour la liste des projets avec tous les champs nécessaires au tableau."""
    proprietaire = UserListSerializer(read_only=True)
    nombre_membres = serializers.SerializerMethodField()
    
    # Champs calculés pour l'affichage
    chef_projet = serializers.SerializerMethodField()
    service = serializers.SerializerMethodField()
    
    class Meta:
        model = Projet
        fields = [
            'id', 'code', 'nom', 'description', 'objectif', 'budget',
            'type', 'statut', 'priorite', 'etat', 'proprietaire', 
            'debut', 'fin', 'estimation_jours', 'nom_createur',
            'cree_le', 'mis_a_jour_le', 'nombre_membres',
            'chef_projet', 'service'
        ]
    
    def get_nombre_membres(self, obj):
        return obj.membres.count()
    
    def get_chef_projet(self, obj):
        """Récupérer le chef de projet (propriétaire ou nom_createur)"""
        if obj.nom_createur:
            return obj.nom_createur
        elif obj.proprietaire:
            return f"{obj.proprietaire.prenom} {obj.proprietaire.nom}"
        return None
    
    def get_service(self, obj):
        """Récupérer le service du projet (type ou service du propriétaire)"""
        if obj.type:
            return obj.type
        elif obj.proprietaire and obj.proprietaire.service:
            return obj.proprietaire.service.nom
        return None


class ProjetDetailSerializer(serializers.ModelSerializer):
    """Sérialiseur détaillé pour un projet."""
    proprietaire = UserListSerializer(read_only=True)
    membres = MembreProjetSerializer(many=True, read_only=True)
    historiques_etat = HistoriqueEtatSerializer(many=True, read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    priorite_display = serializers.CharField(source='get_priorite_display', read_only=True)
    etat_display = serializers.CharField(source='get_etat_display', read_only=True)
    
    class Meta:
        model = Projet
        fields = [
            'id', 'code', 'nom', 'nom_createur', 'description', 'objectif', 'budget',
            'type', 'statut', 'statut_display', 'priorite', 'priorite_display',
            'etat', 'etat_display', 'proprietaire', 'debut', 'fin', 'estimation_jours',
            'cree_le', 'mis_a_jour_le', 'nom_update', 'membres', 'historiques_etat'
        ]


class ProjetCreateUpdateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour créer/modifier un projet."""
    
    class Meta:
        model = Projet
        fields = [
            'code', 'nom', 'nom_createur', 'description', 'objectif', 'budget',
            'type', 'statut', 'priorite', 'etat', 'debut', 'fin', 'estimation_jours',
            'proprietaire'
        ]
    
    def create(self, validated_data):
        # Si aucun propriétaire n'est spécifié, utiliser l'utilisateur connecté
        if 'proprietaire' not in validated_data or not validated_data['proprietaire']:
            validated_data['proprietaire'] = self.context['request'].user
        
        # Créer le projet
        projet = super().create(validated_data)
        
        # Envoyer l'email de notification au responsable
        try:
            responsable = projet.proprietaire
            if responsable and responsable.email:
                ProjectEmailService.send_project_created_notification(projet, responsable)
        except Exception as e:
            # Ne pas faire échouer la création du projet si l'email échoue
            print(f"Erreur lors de l'envoi de l'email de notification : {str(e)}")
        
        return projet
    
    def update(self, instance, validated_data):
        # Enregistrer qui a fait la modification
        validated_data['nom_update'] = self.context['request'].user.prenom
        return super().update(instance, validated_data)


class ProjetStatutUpdateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour mettre à jour le statut d'un projet."""
    ancien_statut = serializers.CharField(read_only=True)
    
    class Meta:
        model = Projet
        fields = ['statut', 'ancien_statut']
    
    def update(self, instance, validated_data):
        # Sauvegarder l'ancien statut
        self.ancien_statut = instance.statut
        
        # Mettre à jour le statut
        instance = super().update(instance, validated_data)
        
        # Créer un historique du changement
        from .models import HistoriqueEtat
        HistoriqueEtat.objects.create(
            projet=instance,
            de_etat=self.ancien_statut,
            vers_etat=instance.statut,
            par_utilisateur=self.context['request'].user
        )
        
        return instance


class ProjetStatsSerializer(serializers.Serializer):
    """Sérialiseur pour les statistiques des projets."""
    total_projets = serializers.IntegerField()
    projets_par_statut = serializers.DictField()
    projets_par_priorite = serializers.DictField()
    
    # Par type
    types_projets = serializers.DictField()


# Sérialiseurs pour les permissions
class PermissionProjetSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les permissions de projet."""
    utilisateur = UserListSerializer(read_only=True)
    accordee_par = UserListSerializer(read_only=True)
    permission_display = serializers.CharField(source='get_permission_display', read_only=True)
    
    class Meta:
        model = PermissionProjet
        fields = [
            'id', 'projet', 'utilisateur', 'permission', 'permission_display',
            'accordee_par', 'accordee_le', 'active'
        ]
        read_only_fields = ['accordee_le']


class PermissionProjetCreateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour créer une permission de projet."""
    
    class Meta:
        model = PermissionProjet
        fields = ['utilisateur', 'permission']
    
    def create(self, validated_data):
        # Assigner automatiquement qui accorde la permission
        validated_data['accordee_par'] = self.context['request'].user
        validated_data['projet'] = self.context['projet']
        return super().create(validated_data)


class PermissionProjetUpdateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour modifier une permission de projet."""
    
    class Meta:
        model = PermissionProjet
        fields = ['permission', 'active']
    
    def update(self, instance, validated_data):
        # Si on change le type de permission, on doit d'abord supprimer l'ancienne
        # pour éviter les conflits de contrainte unique
        if 'permission' in validated_data and validated_data['permission'] != instance.permission:
            # Supprimer l'ancienne permission
            instance.delete()
            # Créer une nouvelle permission avec les nouvelles données
            validated_data['projet'] = instance.projet
            validated_data['utilisateur'] = instance.utilisateur
            validated_data['accordee_par'] = instance.accordee_par
            return PermissionProjet.objects.create(**validated_data)
        
        # Sinon, faire une mise à jour normale
        return super().update(instance, validated_data)


class UtilisateurPermissionsSerializer(serializers.Serializer):
    """Sérialiseur pour afficher les permissions d'un utilisateur sur un projet."""
    utilisateur = UserListSerializer()
    permissions = serializers.ListField(child=serializers.CharField())
    permissions_details = PermissionProjetSerializer(many=True)


class TacheListSerializer(serializers.ModelSerializer):
    """Sérialiseur pour la liste des tâches."""
    projet_code = serializers.CharField(source='projet.code', read_only=True)
    projet_nom = serializers.CharField(source='projet.nom', read_only=True)
    projet = serializers.SerializerMethodField()
    assigne_a = UserListSerializer(read_only=True)
    tache_dependante = serializers.CharField(source='tache_dependante.titre', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    priorite_display = serializers.CharField(source='get_priorite_display', read_only=True)
    phase_display = serializers.CharField(source='get_phase_display', read_only=True)
    est_en_retard = serializers.BooleanField(read_only=True)
    progression = serializers.IntegerField(read_only=True)
    
    def get_projet(self, obj):
        """Retourne un objet projet avec code et nom"""
        if obj.projet:
            return {
                'code': obj.projet.code,
                'nom': obj.projet.nom
            }
        return None
    
    class Meta:
        model = Tache
        fields = [
            'id', 'projet', 'projet_code', 'projet_nom', 'titre', 'description', 'statut', 'statut_display', 'priorite', 
            'priorite_display', 'phase', 'phase_display', 'debut', 'fin',
            'nbr_jour_estimation', 'assigne_a', 'tache_dependante', 
            'cree_le', 'mise_a_jour_le', 'est_en_retard', 'progression'
        ]


class TacheDetailSerializer(serializers.ModelSerializer):
    """Sérialiseur détaillé pour une tâche."""
    projet_code = serializers.CharField(source='projet.code', read_only=True)
    projet_nom = serializers.CharField(source='projet.nom', read_only=True)
    projet = serializers.SerializerMethodField()
    assigne_a = UserListSerializer(read_only=True)
    tache_dependante = TacheListSerializer(read_only=True)
    taches_dependantes = TacheListSerializer(many=True, read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    priorite_display = serializers.CharField(source='get_priorite_display', read_only=True)
    phase_display = serializers.CharField(source='get_phase_display', read_only=True)
    est_en_retard = serializers.BooleanField(read_only=True)
    progression = serializers.IntegerField(read_only=True)
    
    def get_projet(self, obj):
        """Retourne un objet projet avec code et nom"""
        if obj.projet:
            return {
                'code': obj.projet.code,
                'nom': obj.projet.nom
            }
        return None
    
    class Meta:
        model = Tache
        fields = [
            'id', 'projet', 'projet_code', 'projet_nom', 'titre', 'description', 'statut', 'statut_display', 'priorite', 
            'priorite_display', 'phase', 'phase_display', 'debut', 'fin',
            'nbr_jour_estimation', 'assigne_a', 'tache_dependante', 
            'taches_dependantes', 'cree_le', 'mise_a_jour_le', 
            'est_en_retard', 'progression'
        ]


class TacheCreateUpdateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour créer/modifier une tâche."""
    
    class Meta:
        model = Tache
        fields = [
            'projet', 'titre', 'description', 'statut', 'priorite', 'phase', 'debut', 'fin',
            'assigne_a', 'tache_dependante'
        ]
    
    def validate(self, data):
        """
        Validation personnalisée pour les tâches.
        """
        # Vérifier que la tâche dépendante appartient au même projet
        if 'tache_dependante' in data and data['tache_dependante'] and 'projet' in data and data['projet']:
            try:
                from .models import Tache
                # Gérer le cas où tache_dependante est un objet ou un ID
                tache_dependante_id = data['tache_dependante'].id if hasattr(data['tache_dependante'], 'id') else data['tache_dependante']
                tache_dependante = Tache.objects.get(id=tache_dependante_id)
                
                # Gérer le cas où projet est un objet ou un ID
                projet_id = data['projet'].id if hasattr(data['projet'], 'id') else data['projet']
                
                if tache_dependante.projet.id != projet_id:
                    raise serializers.ValidationError(
                        "La tâche dépendante doit appartenir au même projet."
                    )
            except Tache.DoesNotExist:
                raise serializers.ValidationError(
                    "La tâche dépendante spécifiée n'existe pas."
                )
        
        # Vérifier que les dates sont cohérentes
        if 'debut' in data and 'fin' in data and data['debut'] and data['fin']:
            if data['debut'] > data['fin']:
                raise serializers.ValidationError(
                    "La date de début ne peut pas être postérieure à la date de fin."
                )
        
        return data


class TacheStatutUpdateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour mettre à jour le statut d'une tâche."""
    
    class Meta:
        model = Tache
        fields = ['statut']
    
    def validate_statut(self, value):
        """
        Validation du changement de statut.
        """
        instance = self.instance
        if instance and instance.statut == 'termine' and value != 'termine':
            raise serializers.ValidationError(
                "Une tâche terminée ne peut pas changer de statut."
            )
        return value


# Sérialiseurs pour les phases de projet
class PhaseProjetSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les phases de projet."""
    
    class Meta:
        model = PhaseProjet
        fields = [
            'id', 'nom', 'ordre', 'description', 'active'
        ]
        read_only_fields = ['id']


class ProjetPhaseEtatSerializer(serializers.ModelSerializer):
    """Sérialiseur pour l'état des phases d'un projet."""
    phase = PhaseProjetSerializer(read_only=True)
    phase_id = serializers.IntegerField(write_only=True)
    est_en_cours = serializers.BooleanField(read_only=True)
    est_en_attente = serializers.BooleanField(read_only=True)
    peut_etre_terminee = serializers.BooleanField(read_only=True)
    etapes_en_attente_ou_en_cours = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjetPhaseEtat
        fields = [
            'id', 'phase', 'phase_id', 'terminee', 'ignoree', 
            'date_debut', 'date_fin', 'commentaire', 'est_en_cours', 
            'est_en_attente', 'peut_etre_terminee', 'etapes_en_attente_ou_en_cours',
            'cree_le', 'mis_a_jour_le'
        ]
        read_only_fields = ['cree_le', 'mis_a_jour_le']
    
    def get_etapes_en_attente_ou_en_cours(self, obj):
        """Retourne les étapes non terminées avec leurs détails"""
        etapes = obj.etapes_en_attente_ou_en_cours
        return EtapeSerializer(etapes, many=True).data
    
    def validate_phase_id(self, value):
        """Valider que la phase existe."""
        try:
            PhaseProjet.objects.get(id=value, active=True)
        except PhaseProjet.DoesNotExist:
            raise serializers.ValidationError("Cette phase n'existe pas ou n'est pas active.")
        return value
    
    def create(self, validated_data):
        """Créer un nouvel état de phase."""
        phase_id = validated_data.pop('phase_id')
        phase = PhaseProjet.objects.get(id=phase_id)
        validated_data['phase'] = phase
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Mettre à jour un état de phase."""
        if 'phase_id' in validated_data:
            phase_id = validated_data.pop('phase_id')
            phase = PhaseProjet.objects.get(id=phase_id)
            validated_data['phase'] = phase
        return super().update(instance, validated_data)


class ProjetPhaseEtatUpdateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour mettre à jour l'état d'une phase."""
    
    class Meta:
        model = ProjetPhaseEtat
        fields = [
            'terminee', 'ignoree', 'date_debut', 'date_fin', 'commentaire'
        ]
    
    def validate(self, data):
        """Validation personnalisée."""
        # Vérifier que les dates sont cohérentes
        if 'date_debut' in data and 'date_fin' in data:
            if data['date_debut'] and data['date_fin'] and data['date_debut'] > data['date_fin']:
                raise serializers.ValidationError(
                    "La date de début ne peut pas être postérieure à la date de fin."
                )
        
        # Vérifier la cohérence des états
        if 'terminee' in data and 'ignoree' in data:
            if data['terminee'] and data['ignoree']:
                raise serializers.ValidationError(
                    "Une phase ne peut pas être à la fois terminée et ignorée."
                )
        
        return data


class ProjetDetailWithPhasesSerializer(ProjetDetailSerializer):
    """Sérialiseur détaillé pour un projet avec les phases."""
    phases_etat = ProjetPhaseEtatSerializer(many=True, read_only=True)
    
    class Meta(ProjetDetailSerializer.Meta):
        fields = ProjetDetailSerializer.Meta.fields + ['phases_etat']


# Sérialiseurs pour les étapes
class EtapeSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les étapes d'une phase."""
    responsable = UserListSerializer(read_only=True)
    responsable_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    cree_par = UserListSerializer(read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    priorite_display = serializers.CharField(source='get_priorite_display', read_only=True)
    est_en_retard = serializers.BooleanField(read_only=True)
    duree_prevue = serializers.IntegerField(read_only=True)
    duree_reelle = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Etape
        fields = [
            'id', 'nom', 'description', 'ordre', 'statut', 'statut_display',
            'priorite', 'priorite_display', 'responsable', 'responsable_id',
            'date_debut_prevue', 'date_fin_prevue', 'date_debut_reelle', 'date_fin_reelle',
            'progression_pourcentage', 'commentaire', 'notes_internes',
            'cree_par', 'cree_le', 'mis_a_jour_le', 'est_en_retard',
            'duree_prevue', 'duree_reelle'
        ]
        read_only_fields = ['cree_le', 'mis_a_jour_le', 'cree_par']
    
    def validate_responsable_id(self, value):
        """Valider que le responsable existe."""
        if value is not None:
            try:
                User.objects.get(id=value)
            except User.DoesNotExist:
                raise serializers.ValidationError("Cet utilisateur n'existe pas.")
        return value
    
    def validate(self, data):
        """Validation personnalisée."""
        # Vérifier que les dates sont cohérentes
        if 'date_debut_prevue' in data and 'date_fin_prevue' in data:
            if (data.get('date_debut_prevue') and data.get('date_fin_prevue') and 
                data['date_debut_prevue'] > data['date_fin_prevue']):
                raise serializers.ValidationError(
                    "La date de début prévue ne peut pas être postérieure à la date de fin prévue."
                )
        
        if 'date_debut_reelle' in data and 'date_fin_reelle' in data:
            if (data.get('date_debut_reelle') and data.get('date_fin_reelle') and 
                data['date_debut_reelle'] > data['date_fin_reelle']):
                raise serializers.ValidationError(
                    "La date de début réelle ne peut pas être postérieure à la date de fin réelle."
                )
        
        # Vérifier la progression
        if 'progression_pourcentage' in data:
            if not (0 <= data['progression_pourcentage'] <= 100):
                raise serializers.ValidationError(
                    "La progression doit être entre 0 et 100%."
                )
        
        return data
    
    def create(self, validated_data):
        """Créer une nouvelle étape."""
        # Assigner automatiquement qui crée l'étape
        validated_data['cree_par'] = self.context['request'].user
        
        # Gérer le responsable
        if 'responsable_id' in validated_data:
            responsable_id = validated_data.pop('responsable_id')
            if responsable_id:
                validated_data['responsable'] = User.objects.get(id=responsable_id)
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Mettre à jour une étape."""
        # Gérer le responsable
        if 'responsable_id' in validated_data:
            responsable_id = validated_data.pop('responsable_id')
            if responsable_id:
                validated_data['responsable'] = User.objects.get(id=responsable_id)
            else:
                validated_data['responsable'] = None
        
        return super().update(instance, validated_data)


class EtapeCreateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour créer une étape."""
    responsable_id = serializers.IntegerField(required=False, allow_null=True)
    
    class Meta:
        model = Etape
        fields = [
            'nom', 'description', 'ordre', 'priorite', 'responsable_id',
            'date_debut_prevue', 'date_fin_prevue', 'commentaire'
        ]
    
    def validate_ordre(self, value):
        """Valider l'ordre dans la phase."""
        phase_etat = self.context.get('phase_etat')
        if phase_etat:
            # Vérifier que l'ordre n'existe pas déjà dans cette phase
            if Etape.objects.filter(phase_etat=phase_etat, ordre=value).exists():
                raise serializers.ValidationError(
                    "Une étape avec cet ordre existe déjà dans cette phase."
                )
        return value
    
    def create(self, validated_data):
        """Créer une nouvelle étape."""
        # Assigner automatiquement qui crée l'étape
        validated_data['cree_par'] = self.context['request'].user
        validated_data['phase_etat'] = self.context['phase_etat']
        
        # Gérer le responsable
        if 'responsable_id' in validated_data:
            responsable_id = validated_data.pop('responsable_id')
            if responsable_id:
                from accounts.models import User
                validated_data['responsable'] = User.objects.get(id=responsable_id)
        
        return super().create(validated_data)


class EtapeUpdateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour mettre à jour une étape."""
    responsable_id = serializers.IntegerField(required=False, allow_null=True)
    
    class Meta:
        model = Etape
        fields = [
            'nom', 'description', 'ordre', 'statut', 'priorite', 'responsable_id',
            'date_debut_prevue', 'date_fin_prevue', 'date_debut_reelle', 'date_fin_reelle',
            'progression_pourcentage', 'commentaire', 'notes_internes'
        ]
    
    def validate_ordre(self, value):
        """Valider l'ordre dans la phase."""
        instance = self.instance
        if instance and instance.phase_etat:
            # Vérifier que l'ordre n'existe pas déjà dans cette phase (sauf pour l'instance actuelle)
            if Etape.objects.filter(phase_etat=instance.phase_etat, ordre=value).exclude(id=instance.id).exists():
                raise serializers.ValidationError(
                    "Une étape avec cet ordre existe déjà dans cette phase."
                )
        return value


class ProjetPhaseEtatWithEtapesSerializer(ProjetPhaseEtatSerializer):
    """Sérialiseur pour une phase avec ses étapes."""
    etapes = EtapeSerializer(many=True, read_only=True)
    
    class Meta(ProjetPhaseEtatSerializer.Meta):
        fields = ProjetPhaseEtatSerializer.Meta.fields + ['etapes']
