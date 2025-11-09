from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Projet, ProjetPhaseEtat, Etape

@receiver(post_save, sender=Etape)
def update_phase_status_on_etape_change(sender, instance, created, **kwargs):
    """
    Met à jour automatiquement le statut de la phase quand une étape change de statut
    """
    if not created:  # Seulement pour les mises à jour, pas la création
        phase_etat = instance.phase_etat
        
        # Si l'étape est mise en cours, marquer la phase comme en cours
        if instance.statut == 'en_cours' and not phase_etat.est_en_cours:
            phase_etat.date_debut = timezone.now()
            phase_etat.save(update_fields=['date_debut', 'mis_a_jour_le'])
            print(f"🔄 Phase '{phase_etat.phase.nom}' automatiquement mise en cours")
        
        # Vérifier si toutes les étapes sont terminées pour marquer la phase comme terminée
        etapes_non_terminees = phase_etat.etapes.exclude(
            statut__in=['terminee', 'annulee']
        ).exists()
        
        if not etapes_non_terminees and phase_etat.etapes.exists() and not phase_etat.terminee:
            phase_etat.terminee = True
            phase_etat.date_fin = timezone.now()
            phase_etat.save(update_fields=['terminee', 'date_fin', 'mis_a_jour_le'])
            print(f"✅ Phase '{phase_etat.phase.nom}' automatiquement terminée")

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
