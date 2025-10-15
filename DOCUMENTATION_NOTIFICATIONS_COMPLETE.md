# 📋 Documentation Complète - Module Notifications

## 🎯 **Vue d'Ensemble**

Le module de notifications est un système complet de gestion des notifications en temps réel pour l'application de gestion marketing. Il inclut :

- **29 types de notifications** (générales et personnelles)
- **WebSockets** pour les notifications temps réel
- **Chat intégré** avec détection des utilisateurs en ligne
- **API REST** complète
- **Interface utilisateur** moderne et responsive

---

## 🚀 **Installation et Configuration**

### **1. Prérequis**

```bash
# Python 3.8+
# Django 4.2+
# Django Channels
# Redis (pour la production)
```

### **2. Installation des Dépendances**

```bash
cd backend
pip install -r requirements.txt
```

### **3. Configuration Django**

#### **settings.py**

```python
INSTALLED_APPS = [
    # ... autres apps
    'channels',
    'notifications',
]

# Configuration Channels
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],
        },
    },
}

# Configuration ASGI
ASGI_APPLICATION = 'gestion.asgi.application'
```

### **4. Migrations**

```bash
python manage.py makemigrations notifications
python manage.py migrate
```

### **5. Initialisation des Types de Notifications**

```bash
python manage.py init_complete_notification_types
```

---

## 🖥️ **Démarrage du Serveur**

### **Développement (avec WebSockets)**

```bash
# Terminal 1 - Backend avec Daphne
cd backend
daphne -b 0.0.0.0 -p 8000 gestion.asgi:application

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### **Production**

```bash
# Avec Gunicorn + Daphne
gunicorn gestion.wsgi:application --bind 0.0.0.0:8000
daphne -b 0.0.0.0:8001 gestion.asgi:application
```

### **Docker (Production)**

```dockerfile
# docker-compose.yml
version: '3.8'
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

  web:
    build: .
    command: daphne -b 0.0.0.0 -p 8000 gestion.asgi:application
    ports:
      - "8000:8000"
    depends_on:
      - redis
```

---

## 📊 **Types de Notifications**

### **🔔 Notifications Générales (16 types)**

Ces notifications sont visibles par tous les utilisateurs :

| Code                   | Nom                      | Description                       | Priorité |
| ---------------------- | ------------------------ | --------------------------------- | -------- |
| `projet_retard`        | Projet en retard         | Projet dépassant la date limite   | Élevée   |
| `tache_retard`         | Tâche en retard          | Tâche non terminée à temps        | Élevée   |
| `session_connexion`    | Session de connexion     | Connexion/déconnexion utilisateur | Faible   |
| `message_chat`         | Message de chat          | Nouveau message dans le chat      | Normale  |
| `systeme_maintenance`  | Maintenance système      | Maintenance programmée            | Élevée   |
| `annonce_generale`     | Annonce générale         | Annonce importante                | Élevée   |
| `projet_valide`        | Projet validé            | Projet approuvé                   | Normale  |
| `projet_en_cours`      | Projet en cours          | Nouveau projet démarré            | Normale  |
| `etape_terminee`       | Étape terminée           | Phase de projet terminée          | Normale  |
| `document_valide`      | Document validé          | Document approuvé                 | Normale  |
| `document_rejete`      | Document rejeté          | Document refusé                   | Élevée   |
| `phase_terminee`       | Phase terminée           | Phase de projet terminée          | Normale  |
| `permission_accordee`  | Permission accordée      | Nouvelle permission               | Normale  |
| `commentaire_document` | Commentaire sur document | Nouveau commentaire               | Faible   |
| `historique_document`  | Historique document      | Mise à jour historique            | Faible   |
| `document_televerse`   | Document téléversé       | Nouveau document uploadé          | Normale  |
| `utilisateur_inscrit`  | Nouvel utilisateur       | Nouveau membre de l'équipe        | Normale  |
| `service_cree`         | Nouveau service          | Nouveau service créé              | Normale  |
| `role_cree`            | Nouveau rôle             | Nouveau rôle créé                 | Normale  |
| `projet_supprime`      | Projet supprimé          | Projet supprimé                   | Élevée   |
| `tache_supprimee`      | Tâche supprimée          | Tâche supprimée                   | Normale  |
| `document_supprime`    | Document supprimé        | Document supprimé                 | Normale  |

### **👤 Notifications Personnelles (7 types)**

Ces notifications sont visibles uniquement par l'utilisateur concerné :

| Code                       | Nom                          | Description                    | Priorité |
| -------------------------- | ---------------------------- | ------------------------------ | -------- |
| `tache_assignee`           | Tâche assignée               | Nouvelle tâche assignée        | Élevée   |
| `tache_terminee`           | Tâche terminée               | Tâche marquée comme terminée   | Normale  |
| `projet_chef`              | Chef de projet               | Nommé chef de projet           | Élevée   |
| `projet_retard_perso`      | Projet en retard (personnel) | Votre projet est en retard     | Élevée   |
| `equipe_membre`            | Membre d'équipe              | Ajouté à une équipe            | Normale  |
| `permission_projet`        | Permission sur projet        | Nouvelle permission sur projet | Normale  |
| `notification_personnelle` | Notification personnelle     | Notification personnalisée     | Variable |

---

## 🔧 **API Endpoints**

### **Notifications**

```http
GET    /api/notifications/                    # Liste des notifications
POST   /api/notifications/                    # Créer une notification
GET    /api/notifications/{id}/               # Détail d'une notification
PUT    /api/notifications/{id}/               # Modifier une notification
DELETE /api/notifications/{id}/               # Supprimer une notification
GET    /api/notifications/unread-count/       # Nombre de notifications non lues
POST   /api/notifications/mark-read/          # Marquer comme lu
POST   /api/notifications/archive/            # Archiver des notifications
GET    /api/notifications/stats/              # Statistiques des notifications
```

### **Chat**

```http
GET    /api/notifications/chat/messages/      # Messages du chat
POST   /api/notifications/chat/messages/      # Envoyer un message
GET    /api/notifications/chat/online-users/  # Utilisateurs en ligne
```

### **Préférences**

```http
GET    /api/notifications/preferences/        # Préférences utilisateur
PUT    /api/notifications/preferences/        # Modifier les préférences
```

---

## 🔌 **WebSockets**

### **Endpoints WebSocket**

```javascript
// Notifications
ws://localhost:8000/ws/notifications/

