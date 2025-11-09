# 📊 Analyse Complète du Projet - Système de Gestion Marketing

## 🎯 Vue d'Ensemble

**Nom du Projet** : Gestion-marketing  
**Type** : Application Web de Gestion de Projets Marketing  
**Architecture** : Architecture 3-tiers (Présentation / Logique Métier / Données)  
**Stack Technique** :
- **Backend** : Django 5.2 + Django REST Framework + Django Channels
- **Frontend** : React 18 + Vite + TanStack React Query
- **Base de données** : MySQL (production) / SQLite (développement)
- **Authentification** : JWT (JSON Web Tokens) avec rotation et blacklist
- **Communication temps réel** : WebSocket via Django Channels
- **IA** : DeepSeek API + spaCy (NLP) pour le chatbot

---

## 🏗️ Architecture Générale

### Architecture 3-Tiers

1. **Couche Présentation (Frontend)**
   - React avec composants modulaires
   - Routing avec React Router
   - Gestion d'état avec React Hooks + TanStack React Query
   - Communication API via Axios avec intercepteurs JWT

2. **Couche Logique Métier (Backend)**
   - Django REST Framework pour les API REST
   - Services métier séparés (NotificationService, AnalyticsService, ChatService, etc.)
   - Django Channels pour WebSocket
   - Système de permissions RBAC (Role-Based Access Control)

3. **Couche Données**
   - MySQL (production) / SQLite (développement)
   - Modèles Django ORM avec relations complexes
   - Migrations automatiques

---

## 📦 Modules Principaux

### 1. **Accounts** (Gestion des Utilisateurs)

