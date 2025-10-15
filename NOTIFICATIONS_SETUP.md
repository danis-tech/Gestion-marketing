# 🔔 Configuration du Système de Notifications

## 📋 Vue d'ensemble

Le système de notifications a été créé avec les fonctionnalités suivantes :

### 🎯 Fonctionnalités Principales

#### **Notifications Générales**

- 📊 Projets en retard
- ⏰ Tâches en retard
- 👥 **Compteur d'utilisateurs en ligne en temps réel** (basé sur `last_login` dans les 2 dernières minutes)
- 💬 Chat en temps réel avec WebSocket
- 📢 Annonces générales
- 🔧 Notifications de maintenance

#### **Notifications Personnelles**

- ✅ Tâches assignées
- 🎯 Tâches terminées
- 👑 Chef de projet
- ✅ Projet validé
- 🔄 Projet en cours
- ⚠️ Projet en retard
- 👥 Membre d'équipe
- 🏁 Étape terminée
- 📄 Document validé/rejeté

## 🔧 Corrections Récentes

### ✅ **Problème du Compteur d'Utilisateurs en Ligne Résolu**

**Problème :** Le widget "Activité Générale" affichait "8 UTILISATEURS EN LIGNE" (valeur statique) au lieu du nombre réel.

**Solution :**

- ✅ **Frontend** : Remplacement des valeurs statiques par des données dynamiques
- ✅ **Backend** : Logique de détection améliorée (2 minutes au lieu de 5)
- ✅ **WebSockets** : Configuration complète avec daphne (ASGI)
- ✅ **Actualisation** : Automatique toutes les 30 secondes

**Résultat :** Le compteur affiche maintenant le vrai nombre d'utilisateurs connectés en temps réel.

## 🚀 Installation

### 1. Installation des dépendances

```bash
cd backend
pip install -r requirements.txt
```

**⚠️ IMPORTANT :** Le fichier `requirements.txt` inclut maintenant `daphne==4.2.1` pour les WebSockets.

### 2. Démarrage du Serveur avec Daphne (ASGI)

**⚠️ IMPORTANT :** Pour que les WebSockets fonctionnent, vous devez utiliser **daphne** au lieu du serveur de développement Django standard.

#### Commande de Démarrage

```bash
# 1. Aller dans le répertoire backend
cd backend

# 2. Activer l'environnement virtuel
.venv\Scripts\Activate.ps1

# 3. Démarrer avec daphne (ASGI)
daphne -b 0.0.0.0 -p 8000 gestion.asgi:application
```

#### Alternative avec Redis (pour la production)

```bash
# Windows (avec Chocolatey)
choco install redis-64

# Ou télécharger depuis: https://github.com/microsoftarchive/redis/releases
```

#### Option B: Configuration alternative (sans Redis)

Modifiez `backend/gestion/settings.py` :

```python
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer'
    }
}
```

### 3. Migrations de la base de données

```bash
cd backend
python manage.py makemigrations notifications
python manage.py migrate
```

### 4. Initialisation des types de notifications

```bash
python manage.py init_notification_types
```

### 5. Création de notifications d'exemple (optionnel)

```bash
python manage.py create_sample_notifications --count 20
```

## 🔧 Configuration

### Variables d'environnement

Ajoutez dans votre fichier `.env` :

```env
# Redis (si utilisé)
REDIS_URL=redis://localhost:6379/0

# WebSocket
WEBSOCKET_URL=ws://localhost:8000/ws/
```

### Configuration Django Channels

Le fichier `backend/gestion/asgi.py` a été configuré pour supporter les WebSockets.

## 🎮 Utilisation

### Backend

#### API Endpoints

```bash
# Notifications
GET    /api/notifications/                    # Liste des notifications
POST   /api/notifications/mark-read/          # Marquer comme lues
POST   /api/notifications/archive/            # Archiver
GET    /api/notifications/stats/              # Statistiques
GET    /api/notifications/unread-count/       # Compteur non lues

# Chat
GET    /api/notifications/chat/messages/      # Messages de chat
GET    /api/notifications/chat/online-users/  # Utilisateurs en ligne

# Préférences
GET    /api/notifications/preferences/        # Préférences utilisateur
PUT    /api/notifications/preferences/        # Modifier préférences
```

#### WebSocket Endpoints

```javascript
// Notifications
ws://localhost:8000/ws/notifications/

// Chat
ws://localhost:8000/ws/chat/
```

### Frontend

#### Composants disponibles

1. **NotificationBell** - Cloche de notification dans la barre de navigation
2. **NotificationCenter** - Centre de notifications complet
3. **RealtimeChat** - Chat en temps réel
4. **NotificationPages** - Pages de gestion des notifications

#### Intégration dans l'application

Les composants sont déjà intégrés dans :

- `frontend/src/components/layout/Dashboard.jsx`
- `frontend/src/components/layout/Sidebar.jsx`

## 🔄 Démarrage du serveur