// Chat général
ws://localhost:8000/ws/chat/general/
```

### **Messages WebSocket**

```javascript
// Connexion
{
  "type": "websocket.connect"
}

// Notification reçue
{
  "type": "notification",
  "data": {
    "id": 1,
    "titre": "Nouveau projet",
    "message": "Un nouveau projet a été créé",
    "type": "projet_en_cours",
    "priorite": "normale",
    "cree_le": "2025-10-14T10:30:00Z"
  }
}

// Message de chat
{
  "type": "chat_message",
  "data": {
    "id": 1,
    "message": "Bonjour tout le monde !",
    "expediteur": "John Doe",
    "cree_le": "2025-10-14T10:30:00Z"
  }
}

// Utilisateurs en ligne
{
  "type": "online_users_update",
  "data": {
    "count": 3,
    "users": [
      {"id": 1, "nom": "John Doe", "service": "Marketing"},
      {"id": 2, "nom": "Jane Smith", "service": "Développement"}
    ]
  }
}
```

---

## 🎨 **Personnalisation des Styles**

### **Couleurs par Type de Notification**

#### **Notifications Générales**

```css
/* Projets */
.projet-retard {
	background: #dc3545;
	color: white;
}
.projet-valide {
	background: #28a745;
	color: white;
}
.projet-en-cours {
	background: #007bff;
	color: white;
}

/* Documents */
.document-valide {
	background: #17a2b8;
	color: white;
}
.document-rejete {
	background: #fd7e14;
	color: white;
}
.document-televerse {
	background: #6f42c1;
	color: white;
}

/* Système */
.systeme-maintenance {
	background: #6c757d;
	color: white;
}
.annonce-generale {
	background: #e83e8c;
	color: white;
}
```

#### **Notifications Personnelles**

```css
/* Tâches */
.tache-assignee {
	background: #ffc107;
	color: #212529;
}
.tache-terminee {
	background: #20c997;
	color: white;
}

/* Rôles */
.projet-chef {
	background: #fd7e14;
	color: white;
}
.equipe-membre {
	background: #6f42c1;
	color: white;
}
```

### **Thème Sombre/Clair**

```css
/* Thème clair */
.notification-container {
	background: #ffffff;
	border: 1px solid #e9ecef;
	color: #212529;
}

/* Thème sombre */
.notification-container.dark {
	background: #343a40;
	border: 1px solid #495057;
	color: #f8f9fa;
}
```

---

## 🔄 **Signaux Django**

### **Signaux Automatiques**

Le système utilise des signaux Django pour créer automatiquement des notifications :

```python
# Exemple : Création d'un projet
@receiver(post_save, sender=Projet)
def notify_project_created(sender, instance, created, **kwargs):
    if created:
        NotificationService.create_general_notification(
            type_code='projet_en_cours',
            titre=f'Nouveau projet: {instance.nom}',
            message=f'Le projet "{instance.nom}" a été créé',
            projet=instance,
            priorite='normale'
        )
```

### **Ajouter de Nouveaux Signaux**

#### **1. Créer le Type de Notification**

```python
# Dans models.py
TYPE_CHOICES = [
    # ... autres types
    ('nouveau_type', 'Nouveau Type de Notification'),
]
```

#### **2. Créer le Signal**

```python
# Dans signals.py
@receiver(post_save, sender=VotreModele)
def notify_votre_modele(sender, instance, created, **kwargs):
    if created:
        NotificationService.create_general_notification(
            type_code='nouveau_type',
            titre=f'Nouveau {instance.nom}',
            message=f'Un nouveau {instance.nom} a été créé',
            priorite='normale'
        )
