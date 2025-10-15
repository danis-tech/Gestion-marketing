from django.core.management.base import BaseCommand
from notifications.models import ChatMessage
from django.db.models import Q

class Command(BaseCommand):
    help = 'Supprime tous les messages de connexion/déconnexion du chat'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirmer la suppression sans invite.'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Début du nettoyage des messages de connexion...'))

        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    'Ceci supprimera tous les messages de connexion/déconnexion du chat. '
                    'Utilisez --confirm pour confirmer la suppression.'
                )
            )
            return

        # Supprimer les messages de connexion/déconnexion
        connection_messages = ChatMessage.objects.filter(
            Q(message__icontains='s\'est connecté') |
            Q(message__icontains='s\'est déconnecté') |
            Q(message__icontains='connecté') |
            Q(message__icontains='déconnecté') |
            Q(est_systeme=True)
        )

        count = connection_messages.count()
        if count > 0:
            connection_messages.delete()
            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ {count} messages de connexion supprimés'
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING('Aucun message de connexion trouvé')
            )

        # Afficher le résumé
        total_messages = ChatMessage.objects.count()
        self.stdout.write(self.style.SUCCESS('\n📊 Résumé:'))
        self.stdout.write(f'   - Messages de chat restants: {total_messages}')
        self.stdout.write(self.style.SUCCESS('   - Nettoyage terminé avec succès!'))
