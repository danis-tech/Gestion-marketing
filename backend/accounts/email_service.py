from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.urls import reverse
from django.contrib.sites.models import Site


class TeamEmailService:
    """Service pour l'envoi d'emails liés aux équipes/services."""
    
    @staticmethod
    def send_team_assignment_notification(user, service, assigned_by=None, project=None):
        """
        Envoie une notification par email à un utilisateur lors de son assignation à une équipe/service.
        
        Args:
            user: Instance du modèle User (utilisateur assigné)
            service: Instance du modèle Service (équipe/service)
            assigned_by: Instance du modèle User (qui a fait l'assignation, optionnel)
            project: Instance du modèle Projet (projet associé, optionnel)
        """
        try:
            # Récupérer le domaine du site
            current_site = Site.objects.get_current()
            domain = current_site.domain
            
            # Construire l'URL de l'application (vous devrez ajuster selon votre structure d'URLs)
            app_url = f"http://{domain}/"
            
            # Contexte pour le template
            context = {
                'user': user,
                'service': service,
                'assigned_by': assigned_by,
                'project': project,
                'app_url': app_url,
                'site_name': current_site.name,
                'domain': domain,
            }
            
            # Rendre le template HTML
            html_content = render_to_string('emails/team_assigned.html', context)
            
            # Contenu texte brut (fallback)
            text_content = f"""
            Assignation à l'équipe {service.nom}
            
            Bonjour {user.prenom} {user.nom},
            
            Vous avez été assigné à l'équipe {service.nom} ({service.code}).
            
            Détails de l'assignation :
            - Équipe : {service.nom}
            - Code : {service.code}
            - Date d'assignation : {user.mis_a_jour_le.strftime('%d/%m/%Y à %H:%M')}
            """
            
            if project:
                text_content += f"- Projet associé : {project.nom} ({project.code})\n"
            
            if assigned_by:
                text_content += f"- Assigné par : {assigned_by.prenom} {assigned_by.nom}\n"
            
            text_content += f"""
            
            Vous pouvez maintenant accéder aux projets et tâches de cette équipe.
            
            Accéder à l'application : {app_url}
            
            Cordialement,
            L'équipe de gestion
            """
            
            # Créer l'email
            subject = f"🎯 Assignation à l'équipe : {service.nom}"
            
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email]
            )
            
            # Attacher le contenu HTML
            email.attach_alternative(html_content, "text/html")
            
            # Envoyer l'email
            email.send()
            
            print(f"Email d'assignation d'équipe envoyé à {user.email} pour l'équipe {service.nom}")
            return True
            
        except Exception as e:
            print(f"Erreur lors de l'envoi de l'email d'assignation d'équipe : {str(e)}")
            return False
    
    @staticmethod
    def send_team_removal_notification(user, service, removed_by=None, project=None):
        """
        Envoie une notification par email à un utilisateur lors de sa suppression d'une équipe/service.
        
        Args:
            user: Instance du modèle User (utilisateur retiré)
            service: Instance du modèle Service (équipe/service)
            removed_by: Instance du modèle User (qui a fait la suppression, optionnel)
            project: Instance du modèle Projet (projet associé, optionnel)
        """
        try:
            # Récupérer le domaine du site
            current_site = Site.objects.get_current()
            domain = current_site.domain
            
            # Construire l'URL de l'application
            app_url = f"http://{domain}/"
            
            # Contexte pour le template
            context = {
                'user': user,
                'service': service,
                'removed_by': removed_by,
                'project': project,
                'app_url': app_url,
                'site_name': current_site.name,
                'domain': domain,
            }
            
            # Rendre le template HTML
            html_content = render_to_string('emails/team_removed.html', context)
            
            # Contenu texte brut (fallback)
            text_content = f"""
            Retrait de l'équipe {service.nom}
            
            Bonjour {user.prenom} {user.nom},
            
            Vous avez été retiré de l'équipe {service.nom} ({service.code}).
            
            Détails du retrait :
            - Équipe : {service.nom}
            - Code : {service.code}
            - Date de retrait : {user.mis_a_jour_le.strftime('%d/%m/%Y à %H:%M')}
            """
            
            if project:
                text_content += f"- Projet associé : {project.nom} ({project.code})\n"
            
            if removed_by:
                text_content += f"- Retiré par : {removed_by.prenom} {removed_by.nom}\n"
            
            text_content += f"""
            
            Vous n'avez plus accès aux projets et tâches de cette équipe.
            
            Accéder à l'application : {app_url}
            
            Cordialement,
            L'équipe de gestion
            """
            
            # Créer l'email
            subject = f" Retrait de l'équipe : {service.nom}"
            
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email]
            )
            
            # Attacher le contenu HTML
            email.attach_alternative(html_content, "text/html")
            
            # Envoyer l'email
            email.send()
            
            print(f"Email de retrait d'équipe envoyé à {user.email} pour l'équipe {service.nom}")
            return True
            
        except Exception as e:
            print(f"Erreur lors de l'envoi de l'email de retrait d'équipe : {str(e)}")
            return False