### 1. Démarrer Redis (si utilisé)

```bash
redis-server
```

### 2. Démarrer Django avec ASGI (WebSockets)

**⚠️ IMPORTANT : Pour les WebSockets, utilisez daphne au lieu du serveur Django standard**

```bash
cd backend
# Avec daphne (recommandé pour WebSockets)
.venv\Scripts\daphne.exe -b 0.0.0.0 -p 8000 gestion.asgi:application

# Ou avec le serveur Django standard (sans WebSockets)
python manage.py runserver 0.0.0.0:8000
```

### 3. Démarrer le frontend

```bash
cd frontend
npm start
```

### 4. Vérification du fonctionnement

1. **Test API REST** :

   ```bash
   curl http://localhost:8000/api/notifications/types/
   ```

2. **Test WebSocket** (avec daphne uniquement) :
   ```bash
   curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==" http://localhost:8000/ws/notifications/
   ```

## 📱 Interface Utilisateur

### Navigation

- **Notifications** dans la sidebar avec deux sous-sections :
  - **Générales** : `/dashboard/notifications/generale`
  - **Personnelles** : `/dashboard/notifications/personnelle`

### Fonctionnalités

- 🔔 Cloche de notification avec compteur en temps réel
- 💬 Chat général avec indicateur de frappe
- 📊 Statistiques et filtres
- 🔍 Recherche dans les notifications
- ⚙️ Préférences personnalisables

## 🛠️ Développement

### Ajout de nouveaux types de notifications

1. Ajoutez le type dans `NotificationType` :

```python
# Dans notifications/models.py
TYPE_CHOICES = [
    # ... types existants
    ('nouveau_type', 'Nouveau Type'),
]
```

2. Créez la notification :

```python
from notifications.services import NotificationService

NotificationService.create_general_notification(
    type_code='nouveau_type',
    titre='Titre de la notification',
    message='Message de la notification',
    priorite='normale'
)
```

### Déclencheurs automatiques

Les signaux Django sont configurés dans `notifications/signals.py` pour :

- Création/modification de projets
- Création/modification de tâches
- Ajout de membres d'équipe
- Connexions utilisateurs

## 🐛 Dépannage

### Problèmes courants

1. **WebSocket ne se connecte pas**

   - ✅ **Vérifiez que daphne est utilisé** (pas le serveur Django standard)
   - ✅ **Vérifiez que daphne est dans requirements.txt** : `daphne==4.2.1`
   - ✅ **Vérifiez la configuration ASGI** dans `gestion/asgi.py`
   - ✅ **Vérifiez que Redis est démarré** (ou utilisez InMemoryChannelLayer)
   - ✅ **Vérifiez les CORS settings**

2. **Notifications ne s'affichent pas**

   - ✅ **Vérifiez les permissions utilisateur**
   - ✅ **Vérifiez les types de notifications**
   - ✅ **Vérifiez les signaux Django**
   - ✅ **Vérifiez l'authentification JWT**

3. **Chat ne fonctionne pas**

   - ✅ **Vérifiez que daphne est démarré** (pas runserver)
   - ✅ **Vérifiez la connexion WebSocket**
   - ✅ **Vérifiez l'authentification**
   - ✅ **Vérifiez les logs du serveur**

4. **Erreur "Not Found: /ws/notifications/"**

   - ✅ **Utilisez daphne** : `.venv\Scripts\daphne.exe -b 0.0.0.0 -p 8000 gestion.asgi:application`
   - ✅ **Ne pas utiliser** : `python manage.py runserver` (ne supporte pas WebSockets)

5. **Daphne ne démarre pas**
   - ✅ **Vérifiez l'installation** : `pip install daphne==4.2.1`
   - ✅ **Vérifiez la configuration ASGI** : Django doit être initialisé avant les imports
   - ✅ **Vérifiez les dépendances** : channels, asgiref

### Logs

Activez les logs Django pour déboguer :

```python
# Dans settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'notifications': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

## 📚 Documentation API

### Modèles

- **Notification** : Notification principale
- **NotificationType** : Types de notifications
- **ChatMessage** : Messages de chat
- **NotificationPreference** : Préférences utilisateur

### Services

- **NotificationService** : Gestion des notifications
- **ChatService** : Gestion du chat

### Consumers WebSocket

- **NotificationConsumer** : Gestion des notifications temps réel
- **ChatConsumer** : Gestion du chat temps réel

## 🎉 Fonctionnalités Avancées

- ⚡ Notifications en temps réel avec WebSocket
- 🔄 Reconnexion automatique
- 📱 Interface responsive
- 🌙 Support du mode sombre
- 🔍 Recherche et filtres avancés
- 📊 Statistiques détaillées
- ⚙️ Préférences personnalisables
- 🗂️ Archivage automatique
- 🔔 Notifications toast
- 👥 Gestion des utilisateurs en ligne

Le système est maintenant prêt à être utilisé ! 🚀
