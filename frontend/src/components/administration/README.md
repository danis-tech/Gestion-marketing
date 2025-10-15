# Module d'Administration

## Description

Module d'administration complet pour la gestion des utilisateurs, services, rôles et permissions du système.

## Composants

### Administration.jsx

Composant principal qui gère la navigation entre les différents modules d'administration.

### UserManagement.jsx

Interface complète pour la gestion des utilisateurs :

- Création, modification et suppression d'utilisateurs
- Gestion des rôles et services
- Filtrage et recherche
- Interface responsive avec les couleurs de Gabon Telecom

## Fonctionnalités

### Gestion des Utilisateurs

- ✅ Création d'utilisateurs avec tous les champs requis
- ✅ Modification des informations utilisateur
- ✅ Suppression d'utilisateurs
- ✅ Attribution de rôles et services
- ✅ Gestion du statut actif/inactif
- ✅ Recherche et filtrage avancés
- ✅ Interface moderne et responsive

### Gestion des Services

- ✅ Création de nouveaux services
- ✅ Interface pour ajouter des services (intégrée dans UserManagement)

### Modules à venir

- 🔄 Gestion des Rôles
- 🔄 Gestion des Permissions
- 🔄 Analytiques
- 🔄 Journaux d'Activité
- 🔄 Sauvegarde
- 🔄 Rapports
- 🔄 Notifications Admin

## Utilisation

### Accès

L'interface d'administration est accessible via :

- URL : `/dashboard/administration`
- Navigation : Sidebar > Administration > Utilisateurs

### Permissions

- Seuls les super admins peuvent accéder à cette interface
- Les utilisateurs normaux voient seulement leurs propres notifications

## API Endpoints

### Utilisateurs

- `GET /api/accounts/users/` - Liste des utilisateurs
- `POST /api/accounts/users/` - Créer un utilisateur
- `PUT /api/accounts/users/{id}/` - Modifier un utilisateur
- `DELETE /api/accounts/users/{id}/` - Supprimer un utilisateur

### Services

- `GET /api/accounts/services/` - Liste des services
- `POST /api/accounts/services/` - Créer un service

### Rôles

- `GET /api/accounts/roles/` - Liste des rôles

### Permissions

- `GET /api/accounts/permissions/` - Liste des permissions

## Design

### Couleurs Gabon Telecom

- Bleu principal : `#1e40af` (header, boutons primaires)
- Vert : `#059669` (boutons de création)
- Gris : `#6b7280` (textes secondaires)
- Arrière-plans : Dégradés subtils

### Interface

- Design moderne avec des cartes et des ombres
- Animations fluides
- Responsive design
- Icônes Lucide React
- Typographie claire et lisible

## Structure des Fichiers

```
frontend/src/components/administration/
├── Administration.jsx          # Composant principal
├── Administration.css          # Styles du composant principal
├── UserManagement.jsx          # Gestion des utilisateurs
├── UserManagement.css          # Styles de la gestion des utilisateurs
├── index.js                    # Exports
└── README.md                   # Documentation
```

## Intégration

Le module est intégré dans le Dashboard principal via :

- Route : `/dashboard/administration/*`
- Import dans `Dashboard.jsx`
- Navigation via la sidebar existante
