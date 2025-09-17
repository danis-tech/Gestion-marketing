from django.core.management.base import BaseCommand
from projects.models import PhaseProjet


class Command(BaseCommand):
    help = 'Initialise les phases standard des projets dans la base de données'

    def handle(self, *args, **options):
        """Initialise les 6 phases standard des projets."""
        self.stdout.write('Initialisation des phases standard...')
        
        phases_data = PhaseProjet.get_phases_standard()
        phases_crees = 0
        phases_existantes = 0
        
        for phase_data in phases_data:
            phase, created = PhaseProjet.objects.get_or_create(
                nom=phase_data['nom'],
                defaults={
                    'ordre': phase_data['ordre'],
                    'description': phase_data['description'],
                    'active': True
                }
            )
            
            if created:
                phases_crees += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Phase créée: {phase.ordre}. {phase.nom}')
                )
            else:
                phases_existantes += 1
                self.stdout.write(
                    self.style.WARNING(f'→ Phase existante: {phase.ordre}. {phase.nom}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nRésumé: {phases_crees} phases créées, {phases_existantes} phases existantes'
            )
        )
        
        if phases_crees > 0:
            self.stdout.write(
                self.style.SUCCESS('✓ Initialisation des phases standard terminée avec succès!')
            )
        else:
            self.stdout.write(
                self.style.WARNING('→ Toutes les phases standard existaient déjà.')
            )
