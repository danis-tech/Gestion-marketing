from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notifications'
    verbose_name = 'Système de Notifications'
    
    def ready(self):
        """Configuration lors du démarrage de l'application"""
        # Importer les signaux si nécessaire
        try:
            import notifications.signals
        except ImportError:
            pass