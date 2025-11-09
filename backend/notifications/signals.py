from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.contrib.auth.signals import user_logged_in, user_logged_out

from .services import NotificationService
from projects.models import (
    Projet, Tache, Etape, MembreProjet, ProjetPhaseEtat, 
    HistoriqueEtat, PermissionProjet
)
from projects.email_service import ProjectEmailService
from documents.models import (
    DocumentProjet, DocumentTeleverse, CommentaireDocumentProjet,
    HistoriqueDocumentProjet
)
from accounts.models import User, Service, Role, Permission

User = get_user_model()


@receiver(post_save, sender=Projet)
def notify_project_changes(sender, instance, created, **kwargs):
    """
    Notifier les changements de projet
    """
    if created:
        # Nouveau projet créé
        NotificationService.create_personal_notification(
            type_code='projet_chef',
            titre=f'Nouveau projet: {instance.nom}',
            message=f'Vous êtes chef du nouveau projet "{instance.nom}"',
            destinataire=instance.proprietaire,
            projet=instance,
            priorite='elevee'
        )
        # Notification générale pour tous les utilisateurs
        NotificationService.create_general_notification(
            type_code='projet_en_cours',
            titre=f'Nouveau projet créé: {instance.nom}',
            message=f'Un nouveau projet "{instance.nom}" a été créé par {instance.proprietaire.prenom} {instance.proprietaire.nom}',
            projet=instance,
            priorite='normale'
        )
        # Envoyer un email à tous les membres du projet
        try:
            ProjectEmailService.send_project_created_email(instance)
        except Exception:
            pass
    else:
        # Projet modifié
        # Notification générale pour informer de la modification
        NotificationService.create_general_notification(
            type_code='projet_en_cours',
            titre=f'Projet modifié: {instance.nom}',
            message=f'Le projet "{instance.nom}" a été modifié',
            projet=instance,
            priorite='normale'
        )
        # Envoyer un email à tous les membres du projet
        try:
            ProjectEmailService.send_project_updated_email(instance)
        except Exception:
            pass
        # Vérifier si le projet est en retard
        if instance.fin and instance.fin.date() < timezone.now().date():
            NotificationService.notify_project_delay(instance)


@receiver(post_save, sender=Tache)
def notify_task_changes(sender, instance, created, **kwargs):
    """
    Notifier les changements de tâche
    """
    if created:
        # Nouvelle tâche créée
        if instance.assigne_a.exists():
            # Nouvelle tâche assignée
            NotificationService.notify_task_assigned(instance, instance.assigne_a.first())
        # Envoyer un email à tous les membres de la tâche
        try:
            ProjectEmailService.send_task_created_email(instance)
        except Exception:
            pass
    else:
        # Tâche modifiée
        # Envoyer un email à tous les membres de la tâche
        try:
            ProjectEmailService.send_task_updated_email(instance)
        except Exception:
            pass
        # Vérifier si la tâche est terminée
        if instance.statut == 'termine':
            NotificationService.notify_task_completed(instance)
        # Vérifier si la tâche est en retard
        elif instance.fin and instance.fin < timezone.now().date() and instance.statut != 'termine':
            NotificationService.notify_task_delay(instance)


@receiver(post_save, sender=MembreProjet)
def notify_team_member_added(sender, instance, created, **kwargs):
    """
    Notifier l'ajout d'un membre à l'équipe
    """
    if created:
        NotificationService.notify_team_member_added(instance.projet, instance.membre)


@receiver(post_save, sender=Etape)
def notify_step_changes(sender, instance, created, **kwargs):
    """
    Notifier les changements d'étape
    """
    if created:
        # Nouvelle étape créée
        # Envoyer un email à tous les membres de l'étape
        try:
            ProjectEmailService.send_step_created_email(instance)
        except Exception:
            pass
    else:
        # Étape modifiée
        # Envoyer un email à tous les membres de l'étape
        try:
            ProjectEmailService.send_step_updated_email(instance)
        except Exception:
            pass
        # Vérifier si l'étape est terminée
        if instance.statut == 'terminee':
            NotificationService.notify_step_completed(instance)


# ============================================================================
# SIGNALS POUR LES PROJETS
# ============================================================================

@receiver(post_save, sender=ProjetPhaseEtat)
def notify_phase_changes(sender, instance, created, **kwargs):
    """
    Notifier les changements de phase de projet
    """
    if created:
        # Nouvelle phase créée
        NotificationService.create_general_notification(
            type_code='projet_en_cours',
            titre=f'Phase "{instance.phase.nom}" créée',
            message=f'La phase "{instance.phase.nom}" a été créée pour le projet {instance.projet.nom}',
            projet=instance.projet,
            priorite='normale'
        )
    else:
        # Vérifier si la phase a été terminée
        if instance.terminee:
            NotificationService.create_general_notification(
                type_code='etape_terminee',
                titre=f'Phase "{instance.phase.nom}" terminée',
                message=f'La phase "{instance.phase.nom}" du projet {instance.projet.nom} a été terminée',
                projet=instance.projet,
                priorite='normale'
            )

