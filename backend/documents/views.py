from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone
from django.core.exceptions import ValidationError

from .models import DocumentProjet, HistoriqueDocumentProjet, CommentaireDocumentProjet
from .serializers import (
    DocumentProjetListSerializer, DocumentProjetDetailSerializer, 
    DocumentProjetCreateSerializer, DocumentProjetUpdateSerializer,
    DocumentProjetStatutSerializer, HistoriqueDocumentProjetSerializer,
    CommentaireDocumentProjetSerializer, CommentaireDocumentProjetCreateSerializer
)
# Permissions supprimées - utilisation des permissions Django standard
from .services import FicheGenerationService


class DocumentProjetViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des documents de projet.
    """
    # Utilisation des permissions Django standard
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nom_fichier', 'description', 'chemin_fichier']
    ordering_fields = ['nom_fichier', 'cree_le', 'version', 'statut']
    ordering = ['-cree_le']
    filterset_fields = ['statut', 'origine', 'type_document', 'projet', 'phase', 'etape']
    
    def get_queryset(self):
        """Filtrer les documents selon les permissions."""
        user = self.request.user
        
        # Super utilisateur voit tout
        if user.is_superuser:
            return DocumentProjet.objects.select_related(
                'projet', 'cree_par', 'depose_par', 'phase', 'etape'
            ).prefetch_related('commentaires', 'historique')
        
        # Filtrer selon les permissions de projet
        queryset = DocumentProjet.objects.select_related(
            'projet', 'cree_par', 'depose_par', 'phase', 'etape'
        ).prefetch_related('commentaires', 'historique')
        
        # Documents des projets où l'utilisateur est membre de l'équipe
        return queryset.filter(projet__equipe=user)
    
    def get_serializer_class(self):
        """Choisir le bon sérialiseur selon l'action."""
        if self.action == 'list':
            return DocumentProjetListSerializer
        elif self.action == 'create':
            return DocumentProjetCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return DocumentProjetUpdateSerializer
        elif self.action == 'change_statut':
            return DocumentProjetStatutSerializer
        return DocumentProjetDetailSerializer
    
    def perform_create(self, serializer):
        """Créer un nouveau document de projet."""
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def change_statut(self, request, pk=None):
        """Changer le statut d'un document."""
        document = self.get_object()
        serializer = DocumentProjetStatutSerializer(
            document, 
            data=request.data, 
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': f'Statut du document changé avec succès',
                'document': DocumentProjetDetailSerializer(document).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        """Obtenir les statistiques des documents."""
        user = self.request.user
        queryset = self.get_queryset()
        
        # Statistiques générales
        total_documents = queryset.count()
        documents_par_statut = queryset.values('statut').annotate(count=Count('id'))
        documents_par_origine = queryset.values('origine').annotate(count=Count('id'))
        documents_par_type = queryset.values('type_document').annotate(count=Count('id'))
        
        # Documents récents
        documents_recents = queryset.filter(
            cree_le__gte=timezone.now() - timezone.timedelta(days=7)
        ).count()
        
        return Response({
            'total_documents': total_documents,
            'documents_par_statut': list(documents_par_statut),
            'documents_par_origine': list(documents_par_origine),
            'documents_par_type': list(documents_par_type),
            'documents_recents': documents_recents
        })
    
    @action(detail=False, methods=['get'])
    def mes_documents(self, request):
        """Obtenir les documents créés/déposés par l'utilisateur connecté."""
        user = request.user
        queryset = self.get_queryset().filter(
            Q(cree_par=user) | Q(depose_par=user)
        )
        
        # Appliquer les filtres
        queryset = self.filter_queryset(queryset)
        
        # Pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = DocumentProjetListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = DocumentProjetListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def par_projet(self, request):
        """Obtenir les documents groupés par projet."""
        user = request.user
        queryset = self.get_queryset()
        
        # Grouper par projet
        projets = {}
        for document in queryset:
            projet_id = document.projet.id
            if projet_id not in projets:
                projets[projet_id] = {
                    'projet': {
                        'id': document.projet.id,
                        'nom': document.projet.nom,
                        'code': document.projet.code
                    },
                    'documents': []
                }
            projets[projet_id]['documents'].append(
                DocumentProjetListSerializer(document).data
            )
        
        return Response(list(projets.values()))
    
    @action(detail=False, methods=['get'])
    def par_phase(self, request):
        """Obtenir les documents groupés par phase."""
        user = request.user
        queryset = self.get_queryset().filter(phase__isnull=False)
        
        # Grouper par phase
        phases = {}
        for document in queryset:
            phase_id = document.phase.id
            if phase_id not in phases:
                phases[phase_id] = {
                    'phase': {
                        'id': document.phase.id,
                        'nom': document.phase.phase.nom,
                        'projet': document.projet.nom
                    },
                    'documents': []
                }
            phases[phase_id]['documents'].append(
                DocumentProjetListSerializer(document).data
            )
        
        return Response(list(phases.values()))
    
    @action(detail=False, methods=['get'])
    def par_etape(self, request):
        """Obtenir les documents groupés par étape."""
        user = request.user
        queryset = self.get_queryset().filter(etape__isnull=False)
        
        # Grouper par étape
        etapes = {}
        for document in queryset:
            etape_id = document.etape.id
            if etape_id not in etapes:
                etapes[etape_id] = {
                    'etape': {
                        'id': document.etape.id,
                        'nom': document.etape.nom,
                        'phase': document.etape.phase_etat.phase.nom,
                        'projet': document.projet.nom
                    },
                    'documents': []
                }
            etapes[etape_id]['documents'].append(
                DocumentProjetListSerializer(document).data
            )
        
        return Response(list(etapes.values()))
    
    # Endpoint generer_fiches_phase supprimé - non utilisé
    
    @action(detail=False, methods=['post'])
    def generer_fiche_specifique(self, request):
        """Génère une fiche spécifique pour un projet."""
        projet_id = request.data.get('projet_id')
        type_fiche = request.data.get('type_fiche')
        
        if not projet_id or not type_fiche:
            return Response({
                'error': 'projet_id et type_fiche sont requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from projects.models import Projet
            projet = Projet.objects.get(id=projet_id)
            
            # Vérifier les permissions
            if not self._has_project_access(request.user, projet):
                return Response({
                    'error': 'Vous n\'avez pas accès à ce projet'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Générer la fiche spécifique
            fiche = None
            if type_fiche == 'fiche_plan_projet':
                fiche = FicheGenerationService.generer_fiche_plan_projet(projet, request.user)
            elif type_fiche == 'fiche_specifications_marketing':
                fiche = FicheGenerationService.generer_fiche_specifications_marketing(projet, request.user)
            elif type_fiche == 'fiche_lancement_commercial':
                fiche = FicheGenerationService.generer_fiche_lancement_commercial(projet, request.user)
            elif type_fiche == 'fiche_suppression':
                fiche = FicheGenerationService.generer_fiche_suppression(projet, request.user)
            else:
                return Response({
                    'error': f'Type de fiche non supporté: {type_fiche}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if fiche:
                return Response({
                    'message': f'Fiche {type_fiche} créée avec succès',
                    'fiche': DocumentProjetDetailSerializer(fiche).data
                })
            else:
                return Response({
                    'message': f'Fiche {type_fiche} existe déjà'
                }, status=status.HTTP_200_OK)
                
        except Projet.DoesNotExist:
            return Response({
                'error': 'Projet non trouvé'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': f'Erreur lors de la génération de la fiche: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def generer_pdf(self, request):
        """Génère un PDF à partir d'un template pour un projet."""
        projet_id = request.data.get('projet_id')
        document_type = request.data.get('document_type')
        custom_data = request.data.get('custom_data', {})
        
        if not projet_id or not document_type:
            return Response({
                'error': 'projet_id et document_type sont requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from projects.models import Projet
            projet = Projet.objects.get(id=projet_id)
            
            # Vérifier les permissions
            if not self._has_project_access(request.user, projet):
                return Response({
                    'error': 'Vous n\'avez pas accès à ce projet'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Générer le PDF
            from .services import PDFGenerationService
            pdf_service = PDFGenerationService()
            
            result = pdf_service.generate_pdf_for_fiche_type(
                projet, document_type, request.user
            )
            
            if result['success']:
                return Response({
                    'message': 'PDF généré avec succès',
                    'file_path': result['file_path'],
                    'filename': result['filename'],
                    'file_size': result['file_size'],
                    'document_id': result.get('document_id')
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
                'error': f'Erreur lors de la génération du PDF: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def templates_disponibles(self, request):
        """Retourne la liste des templates disponibles avec leurs informations."""
        try:
            from .utils import TemplateManager
            template_manager = TemplateManager()
            
            templates_info = template_manager.get_all_templates_info()
            
            return Response({
                'templates': templates_info,
                'total': len(templates_info)
            })
            
        except Exception as e:
            return Response({
                'error': f'Erreur lors de la récupération des templates: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def variables_template(self, request):
        """Retourne les variables d'un template pour un type de document."""
        document_type = request.query_params.get('document_type')
        
        if not document_type:
            return Response({
                'error': 'document_type est requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from .utils import TemplateManager
            template_manager = TemplateManager()
            
            variables = template_manager.get_template_variables(document_type)
            
            return Response({
                'document_type': document_type,
                'variables': variables,
                'total': len(variables)
            })
            
        except Exception as e:
            return Response({
                'error': f'Erreur lors de la récupération des variables: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def generer_pdf_personnalise(self, request):
        """Génère un PDF personnalisé à partir d'un template spécifique."""
        projet_id = request.data.get('projet_id')
        template_name = request.data.get('template_name')
        custom_data = request.data.get('custom_data', {})
        output_filename = request.data.get('output_filename')
        
        if not projet_id or not template_name:
            return Response({
                'error': 'projet_id et template_name sont requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from projects.models import Projet
            projet = Projet.objects.get(id=projet_id)
            
            # Vérifier les permissions
            if not self._has_project_access(request.user, projet):
                return Response({
                    'error': 'Vous n\'avez pas accès à ce projet'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Générer le PDF personnalisé
            from .services import PDFGenerationService
            pdf_service = PDFGenerationService()
            
            result = pdf_service.generate_custom_pdf(
                projet, template_name, custom_data, request.user, output_filename
            )
            
            if result['success']:
                return Response({
                    'message': 'PDF personnalisé généré avec succès',
                    'file_path': result['file_path'],
                    'filename': result['filename'],
                    'file_size': result['file_size'],
                    'document_id': result.get('document_id')
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
                'error': f'Erreur lors de la génération du PDF personnalisé: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _has_project_access(self, user, projet):
        """Vérifier si l'utilisateur a accès au projet."""
        return user in projet.equipe.all()


class CommentaireDocumentProjetViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des commentaires de documents de projet.
    """
    # Utilisation des permissions Django standard
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    ordering_fields = ['date_creation']
    ordering = ['date_creation']
    filterset_fields = ['document', 'auteur']
    
    def get_queryset(self):
        """Filtrer les commentaires selon les permissions."""
        user = self.request.user
        
        # Super utilisateur voit tout
        if user.is_superuser:
            return CommentaireDocumentProjet.objects.select_related(
                'document', 'auteur', 'parent'
            ).prefetch_related('reponses')
        
        # Filtrer selon les permissions de document (simplifié)
        return CommentaireDocumentProjet.objects.filter(
            document__projet__equipe=user
        ).select_related('document', 'auteur', 'parent').prefetch_related('reponses')
    
    def get_serializer_class(self):
        """Choisir le bon sérialiseur selon l'action."""
        if self.action == 'create':
            return CommentaireDocumentProjetCreateSerializer
        return CommentaireDocumentProjetSerializer
    
    def perform_create(self, serializer):
        """Créer un nouveau commentaire."""
        # Récupérer le document depuis l'URL
        document_id = self.kwargs.get('document_pk')
        document = DocumentProjet.objects.get(id=document_id)
        
        serializer.save(
            document=document,
            auteur=self.request.user
        )
    
    def perform_update(self, serializer):
        """Mettre à jour un commentaire."""
        instance = serializer.instance
        instance.modifie = True
        serializer.save()


class HistoriqueDocumentProjetViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet en lecture seule pour l'historique des documents de projet.
    """
    # Utilisation des permissions Django standard
    serializer_class = HistoriqueDocumentProjetSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    ordering_fields = ['date_action']
    ordering = ['-date_action']
    filterset_fields = ['document', 'utilisateur', 'action']
    
    def get_queryset(self):
        """Filtrer l'historique selon les permissions."""
        user = self.request.user
        
        # Super utilisateur voit tout
        if user.is_superuser:
            return HistoriqueDocumentProjet.objects.select_related(
                'document', 'utilisateur'
            )
        
        # Filtrer selon les permissions de document (simplifié)
        return HistoriqueDocumentProjet.objects.filter(
            document__projet__equipe=user
        ).select_related('document', 'utilisateur')