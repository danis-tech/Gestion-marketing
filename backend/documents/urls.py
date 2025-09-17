from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DocumentProjetViewSet, 
    CommentaireDocumentProjetViewSet, 
    HistoriqueDocumentProjetViewSet
)
from .dashboard_views import DocumentDashboardViewSet

# Créer le routeur
router = DefaultRouter()
router.register(r'documents', DocumentProjetViewSet, basename='documentprojet')
router.register(r'historique', HistoriqueDocumentProjetViewSet, basename='historiquedocumentprojet')
router.register(r'dashboard', DocumentDashboardViewSet, basename='dashboard')

# URLs pour les commentaires (imbriquées dans les documents)
commentaires_router = DefaultRouter()
commentaires_router.register(r'commentaires', CommentaireDocumentProjetViewSet, basename='commentairedocumentprojet')

urlpatterns = [
    # URLs principales
    path('', include(router.urls)),
    
    # URLs pour les commentaires de documents
    path('documents/<int:document_pk>/', include(commentaires_router.urls)),
    
]