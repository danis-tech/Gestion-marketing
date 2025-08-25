# Configuration Centralisée

Ce projet utilise une configuration centralisée pour faciliter la maintenance et les déploiements.

## 📁 Structure des fichiers de configuration

```
├── frontend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── api.js          # Configuration des endpoints API
│   │   │   └── environment.js  # Variables d'environnement
│   │   ├── services/
│   │   │   └── apiService.js   # Service API centralisé
│   │   ├── hooks/
│   │   │   └── useTheme.js     # Hook personnalisé pour la gestion des thèmes
│   │   ├── utils/
│   │   │   └── themeInit.js    # Utilitaires d'initialisation des thèmes
│   │   ├── styles/
│   │   │   ├── themes.css      # Variables CSS pour les thèmes
│   │   │   └── variables.css   # Variables CSS globales
│   │   ├── components/
│   │   │   ├── layout/         # Composants de mise en page
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Sidebar.css
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   └── Dashboard.css
│   │   │   ├── ui/             # Composants d'interface utilisateur
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Button.css
│   │   │   │   ├── LoadingSpinner.jsx
│   │   │   │   ├── LoadingSpinner.css
│   │   │   │   ├── ThemeToggle.jsx
│   │   │   │   └── ThemeToggle.css
│   │   │   ├── modals/         # Composants modaux
│   │   │   │   ├── LoginModal.jsx
│   │   │   │   ├── LoginModal.css
│   │   │   │   ├── NotificationModal.jsx
│   │   │   │   └── NotificationModal.css
│   │   │   └── pages/          # Composants de pages
│   │   │       ├── DashboardHome.jsx
│   │   │       ├── DashboardHome.css
│   │   │       ├── PasswordResetPage.jsx
│   │   │       └── PasswordResetPage.css
│   │   └── assets/
│   │       └── img/
│   │           └── logo.png
│   └── .env                    # Variables d'environnement frontend
├── backend/
│   ├── config/
│   │   └── settings.py         # Configuration Django centralisée
│   └── .env                    # Variables d'environnement backend
├── start-maildev.bat           # Script pour démarrer MailDev
├── start-maildev.ps1           # Script PowerShell pour MailDev
└── CONFIGURATION.md            # Ce fichier
```

## 🎨 Système de Thèmes

### Configuration des thèmes

Le projet utilise un système de thèmes basé sur les variables CSS avec deux thèmes disponibles :

- **Thème sombre** (par défaut) : Interface sombre avec accents bleus
- **Thème clair** : Interface claire avec sidebar bleue et texte blanc

### Fichiers de configuration des thèmes

#### `frontend/src/styles/themes.css`

Définit toutes les variables CSS pour les deux thèmes :

```css
:root {
	/* Thème sombre */
	--theme-dark-primary: #1e3a8a;
	--theme-dark-secondary: #1e40af;
	--theme-dark-text: #ffffff;
	/* ... autres variables */

	/* Thème clair */
	--theme-light-primary: #1e40af;
	--theme-light-secondary: #1e40af;
	--theme-light-text: #ffffff;
	/* ... autres variables */
}
```

#### `frontend/src/hooks/useTheme.js`

Hook React personnalisé pour la gestion des thèmes :

```javascript
const useTheme = () => {
	const [theme, setTheme] = useState("dark");

	const toggleTheme = () => {
		const newTheme = theme === "dark" ? "light" : "dark";
		setTheme(newTheme);
		document.documentElement.setAttribute("data-theme", newTheme);
		localStorage.setItem("theme", newTheme);
	};

	return {
		theme,
		toggleTheme,
		isDark: theme === "dark",
		isLight: theme === "light",
	};
};
```

#### `frontend/src/utils/themeInit.js`

Utilitaires pour l'initialisation des thèmes :

```javascript
export const initializeTheme = () => {
	const savedTheme = localStorage.getItem("theme") || "dark";
	document.documentElement.setAttribute("data-theme", savedTheme);
	document.documentElement.classList.add("theme-loaded");
	return savedTheme;
};
```