@receiver(post_save, sender=HistoriqueEtat)
def notify_project_status_change(sender, instance, created, **kwargs):
    """
    Notifier les changements de statut de projet
    """
    if created:
        NotificationService.create_general_notification(
            type_code='projet_valide',
            titre=f'Statut du projet {instance.projet.nom} modifié',
            message=f'Le statut du projet {instance.projet.nom} est passé de "{instance.de_etat}" à "{instance.vers_etat}"',
            projet=instance.projet,
            priorite='elevee'
        )

@receiver(post_save, sender=PermissionProjet)
def notify_permission_changes(sender, instance, created, **kwargs):
    """
    Notifier les changements de permissions sur un projet
    """
    if created:
        NotificationService.create_personal_notification(
            type_code='projet_chef',
            titre=f'Nouvelle permission sur le projet {instance.projet.nom}',
            message=f'Vous avez reçu la permission "{instance.get_permission_display()}" sur le projet {instance.projet.nom}',
            destinataire=instance.utilisateur,
            projet=instance.projet,
            priorite='normale'
        )

# ============================================================================
# SIGNALS POUR LES DOCUMENTS
# ============================================================================

@receiver(post_save, sender=DocumentProjet)
def notify_document_changes(sender, instance, created, **kwargs):
    """
    Notifier les changements de documents de projet
    """
    if created:
        # Nouveau document créé
        NotificationService.create_general_notification(
            type_code='document_valide',
            titre=f'Nouveau document: {instance.get_type_document_display()}',
            message=f'Un nouveau document "{instance.get_type_document_display()}" a été créé pour le projet {instance.projet.nom}',
            projet=instance.projet,
            priorite='normale'
        )
    else:
        # Vérifier si le statut a changé
        if instance.statut == 'final':
            NotificationService.create_general_notification(
                type_code='document_valide',
                titre=f'Document finalisé: {instance.get_type_document_display()}',
                message=f'Le document "{instance.get_type_document_display()}" du projet {instance.projet.nom} a été finalisé',
                projet=instance.projet,
                priorite='normale'
            )
        elif instance.statut == 'rejete':
            NotificationService.create_general_notification(
                type_code='document_rejete',
                titre=f'Document rejeté: {instance.get_type_document_display()}',
                message=f'Le document "{instance.get_type_document_display()}" du projet {instance.projet.nom} a été rejeté',
                projet=instance.projet,
                priorite='elevee'
            )

@receiver(post_save, sender=DocumentTeleverse)
def notify_uploaded_document_changes(sender, instance, created, **kwargs):
    """
    Notifier les changements de documents téléversés
    """
    if created:
        # Nouveau document téléversé
        NotificationService.create_general_notification(
            type_code='document_valide',
            titre=f'Nouveau document téléversé: {instance.nom_fichier_original}',
            message=f'Un nouveau document "{instance.nom_fichier_original}" a été téléversé pour le projet {instance.projet.nom}',
            projet=instance.projet,
            priorite='normale'
        )
    else:
        # Vérifier si le statut a changé
        if instance.statut == 'valide':
            NotificationService.create_general_notification(
                type_code='document_valide',
                titre=f'Document validé: {instance.nom_fichier_original}',
                message=f'Le document "{instance.nom_fichier_original}" du projet {instance.projet.nom} a été validé',
                projet=instance.projet,
                priorite='normale'
            )
        elif instance.statut == 'rejete':
            NotificationService.create_general_notification(
                type_code='document_rejete',
                titre=f'Document rejeté: {instance.nom_fichier_original}',
                message=f'Le document "{instance.nom_fichier_original}" du projet {instance.projet.nom} a été rejeté',
                projet=instance.projet,
                priorite='elevee'
            )

@receiver(post_save, sender=CommentaireDocumentProjet)
def notify_document_comment_changes(sender, instance, created, **kwargs):
    """
    Notifier les nouveaux commentaires sur les documents
    """
    if created:
        # Nouveau commentaire
        NotificationService.create_general_notification(
            type_code='message_chat',
            titre=f'Nouveau commentaire sur {instance.document.get_type_document_display()}',
            message=f'{instance.auteur.prenom} {instance.auteur.nom} a commenté le document "{instance.document.get_type_document_display()}"',
            projet=instance.document.projet,
            priorite='faible'
        )

@receiver(post_save, sender=HistoriqueDocumentProjet)
def notify_document_history_changes(sender, instance, created, **kwargs):
    """
    Notifier les changements dans l'historique des documents
    """
    if created:
        NotificationService.create_general_notification(
            type_code='document_valide',
            titre=f'Historique document mis à jour',
            message=f'L\'historique du document "{instance.document.get_type_document_display()}" a été mis à jour',
            projet=instance.document.projet,
            priorite='faible'
        )

# ============================================================================
# SIGNALS POUR LES UTILISATEURS ET AUTHENTIFICATION
# ============================================================================

