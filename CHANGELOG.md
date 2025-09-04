# Changelog - Gestion Marketing API

## Version 1.1.0 - Corrections et Améliorations (2025-08-26)

### 🔧 Corrections Backend

#### Correction de l'erreur d'intégrité des permissions

- **Problème** : Erreur `IntegrityError` lors de la modification des permissions de projet
- **Cause** : Violation de contrainte unique lors du changement de type de permission
- **Solution** : Modification du sérialiseur `PermissionProjetUpdateSerializer` pour gérer correctement les mises à jour

#### Suppression des modèles redondants

- **Supprimé** : Modèle `RoleProjet` redondant (utilise maintenant `Role` du module `accounts`)
- **Raison** : Éviter la duplication avec les modèles existants du module `accounts`
- **Impact** : Structure de base de données plus cohérente

#### Amélioration de la structure des modèles

- **Ajouté** : Import des modèles `Role` et `Permission` du module `accounts`
- **Amélioré** : Documentation des modèles pour clarifier leur rôle
- **Corrigé** : Relations entre les modèles pour éviter les conflits

### 🚀 Nouvelles Fonctionnalités Backend

#### Gestion complète des rôles et permissions

- **Ajouté** : ViewSets pour `Role`, `Permission`, `Service` et `RolePermission`
- **Ajouté** : Endpoints pour gérer les permissions des rôles
- **Ajouté** : Sérialiseurs complets pour tous les modèles

#### API des projets améliorée

- **Ajouté** : Endpoints pour les statistiques des projets
- **Ajouté** : Gestion des membres de projet
- **Ajouté** : Gestion des permissions spécifiques aux projets
- **Ajouté** : Historique des changements d'état

### 🎨 Améliorations Frontend

#### Configuration API mise à jour

- **Ajouté** : Endpoints pour tous les nouveaux services backend
- **Ajouté** : Services pour les projets, rôles, permissions
- **Amélioré** : Structure des endpoints pour une meilleure organisation

#### Services API complets

- **Ajouté** : `projectService` avec toutes les opérations CRUD
- **Ajouté** : `roleService` avec gestion des permissions
- **Ajouté** : `rolePermissionService` pour les relations rôles-permissions
- **Amélioré** : Gestion des erreurs et des tokens

#### Correction du LoginModal

- **Corrigé** : Utilisation des clés de configuration au lieu de clés hardcodées
- **Amélioré** : Cohérence avec le système de configuration

### 📋 Endpoints API Disponibles

#### Authentification

- `POST /api/accounts/login/` - Connexion
- `POST /api/accounts/signup/` - Inscription
- `POST /api/accounts/refresh/` - Rafraîchir le token
- `POST /api/accounts/logout/` - Déconnexion
- `GET /api/accounts/me/` - Profil utilisateur
- `POST /api/accounts/password-reset-request/` - Demande de réinitialisation
- `POST /api/accounts/password-reset-confirm/` - Confirmation de réinitialisation

#### Gestion des utilisateurs

- `GET /api/accounts/users/` - Liste des utilisateurs
- `POST /api/accounts/users/` - Créer un utilisateur
- `GET /api/accounts/users/{id}/` - Détails d'un utilisateur
- `PUT /api/accounts/users/{id}/` - Modifier un utilisateur
- `DELETE /api/accounts/users/{id}/` - Supprimer un utilisateur

#### Gestion des rôles et permissions

- `GET /api/accounts/roles/` - Liste des rôles
- `POST /api/accounts/roles/` - Créer un rôle
- `GET /api/accounts/roles/{id}/` - Détails d'un rôle
- `PUT /api/accounts/roles/{id}/` - Modifier un rôle
- `DELETE /api/accounts/roles/{id}/` - Supprimer un rôle
- `GET /api/accounts/roles/{id}/permissions/` - Permissions d'un rôle

- `GET /api/accounts/permissions/` - Liste des permissions
- `GET /api/accounts/permissions/{id}/` - Détails d'une permission

