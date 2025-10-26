"""
Services d'analytiques pour calculer et analyser les métriques du système
"""
from django.db.models import Count, Avg, Sum, Q, F
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth, TruncQuarter, TruncYear
from django.utils import timezone
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging

from .models import Metric, MetricCategory, MetricType, SystemHealth
from projects.models import Projet, Tache, PhaseProjet, Etape
from accounts.models import User, Service, Role
from documents.models import DocumentProjet, HistoriqueDocumentProjet, CommentaireDocumentProjet
from notifications.models import Notification

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Service principal pour les analytiques"""
    
    def __init__(self):
        self.now = timezone.now()
    
    def calculate_all_metrics(self, period_days: int = 30) -> List[Metric]:
        """Calcule toutes les métriques pour une période donnée"""
        period_start = self.now - timedelta(days=period_days)
        period_end = self.now
        
        metrics = []
        
        # Métriques des projets
        metrics.extend(self._calculate_project_metrics(period_start, period_end))
        
        # Métriques des utilisateurs
        metrics.extend(self._calculate_user_metrics(period_start, period_end))
        
        # Métriques des documents
        metrics.extend(self._calculate_document_metrics(period_start, period_end))
        
        # Métriques des tâches
        metrics.extend(self._calculate_task_metrics(period_start, period_end))
        
        # Métriques de performance
        metrics.extend(self._calculate_performance_metrics(period_start, period_end))
        
        # Métriques système
        metrics.extend(self._calculate_system_metrics(period_start, period_end))
        
        # Métriques des retards et alertes
        metrics.extend(self._calculate_delay_metrics(period_start, period_end))
        
        # Métriques des équipes
        metrics.extend(self._calculate_team_metrics(period_start, period_end))
        
        return metrics
    
    def _calculate_project_metrics(self, period_start, period_end) -> List[Metric]:
        """Calcule les métriques liées aux projets"""
        metrics = []
        
        # Nombre total de projets
        total_projects = Projet.objects.count()
        metrics.append(Metric(
            name="Total des projets",
            description="Nombre total de projets dans le système",
            category=MetricCategory.PROJECTS,
            metric_type=MetricType.COUNT,
            value=total_projects,
            unit="projets",
            period_start=period_start,
            period_end=period_end
        ))
        
        # Projets créés dans la période
        new_projects = Projet.objects.filter(
            cree_le__gte=period_start,
            cree_le__lte=period_end
        ).count()
        metrics.append(Metric(
            name="Nouveaux projets",
            description=f"Projets créés entre {period_start.strftime('%d/%m/%Y')} et {period_end.strftime('%d/%m/%Y')}",
            category=MetricCategory.PROJECTS,
            metric_type=MetricType.COUNT,
            value=new_projects,
            unit="projets",
            period_start=period_start,
            period_end=period_end
        ))
        
        # Projets par statut
        project_status = Projet.objects.values('statut').annotate(count=Count('id'))
        for status in project_status:
            metrics.append(Metric(
                name=f"Projets {status['statut']}",
                description=f"Nombre de projets avec le statut '{status['statut']}'",
                category=MetricCategory.PROJECTS,
                metric_type=MetricType.COUNT,
                value=status['count'],
                unit="projets",
                period_start=period_start,
                period_end=period_end,
                metadata={'statut': status['statut']}
            ))
        
        # Projets par propriétaire
        projects_by_owner = Projet.objects.values('proprietaire__username').annotate(count=Count('id'))
        for owner in projects_by_owner:
            if owner['proprietaire__username']:
                metrics.append(Metric(
                    name=f"Projets - {owner['proprietaire__username']}",
                    description=f"Nombre de projets pour {owner['proprietaire__username']}",
                    category=MetricCategory.PROJECTS,
                    metric_type=MetricType.COUNT,
                    value=owner['count'],
                    unit="projets",
                    period_start=period_start,
                    period_end=period_end,
                    metadata={'owner': owner['proprietaire__username']}
                ))
        
        # Durée moyenne des projets
        completed_projects = Projet.objects.filter(
            statut='termine',
            cree_le__isnull=False,
            fin__isnull=False
        )
        if completed_projects.exists():
            avg_duration = completed_projects.aggregate(
                avg_duration=Avg(F('fin') - F('cree_le'))
            )['avg_duration']
            if avg_duration:
                metrics.append(Metric(
                    name="Durée moyenne des projets",
                    description="Durée moyenne des projets terminés",
                    category=MetricCategory.PROJECTS,
                    metric_type=MetricType.DURATION,
                    value=avg_duration.total_seconds() / 86400,  # Convertir en jours
                    unit="jours",
                    period_start=period_start,
                    period_end=period_end
                ))
        
        return metrics
    
    def _calculate_user_metrics(self, period_start, period_end) -> List[Metric]:
        """Calcule les métriques liées aux utilisateurs"""
        metrics = []
        
        # Nombre total d'utilisateurs
        total_users = User.objects.count()
        metrics.append(Metric(
            name="Total des utilisateurs",
            description="Nombre total d'utilisateurs dans le système",
            category=MetricCategory.USERS,
            metric_type=MetricType.COUNT,
            value=total_users,
            unit="utilisateurs",
            period_start=period_start,
            period_end=period_end
        ))
        
        # Utilisateurs actifs (connexion dans la période)
        active_users = User.objects.filter(
            last_login__gte=period_start,
            last_login__lte=period_end
        ).count()
        metrics.append(Metric(
            name="Utilisateurs actifs",
            description=f"Utilisateurs connectés entre {period_start.strftime('%d/%m/%Y')} et {period_end.strftime('%d/%m/%Y')}",
            category=MetricCategory.USERS,
            metric_type=MetricType.COUNT,
            value=active_users,
            unit="utilisateurs",
            period_start=period_start,
            period_end=period_end
        ))
        
        # Taux d'activité
        if total_users > 0:
            activity_rate = (active_users / total_users) * 100
            metrics.append(Metric(
                name="Taux d'activité",
                description="Pourcentage d'utilisateurs actifs",
                category=MetricCategory.USERS,
                metric_type=MetricType.PERCENTAGE,
                value=activity_rate,
                unit="%",
                period_start=period_start,
                period_end=period_end
            ))
        
        # Utilisateurs par service
        users_by_service = User.objects.values('service__nom').annotate(count=Count('id'))
        for service in users_by_service:
            if service['service__nom']:
                metrics.append(Metric(
                    name=f"Membres - {service['service__nom']}",
                    description=f"Nombre d'utilisateurs du service {service['service__nom']}",
                    category=MetricCategory.USERS,
                    metric_type=MetricType.COUNT,
                    value=service['count'],
                    unit="utilisateurs",
                    period_start=period_start,
                    period_end=period_end,
                    metadata={'service': service['service__nom']}
                ))
        
        # Utilisateurs par rôle
        users_by_role = User.objects.values('role__nom').annotate(count=Count('id'))
        for role in users_by_role:
            if role['role__nom']:
                metrics.append(Metric(
                    name=f"Utilisateurs - {role['role__nom']}",
                    description=f"Nombre d'utilisateurs avec le rôle {role['role__nom']}",
                    category=MetricCategory.USERS,
                    metric_type=MetricType.COUNT,
                    value=role['count'],
                    unit="utilisateurs",
                    period_start=period_start,
                    period_end=period_end,
                    metadata={'role': role['role__nom']}
                ))
        
        return metrics
    
    def _calculate_document_metrics(self, period_start, period_end) -> List[Metric]:
        """Calcule les métriques liées aux documents"""
        metrics = []
        
        # Nombre total de documents
        total_documents = DocumentProjet.objects.count()
        metrics.append(Metric(
            name="Total des documents",
            description="Nombre total de documents dans le système",
            category=MetricCategory.DOCUMENTS,
            metric_type=MetricType.COUNT,
            value=total_documents,
            unit="documents",
            period_start=period_start,
            period_end=period_end
        ))
        
        # Documents créés dans la période
        new_documents = DocumentProjet.objects.filter(
            cree_le__gte=period_start,
            cree_le__lte=period_end
        ).count()
        metrics.append(Metric(
            name="Nouveaux documents",
            description=f"Documents créés entre {period_start.strftime('%d/%m/%Y')} et {period_end.strftime('%d/%m/%Y')}",
            category=MetricCategory.DOCUMENTS,
            metric_type=MetricType.COUNT,
            value=new_documents,
            unit="documents",
            period_start=period_start,
            period_end=period_end
        ))
        
        # Documents par type
        documents_by_type = DocumentProjet.objects.values('type_document').annotate(count=Count('id'))
        for doc_type in documents_by_type:
            if doc_type['type_document']:
                metrics.append(Metric(
                    name=f"Documents - {doc_type['type_document']}",
                    description=f"Nombre de documents de type {doc_type['type_document']}",
                    category=MetricCategory.DOCUMENTS,
                    metric_type=MetricType.COUNT,
                    value=doc_type['count'],
                    unit="documents",
                    period_start=period_start,
                    period_end=period_end,
                    metadata={'type': doc_type['type_document']}
                ))
        
        # Commentaires sur documents
        total_comments = CommentaireDocumentProjet.objects.count()
        metrics.append(Metric(
            name="Commentaires sur documents",
            description="Nombre total de commentaires sur les documents",
            category=MetricCategory.DOCUMENTS,
            metric_type=MetricType.COUNT,
            value=total_comments,
            unit="commentaires",
            period_start=period_start,
            period_end=period_end
        ))
        
        return metrics
    
    def _calculate_task_metrics(self, period_start, period_end) -> List[Metric]:
        """Calcule les métriques liées aux tâches"""
        metrics = []
        
        # Nombre total de tâches
        total_tasks = Tache.objects.count()
        metrics.append(Metric(
            name="Total des tâches",
            description="Nombre total de tâches dans le système",
            category=MetricCategory.TASKS,
            metric_type=MetricType.COUNT,
            value=total_tasks,
            unit="tâches",
            period_start=period_start,
            period_end=period_end
        ))
        
        # Tâches créées dans la période
        new_tasks = Tache.objects.filter(
            cree_le__gte=period_start,
            cree_le__lte=period_end
        ).count()
        metrics.append(Metric(
            name="Nouvelles tâches",
            description=f"Tâches créées entre {period_start.strftime('%d/%m/%Y')} et {period_end.strftime('%d/%m/%Y')}",
            category=MetricCategory.TASKS,
            metric_type=MetricType.COUNT,
            value=new_tasks,
            unit="tâches",
            period_start=period_start,
            period_end=period_end
        ))
        
        # Tâches par statut
        task_status = Tache.objects.values('statut').annotate(count=Count('id'))
        for status in task_status:
            metrics.append(Metric(
                name=f"Tâches {status['statut']}",
                description=f"Nombre de tâches avec le statut '{status['statut']}'",
                category=MetricCategory.TASKS,
                metric_type=MetricType.COUNT,
                value=status['count'],
                unit="tâches",
                period_start=period_start,
                period_end=period_end,
                metadata={'statut': status['statut']}
            ))
        
        # Tâches par priorité
        task_priority = Tache.objects.values('priorite').annotate(count=Count('id'))
        for priority in task_priority:
            if priority['priorite']:
                metrics.append(Metric(
                    name=f"Tâches {priority['priorite']}",
                    description=f"Nombre de tâches avec la priorité '{priority['priorite']}'",
                    category=MetricCategory.TASKS,
                    metric_type=MetricType.COUNT,
                    value=priority['count'],
                    unit="tâches",
                    period_start=period_start,
                    period_end=period_end,
                    metadata={'priorite': priority['priorite']}
                ))
        
        return metrics
    
    def _calculate_performance_metrics(self, period_start, period_end) -> List[Metric]:
        """Calcule les métriques de performance"""
        metrics = []
        
        # Taux de completion des projets
        total_projects = Projet.objects.count()
        completed_projects = Projet.objects.filter(statut='termine').count()
        
        if total_projects > 0:
            completion_rate = (completed_projects / total_projects) * 100
            metrics.append(Metric(
                name="Taux de completion des projets",
                description="Pourcentage de projets terminés",
                category=MetricCategory.PERFORMANCE,
                metric_type=MetricType.PERCENTAGE,
                value=completion_rate,
                unit="%",
                period_start=period_start,
                period_end=period_end
            ))
        
        # Taux de completion des tâches
        total_tasks = Tache.objects.count()
        completed_tasks = Tache.objects.filter(statut='termine').count()
        
        if total_tasks > 0:
            task_completion_rate = (completed_tasks / total_tasks) * 100
            metrics.append(Metric(
                name="Taux de completion des tâches",
                description="Pourcentage de tâches terminées",
                category=MetricCategory.PERFORMANCE,
                metric_type=MetricType.PERCENTAGE,
                value=task_completion_rate,
                unit="%",
                period_start=period_start,
                period_end=period_end
            ))
        
        # Productivité par utilisateur (tâches terminées)
        user_productivity = Tache.objects.filter(
            statut='termine',
            fin__gte=period_start,
            fin__lte=period_end
        ).values('assigne_a__username').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        for user in user_productivity:
            if user['assigne_a__username']:
                metrics.append(Metric(
                    name=f"Productivité - {user['assigne_a__username']}",
                    description=f"Tâches terminées par {user['assigne_a__username']}",
                    category=MetricCategory.PERFORMANCE,
                    metric_type=MetricType.COUNT,
                    value=user['count'],
                    unit="tâches",
                    period_start=period_start,
                    period_end=period_end,
                    metadata={'utilisateur': user['assigne_a__username']}
                ))
        
        return metrics
    
    def _calculate_system_metrics(self, period_start, period_end) -> List[Metric]:
        """Calcule les métriques système"""
        metrics = []
        
        # Notifications envoyées
        total_notifications = Notification.objects.count()
        metrics.append(Metric(
            name="Total des notifications",
            description="Nombre total de notifications envoyées",
            category=MetricCategory.SYSTEM,
            metric_type=MetricType.COUNT,
            value=total_notifications,
            unit="notifications",
            period_start=period_start,
            period_end=period_end
        ))
        
        # Notifications dans la période
        new_notifications = Notification.objects.filter(
            cree_le__gte=period_start,
            cree_le__lte=period_end
        ).count()
        metrics.append(Metric(
            name="Nouvelles notifications",
            description=f"Notifications envoyées entre {period_start.strftime('%d/%m/%Y')} et {period_end.strftime('%d/%m/%Y')}",
            category=MetricCategory.SYSTEM,
            metric_type=MetricType.COUNT,
            value=new_notifications,
            unit="notifications",
            period_start=period_start,
            period_end=period_end
        ))
        
        return metrics
    
    def get_dashboard_data(self, period_days: int = 30) -> Dict[str, Any]:
        """Récupère les données pour le tableau de bord - Version ultra-rapide"""
        period_start = self.now - timedelta(days=period_days)
        period_end = self.now
        
        # Vérifier si des métriques récentes existent (moins de 10 minutes)
        recent_metrics = Metric.objects.filter(
            period_start__gte=period_start,
            period_end__lte=period_end,
            calculated_at__gte=self.now - timedelta(minutes=10)
        ).order_by('-calculated_at')
        
        if recent_metrics.exists():
            # Utiliser les métriques existantes (ultra-rapide)
            metrics = recent_metrics
        else:
            # Calculer seulement les métriques essentielles (plus rapide)
            metrics = self._calculate_essential_metrics(period_days)
            
            # Sauvegarder les métriques
            for metric in metrics:
                metric.save()
        
        # Organiser les données par catégorie
        dashboard_data = {
            'period': {
                'start': period_start.isoformat(),
                'end': period_end.isoformat(),
                'days': period_days
            },
            'categories': {}
        }
        
        for metric in metrics:
            category = metric.category
            if category not in dashboard_data['categories']:
                dashboard_data['categories'][category] = []
            
            dashboard_data['categories'][category].append({
                'name': metric.name,
                'value': metric.value,
                'unit': metric.unit,
                'type': metric.metric_type,
                'description': metric.description,
                'metadata': metric.metadata
            })
        
        return dashboard_data
    
    def _calculate_essential_metrics(self, period_days: int = 30) -> List[Metric]:
        """Calcule seulement les métriques essentielles pour le tableau de bord"""
        period_start = self.now - timedelta(days=period_days)
        period_end = self.now
        
        metrics = []
        
        # Métriques des projets (essentielles)
        metrics.extend(self._calculate_project_metrics(period_start, period_end))
        
        # Métriques des utilisateurs (essentielles)
        metrics.extend(self._calculate_user_metrics(period_start, period_end))
        
        # Métriques des tâches (essentielles)
        metrics.extend(self._calculate_task_metrics(period_start, period_end))
        
        # Métriques des équipes (essentielles)
        metrics.extend(self._calculate_team_metrics(period_start, period_end))
        
        return metrics
    
    def get_trend_data(self, metric_name: str, period_days: int = 30, group_by: str = 'day') -> List[Dict[str, Any]]:
        """Récupère les données de tendance pour une métrique"""
        period_start = self.now - timedelta(days=period_days)
        period_end = self.now
        
        # Déterminer la fonction de troncature selon group_by
        trunc_func = {
            'day': TruncDay,
            'week': TruncWeek,
            'month': TruncMonth,
            'quarter': TruncQuarter,
            'year': TruncYear
        }.get(group_by, TruncDay)
        
        # Récupérer les métriques historiques
        metrics = Metric.objects.filter(
            name=metric_name,
            period_start__gte=period_start,
            period_end__lte=period_end
        ).annotate(
            period=trunc_func('calculated_at')
        ).values('period').annotate(
            avg_value=Avg('value'),
            count=Count('id')
        ).order_by('period')
        
        return list(metrics)
    
    def generate_report(self, report_type: str, period_start, period_end, config: Dict = None) -> Dict[str, Any]:
        """Génère un rapport d'analytiques"""
        if config is None:
            config = {}
        
        # Calculer les métriques pour la période
        metrics = self.calculate_all_metrics(
            (period_end - period_start).days
        )
        
        # Filtrer les métriques par période
        filtered_metrics = [
            m for m in metrics 
            if m.period_start >= period_start and m.period_end <= period_end
        ]
        
        # Organiser les données du rapport
        report_data = {
            'report_type': report_type,
            'period_start': period_start.isoformat(),
            'period_end': period_end.isoformat(),
            'generated_at': self.now.isoformat(),
            'metrics': [],
            'summary': {},
            'charts': []
        }
        
        # Ajouter les métriques
        for metric in filtered_metrics:
            report_data['metrics'].append({
                'name': metric.name,
                'category': metric.category,
                'type': metric.metric_type,
                'value': metric.value,
                'unit': metric.unit,
                'description': metric.description,
                'metadata': metric.metadata
            })
        
        # Calculer le résumé
        total_metrics = len(filtered_metrics)
        categories = set(m.category for m in filtered_metrics)
        
        report_data['summary'] = {
            'total_metrics': total_metrics,
            'categories_count': len(categories),
            'period_days': (period_end - period_start).days,
            'categories': list(categories)
        }
        
        return report_data
    
    def _calculate_delay_metrics(self, period_start, period_end) -> List[Metric]:
        """Calcule les métriques liées aux retards et alertes"""
        metrics = []
        
        # Projets en retard (dépassant leur date de fin prévue)
        overdue_projects = Projet.objects.filter(
            fin__lt=self.now,
            statut__in=['en_cours', 'en_attente', 'en_pause']
        ).count()
        
        metrics.append(Metric(
            name="Projets en retard",
            description="Projets dépassant leur date de fin prévue",
            category=MetricCategory.PROJECTS,
            metric_type=MetricType.COUNT,
            value=overdue_projects,
            unit="projets",
            period_start=period_start,
            period_end=period_end,
            metadata={'alert_level': 'high' if overdue_projects > 0 else 'normal'}
        ))
        
        # Tâches en retard
        overdue_tasks = Tache.objects.filter(
            fin__lt=self.now,
            statut__in=['en_cours', 'en_attente', 'en_pause']
        ).count()
        
        metrics.append(Metric(
            name="Tâches en retard",
            description="Tâches dépassant leur date de fin prévue",
            category=MetricCategory.TASKS,
            metric_type=MetricType.COUNT,
            value=overdue_tasks,
            unit="tâches",
            period_start=period_start,
            period_end=period_end,
            metadata={'alert_level': 'high' if overdue_tasks > 5 else 'normal'}
        ))
        
        # Projets à risque (fin dans les 7 prochains jours)
        at_risk_projects = Projet.objects.filter(
            fin__lte=self.now + timedelta(days=7),
            fin__gte=self.now,
            statut__in=['en_cours', 'en_attente', 'en_pause']
        ).count()
        
        metrics.append(Metric(
            name="Projets à risque",
            description="Projets se terminant dans les 7 prochains jours",
            category=MetricCategory.PROJECTS,
            metric_type=MetricType.COUNT,
            value=at_risk_projects,
            unit="projets",
            period_start=period_start,
            period_end=period_end,
            metadata={'alert_level': 'medium' if at_risk_projects > 0 else 'normal'}
        ))
        
        # Tâches à risque
        at_risk_tasks = Tache.objects.filter(
            fin__lte=self.now + timedelta(days=3),
            fin__gte=self.now,
            statut__in=['en_cours', 'en_attente', 'en_pause']
        ).count()
        
        metrics.append(Metric(
            name="Tâches à risque",
            description="Tâches se terminant dans les 3 prochains jours",
            category=MetricCategory.TASKS,
            metric_type=MetricType.COUNT,
            value=at_risk_tasks,
            unit="tâches",
            period_start=period_start,
            period_end=period_end,
            metadata={'alert_level': 'medium' if at_risk_tasks > 0 else 'normal'}
        ))
        
        # Documents en attente de validation
        pending_documents = DocumentProjet.objects.filter(
            statut='en_attente'
        ).count()
        
        metrics.append(Metric(
            name="Documents en attente",
            description="Documents en attente de validation",
            category=MetricCategory.DOCUMENTS,
            metric_type=MetricType.COUNT,
            value=pending_documents,
            unit="documents",
            period_start=period_start,
            period_end=period_end,
            metadata={'alert_level': 'low' if pending_documents < 10 else 'medium'}
        ))
        
        return metrics
    
    def _calculate_team_metrics(self, period_start, period_end) -> List[Metric]:
        """Calcule les métriques liées aux équipes"""
        metrics = []
        
        # Nombre total d'équipes (services)
        total_teams = Service.objects.count()
        
        metrics.append(Metric(
            name="Total des équipes",
            description="Nombre total d'équipes dans le système",
            category=MetricCategory.USERS,
            metric_type=MetricType.COUNT,
            value=total_teams,
            unit="équipes",
            period_start=period_start,
            period_end=period_end
        ))
        
        # Équipes les plus actives (par nombre de projets)
        active_teams = Projet.objects.values('proprietaire__username').annotate(
            project_count=Count('id')
        ).order_by('-project_count')[:5]
        
        for team in active_teams:
            if team['proprietaire__username']:
                metrics.append(Metric(
                    name=f"Activité - {team['proprietaire__username']}",
                    description=f"Nombre de projets pour {team['proprietaire__username']}",
                    category=MetricCategory.USERS,
                    metric_type=MetricType.COUNT,
                    value=team['project_count'],
                    unit="projets",
                    period_start=period_start,
                    period_end=period_end,
                    metadata={'owner': team['proprietaire__username']}
                ))
        
        # Répartition des utilisateurs par équipe
        users_by_team = User.objects.values('service__nom').annotate(
            user_count=Count('id')
        ).order_by('-user_count')
        
        for team in users_by_team:
            if team['service__nom']:
                metrics.append(Metric(
                    name=f"Membres - {team['service__nom']}",
                    description=f"Nombre de membres dans l'équipe {team['service__nom']}",
                    category=MetricCategory.USERS,
                    metric_type=MetricType.COUNT,
                    value=team['user_count'],
                    unit="membres",
                    period_start=period_start,
                    period_end=period_end,
                    metadata={'team': team['service__nom']}
                ))
        
        # Taux d'occupation des équipes (membres par équipe)
        teams_capacity = Service.objects.annotate(
            total_members=Count('user')
        )
        
        for team in teams_capacity:
            if team.total_members > 0:
                metrics.append(Metric(
                    name=f"Taille équipe - {team.nom}",
                    description=f"Nombre de membres dans l'équipe {team.nom}",
                    category=MetricCategory.USERS,
                    metric_type=MetricType.COUNT,
                    value=team.total_members,
                    unit="membres",
                    period_start=period_start,
                    period_end=period_end,
                    metadata={'team': team.nom, 'total_members': team.total_members}
                ))
        
        return metrics
