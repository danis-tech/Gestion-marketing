from django.contrib import admin
from django.urls import path, include
from accounts.views import PasswordResetConfirmPageView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/accounts/", include("accounts.urls")),
    path("api/", include("projects.urls")),  # URLs des projets avec préfixe /api/
    path("password-reset-confirm/<str:uidb64>/<str:token>/", PasswordResetConfirmPageView.as_view(), name='password_reset_confirm_page'),
]