@receiver(user_logged_in)
def notify_user_login_signal(sender, request, user, **kwargs):
    """
    Notifier la connexion d'un utilisateur via le signal Django
    """
    NotificationService.notify_user_login(user)

@receiver(user_logged_out)
def notify_user_logout_signal(sender, request, user, **kwargs):
    """
    Notifier la déconnexion d'un utilisateur via le signal Django
    """
    if user and not user.is_anonymous:
        NotificationService.create_general_notification(
            type_code='session_connexion',
            titre=f'Déconnexion de {user.prenom} {user.nom}',
            message=f'{user.prenom} {user.nom} s\'est déconnecté du système',
            priorite='faible'
        )

@receiver(post_save, sender=User)
def notify_user_profile_changes(sender, instance, created, **kwargs):
    """
    Notifier les changements de profil utilisateur
    """
    if created:
        # Nouvel utilisateur créé
        NotificationService.create_general_notification(
            type_code='annonce_generale',
            titre=f'Nouvel utilisateur: {instance.prenom} {instance.nom}',
            message=f'Un nouvel utilisateur "{instance.prenom} {instance.nom}" a rejoint l\'équipe',
            priorite='normale'
        )

@receiver(post_save, sender=Service)
def notify_service_changes(sender, instance, created, **kwargs):
    """
    Notifier les changements de service
    """
    if created:
        NotificationService.create_general_notification(
            type_code='annonce_generale',
            titre=f'Nouveau service: {instance.nom}',
            message=f'Un nouveau service "{instance.nom}" a été créé',
            priorite='normale'
        )

@receiver(post_save, sender=Role)
def notify_role_changes(sender, instance, created, **kwargs):
    """
    Notifier les changements de rôle
    """
    if created:
        NotificationService.create_general_notification(
            type_code='annonce_generale',
            titre=f'Nouveau rôle: {instance.nom}',
            message=f'Un nouveau rôle "{instance.nom}" a été créé',
            priorite='normale'
        )

# ============================================================================
# SIGNALS POUR LES SUPPRESSIONS
# ============================================================================

@receiver(post_delete, sender=Projet)
def notify_project_deletion(sender, instance, **kwargs):
    """
    Notifier la suppression d'un projet
    """
    # Récupérer les membres avant la suppression (instance sera supprimée après)
    try:
        from projects.models import MembreProjet
        membres = MembreProjet.objects.filter(projet_id=instance.id).select_related('utilisateur')
        members_emails = [membre.utilisateur.email for membre in membres if membre.utilisateur.email]
        
        # Envoyer un email à tous les membres du projet
        ProjectEmailService.send_project_deleted_email(
            instance.nom,
            instance.code,
            members_emails
        )
    except Exception:
        pass
    
    NotificationService.create_general_notification(
        type_code='projet_supprime',
        titre=f'Projet supprimé: {instance.nom}',
        message=f'Le projet "{instance.nom}" a été supprimé',
        priorite='elevee'
    )

@receiver(post_delete, sender=Tache)
def notify_task_deletion(sender, instance, **kwargs):
    """
    Notifier la suppression d'une tâche
    """
    # Récupérer les membres avant la suppression
    try:
        members = ProjectEmailService._get_task_members(instance)
        members_emails = [member.email for member in members if member.email]
        
        # Envoyer un email à tous les membres de la tâche
        ProjectEmailService.send_task_deleted_email(
            instance.titre,
            instance.projet.nom,
            members_emails
        )
    except Exception:
        pass
    
    NotificationService.create_general_notification(
        type_code='tache_retard',
        titre=f'Tâche supprimée: {instance.titre}',
        message=f'La tâche "{instance.titre}" du projet {instance.projet.nom} a été supprimée',
        projet=instance.projet,
        priorite='normale'
    )

@receiver(post_delete, sender=Etape)
def notify_step_deletion(sender, instance, **kwargs):
    """
    Notifier la suppression d'une étape
    """
    # Récupérer les membres avant la suppression
    try:
        members = ProjectEmailService._get_step_members(instance)
        members_emails = [member.email for member in members if member.email]
        project_nom = instance.phase_etat.projet.nom
        
        # Envoyer un email à tous les membres de l'étape
        ProjectEmailService.send_step_deleted_email(
            instance.nom,
            project_nom,
            members_emails
        )
    except Exception:
        pass
    
    NotificationService.create_general_notification(
        type_code='etape_terminee',
        titre=f'Étape supprimée: {instance.nom}',
        message=f'L\'étape "{instance.nom}" du projet {instance.phase_etat.projet.nom} a été supprimée',
        projet=instance.phase_etat.projet,
        priorite='normale'
    )

@receiver(post_delete, sender=DocumentProjet)
def notify_document_deletion(sender, instance, **kwargs):
    """
    Notifier la suppression d'un document
    """
    NotificationService.create_general_notification(
        type_code='document_rejete',
        titre=f'Document supprimé: {instance.get_type_document_display()}',
        message=f'Le document "{instance.get_type_document_display()}" du projet {instance.projet.nom} a été supprimé',
        projet=instance.projet,
        priorite='normale'
    )