```

#### **3. Initialiser le Type**

```bash
python manage.py init_complete_notification_types
```

---

## 🏭 **Configuration Production**

### **1. Variables d'Environnement**

```bash
# .env
DEBUG=False
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:pass@localhost/db
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
```

### **2. Configuration Redis**

```python
# settings.py
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [os.environ.get('REDIS_URL', 'redis://localhost:6379/0')],
            "capacity": 1500,
            "expiry": 10,
        },
    },
}
```

### **3. Configuration Nginx**

```nginx
# nginx.conf
upstream django {
    server 127.0.0.1:8000;
}

upstream websocket {
    server 127.0.0.1:8001;
}

server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://django;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws/ {
        proxy_pass http://websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### **4. Configuration Supervisor**

```ini
# /etc/supervisor/conf.d/notifications.conf
[program:notifications_web]
command=/path/to/venv/bin/daphne -b 0.0.0.0 -p 8001 gestion.asgi:application
directory=/path/to/backend
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/notifications_web.log

[program:notifications_worker]
command=/path/to/venv/bin/python manage.py runworker
directory=/path/to/backend
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/notifications_worker.log
```

---

## 🧪 **Tests**

### **Tests Unitaires**

```bash
# Tous les tests
python manage.py test notifications

# Tests spécifiques
python manage.py test notifications.tests.test_models
python manage.py test notifications.tests.test_services
python manage.py test notifications.tests.test_views
```

### **Tests d'Intégration**

```bash
# Test des WebSockets
python manage.py test notifications.tests.test_consumers

# Test des signaux
python manage.py test notifications.tests.test_signals
```

---

## 📈 **Monitoring et Logs**

### **Logs des Notifications**

```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'notifications_file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'logs/notifications.log',
        },
    },
    'loggers': {
        'notifications': {
            'handlers': ['notifications_file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

### **Métriques**

```python
# Métriques disponibles
- Nombre total de notifications
- Notifications par type
- Notifications par utilisateur
- Taux de lecture des notifications
- Utilisateurs en ligne
- Messages de chat par jour
```

---

## 🔧 **Maintenance**

### **Nettoyage des Anciennes Notifications**

```bash
# Supprimer les notifications de plus de 30 jours
python manage.py shell
>>> from notifications.models import Notification
>>> Notification.objects.filter(cree_le__lt=timezone.now() - timedelta(days=30)).delete()
```

### **Archivage des Messages de Chat**

```bash
# Archiver les messages de plus de 90 jours
python manage.py shell
>>> from notifications.models import ChatMessage
>>> ChatMessage.objects.filter(cree_le__lt=timezone.now() - timedelta(days=90)).delete()
```

### **Optimisation des Performances**

```python
# Index de base de données
class Notification(models.Model):
    # ... champs
    class Meta:
        indexes = [
            models.Index(fields=['destinataire', 'cree_le']),
            models.Index(fields=['type_notification', 'cree_le']),
            models.Index(fields=['est_lue', 'cree_le']),
        ]
```

---

## 🆘 **Dépannage**

### **Problèmes Courants**

#### **WebSockets ne fonctionnent pas**

```bash
# Vérifier Redis
redis-cli ping

# Vérifier les logs Daphne
tail -f /var/log/notifications_web.log

# Redémarrer les services
sudo supervisorctl restart notifications_web
```

#### **Notifications ne s'affichent pas**

```bash
# Vérifier les types de notifications
python manage.py shell
>>> from notifications.models import NotificationType
>>> NotificationType.objects.count()  # Doit être 29

# Réinitialiser les types
python manage.py init_complete_notification_types
```

#### **Erreurs de permissions**

```bash
# Vérifier les permissions des fichiers
chmod 755 /path/to/backend
chown -R www-data:www-data /path/to/backend
```

---

## 📚 **Ressources Supplémentaires**

### **Documentation Django Channels**

- [Django Channels Documentation](https://channels.readthedocs.io/)
- [WebSocket Best Practices](https://channels.readthedocs.io/en/stable/topics/websockets.html)

### **Documentation Redis**

- [Redis Documentation](https://redis.io/documentation)
- [Redis Configuration](https://redis.io/topics/config)

### **Documentation Nginx**

- [Nginx WebSocket Proxy](https://nginx.org/en/docs/http/websocket.html)

---

## 🎯 **Résumé des Commandes Essentielles**

```bash
# Installation
pip install -r requirements.txt
python manage.py migrate
python manage.py init_complete_notification_types

# Développement
daphne -b 0.0.0.0 -p 8000 gestion.asgi:application

# Production
gunicorn gestion.wsgi:application --bind 0.0.0.0:8000
daphne -b 0.0.0.0:8001 gestion.asgi:application

# Maintenance
python manage.py test notifications
python manage.py shell  # Pour les opérations de maintenance
```

---

**Version :** 1.0  
**Dernière mise à jour :** 14 Octobre 2025  
**Auteur :** Équipe de Développement
