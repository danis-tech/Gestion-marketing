from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import DocumentProjet, HistoriqueDocumentProjet, CommentaireDocumentProjet
# Import des sérialiseurs depuis projects
try:
    from projects.serializers import ProjetSerializer, ProjetPhaseEtatSerializer, EtapeSerializer
except ImportError:
    # Fallback si les sérialiseurs n'existent pas
    from rest_framework import serializers
    from projects.models import Projet, ProjetPhaseEtat, Etape
    
    class ProjetSerializer(serializers.ModelSerializer):
        class Meta:
            model = Projet
            fields = ['id', 'nom', 'code', 'description', 'statut', 'priorite', 'cree_le']
    
    class ProjetPhaseEtatSerializer(serializers.ModelSerializer):
        class Meta:
            model = ProjetPhaseEtat
            fields = ['id', 'phase', 'terminee', 'est_en_cours', 'date_debut', 'date_fin']
    
    class EtapeSerializer(serializers.ModelSerializer):
        class Meta:
            model = Etape
            fields = ['id', 'nom', 'description', 'statut', 'priorite', 'date_debut', 'date_fin']

User = get_user_model()


class UserSimpleSerializer(serializers.ModelSerializer):
    """Sérialiseur simplifié pour les utilisateurs."""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class DocumentProjetListSerializer(serializers.ModelSerializer):
    """Sérialiseur pour la liste des documents de projet (version allégée)."""
    projet = serializers.StringRelatedField(read_only=True)
    cree_par = UserSimpleSerializer(read_only=True)
    depose_par = UserSimpleSerializer(read_only=True)
    phase = serializers.StringRelatedField(read_only=True)
    etape = serializers.StringRelatedField(read_only=True)
    taille_fichier_mb = serializers.ReadOnlyField()
    
    class Meta:
        model = DocumentProjet
        fields = [
            'id', 'projet', 'type_document', 'version', 'chemin_fichier',
            'statut', 'origine', 'cree_par', 'depose_par', 'phase', 'etape',
            'taille_fichier_mb', 'nom_fichier', 'cree_le'
        ]


class DocumentProjetDetailSerializer(serializers.ModelSerializer):
    """Sérialiseur détaillé pour les documents de projet."""
    projet = ProjetSerializer(read_only=True)
    cree_par = UserSimpleSerializer(read_only=True)
    depose_par = UserSimpleSerializer(read_only=True)
    phase = ProjetPhaseEtatSerializer(read_only=True)
    etape = EtapeSerializer(read_only=True)
    taille_fichier_mb = serializers.ReadOnlyField()
    est_brouillon = serializers.ReadOnlyField()
    est_final = serializers.ReadOnlyField()
    est_rejete = serializers.ReadOnlyField()
    est_genere = serializers.ReadOnlyField()
    est_manuel = serializers.ReadOnlyField()
    peut_etre_modifie = serializers.ReadOnlyField()
    peut_etre_supprime = serializers.ReadOnlyField()
    est_fiche_auto_generation = serializers.ReadOnlyField()
    est_fiche_manuel = serializers.ReadOnlyField()
    phase_associee = serializers.ReadOnlyField()
    
    class Meta:
        model = DocumentProjet
        fields = [
            'id', 'projet', 'type_document', 'version', 'chemin_fichier',
            'statut', 'origine', 'cree_par', 'depose_par', 'phase', 'etape',
            'nom_fichier', 'taille_fichier', 'taille_fichier_mb', 'description',
            'cree_le', 'est_brouillon', 'est_final', 'est_rejete', 
            'est_genere', 'est_manuel', 'peut_etre_modifie', 'peut_etre_supprime',
            'est_fiche_auto_generation', 'est_fiche_manuel', 'phase_associee'
        ]
        read_only_fields = ['cree_le']


class DocumentProjetCreateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour la création de documents de projet."""
    projet_id = serializers.IntegerField(write_only=True)
    phase_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    etape_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = DocumentProjet
        fields = [
            'projet_id', 'type_document', 'version', 'chemin_fichier',
            'statut', 'origine', 'phase_id', 'etape_id', 'nom_fichier',
            'taille_fichier', 'description'
        ]
    
    def validate_projet_id(self, value):
        """Valider que le projet existe."""
        from projects.models import Projet
        try:
            Projet.objects.get(id=value)
        except Projet.DoesNotExist:
            raise serializers.ValidationError("Ce projet n'existe pas.")
        return value
    
    def validate_phase_id(self, value):
        """Valider que la phase existe."""
        if value is not None:
            from projects.models import ProjetPhaseEtat
            try:
                ProjetPhaseEtat.objects.get(id=value)
            except ProjetPhaseEtat.DoesNotExist:
                raise serializers.ValidationError("Cette phase n'existe pas.")
        return value
    
    def validate_etape_id(self, value):
        """Valider que l'étape existe."""
        if value is not None:
            from projects.models import Etape
            try:
                Etape.objects.get(id=value)
            except Etape.DoesNotExist:
                raise serializers.ValidationError("Cette étape n'existe pas.")
        return value
    
    def create(self, validated_data):
        """Créer un nouveau document de projet."""
        # Récupérer l'utilisateur depuis le contexte
        user = self.context['request'].user
        
        # Extraire les IDs
        projet_id = validated_data.pop('projet_id')
        phase_id = validated_data.pop('phase_id', None)
        etape_id = validated_data.pop('etape_id', None)
        
        # Récupérer les objets
        from projects.models import Projet, ProjetPhaseEtat, Etape
        projet = Projet.objects.get(id=projet_id)
        phase = ProjetPhaseEtat.objects.get(id=phase_id) if phase_id else None
        etape = Etape.objects.get(id=etape_id) if etape_id else None
        
        # Déterminer qui a créé/déposé le document
        if validated_data.get('origine') == 'genere':
            validated_data['cree_par'] = user
        else:
            validated_data['depose_par'] = user
        
        # Créer le document
        document = DocumentProjet.objects.create(
            projet=projet,
            phase=phase,
            etape=etape,
            **validated_data
        )
        
        # Créer l'entrée d'historique
        HistoriqueDocumentProjet.objects.create(
            document=document,
            action='creation',
            utilisateur=user,
            description=f"Document '{document.get_type_document_display() or 'Document'}' créé"
        )
        
        return document


class DocumentProjetUpdateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour la mise à jour de documents de projet."""
    phase_id = serializers.IntegerField(required=False, allow_null=True)
    etape_id = serializers.IntegerField(required=False, allow_null=True)
    
    class Meta:
        model = DocumentProjet
        fields = [
            'type_document', 'version', 'chemin_fichier', 'statut',
            'phase_id', 'etape_id', 'nom_fichier', 'taille_fichier', 'description'
        ]
    
    def validate_phase_id(self, value):
        """Valider que la phase existe."""
        if value is not None:
            from projects.models import ProjetPhaseEtat
            try:
                ProjetPhaseEtat.objects.get(id=value)
            except ProjetPhaseEtat.DoesNotExist:
                raise serializers.ValidationError("Cette phase n'existe pas.")
        return value
    
    def validate_etape_id(self, value):
        """Valider que l'étape existe."""
        if value is not None:
            from projects.models import Etape
            try:
                Etape.objects.get(id=value)
            except Etape.DoesNotExist:
                raise serializers.ValidationError("Cette étape n'existe pas.")
        return value
    
    def update(self, instance, validated_data):
        """Mettre à jour un document de projet."""
        user = self.context['request'].user
        
        # Extraire les IDs
        phase_id = validated_data.pop('phase_id', None)
        etape_id = validated_data.pop('etape_id', None)
        
        # Récupérer les objets si fournis
        if phase_id is not None:
            from projects.models import ProjetPhaseEtat
            instance.phase = ProjetPhaseEtat.objects.get(id=phase_id) if phase_id else None
        
        if etape_id is not None:
            from projects.models import Etape
            instance.etape = Etape.objects.get(id=etape_id) if etape_id else None
        
        # Mettre à jour le document
        document = super().update(instance, validated_data)
        
        # Créer l'entrée d'historique
        HistoriqueDocumentProjet.objects.create(
            document=document,
            action='modification',
            utilisateur=user,
            description=f"Document '{document.get_type_document_display() or 'Document'}' modifié"
        )
        
        return document


