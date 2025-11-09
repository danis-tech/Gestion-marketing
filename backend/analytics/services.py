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
from projects.models import Projet, Tache, PhaseProjet, ProjetPhaseEtat, Etape
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
    
    def _calculate_project_metrics(self, period_start, period_end, project_id: Optional[int] = None) -> List[Metric]:
        """Calcule les métriques liées aux projets"""
        metrics = []
        
        # Filtrer par projet si spécifié
        projects_queryset = Projet.objects.all()
        if project_id:
            projects_queryset = projects_queryset.filter(id=project_id)
        
        # Nombre total de projets
        total_projects = projects_queryset.count()
        metrics.append(Metric(
            name="Total des projets",
            description="Nombre total de projets dans le système" + (f" (projet {project_id})" if project_id else ""),
            category=MetricCategory.PROJECTS,
            metric_type=MetricType.COUNT,
            value=total_projects,
            unit="projets",
            period_start=period_start,
            period_end=period_end,
            metadata={'project_id': project_id} if project_id else {}
        ))
        
        # Projets créés dans la période
        new_projects = projects_queryset.filter(
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
            period_end=period_end,
            metadata={'project_id': project_id} if project_id else {}
        ))
        
        # Projets par statut
        project_status = projects_queryset.values('statut').annotate(count=Count('id'))
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
                metadata={'statut': status['statut'], 'project_id': project_id} if project_id else {'statut': status['statut']}
            ))
        
        # Projets par propriétaire
        projects_by_owner = projects_queryset.values('proprietaire__username').annotate(count=Count('id'))
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
                    metadata={'owner': owner['proprietaire__username'], 'project_id': project_id} if project_id else {'owner': owner['proprietaire__username']}
                ))
        
        # Durée moyenne des projets
        completed_projects = projects_queryset.filter(
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
    
    def _calculate_task_metrics(self, period_start, period_end, project_id: Optional[int] = None) -> List[Metric]:
        """Calcule les métriques liées aux tâches"""
        metrics = []
        
        # Filtrer par projet si spécifié
        tasks_queryset = Tache.objects.all()
        if project_id:
            tasks_queryset = tasks_queryset.filter(projet_id=project_id)
        
        # Nombre total de tâches
        total_tasks = tasks_queryset.count()
        metrics.append(Metric(
            name="Total des tâches",
            description="Nombre total de tâches dans le système" + (f" (projet {project_id})" if project_id else ""),
            category=MetricCategory.TASKS,
            metric_type=MetricType.COUNT,
            value=total_tasks,
            unit="tâches",
            period_start=period_start,
            period_end=period_end,
            metadata={'project_id': project_id} if project_id else {}
        ))
        
        # Tâches créées dans la période
        new_tasks = tasks_queryset.filter(
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
            period_end=period_end,
            metadata={'project_id': project_id} if project_id else {}
        ))
        
        # Tâches par statut
        task_status = tasks_queryset.values('statut').annotate(count=Count('id'))
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
                metadata={'statut': status['statut'], 'project_id': project_id} if project_id else {'statut': status['statut']}
            ))
        
        # Tâches par priorité
        task_priority = tasks_queryset.values('priorite').annotate(count=Count('id'))
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
                    metadata={'priorite': priority['priorite'], 'project_id': project_id} if project_id else {'priorite': priority['priorite']}
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
    
    def get_project_dashboard_data(self, project_id: int) -> Dict[str, Any]:
        """Récupère toutes les données détaillées pour un projet spécifique"""
        try:
            project = Projet.objects.get(id=project_id)
        except Projet.DoesNotExist:
            logger.warning(f'Projet avec ID {project_id} non trouvé')
            return {}
        except Exception as e:
            logger.error(f'Erreur lors de la récupération du projet {project_id}: {str(e)}')
            return {}
        
        # Informations du projet
        project_info = {
            'id': project.id,
            'code': project.code,
            'nom': project.nom,
            'statut': project.statut,
            'statut_display': project.get_statut_display(),
            'priorite': project.priorite,
            'priorite_display': project.get_priorite_display(),
            'debut': project.debut.isoformat() if project.debut else None,
            'fin': project.fin.isoformat() if project.fin else None,
            'proprietaire': {
                'id': project.proprietaire.id,
                'nom': project.proprietaire.get_full_name(),
                'username': project.proprietaire.username
            } if project.proprietaire else None,
            'description': project.description,
            'objectif': project.objectif,
        }
        
        # Progression globale du projet (par phases)
        phases_etat = project.phases_etat.all()
        total_phases = phases_etat.count()
        phases_terminees = phases_etat.filter(terminee=True).count()
        phases_en_cours = phases_etat.filter(
            date_debut__isnull=False,
            terminee=False,
            ignoree=False
        ).count()
        phases_en_attente = phases_etat.filter(
            date_debut__isnull=True,
            terminee=False,
            ignoree=False
        ).count()
        
        progression_globale = (phases_terminees / total_phases * 100) if total_phases > 0 else 0
        
        # Détails des phases
        phases_detail = []
        for phase_etat in phases_etat:
            # Compter les étapes de cette phase
            etapes = phase_etat.etapes.all()
            total_etapes = etapes.count()
            etapes_terminees = etapes.filter(statut='termine').count()
            etapes_en_cours = etapes.filter(statut='en_cours').count()
            etapes_en_attente = etapes.filter(statut='en_attente').count()
            
            progression_phase = (etapes_terminees / total_etapes * 100) if total_etapes > 0 else 0
            
            phases_detail.append({
                'id': phase_etat.id,
                'phase_id': phase_etat.phase.id,
                'nom': phase_etat.phase.nom,
                'ordre': phase_etat.phase.ordre,
                'terminee': phase_etat.terminee,
                'ignoree': phase_etat.ignoree,
                'date_debut': phase_etat.date_debut.isoformat() if phase_etat.date_debut else None,
                'date_fin': phase_etat.date_fin.isoformat() if phase_etat.date_fin else None,
                'progression': round(progression_phase, 1),
                'total_etapes': total_etapes,
                'etapes_terminees': etapes_terminees,
                'etapes_en_cours': etapes_en_cours,
                'etapes_en_attente': etapes_en_attente,
            })
        
        # Tâches du projet
        taches = project.taches.all().prefetch_related('assigne_a')
        taches_par_statut = taches.values('statut').annotate(count=Count('id'))
        taches_par_priorite = taches.values('priorite').annotate(count=Count('id'))
        
        taches_statut_data = {item['statut']: item['count'] for item in taches_par_statut}
        taches_priorite_data = {item['priorite']: item['count'] for item in taches_par_priorite}
        
        # Liste complète des tâches avec détails
        taches_list = []
        for tache in taches:
            # Récupérer les responsables de la tâche (assigne_a est maintenant ManyToMany)
            # Prendre le premier assigné comme responsable principal pour la compatibilité
            responsable_info = None
            assignes = tache.assigne_a.all()
            if assignes.exists():
                premier_assigne = assignes.first()
                responsable_info = {
                    'id': premier_assigne.id,
                    'nom_complet': f"{premier_assigne.prenom} {premier_assigne.nom}",
                    'prenom': premier_assigne.prenom,
                    'nom': premier_assigne.nom,
                    'username': premier_assigne.username,
                    'email': premier_assigne.email,
                    'photo_url': premier_assigne.photo_url,
                }
            
            taches_list.append({
                'id': tache.id,
                'titre': tache.titre,
                'statut': tache.statut,
                'statut_display': tache.get_statut_display(),
                'priorite': tache.priorite,
                'priorite_display': tache.get_priorite_display(),
                'phase': tache.phase,
                'debut': tache.debut.isoformat() if tache.debut else None,
                'fin': tache.fin.isoformat() if tache.fin else None,
                'responsable': responsable_info,
            })
        
        # Membres de l'équipe
        membres = project.membres.all().select_related('utilisateur', 'service')
        membres_par_service = membres.values('service__nom', 'service__id').annotate(
            count=Count('id')
        )
        
        equipe_data = []
        membres_details = []
        
        for service in membres_par_service:
            if service['service__nom']:
                # Récupérer les membres de ce service pour ce projet
                membres_du_service = membres.filter(service_id=service['service__id'])
                membres_list = []
                
                for membre in membres_du_service:
                    membres_list.append({
                        'id': membre.utilisateur.id,
                        'nom_complet': f"{membre.utilisateur.prenom} {membre.utilisateur.nom}",
                        'prenom': membre.utilisateur.prenom,
                        'nom': membre.utilisateur.nom,
                        'username': membre.utilisateur.username,
                        'email': membre.utilisateur.email,
                        'role_projet': membre.role_projet,
                        'photo_url': membre.utilisateur.photo_url,
                    })
                
                equipe_data.append({
                    'service': service['service__nom'],
                    'service_id': service['service__id'],
                    'count': service['count'],
                    'membres': membres_list  # Ajout de la liste des membres
                })
        
        # Liste complète de tous les membres (pour affichage détaillé)
        for membre in membres:
            # Récupérer les tâches assignées à ce membre pour ce projet
            taches_membre = Tache.objects.filter(
                projet=project,
                assigne_a=membre.utilisateur
            ).prefetch_related('assigne_a')
            
            taches_par_statut_membre = taches_membre.values('statut').annotate(count=Count('id'))
            taches_statut_membre = {item['statut']: item['count'] for item in taches_par_statut_membre}
            
            taches_list = []
            for tache in taches_membre:
                # Récupérer les responsables de la tâche (assigne_a est maintenant ManyToMany)
                # Prendre le premier assigné comme responsable principal pour la compatibilité
                responsable_info = None
                assignes = tache.assigne_a.all()
                if assignes.exists():
                    premier_assigne = assignes.first()
                    responsable_info = {
                        'id': premier_assigne.id,
                        'nom_complet': f"{premier_assigne.prenom} {premier_assigne.nom}",
                        'prenom': premier_assigne.prenom,
                        'nom': premier_assigne.nom,
                        'username': premier_assigne.username,
                        'email': premier_assigne.email,
                        'photo_url': premier_assigne.photo_url,
                    }
                
                taches_list.append({
                    'id': tache.id,
                    'titre': tache.titre,
                    'statut': tache.statut,
                    'statut_display': tache.get_statut_display(),
                    'priorite': tache.priorite,
                    'priorite_display': tache.get_priorite_display(),
                    'phase': tache.phase,
                    'debut': tache.debut.isoformat() if tache.debut else None,
                    'fin': tache.fin.isoformat() if tache.fin else None,
                    'responsable': responsable_info,  # Ajout du responsable
                })
            
            membres_details.append({
                'id': membre.utilisateur.id,
                'nom_complet': f"{membre.utilisateur.prenom} {membre.utilisateur.nom}",
                'prenom': membre.utilisateur.prenom,
                'nom': membre.utilisateur.nom,
                'username': membre.utilisateur.username,
                'email': membre.utilisateur.email,
                'role_projet': membre.role_projet,
                'service': membre.service.nom if membre.service else None,
                'service_id': membre.service.id if membre.service else None,
                'photo_url': membre.utilisateur.photo_url,
                'taches': {
                    'total': taches_membre.count(),
                    'par_statut': taches_statut_membre,
                    'liste': taches_list,
                },
            })
        
        # Statistiques des étapes
        toutes_etapes = Etape.objects.filter(phase_etat__projet=project)
        etapes_par_statut = toutes_etapes.values('statut').annotate(count=Count('id'))
        etapes_statut_data = {item['statut']: item['count'] for item in etapes_par_statut}
        
        return {
            'project': project_info,
            'progression': {
                'globale': round(progression_globale, 1),
                'phases_terminees': phases_terminees,
                'phases_en_cours': phases_en_cours,
                'phases_en_attente': phases_en_attente,
                'total_phases': total_phases,
            },
            'phases': phases_detail,
            'taches': {
                'total': taches.count(),
                'par_statut': taches_statut_data,
                'par_priorite': taches_priorite_data,
                'liste': taches_list,  # Liste complète des tâches
            },
            'equipe': {
                'total_membres': membres.count(),
                'par_service': equipe_data,
                'membres': membres_details if membres_details else [],  # Liste complète de tous les membres avec leurs détails
            },
            'etapes': {
                'total': toutes_etapes.count(),
                'par_statut': etapes_statut_data,
            }
        }
    
    def get_dashboard_data(self, period_days: int = 30, project_id: Optional[int] = None) -> Dict[str, Any]:
        """Récupère les données pour le tableau de bord - Version ultra-rapide"""
        period_start = self.now - timedelta(days=period_days)
        period_end = self.now
        
        # Si un project_id est fourni, calculer directement les métriques pour ce projet
        if project_id:
            metrics = self._calculate_essential_metrics(period_days, project_id)
        else:
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
            'project_id': project_id,
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
    
    def _calculate_essential_metrics(self, period_days: int = 30, project_id: Optional[int] = None) -> List[Metric]:
        """Calcule seulement les métriques essentielles pour le tableau de bord"""
        period_start = self.now - timedelta(days=period_days)
        period_end = self.now
        
        metrics = []
        
        # Métriques des projets (essentielles) - filtrées par projet si spécifié
        metrics.extend(self._calculate_project_metrics(period_start, period_end, project_id))
        
        # Métriques des utilisateurs (essentielles) - pas de filtre projet
        if not project_id:
            metrics.extend(self._calculate_user_metrics(period_start, period_end))
        
        # Métriques des tâches (essentielles) - filtrées par projet si spécifié
        metrics.extend(self._calculate_task_metrics(period_start, period_end, project_id))
        
        # Métriques des équipes (essentielles) - filtrées par projet si spécifié
        if project_id:
            metrics.extend(self._calculate_team_metrics_for_project(period_start, period_end, project_id))
        else:
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
    
    def _calculate_team_metrics_for_project(self, period_start, period_end, project_id: int) -> List[Metric]:
        """Calcule les métriques liées aux équipes pour un projet spécifique"""
        metrics = []
        
        try:
            project = Projet.objects.get(id=project_id)
            
            # Membres du projet
            members = project.membres.all()
            total_members = members.count()
            
            metrics.append(Metric(
                name="Membres du projet",
                description=f"Nombre de membres dans le projet {project.nom}",
                category=MetricCategory.USERS,
                metric_type=MetricType.COUNT,
                value=total_members,
                unit="membres",
                period_start=period_start,
                period_end=period_end,
                metadata={'project_id': project_id, 'project_name': project.nom}
            ))
            
            # Répartition par service pour ce projet
            members_by_service = members.values('service__nom').annotate(
                count=Count('id')
            )
            
            for service in members_by_service:
                if service['service__nom']:
                    metrics.append(Metric(
                        name=f"Membres - {service['service__nom']}",
                        description=f"Membres du service {service['service__nom']} dans le projet",
                        category=MetricCategory.USERS,
                        metric_type=MetricType.COUNT,
                        value=service['count'],
                        unit="membres",
                        period_start=period_start,
                        period_end=period_end,
                        metadata={'service': service['service__nom'], 'project_id': project_id}
                    ))
        except Projet.DoesNotExist:
            pass
        
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
