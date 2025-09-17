from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.utils import timezone
import os
import tempfile
import subprocess
import platform
from .models import DocumentProjet, HistoriqueDocumentProjet
from .services import PDFGenerationService
from .utils import TemplateManager
from projects.models import Projet, ProjetPhaseEtat, Etape


class DocumentDashboardViewSet(viewsets.ViewSet):
    """
    ViewSet pour le dashboard de gestion des documents.
    Interface similaire aux étapes & validations.
    """
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'])
    def types_documents(self, request):
        """Retourne tous les types de documents disponibles."""
        types_documents = [
            {
                'id': 'fiche_projet_marketing',
                'nom': 'Fiche Projet Marketing',
                'description': 'Fiche contenant les informations initiales du projet marketing',
                'icone': '📋',
                'couleur': '#3498db',
                'template': 'fiche_projet_marketing.docx'
            },
            {
                'id': 'fiche_plan_projet',
                'nom': 'Fiche Plan Projet',
                'description': 'Planning prévisionnel, jalons et membres affectés',
                'icone': '📅',
                'couleur': '#2ecc71',
                'template': 'fiche_plan_projet.docx'
            },
            {
                'id': 'fiche_etude_si',
                'nom': 'Fiche Étude SI',
                'description': 'Étude de faisabilité système d\'information',
                'icone': '💻',
                'couleur': '#e74c3c',
                'template': 'fiche_etude_si.docx'
            },
            {
                'id': 'fiche_etude_technique',
                'nom': 'Fiche Étude Technique',
                'description': 'Étude technique détaillée du projet',
                'icone': '🔧',
                'couleur': '#f39c12',
                'template': 'fiche_etude_technique.docx'
            },
            {
                'id': 'fiche_etude_financiere',
                'nom': 'Fiche Étude Financière',
                'description': 'Analyse financière et budgétaire du projet',
                'icone': '💰',
                'couleur': '#27ae60',
                'template': 'fiche_etude_financiere.docx'
            },
            {
                'id': 'fiche_specifications_marketing',
                'nom': 'Fiche Spécifications Marketing',
                'description': 'Spécifications marketing et communication',
                'icone': '📊',
                'couleur': '#9b59b6',
                'template': 'fiche_specifications_marketing.docx'
            },
            {
                'id': 'fiche_implementation',
                'nom': 'Fiche Implémentation',
                'description': 'Plan d\'implémentation et déploiement du projet',
                'icone': '🚀',
                'couleur': '#34495e',
                'template': 'fiche_implementation.docx'
            },
            {
                'id': 'fiche_recette_uat',
                'nom': 'Fiche Recette UAT',
                'description': 'Tests d\'acceptation utilisateur',
                'icone': '✅',
                'couleur': '#16a085',
                'template': 'fiche_recette_uat.docx'
            },
            {
                'id': 'fiche_lancement_commercial',
                'nom': 'Fiche Lancement Commercial',
                'description': 'Plan de lancement commercial',
                'icone': '🎯',
                'couleur': '#e67e22',
                'template': 'fiche_lancement_commercial.docx'
            },
            {
                'id': 'fiche_projet_complete',
                'nom': 'Fiche Projet Complète',
                'description': 'Document complet avec toutes les informations du projet',
                'icone': '📄',
                'couleur': '#8e44ad',
                'template': 'fiche_projet_complete.docx'
            },
            {
                'id': 'contrat',
                'nom': 'Contrat',
                'description': 'Contrat de service personnalisé',
                'icone': '📋',
                'couleur': '#8e44ad',
                'template': 'contrat.docx'
            },
            {
                'id': 'devis',
                'nom': 'Devis',
                'description': 'Devis personnalisé',
                'icone': '💼',
                'couleur': '#16a085',
                'template': 'devis.docx'
            },
            {
                'id': 'facture',
                'nom': 'Facture',
                'description': 'Facture personnalisée',
                'icone': '🧾',
                'couleur': '#c0392b',
                'template': 'facture.docx'
            }
        ]
        
        return Response({
            'types_documents': types_documents,
            'total': len(types_documents)
        })
    
    @action(detail=False, methods=['get'])
    def projets_disponibles(self, request):
        """Retourne la liste des projets disponibles pour la génération de documents."""
        projets = Projet.objects.all().order_by('-cree_le')
        
        projets_data = []
        for projet in projets:
            projets_data.append({
                'id': projet.id,
                'nom': projet.nom,
                'code': projet.code,
                'statut': projet.get_statut_display(),
                'priorite': projet.get_priorite_display(),
                'chef_projet': projet.proprietaire.get_full_name() if projet.proprietaire else '',
                'date_creation': projet.cree_le.strftime('%d/%m/%Y'),
                'phases_count': projet.phases_etat.count(),
                'taches_count': projet.taches.count(),
                'documents_count': projet.documents.count()
            })
        
        return Response({
            'projets': projets_data,
            'total': len(projets_data)
        })
    
    @action(detail=False, methods=['get'])
    def phases_projet(self, request):
        """Retourne les phases d'un projet spécifique."""
        projet_id = request.query_params.get('projet_id')
        
        if not projet_id:
            return Response({
                'error': 'projet_id est requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            projet = Projet.objects.get(id=projet_id)
            phases = projet.phases_etat.all().order_by('phase__ordre')
            
            phases_data = []
            for phase_etat in phases:
                phases_data.append({
                    'id': phase_etat.id,
                    'nom': phase_etat.phase.nom,
                    'ordre': phase_etat.phase.ordre,
                    'statut': 'Terminée' if phase_etat.terminee else 'En cours' if phase_etat.est_en_cours else 'En attente',
                    'date_debut': phase_etat.date_debut.strftime('%d/%m/%Y') if phase_etat.date_debut else '',
                    'date_fin': phase_etat.date_fin.strftime('%d/%m/%Y') if phase_etat.date_fin else '',
                    'etapes_count': phase_etat.etapes.count(),
                    'documents_count': DocumentProjet.objects.filter(phase=phase_etat).count()
                })
            
            return Response({
                'projet': {
                    'id': projet.id,
                    'nom': projet.nom,
                    'code': projet.code
                },
                'phases': phases_data,
                'total': len(phases_data)
            })
            
        except Projet.DoesNotExist:
            return Response({
                'error': 'Projet non trouvé'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def etapes_phase(self, request):
        """Retourne les étapes d'une phase spécifique."""
        phase_id = request.query_params.get('phase_id')
        
        if not phase_id:
            return Response({
                'error': 'phase_id est requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            phase_etat = ProjetPhaseEtat.objects.get(id=phase_id)
            etapes = phase_etat.etapes.all().order_by('ordre')
            
            etapes_data = []
            for etape in etapes:
                etapes_data.append({
                    'id': etape.id,
                    'nom': etape.nom,
                    'ordre': etape.ordre,
                    'statut': etape.get_statut_display(),
                    'priorite': etape.get_priorite_display(),
                    'responsable': etape.responsable.get_full_name() if etape.responsable else 'Non assigné',
                    'date_debut_prevue': etape.date_debut_prevue.strftime('%d/%m/%Y') if etape.date_debut_prevue else '',
                    'date_fin_prevue': etape.date_fin_prevue.strftime('%d/%m/%Y') if etape.date_fin_prevue else '',
                    'progression': etape.progression_pourcentage,
                    'documents_count': DocumentProjet.objects.filter(etape=etape).count()
                })
            
            return Response({
                'phase': {
                    'id': phase_etat.id,
                    'nom': phase_etat.phase.nom,
                    'projet': phase_etat.projet.nom
                },
                'etapes': etapes_data,
                'total': len(etapes_data)
            })
            
        except ProjetPhaseEtat.DoesNotExist:
            return Response({
                'error': 'Phase non trouvée'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'])
    def generer_document_word(self, request):
        """Génère un document Word personnalisé et l'ouvre pour édition."""
        projet_id = request.data.get('projet_id')
        type_document = request.data.get('type_document')
        phase_id = request.data.get('phase_id')
        etape_id = request.data.get('etape_id')
        custom_data = request.data.get('custom_data', {})
        
        if not projet_id or not type_document:
            return Response({
                'error': 'projet_id et type_document sont requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Récupérer le projet
            projet = Projet.objects.get(id=projet_id)
            
            # Récupérer les données du projet depuis la DB
            from .mappers import DocumentDataMapper
            projet_data = DocumentDataMapper.map_projet_data(projet)
            
            # Fusionner avec les données personnalisées
            merged_data = {**projet_data, **custom_data}
            
            # Ajouter des données de génération
            from django.utils import timezone
            merged_data.update({
                'date_generation': timezone.now().strftime('%d/%m/%Y à %H:%M'),
                'date_signature': timezone.now().strftime('%d/%m/%Y'),
                'utilisateur_generation': request.user.get_full_name() if request.user else 'Système',
            })
            
            # Récupérer le nom du template correspondant
            template_name = None
            for doc_type in self.types_documents(request).data['types_documents']:
                if doc_type['id'] == type_document:
                    template_name = doc_type['template']
                    break
            
            if not template_name:
                return Response({
                    'error': f'Type de document {type_document} non trouvé'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Générer le document Word
            template_manager = TemplateManager()
            
            # Créer un nom de fichier temporaire
            timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
            temp_filename = f"{type_document}_{projet.code}_{timestamp}.docx"
            
            # Générer le document Word
            result = template_manager.generator.generate_docx_from_template(
                template_name,
                merged_data,
                temp_filename
            )
            
            if result['success']:
                # Créer l'entrée en base de données
                document = DocumentProjet.objects.create(
                    projet=projet,
                    type_document=type_document,
                    version=1,
                    chemin_fichier=result['file_path'],
                    statut='brouillon',
                    origine='genere',
                    cree_par=request.user,
                    nom_fichier=result['filename'],
                    taille_fichier=result['file_size'],
                    description=f"Document {type_document} généré pour personnalisation",
                    phase_id=phase_id,
                    etape_id=etape_id,
                    date_modification_fichier=timezone.now()  # Initialiser la date de modification
                )
                
                # Essayer d'ouvrir le document avec Word
                try:
                    import subprocess
                    import platform
                    
                    if platform.system() == "Windows":
                        # Ouvrir avec Word sur Windows
                        subprocess.Popen([result['file_path']], shell=True)
                        open_message = "Document ouvert dans Microsoft Word"
                    elif platform.system() == "Darwin":  # macOS
                        # Ouvrir avec Word sur macOS
                        subprocess.Popen(['open', '-a', 'Microsoft Word', result['file_path']])
                        open_message = "Document ouvert dans Microsoft Word"
                    else:
                        # Linux ou autre
                        subprocess.Popen(['xdg-open', result['file_path']])
                        open_message = "Document ouvert avec l'application par défaut"
                except Exception as e:
                    open_message = f"Document généré mais impossible d'ouvrir automatiquement: {str(e)}"
                
                return Response({
                    'success': True,
                    'message': f'Document Word généré avec succès. {open_message}',
                    'document_id': document.id,
                    'file_path': result['file_path'],
                    'filename': result['filename'],
                    'download_url': f'/api/documents/dashboard/download/{document.id}/',
                    'auto_opened': True
                })
            else:
                return Response({
                    'error': result['error']
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Projet.DoesNotExist:
            return Response({
                'error': 'Projet non trouvé'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': f'Erreur lors de la génération: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def sauvegarder_document(self, request):
        """Sauvegarde un document modifié et génère le PDF final."""
        document_id = request.data.get('document_id')
        custom_data = request.data.get('custom_data', {})
        
        if not document_id:
            return Response({
                'error': 'document_id est requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            document = DocumentProjet.objects.get(id=document_id)
            
            # Mettre à jour le document avec les données personnalisées
            if custom_data:
                # Ici vous pourriez sauvegarder les données personnalisées
                # dans un champ JSON du modèle DocumentProjet
                pass
            
            # Générer le PDF final
            pdf_service = PDFGenerationService()
            
            # Récupérer les données du projet
            from .mappers import DocumentDataMapper
            projet_data = DocumentDataMapper.map_projet_data(document.projet)
            
            # Fusionner avec les données personnalisées
            merged_data = {**projet_data, **custom_data}
            
            # Générer le PDF
            result = pdf_service.generate_custom_pdf(
                projet=document.projet,
                template_name=document.type_document,
                data=merged_data,
                utilisateur=request.user,
                output_filename=f"{document.type_document}_{document.projet.code}_final.pdf"
            )
            
            if result['success']:
                # Mettre à jour le document
                document.chemin_fichier = result['file_path']
                document.nom_fichier = result['filename']
                document.taille_fichier = result['file_size']
                document.statut = 'finalise'
                document.save()
                
                return Response({
                    'success': True,
                    'message': 'Document sauvegardé et PDF généré avec succès',
                    'document_id': document.id,
                    'file_path': result['file_path'],
                    'filename': result['filename'],
                    'download_url': f'/api/documents/dashboard/download/{document.id}/'
                })
            else:
                return Response({
                    'error': result['error']
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except DocumentProjet.DoesNotExist:
            return Response({
                'error': 'Document non trouvé'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': f'Erreur lors de la sauvegarde: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def documents_projet(self, request):
        """Retourne tous les documents d'un projet."""
        projet_id = request.query_params.get('projet_id')
        
        if not projet_id:
            return Response({
                'error': 'projet_id est requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            projet = Projet.objects.get(id=projet_id)
            documents = DocumentProjet.objects.filter(projet=projet).order_by('-cree_le')
            
            documents_data = []
            for doc in documents:
                documents_data.append({
                    'id': doc.id,
                    'type_document': doc.type_document,
                    'nom_fichier': doc.nom_fichier,
                    'statut': doc.statut,
                    'version': doc.version,
                    'taille_fichier': doc.taille_fichier,
                    'date_creation': doc.cree_le.strftime('%d/%m/%Y à %H:%M'),
                    'cree_par': doc.cree_par.get_full_name() if doc.cree_par else 'Système',
                    'phase': doc.phase.phase.nom if doc.phase else '',
                    'etape': doc.etape.nom if doc.etape else '',
                    'download_url': f'/api/documents/dashboard/download/{doc.id}/'
                })
            
            return Response({
                'projet': {
                    'id': projet.id,
                    'nom': projet.nom,
                    'code': projet.code
                },
                'documents': documents_data,
                'total': len(documents_data)
            })
            
        except Projet.DoesNotExist:
            return Response({
                'error': 'Projet non trouvé'
            }, status=status.HTTP_404_NOT_FOUND)
    
    
    @action(detail=True, methods=['post'])
    def ouvrir_document(self, request, pk=None):
        """Ouvre le document Word pour modification."""
        try:
            document = DocumentProjet.objects.get(id=pk)
            
            # Vérifier que le fichier existe
            if not os.path.exists(document.chemin_fichier):
                return Response({
                    'error': 'Fichier non trouvé sur le serveur'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Essayer d'ouvrir le document avec Word
            try:
                if platform.system() == "Windows":
                    # Ouvrir avec Word sur Windows
                    subprocess.Popen([document.chemin_fichier], shell=True)
                    open_message = "Document ouvert dans Microsoft Word pour modification"
                elif platform.system() == "Darwin":  # macOS
                    # Ouvrir avec Word sur macOS
                    subprocess.Popen(['open', '-a', 'Microsoft Word', document.chemin_fichier])
                    open_message = "Document ouvert dans Microsoft Word pour modification"
                else:
                    # Linux ou autre
                    subprocess.Popen(['xdg-open', document.chemin_fichier])
                    open_message = "Document ouvert avec l'application par défaut pour modification"
                
                # Créer une entrée d'historique
                HistoriqueDocumentProjet.objects.create(
                    document=document,
                    action='modification',
                    utilisateur=request.user if hasattr(request, 'user') else None,
                    description=f"Document ouvert pour modification: {document.nom_fichier}"
                )
                
                return Response({
                    'success': True,
                    'message': open_message,
                    'document_id': document.id,
                    'file_path': document.chemin_fichier
                })
                
            except Exception as e:
                return Response({
                    'error': f'Impossible d\'ouvrir le document: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except DocumentProjet.DoesNotExist:
            return Response({
                'error': 'Document non trouvé'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def visualiser_document(self, request, pk=None):
        """Ouvre le document pour visualisation."""
        try:
            document = DocumentProjet.objects.get(id=pk)
            
            # Vérifier que le fichier existe
            if not os.path.exists(document.chemin_fichier):
                return Response({
                    'error': 'Fichier non trouvé sur le serveur'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Essayer d'ouvrir le document en mode lecture seule
            try:
                if platform.system() == "Windows":
                    # Ouvrir avec Word en mode lecture seule sur Windows
                    subprocess.Popen([document.chemin_fichier, '/r'], shell=True)
                    open_message = "Document ouvert en mode lecture seule"
                elif platform.system() == "Darwin":  # macOS
                    # Ouvrir avec Word sur macOS
                    subprocess.Popen(['open', '-a', 'Microsoft Word', document.chemin_fichier])
                    open_message = "Document ouvert pour visualisation"
                else:
                    # Linux ou autre
                    subprocess.Popen(['xdg-open', document.chemin_fichier])
                    open_message = "Document ouvert avec l'application par défaut pour visualisation"
                
                # Créer une entrée d'historique
                HistoriqueDocumentProjet.objects.create(
                    document=document,
                    action='visualisation',
                    utilisateur=request.user if hasattr(request, 'user') else None,
                    description=f"Document ouvert pour visualisation: {document.nom_fichier}"
                )
                
                return Response({
                    'success': True,
                    'message': open_message,
                    'document_id': document.id,
                    'file_path': document.chemin_fichier
                })
                
            except Exception as e:
                return Response({
                    'error': f'Impossible d\'ouvrir le document: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except DocumentProjet.DoesNotExist:
            return Response({
                'error': 'Document non trouvé'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['delete'])
    def supprimer_document(self, request, pk=None):
        """Supprime le document (fichier et base de données)."""
        try:
            document = DocumentProjet.objects.get(id=pk)
            
            # Supprimer le fichier physique s'il existe
            file_deleted = False
            if os.path.exists(document.chemin_fichier):
                try:
                    os.remove(document.chemin_fichier)
                    file_deleted = True
                except Exception as e:
                    # Log l'erreur mais continue avec la suppression en base
                    print(f"Erreur lors de la suppression du fichier: {e}")
            
            # Supprimer l'entrée en base de données
            document_nom = document.nom_fichier
            document.delete()
            
            return Response({
                'success': True,
                'message': f'Document "{document_nom}" supprimé avec succès',
                'file_deleted': file_deleted
            })
            
        except DocumentProjet.DoesNotExist:
            return Response({
                'error': 'Document non trouvé'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def verifier_modifications(self, request, pk=None):
        """Vérifie si le document a été modifié et le synchronise."""
        try:
            document = DocumentProjet.objects.get(id=pk)
            
            if not document.chemin_fichier or not os.path.exists(document.chemin_fichier):
                return Response({
                    'error': 'Fichier non trouvé sur le serveur'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Obtenir les informations du fichier
            file_stat = os.stat(document.chemin_fichier)
            current_size = file_stat.st_size
            current_mtime = file_stat.st_mtime
            
            # Comparer avec les données en base
            file_modified = False
            
            # Vérifier d'abord la taille du fichier
            if document.taille_fichier and document.taille_fichier != current_size:
                file_modified = True
                print(f"Modification détectée par taille: {document.taille_fichier} -> {current_size}")
            
            # Vérifier ensuite la date de modification du fichier
            if not file_modified and document.date_modification_fichier:
                # Comparer directement les timestamps
                base_mtime = document.date_modification_fichier.timestamp()
                if abs(current_mtime - base_mtime) > 2:  # Tolérance de 2 secondes
                    file_modified = True
                    print(f"Modification détectée par timestamp: {base_mtime} -> {current_mtime}")
            
            # Si pas de données de comparaison, considérer comme modifié
            if not file_modified and (not document.taille_fichier or not document.date_modification_fichier):
                file_modified = True
                print("Modification détectée: pas de données de comparaison")
            
            if file_modified:
                # Mettre à jour les métadonnées
                document.taille_fichier = current_size
                # Utiliser le timestamp du fichier pour la date de modification
                from datetime import datetime
                document.date_modification_fichier = datetime.fromtimestamp(current_mtime)
                document.version += 1  # Incrémenter la version
                document.save()
                
                # Créer une entrée d'historique
                try:
                    HistoriqueDocumentProjet.objects.create(
                        document=document,
                        action='modification_synchronisee',
                        utilisateur=None,  # Pas d'utilisateur pour les synchronisations automatiques
                        description=f"Document synchronisé - Version {document.version} - Taille: {current_size} octets"
                    )
                except Exception as hist_error:
                    print(f"Erreur lors de la création de l'historique: {hist_error}")
                    # Continuer même si l'historique échoue
                
                return Response({
                    'success': True,
                    'modified': True,
                    'message': f'Document synchronisé - Version {document.version}',
                    'version': document.version,
                    'size': current_size,
                    'last_modified': timezone.now().isoformat()
                })
            else:
                return Response({
                    'success': True,
                    'modified': False,
                    'message': 'Aucune modification détectée',
                    'version': document.version
                })
                
        except DocumentProjet.DoesNotExist:
            return Response({
                'error': 'Document non trouvé'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': f'Erreur lors de la vérification: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def forcer_synchronisation(self, request, pk=None):
        """Force la synchronisation d'un document (pour test)."""
        try:
            document = DocumentProjet.objects.get(id=pk)
            
            if not document.chemin_fichier or not os.path.exists(document.chemin_fichier):
                return Response({
                    'error': 'Fichier non trouvé sur le serveur'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Obtenir les informations du fichier
            file_stat = os.stat(document.chemin_fichier)
            current_size = file_stat.st_size
            current_mtime = file_stat.st_mtime
            
            # Forcer la mise à jour
            document.taille_fichier = current_size
            # Utiliser le timestamp du fichier pour la date de modification
            from datetime import datetime
            document.date_modification_fichier = datetime.fromtimestamp(current_mtime)
            document.version += 1
            document.save()
            
            # Créer une entrée d'historique
            try:
                HistoriqueDocumentProjet.objects.create(
                    document=document,
                    action='synchronisation_forcee',
                    utilisateur=None,  # Pas d'utilisateur pour les synchronisations automatiques
                    description=f"Synchronisation forcée - Version {document.version} - Taille: {current_size} octets"
                )
            except Exception as hist_error:
                print(f"Erreur lors de la création de l'historique: {hist_error}")
                # Continuer même si l'historique échoue
            
            return Response({
                'success': True,
                'message': f'Synchronisation forcée - Version {document.version}',
                'version': document.version,
                'size': current_size,
                'last_modified': timezone.now().isoformat()
            })
                
        except DocumentProjet.DoesNotExist:
            return Response({
                'error': 'Document non trouvé'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': f'Erreur lors de la synchronisation forcée: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
