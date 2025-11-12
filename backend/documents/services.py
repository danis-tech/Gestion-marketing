from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import DocumentProjet, HistoriqueDocumentProjet
from .utils import TemplateManager
from .mappers import FicheDataMapper
from projects.models import Projet, ProjetPhaseEtat
import os

User = get_user_model()


class FicheGenerationService:
    """
    Service pour la génération automatique des fiches de projet.
    """
    
    @staticmethod
    def generer_fiche_projet_marketing(projet, utilisateur=None):
        """
        Génère la fiche projet marketing lors de la création du projet.
        """
        if not utilisateur:
            utilisateur = projet.proprietaire
        
        # Vérifier si la fiche existe déjà
        if DocumentProjet.objects.filter(
            projet=projet, 
            type_document='fiche_projet_marketing'
        ).exists():
            return None
        
        # Créer la fiche
        fiche = DocumentProjet.objects.create(
            projet=projet,
            type_document='fiche_projet_marketing',
            version=1,
            chemin_fichier=f"fiches/projet_{projet.id}/fiche_projet_marketing_v1.pdf",
            statut='brouillon',
            origine='manuel',
            depose_par=utilisateur,
            nom_fichier="Fiche projet marketing.pdf",
            description="Fiche contenant les informations initiales du projet (contexte, objectifs, service demandeur, etc.)"
        )
        
        # Créer l'historique
        HistoriqueDocumentProjet.objects.create(
            document=fiche,
            action='creation',
            utilisateur=utilisateur,
            description="Fiche projet marketing créée automatiquement à la création du projet"
        )
        
        return fiche
    
    @staticmethod
    def generer_fiche_plan_projet(projet, utilisateur=None):
        """
        Génère la fiche plan projet après validation du besoin par le RDM.
        """
        if not utilisateur:
            utilisateur = projet.proprietaire
        
        # Vérifier si la fiche existe déjà
        if DocumentProjet.objects.filter(
            projet=projet, 
            type_document='fiche_plan_projet'
        ).exists():
            return None
        
        # Créer la fiche
        fiche = DocumentProjet.objects.create(
            projet=projet,
            type_document='fiche_plan_projet',
            version=1,
            chemin_fichier=f"fiches/projet_{projet.id}/fiche_plan_projet_v1.pdf",
            statut='brouillon',
            origine='genere',
            cree_par=utilisateur,
            nom_fichier="Fiche plan projet.pdf",
            description="Fiche contenant le planning prévisionnel, les jalons, et les membres affectés"
        )
        
        # Créer l'historique
        HistoriqueDocumentProjet.objects.create(
            document=fiche,
            action='creation',
            utilisateur=utilisateur,
            description="Fiche plan projet générée automatiquement après validation du besoin"
        )
        
        return fiche
    
    @staticmethod
    def generer_fiches_etudes_faisabilite(projet, utilisateur=None):
        """
        Génère les fiches d'études de faisabilité pour la phase 2.
        """
        if not utilisateur:
            utilisateur = projet.proprietaire
        
        fiches_crees = []
        types_fiches = ['fiche_etude_si', 'fiche_etude_technique', 'fiche_etude_financiere']
        
        for type_fiche in types_fiches:
            # Vérifier si la fiche existe déjà
            if DocumentProjet.objects.filter(
                projet=projet, 
                type_document=type_fiche
            ).exists():
                continue
            
            # Créer la fiche
            fiche = DocumentProjet.objects.create(
                projet=projet,
                type_document=type_fiche,
                version=1,
                chemin_fichier=f"fiches/projet_{projet.id}/{type_fiche}_v1.pdf",
                statut='brouillon',
                origine='manuel',
                depose_par=utilisateur,
                nom_fichier=f"Fiche {type_fiche.replace('_', ' ').title()}.pdf",
                description=f"Fiche d'étude de faisabilité - {type_fiche.replace('_', ' ').title()}"
            )
            
            # Créer l'historique
            HistoriqueDocumentProjet.objects.create(
                document=fiche,
                action='creation',
                utilisateur=utilisateur,
                description=f"Fiche {type_fiche} créée pour les études de faisabilité"
            )
            
            fiches_crees.append(fiche)
        
        return fiches_crees
    
    @staticmethod
    def generer_fiche_specifications_marketing(projet, utilisateur=None):
        """
        Génère la fiche de spécifications marketing après validation des études.
        """
        if not utilisateur:
            utilisateur = projet.proprietaire
        
        # Vérifier si la fiche existe déjà
        if DocumentProjet.objects.filter(
            projet=projet, 
            type_document='fiche_specifications_marketing'
        ).exists():
            return None
        
        # Créer la fiche
        fiche = DocumentProjet.objects.create(
            projet=projet,
            type_document='fiche_specifications_marketing',
            version=1,
            chemin_fichier=f"fiches/projet_{projet.id}/fiche_specifications_marketing_v1.pdf",
            statut='brouillon',
            origine='genere',
            cree_par=utilisateur,
            nom_fichier="Fiche spécifications marketing.pdf",
            description="Fiche de spécifications marketing générée après validation des études"
        )
        
        # Créer l'historique
        HistoriqueDocumentProjet.objects.create(
            document=fiche,
            action='creation',
            utilisateur=utilisateur,
            description="Fiche spécifications marketing générée automatiquement après validation des études"
        )
        
        return fiche
    
    @staticmethod
    def generer_fiches_implementation(projet, utilisateur=None):
        """
        Génère les fiches d'implémentation pour la phase 4.
        """
        if not utilisateur:
            utilisateur = projet.proprietaire
        
        fiches_crees = []
        types_fiches = ['fiche_implementation', 'fiche_recette_uat']
        
        for type_fiche in types_fiches:
            # Vérifier si la fiche existe déjà
            if DocumentProjet.objects.filter(
                projet=projet, 
                type_document=type_fiche
            ).exists():
                continue
            
            # Déterminer l'origine
            origine = 'manuel' if type_fiche == 'fiche_implementation' else 'genere'
            
            # Créer la fiche
            fiche = DocumentProjet.objects.create(
                projet=projet,
                type_document=type_fiche,
                version=1,
                chemin_fichier=f"fiches/projet_{projet.id}/{type_fiche}_v1.pdf",
                statut='brouillon',
                origine=origine,
                cree_par=utilisateur if origine == 'genere' else None,
                depose_par=utilisateur if origine == 'manuel' else None,
                nom_fichier=f"Fiche {type_fiche.replace('_', ' ').title()}.pdf",
                description=f"Fiche d'implémentation - {type_fiche.replace('_', ' ').title()}"
            )
            
            # Créer l'historique
            HistoriqueDocumentProjet.objects.create(
                document=fiche,
                action='creation',
                utilisateur=utilisateur,
                description=f"Fiche {type_fiche} créée pour l'implémentation"
            )
            
            fiches_crees.append(fiche)
        
        return fiches_crees
    
    @staticmethod
    def generer_fiche_lancement_commercial(projet, utilisateur=None):
        """
        Génère la fiche de lancement commercial après saisie du kit de vente.
        """
        if not utilisateur:
            utilisateur = projet.proprietaire
        
        # Vérifier si la fiche existe déjà
        if DocumentProjet.objects.filter(
            projet=projet, 
            type_document='fiche_lancement_commercial'
        ).exists():
            return None
        
        # Créer la fiche
        fiche = DocumentProjet.objects.create(
            projet=projet,
            type_document='fiche_lancement_commercial',
            version=1,
            chemin_fichier=f"fiches/projet_{projet.id}/fiche_lancement_commercial_v1.pdf",
            statut='brouillon',
            origine='genere',
            cree_par=utilisateur,
            nom_fichier="Fiche lancement commercial.pdf",
            description="Fiche de lancement commercial générée après saisie du kit de vente"
        )
        
        # Créer l'historique
        HistoriqueDocumentProjet.objects.create(
            document=fiche,
            action='creation',
            utilisateur=utilisateur,
            description="Fiche lancement commercial générée automatiquement après saisie du kit de vente"
        )
        
        return fiche
    
    @staticmethod
    def generer_fiche_suppression(projet, utilisateur=None):
        """
        Génère la fiche de suppression si un projet est marqué comme "à supprimer".
        """
        if not utilisateur:
            utilisateur = projet.proprietaire
        
        # Vérifier si la fiche existe déjà
        if DocumentProjet.objects.filter(
            projet=projet, 
            type_document='fiche_suppression'
        ).exists():
            return None
        
        # Créer la fiche
        fiche = DocumentProjet.objects.create(
            projet=projet,
            type_document='fiche_suppression',
            version=1,
            chemin_fichier=f"fiches/projet_{projet.id}/fiche_suppression_v1.pdf",
            statut='brouillon',
            origine='manuel',
            depose_par=utilisateur,
            nom_fichier="Fiche suppression.pdf",
            description="Fiche de suppression générée manuellement pour un projet marqué comme 'à supprimer'"
        )
        
        # Créer l'historique
        HistoriqueDocumentProjet.objects.create(
            document=fiche,
            action='creation',
            utilisateur=utilisateur,
            description="Fiche suppression créée manuellement"
        )
        
        return fiche
    
    # Méthode generer_fiches_bilan supprimée - non utilisée
    
    # Méthode generer_fiches_phase supprimée - non utilisée


