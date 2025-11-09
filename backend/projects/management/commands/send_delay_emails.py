from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from projects.models import Projet, Tache, Etape
from projects.email_service import ProjectEmailService


class Command(BaseCommand):
    help = 'Envoie des emails de retard pour les projets, tâches et étapes en retard (à exécuter 3 fois par jour)'

    def handle(self, *args, **options):
        today = date.today()
        sent_count = 0
        
        # 1. Projets en retard
        projets_en_retard = Projet.objects.filter(
            fin__date__lt=today,
            statut__in=['en_attente', 'en_cours']
        ).exclude(statut='termine')
        
        for projet in projets_en_retard:
            try:
                ProjectEmailService.send_project_delay_email(projet)
                sent_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Email de retard envoyé pour le projet: {projet.nom}')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Erreur lors de l\'envoi pour le projet {projet.nom}: {str(e)}')
                )
        
        # 2. Tâches en retard
        taches_en_retard = Tache.objects.filter(
            fin__lt=today,
            statut__in=['en_attente', 'en_cours']
        ).exclude(statut='termine')
        
        for tache in taches_en_retard:
            try:
                ProjectEmailService.send_task_delay_email(tache)
                sent_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Email de retard envoyé pour la tâche: {tache.titre}')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Erreur lors de l\'envoi pour la tâche {tache.titre}: {str(e)}')
                )
        
        # 3. Étapes en retard
        etapes_en_retard = Etape.objects.filter(
            date_fin_prevue__lt=today,
            statut__in=['en_attente', 'en_cours']
        ).exclude(statut='terminee')
        
        for etape in etapes_en_retard:
            try:
                ProjectEmailService.send_step_delay_email(etape)
                sent_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Email de retard envoyé pour l\'étape: {etape.nom}')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Erreur lors de l\'envoi pour l\'étape {etape.nom}: {str(e)}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'\n🎉 Total: {sent_count} email(s) de retard envoyé(s)')
        )