### Utilisation dans les composants

```javascript
import useTheme from "../../hooks/useTheme";

const MyComponent = () => {
	const { theme, toggleTheme, isDark } = useTheme();

	return (
		<button onClick={toggleTheme}>
			{isDark ? "Mode clair" : "Mode sombre"}
		</button>
	);
};
```

## 📁 Organisation des Composants Frontend

### Structure par catégories

Les composants frontend sont organisés en dossiers logiques pour une meilleure maintenabilité :

#### `layout/` - Composants de mise en page

- **Sidebar.jsx/css** : Barre latérale avec navigation et sélecteur de thème
- **Dashboard.jsx/css** : Layout principal du tableau de bord

#### `ui/` - Composants d'interface utilisateur

- **Button.jsx/css** : Boutons personnalisables
- **LoadingSpinner.jsx/css** : Indicateur de chargement
- **ThemeToggle.jsx/css** : Sélecteur de thème

#### `modals/` - Composants modaux

- **LoginModal.jsx/css** : Modal de connexion et réinitialisation de mot de passe
- **NotificationModal.jsx/css** : Modal de notifications

#### `pages/` - Composants de pages

- **DashboardHome.jsx/css** : Page d'accueil du tableau de bord
- **PasswordResetPage.jsx/css** : Page de confirmation de réinitialisation

### Mise à jour des imports

Tous les imports ont été mis à jour pour refléter la nouvelle structure :

```javascript
// Avant
import Sidebar from "../components/Sidebar";
import Button from "../components/Button";

// Après
import Sidebar from "../components/layout/Sidebar";
import Button from "../components/ui/Button";
```

### Avantages de cette organisation

- **Maintenabilité** : Composants regroupés par fonction
- **Scalabilité** : Facilite l'ajout de nouveaux composants
- **Lisibilité** : Structure claire et intuitive
- **Réutilisabilité** : Séparation claire entre layout, UI et pages

## 🔧 Configuration Frontend

### Variables d'environnement (.env)

```env
# Configuration de l'API
VITE_API_URL=http://localhost:8000

# Configuration de l'application
VITE_APP_NAME=Gestion Marketing
VITE_APP_VERSION=1.0.0

# Fonctionnalités
VITE_DEBUG_MODE=true
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_NOTIFICATIONS=true
```

### Utilisation dans le code

```javascript
import { API_ENDPOINTS } from "../config/api";
import { getConfig } from "../config/environment";
import { authService } from "../services/apiService";

// Utiliser un endpoint
const loginData = await authService.login(credentials);

// Obtenir une configuration
const apiUrl = getConfig("API_URL");
const debugMode = getConfig("FEATURES.DEBUG_MODE");
```

## 🔧 Configuration Backend

### Variables d'environnement (.env)

```env
# Environnement
ENVIRONMENT=development
SECRET_KEY=your-secret-key-here

# Base de données
DB_NAME=gestion_bd
DB_USER=root
DB_PASSWORD=your-password
DB_HOST=127.0.0.1
DB_PORT=3306

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Email (Production)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@gestion-marketing.com

# Hôtes autorisés
ALLOWED_HOSTS=127.0.0.1,localhost
```

### Utilisation dans le code Django

```python
from config.settings import DATABASE_CONFIG, EMAIL_CONFIG, JWT_CONFIG

# Les configurations sont automatiquement appliquées
```

## 📧 Configuration Email avec MailDev

### Installation de MailDev

```bash
npm install -g maildev
```

### Démarrage de MailDev

**Option 1 - Script batch :**

```bash
start-maildev.bat
```

**Option 2 - Script PowerShell :**

```powershell
.\start-maildev.ps1
```

**Option 3 - Commande directe :**

```bash
maildev
```

### Accès à l'interface MailDev

- **Interface web** : http://localhost:1080
- **Port SMTP** : 1025

### Configuration Django pour MailDev

La configuration est déjà prête dans `settings.py` :

```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'localhost'
EMAIL_PORT = 1025
EMAIL_USE_TLS = False
EMAIL_USE_SSL = False
DEFAULT_FROM_EMAIL = 'noreply@gestion-marketing.com'
```

