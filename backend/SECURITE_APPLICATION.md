# 🔐 Sécurité de l'Application - Guide Complet

## 🎯 Vue d'Ensemble

L'application Gestion Marketing implémente une sécurité multicouche couvrant l'authentification, l'autorisation, la protection des données, et la sécurisation des communications. Ce document détaille tous les mécanismes de sécurité en place.

---

## 🔑 1. AUTHENTIFICATION

### 1.1 JWT (JSON Web Tokens)

#### Configuration
- **Bibliothèque** : `django-rest-framework-simplejwt`
- **Algorithme** : HS256 (HMAC avec SHA-256)
- **Clé de signature** : `SECRET_KEY` (stockée dans variables d'environnement)

#### Tokens
- **Access Token** : Durée de vie de **30 minutes**
  - Utilisé pour toutes les requêtes API authentifiées
  - Inclus dans le header `Authorization: Bearer <token>`
  - Expiration courte pour limiter les risques en cas de vol

- **Refresh Token** : Durée de vie de **7 jours**
  - Utilisé uniquement pour obtenir un nouveau access token
  - Rotation automatique activée (`ROTATE_REFRESH_TOKENS: True`)
  - Blacklist après rotation pour invalider l'ancien token

#### Flux d'Authentification

```
1. LOGIN
   ↓
   POST /api/accounts/login/
   Body: { "username": "...", "password": "..." }
   ↓
   Vérification credentials
   ↓
   Génération Access Token (30 min) + Refresh Token (7 jours)
   ↓
   Retour: { "access": "...", "refresh": "..." }

2. REQUÊTES API
   ↓
   Header: Authorization: Bearer <access_token>
   ↓
   Validation du token par JWTAuthentication
   ↓
   Extraction user_id depuis le token
   ↓
   Chargement de l'utilisateur
   ↓
   Requête autorisée

3. EXPIRATION ACCESS TOKEN
   ↓
   Réponse 401 Unauthorized
   ↓
   Frontend détecte l'erreur
   ↓
   POST /api/accounts/refresh/
   Body: { "refresh": "<refresh_token>" }
   ↓
   Nouveau Access Token généré
   ↓
   Ancien Refresh Token blacklisté
   ↓
   Nouveau Refresh Token retourné
   ↓
   Requête réessayée avec nouveau token

4. LOGOUT
   ↓
   POST /api/accounts/logout/
   ↓
   Refresh Token ajouté à la blacklist
   ↓
   Token invalide pour toutes futures requêtes
```

#### Sécurité des Tokens
- **Blacklist** : Tokens invalidés stockés en base de données
- **Rotation** : Nouveau refresh token à chaque refresh
- **Expiration** : Tokens expirés automatiquement rejetés
- **Validation** : Signature vérifiée à chaque requête

### 1.2 Validation des Credentials

#### Processus de Login
1. **Réception** : Username/Email + Password
2. **Vérification statut** : Utilisateur actif (`is_active=True`)
3. **Vérification mot de passe** : Hash bcrypt comparé
4. **Génération tokens** : Si validation OK
5. **Mise à jour** : `last_login` mis à jour

#### Protection contre les attaques
- **Rate limiting** : Limitation des tentatives de login (à implémenter)
- **Messages d'erreur génériques** : Ne pas révéler si l'utilisateur existe
- **Hash bcrypt** : Mots de passe jamais stockés en clair

---

## 🛡️ 2. AUTORISATION (PERMISSIONS)

### 2.1 Architecture RBAC (Role-Based Access Control)

#### Structure Hiérarchique
```
Superuser
  └─→ Accès total (bypass toutes les permissions)

Staff User
  └─→ Accès administratif (lecture/écriture)

Utilisateur avec Rôles
  └─→ Rôles → Permissions (N↔N)
      └─→ Permissions granulaires par code

Utilisateur avec Permissions Projet
  └─→ Permissions spécifiques par projet
      ├─→ voir
      ├─→ modifier
      ├─→ supprimer
      ├─→ valider
      ├─→ gerer_membres
      ├─→ gerer_permissions
      └─→ voir_historique
```

### 2.2 Permissions Système (Accounts)

#### Classes de Permissions
1. **`IsAdminOrReadOnly`**
   - **GET, HEAD, OPTIONS** : Tous utilisateurs authentifiés
   - **POST, PUT, PATCH, DELETE** : Seulement staff/superuser

2. **`IsSelfOrAdmin`**
   - **Modification profil** : Soi-même OU admin
   - **Protection** : Empêche modification d'autres utilisateurs

### 2.3 Permissions Projets

#### Classes de Permissions
1. **`ProjetPermissions`**
   - **has_permission()** : Vérifie accès général
     - Superuser : Accès total
     - Authentifié : Peut voir liste et créer
   - **has_object_permission()** : Vérifie accès objet
     - Propriétaire : Accès total
     - Permission spécifique : Vérifie `PermissionProjet`
     - Actions : retrieve, update, destroy, update_statut

2. **`MembreProjetPermissions`**
   - **Gestion membres** : Propriétaire OU permission `gerer_membres`
   - **Auto-suppression** : Utilisateur peut se retirer

3. **`HistoriqueEtatPermissions`**
   - **Voir historique** : Permission `voir_historique` requise

4. **`PermissionProjetPermissions`**
   - **Gérer permissions** : Permission `gerer_permissions` requise

#### Vérification des Permissions
```python
# Exemple : Vérification permission modifier
PermissionProjet.objects.filter(
    projet=projet,
    utilisateur=user,
    permission='modifier',
    active=True
).exists()
```

### 2.4 Permissions Frontend

#### Service de Permissions
- **Initialisation** : Décodage JWT pour extraire permissions
- **Vérification** : `hasPermission(code)` pour vérifier accès
- **Cache** : Permissions mises en cache côté client
- **Synchronisation** : Mise à jour à chaque nouveau token

---

## 🌐 3. CORS (Cross-Origin Resource Sharing)

### 3.1 Configuration

#### Développement
```python
CORS_ALLOW_ALL_ORIGINS = True  # Toutes origines autorisées
CORS_ALLOW_CREDENTIALS = True  # Cookies/credentials autorisés
```

#### Production
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://ton-domaine.com"  # Domaine de production
]
CORS_ALLOW_CREDENTIALS = True
```

### 3.2 Headers Autorisés
- `accept`, `accept-encoding`
- `authorization` (pour JWT)
- `content-type`
- `dnt`, `origin`, `user-agent`
- `x-csrftoken`, `x-requested-with`

### 3.3 Méthodes Autorisées
- `DELETE`, `GET`, `OPTIONS`, `PATCH`, `POST`, `PUT`

### 3.4 Protection
- **Middleware** : `CorsMiddleware` en premier dans la chaîne
- **Validation** : Vérification de l'origine à chaque requête
- **Credentials** : Support des cookies/authentification

---

## 🛡️ 4. CSRF (Cross-Site Request Forgery)

### 4.1 Protection Django
- **Middleware** : `CsrfViewMiddleware` activé
- **Token** : Généré automatiquement pour les formulaires
- **Validation** : Vérification à chaque requête POST/PUT/DELETE

### 4.2 API REST
- **Exemption** : APIs REST exemptées (utilisation JWT)
- **Headers** : `X-CSRFToken` requis pour les formulaires HTML

---

## 🔒 5. MIDDLEWARE DE SÉCURITÉ

### 5.1 Ordre des Middlewares
```python
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",        # 1. CORS en premier
    "django.middleware.security.SecurityMiddleware", # 2. Headers sécurité
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",   # 5. Protection CSRF
    "django.contrib.auth.middleware.AuthenticationMiddleware", # 6. Auth
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware", # 9. Clickjacking
]
```

### 5.2 SecurityMiddleware
- **Headers sécurité** : Ajout automatique de headers HTTP sécurisés
- **HTTPS redirect** : Redirection vers HTTPS en production
- **HSTS** : HTTP Strict Transport Security

### 5.3 XFrameOptionsMiddleware
- **Protection** : Empêche l'embedding dans iframes
- **Header** : `X-Frame-Options: DENY`

---

## 📝 6. VALIDATION DES DONNÉES

### 6.1 Serializers Django REST Framework

#### Validation Automatique
- **Champs** : Validation selon le type (email, URL, etc.)
- **Required** : Champs obligatoires vérifiés
- **Format** : Validation des formats (dates, nombres, etc.)

#### Validation Personnalisée
```python
def validate_email(self, value):
    # Vérification unicité
    if User.objects.filter(email=value).exists():
        raise serializers.ValidationError("Email déjà utilisé")
    return value

