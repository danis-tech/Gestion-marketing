from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjetViewSet, MembreProjetViewSet, HistoriqueEtatViewSet,
    PermissionProjetViewSet, TacheViewSet
)

# Router principal pour les projets
router = DefaultRouter()
router.register(r'projects', ProjetViewSet, basename='projet')
router.register(r'taches', TacheViewSet, basename='tache')

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
]
