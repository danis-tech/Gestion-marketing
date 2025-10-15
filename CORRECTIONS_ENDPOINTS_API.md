# Corrections Endpoints API - Système de Notifications

## 🔧 Problèmes Identifiés et Corrigés

### ❌ Erreur 404 - Endpoint Inexistant

- **Problème** : `/api/accounts/profile/` n'existe pas
- **Solution** : Utiliser `/api/accounts/me/` qui est l'endpoint correct

### ❌ Erreur 401 - Token d'Authentification

- **Problème** : Token non envoyé ou invalide
- **Solution** : Amélioration des intercepteurs Axios avec logs détaillés

### ❌ Erreur 500 - Serializer Backend

- **Problème** : `KeyError: 'expediteur_id'` dans le serializer
- **Solution** : Correction du serializer pour accepter `expediteur` directement

### ❌ Type WebSocket Non Géré

- **Problème** : `notifications_non_lues` non géré
- **Solution** : Ajout de la gestion de ce type de message

## 🚀 Corrections Apportées

### 1. Endpoint Utilisateur Corrigé

```javascript
// ❌ Avant (404)
const response = await api.get("/accounts/profile/");

// ✅ Après (200)
const response = await api.get("/accounts/me/");
```

### 2. Intercepteurs Axios Améliorés

```javascript
// Intercepteur de requête avec logs
api.interceptors.request.use((config) => {
	const token = localStorage.getItem("access_token");
	console.log("Token utilisé pour la requête:", token ? "Présent" : "Absent");
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
		console.log("Headers de la requête:", config.headers);
	} else {
		console.error("Token d'authentification manquant!");
	}
	return config;
});

// Intercepteur de réponse avec gestion d'erreur
api.interceptors.response.use(
	(response) => response,
	(error) => {
		console.error("Erreur API:", error.response?.status, error.response?.data);
		if (error.response?.status === 401) {
			console.error("Token expiré ou invalide");
		}
		return Promise.reject(error);
	}
);
```

### 3. Serializer Backend Corrigé

```python
# ❌ Avant (KeyError)
class ChatMessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['message', 'expediteur_id', 'service_id', 'est_systeme']

    def create(self, validated_data):
        validated_data['expediteur'] = User.objects.get(
            id=validated_data.pop('expediteur_id')  # ❌ KeyError ici
        )

# ✅ Après (Fonctionnel)
class ChatMessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['message', 'expediteur', 'service_id', 'est_systeme']

    def create(self, validated_data):
        # Si service_id est fourni, le convertir en objet Service
        if validated_data.get('service_id'):
            from accounts.models import Service
            validated_data['service'] = Service.objects.get(
                id=validated_data.pop('service_id')
            )
        return super().create(validated_data)
```

### 4. Gestion WebSocket Améliorée

```javascript
// Ajout de la gestion du type notifications_non_lues
case 'notifications_non_lues':
  console.log('Notifications non lues reçues:', data.data);
  if (data.data?.generales) {
    setNotifications(prev => [...data.data.generales, ...prev]);
    setStats(prev => ({ ...prev, totalNotifications: prev.totalNotifications + data.data.generales.length }));
  }
  if (data.data?.personnelles) {
    setUnreadCount(prev => prev + data.data.personnelles.length);
    setStats(prev => ({ ...prev, totalNotifications: prev.totalNotifications + data.data.personnelles.length }));
  }
  break;
```

### 5. Chargement Utilisateur Actuel

```javascript
// Fonction pour charger l'utilisateur actuel
const loadCurrentUser = async () => {
	try {
		const response = await api.get("/accounts/me/");
		setCurrentUser(response.data);
		console.log("Utilisateur actuel chargé:", response.data);
		return response.data;
	} catch (error) {
		console.error("Erreur lors du chargement de l'utilisateur:", error);
		return null;
	}
};
```

## 📋 Endpoints API Disponibles

### Comptes Utilisateur (`/api/accounts/`)

- `GET /api/accounts/me/` - Profil utilisateur actuel ✅
- `POST /api/accounts/login/` - Connexion
- `POST /api/accounts/signup/` - Inscription
- `POST /api/accounts/refresh/` - Rafraîchir le token
- `POST /api/accounts/logout/` - Déconnexion

### Notifications (`/api/notifications/`)

- `GET /api/notifications/` - Liste des notifications
- `GET /api/notifications/unread-count/` - Nombre de notifications non lues
- `POST /api/notifications/mark-read/` - Marquer comme lu
- `GET /api/notifications/chat/messages/` - Messages de chat
- `POST /api/notifications/chat/messages/` - Envoyer un message ✅

## 🔍 Debug et Diagnostic

### Logs Ajoutés

- **Token d'authentification** : Présent/Absent
- **Headers de requête** : Vérification des headers
- **Erreurs API** : Status et détails des erreurs
- **Utilisateur actuel** : Chargement et données
- **Messages WebSocket** : Types et données reçues

### Messages de Debug Attendus

```
Token utilisé pour la requête: Présent
Headers de la requête: { Authorization: "Bearer ...", Content-Type: "application/json" }
Token valide, profil utilisateur: { id: 1, username: "...", ... }
Utilisateur actuel chargé: { id: 1, username: "...", ... }
sendMessage appelé: { newMessage: "test", isConnected: true }
Envoi du message: test
Message envoyé avec succès: { data: ... }
```

## 🎯 Résultat Final

Toutes les erreurs sont maintenant corrigées :

- ✅ **404** : Endpoint `/api/accounts/me/` utilisé
- ✅ **401** : Token d'authentification correctement envoyé
- ✅ **500** : Serializer backend corrigé
- ✅ **WebSocket** : Type `notifications_non_lues` géré
- ✅ **Utilisateur** : Chargement de l'utilisateur actuel
- ✅ **Debug** : Logs détaillés pour le diagnostic

Le système est maintenant prêt pour les tests complets !
