from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.urls import reverse
from django.contrib.sites.models import Site


class ProjectEmailService:
    """Service pour l'envoi d'emails liés aux projets."""
    
    @staticmethod
    def send_project_created_notification(project, responsable):
        """
        Envoie une notification par email au responsable du projet lors de sa création.
        
        Args:
            project: Instance du modèle Projet
            responsable: Instance du modèle User (responsable du projet)
        """
        try:
            # Récupérer le domaine du site
            current_site = Site.objects.get_current()
            domain = current_site.domain
            
            # Construire l'URL du projet (vous devrez ajuster selon votre structure d'URLs)
            project_url = f"http://{domain}/projects/{project.id}/"
            
            # Contexte pour le template
            context = {
                'project': project,
                'responsable': responsable,
                'project_url': project_url,
                'site_name': current_site.name,
                'domain': domain,
            }
            
            # Rendre le template HTML
            html_content = render_to_string('emails/project_created.html', context)
            
            # Contenu texte brut (fallback)
            text_content = f"""
            Nouveau Projet Créé - {project.nom}
            
            Bonjour {responsable.prenom} {responsable.nom},
            
            Un nouveau projet a été créé et vous avez été assigné comme responsable.
            
            Détails du projet :
            - Nom : {project.nom}
            - Code : {project.code}
            - Description : {project.description}
            - Objectif : {project.objectif}
            - Type : {project.type}
            - Statut : {project.get_statut_display()}
            - Priorité : {project.get_priorite_display()}
            - Créateur : {project.nom_createur}
            
            Vous pouvez voir le projet dans l'application : {project_url}
            
            Cordialement,
            L'équipe de gestion de projets
            """
            
            # Créer l'email
            subject = f"🎉 Nouveau Projet : {project.nom}"
            
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[responsable.email]
            )
            
            # Attacher le contenu HTML
            email.attach_alternative(html_content, "text/html")
            
            # Envoyer l'email
            email.send()
            
            print(f"Email de notification envoyé à {responsable.email} pour le projet {project.nom}")
            return True
            
        except Exception as e:
            print(f"Erreur lors de l'envoi de l'email de notification : {str(e)}")
            return False
    
    @staticmethod
    def send_project_updated_notification(project, responsable, changes=None):
        """
        Envoie une notification par email au responsable du projet lors de sa modification.
        
        Args:
            project: Instance du modèle Projet
            responsable: Instance du modèle User (responsable du projet)
            changes: Liste des champs modifiés (optionnel)
        """
        try:
            current_site = Site.objects.get_current()
            domain = current_site.domain
            project_url = f"http://{domain}/projects/{project.id}/"
            
            # Contexte pour le template (vous pouvez créer un template séparé pour les mises à jour)
            context = {
                'project': project,
                'responsable': responsable,
                'project_url': project_url,
                'changes': changes or [],
                'site_name': current_site.name,
            }
            
            # Contenu texte brut pour les mises à jour
            text_content = f"""
            Projet Modifié - {project.nom}
            
            Bonjour {responsable.prenom} {responsable.nom},
            
            Le projet "{project.nom}" a été modifié.
            
            Vous pouvez voir les modifications dans l'application : {project_url}
            
            Cordialement,
            L'équipe de gestion de projets
            """
            
            subject = f"📝 Projet Modifié : {project.nom}"
            
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[responsable.email]
            )
            
            email.send()
            
            print(f"Email de mise à jour envoyé à {responsable.email} pour le projet {project.nom}")
            return True
            
        except Exception as e:
            print(f"Erreur lors de l'envoi de l'email de mise à jour : {str(e)}")
            return False


