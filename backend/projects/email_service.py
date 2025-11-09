from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings as django_settings
from django.contrib.sites.models import Site
from django.utils import timezone
from datetime import date


class ProjectEmailService:
    """Service pour l'envoi d'emails liés aux projets, tâches et étapes."""
    
    @staticmethod
    def _get_site_info():
        """Récupère les informations du site."""
        try:
            current_site = Site.objects.get_current()
            domain = current_site.domain
            site_name = current_site.name
        except:
            domain = getattr(django_settings, 'FRONTEND_URL', 'http://localhost:5173').replace('http://', '').replace('https://', '')
            site_name = 'Gestion Marketing'
        
        frontend_url = getattr(django_settings, 'FRONTEND_URL', f'http://{domain}')
        return domain, site_name, frontend_url
    
    @staticmethod
    def _get_project_members(project):
        """Récupère tous les membres d'un projet."""
        from projects.models import MembreProjet
        membres = MembreProjet.objects.filter(projet=project).select_related('utilisateur')
        return [membre.utilisateur for membre in membres if membre.utilisateur.email]
    
    @staticmethod
    def _get_task_members(task):
        """Récupère tous les membres d'une tâche (assignés + membres du projet)."""
        members = set()
        
        # Ajouter les personnes assignées à la tâche
        if hasattr(task, 'assigne_a'):
            for user in task.assigne_a.all():
                if user.email:
                    members.add(user)
        
        # Ajouter les membres du projet
        project_members = ProjectEmailService._get_project_members(task.projet)
        members.update(project_members)
        
        return list(members)
    
    @staticmethod
    def _get_step_members(step):
        """Récupère tous les membres d'une étape (responsable + membres du projet)."""
        members = set()
        
        # Ajouter le responsable de l'étape
        if step.responsable and step.responsable.email:
            members.add(step.responsable)
        
        # Ajouter les membres du projet
        project = step.phase_etat.projet
        project_members = ProjectEmailService._get_project_members(project)
        members.update(project_members)
        
        return list(members)
    
    @staticmethod
    def _send_email(recipients, subject, template_name, context, text_content=None):
        """Méthode générique pour envoyer un email."""
        if not recipients:
            return False
        
        try:
            # Rendre le template HTML
            html_content = render_to_string(template_name, context)
            
            # Créer la liste des emails (sans doublons)
            email_list = list(set([user.email if hasattr(user, 'email') else user for user in recipients if user and (hasattr(user, 'email') and user.email or isinstance(user, str))]))
            
            if not email_list:
                return False
            
            # Créer l'email
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content or html_content,
                from_email=django_settings.DEFAULT_FROM_EMAIL,
                to=email_list
            )
            
            # Attacher le contenu HTML
            email.attach_alternative(html_content, "text/html")
            
            # Envoyer l'email avec retry et gestion améliorée de la connexion
            max_retries = 3
            for attempt in range(max_retries):
                connection = None
                try:
                    # Créer une nouvelle connexion à chaque tentative
                    from django.core.mail import get_connection
                    connection = get_connection()
                    
                    # Ouvrir la connexion explicitement avec gestion d'erreurs
                    try:
                        connection.open()
                    except Exception as conn_error:
                        if connection:
                            try:
                                connection.close()
                            except:
                                pass
                        if attempt < max_retries - 1:
                            import time
                            time.sleep(2)  # Attendre 2 secondes avant de réessayer
                            continue
                        else:
                            raise conn_error
                    
                    # Envoyer l'email
                    email.connection = connection
                    email.send()
                    
                    # Fermer la connexion proprement
                    try:
                        connection.close()
                    except:
                        pass
                    
                    return True
                    
                except Exception as send_error:
                    # Fermer la connexion en cas d'erreur
                    if connection:
                        try:
                            connection.close()
                        except:
                            pass
                    
                    if attempt < max_retries - 1:
                        # Attendre un peu avant de réessayer
                        import time
                        time.sleep(2)
                        continue
                    else:
                        raise send_error
            
            return True
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            error_msg = f"Erreur lors de l'envoi d'email: {str(e)}"
            logger.error(error_msg, exc_info=True)
            
            # En mode DEBUG, afficher aussi dans la console avec plus de détails
            if django_settings.DEBUG:
                print(f"\n❌ ERREUR ENVOI EMAIL")
                print(f"   Message: {error_msg}")
                print(f"   Template: {template_name}")
                print(f"   Destinataires: {email_list if 'email_list' in locals() else 'N/A'}")
                print(f"   EMAIL_HOST: {django_settings.EMAIL_HOST}")
                print(f"   EMAIL_PORT: {django_settings.EMAIL_PORT}")
                print(f"   EMAIL_HOST_USER: {django_settings.EMAIL_HOST_USER}")
                print(f"   Mot de passe configuré: {'Oui' if django_settings.EMAIL_HOST_PASSWORD else 'Non'}")
                print(f"   Longueur du mot de passe: {len(django_settings.EMAIL_HOST_PASSWORD) if django_settings.EMAIL_HOST_PASSWORD else 0} caractères")
                print()
            
            return False
    
    # ============================================================================
    # EMAILS POUR PROJETS
    # ============================================================================
    
    @staticmethod
    def send_project_created_email(project):
        """Envoie un email à tous les membres du projet lors de sa création."""
        domain, site_name, frontend_url = ProjectEmailService._get_site_info()
        project_url = f"{frontend_url}/projects/{project.id}"
        
        # Récupérer tous les membres du projet
        members = ProjectEmailService._get_project_members(project)
        
        # Ajouter le propriétaire s'il n'est pas déjà dans la liste
        if project.proprietaire.email and project.proprietaire not in members:
            members.append(project.proprietaire)
        
        if not members:
            return False
        
        context = {
            'project': project,
            'project_url': project_url,
            'site_name': site_name,
            'domain': domain,
            'action': 'created',
        }
        
        subject = f"🎉 Nouveau Projet : {project.nom}"
        
        text_content = f"""
Nouveau Projet Créé - {project.nom}

Bonjour,

Un nouveau projet a été créé : {project.nom} ({project.code})

Détails du projet :
- Nom : {project.nom}
- Code : {project.code}
- Statut : {project.get_statut_display()}
- Priorité : {project.get_priorite_display()}
- Propriétaire : {project.proprietaire.prenom} {project.proprietaire.nom}

Vous pouvez voir le projet dans l'application : {project_url}

Cordialement,
L'équipe de gestion de projets
"""
        
        return ProjectEmailService._send_email(
            members,
            subject,
            'emails/project_created.html',
            context,
            text_content
        )
    
    @staticmethod
    def send_project_updated_email(project):
        """Envoie un email à tous les membres du projet lors de sa modification."""
        domain, site_name, frontend_url = ProjectEmailService._get_site_info()
        project_url = f"{frontend_url}/projects/{project.id}"
        
        # Récupérer tous les membres du projet
        members = ProjectEmailService._get_project_members(project)
        
        # Ajouter le propriétaire s'il n'est pas déjà dans la liste
        if project.proprietaire.email and project.proprietaire not in members:
            members.append(project.proprietaire)
        
        if not members:
            return False
        
        context = {
            'project': project,
            'project_url': project_url,
            'site_name': site_name,
            'domain': domain,
            'action': 'updated',
        }
        
        subject = f"📝 Projet Modifié : {project.nom}"
        
        text_content = f"""
Projet Modifié - {project.nom}

Bonjour,

Le projet "{project.nom}" a été modifié.

Vous pouvez voir les modifications dans l'application : {project_url}

Cordialement,
L'équipe de gestion de projets
"""
        
        return ProjectEmailService._send_email(
            members,
            subject,
            'emails/project_updated.html',
            context,
            text_content
        )
    
    @staticmethod
    def send_project_deleted_email(project_nom, project_code, members_emails):
        """Envoie un email à tous les membres du projet lors de sa suppression."""
        domain, site_name, frontend_url = ProjectEmailService._get_site_info()
        
        if not members_emails:
            return False
        
        context = {
            'project_nom': project_nom,
            'project_code': project_code,
            'site_name': site_name,
            'domain': domain,
            'action': 'deleted',
        }
        
        subject = f"🗑️ Projet Supprimé : {project_nom}"
        
        text_content = f"""
Projet Supprimé - {project_nom}

Bonjour,

Le projet "{project_nom}" ({project_code}) a été supprimé.

Cordialement,
L'équipe de gestion de projets
"""
        
        return ProjectEmailService._send_email(
            members_emails,
            subject,
            'emails/project_deleted.html',
            context,
            text_content
        )
    
    @staticmethod
    def send_project_delay_email(project):
        """Envoie un email aux responsables pour un projet en retard."""
        domain, site_name, frontend_url = ProjectEmailService._get_site_info()
        project_url = f"{frontend_url}/projects/{project.id}"
        
        # Envoyer au propriétaire
        recipients = [project.proprietaire] if project.proprietaire.email else []
        
        if not recipients:
            return False
        
        context = {
            'project': project,
            'project_url': project_url,
            'site_name': site_name,
            'domain': domain,
            'action': 'delay',
        }
        
        subject = f"⚠️ Projet en Retard : {project.nom}"
        
        text_content = f"""
Projet en Retard - {project.nom}

Bonjour {project.proprietaire.prenom} {project.proprietaire.nom},

Le projet "{project.nom}" est en retard.

Date de fin prévue : {project.fin.date() if project.fin else 'Non définie'}
Date actuelle : {date.today()}

Vous pouvez voir le projet dans l'application : {project_url}

Cordialement,
L'équipe de gestion de projets
"""
        
        return ProjectEmailService._send_email(
            recipients,
            subject,
            'emails/project_delay.html',
            context,
            text_content
        )
    
    # ============================================================================
    # EMAILS POUR TÂCHES
    # ============================================================================
    
    @staticmethod
    def send_task_created_email(task):
        """Envoie un email à tous les membres de la tâche lors de sa création."""
        domain, site_name, frontend_url = ProjectEmailService._get_site_info()
        project_url = f"{frontend_url}/projects/{task.projet.id}"
        
        # Récupérer tous les membres de la tâche
        members = ProjectEmailService._get_task_members(task)
        
        if not members:
            return False
        
        context = {
            'task': task,
            'project': task.projet,
            'project_url': project_url,
            'site_name': site_name,
            'domain': domain,
            'action': 'created',
        }
        
        subject = f"✅ Nouvelle Tâche : {task.titre}"
        
        text_content = f"""
Nouvelle Tâche Créée - {task.titre}

Bonjour,

Une nouvelle tâche a été créée dans le projet "{task.projet.nom}" : {task.titre}

Détails de la tâche :
- Titre : {task.titre}
- Projet : {task.projet.nom}
- Statut : {task.get_statut_display()}
- Priorité : {task.get_priorite_display()}
- Phase : {task.get_phase_display()}

Vous pouvez voir la tâche dans l'application : {project_url}

Cordialement,
L'équipe de gestion de projets
"""
        
        return ProjectEmailService._send_email(
            members,
            subject,
            'emails/task_created.html',
            context,
            text_content
        )
    
    @staticmethod
    def send_task_updated_email(task):
        """Envoie un email à tous les membres de la tâche lors de sa modification."""
        domain, site_name, frontend_url = ProjectEmailService._get_site_info()
        project_url = f"{frontend_url}/projects/{task.projet.id}"
        
        # Récupérer tous les membres de la tâche
        members = ProjectEmailService._get_task_members(task)
        
        if not members:
            return False
        
        context = {
            'task': task,
            'project': task.projet,
            'project_url': project_url,
            'site_name': site_name,
            'domain': domain,
            'action': 'updated',
        }
        
        subject = f"📝 Tâche Modifiée : {task.titre}"
        
        text_content = f"""
Tâche Modifiée - {task.titre}

Bonjour,

La tâche "{task.titre}" du projet "{task.projet.nom}" a été modifiée.

Vous pouvez voir les modifications dans l'application : {project_url}

Cordialement,
L'équipe de gestion de projets
"""
        
        return ProjectEmailService._send_email(
            members,
            subject,
            'emails/task_updated.html',
            context,
            text_content
        )
    
    @staticmethod
    def send_task_deleted_email(task_nom, project_nom, members_emails):
        """Envoie un email à tous les membres de la tâche lors de sa suppression."""
        domain, site_name, frontend_url = ProjectEmailService._get_site_info()
        
        if not members_emails:
            return False
        
        context = {
            'task_nom': task_nom,
            'project_nom': project_nom,
            'site_name': site_name,
            'domain': domain,
            'action': 'deleted',
        }
        
        subject = f"🗑️ Tâche Supprimée : {task_nom}"
        
        text_content = f"""
Tâche Supprimée - {task_nom}

Bonjour,

La tâche "{task_nom}" du projet "{project_nom}" a été supprimée.

Cordialement,
L'équipe de gestion de projets
"""
        
        return ProjectEmailService._send_email(
            members_emails,
            subject,
            'emails/task_deleted.html',
            context,
            text_content
        )
    
    @staticmethod
    def send_task_delay_email(task):
        """Envoie un email aux responsables pour une tâche en retard."""
        domain, site_name, frontend_url = ProjectEmailService._get_site_info()
        project_url = f"{frontend_url}/projects/{task.projet.id}"
        
        # Envoyer aux personnes assignées
        recipients = []
        if hasattr(task, 'assigne_a'):
            recipients = [user for user in task.assigne_a.all() if user.email]
        
        # Si personne n'est assigné, envoyer au propriétaire du projet
        if not recipients and task.projet.proprietaire.email:
            recipients = [task.projet.proprietaire]
        
        if not recipients:
            return False
        
        context = {
            'task': task,
            'project': task.projet,
            'project_url': project_url,
            'site_name': site_name,
            'domain': domain,
            'action': 'delay',
        }
        
        subject = f"⚠️ Tâche en Retard : {task.titre}"
        
        text_content = f"""
Tâche en Retard - {task.titre}

Bonjour,

La tâche "{task.titre}" du projet "{task.projet.nom}" est en retard.

Date de fin prévue : {task.fin if task.fin else 'Non définie'}
Date actuelle : {date.today()}

Vous pouvez voir la tâche dans l'application : {project_url}

Cordialement,
L'équipe de gestion de projets
"""
        
        return ProjectEmailService._send_email(
            recipients,
            subject,
            'emails/task_delay.html',
            context,
            text_content
        )
    
    # ============================================================================
    # EMAILS POUR ÉTAPES
    # ============================================================================
    
    @staticmethod
    def send_step_created_email(step):
        """Envoie un email à tous les membres de l'étape lors de sa création."""
        domain, site_name, frontend_url = ProjectEmailService._get_site_info()
        project = step.phase_etat.projet
        project_url = f"{frontend_url}/projects/{project.id}"
        
        # Récupérer tous les membres de l'étape
        members = ProjectEmailService._get_step_members(step)
        
        if not members:
            return False
        
        context = {
            'step': step,
            'project': project,
            'project_url': project_url,
            'site_name': site_name,
            'domain': domain,
            'action': 'created',
        }
        
        subject = f"📋 Nouvelle Étape : {step.nom}"
        
        text_content = f"""
Nouvelle Étape Créée - {step.nom}

Bonjour,

Une nouvelle étape a été créée dans le projet "{project.nom}" : {step.nom}

Détails de l'étape :
- Nom : {step.nom}
- Projet : {project.nom}
- Phase : {step.phase_etat.phase.nom}
- Statut : {step.get_statut_display()}
- Priorité : {step.get_priorite_display()}

Vous pouvez voir l'étape dans l'application : {project_url}

Cordialement,
L'équipe de gestion de projets
"""
        
        return ProjectEmailService._send_email(
            members,
            subject,
            'emails/step_created.html',
            context,
            text_content
        )
    
    @staticmethod
    def send_step_updated_email(step):
        """Envoie un email à tous les membres de l'étape lors de sa modification."""
        domain, site_name, frontend_url = ProjectEmailService._get_site_info()
        project = step.phase_etat.projet
        project_url = f"{frontend_url}/projects/{project.id}"
        
        # Récupérer tous les membres de l'étape
        members = ProjectEmailService._get_step_members(step)
        
        if not members:
            return False
        
        context = {
            'step': step,
            'project': project,
            'project_url': project_url,
            'site_name': site_name,
            'domain': domain,
            'action': 'updated',
        }
        
        subject = f"📝 Étape Modifiée : {step.nom}"
        
        text_content = f"""
Étape Modifiée - {step.nom}

Bonjour,

L'étape "{step.nom}" du projet "{project.nom}" a été modifiée.

Vous pouvez voir les modifications dans l'application : {project_url}

Cordialement,
L'équipe de gestion de projets
"""
        
        return ProjectEmailService._send_email(
            members,
            subject,
            'emails/step_updated.html',
            context,
            text_content
        )
    
    @staticmethod
    def send_step_deleted_email(step_nom, project_nom, members_emails):
        """Envoie un email à tous les membres de l'étape lors de sa suppression."""
        domain, site_name, frontend_url = ProjectEmailService._get_site_info()
        
        if not members_emails:
            return False
        
        context = {
            'step_nom': step_nom,
            'project_nom': project_nom,
            'site_name': site_name,
            'domain': domain,
            'action': 'deleted',
        }
        
        subject = f"🗑️ Étape Supprimée : {step_nom}"
        
        text_content = f"""
Étape Supprimée - {step_nom}

Bonjour,

L'étape "{step_nom}" du projet "{project_nom}" a été supprimée.

Cordialement,
L'équipe de gestion de projets
"""
        
        return ProjectEmailService._send_email(
            members_emails,
            subject,
            'emails/step_deleted.html',
            context,
            text_content
        )
    
    @staticmethod
    def send_step_delay_email(step):
        """Envoie un email aux responsables pour une étape en retard."""
        domain, site_name, frontend_url = ProjectEmailService._get_site_info()
        project = step.phase_etat.projet
        project_url = f"{frontend_url}/projects/{project.id}"
        
        # Envoyer au responsable de l'étape
        recipients = []
        if step.responsable and step.responsable.email:
            recipients = [step.responsable]
        
        # Si personne n'est responsable, envoyer au propriétaire du projet
        if not recipients and project.proprietaire.email:
            recipients = [project.proprietaire]
        
        if not recipients:
            return False
        
        context = {
            'step': step,
            'project': project,
            'project_url': project_url,
            'site_name': site_name,
            'domain': domain,
            'action': 'delay',
        }
        
        subject = f"⚠️ Étape en Retard : {step.nom}"
        
        date_fin_str = 'Non définie'
        if step.date_fin_prevue:
            if isinstance(step.date_fin_prevue, date):
                date_fin_str = step.date_fin_prevue.strftime('%d/%m/%Y')
            else:
                date_fin_str = step.date_fin_prevue.date().strftime('%d/%m/%Y')
        
        text_content = f"""
Étape en Retard - {step.nom}

Bonjour,

L'étape "{step.nom}" du projet "{project.nom}" est en retard.

Date de fin prévue : {date_fin_str}
Date actuelle : {date.today().strftime('%d/%m/%Y')}

Vous pouvez voir l'étape dans l'application : {project_url}

Cordialement,
L'équipe de gestion de projets
"""
        
        return ProjectEmailService._send_email(
            recipients,
            subject,
            'emails/step_delay.html',
            context,
            text_content
        )
