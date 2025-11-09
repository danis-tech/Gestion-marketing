"""
Vues pour le module d'analytiques
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.utils import timezone
from datetime import datetime, timedelta
import logging

from .models import Metric, DashboardWidget, Report, SystemHealth
from .serializers import (
    MetricSerializer, DashboardWidgetSerializer, ReportSerializer,
    SystemHealthSerializer, AnalyticsDataSerializer
)
from .services import AnalyticsService

logger = logging.getLogger(__name__)


class MetricViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour les métriques"""
    
    serializer_class = MetricSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrer les métriques selon les permissions"""
        queryset = Metric.objects.all()
        
        # Filtrer par catégorie si spécifié
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filtrer par période si spécifiée
        period_start = self.request.query_params.get('period_start')
        period_end = self.request.query_params.get('period_end')
        
        if period_start:
            queryset = queryset.filter(period_start__gte=period_start)
        if period_end:
            queryset = queryset.filter(period_end__lte=period_end)
        
        return queryset.order_by('-calculated_at')
    
    @action(detail=False, methods=['post'])
    def calculate(self, request):
        """Calcule les métriques pour une période donnée"""
        serializer = AnalyticsDataSerializer(data=request.data)
        if serializer.is_valid():
            period_days = request.data.get('period_days', 30)
            
            # Calculer les métriques
            analytics_service = AnalyticsService()
            metrics = analytics_service.calculate_all_metrics(period_days)
            
            # Sauvegarder les métriques
            for metric in metrics:
                metric.save()
            
            return Response({
                'message': f'{len(metrics)} métriques calculées avec succès',
                'metrics_count': len(metrics)
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Récupère les données pour le tableau de bord"""
        period_days = int(request.query_params.get('period_days', 30))
        project_id = request.query_params.get('project_id')
        
        # Convertir project_id en int si fourni
        project_id = int(project_id) if project_id else None
        
        analytics_service = AnalyticsService()
        dashboard_data = analytics_service.get_dashboard_data(period_days, project_id=project_id)
        
        return Response(dashboard_data)
    
    @action(detail=False, methods=['get'], url_path='project_details', url_name='project_details')
    def project_details(self, request):
        """Récupère les données détaillées d'un projet spécifique"""
        logger.info(f'[project_details] Endpoint appelé - User: {request.user}, Query params: {dict(request.query_params)}')
        project_id = request.query_params.get('project_id')
        
        if not project_id:
            logger.warning('[project_details] project_id manquant dans la requête')
            return Response(
                {'error': 'Le paramètre project_id est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            project_id = int(project_id)
            logger.info(f'[project_details] Traitement du projet ID: {project_id}')
        except ValueError:
            logger.error(f'[project_details] project_id invalide: {project_id}')
            return Response(
                {'error': 'project_id doit être un nombre entier'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Vérifier d'abord si le projet existe
            from projects.models import Projet
            try:
                projet = Projet.objects.get(id=project_id)
                logger.info(f'[project_details] Projet trouvé: {projet.nom}')
            except Projet.DoesNotExist:
                logger.warning(f'[project_details] Projet {project_id} n\'existe pas dans la base de données')
                return Response(
                    {'error': f'Projet avec ID {project_id} non trouvé'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            analytics_service = AnalyticsService()
            project_data = analytics_service.get_project_dashboard_data(project_id)
            logger.info(f'[project_details] Données récupérées pour le projet {project_id}: {bool(project_data)}, Clés: {list(project_data.keys()) if project_data else "Aucune"}')
            
            # Vérifier spécifiquement les données de l'équipe
            if project_data and 'equipe' in project_data:
                equipe = project_data['equipe']
                logger.info(f'[project_details] Données équipe - total_membres: {equipe.get("total_membres")}, membres présents: {"membres" in equipe}, membres count: {len(equipe.get("membres", []))}')
            
            if not project_data:
                logger.warning(f'[project_details] project_data est vide pour le projet {project_id}')
                return Response(
                    {'error': f'Impossible de récupérer les données pour le projet {project_id}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            if not project_data.get('project'):
                logger.warning(f'[project_details] Clé "project" manquante dans project_data pour le projet {project_id}')
                return Response(
                    {'error': f'Données incomplètes pour le projet {project_id}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            logger.info(f'[project_details] Succès - Retour des données pour le projet {project_id}')
            return Response(project_data)
        except Projet.DoesNotExist:
            logger.error(f'[project_details] Projet {project_id} n\'existe pas')
            return Response(
                {'error': f'Projet avec ID {project_id} non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f'[project_details] Erreur lors de la récupération des données du projet {project_id}: {str(e)}', exc_info=True)
            return Response(
                {'error': f'Erreur lors de la récupération des données: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def trends(self, request):
        """Récupère les données de tendance pour une métrique"""
        metric_name = request.query_params.get('metric_name')
        period_days = int(request.query_params.get('period_days', 30))
        group_by = request.query_params.get('group_by', 'day')
        
        if not metric_name:
            return Response(
                {'error': 'Le paramètre metric_name est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        analytics_service = AnalyticsService()
        trend_data = analytics_service.get_trend_data(metric_name, period_days, group_by)
        
        return Response({
            'metric_name': metric_name,
            'period_days': period_days,
            'group_by': group_by,
            'data': trend_data
        })


class DashboardWidgetViewSet(viewsets.ModelViewSet):
    """ViewSet pour les widgets du tableau de bord"""
    
    serializer_class = DashboardWidgetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrer les widgets selon les permissions"""
        user = self.request.user
        
        # Super utilisateur voit tous les widgets
        if user.is_superuser:
            return DashboardWidget.objects.all()
        
        # Autres utilisateurs voient les widgets publics et les leurs
        return DashboardWidget.objects.filter(
            Q(is_public=True) | Q(created_by=user)
        )
    
    def perform_create(self, serializer):
        """Créer un nouveau widget"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_widgets(self, request):
        """Récupère les widgets de l'utilisateur connecté"""
        widgets = self.get_queryset().filter(created_by=request.user)
        serializer = self.get_serializer(widgets, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def public_widgets(self, request):
        """Récupère les widgets publics"""
        widgets = self.get_queryset().filter(is_public=True)
        serializer = self.get_serializer(widgets, many=True)
        return Response(serializer.data)


class ReportViewSet(viewsets.ModelViewSet):
    """ViewSet pour les rapports"""
    
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrer les rapports selon les permissions"""
        user = self.request.user
        
        # Super utilisateur voit tous les rapports
        if user.is_superuser:
            return Report.objects.all()
        
        # Autres utilisateurs voient leurs rapports
        return Report.objects.filter(generated_by=user)
    
    def perform_create(self, serializer):
        """Créer un nouveau rapport"""
        serializer.save(generated_by=self.request.user)
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Génère un nouveau rapport"""
        report_type = request.data.get('report_type')
        period_start = request.data.get('period_start')
        period_end = request.data.get('period_end')
        config = request.data.get('config', {})
        
        if not all([report_type, period_start, period_end]):
            return Response(
                {'error': 'Les paramètres report_type, period_start et period_end sont requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Convertir les dates
            period_start = datetime.fromisoformat(period_start.replace('Z', '+00:00'))
            period_end = datetime.fromisoformat(period_end.replace('Z', '+00:00'))
            
            # Générer le rapport
            analytics_service = AnalyticsService()
            report_data = analytics_service.generate_report(
                report_type, period_start, period_end, config
            )
            
            # Créer l'enregistrement du rapport
            report = Report.objects.create(
                name=f"Rapport {report_type} - {period_start.strftime('%d/%m/%Y')}",
                description=f"Rapport généré automatiquement pour la période {period_start.strftime('%d/%m/%Y')} - {period_end.strftime('%d/%m/%Y')}",
                report_type=report_type,
                config=config,
                data=report_data,
                period_start=period_start,
                period_end=period_end,
                generated_by=request.user
            )
            
            serializer = self.get_serializer(report)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération du rapport: {str(e)}")
            return Response(
                {'error': f'Erreur lors de la génération du rapport: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Télécharge un rapport (si un fichier est disponible)"""
        report = self.get_object()
        
        if not report.file_path:
            return Response(
                {'error': 'Aucun fichier disponible pour ce rapport'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Ici, vous pourriez implémenter la logique de téléchargement
        # Pour l'instant, on retourne les données JSON
        return Response(report.data)


class SystemHealthViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour la santé du système"""
    
    serializer_class = SystemHealthSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Récupère les données de santé du système"""
        queryset = SystemHealth.objects.all()
        
        # Filtrer par période si spécifiée
        hours = self.request.query_params.get('hours', 24)
        since = timezone.now() - timedelta(hours=int(hours))
        queryset = queryset.filter(timestamp__gte=since)
        
        return queryset.order_by('-timestamp')
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Récupère l'état actuel du système"""
        # Récupérer la dernière entrée de santé système
        latest_health = SystemHealth.objects.first()
        
        if not latest_health:
            return Response({
                'status': 'unknown',
                'message': 'Aucune donnée de santé système disponible'
            })
        
        # Déterminer le statut global
        status = 'healthy'
        if latest_health.cpu_usage > 80 or latest_health.memory_usage > 80:
            status = 'warning'
        if latest_health.cpu_usage > 95 or latest_health.memory_usage > 95:
            status = 'critical'
        
        serializer = self.get_serializer(latest_health)
        return Response({
            'status': status,
            'data': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def metrics(self, request):
        """Récupère les métriques de performance du système"""
        hours = int(request.query_params.get('hours', 24))
        since = timezone.now() - timedelta(hours=hours)
        
        health_data = SystemHealth.objects.filter(timestamp__gte=since).order_by('timestamp')
        
        # Calculer les moyennes
        avg_cpu = health_data.aggregate(avg_cpu=models.Avg('cpu_usage'))['avg_cpu'] or 0
        avg_memory = health_data.aggregate(avg_memory=models.Avg('memory_usage'))['avg_memory'] or 0
        avg_disk = health_data.aggregate(avg_disk=models.Avg('disk_usage'))['avg_disk'] or 0
        
        return Response({
            'period_hours': hours,
            'averages': {
                'cpu_usage': round(avg_cpu, 2),
                'memory_usage': round(avg_memory, 2),
                'disk_usage': round(avg_disk, 2)
            },
            'data': self.get_serializer(health_data, many=True).data
        })


class AnalyticsViewSet(viewsets.ViewSet):
    """ViewSet pour les analytiques générales"""
    
    permission_classes = [IsAuthenticated]
    queryset = Metric.objects.none()  # Ajout du queryset requis
    
    @action(detail=False, methods=['get'])
    def overview(self, request):
        """Récupère un aperçu général des analytiques"""
        period_days = int(request.query_params.get('period_days', 30))
        
        analytics_service = AnalyticsService()
        
        # Calculer les métriques principales
        metrics = analytics_service.calculate_all_metrics(period_days)
        
        # Organiser les données par catégorie
        overview_data = {
            'period_days': period_days,
            'total_metrics': len(metrics),
            'categories': {},
            'key_metrics': []
        }
        
        for metric in metrics:
            category = metric.category
            if category not in overview_data['categories']:
                overview_data['categories'][category] = []
            
            overview_data['categories'][category].append({
                'name': metric.name,
                'value': metric.value,
                'unit': metric.unit,
                'type': metric.metric_type
            })
            
            # Ajouter aux métriques clés si c'est important
            if metric.name in [
                'Total des projets', 'Total des utilisateurs', 'Total des tâches',
                'Taux de completion des projets', 'Utilisateurs actifs'
            ]:
                overview_data['key_metrics'].append({
                    'name': metric.name,
                    'value': metric.value,
                    'unit': metric.unit,
                    'type': metric.metric_type
                })
        
        return Response(overview_data)
    
    @action(detail=False, methods=['get'])
    def kpis(self, request):
        """Récupère les KPIs principaux"""
        period_days = int(request.query_params.get('period_days', 30))
        
        analytics_service = AnalyticsService()
        dashboard_data = analytics_service.get_dashboard_data(period_days)
        
        # Extraire les KPIs principaux
        kpis = {
            'projects': {
                'total': 0,
                'completed': 0,
                'completion_rate': 0
            },
            'users': {
                'total': 0,
                'active': 0,
                'activity_rate': 0
            },
            'tasks': {
                'total': 0,
                'completed': 0,
                'completion_rate': 0
            },
            'documents': {
                'total': 0,
                'new': 0
            }
        }
        
        # Extraire les données des métriques
        for category, metrics in dashboard_data['categories'].items():
            for metric in metrics:
                if category == 'projects':
                    if metric['name'] == 'Total des projets':
                        kpis['projects']['total'] = metric['value']
                    elif metric['name'] == 'Projets termine':
                        kpis['projects']['completed'] = metric['value']
                    elif metric['name'] == 'Taux de completion des projets':
                        kpis['projects']['completion_rate'] = metric['value']
                
                elif category == 'users':
                    if metric['name'] == 'Total des utilisateurs':
                        kpis['users']['total'] = metric['value']
                    elif metric['name'] == 'Utilisateurs actifs':
                        kpis['users']['active'] = metric['value']
                    elif metric['name'] == 'Taux d\'activité':
                        kpis['users']['activity_rate'] = metric['value']
                
                elif category == 'tasks':
                    if metric['name'] == 'Total des tâches':
                        kpis['tasks']['total'] = metric['value']
                    elif metric['name'] == 'Tâches termine':
                        kpis['tasks']['completed'] = metric['value']
                    elif metric['name'] == 'Taux de completion des tâches':
                        kpis['tasks']['completion_rate'] = metric['value']
                
                elif category == 'documents':
                    if metric['name'] == 'Total des documents':
                        kpis['documents']['total'] = metric['value']
                    elif metric['name'] == 'Nouveaux documents':
                        kpis['documents']['new'] = metric['value']
        
        return Response(kpis)
