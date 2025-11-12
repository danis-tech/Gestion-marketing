from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Projet, ProjetPhaseEtat

@receiver(post_save, sender=ProjetPhaseEtat)
def update_project_status_on_phase_change(sender, instance, created, **kwargs):
    """
    Met à jour automatiquement le statut du projet quand une phase change de statut
    """
    if not created:  # Seulement pour les mises à jour, pas la création
        projet = instance.projet
        
        # Vérifier si toutes les phases sont terminées pour marquer le projet comme terminé
        phases_non_terminees = projet.phases_etat.exclude(
            terminee=True
        ).exclude(
            ignoree=True
        ).exists()
        
        if not phases_non_terminees and projet.phases_etat.exists() and not projet.est_termine:
            projet.statut = 'termine'
            projet.save(update_fields=['statut', 'mis_a_jour_le'])
            print(f"🎯 Projet '{projet.nom}' automatiquement terminé")
        
        # Si le projet était terminé mais qu'une phase n'est plus terminée, le marquer comme non terminé
        elif phases_non_terminees and projet.est_termine:
            projet.statut = 'en_attente'
            projet.save(update_fields=['statut', 'mis_a_jour_le'])
            print(f"🔄 Projet '{projet.nom}' automatiquement marqué comme non terminé")
