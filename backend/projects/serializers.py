from rest_framework import serializers
from .models import Projet, MembreProjet, HistoriqueEtat, PermissionProjet
from accounts.serializers import UserListSerializer, ServiceSerializer
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
        return super().create(validated_data)


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
            'type', 'statut', 'priorite', 'etat', 'debut', 'fin', 'estimation_jours'
        ]
    
    def create(self, validated_data):
        # Assigner automatiquement le propriétaire
        validated_data['proprietaire'] = self.context['request'].user
        return super().create(validated_data)
    
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