class DocumentProjetStatutSerializer(serializers.ModelSerializer):
    """Sérialiseur pour le changement de statut des documents de projet."""
    
    class Meta:
        model = DocumentProjet
        fields = ['statut']
    
    def validate_statut(self, value):
        """Valider le changement de statut."""
        instance = self.instance
        if instance:
            # Vérifier les transitions autorisées
            transitions_autorisees = {
                'brouillon': ['final', 'rejete'],
                'final': ['brouillon', 'rejete'],
                'rejete': ['brouillon', 'final']
            }
            
            if value not in transitions_autorisees.get(instance.statut, []):
                raise serializers.ValidationError(
                    f"Transition de statut non autorisée de '{instance.statut}' vers '{value}'"
                )
        
        return value
    
    def update(self, instance, validated_data):
        """Mettre à jour le statut du document."""
        user = self.context['request'].user
        ancien_statut = instance.statut
        nouveau_statut = validated_data['statut']
        
        # Mettre à jour le statut
        instance.statut = nouveau_statut
        instance.save()
        
        # Créer l'entrée d'historique
        action = 'changement_statut'
        if nouveau_statut == 'final':
            action = 'validation'
        elif nouveau_statut == 'rejete':
            action = 'rejet'
        
        HistoriqueDocumentProjet.objects.create(
            document=instance,
            action=action,
            utilisateur=user,
            description=f"Statut changé de '{ancien_statut}' vers '{nouveau_statut}'",
            ancien_statut=ancien_statut,
            nouveau_statut=nouveau_statut
        )
        
        return instance


class HistoriqueDocumentProjetSerializer(serializers.ModelSerializer):
    """Sérialiseur pour l'historique des documents de projet."""
    utilisateur = UserSimpleSerializer(read_only=True)
    
    class Meta:
        model = HistoriqueDocumentProjet
        fields = [
            'id', 'action', 'utilisateur', 'description',
            'ancien_statut', 'nouveau_statut', 'date_action'
        ]
        read_only_fields = ['utilisateur', 'date_action']


class CommentaireDocumentProjetSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les commentaires de documents de projet."""
    auteur = UserSimpleSerializer(read_only=True)
    reponses = serializers.SerializerMethodField()
    
    class Meta:
        model = CommentaireDocumentProjet
        fields = [
            'id', 'auteur', 'contenu', 'parent', 'reponses',
            'date_creation', 'date_modification', 'modifie'
        ]
        read_only_fields = ['auteur', 'date_creation', 'date_modification', 'modifie']
    
    def get_reponses(self, obj):
        """Récupérer les réponses au commentaire."""
        reponses = obj.reponses.all()
        return CommentaireDocumentProjetSerializer(reponses, many=True).data


class CommentaireDocumentProjetCreateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour la création de commentaires."""
    
    class Meta:
        model = CommentaireDocumentProjet
        fields = ['contenu', 'parent']
    
    def create(self, validated_data):
        """Créer un nouveau commentaire."""
        user = self.context['request'].user
        document = self.context['document']
        
        commentaire = CommentaireDocumentProjet.objects.create(
            document=document,
            auteur=user,
            **validated_data
        )
        
        # Créer l'entrée d'historique
        HistoriqueDocumentProjet.objects.create(
            document=document,
            action='modification',
            utilisateur=user,
            description=f"Commentaire ajouté : {commentaire.contenu[:50]}..."
        )
        
        return commentaire