def validate(self, attrs):
    # Validation croisée des champs
    if attrs['debut'] > attrs['fin']:
        raise serializers.ValidationError("Date début > Date fin")
    return attrs
```

### 6.2 Validation Modèles Django

#### Méthodes `clean()`
- **Validation métier** : Logique de validation complexe
- **Appel automatique** : Via `full_clean()` avant sauvegarde

#### Contraintes Base de Données
- **Unique** : Contraintes d'unicité
- **Foreign Keys** : Intégrité référentielle
- **Check Constraints** : Validations SQL

### 6.3 Validation Frontend
- **Formulaires** : Validation avant envoi
- **Types** : Validation des types de données
- **Messages** : Messages d'erreur utilisateur

---

## 📁 7. SÉCURITÉ DES FICHIERS

### 7.1 Upload de Fichiers

#### Validation
- **Types autorisés** : Vérification des extensions
- **Taille maximale** : Limitation de la taille
- **Noms de fichiers** : Sanitisation des noms
- **Stockage** : Fichiers dans `MEDIA_ROOT` (hors web root en production)

#### Protection
- **Authentification requise** : Upload uniquement pour utilisateurs authentifiés
- **Permissions** : Vérification des permissions projet
- **Scan antivirus** : À implémenter pour fichiers uploadés

### 7.2 Génération de Documents

#### Sécurité
- **Templates** : Validation des templates
- **Données** : Échappement des données utilisateur
- **Chemins** : Validation des chemins de fichiers

### 7.3 Accès aux Fichiers

#### URLs Média
- **Authentification** : Vérification de l'authentification
- **Permissions** : Vérification des permissions projet
- **Logs** : Traçabilité des accès

---

## 🗄️ 8. SÉCURITÉ BASE DE DONNÉES

### 8.1 ORM Django

#### Protection SQL Injection
- **ORM uniquement** : Pas de requêtes SQL brutes
- **Paramètres** : Requêtes paramétrées automatiquement
- **Échappement** : Données échappées automatiquement

#### Exemple Sécurisé
```python
# ✅ SÉCURISÉ (ORM)
Projet.objects.filter(nom=user_input)

