# 📊 Diagramme de Fonctionnement du Chatbot Marketges IA

## 🎯 Vue d'Ensemble

Le chatbot Marketges IA est un système intelligent qui transforme les questions en langage naturel en réponses pertinentes en interrogeant la base de données et en utilisant l'IA DeepSeek pour formuler des réponses naturelles.

---

## 🔄 Flux Principal de Traitement

### 1. RÉCEPTION DE LA QUESTION
- **Point d'entrée** : L'utilisateur envoie une question via l'interface frontend
- **Endpoint** : `POST /api/chatbot/ask/`
- **Données reçues** : 
  - `question` : Le texte de la question
  - `session_id` : Identifiant unique de la session de conversation

### 2. CRÉATION/GESTION DE LA CONVERSATION
- **Action** : Récupération ou création d'une `Conversation` dans la base de données
- **Lien** : Association avec l'utilisateur (si authentifié) ou avec le `session_id`
- **Sauvegarde** : Le message utilisateur est enregistré dans la table `Message`

### 3. ANALYSE NLP (Traitement du Langage Naturel)
- **Outil** : spaCy (modèle français `fr_core_news_md`)
- **Processus** :
  - Tokenisation : Découpage de la phrase en mots
  - Extraction d'entités : Identification des noms propres, dates, etc.
  - Stockage : Tokens et entités sauvegardés avec le message

### 4. ANALYSE INTELLIGENTE CONTEXTUELLE
Le système utilise **3 méthodes en cascade** pour comprendre la question :

#### Méthode 1 : Analyse Contextuelle Intelligente
- **Fonction** : `intelligent_context_analysis()`
- **Détection** : Identifie le type de question (projets, utilisateurs, tâches, etc.)
- **Actions** :
  - Questions sur **projets** → Appelle `_analyze_projects_context()`
  - Questions sur **utilisateurs** → Appelle `_analyze_users_context()`
  - Questions sur **tâches** → Appelle `_analyze_tasks_context()`
  - Questions **générales** → Retourne `None` (pas de données)
- **Résultat** : Données formatées extraites de la base de données

#### Méthode 2 : Génération Automatique Text2SQL (Fallback)
- **Si Méthode 1 échoue** → Active `text2sql_generator`
- **Processus** :
  1. **Analyse d'intention** : Détecte le type de requête (count, list, recent, etc.)
  2. **Détection du modèle** : Identifie quel modèle Django interroger (Projet, User, Tache, etc.)
  3. **Génération de requête** : Crée une requête Django ORM dynamique
  4. **Exécution** : Exécute la requête sur la base de données
  5. **Formatage** : Formate les résultats en texte lisible
- **Résultat** : Données extraites ou message d'erreur

#### Méthode 3 : Analyse Classique (Dernier recours)
- **Si Méthodes 1 et 2 échouent** → Active `analyze_and_respond()`
- **Processus** : Détection basique de mots-clés et réponses prédéfinies
- **Résultat** : Réponse basique ou `None`

### 5. ENRICHISSEMENT DU PROMPT
- **Si données trouvées** :
  - Création d'un prompt enrichi avec les données extraites
  - Instructions à DeepSeek : "Utilise EXACTEMENT ces données pour répondre"
- **Si aucune donnée** :
  - Prompt simple : "Tu es Marketges IA, réponds de manière naturelle"

### 6. APPEL À DEEPSEEK IA
- **API** : DeepSeek API (via `query_deepseek()`)
- **Processus** :
  1. Construction de la requête HTTP POST
  2. Envoi du prompt enrichi à l'API DeepSeek
  3. Réception de la réponse JSON
  4. Extraction du texte de réponse
  5. Nettoyage (suppression des astérisques markdown)
- **Fallback** : Si DeepSeek échoue → Réponse système formatée

### 7. SAUVEGARDE DE LA RÉPONSE
- **Création** : Nouveau `Message` avec `sender='bot'`
- **Stockage** :
  - Contenu de la réponse
  - Indicateur `deepseek_used` (True/False)
  - Timestamp automatique
- **Lien** : Association avec la `Conversation`

### 8. RETOUR À L'UTILISATEUR
- **Format** : JSON `{"answer": "réponse du chatbot"}`
- **Envoi** : Réponse HTTP 200 avec le texte formaté

---

## 🧩 Composants Principaux

### A. MODÈLES DE DONNÉES (models.py)