### Test des emails

1. **Démarrer MailDev** : `maildev`
2. **Démarrer Django** : `python manage.py runserver`
3. **Demander une réinitialisation** dans l'interface
4. **Vérifier MailDev** : http://localhost:1080

## 🚀 Avantages de cette approche

### ✅ **Maintenance facilitée**

- Toutes les URLs sont centralisées dans un seul fichier
- Variables d'environnement organisées et documentées
- Configuration par environnement (dev/prod)

### ✅ **Déploiement simplifié**

- Changement d'URL d'API en un seul endroit
- Configuration automatique selon l'environnement
- Pas de hardcoding d'URLs

### ✅ **Développement amélioré**

- Services API réutilisables
- Gestion automatique des tokens
- Intercepteurs pour logging et gestion d'erreurs
- **MailDev pour tester les emails en développement**

### ✅ **Sécurité renforcée**

- Variables sensibles dans les fichiers .env
- Configuration de sécurité par environnement
- Gestion automatique des CORS

## 📋 Liste des endpoints disponibles

### Authentification

- `POST /api/accounts/login/` - Connexion
- `POST /api/accounts/signup/` - Inscription
- `POST /api/accounts/refresh/` - Rafraîchir token
- `POST /api/accounts/logout/` - Déconnexion
- `GET /api/accounts/me/` - Profil utilisateur
- `POST /api/accounts/password-reset-request/` - Demande réinitialisation
- `POST /api/accounts/password-reset-confirm/` - Confirmation réinitialisation

### Utilisateurs

- `GET /api/accounts/users/` - Liste utilisateurs
- `GET /api/accounts/users/{id}/` - Détails utilisateur
- `POST /api/accounts/users/` - Créer utilisateur
- `PUT /api/accounts/users/{id}/` - Modifier utilisateur
- `DELETE /api/accounts/users/{id}/` - Supprimer utilisateur
- `POST /api/accounts/users/{id}/set_password/` - Changer mot de passe

### Rôles et Permissions

- `GET /api/accounts/roles/` - Liste rôles
- `GET /api/accounts/permissions/` - Liste permissions
- `GET /api/accounts/services/` - Liste services
- `GET /api/accounts/role-permissions/` - Liste rôles-permissions

## 🔄 Migration vers la nouvelle configuration

### Frontend

1. Remplacer les appels axios directs par les services
2. Utiliser `getConfig()` pour les variables d'environnement
3. Utiliser `API_ENDPOINTS` pour les URLs

### Backend

1. Utiliser les configurations centralisées
2. Ajouter les variables d'environnement dans `.env`
3. Tester la configuration par environnement

## 🛠️ Ajout de nouveaux endpoints

### 1. Ajouter l'endpoint dans `frontend/src/config/api.js`

```javascript
// Dans API_CONFIG
NEW_FEATURE: {
  LIST: '/accounts/new-feature/',
  DETAIL: (id) => `/accounts/new-feature/${id}/`,
},

// Dans API_ENDPOINTS
NEW_FEATURE_LIST: buildApiUrl(API_CONFIG.NEW_FEATURE.LIST),
NEW_FEATURE_DETAIL: (id) => buildApiUrl(API_CONFIG.NEW_FEATURE.DETAIL(id)),
```

### 2. Ajouter le service dans `frontend/src/services/apiService.js`

```javascript
export const newFeatureService = {
	getNewFeatures: async () => {
		const response = await apiClient.get(API_ENDPOINTS.NEW_FEATURE_LIST);
		return response.data;
	},

	getNewFeature: async (id) => {
		const response = await apiClient.get(API_ENDPOINTS.NEW_FEATURE_DETAIL(id));
		return response.data;
	},
};
```

### 3. Utiliser le service dans les composants

```javascript
import { newFeatureService } from "../services/apiService";

const data = await newFeatureService.getNewFeatures();
```

Cette approche garantit une maintenance facile et une évolution sereine du projet ! 🎉