- `GET /api/accounts/services/` - Liste des services
- `GET /api/accounts/services/{id}/` - Détails d'un service

- `GET /api/accounts/role-permissions/` - Liste des permissions de rôles
- `POST /api/accounts/role-permissions/` - Assigner une permission à un rôle
- `DELETE /api/accounts/role-permissions/{id}/` - Retirer une permission d'un rôle

#### Gestion des projets

- `GET /api/projects/` - Liste des projets
- `POST /api/projects/` - Créer un projet
- `GET /api/projects/{id}/` - Détails d'un projet
- `PUT /api/projects/{id}/` - Modifier un projet
- `DELETE /api/projects/{id}/` - Supprimer un projet
- `PATCH /api/projects/{id}/update_statut/` - Mettre à jour le statut
- `GET /api/projects/stats/` - Statistiques des projets

#### Membres de projet

- `GET /api/projects/{id}/membres/` - Liste des membres
- `POST /api/projects/{id}/membres/` - Ajouter un membre
- `GET /api/projects/{id}/membres/{member_id}/` - Détails d'un membre
- `PUT /api/projects/{id}/membres/{member_id}/` - Modifier un membre
- `DELETE /api/projects/{id}/membres/{member_id}/` - Supprimer un membre

#### Permissions de projet

- `GET /api/projects/{id}/permissions/` - Liste des permissions
- `POST /api/projects/{id}/permissions/` - Accorder une permission
- `GET /api/projects/{id}/permissions/{permission_id}/` - Détails d'une permission
- `PUT /api/projects/{id}/permissions/{permission_id}/` - Modifier une permission
- `DELETE /api/projects/{id}/permissions/{permission_id}/` - Révoquer une permission
- `GET /api/projects/{id}/permissions/utilisateur-permissions/` - Permissions d'un utilisateur
- `POST /api/projects/{id}/permissions/accorder-multiple/` - Accorder plusieurs permissions

#### Historique de projet

- `GET /api/projects/{id}/historiques/` - Historique des changements
- `GET /api/projects/{id}/historiques/{history_id}/` - Détails d'un historique

### 🔒 Sécurité et Permissions

#### Système de permissions amélioré

- **Ajouté** : Permissions spécifiques aux projets
- **Ajouté** : Vérification des permissions pour chaque action
- **Amélioré** : Gestion des rôles et permissions globales

#### Authentification renforcée

- **Amélioré** : Gestion des tokens JWT
- **Ajouté** : Rafraîchissement automatique des tokens
- **Corrigé** : Gestion des sessions expirées

### 🧪 Tests

#### Tests Postman disponibles

- Tests d'authentification (connexion, déconnexion, mot de passe oublié)
- Tests de gestion des rôles et permissions
- Tests de gestion des projets
- Tests de gestion des membres de projet
- Tests de gestion des permissions de projet
- Tests de validation des permissions
- Tests de gestion des erreurs

### 📝 Notes de Migration

#### Base de données

- **Migration** : Suppression de la table `roles_projet`
- **Impact** : Aucun impact sur les données existantes
- **Recommandation** : Utiliser les rôles du module `accounts`

#### Frontend

- **Mise à jour** : Configuration API pour les nouveaux endpoints
- **Ajout** : Services pour tous les nouveaux modules
- **Correction** : Utilisation des clés de configuration

### 🚨 Points d'attention

1. **Permissions de projet** : Les permissions sont maintenant spécifiques à chaque projet
2. **Rôles** : Utiliser les rôles du module `accounts` au lieu de créer des rôles de projet
3. **Tokens** : Les tokens sont maintenant gérés avec des clés configurables
4. **URLs** : Toutes les URLs d'API ont été standardisées avec le préfixe `/api`

### 🔄 Prochaines étapes

1. Tester tous les endpoints avec Postman
2. Vérifier la cohérence des permissions
3. Implémenter les interfaces utilisateur pour les nouvelles fonctionnalités
4. Ajouter des tests automatisés
5. Documenter les cas d'usage spécifiques