#### Conversation
- **Rôle** : Conteneur pour une session de chat
- **Champs** :
  - `user` : Utilisateur (optionnel)
  - `session_id` : Identifiant unique de session
  - `created_at` / `updated_at` : Timestamps

#### Message
- **Rôle** : Stockage d'un message (utilisateur ou bot)
- **Champs** :
  - `conversation` : Lien vers la Conversation
  - `sender` : 'user' ou 'bot'
  - `content` : Texte du message
  - `spacy_tokens` : Tokens extraits par spaCy
  - `spacy_entities` : Entités extraites
  - `deepseek_used` : Boolean (IA utilisée ou non)

### B. VUE PRINCIPALE (ChatbotView)

#### Méthodes Clés :
1. **`post()`** : Point d'entrée principal
2. **`intelligent_context_analysis()`** : Analyse contextuelle
3. **`_analyze_projects_context()`** : Analyse spécifique projets
4. **`_analyze_users_context()`** : Analyse spécifique utilisateurs
5. **`_analyze_tasks_context()`** : Analyse spécifique tâches
6. **`query_deepseek()`** : Appel API DeepSeek
7. **`get_or_create_conversation()`** : Gestion des conversations

### C. GÉNÉRATEUR TEXT2SQL (text2sql.py)

#### Classe : `TextToSQLGenerator`

#### Méthodes :
1. **`analyze_query_intent()`** :
   - Détecte le type de requête (count, list, recent, etc.)
   - Identifie le modèle cible (Projet, User, etc.)
   - Extrait les filtres (statut, priorité, etc.)

2. **`generate_django_query()`** :
   - Génère une requête Django ORM dynamique
   - Exemple : `Projet.objects.filter(statut='en_cours').count()`

3. **`execute_generated_query()`** :
   - Exécute la requête dans un contexte sécurisé
   - Retourne les résultats

4. **`format_query_result()`** :
   - Formate les résultats en texte lisible
   - Limite à 10 éléments pour les listes

5. **`process_natural_language_query()`** :
   - Orchestre tout le processus Text2SQL
   - Retourne la réponse formatée

### D. TRAITEMENT NLP (spaCy)

#### Modèle : `fr_core_news_md` (français moyen)
- **Fallback 1** : `fr_core_news_sm` (français simple)
- **Fallback 2** : `en_core_web_sm` (anglais)
- **Fallback 3** : Désactivé si aucun modèle disponible

#### Utilisation :
- Tokenisation des phrases
- Extraction d'entités nommées
- Analyse syntaxique (optionnel)

---

## 🔀 Flux de Décision

```
QUESTION UTILISATEUR
    ↓
ANALYSE NLP (spaCy)
    ↓
ANALYSE CONTEXTUELLE INTELLIGENTE
    ├─→ Détection type de question
    │   ├─→ Projets → _analyze_projects_context()
    │   ├─→ Utilisateurs → _analyze_users_context()
    │   ├─→ Tâches → _analyze_tasks_context()
    │   └─→ Général → None
    │
    ├─→ DONNÉES TROUVÉES ?
    │   ├─→ OUI → Enrichir prompt avec données
    │   └─→ NON → Méthode 2 (Text2SQL)
    │
    ├─→ TEXT2SQL
    │   ├─→ Analyse intention
    │   ├─→ Génération requête Django ORM
    │   ├─→ Exécution requête
    │   └─→ Formatage résultats
    │
    ├─→ DONNÉES TROUVÉES ?
    │   ├─→ OUI → Enrichir prompt avec données
    │   └─→ NON → Méthode 3 (Analyse classique)
    │
    └─→ PROMPT FINAL
        ├─→ Avec données → "Utilise ces données exactes"
        └─→ Sans données → "Réponds naturellement"
        ↓
APPEL DEEPSEEK IA
    ├─→ Succès → Réponse formatée
    └─→ Échec → Réponse système
        ↓
SAUVEGARDE MESSAGE BOT
        ↓
RETOUR À L'UTILISATEUR
```

---

## 🗄️ Accès aux Données

### Modèles Django Interrogés :
- **Projet** : Projets marketing
- **Tache** : Tâches des projets
- **User** : Utilisateurs du système
- **Etape** : Étapes des phases
- **DocumentProjet** : Documents associés
- **MembreProjet** : Membres des projets
- **Service** : Services de l'organisation
- **Role** : Rôles des utilisateurs

### Types de Requêtes :
1. **COUNT** : "Combien de projets ?"
2. **LIST** : "Liste mes utilisateurs"
3. **FILTER** : "Projets en cours"
4. **RECENT** : "Derniers projets"
5. **RELATION** : "Projets avec documents"

