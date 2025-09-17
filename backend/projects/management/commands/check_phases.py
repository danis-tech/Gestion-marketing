from django.core.management.base import BaseCommand
from projects.models import PhaseProjet, Projet, ProjetPhaseEtat

class Command(BaseCommand):
    help = 'Vérifie et crée les phases standard si nécessaire'

    def handle(self, *args, **options):
        # Vérifier les phases standard
        phases_standard = PhaseProjet.objects.all()
        self.stdout.write(f"Phases standard trouvées: {phases_standard.count()}")
        
        for phase in phases_standard:
            self.stdout.write(f"- {phase.ordre}. {phase.nom} (Active: {phase.active})")
        
        # Vérifier les projets et leurs phases
        projets = Projet.objects.all()
        self.stdout.write(f"\nProjets trouvés: {projets.count()}")
        
        for projet in projets:
            phases_projet = ProjetPhaseEtat.objects.filter(projet=projet)
            self.stdout.write(f"- {projet.nom} (ID: {projet.id}): {phases_projet.count()} phases")
            
            for phase_etat in phases_projet:
                self.stdout.write(f"  * {phase_etat.phase.nom} - Terminée: {phase_etat.terminee}, En cours: {phase_etat.est_en_cours}")
        
        # Si aucune phase standard n'existe, les créer
        if phases_standard.count() == 0:
            self.stdout.write("\nAucune phase standard trouvée. Création des phases standard...")
            self._creer_phases_standard()
        else:
            self.stdout.write("\nPhases standard déjà existantes.")
    
    def _creer_phases_standard(self):
        """Crée les 6 phases standard."""
        phases_data = [
            {
                'ordre': 1,
                'nom': 'Expression du besoin',
                'description': 'Définition et analyse des besoins du projet',
                'active': True
            },
            {
                'ordre': 2,
                'nom': 'Études de faisabilité',
                'description': 'Analyse de la faisabilité technique et économique',
                'active': True
            },
            {
                'ordre': 3,
                'nom': 'Conception',
                'description': 'Conception détaillée de la solution',
                'active': True
            },
            {
                'ordre': 4,
                'nom': 'Développement / Implémentation',
                'description': 'Développement et implémentation de la solution',
                'active': True
            },
            {
                'ordre': 5,
                'nom': 'Lancement commercial',
                'description': 'Mise sur le marché et lancement commercial',
                'active': True
            },
            {
                'ordre': 6,
                'nom': 'Suppression d\'une offre',
                'description': 'Suppression ou arrêt d\'une offre existante',
                'active': True
            }
        ]
        
        for phase_data in phases_data:
            phase, created = PhaseProjet.objects.get_or_create(
                ordre=phase_data['ordre'],
                defaults=phase_data
            )
            if created:
                self.stdout.write(f"Créée: {phase.nom}")
            else:
                self.stdout.write(f"Existe déjà: {phase.nom}")
        
        self.stdout.write("Phases standard créées avec succès!")
