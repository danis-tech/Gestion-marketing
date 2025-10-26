from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta
import json

User = get_user_model()


class MetricType(models.TextChoices):
    """Types de métriques disponibles"""
    COUNT = 'count', 'Compteur'
    PERCENTAGE = 'percentage', 'Pourcentage'
    DURATION = 'duration', 'Durée'
    CURRENCY = 'currency', 'Monétaire'
    RATIO = 'ratio', 'Ratio'


class MetricCategory(models.TextChoices):
    """Catégories de métriques"""
    PROJECTS = 'projects', 'Projets'
    USERS = 'users', 'Utilisateurs'
    DOCUMENTS = 'documents', 'Documents'
    TASKS = 'tasks', 'Tâches'
    PERFORMANCE = 'performance', 'Performance'
    SYSTEM = 'system', 'Système'


class Metric(models.Model):
    """Modèle pour stocker les métriques calculées"""
    
    name = models.CharField(max_length=200, verbose_name="Nom de la métrique")
    description = models.TextField(blank=True, verbose_name="Description")
    category = models.CharField(
        max_length=50, 
        choices=MetricCategory.choices,
        verbose_name="Catégorie"
    )
    metric_type = models.CharField(
        max_length=20,
        choices=MetricType.choices,
        verbose_name="Type de métrique"
    )
    
    # Valeur de la métrique
    value = models.FloatField(verbose_name="Valeur")
    unit = models.CharField(max_length=50, blank=True, verbose_name="Unité")
    
    # Métadonnées
    period_start = models.DateTimeField(verbose_name="Début de période")
    period_end = models.DateTimeField(verbose_name="Fin de période")
    calculated_at = models.DateTimeField(auto_now_add=True, verbose_name="Calculé le")
    
    # Données additionnelles (JSON)
    metadata = models.JSONField(default=dict, blank=True, verbose_name="Métadonnées")
    
    class Meta:
        db_table = "analytics_metrics"
        verbose_name = "Métrique"
        verbose_name_plural = "Métriques"
        ordering = ['-calculated_at']
        indexes = [
            models.Index(fields=['category', 'calculated_at']),
            models.Index(fields=['period_start', 'period_end']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.category}) - {self.value} {self.unit}"


class DashboardWidget(models.Model):
    """Modèle pour les widgets du tableau de bord"""
    
    name = models.CharField(max_length=200, verbose_name="Nom du widget")
    description = models.TextField(blank=True, verbose_name="Description")
    widget_type = models.CharField(max_length=50, verbose_name="Type de widget")
    
    # Configuration du widget (JSON)
    config = models.JSONField(default=dict, verbose_name="Configuration")
    
    # Position et taille
    position_x = models.IntegerField(default=0, verbose_name="Position X")
    position_y = models.IntegerField(default=0, verbose_name="Position Y")
    width = models.IntegerField(default=4, verbose_name="Largeur")
    height = models.IntegerField(default=3, verbose_name="Hauteur")
    
    # Visibilité
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    is_public = models.BooleanField(default=False, verbose_name="Public")
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Modifié le")
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        verbose_name="Créé par"
    )
    
    class Meta:
        db_table = "analytics_dashboard_widgets"
        verbose_name = "Widget de tableau de bord"
        verbose_name_plural = "Widgets de tableau de bord"
        ordering = ['position_y', 'position_x']
    
    def __str__(self):
        return f"{self.name} ({self.widget_type})"


class Report(models.Model):
    """Modèle pour les rapports générés"""
    
    name = models.CharField(max_length=200, verbose_name="Nom du rapport")
    description = models.TextField(blank=True, verbose_name="Description")
    report_type = models.CharField(max_length=50, verbose_name="Type de rapport")
    
    # Configuration du rapport (JSON)
    config = models.JSONField(default=dict, verbose_name="Configuration")
    
    # Données du rapport (JSON)
    data = models.JSONField(default=dict, verbose_name="Données")
    
    # Fichier généré (optionnel)
    file_path = models.CharField(max_length=500, blank=True, verbose_name="Chemin du fichier")
    
    # Métadonnées
    generated_at = models.DateTimeField(auto_now_add=True, verbose_name="Généré le")
    generated_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        verbose_name="Généré par"
    )
    
    # Période du rapport
    period_start = models.DateTimeField(verbose_name="Début de période")
    period_end = models.DateTimeField(verbose_name="Fin de période")
    
    class Meta:
        db_table = "analytics_reports"
        verbose_name = "Rapport"
        verbose_name_plural = "Rapports"
        ordering = ['-generated_at']
    
    def __str__(self):
        return f"{self.name} ({self.report_type}) - {self.generated_at.strftime('%d/%m/%Y')}"


class SystemHealth(models.Model):
    """Modèle pour le monitoring de la santé du système"""
    
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="Horodatage")
    
    # Métriques système
    cpu_usage = models.FloatField(default=0.0, verbose_name="Utilisation CPU (%)")
    memory_usage = models.FloatField(default=0.0, verbose_name="Utilisation mémoire (%)")
    disk_usage = models.FloatField(default=0.0, verbose_name="Utilisation disque (%)")
    
    # Métriques application
    active_users = models.IntegerField(default=0, verbose_name="Utilisateurs actifs")
    total_requests = models.IntegerField(default=0, verbose_name="Requêtes totales")
    error_rate = models.FloatField(default=0.0, verbose_name="Taux d'erreur (%)")
    
    # Métriques base de données
    db_connections = models.IntegerField(default=0, verbose_name="Connexions DB")
    db_query_time = models.FloatField(default=0.0, verbose_name="Temps de requête moyen (ms)")
    
    # Métadonnées
    metadata = models.JSONField(default=dict, blank=True, verbose_name="Métadonnées")
    
    class Meta:
        db_table = "analytics_system_health"
        verbose_name = "Santé du système"
        verbose_name_plural = "Santé du système"
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"Santé système - {self.timestamp.strftime('%d/%m/%Y %H:%M')}"