---

## 🔌 Intégrations Externes

### 1. DeepSeek API
- **URL** : `https://api.deepseek.com/v1/chat/completions`
- **Méthode** : POST
- **Authentification** : Clé API dans `DEEPSEEK_API_KEY`
- **Format** : JSON avec prompt et paramètres
- **Rôle** : Génération de réponses naturelles et engageantes

### 2. Base de Données Django
- **ORM** : Django ORM pour toutes les requêtes
- **Sécurité** : Exécution dans contexte isolé (Text2SQL)
- **Performance** : Requêtes optimisées avec `select_related()`

---

## 📊 Points de Stockage

### Base de Données :
1. **Table Conversation** : Sessions de chat
2. **Table Message** : Tous les messages (user + bot)
3. **Métadonnées** : Tokens spaCy, entités, indicateur DeepSeek

### Logs :
- Toutes les étapes sont loggées
- Suivi des erreurs
- Performance des appels API

---

## 🎨 Format des Réponses

### Caractéristiques :
- **Ton** : Chaleureux et professionnel
- **Emojis** : Utilisés pour l'engagement
- **Formatage** : Texte propre (pas de markdown)
- **Contexte** : Basé sur les données réelles
- **Conseils** : Suggestions pratiques ajoutées

### Exemple de Réponse :
```
👋 Salut ! Voici la liste complète de vos projets :

📊 Vous avez 5 projets au total :

• Projet Marketing Digital (Réf: PROJ-001)
  📅 Début: 01/01/2025 • Statut: En cours
  👥 3 membres • 📋 8 tâches

• Projet Communication (Réf: PROJ-002)
  📅 Début: 15/01/2025 • Statut: En attente
  👥 2 membres • 📋 5 tâches

Y a-t-il autre chose que vous aimeriez savoir ? 😊

🤖 DeepSeek IA
```

---

## 🔄 Gestion des Conversations

### Endpoints Supplémentaires :
1. **GET /api/chatbot/history/** : Récupérer l'historique
2. **DELETE /api/chatbot/delete/** : Supprimer une conversation
3. **DELETE /api/chatbot/clear-all/** : Supprimer toutes les conversations

---

## ⚡ Système de Fallback

### Niveaux de Secours :
1. **Niveau 1** : Analyse contextuelle intelligente
2. **Niveau 2** : Génération Text2SQL automatique
3. **Niveau 3** : Analyse classique par mots-clés
4. **Niveau 4** : Réponse système si DeepSeek échoue

---

## 🎯 Cas d'Usage Types

### Question sur les Données :
- **Input** : "Combien de projets ai-je ?"
- **Processus** : Analyse → Requête DB → Données → DeepSeek → Réponse
- **Output** : "Vous avez 5 projets au total..."

### Question Générale :
- **Input** : "Comment ça va ?"
- **Processus** : Analyse → Pas de données → DeepSeek direct → Réponse
- **Output** : "Ça va très bien, merci ! 😊 Comment puis-je vous aider ?"

### Question Complexe :
- **Input** : "Quels sont les projets urgents avec des tâches en retard ?"
- **Processus** : Analyse → Requête DB complexe → Données → DeepSeek → Réponse
- **Output** : Liste formatée avec conseils

---

## 🔐 Sécurité

### Mesures :
- **Exécution isolée** : Requêtes Text2SQL dans contexte sécurisé
- **Validation** : Vérification des entrées utilisateur
- **Logs** : Traçabilité complète
- **Gestion d'erreurs** : Try/catch à tous les niveaux

---

## 📈 Performance

### Optimisations :
- **Cache** : Modèle spaCy chargé une fois
- **Requêtes DB** : Optimisées avec `select_related()`
- **Limites** : Listes limitées à 10 éléments
- **Timeout** : Gestion des timeouts API

---

## 🎓 Conclusion

Le chatbot Marketges IA est un système **hybride intelligent** qui combine :
- ✅ **Analyse contextuelle** pour comprendre l'intention
- ✅ **Génération automatique** de requêtes SQL
- ✅ **IA DeepSeek** pour des réponses naturelles
- ✅ **Base de données** pour des données réelles
- ✅ **NLP spaCy** pour l'analyse du langage

**Résultat** : Un assistant intelligent qui comprend le français, accède aux données réelles, et répond de manière naturelle et engageante ! 🤖✨