**Modèles** :
- `User` : Utilisateur personnalisé (hérite d'AbstractUser)
- `Role` : Rôles système (marketing, dsi, finance, dg, admin)
- `Permission` : Permissions granulaires (projets:creer, etudes:valider, etc.)
- `Service` : Services organisationnels
- `RolePermission` : Table de jointure N↔N entre rôles et permissions
- `JwtJtiInvalide` : Blacklist des tokens JWT invalidés

**Fonctionnalités** :
- Authentification JWT avec refresh token
- RBAC (contrôle d'accès basé sur les rôles)
- Gestion des services et rôles
- Réinitialisation de mot de passe par email

**Sécurité** :
- Tokens JWT avec rotation automatique
- Blacklist des tokens invalidés
- Validation des mots de passe
- Gestion des sessions

---

### 2. **Projects** (Gestion des Projets)

**Modèles** :
- `Projet` : Projet marketing principal
  - Statuts : terminé, en_attente, hors_delai, rejeté
  - Priorités : haut, moyen, intermédiaire, bas
  - États : On (actif), Off (inactif)
  - Création automatique de 6 phases standard à la création

- `PhaseProjet` : Phases standard prédéfinies (6 phases)
  1. Expression du besoin
  2. Études de faisabilité
  3. Conception
  4. Développement / Implémentation
  5. Lancement commercial
  6. Suppression d'une offre

- `ProjetPhaseEtat` : État de chaque phase pour chaque projet
  - Terminée / Ignorée
  - Dates de début/fin
  - Calcul automatique de progression

- `Etape` : Étapes détaillées d'une phase
  - Statuts : en_attente, en_cours, terminée, annulée
  - Priorités : faible, normale, élevée, critique
  - Progression en pourcentage
  - Responsable assigné

- `Tache` : Tâches du projet
  - Liées à un projet
  - Statuts et priorités
  - Dépendances entre tâches
  - Assignation à des utilisateurs

- `MembreProjet` : Membres de l'équipe d'un projet
  - Rôle dans le projet
  - Service d'appartenance

- `PermissionProjet` : Permissions spécifiques par projet
  - Permissions granulaires (voir, modifier, supprimer, valider, etc.)

- `HistoriqueEtat` : Historique des changements d'état

**Fonctionnalités** :
- Création automatique des phases standard
- Calcul automatique de progression (projet → phases → étapes)
- Gestion des membres et permissions
- Historique complet des changements
- Notifications automatiques sur les changements

**Signaux Django** :
- Création automatique des phases à la création d'un projet
- Mise à jour automatique de la progression
- Notifications sur les changements d'état

---

### 3. **Documents** (Gestion Documentaire)

**Modèles** :
- `DocumentProjet` : Documents liés aux projets
  - Types de documents par phase (fiche_projet_marketing, fiche_specifications_marketing, etc.)
  - Statuts : brouillon, final, rejeté
  - Origine : généré (automatique) ou manuel
  - Versioning
  - Suivi des modifications de fichiers

- `HistoriqueDocumentProjet` : Historique des modifications
  - Actions : création, modification, changement_statut, upload, suppression, validation, rejet, synchronisation

- `CommentaireDocumentProjet` : Commentaires sur les documents
  - Support des réponses (commentaires imbriqués)
  - Suivi des modifications

- `DocumentTeleverse` : Documents téléversés par les utilisateurs
  - Validation workflow
  - Métadonnées complètes (hash, taille, type, etc.)
  - Support multi-formats (PDF, DOCX, XLSX, images, etc.)

**Services** :
- `FicheGenerationService` : Génération automatique de documents Word (.docx)
  - Templates Word personnalisés
  - Remplissage automatique depuis les données du projet
  - Génération de fiches par phase

- `PDFGenerationService` : Génération de PDFs

**Fonctionnalités** :
- Génération automatique de documents selon les phases
- Upload et gestion de fichiers
- Commentaires et collaboration
- Historique complet
- Synchronisation des modifications de fichiers

---

### 4. **Notifications** (Système de Notifications)

**Modèles** :
- `NotificationType` : Types de notifications prédéfinis
  - Notifications générales (pour tous)
  - Notifications personnelles (pour un utilisateur)
  - 30+ types différents

- `Notification` : Notifications individuelles
  - Priorités : faible, normale, élevée, critique
  - Statuts : non_lue, lue, archivée
  - Liens vers projets, tâches, étapes, services
  - Données supplémentaires en JSON

- `ChatMessage` : Messages du chat en temps réel
  - Messages système (connexion/déconnexion)
  - Messages utilisateurs

- `NotificationPreference` : Préférences utilisateur
  - Notifications email, push, chat
  - Horaires de réception
  - Fréquence (immédiat, quotidien, hebdomadaire)

- `NotificationLog` : Logs d'envoi (audit)

**Services** :
- `NotificationService` : Création et envoi de notifications
  - Notifications générales et personnelles
  - Envoi via WebSocket en temps réel
  - Support email (SMTP)

- `ChatService` : Gestion du chat en temps réel
  - Messages système
  - Historique des messages

**WebSocket** :
- Django Channels avec InMemoryChannelLayer (dev) / Redis (prod)
- Routes WebSocket pour notifications et chat
- Authentification via JWT
- Groupes par utilisateur et général

**Fonctionnalités** :
- Notifications en temps réel via WebSocket
- Chat général en temps réel
- Notifications par email
- Préférences utilisateur
- Historique et logs complets

---

### 5. **Analytics** (Analytiques et Métriques)

**Modèles** :
- `Metric` : Métriques calculées
  - Types : count, percentage, duration, currency, ratio
  - Catégories : projects, users, documents, tasks, performance, system
  - Périodes avec dates de début/fin
  - Métadonnées JSON

- `DashboardWidget` : Widgets du tableau de bord
  - Configuration JSON
  - Position et taille
  - Visibilité (actif, public)

- `Report` : Rapports générés
  - Configuration et données en JSON
  - Fichiers générés optionnels
  - Périodes

- `SystemHealth` : Monitoring système
  - CPU, mémoire, disque
  - Utilisateurs actifs
  - Taux d'erreur
  - Métriques base de données

**Service** :
- `AnalyticsService` : Calcul de toutes les métriques
  - Métriques projets (total, par statut, progression, retards)
  - Métriques utilisateurs (actifs, par service, par rôle)
  - Métriques documents (total, par type, par statut)
  - Métriques tâches (total, par statut, par priorité, progression)
  - Métriques performance (taux de complétion, délais moyens)
  - Métriques système (santé, performance)
  - Métriques retards et alertes
  - Métriques équipes (par service, par projet)
  - **Filtrage par projet** : Support pour métriques spécifiques à un projet

**Fonctionnalités** :
- Dashboard avec métriques en temps réel
- Filtrage par projet (sélection du projet le plus récent par défaut)
- Graphiques et visualisations (Recharts)
- Rapports personnalisables
- Monitoring système

---

### 6. **Chatbot** (Assistant IA)

**Modèles** :
- `Conversation` : Conversations avec le chatbot
  - Support utilisateurs connectés et non connectés (session_id)
  - Historique complet

- `Message` : Messages individuels
  - Expéditeur : user ou bot
  - Données NLP (tokens spaCy, entités)
  - Indicateur d'utilisation DeepSeek

**Fonctionnalités** :
- **Analyse NLP avec spaCy** :
  - Tokenisation
  - Extraction d'entités
  - Analyse contextuelle

- **Génération Text-to-SQL** :
  - Conversion de questions en langage naturel en requêtes SQL
  - Support de requêtes complexes

- **Intégration DeepSeek** :
  - LLM pour génération de réponses intelligentes
  - Prompt enrichi avec données de la base
  - Réponses contextuelles et naturelles

- **Analyse contextuelle intelligente** :
  - Détection automatique du contexte (projets, tâches, documents, etc.)
  - Récupération de données pertinentes
  - Réponses basées sur les données réelles

**Flux de traitement** :
1. Réception de la question utilisateur
2. Analyse NLP avec spaCy (tokens, entités)
3. Analyse contextuelle intelligente
4. Si échec → Génération Text-to-SQL automatique
5. Si échec → Méthode classique (mots-clés)
6. Enrichissement du prompt avec données récupérées
7. Appel DeepSeek avec prompt enrichi
8. Retour de la réponse au frontend

---

## 🔐 Authentification et Sécurité

### JWT (JSON Web Tokens)

**Configuration** :
- Access Token : 30 minutes
- Refresh Token : 7 jours
- Rotation automatique des refresh tokens
- Blacklist des tokens invalidés

**Flux d'authentification** :
1. Login → Récupération access + refresh tokens
2. Stockage dans localStorage
3. Ajout automatique du token dans les headers (intercepteur Axios)
4. Expiration access token → Refresh automatique
5. Expiration refresh token → Déconnexion

**Sérialiseur personnalisé** :
- Ajout du rôle et des permissions dans le token
- Support email ou username pour login

### RBAC (Role-Based Access Control)

**Structure** :
- Rôles → Permissions (N↔N)
- Utilisateurs → Rôles (1↔N)
- Permissions granulaires par code (ex: `projets:creer`)

**Permissions** :
- Permissions générales (système)
- Permissions par projet (PermissionProjet)

---

## 🌐 API REST

### Structure des URLs

```
/api/accounts/          # Authentification, utilisateurs, rôles, services
/api/projects/          # Projets, phases, étapes, tâches, membres
/api/documents/         # Documents, upload, génération
/api/chatbot/          # Chatbot IA
/api/notifications/    # Notifications, chat WebSocket
/api/analytics/        # Métriques, dashboard, rapports
```

### Endpoints Principaux

**Accounts** :
- `POST /api/accounts/login/` : Connexion
- `POST /api/accounts/refresh/` : Refresh token
- `POST /api/accounts/logout/` : Déconnexion (blacklist token)
- `GET /api/accounts/users/` : Liste des utilisateurs
- `GET /api/accounts/roles/` : Liste des rôles
- `GET /api/accounts/services/` : Liste des services

**Projects** :
- `GET /api/projects/` : Liste des projets
- `POST /api/projects/` : Créer un projet
- `GET /api/projects/{id}/` : Détails d'un projet
- `GET /api/projects/{id}/phases/` : Phases d'un projet
- `GET /api/projects/{id}/etapes/` : Étapes d'un projet
- `GET /api/projects/{id}/taches/` : Tâches d'un projet
- `GET /api/projects/{id}/membres/` : Membres d'un projet

**Documents** :
- `GET /api/documents/` : Liste des documents
- `POST /api/documents/upload/` : Upload de document
- `POST /api/documents/generate/` : Génération automatique
- `GET /api/documents/{id}/` : Détails d'un document

**Analytics** :
- `GET /api/analytics/metrics/dashboard/` : Dashboard général
- `GET /api/analytics/metrics/dashboard/?project_id={id}` : Dashboard par projet
- `GET /api/analytics/metrics/project_details/?project_id={id}` : Détails complets d'un projet
- `GET /api/analytics/metrics/calculate/` : Calcul de métriques

**Chatbot** :
- `POST /api/chatbot/` : Envoyer une question

**Notifications** :
- `GET /api/notifications/` : Liste des notifications
- `POST /api/notifications/mark_read/` : Marquer comme lue
- `GET /api/notifications/chat/` : Messages du chat

---

## 💻 Frontend

### Structure des Composants

```
src/
├── components/
│   ├── administration/     # Gestion utilisateurs, rôles, services, permissions
│   ├── analytics/          # Dashboard analytique, graphiques, rapports
│   ├── auth/               # Authentification
│   ├── chatbot/            # Interface chatbot
│   ├── dashboard/          # Composants dashboard (cartes, graphiques, progression)
│   ├── kanban/             # Tableau Kanban pour projets
│   ├── layout/             # Layout principal (Dashboard, Sidebar)
│   ├── modals/             # Modales (Login, Document, Phase, Étape)
│   ├── notifications/      # Notifications, chat temps réel
│   ├── pages/              # Pages principales
│   └── ui/                 # Composants UI réutilisables (Button, Card, etc.)
├── hooks/                  # Hooks React personnalisés
├── services/               # Services API (apiService, chatbotApi, permissionService)
├── contexts/              # Contextes React (Theme)
└── utils/                  # Utilitaires
```

### Gestion d'État

**TanStack React Query** :
- Cache des requêtes API
- Synchronisation automatique
- Gestion des mutations
- Refetch automatique

**React Hooks** :
- `useState` pour état local
- `useEffect` pour effets de bord
- Hooks personnalisés :
  - `useStats` : Statistiques dashboard
  - `useNotification` : Notifications
  - `useProjectPhases` : Phases de projet
  - `useProjectEtapes` : Étapes de projet
  - `useDocuments` : Documents
  - `useFileMonitoring` : Surveillance fichiers

### Communication API

**Axios avec Intercepteurs** :
- Ajout automatique du token JWT
- Refresh automatique du token (401)
- Gestion des erreurs centralisée
- Retry automatique

**Services API** :
- `apiService.js` : Tous les services API
  - `authService` : Authentification
  - `projectService` : Projets
  - `documentService` : Documents
  - `analyticsService` : Analytiques
  - `notificationService` : Notifications
  - `chatbotService` : Chatbot

### WebSocket (Notifications)

**Composants** :
- `NotificationBell` : Cloche de notifications
- `NotificationCenter` : Centre de notifications
- `RealtimeChat` : Chat en temps réel
- `ConnectionStatus` : Statut de connexion WebSocket

**Flux** :
1. Connexion WebSocket au chargement
2. Authentification via JWT
3. Abonnement aux groupes (utilisateur + général)
4. Réception des notifications en temps réel
5. Mise à jour automatique de l'UI
6. Reconnexion automatique en cas de déconnexion

---

## 📊 Dashboard et Analytiques

### Page Dashboard Home

**Composants** :
- **Stats Cards** : Cartes de statistiques (Projets, Tâches, Utilisateurs, Documents)
- **Project Selector** : Sélecteur de projet (défaut : plus récent)
- **SummaryCharts** : 3 graphiques principaux
  - Projets (progression par phase si projet sélectionné)
  - Tâches (répartition par statut)
  - Équipes (membres par service)
- **ProjectProgress** : Progression détaillée du projet
  - Informations projet
  - Barre de progression globale
  - Liste des phases avec progression
  - Statistiques des étapes

**Filtrage par Projet** :
- Sélection du projet le plus récent par défaut
- Mise à jour automatique des graphiques
- Données spécifiques au projet sélectionné

### Graphiques (Recharts)

- Graphiques en secteurs (Pie Chart)
- Graphiques en barres (Bar Chart)
- Graphiques de progression
- Animations et transitions

---

## 🔄 Flux de Données

### Création d'un Projet

1. **Frontend** : Formulaire de création
2. **API** : `POST /api/projects/`
3. **Backend** :
   - Création du projet
   - Signal Django → Création automatique des 6 phases
   - Création des `ProjetPhaseEtat` pour chaque phase
4. **Notification** : Notification de création envoyée
5. **Frontend** : Mise à jour automatique (React Query)

### Changement d'État d'une Étape

1. **Frontend** : Mise à jour de l'étape
2. **API** : `PATCH /api/projects/{id}/etapes/{id}/`
3. **Backend** :
   - Mise à jour de l'étape
   - Calcul automatique de progression de la phase
   - Si toutes les étapes terminées → Phase terminée
   - Calcul automatique de progression du projet
4. **Notification** : Notification envoyée au responsable
5. **WebSocket** : Notification en temps réel
6. **Frontend** : Mise à jour automatique

### Génération de Document

1. **Frontend** : Sélection du type de document
2. **API** : `POST /api/documents/generate/`
3. **Backend** :
   - `FicheGenerationService` : Récupération du template Word
   - Remplissage avec données du projet
   - Génération du fichier .docx
   - Création de l'entrée `DocumentProjet`
4. **Frontend** : Téléchargement du document

### Chatbot - Question Utilisateur

1. **Frontend** : Envoi de la question
2. **API** : `POST /api/chatbot/`
3. **Backend** :
   - Analyse NLP avec spaCy
   - Analyse contextuelle intelligente
   - Si échec → Text-to-SQL
   - Si échec → Méthode classique
   - Enrichissement du prompt avec données
   - Appel DeepSeek API
4. **Frontend** : Affichage de la réponse

---

## 🛠️ Technologies et Dépendances

### Backend

- **Django** 5.2
- **Django REST Framework**
- **Django Channels** (WebSocket)
- **djangorestframework-simplejwt** (JWT)
- **spaCy** (NLP)
- **python-docx** (Génération Word)
- **requests** (DeepSeek API)
- **mysqlclient** (MySQL)

### Frontend

- **React** 18
- **Vite** (Build tool)
- **React Router** (Routing)
- **TanStack React Query** (State management)
- **Axios** (HTTP client)
- **Recharts** (Graphiques)
- **Lucide React** (Icônes)
- **Tailwind CSS** (Styling)

---

## 📁 Structure des Fichiers

### Backend

```
backend/
├── accounts/          # Gestion utilisateurs, RBAC
├── projects/          # Gestion projets, phases, étapes, tâches
├── documents/         # Gestion documentaire
├── notifications/     # Notifications et chat
├── analytics/         # Analytiques et métriques
├── chatbot/           # Chatbot IA
├── gestion/           # Configuration Django
│   ├── settings.py    # Configuration principale
│   ├── urls.py        # URLs racine
│   ├── asgi.py        # ASGI (WebSocket)
│   └── wsgi.py        # WSGI
└── manage.py
```

### Frontend

```
frontend/
├── src/
│   ├── components/    # Composants React
│   ├── hooks/         # Hooks personnalisés
│   ├── services/      # Services API
│   ├── contexts/      # Contextes React
│   ├── utils/         # Utilitaires
│   ├── config/        # Configuration
│   └── App.jsx        # Composant racine
├── package.json
└── vite.config.js
```

---

## 🎨 Interface Utilisateur

### Design

- **Style** : Moderne et professionnel
- **Couleurs** : Palette cohérente avec thème
- **Responsive** : Adaptatif mobile/desktop
- **Animations** : Transitions fluides
- **Icônes** : Lucide React

### Composants UI Réutilisables

- `Button` : Bouton principal (utilisé partout)
- `StatsCard` : Carte de statistiques
- `LoadingSpinner` : Indicateur de chargement
- `Modal` : Modales réutilisables
- `NotificationBell` : Cloche de notifications
- `ProjectCard` : Carte de projet
- `TaskCard` : Carte de tâche

---

## 🔧 Configuration

### Variables d'Environnement

- `SECRET_KEY` : Clé secrète Django
- `DEBUG` : Mode debug
- `ALLOWED_HOSTS` : Hôtes autorisés
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` : Base de données
- `DEEPSEEK_API_KEY` : Clé API DeepSeek
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` : SMTP

### Settings Django

- **JWT** : Configuration Simple JWT
- **CORS** : Configuration CORS pour développement
- **Channels** : InMemoryChannelLayer (dev) / Redis (prod)
- **Media** : Configuration des fichiers médias
- **Email** : Configuration SMTP

---

## 🚀 Fonctionnalités Clés

1. **Gestion Complète de Projets**
   - Création, modification, suppression
   - 6 phases standard automatiques
   - Étapes personnalisables
   - Calcul automatique de progression

2. **Gestion Documentaire**
   - Génération automatique de documents Word
   - Upload et gestion de fichiers
   - Commentaires et collaboration
   - Historique complet

3. **Notifications en Temps Réel**
   - WebSocket pour notifications instantanées
   - Chat général en temps réel
   - Notifications par email
   - Préférences utilisateur

4. **Analytiques Avancées**
   - Dashboard avec métriques en temps réel
   - Filtrage par projet
   - Graphiques interactifs
   - Rapports personnalisables

5. **Chatbot IA**
   - Analyse NLP avec spaCy
   - Génération Text-to-SQL
   - Intégration DeepSeek
   - Réponses contextuelles

6. **Sécurité et Permissions**
   - JWT avec rotation
   - RBAC complet
   - Permissions par projet
   - Blacklist des tokens

---

## 📝 Points d'Attention

1. **Performance** :
   - Optimisation des requêtes (select_related, prefetch_related)
   - Cache des métriques
   - Pagination des listes

2. **Sécurité** :
   - Validation des entrées
   - Protection CSRF
   - Sanitization des données

3. **Scalabilité** :
   - Redis pour Channels en production
   - Optimisation base de données
   - Cache des requêtes fréquentes

4. **Maintenance** :
   - Logs complets
   - Gestion des erreurs
   - Tests unitaires et d'intégration

---

## 🎯 Conclusion

Ce projet est une **application complète de gestion de projets marketing** avec :
- Architecture moderne et modulaire
- Fonctionnalités avancées (IA, temps réel, analytiques)
- Sécurité robuste (JWT, RBAC)
- Interface utilisateur moderne et intuitive
- Code bien structuré et maintenable

Le système est prêt pour la production avec quelques optimisations supplémentaires (Redis, cache, monitoring).