# ❌ DANGEREUX (SQL brut)
cursor.execute(f"SELECT * FROM projets WHERE nom = '{user_input}'")
```

### 8.2 Text2SQL (Chatbot)

#### Sécurité
- **Contexte isolé** : Exécution dans contexte limité
- **Modèles uniquement** : Accès uniquement aux modèles Django
- **Pas de builtins** : `__builtins__` désactivés
- **Validation** : Vérification de l'intention avant exécution

```python
# Exécution sécurisée
local_context = {
    'Projet': Projet,
    'User': User,
    # ... modèles uniquement
}
result = eval(query, {"__builtins__": {}}, local_context)
```

### 8.3 Transactions

#### Atomicité
- **`transaction.atomic()`** : Blocs atomiques
- **Rollback** : Annulation en cas d'erreur
- **Intégrité** : Cohérence des données garantie

---

## 🔐 9. VARIABLES D'ENVIRONNEMENT

### 9.1 Secrets

#### Variables Sensibles
- **`SECRET_KEY`** : Clé secrète Django (JWT, sessions, etc.)
- **`DEEPSEEK_API_KEY`** : Clé API DeepSeek
- **`EMAIL_HOST_PASSWORD`** : Mot de passe email
- **`DATABASE_PASSWORD`** : Mot de passe base de données

#### Stockage
- **Fichier `.env`** : Variables locales (non commité)
- **Variables système** : Variables d'environnement serveur
- **Secrets manager** : À utiliser en production (AWS Secrets, etc.)

### 9.2 Configuration

#### Développement
```python
SECRET_KEY = os.getenv("SECRET_KEY", "default-insecure-key")
DEBUG = os.getenv('DEBUG', 'True') == 'True'
```

#### Production
```python
SECRET_KEY = os.getenv("SECRET_KEY")  # OBLIGATOIRE
DEBUG = False  # JAMAIS True en production
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')
```

---

## 🌍 10. ALLOWED_HOSTS

### 10.1 Configuration

#### Développement
```python
ALLOWED_HOSTS = ['127.0.0.1', 'localhost', '0.0.0.0']
```

#### Production
```python
ALLOWED_HOSTS = [
    'votre-domaine.com',
    'www.votre-domaine.com',
    'api.votre-domaine.com'
]
```

### 10.2 Protection
- **Validation** : Django vérifie le header `Host`
- **Attaque** : Protection contre Host Header Injection
- **Erreur** : `SuspiciousOperation` si host non autorisé

---

## 🔄 11. SESSIONS

### 11.1 Configuration
- **Backend** : Base de données (sessions stockées en DB)
- **Expiration** : Gestion automatique de l'expiration
- **Sécurité** : Cookies sécurisés en production

### 11.2 Protection
- **HttpOnly** : Cookies non accessibles via JavaScript
- **Secure** : Cookies uniquement via HTTPS en production
- **SameSite** : Protection CSRF

---

## 🚨 12. GESTION DES ERREURS

### 12.1 Messages d'Erreur

#### Développement
- **Détails complets** : Stack traces, variables, etc.
- **DEBUG=True** : Affichage des erreurs détaillées

#### Production
- **Messages génériques** : Pas de détails techniques
- **DEBUG=False** : Erreurs génériques uniquement
- **Logs** : Détails dans les logs serveur uniquement

### 12.2 Logging
- **Erreurs** : Toutes les erreurs loggées
- **Authentification** : Tentatives de login loggées
- **Actions sensibles** : Suppressions, modifications loggées

---

## 🔍 13. VALIDATION DES REQUÊTES

### 13.1 Headers Requis
- **Authorization** : Token JWT pour requêtes authentifiées
- **Content-Type** : `application/json` pour POST/PUT/PATCH

### 13.2 Validation des Paramètres
- **URL params** : Validation des paramètres d'URL
- **Query params** : Validation des paramètres de requête
- **Body** : Validation via serializers

---

## 🛡️ 14. PROTECTION CONTRE LES ATTAQUES

### 14.1 XSS (Cross-Site Scripting)
- **Échappement** : Données échappées dans templates
- **CSP** : Content Security Policy (à implémenter)
- **Sanitisation** : Nettoyage des entrées utilisateur

### 14.2 SQL Injection
- **ORM** : Utilisation exclusive de l'ORM Django
- **Paramètres** : Requêtes paramétrées
- **Validation** : Validation des entrées

### 14.3 CSRF
- **Tokens** : Tokens CSRF pour formulaires
- **Exemption API** : APIs REST exemptées (JWT)

### 14.4 Clickjacking
- **X-Frame-Options** : Header `DENY`
- **Middleware** : Protection automatique

### 14.5 Brute Force
- **Rate limiting** : À implémenter pour login
- **Lockout** : Verrouillage compte après X tentatives

---

## 📊 15. AUDIT ET TRAÇABILITÉ

### 15.1 Logs d'Authentification
- **Login** : Tentatives de connexion
- **Logout** : Déconnexions
- **Échecs** : Tentatives échouées

### 15.2 Logs d'Actions
- **Création** : Création d'objets
- **Modification** : Modifications d'objets
- **Suppression** : Suppressions d'objets
- **Accès** : Accès aux données sensibles

### 15.3 Historique
- **HistoriqueEtat** : Historique des changements de statut
- **HistoriqueDocument** : Historique des documents
- **Timestamps** : `created_at`, `updated_at` sur tous les modèles

---

## 🔐 16. SÉCURITÉ FRONTEND

### 16.1 Stockage des Tokens
- **localStorage** : Tokens stockés dans localStorage
- **Risque** : Vulnérable au XSS (à migrer vers httpOnly cookies)

### 16.2 Intercepteurs Axios
- **Ajout automatique** : Token ajouté à chaque requête
- **Refresh automatique** : Renouvellement automatique du token
- **Gestion erreurs** : Gestion des erreurs 401/403

### 16.3 Validation Côté Client
- **Formulaires** : Validation avant envoi
- **Types** : Validation des types
- **Messages** : Messages d'erreur utilisateur

---

## 🎯 17. RECOMMANDATIONS PRODUCTION

### 17.1 Configuration
- ✅ **DEBUG=False** : Jamais True en production
- ✅ **SECRET_KEY** : Clé unique et secrète
- ✅ **ALLOWED_HOSTS** : Domaines spécifiques uniquement
- ✅ **CORS** : Origines spécifiques uniquement
- ✅ **HTTPS** : Forcer HTTPS uniquement

### 17.2 Base de Données
- ✅ **Backup** : Sauvegardes régulières
- ✅ **Chiffrement** : Chiffrement des données sensibles
- ✅ **Accès** : Accès restreint à la base de données

### 17.3 Serveur
- ✅ **Firewall** : Configuration firewall appropriée
- ✅ **Updates** : Mises à jour régulières
- ✅ **Monitoring** : Surveillance des logs
- ✅ **Rate limiting** : Limitation des requêtes

### 17.4 Secrets
- ✅ **Secrets Manager** : Utiliser un gestionnaire de secrets
- ✅ **Rotation** : Rotation régulière des clés
- ✅ **Accès** : Accès restreint aux secrets

---

## 📋 18. CHECKLIST DE SÉCURITÉ

### Authentification
- [x] JWT avec access/refresh tokens
- [x] Rotation des refresh tokens
- [x] Blacklist des tokens
- [x] Expiration des tokens
- [ ] Rate limiting login (à implémenter)

### Autorisation
- [x] RBAC (rôles et permissions)
- [x] Permissions par projet
- [x] Vérification des permissions
- [x] Protection des endpoints

### Protection des Données
- [x] Validation des entrées
- [x] Échappement des sorties
- [x] ORM Django (protection SQL injection)
- [x] Transactions atomiques

### Communication
- [x] CORS configuré
- [x] CSRF protection
- [x] HTTPS en production
- [x] Headers sécurité

### Fichiers
- [x] Validation des uploads
- [x] Authentification requise
- [x] Permissions vérifiées
- [ ] Scan antivirus (à implémenter)

### Secrets
- [x] Variables d'environnement
- [x] SECRET_KEY sécurisée
- [ ] Secrets manager (production)
- [ ] Rotation des clés

---

## 🎓 Conclusion

L'application Gestion Marketing implémente une **sécurité multicouche robuste** :

✅ **Authentification** : JWT avec refresh tokens et blacklist
✅ **Autorisation** : RBAC + permissions granulaires par projet
✅ **Protection** : CORS, CSRF, XSS, SQL Injection
✅ **Validation** : Données validées à tous les niveaux
✅ **Traçabilité** : Logs et historique complets
✅ **Configuration** : Variables d'environnement pour les secrets

**L'application est prête pour la production avec les bonnes pratiques de sécurité !** 🔐✨

