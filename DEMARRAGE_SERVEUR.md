# 🚀 Guide de Démarrage du Serveur

## ⚠️ IMPORTANT : Utiliser Daphne pour les WebSockets

Pour que les notifications en temps réel et le chat fonctionnent, vous **DEVEZ** utiliser **daphne** au lieu du serveur de développement Django standard.

## 📋 Commandes de Démarrage

### 1. **Backend (Django + Daphne)**

```bash
# 1. Aller dans le répertoire backend
cd backend

# 2. Activer l'environnement virtuel
.venv\Scripts\Activate.ps1

# 3. Démarrer avec daphne (ASGI) - OBLIGATOIRE pour les WebSockets
daphne -b 0.0.0.0 -p 8000 gestion.asgi:application
```

### 2. **Frontend (React)**

```bash
# Dans un autre terminal
cd frontend
npm start
```

## 🔍 Vérification

### ✅ **Serveur Backend Fonctionnel**

- URL : `http://localhost:8000`
- WebSockets : `ws://localhost:8000/ws/notifications/` et `ws://localhost:8000/ws/chat/general/`

### ✅ **Frontend Fonctionnel**

- URL : `http://localhost:3000`
- Notifications : Accessibles via la cloche en haut à droite
- Chat : Bouton chat dans la barre de navigation

## 🧪 Test des Fonctionnalités

1. **Connectez-vous** à l'application
2. **Allez dans** Notifications → Générales
3. **Vérifiez** que le widget "Activité Générale" affiche le bon nombre d'utilisateurs en ligne
4. **Ouvrez le chat** pour tester les WebSockets en temps réel

## ❌ **NE PAS UTILISER**

```bash
# ❌ Cette commande ne supporte PAS les WebSockets
python manage.py runserver
```

## ✅ **UTILISER OBLIGATOIREMENT**

```bash
# ✅ Cette commande supporte les WebSockets
daphne -b 0.0.0.0 -p 8000 gestion.asgi:application
```

## 🔧 Dépannage

### Problème : "ModuleNotFoundError: No module named 'gestion'"

**Solution :** Assurez-vous d'être dans le répertoire `backend/`

### Problème : WebSockets ne fonctionnent pas

**Solution :** Vérifiez que vous utilisez daphne et non le serveur de développement Django

### Problème : Compteur d'utilisateurs incorrect

**Solution :** Le système est maintenant configuré pour afficher le vrai nombre d'utilisateurs connectés
