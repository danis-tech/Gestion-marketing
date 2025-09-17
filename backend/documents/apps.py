from django.apps import AppConfig


class DocumentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'documents'
    verbose_name = 'Gestion des Documents'
    
    def ready(self):
        """Configuration lors du démarrage de l'application."""
        # Importer les signaux
        # Signaux supprimés - utilisation des signaux Django standard