from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from accounts.views import PasswordResetConfirmPageView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/accounts/", include("accounts.urls")),
    path("api/", include("projects.urls")),  # URLs des projets avec préfixe /api/
    path("api/documents/", include("documents.urls")),  # URLs des documents avec préfixe /api/documents/
    path("password-reset-confirm/<str:uidb64>/<str:token>/", PasswordResetConfirmPageView.as_view(), name='password_reset_confirm_page'),
    path("api/chatbot/", include("chatbot.urls")),
    path("api/notifications/", include("notifications.urls")),  # URLs des notifications
    path("api/analytics/", include("analytics.urls")),  # URLs des analytiques
]

# Servir les fichiers médias en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
