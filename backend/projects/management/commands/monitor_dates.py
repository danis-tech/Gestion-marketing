from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from projects.models import Projet, Tache, MembreProjet
from projects.email_service import ProjectEmailService
from notifications.services import NotificationService
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Surveille les dates de début et de fin des projets et tâches, met à jour les statuts automatiquement et envoie des notifications'

    def handle(self, *args, **options):
        today = date.today()
        tomorrow = today + timedelta(days=1)
        
        stats = {
            'projects_starting_tomorrow': 0,
            'tasks_starting_tomorrow': 0,
            'projects_started_today': 0,
            'tasks_started_today': 0,
            'projects_overdue': 0,
            'tasks_overdue': 0,
            'emails_sent': 0,
            'notifications_created': 0
        }
        
        # ========================================================================
        # 1. PROJETS ET TÂCHES QUI COMMENCENT DEMAIN - NOTIFICATION PRÉVENTIVE
        # ========================================================================
        self.stdout.write(self.style.WARNING('\n📅 Vérification des projets et tâches qui commencent demain...'))
        
        # Projets qui commencent demain
        projets_demain = Projet.objects.filter(
            debut__date=tomorrow,
            statut__in=['en_attente']
        )
        
        for projet in projets_demain:
            try:
                # Envoyer email aux membres du projet
                members = self._get_project_members(projet)
                if members:
                    ProjectEmailService.send_project_starting_soon_email(projet, tomorrow)
                    stats['emails_sent'] += len(members)
                
                # Créer notifications internes
                for member in members:
                    NotificationService.create_personal_notification(
                        type_code='projet_debut',
                        titre=f'Projet qui commence demain: {projet.nom}',
                        message=f'Le projet "{projet.nom}" commence demain ({tomorrow.strftime("%d/%m/%Y")})',
                        destinataire=member,
                        projet=projet,
                        priorite='normale',
                        description_detaillee=f'Le projet {projet.code} - {projet.nom} est prévu pour commencer demain.'
                    )
                    stats['notifications_created'] += 1
                
                stats['projects_starting_tomorrow'] += 1
                self.stdout.write(
                    self.style.SUCCESS(f'  ✅ Notification envoyée pour le projet qui commence demain: {projet.nom}')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  ❌ Erreur pour le projet {projet.nom}: {str(e)}')
                )
                logger.error(f"Erreur lors de la notification de début de projet {projet.id}: {e}", exc_info=True)
        
        # Tâches qui commencent demain
        taches_demain = Tache.objects.filter(
            debut=tomorrow,
            statut__in=['en_attente']
        )
        
        for tache in taches_demain:
            try:
                # Envoyer email aux membres de la tâche
                members = self._get_task_members(tache)
                if members:
                    ProjectEmailService.send_task_starting_soon_email(tache, tomorrow)
                    stats['emails_sent'] += len(members)
                
                # Créer notifications internes
                for member in members:
                    NotificationService.create_personal_notification(
                        type_code='tache_debut',
                        titre=f'Tâche qui commence demain: {tache.titre}',
                        message=f'La tâche "{tache.titre}" du projet "{tache.projet.nom}" commence demain ({tomorrow.strftime("%d/%m/%Y")})',
                        destinataire=member,
                        projet=tache.projet,
                        tache=tache,
                        priorite='normale',
                        description_detaillee=f'La tâche {tache.titre} est prévue pour commencer demain.'
                    )
                    stats['notifications_created'] += 1
                
                stats['tasks_starting_tomorrow'] += 1
                self.stdout.write(
                    self.style.SUCCESS(f'  ✅ Notification envoyée pour la tâche qui commence demain: {tache.titre}')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  ❌ Erreur pour la tâche {tache.titre}: {str(e)}')
                )
                logger.error(f"Erreur lors de la notification de début de tâche {tache.id}: {e}", exc_info=True)
        
        # ========================================================================
        # 2. PROJETS ET TÂCHES QUI COMMENCENT AUJOURD'HUI - PASSER EN "EN_COURS"
        # ========================================================================
        self.stdout.write(self.style.WARNING('\n🚀 Vérification des projets et tâches qui commencent aujourd\'hui...'))
        
        # Projets qui commencent aujourd'hui
        projets_aujourdhui = Projet.objects.filter(
            debut__date=today,
            statut__in=['en_attente']
        )
        
        for projet in projets_aujourdhui:
            try:
                old_statut = projet.statut
                projet.statut = 'en_cours'
                projet.save(update_fields=['statut'])
                
                # Envoyer email aux membres
                members = self._get_project_members(projet)
                if members:
                    ProjectEmailService.send_project_started_email(projet)
                    stats['emails_sent'] += len(members)
                
                # Créer notifications internes
                for member in members:
                    NotificationService.create_personal_notification(
                        type_code='projet_debut',
                        titre=f'Projet démarré: {projet.nom}',
                        message=f'Le projet "{projet.nom}" a démarré aujourd\'hui. Statut mis à jour: {old_statut} → en_cours',
                        destinataire=member,
                        projet=projet,
                        priorite='normale',
                        description_detaillee=f'Le projet {projet.code} - {projet.nom} a commencé aujourd\'hui et son statut a été automatiquement mis à jour.'
                    )
                    stats['notifications_created'] += 1
                
                stats['projects_started_today'] += 1
                self.stdout.write(
                    self.style.SUCCESS(f'  ✅ Projet démarré et statut mis à jour: {projet.nom} (en_cours)')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  ❌ Erreur pour le projet {projet.nom}: {str(e)}')
                )
                logger.error(f"Erreur lors du démarrage du projet {projet.id}: {e}", exc_info=True)
        
        # Tâches qui commencent aujourd'hui
        taches_aujourdhui = Tache.objects.filter(
            debut=today,
            statut__in=['en_attente']
        )
        
        for tache in taches_aujourdhui:
            try:
                old_statut = tache.statut
                tache.statut = 'en_cours'
                tache.save(update_fields=['statut'])
                
                # Envoyer email aux membres
                members = self._get_task_members(tache)
                if members:
                    ProjectEmailService.send_task_started_email(tache)
                    stats['emails_sent'] += len(members)
                
                # Créer notifications internes
                for member in members:
                    NotificationService.create_personal_notification(
                        type_code='tache_debut',
                        titre=f'Tâche démarrée: {tache.titre}',
                        message=f'La tâche "{tache.titre}" du projet "{tache.projet.nom}" a démarré aujourd\'hui. Statut mis à jour: {old_statut} → en_cours',
                        destinataire=member,
                        projet=tache.projet,
                        tache=tache,
                        priorite='normale',
                        description_detaillee=f'La tâche {tache.titre} a commencé aujourd\'hui et son statut a été automatiquement mis à jour.'
                    )
                    stats['notifications_created'] += 1
                
                stats['tasks_started_today'] += 1
                self.stdout.write(
                    self.style.SUCCESS(f'  ✅ Tâche démarrée et statut mis à jour: {tache.titre} (en_cours)')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  ❌ Erreur pour la tâche {tache.titre}: {str(e)}')
                )
                logger.error(f"Erreur lors du démarrage de la tâche {tache.id}: {e}", exc_info=True)
        
        # ========================================================================
        # 3. PROJETS ET TÂCHES EN RETARD - PASSER EN "HORS_DELAI"
        # ========================================================================
        self.stdout.write(self.style.WARNING('\n⚠️  Vérification des projets et tâches en retard...'))
        
        # Projets en retard
        projets_retard = Projet.objects.filter(
            fin__date__lt=today,
            statut__in=['en_attente', 'en_cours']
        ).exclude(statut__in=['termine', 'hors_delai', 'rejete'])
        
        for projet in projets_retard:
            try:
                old_statut = projet.statut
                projet.statut = 'hors_delai'
                projet.save(update_fields=['statut'])
                
                # Envoyer email aux membres
                members = self._get_project_members(projet)
                if members:
                    ProjectEmailService.send_project_delay_email(projet)
                    stats['emails_sent'] += len(members)
                
                # Créer notifications internes
                jours_retard = (today - projet.fin.date()).days
                NotificationService.notify_project_delay(projet)
                stats['notifications_created'] += len(members) + 1  # Générale + personnelles
                
                stats['projects_overdue'] += 1
                self.stdout.write(
                    self.style.SUCCESS(f'  ✅ Projet en retard, statut mis à jour: {projet.nom} (hors_delai, {jours_retard} jour(s) de retard)')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  ❌ Erreur pour le projet {projet.nom}: {str(e)}')
                )
                logger.error(f"Erreur lors de la mise à jour du projet en retard {projet.id}: {e}", exc_info=True)
        
        # Tâches en retard
        taches_retard = Tache.objects.filter(
            fin__lt=today,
            statut__in=['en_attente', 'en_cours']
        ).exclude(statut__in=['termine', 'hors_delai', 'rejete'])
        
        for tache in taches_retard:
            try:
                old_statut = tache.statut
                tache.statut = 'hors_delai'
                tache.save(update_fields=['statut'])
                
                # Envoyer email aux membres
                members = self._get_task_members(tache)
                if members:
                    ProjectEmailService.send_task_delay_email(tache)
                    stats['emails_sent'] += len(members)
                
                # Créer notifications internes
                jours_retard = (today - tache.fin).days
                NotificationService.notify_task_delay(tache)
                stats['notifications_created'] += len(members) + 1  # Générale + personnelles
                
                stats['tasks_overdue'] += 1
                self.stdout.write(
                    self.style.SUCCESS(f'  ✅ Tâche en retard, statut mis à jour: {tache.titre} (hors_delai, {jours_retard} jour(s) de retard)')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  ❌ Erreur pour la tâche {tache.titre}: {str(e)}')
                )
                logger.error(f"Erreur lors de la mise à jour de la tâche en retard {tache.id}: {e}", exc_info=True)
        
        # ========================================================================
        # RÉSUMÉ
        # ========================================================================
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('📊 RÉSUMÉ DE LA SURVEILLANCE'))
        self.stdout.write(self.style.SUCCESS('='*60))
        self.stdout.write(f'  📅 Projets qui commencent demain: {stats["projects_starting_tomorrow"]}')
        self.stdout.write(f'  📅 Tâches qui commencent demain: {stats["tasks_starting_tomorrow"]}')
        self.stdout.write(f'  🚀 Projets démarrés aujourd\'hui: {stats["projects_started_today"]}')
        self.stdout.write(f'  🚀 Tâches démarrées aujourd\'hui: {stats["tasks_started_today"]}')
        self.stdout.write(f'  ⚠️  Projets en retard: {stats["projects_overdue"]}')
        self.stdout.write(f'  ⚠️  Tâches en retard: {stats["tasks_overdue"]}')
        self.stdout.write(f'  📧 Emails envoyés: {stats["emails_sent"]}')
        self.stdout.write(f'  🔔 Notifications créées: {stats["notifications_created"]}')
        self.stdout.write(self.style.SUCCESS('='*60))
    
    def _get_project_members(self, project):
        """Récupère tous les membres d'un projet."""
        membres = MembreProjet.objects.filter(projet=project).select_related('utilisateur')
        members_list = [membre.utilisateur for membre in membres if membre.utilisateur.email]
        
        # Ajouter le propriétaire s'il n'est pas déjà dans la liste
        if project.proprietaire.email and project.proprietaire not in members_list:
            members_list.append(project.proprietaire)
        
        return members_list
    
    def _get_task_members(self, task):
        """Récupère tous les membres d'une tâche (assignés + membres du projet)."""
        members = set()
        
        # Ajouter les personnes assignées à la tâche
        if hasattr(task, 'assigne_a'):
            for user in task.assigne_a.all():
                if user.email:
                    members.add(user)
        
        # Ajouter les membres du projet
        project_members = self._get_project_members(task.projet)
        members.update(project_members)
        
        return list(members)

