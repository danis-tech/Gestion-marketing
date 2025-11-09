# 📧 Configuration des Notifications par Email

## 📋 Vue d'ensemble

Le système d'envoi d'emails a été configuré pour envoyer automatiquement des notifications par email lors de :
- **Création, modification, suppression** de projets, tâches et étapes
- **Retards** de projets, tâches et étapes (3 fois par jour)

## ✅ Fonctionnalités Implémentées

### 1. Emails pour Projets
- ✅ **Création** : Email envoyé à tous les membres du projet
- ✅ **Modification** : Email envoyé à tous les membres du projet
- ✅ **Suppression** : Email envoyé à tous les membres du projet
- ✅ **Retard** : Email envoyé au propriétaire du projet (3 fois par jour)

### 2. Emails pour Tâches
- ✅ **Création** : Email envoyé à tous les membres de la tâche (assignés + membres du projet)
- ✅ **Modification** : Email envoyé à tous les membres de la tâche
- ✅ **Suppression** : Email envoyé à tous les membres de la tâche
- ✅ **Retard** : Email envoyé aux personnes assignées (3 fois par jour)

### 3. Emails pour Étapes
- ✅ **Création** : Email envoyé à tous les membres de l'étape (responsable + membres du projet)
- ✅ **Modification** : Email envoyé à tous les membres de l'étape
- ✅ **Suppression** : Email envoyé à tous les membres de l'étape
- ✅ **Retard** : Email envoyé au responsable de l'étape (3 fois par jour)

## 🔧 Configuration

### 1. Configuration Email (déjà configurée dans `settings.py`)

```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'votre-email@gmail.com'
EMAIL_HOST_PASSWORD = 'votre-mot-de-passe'
DEFAULT_FROM_EMAIL = 'votre-email@gmail.com'
```

**⚠️ Note** : Il y a une erreur dans le fichier `settings.py` actuel : `EMAIL_HOST_USER` et `DEFAULT_FROM_EMAIL` contiennent `'marketges174@gmail.com.com'` (double `.com`). Corrigez cela.

### 2. Configuration de la Tâche Périodique pour les Retards

Pour envoyer automatiquement les emails de retard **3 fois par jour**, vous devez configurer un cron job ou une tâche planifiée.

#### Option 1 : Cron Job (Linux/Mac)

Ajoutez cette ligne à votre crontab (`crontab -e`) :

```bash
# Envoyer les emails de retard à 8h, 14h et 20h
0 8,14,20 * * * cd /chemin/vers/backend && python manage.py send_delay_emails
```

#### Option 2 : Tâche Planifiée Windows

1. Ouvrez le **Planificateur de tâches** Windows
2. Créez une **tâche de base**
3. Configurez :
   - **Déclencheur** : 3 fois par jour (8h, 14h, 20h)
   - **Action** : Exécuter un programme
   - **Programme** : `python`
   - **Arguments** : `manage.py send_delay_emails`
   - **Dossier de départ** : `C:\chemin\vers\backend`

#### Option 3 : Exécution Manuelle (pour tests)

```bash
cd backend
python manage.py send_delay_emails
```

## 📁 Fichiers Créés/Modifiés

### Services
- `backend/projects/email_service.py` : Service complet d'envoi d'emails

### Templates Email
- `backend/templates/emails/project_created.html` (modifié)
- `backend/templates/emails/project_updated.html` (nouveau)
- `backend/templates/emails/project_deleted.html` (nouveau)
- `backend/templates/emails/project_delay.html` (nouveau)
- `backend/templates/emails/task_created.html` (nouveau)
- `backend/templates/emails/task_updated.html` (nouveau)
- `backend/templates/emails/task_deleted.html` (nouveau)
- `backend/templates/emails/task_delay.html` (nouveau)
- `backend/templates/emails/step_created.html` (nouveau)
- `backend/templates/emails/step_updated.html` (nouveau)
- `backend/templates/emails/step_deleted.html` (nouveau)
- `backend/templates/emails/step_delay.html` (nouveau)

### Signaux
- `backend/notifications/signals.py` (modifié) : Intégration des appels au service d'email

### Commandes Management
- `backend/projects/management/commands/send_delay_emails.py` : Commande pour envoyer les emails de retard

## 🧪 Test

Pour tester l'envoi d'emails :

1. **Créer un projet** : Un email sera automatiquement envoyé à tous les membres
2. **Modifier un projet** : Un email sera automatiquement envoyé à tous les membres
3. **Supprimer un projet** : Un email sera automatiquement envoyé à tous les membres
4. **Créer une tâche** : Un email sera automatiquement envoyé à tous les membres de la tâche
5. **Créer une étape** : Un email sera automatiquement envoyé à tous les membres de l'étape
6. **Tester les retards** : Exécutez manuellement `python manage.py send_delay_emails`

## ⚠️ Notes Importantes

1. **Configuration Email** : Assurez-vous que la configuration SMTP est correcte dans `settings.py`
2. **Permissions** : Les emails ne sont envoyés qu'aux utilisateurs qui ont une adresse email valide
3. **Erreurs Silencieuses** : Les erreurs d'envoi d'email sont capturées et n'interrompent pas l'exécution du code
4. **Tâche Périodique** : N'oubliez pas de configurer le cron job ou la tâche planifiée pour les retards

## 📝 Exemple d'Utilisation

```python
from projects.email_service import ProjectEmailService

# Envoyer un email de création de projet
ProjectEmailService.send_project_created_email(projet)

# Envoyer un email de modification de projet
ProjectEmailService.send_project_updated_email(projet)

# Envoyer un email de retard de projet
ProjectEmailService.send_project_delay_email(projet)
```

## 🎨 Style des Emails

Tous les templates utilisent le même style professionnel avec :
- Header bleu (#2563eb) pour les actions normales
- Header rouge (#dc2626) pour les suppressions
- Header orange (#f59e0b) pour les retards
- Header vert (#22c55e) pour les créations de tâches
- Header violet (#8b5cf6) pour les créations d'étapes
- Design responsive pour mobile
- Footer avec informations de contact

