from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenBlacklistView
from .views import (
    UserViewSet, RoleViewSet, PermissionViewSet, 
    ServiceViewSet, RolePermissionViewSet,
    MeView, LoginView, SignupView, PasswordResetRequestView, 
    PasswordResetConfirmView, PasswordResetConfirmPageView, PhotoUploadView, MediaFileView
)

# Router pour les comptes utilisateurs
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'permissions', PermissionViewSet, basename='permission')
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'role-permissions', RolePermissionViewSet, basename='role-permission')

urlpatterns = [
    # URLs principales des comptes
    path('', include(router.urls)),
    
    # URLs d'authentification
    path('me/', MeView.as_view(), name='me'),
    path('login/', LoginView.as_view(), name='login'),
    path('signup/', SignupView.as_view(), name='signup'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', TokenBlacklistView.as_view(), name='token_blacklist'),
    path('password-reset-request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('password-reset-confirm/<str:uidb64>/<str:token>/', PasswordResetConfirmPageView.as_view(), name='password_reset_confirm_page'),
    path('upload-photo/', PhotoUploadView.as_view(), name='upload_photo'),
    path('media/<path:path>', MediaFileView.as_view(), name='serve_media'),
]
