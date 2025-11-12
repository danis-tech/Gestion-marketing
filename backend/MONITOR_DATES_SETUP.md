# 📅 Système de Surveillance Automatique des Dates

## 📋 Vue d'ensemble

Le système surveille automatiquement les dates de début et de fin des projets et tâches, met à jour les statuts et envoie des notifications par email et interne.

## ✅ Fonctionnalités Implémentées

### 1. **Surveillance des dates de début**

- ✅ **Projets/Tâches qui commencent demain** : Notification email + notification interne à tous les membres
- ✅ **Projets/Tâches qui commencent aujourd'hui** :
  - Mise à jour automatique du statut en `en_cours`
  - Notification email + notification interne à tous les membres

### 2. **Surveillance des dates de fin**

- ✅ **Projets/Tâches en retard** :
  - Mise à jour automatique du statut en `hors_delai`
  - Notification email + notification interne (générale + personnelle)

## 🔧 Configuration

### 1. Commande de Management

La commande `monitor_dates` effectue toutes les vérifications :

```bash
python manage.py monitor_dates
```

### 2. Programmation Automatique

Pour que la commande s'exécute automatiquement, vous devez la programmer avec un **cron job** ou **Celery Beat**.

#### Option 1 : Cron Job (Linux/Mac)

Ajoutez cette ligne dans votre crontab (`crontab -e`) :

```bash
# Exécuter la surveillance des dates tous les jours à 8h00
0 8 * * * cd /chemin/vers/backend && python manage.py monitor_dates
```

#### Option 2 : Celery Beat (Recommandé pour production)

Si vous utilisez Celery, ajoutez cette tâche périodique dans `celery.py` :

```python
from celery.schedules import crontab

app.conf.beat_schedule = {
    'monitor-dates-daily': {
        'task': 'projects.tasks.monitor_dates_task',
        'schedule': crontab(hour=8, minute=0),  # Tous les jours à 8h00
    },
}
```

#### Option 3 : Windows Task Scheduler

Pour Windows, créez une tâche planifiée qui exécute :

```batch
cd C:\chemin\vers\backend
python manage.py monitor_dates
```

## 📊 Ce que fait la commande

### 1. **Projets/Tâches qui commencent demain**

- Envoie un email à tous les membres
- Crée une notification interne pour chaque membre
- **Aucun changement de statut** (juste une alerte préventive)

### 2. **Projets/Tâches qui commencent aujourd'hui**

- Met à jour le statut : `en_attente` → `en_cours`
- Envoie un email à tous les membres
- Crée une notification interne pour chaque membre

### 3. **Projets/Tâches en retard**

- Met à jour le statut : `en_attente` ou `en_cours` → `hors_delai`
- Envoie un email à tous les membres
- Crée une notification générale
- Crée une notification personnelle pour chaque membre

## 📧 Templates d'Email

Les templates suivants sont utilisés (à créer si nécessaire) :

- `emails/project_starting_soon.html` - Projet qui commence demain
- `emails/project_started.html` - Projet qui vient de démarrer
- `emails/task_starting_soon.html` - Tâche qui commence demain
- `emails/task_started.html` - Tâche qui vient de démarrer
- `emails/project_delay.html` - Projet en retard (existant)
- `emails/task_delay.html` - Tâche en retard (existant)

## 🔔 Types de Notifications

Les types de notifications suivants sont créés automatiquement :

- `projet_debut` - Projet qui commence
- `tache_debut` - Tâche qui commence
- `projet_retard` - Projet en retard (existant)
- `tache_retard` - Tâche en retard (existant)

## 🧪 Test de la Commande

Pour tester la commande manuellement :

```bash
python manage.py monitor_dates
```

La commande affichera un résumé de toutes les actions effectuées :

- Nombre de projets/tâches qui commencent demain
- Nombre de projets/tâches démarrés aujourd'hui
- Nombre de projets/tâches en retard
- Nombre d'emails envoyés
- Nombre de notifications créées

## ⚠️ Notes Importantes

1. **Fréquence d'exécution** : La commande doit être exécutée **au moins une fois par jour** (recommandé le matin à 8h00)

2. **Statuts concernés** :

   - Pour les projets/tâches qui commencent : Seulement ceux avec le statut `en_attente`
   - Pour les retards : Seulement ceux avec les statuts `en_attente` ou `en_cours` (pas `termine`, `hors_delai`, `rejete`)

3. **Notifications** : Les notifications sont créées même si l'envoi d'email échoue

4. **Logs** : Toutes les erreurs sont loggées et affichées dans la console

## 🔄 Intégration avec la commande existante

La commande `send_delay_emails` existante continue de fonctionner pour envoyer des rappels de retard. La nouvelle commande `monitor_dates` est plus complète car elle :

- Met à jour automatiquement les statuts
- Gère les dates de début (pas seulement les retards)
- Crée des notifications internes en plus des emails

Vous pouvez exécuter les deux commandes ou remplacer `send_delay_emails` par `monitor_dates`.
