from django.core.management.base import BaseCommand
from notifications.models import NotificationType


class Command(BaseCommand):
    help = 'Initialiser tous les types de notifications complets'

    def handle(self, *args, **options):
        # Types de notifications générales
        general_types = [
            {
                'code': 'projet_retard',
                'nom': 'Projet en retard',
                'description': 'Notification quand un projet est en retard',
                'icone': 'alert-triangle',
                'couleur': 'red',
                'est_generale': True
            },
            {
                'code': 'tache_retard',
                'nom': 'Tâche en retard',
                'description': 'Notification quand une tâche est en retard',
                'icone': 'clock',
                'couleur': 'orange',
                'est_generale': True
            },
            {
                'code': 'session_connexion',
                'nom': 'Session de connexion',
                'description': 'Notification de connexion/déconnexion utilisateur',
                'icone': 'user',
                'couleur': 'gray',
                'est_generale': True
            },
            {
                'code': 'message_chat',
                'nom': 'Message de chat',
                'description': 'Message dans le chat général',
                'icone': 'message-square',
                'couleur': 'purple',
                'est_generale': True
            },
            {
                'code': 'systeme_maintenance',
                'nom': 'Maintenance système',
                'description': 'Notification de maintenance système',
                'icone': 'wrench',
                'couleur': 'gray',
                'est_generale': True
            },
            {
                'code': 'annonce_generale',
                'nom': 'Annonce générale',
                'description': 'Annonce générale à tous les utilisateurs',
                'icone': 'megaphone',
                'couleur': 'purple',
                'est_generale': True
            },
            {
                'code': 'projet_valide',
                'nom': 'Projet validé',
                'description': 'Notification de validation de projet',
                'icone': 'check-circle',
                'couleur': 'green',
                'est_generale': True
            },
            {
                'code': 'projet_en_cours',
                'nom': 'Projet en cours',
                'description': 'Notification de projet en cours',
                'icone': 'play-circle',
                'couleur': 'blue',
                'est_generale': True
            },
            {
                'code': 'etape_terminee',
                'nom': 'Étape terminée',
                'description': 'Notification de fin d\'étape',
                'icone': 'check-square',
                'couleur': 'green',
                'est_generale': True
            },
            {
                'code': 'document_valide',
                'nom': 'Document validé',
                'description': 'Notification de validation de document',
                'icone': 'file-check',
                'couleur': 'green',
                'est_generale': True
            },
            {
                'code': 'document_rejete',
                'nom': 'Document rejeté',
                'description': 'Notification de rejet de document',
                'icone': 'file-x',
                'couleur': 'red',
                'est_generale': True
            },
            {
                'code': 'phase_terminee',
                'nom': 'Phase terminée',
                'description': 'Notification de fin de phase',
                'icone': 'flag',
                'couleur': 'green',
                'est_generale': True
            },
            {
                'code': 'permission_accordee',
                'nom': 'Permission accordée',
                'description': 'Notification d\'attribution de permission',
                'icone': 'shield',
                'couleur': 'blue',
                'est_generale': True
            },
            {
                'code': 'commentaire_document',
                'nom': 'Commentaire sur document',
                'description': 'Notification de nouveau commentaire sur document',
                'icone': 'message-circle',
                'couleur': 'blue',
                'est_generale': True
            },
            {
                'code': 'historique_document',
                'nom': 'Historique document',
                'description': 'Notification de mise à jour d\'historique document',
                'icone': 'history',
                'couleur': 'gray',
                'est_generale': True
            },
            {
                'code': 'document_televerse',
                'nom': 'Document téléversé',
                'description': 'Notification de téléversement de document',
                'icone': 'upload',
                'couleur': 'blue',
                'est_generale': True
            },
            {
                'code': 'utilisateur_inscrit',
                'nom': 'Nouvel utilisateur',
                'description': 'Notification de nouvel utilisateur inscrit',
                'icone': 'user-plus',
                'couleur': 'green',
                'est_generale': True
            },
            {
                'code': 'service_cree',
                'nom': 'Nouveau service',
                'description': 'Notification de nouveau service créé',
                'icone': 'building',
                'couleur': 'blue',
                'est_generale': True
            },
            {
                'code': 'role_cree',
                'nom': 'Nouveau rôle',
                'description': 'Notification de nouveau rôle créé',
                'icone': 'crown',
                'couleur': 'purple',
                'est_generale': True
            },
            {
                'code': 'projet_supprime',
                'nom': 'Projet supprimé',
                'description': 'Notification de suppression de projet',
                'icone': 'trash-2',
                'couleur': 'red',
                'est_generale': True
            },
            {
                'code': 'tache_supprimee',
                'nom': 'Tâche supprimée',
                'description': 'Notification de suppression de tâche',
                'icone': 'trash-2',
                'couleur': 'orange',
                'est_generale': True
            },
            {
                'code': 'document_supprime',
                'nom': 'Document supprimé',
                'description': 'Notification de suppression de document',
                'icone': 'trash-2',
                'couleur': 'red',
                'est_generale': True
            },
        ]

        # Types de notifications personnelles
        personal_types = [
            {
                'code': 'tache_assignee',
                'nom': 'Tâche assignée',
                'description': 'Notification d\'assignation de tâche',
                'icone': 'target',
                'couleur': 'blue',
                'est_generale': False
            },
            {
                'code': 'tache_terminee',
                'nom': 'Tâche terminée',
                'description': 'Notification de fin de tâche',
                'icone': 'check-circle',
                'couleur': 'green',
                'est_generale': False
            },
            {
                'code': 'projet_chef',
                'nom': 'Chef de projet',
                'description': 'Notification de responsabilité de projet',
                'icone': 'crown',
                'couleur': 'purple',
                'est_generale': False
            },
            {
                'code': 'projet_retard_perso',
                'nom': 'Projet en retard (personnel)',
                'description': 'Notification de retard de projet personnel',
                'icone': 'alert-triangle',
                'couleur': 'red',
                'est_generale': False
            },
            {
                'code': 'equipe_membre',
                'nom': 'Membre d\'équipe',
                'description': 'Notification d\'ajout à une équipe',
                'icone': 'users',
                'couleur': 'blue',
                'est_generale': False
            },
            {
                'code': 'permission_projet',
                'nom': 'Permission sur projet',
                'description': 'Notification d\'attribution de permission sur projet',
                'icone': 'shield',
                'couleur': 'blue',
                'est_generale': False
            },
            {
                'code': 'notification_personnelle',
                'nom': 'Notification personnelle',
                'description': 'Notification personnelle générale',
                'icone': 'bell',
                'couleur': 'blue',
                'est_generale': False
            },
        ]

        # Créer tous les types
        all_types = general_types + personal_types
        
        created_count = 0
        updated_count = 0
        
        for type_data in all_types:
            notification_type, created = NotificationType.objects.get_or_create(
                code=type_data['code'],
                defaults=type_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Créé: {type_data["nom"]} ({type_data["code"]})')
                )
            else:
                # Mettre à jour les champs existants
                for key, value in type_data.items():
                    if key != 'code':
                        setattr(notification_type, key, value)
                notification_type.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'↻ Mis à jour: {type_data["nom"]} ({type_data["code"]})')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n🎉 Initialisation terminée !\n'
                f'   • {created_count} types créés\n'
                f'   • {updated_count} types mis à jour\n'
                f'   • {len(all_types)} types au total'
            )
        )