class PDFGenerationService:
    """
    Service pour la génération de PDF à partir des fiches.
    """
    
    def __init__(self):
        self.template_manager = TemplateManager()
    
    def generate_pdf_for_document(self, document, utilisateur=None):
        """
        Génère un PDF pour un document existant.
        """
        try:
            # Récupérer les données selon le type de document
            data = self._get_data_for_document_type(document)
            
            # Générer le nom du fichier de sortie
            output_filename = f"{document.type_document}_{document.projet.code}_{document.version}.pdf"
            
            # Générer le PDF
            result = self.template_manager.generate_document(
                document.type_document,
                data,
                output_filename
            )
            
            if result['success']:
                # Mettre à jour le document avec le chemin du PDF généré
                document.chemin_fichier = result['file_path']
                document.taille_fichier = result['file_size']
                document.nom_fichier = result['filename']
                document.save()
                
                # Créer l'entrée d'historique
                HistoriqueDocumentProjet.objects.create(
                    document=document,
                    action='upload',
                    utilisateur=utilisateur or document.cree_par or document.depose_par,
                    description=f"PDF généré automatiquement: {result['filename']}"
                )
            
            return result
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Erreur lors de la génération du PDF: {str(e)}'
            }
    
    def generate_pdf_for_fiche_type(self, projet, fiche_type, utilisateur=None, phase_etat=None, custom_data=None):
        """
        Génère un PDF pour un type de fiche spécifique.
        """
        try:
            # Récupérer les données selon le type de fiche
            data = self._get_data_for_fiche_type(projet, fiche_type, phase_etat)
            
            # Fusionner avec les données personnalisées si fournies
            if custom_data:
                data.update(custom_data)
            
            # Générer le nom du fichier de sortie
            timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
            output_filename = f"{fiche_type}_{projet.code}_{timestamp}.pdf"
            
            # Générer le PDF
            result = self.template_manager.generate_document(
                fiche_type,
                data,
                output_filename
            )
            
            if result['success']:
                # Créer ou mettre à jour le document en base
                document, created = DocumentProjet.objects.get_or_create(
                    projet=projet,
                    type_document=fiche_type,
                    defaults={
                        'version': 1,
                        'chemin_fichier': result['file_path'],
                        'statut': 'brouillon',
                        'origine': 'genere',
                        'cree_par': utilisateur,
                        'nom_fichier': result['filename'],
                        'taille_fichier': result['file_size'],
                        'description': f"PDF généré automatiquement pour {fiche_type}"
                    }
                )
                
                if not created:
                    # Mettre à jour le document existant
                    document.chemin_fichier = result['file_path']
                    document.taille_fichier = result['file_size']
                    document.nom_fichier = result['filename']
                    document.version += 1
                    document.save()
                
                # Créer l'entrée d'historique
                HistoriqueDocumentProjet.objects.create(
                    document=document,
                    action='upload',
                    utilisateur=utilisateur,
                    description=f"PDF généré automatiquement: {result['filename']}"
                )
                
                result['document_id'] = document.id
                result['document'] = document
            
            return result
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Erreur lors de la génération du PDF: {str(e)}'
            }
    
    def generate_custom_pdf(self, projet, template_name, data, utilisateur=None, output_filename=None):
        """
        Génère un PDF personnalisé à partir d'un template spécifique.
        Fusionne automatiquement les données du projet avec les données personnalisées.
        """
        try:
            # Récupérer les données du projet depuis la base de données
            from .mappers import DocumentDataMapper
            projet_data = DocumentDataMapper.map_projet_data(projet)
            
            # Fusionner les données du projet avec les données personnalisées
            # Les données personnalisées écrasent les données du projet si même clé
            merged_data = {**projet_data, **data}
            
            # Ajouter des données de génération
            merged_data.update({
                'date_generation': timezone.now().strftime('%d/%m/%Y à %H:%M'),
                'date_signature': timezone.now().strftime('%d/%m/%Y'),
                'utilisateur_generation': utilisateur.get_full_name() if utilisateur else 'Système',
            })
            
            # Générer le nom du fichier de sortie si non fourni
            if not output_filename:
                timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
                output_filename = f"{template_name}_{projet.code}_{timestamp}.pdf"
            
            # Générer le PDF directement avec le template
            result = self.template_manager.generator.generate_pdf_from_word_template(
                template_name,
                merged_data,  # Utiliser les données fusionnées
                output_filename
            )
            
            if result['success']:
                # Créer le document en base
                document = DocumentProjet.objects.create(
                    projet=projet,
                    type_document='autre',
                    version=1,
                    chemin_fichier=result['file_path'],
                    statut='brouillon',
                    origine='genere',
                    cree_par=utilisateur,
                    nom_fichier=result['filename'],
                    taille_fichier=result['file_size'],
                    description=f"PDF généré à partir du template {template_name}"
                )
                
                # Créer l'entrée d'historique
                HistoriqueDocumentProjet.objects.create(
                    document=document,
                    action='upload',
                    utilisateur=utilisateur,
                    description=f"PDF généré à partir du template {template_name}: {result['filename']}"
                )
                
                result['document_id'] = document.id
                result['document'] = document
            
            return result
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Erreur lors de la génération du PDF personnalisé: {str(e)}'
            }
    
    def _get_data_for_document_type(self, document):
        """
        Récupère les données appropriées selon le type de document.
        """
        return self._get_data_for_fiche_type(document.projet, document.type_document, document.phase)
    
    def _get_data_for_fiche_type(self, projet, fiche_type, phase_etat=None):
        """
        Récupère les données appropriées selon le type de fiche.
        """
        if fiche_type == 'fiche_projet_marketing':
            return FicheDataMapper.map_fiche_projet_marketing_data(projet)
        elif fiche_type == 'fiche_plan_projet':
            return FicheDataMapper.map_fiche_plan_projet_data(projet)
        elif fiche_type == 'fiche_analyse_offre':
            return FicheDataMapper.map_fiche_analyse_offre_data(projet, phase_etat)
        elif fiche_type == 'fiche_test':
            return FicheDataMapper.map_fiche_test_data(projet, phase_etat)
        elif fiche_type == 'fiche_implementation_technique':
            return FicheDataMapper.map_fiche_implementation_technique_data(projet, phase_etat)
        elif fiche_type == 'fiche_suppression_offre':
            return FicheDataMapper.map_fiche_suppression_offre_data(projet, phase_etat)
        elif fiche_type == 'specifications_marketing_offre':
            return FicheDataMapper.map_specifications_marketing_offre_data(projet, phase_etat)
        elif fiche_type == 'ordre_travaux':
            return FicheDataMapper.map_ordre_travaux_data(projet, phase_etat)
        elif fiche_type == 'fiche_etude_si':
            return FicheDataMapper.map_fiche_etude_si_data(projet, phase_etat)
        elif fiche_type == 'fiche_etude_technique':
            return FicheDataMapper.map_fiche_etude_technique_data(projet, phase_etat)
        elif fiche_type == 'fiche_etude_financiere':
            return FicheDataMapper.map_fiche_etude_financiere_data(projet, phase_etat)
        elif fiche_type == 'fiche_specifications_marketing':
            return FicheDataMapper.map_fiche_specifications_marketing_data(projet, phase_etat)
        elif fiche_type == 'fiche_lancement_commercial':
            return FicheDataMapper.map_fiche_lancement_commercial_data(projet, phase_etat)
        elif fiche_type == 'fiche_bilan_3_mois':
            return FicheDataMapper.map_fiche_bilan_data(projet, 3)
        elif fiche_type == 'fiche_bilan_6_mois':
            return FicheDataMapper.map_fiche_bilan_data(projet, 6)
        else:
            # Données de base pour les autres types
            from .mappers import DocumentDataMapper
            return DocumentDataMapper.map_projet_data(projet)
    
    def get_available_templates(self):
        """
        Retourne la liste des templates disponibles.
        """
        return self.template_manager.generator.get_available_templates()
    
    def validate_template_exists(self, document_type):
        """
        Vérifie qu'un template existe pour un type de document.
        """
        template_name = self.template_manager.get_template_for_document_type(document_type)
        if not template_name:
            return False
        return self.template_manager.generator.validate_template(template_name)
