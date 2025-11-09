from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjetViewSet, MembreProjetViewSet, HistoriqueEtatViewSet,
    PermissionProjetViewSet, TacheViewSet, PhaseProjetViewSet, ProjetPhaseEtatViewSet, EtapeViewSet,
    ProjetCompletionViewSet
)

# Router principal pour les projets
router = DefaultRouter()
router.register(r'projects', ProjetViewSet, basename='projet')
router.register(r'taches', TacheViewSet, basename='tache')
router.register(r'phases', PhaseProjetViewSet, basename='phase')

urlpatterns = [
    # URLs principales des projets
    path('', include(router.urls)),
    
    # URLs imbriquées pour les membres d'un projet spécifique
    path('projects/<int:projet_pk>/membres/', MembreProjetViewSet.as_view({'get': 'list', 'post': 'create'}), name='projet-membres'),
    path('projects/<int:projet_pk>/membres/<int:pk>/', MembreProjetViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='projet-membre-detail'),
    
    # URLs imbriquées pour l'historique d'un projet spécifique
    path('projects/<int:projet_pk>/historiques/', HistoriqueEtatViewSet.as_view({'get': 'list'}), name='projet-historiques'),
    path('projects/<int:projet_pk>/historiques/<int:pk>/', HistoriqueEtatViewSet.as_view({'get': 'retrieve'}), name='projet-historique-detail'),
    
    # URLs imbriquées pour les permissions d'un projet spécifique
    path('projects/<int:projet_pk>/permissions/', PermissionProjetViewSet.as_view({'get': 'list', 'post': 'create'}), name='projet-permissions'),
    path('projects/<int:projet_pk>/permissions/<int:pk>/', PermissionProjetViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='projet-permission-detail'),
    path('projects/<int:projet_pk>/permissions/utilisateur-permissions/', PermissionProjetViewSet.as_view({'get': 'utilisateur_permissions'}), name='projet-utilisateur-permissions'),
    path('projects/<int:projet_pk>/permissions/accorder-multiple/', PermissionProjetViewSet.as_view({'post': 'accorder_multiple'}), name='projet-accorder-multiple-permissions'),
    
    # URLs imbriquées pour les phases d'un projet spécifique
    path('projects/<int:projet_pk>/phases/', ProjetPhaseEtatViewSet.as_view({'get': 'list'}), name='projet-phases'),
    path('projects/<int:projet_pk>/phases/<int:pk>/', ProjetPhaseEtatViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update'}), name='projet-phase-detail'),
    path('projects/<int:projet_pk>/phases/<int:pk>/marquer-debut/', ProjetPhaseEtatViewSet.as_view({'post': 'marquer_debut'}), name='projet-phase-marquer-debut'),
    path('projects/<int:projet_pk>/phases/<int:pk>/marquer-fin/', ProjetPhaseEtatViewSet.as_view({'post': 'marquer_fin'}), name='projet-phase-marquer-fin'),
    path('projects/<int:projet_pk>/phases/progression/', ProjetPhaseEtatViewSet.as_view({'get': 'progression'}), name='projet-phases-progression'),
    
    # URLs imbriquées pour les étapes d'une phase spécifique
    path('projects/<int:projet_pk>/phases/<int:phase_pk>/etapes/', EtapeViewSet.as_view({'get': 'list', 'post': 'create'}), name='projet-phase-etapes'),
    path('projects/<int:projet_pk>/phases/<int:phase_pk>/etapes/<int:pk>/', EtapeViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='projet-phase-etape-detail'),
    path('projects/<int:projet_pk>/phases/<int:phase_pk>/etapes/<int:pk>/demarrer/', EtapeViewSet.as_view({'post': 'demarrer'}), name='projet-phase-etape-demarrer'),
    path('projects/<int:projet_pk>/phases/<int:phase_pk>/etapes/<int:pk>/terminer/', EtapeViewSet.as_view({'post': 'terminer'}), name='projet-phase-etape-terminer'),
    path('projects/<int:projet_pk>/phases/<int:phase_pk>/etapes/<int:pk>/annuler/', EtapeViewSet.as_view({'post': 'annuler'}), name='projet-phase-etape-annuler'),
    path('projects/<int:projet_pk>/phases/<int:phase_pk>/etapes/progression/', EtapeViewSet.as_view({'get': 'progression'}), name='projet-phase-etapes-progression'),
    
    # URLs pour la gestion de la completion des projets
    path('projects/<int:projet_pk>/marquer-termine/', ProjetCompletionViewSet.as_view({'post': 'marquer_termine'}), name='projet-marquer-termine'),
    path('projects/<int:projet_pk>/marquer-non-termine/', ProjetCompletionViewSet.as_view({'post': 'marquer_non_termine'}), name='projet-marquer-non-termine'),
    path('projects/<int:projet_pk>/peut-etre-termine/', ProjetCompletionViewSet.as_view({'get': 'peut_etre_termine'}), name='projet-peut-etre-termine'),
]
