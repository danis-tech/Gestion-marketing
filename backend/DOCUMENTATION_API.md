# 📚 Documentation API - Gestion Marketing

## 📋 Table des Matières

1. [Introduction](#introduction)
2. [Authentification](#authentification)
3. [Module Accounts](#module-accounts)
4. [Module Projects](#module-projects)
5. [Codes de Réponse](#codes-de-réponse)
6. [Exemples d'Utilisation](#exemples-dutilisation)

---

## 🚀 Introduction

### Informations Générales

- **URL de base** : `http://localhost:8000`
- **Version** : 1.0
- **Format** : JSON
- **Authentification** : JWT (JSON Web Tokens)

### Prérequis

- Serveur Django démarré sur `localhost:8000`
- Token d'authentification pour la plupart des endpoints
- Headers requis : `Content-Type: application/json`

---

## 🔐 Authentification

### Connexion

**Endpoint** : `POST /api/accounts/login/`

**Description** : Authentifier un utilisateur et obtenir des tokens d'accès.

**Headers** :

```
Content-Type: application/json
```

**Body** :

```json
{
	"email": "jacquesboussengui@gmail.com",
	"password": "12345678",
	"remember_me": false
}
```

**Réponse Succès (200)** :

```json
{
	"access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
	"refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
	"user": {
		"id": 1,
		"username": "danis",
		"email": "jacquesboussengui@gmail.com",
		"first_name": "Jacques",
		"last_name": "Boussengui",
		"prenom": "Jacques",
		"nom": "Boussengui",
		"role": {
			"id": 1,
			"code": "admin",
			"nom": "Administrateur"
		},
		"service": {
			"id": 1,
			"code": "marketing",
			"nom": "Marketing"
		}
	}
}
```

### Inscription

**Endpoint** : `POST /api/accounts/signup/`

**Description** : Créer un nouveau compte utilisateur.

**Body** :

```json
{
	"email": "nouveau@example.com",
	"password": "nouveaupass123",
	"username": "nouveauuser",
	"first_name": "Nouveau",
	"last_name": "Utilisateur",
	"prenom": "Nouveau",
	"nom": "Utilisateur"
}
```

**Réponse Succès (201)** :

```json
{
	"id": 2,
	"username": "nouveauuser",
	"email": "nouveau@example.com",
	"first_name": "Nouveau",
	"last_name": "Utilisateur",
	"prenom": "Nouveau",
	"nom": "Utilisateur",
	"role": null,
	"service": null,
	"date_joined": "2024-01-15T10:30:00Z"
}
```

### Profil Utilisateur

**Endpoint** : `GET /api/accounts/me/`

**Description** : Obtenir les informations du utilisateur connecté.

**Headers** :

```
Authorization: Bearer <access_token>
```

**Réponse Succès (200)** :

```json
{
	"id": 1,
	"username": "danis",
	"email": "jacquesboussengui@gmail.com",
	"first_name": "Jacques",
	"last_name": "Boussengui",
	"prenom": "Jacques",
	"nom": "Boussengui",
	"role": {
		"id": 1,
		"code": "admin",
		"nom": "Administrateur"
	},
	"service": {
		"id": 1,
		"code": "marketing",
		"nom": "Marketing"
	}
}
```

### Rafraîchir Token

**Endpoint** : `POST /api/accounts/refresh/`

**Description** : Obtenir un nouveau token d'accès avec le token de rafraîchissement.

**Body** :

```json
{
	"refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Réponse Succès (200)** :

```json
{
	"access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Déconnexion

**Endpoint** : `POST /api/accounts/logout/`

**Description** : Invalider le token de rafraîchissement.

**Headers** :

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body** :

```json
{
	"refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Réponse Succès (200)** :

```json
{
	"message": "Token de rafraîchissement invalidé avec succès"
}
```

### Demande de Réinitialisation de Mot de Passe

**Endpoint** : `POST /api/accounts/password-reset-request/`

**Description** : Envoyer un email de réinitialisation de mot de passe.

**Body** :

```json
{
	"email": "jacquesboussengui@gmail.com"
}
```

**Réponse Succès (200)** :

```json
{
	"message": "Un email de réinitialisation a été envoyé à votre adresse email"
}
```

---

## 👥 Module Accounts

### Gestion des Utilisateurs

#### Liste des Utilisateurs

**Endpoint** : `GET /api/accounts/users/`

**Headers** :

```
Authorization: Bearer <access_token>
```

**Réponse Succès (200)** :

```json
{
	"count": 2,
	"next": null,
	"previous": null,
	"results": [
		{
			"id": 1,
			"username": "danis",
			"email": "jacquesboussengui@gmail.com",
			"first_name": "Jacques",
			"last_name": "Boussengui",
			"prenom": "Jacques",
			"nom": "Boussengui",
			"role": {
				"id": 1,
				"code": "admin",
				"nom": "Administrateur"
			},
			"service": {
				"id": 1,
				"code": "marketing",
				"nom": "Marketing"
			}
		}
	]
}
```

#### Créer un Utilisateur

**Endpoint** : `POST /api/accounts/users/`

**Headers** :

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body** :

```json
{
	"email": "test@example.com",
	"password": "testpass123",
	"username": "testuser",
	"first_name": "Test",
	"last_name": "User",
	"prenom": "Test",
	"nom": "User",
	"role": 1,
	"service": 1
}
```

**Réponse Succès (201)** :

```json
{
	"id": 3,
	"username": "testuser",
	"email": "test@example.com",
	"first_name": "Test",
	"last_name": "User",
	"prenom": "Test",
	"nom": "User",
	"role": {
		"id": 1,
		"code": "admin",
		"nom": "Administrateur"
	},
	"service": {
		"id": 1,
		"code": "marketing",
		"nom": "Marketing"
	}
}
```

### Gestion des Rôles

#### Liste des Rôles

**Endpoint** : `GET /api/accounts/roles/`

**Réponse Succès (200)** :

```json
{
	"count": 3,
	"next": null,
	"previous": null,
	"results": [
		{
			"id": 1,
			"code": "admin",
			"nom": "Administrateur"
		},
		{
			"id": 2,
			"code": "marketing",
			"nom": "Marketing"
		},
		{
			"id": 3,
			"code": "dsi",
			"nom": "Direction des Systèmes d'Information"
		}
	]
}
```

#### Créer un Rôle

**Endpoint** : `POST /api/accounts/roles/`

**Body** :

```json
{
	"code": "finance",
	"nom": "Direction Financière"
}
```

**Réponse Succès (201)** :

```json
{
	"id": 4,
	"code": "finance",
	"nom": "Direction Financière"
}
```

#### Permissions d'un Rôle

**Endpoint** : `GET /api/accounts/roles/{id}/permissions/`

**Réponse Succès (200)** :

```json
[
	{
		"id": 1,
		"code": "projets:creer",
		"description": "Créer des projets"
	},
	{
		"id": 2,
		"code": "projets:modifier",
		"description": "Modifier des projets"
	}
]
```

### Gestion des Permissions

#### Liste des Permissions

**Endpoint** : `GET /api/accounts/permissions/`

**Réponse Succès (200)** :

```json
{
	"count": 10,
	"next": null,
	"previous": null,
	"results": [
		{
			"id": 1,
			"code": "projets:creer",
			"description": "Créer des projets"
		},
		{
			"id": 2,
			"code": "projets:modifier",
			"description": "Modifier des projets"
		},
		{
			"id": 3,
			"code": "projets:supprimer",
			"description": "Supprimer des projets"
		}
	]
}
```

### Gestion des Services

#### Liste des Services

**Endpoint** : `GET /api/accounts/services/`

**Réponse Succès (200)** :

```json
{
	"count": 4,
	"next": null,
	"previous": null,
	"results": [
		{
			"id": 1,
			"code": "marketing",
			"nom": "Marketing"
		},
		{
			"id": 2,
			"code": "dsi",
			"nom": "Direction des Systèmes d'Information"
		},
		{
			"id": 3,
			"code": "finance",
			"nom": "Direction Financière"
		}
	]
}
```

---

## 📋 Module Projects

### Gestion des Projets

#### Liste des Projets

**Endpoint** : `GET /api/projects/`

**Headers** :

```
Authorization: Bearer <access_token>
```

**Réponse Succès (200)** :

```json
{
	"count": 2,
	"next": null,
	"previous": null,
	"results": [
		{
			"id": 1,
			"code": "PROJ001",
			"nom": "Nouvelle Offre Mobile",
			"description": "Développement d'une nouvelle offre mobile",
			"objectif": "Augmenter la part de marché mobile",
			"budget": "50000000",
			"type": "offre_mobile",
			"statut": "en_attente",
			"priorite": "haut",
			"etat": "On",
			"proprietaire": {
				"id": 1,
				"username": "danis",
				"first_name": "Jacques",
				"last_name": "Boussengui"
			},
			"cree_le": "2024-01-01T00:00:00Z",
			"debut": "2024-02-01T00:00:00Z",
			"fin": "2024-06-01T00:00:00Z",
			"estimation_jours": 120
		}
	]
}
```

#### Créer un Projet

**Endpoint** : `POST /api/projects/`

**Body** :

```json
{
	"code": "PROJ003",
	"nom": "Projet de Test",
	"description": "Description du projet de test",
	"objectif": "Objectif du projet de test",
	"budget": "10000000",
	"type": "offre_mobile",
	"statut": "en_attente",
	"priorite": "haut",
	"debut": "2024-02-01T00:00:00Z",
	"fin": "2024-05-01T00:00:00Z"
}
```

**Réponse Succès (201)** :

```json
{
	"id": 3,
	"code": "PROJ003",
	"nom": "Projet de Test",
	"description": "Description du projet de test",
	"objectif": "Objectif du projet de test",
	"budget": "10000000",
	"type": "offre_mobile",
	"statut": "en_attente",
	"priorite": "haut",
	"etat": "On",
	"proprietaire": {
		"id": 1,
		"username": "danis",
		"first_name": "Jacques",
		"last_name": "Boussengui"
	},
	"cree_le": "2024-01-15T12:00:00Z",
	"debut": "2024-02-01T00:00:00Z",
	"fin": "2024-05-01T00:00:00Z",
	"estimation_jours": 90
}
```

#### Mettre à jour le Statut

**Endpoint** : `PATCH /api/projects/{id}/update_statut/`

**Body** :

```json
{
	"statut": "termine"
}
```

**Réponse Succès (200)** :

```json
{
	"message": "Statut mis à jour de en_attente vers termine",
	"projet": {
		"id": 1,
		"code": "PROJ001",
		"nom": "Nouvelle Offre Mobile",
		"statut": "termine",
		"mis_a_jour_le": "2024-01-15T13:00:00Z"
	}
}
```

#### Statistiques des Projets

**Endpoint** : `GET /api/projects/stats/`

**Réponse Succès (200)** :

```json
{
	"total_projets": 3,
	"projets_par_statut": {
		"en_attente": 1,
		"termine": 2
	},
	"projets_par_priorite": {
		"haut": 1,
		"moyen": 2
	},
	"projets_par_type": {
		"offre_mobile": 2,
		"campagne_marketing": 1
	}
}
```

### Gestion des Membres de Projet

#### Liste des Membres

**Endpoint** : `GET /api/projects/{projet_id}/membres/`

**Réponse Succès (200)** :

```json
{
	"count": 2,
	"next": null,
	"previous": null,
	"results": [
		{
			"id": 1,
			"utilisateur": {
				"id": 2,
				"username": "nouveauuser",
				"first_name": "Nouveau",
				"last_name": "Utilisateur"
			},
			"service": {
				"id": 1,
				"code": "marketing",
				"nom": "Marketing"
			},
			"role_projet": "contributeur",
			"ajoute_le": "2024-01-10T00:00:00Z"
		}
	]
}
```

#### Ajouter un Membre

**Endpoint** : `POST /api/projects/{projet_id}/membres/`

**Body** :

```json
{
	"utilisateur": 3,
	"service": 2,
	"role_projet": "contributeur"
}
```

**Réponse Succès (201)** :

```json
{
	"id": 3,
	"utilisateur": {
		"id": 3,
		"username": "testuser",
		"first_name": "Test",
		"last_name": "User"
	},
	"service": {
		"id": 2,
		"code": "dsi",
		"nom": "Direction des Systèmes d'Information"
	},
	"role_projet": "contributeur",
	"ajoute_le": "2024-01-15T14:00:00Z"
}
```

### Gestion des Permissions de Projet

#### Liste des Permissions

**Endpoint** : `GET /api/projects/{projet_id}/permissions/`

**Réponse Succès (200)** :

```json
{
	"count": 2,
	"next": null,
	"previous": null,
	"results": [
		{
			"id": 1,
			"utilisateur": {
				"id": 2,
				"username": "nouveauuser",
				"first_name": "Nouveau",
				"last_name": "Utilisateur"
			},
			"permission": "valider",
			"active": true,
			"accordee_par": {
				"id": 1,
				"username": "danis",
				"first_name": "Jacques",
				"last_name": "Boussengui"
			},
			"accordee_le": "2024-01-10T00:00:00Z"
		}
	]
}
```

#### Accorder Plusieurs Permissions

**Endpoint** : `POST /api/projects/{projet_id}/permissions/accorder-multiple/`

**Body** :

```json
{
	"utilisateur": 3,
	"permissions": ["valider", "modifier", "supprimer"],
	"active": true
}
```

**Réponse Succès (200)** :

```json
{
	"message": "3 permissions accordées avec succès",
	"permissions_accordees": [
		{
			"id": 4,
			"utilisateur": {
				"id": 3,
				"username": "testuser",
				"first_name": "Test",
				"last_name": "User"
			},
			"permission": "valider",
			"active": true
		}
	]
}
```

### Gestion de l'Historique

#### Liste de l'Historique

**Endpoint** : `GET /api/projects/{projet_id}/historiques/`

**Réponse Succès (200)** :

```json
{
	"count": 3,
	"next": null,
	"previous": null,
	"results": [
		{
			"id": 1,
			"projet": 1,
			"de_etat": "en_attente",
			"vers_etat": "en_cours",
			"par_utilisateur": {
				"id": 1,
				"username": "danis",
				"first_name": "Jacques",
				"last_name": "Boussengui"
			},
			"effectue_le": "2024-01-05T00:00:00Z"
		}
	]
}
```

---

## 📊 Codes de Réponse

### Codes de Succès

- **200 OK** : Requête réussie
- **201 Created** : Ressource créée avec succès
- **204 No Content** : Requête réussie, pas de contenu à retourner

### Codes d'Erreur Client

- **400 Bad Request** : Requête malformée
- **401 Unauthorized** : Authentification requise
- **403 Forbidden** : Permission refusée
- **404 Not Found** : Ressource non trouvée
- **405 Method Not Allowed** : Méthode HTTP non autorisée
- **409 Conflict** : Conflit de données (ex: contrainte unique)

### Exemples d'Erreurs

#### Erreur d'Authentification (401)

```json
{
	"detail": "Les informations d'identification n'ont pas été fournies."
}
```

#### Erreur de Permission (403)

```json
{
	"detail": "Vous n'avez pas la permission d'effectuer cette action."
}
```

#### Erreur de Validation (400)

```json
{
	"email": ["Ce champ est requis."],
	"password": [
		"Ce mot de passe est trop court. Il doit contenir au moins 8 caractères."
	]
}
```

---

## 🚀 Exemples d'Utilisation

### Workflow Complet : Création et Gestion d'un Projet

#### 1. Connexion

```bash
curl -X POST http://localhost:8000/api/accounts/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jacquesboussengui@gmail.com",
    "password": "12345678",
    "remember_me": false
  }'
```

#### 2. Créer un Projet

```bash
curl -X POST http://localhost:8000/api/projects/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "PROJ004",
    "nom": "Nouveau Projet Marketing",
    "description": "Campagne marketing pour le lancement d'un nouveau produit",
    "objectif": "Augmenter les ventes de 30%",
    "budget": "75000000",
    "type": "campagne_marketing",
    "statut": "en_attente",
    "priorite": "haut",
    "debut": "2024-03-01T00:00:00Z",
    "fin": "2024-08-01T00:00:00Z"
  }'
```

#### 3. Ajouter des Membres

```bash
curl -X POST http://localhost:8000/api/projects/4/membres/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "utilisateur": 2,
    "service": 1,
    "role_projet": "chef_projet"
  }'
```

#### 4. Accorder des Permissions

```bash
curl -X POST http://localhost:8000/api/projects/4/permissions/accorder-multiple/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "utilisateur": 2,
    "permissions": ["valider", "modifier"],
    "active": true
  }'
```

#### 5. Mettre à jour le Statut

```bash
curl -X PATCH http://localhost:8000/api/projects/4/update_statut/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "statut": "en_cours"
  }'
```

---

## 📋 Module Taches

### Endpoints Principaux

#### Liste des Tâches

**Endpoint** : `GET /api/taches/`

**Description** : Récupérer la liste des tâches accessibles à l'utilisateur.

**Headers** :

```
Authorization: Bearer <access_token>
```

**Paramètres de requête** :

- `statut` : Filtrer par statut (termine, en_attente, hors_delai, rejete)
- `priorite` : Filtrer par priorité (haut, moyen, intermediaire, bas)
- `phase` : Filtrer par phase (conception, build, uat, lancement, suivi, fin_de_vie)
- `projet` : Filtrer par projet (ID du projet)

**Réponse Succès (200)** :

```json
[
	{
		"id": 1,
		"projet": "PROJ001",
		"titre": "Conception de la maquette",
		"statut": "en_attente",
		"statut_display": "En attente",
		"priorite": "haut",
		"priorite_display": "Haute",
		"phase": "conception",
		"phase_display": "Conception",
		"debut": "2024-01-15",
		"fin": "2024-01-20",
		"nbr_jour_estimation": 5,
		"assigne_a": {
			"id": 2,
			"username": "marie.dubois",
			"email": "marie.dubois@example.com",
			"prenom": "Marie",
			"nom": "Dubois"
		},
		"tache_dependante": "Analyse des besoins",
		"cree_le": "2024-01-15T10:30:00Z",
		"est_en_retard": false,
		"progression": 0
	}
]
```

#### Créer une Tâche

**Endpoint** : `POST /api/taches/`

**Description** : Créer une nouvelle tâche.

**Body** :

```json
{
	"projet": 1,
	"titre": "Développement du site web",
	"statut": "en_attente",
	"priorite": "haut",
	"phase": "build",
	"debut": "2024-01-20",
	"fin": "2024-02-15",
	"assigne_a": 2,
	"tache_dependante": null
}
```

**Réponse Succès (201)** :

```json
{
	"id": 2,
	"projet": "PROJ001",
	"titre": "Développement du site web",
	"statut": "en_attente",
	"statut_display": "En attente",
	"priorite": "haut",
	"priorite_display": "Haute",
	"phase": "build",
	"phase_display": "Build",
	"debut": "2024-01-20",
	"fin": "2024-02-15",
	"nbr_jour_estimation": 26,
	"assigne_a": {
		"id": 2,
		"username": "marie.dubois",
		"email": "marie.dubois@example.com",
		"prenom": "Marie",
		"nom": "Dubois"
	},
	"tache_dependante": null,
	"cree_le": "2024-01-15T14:30:00Z",
	"est_en_retard": false,
	"progression": 0
}
```

#### Détails d'une Tâche

**Endpoint** : `GET /api/taches/{id}/`

**Description** : Récupérer les détails complets d'une tâche.

**Réponse Succès (200)** :

```json
{
	"id": 1,
	"projet": "PROJ001",
	"titre": "Conception de la maquette",
	"statut": "en_attente",
	"statut_display": "En attente",
	"priorite": "haut",
	"priorite_display": "Haute",
	"phase": "conception",
	"phase_display": "Conception",
	"debut": "2024-01-15",
	"fin": "2024-01-20",
	"nbr_jour_estimation": 5,
	"assigne_a": {
		"id": 2,
		"username": "marie.dubois",
		"email": "marie.dubois@example.com",
		"prenom": "Marie",
		"nom": "Dubois"
	},
	"tache_dependante": {
		"id": 3,
		"projet": "PROJ001",
		"titre": "Analyse des besoins",
		"statut": "termine",
		"statut_display": "Terminé",
		"priorite": "haut",
		"priorite_display": "Haute",
		"phase": "conception",
		"phase_display": "Conception",
		"debut": "2024-01-10",
		"fin": "2024-01-14",
		"nbr_jour_estimation": 4,
		"assigne_a": {
			"id": 1,
			"username": "danis",
			"email": "jacquesboussengui@gmail.com",
			"prenom": "Jacques",
			"nom": "Boussengui"
		},
		"tache_dependante": null,
		"cree_le": "2024-01-10T09:00:00Z",
		"est_en_retard": false,
		"progression": 100
	},
	"taches_dependantes": [
		{
			"id": 4,
			"projet": "PROJ001",
			"titre": "Tests utilisateurs",
			"statut": "en_attente",
			"statut_display": "En attente",
			"priorite": "moyen",
			"priorite_display": "Moyenne",
			"phase": "uat",
			"phase_display": "UAT",
			"debut": "2024-01-21",
			"fin": "2024-01-25",
			"nbr_jour_estimation": 4,
			"assigne_a": {
				"id": 3,
				"username": "pierre.martin",
				"email": "pierre.martin@example.com",
				"prenom": "Pierre",
				"nom": "Martin"
			},
			"tache_dependante": "Conception de la maquette",
			"cree_le": "2024-01-15T16:00:00Z",
			"est_en_retard": false,
			"progression": 0
		}
	],
	"cree_le": "2024-01-15T10:30:00Z",
	"mise_a_jour_le": "2024-01-15T10:30:00Z",
	"est_en_retard": false,
	"progression": 0
}
```

#### Modifier une Tâche

**Endpoint** : `PUT /api/taches/{id}/`

**Description** : Modifier une tâche existante.

**Body** :

```json
{
	"projet": 1,
	"titre": "Conception de la maquette - Version 2",
	"statut": "en_attente",
	"priorite": "haut",
	"phase": "conception",
	"debut": "2024-01-15",
	"fin": "2024-01-22",
	"assigne_a": 2,
	"tache_dependante": 3
}
```

#### Mettre à jour le Statut

**Endpoint** : `PATCH /api/taches/{id}/update_statut/`

**Description** : Mettre à jour uniquement le statut d'une tâche.

**Body** :

```json
{
	"statut": "termine"
}
```

**Réponse Succès (200)** :

```json
{
	"message": "Statut mis à jour de en_attente vers termine",
	"tache": {
		"id": 1,
		"projet": "PROJ001",
		"titre": "Conception de la maquette",
		"statut": "termine",
		"statut_display": "Terminé",
		"priorite": "haut",
		"priorite_display": "Haute",
		"phase": "conception",
		"phase_display": "Conception",
		"debut": "2024-01-15",
		"fin": "2024-01-20",
		"nbr_jour_estimation": 5,
		"assigne_a": {
			"id": 2,
			"username": "marie.dubois",
			"email": "marie.dubois@example.com",
			"prenom": "Marie",
			"nom": "Dubois"
		},
		"tache_dependante": {
			"id": 3,
			"projet": "PROJ001",
			"titre": "Analyse des besoins",
			"statut": "termine",
			"statut_display": "Terminé",
			"priorite": "haut",
			"priorite_display": "Haute",
			"phase": "conception",
			"phase_display": "Conception",
			"debut": "2024-01-10",
			"fin": "2024-01-14",
			"nbr_jour_estimation": 4,
			"assigne_a": {
				"id": 1,
				"username": "danis",
				"email": "jacquesboussengui@gmail.com",
				"prenom": "Jacques",
				"nom": "Boussengui"
			},
			"tache_dependante": null,
			"cree_le": "2024-01-10T09:00:00Z",
			"est_en_retard": false,
			"progression": 100
		},
		"taches_dependantes": [],
		"cree_le": "2024-01-15T10:30:00Z",
		"mise_a_jour_le": "2024-01-15T16:30:00Z",
		"est_en_retard": false,
		"progression": 100
	}
}
```

### Endpoints Spécialisés

#### Tâches d'un Projet

**Endpoint** : `GET /api/taches/projet_taches/?projet_id={id}`

**Description** : Récupérer toutes les tâches d'un projet spécifique.

**Paramètres** :

- `projet_id` : ID du projet (obligatoire)

#### Mes Tâches

**Endpoint** : `GET /api/taches/mes_taches/`

**Description** : Récupérer les tâches assignées à l'utilisateur connecté.

**Paramètres de requête** :

- `statut` : Filtrer par statut
- `priorite` : Filtrer par priorité
- `phase` : Filtrer par phase

#### Tâches en Retard

**Endpoint** : `GET /api/taches/en_retard/`

**Description** : Récupérer toutes les tâches en retard.

#### Statistiques des Tâches

**Endpoint** : `GET /api/taches/stats/`

**Description** : Obtenir les statistiques des tâches.

**Réponse Succès (200)** :

```json
{
	"total_taches": 25,
	"taches_terminees": 15,
	"taches_en_retard": 3,
	"taux_completion": 60.0,
	"par_statut": {
		"termine": 15,
		"en_attente": 8,
		"hors_delai": 2,
		"rejete": 0
	},
	"par_priorite": {
		"haut": 10,
		"moyen": 8,
		"intermediaire": 5,
		"bas": 2
	},
	"par_phase": {
		"conception": 8,
		"build": 6,
		"uat": 4,
		"lancement": 3,
		"suivi": 2,
		"fin_de_vie": 2
	}
}
```

### Codes de Réponse

| Code | Description                               |
| ---- | ----------------------------------------- |
| 200  | Succès - Opération réussie                |
| 201  | Créé - Tâche créée avec succès            |
| 400  | Erreur de validation - Données invalides  |
| 401  | Non autorisé - Token invalide ou manquant |
| 403  | Interdit - Permissions insuffisantes      |
| 404  | Non trouvé - Tâche inexistante            |
| 500  | Erreur serveur - Problème interne         |

---

## �� Notes Importantes

### Authentification

- Tous les endpoints (sauf login, signup, password-reset) nécessitent un token JWT
- Le token doit être inclus dans le header : `Authorization: Bearer <token>`
- Les tokens expirent après 60 minutes
- Utilisez le endpoint de refresh pour obtenir un nouveau token

### Permissions

- Les projets sont automatiquement filtrés selon les permissions de l'utilisateur
- Seuls les propriétaires et les utilisateurs avec permissions peuvent voir/modifier les projets
- Les superusers ont accès à tous les projets

### Validation des Données

- Tous les champs requis doivent être fournis
- Les emails doivent être uniques
- Les mots de passe doivent contenir au moins 8 caractères
- Les codes de projet doivent être uniques

### Pagination

- Les listes sont paginées par défaut (20 éléments par page)
- Utilisez les paramètres `?page=2` pour naviguer
- Les réponses incluent `count`, `next`, et `previous`

---

## 🔧 Support

Pour toute question ou problème :

- Vérifiez que le serveur Django est démarré
- Vérifiez que votre token d'authentification est valide
- Consultez les logs du serveur pour plus de détails sur les erreurs
- Assurez-vous que les données envoyées respectent le format attendu

---

_Documentation générée le : 15 janvier 2024_
_Version API : 1.0_
