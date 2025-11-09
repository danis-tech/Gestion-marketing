# chatbot/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.db.models import Count, Q
from django.db import models

try:
    import spacy
except ImportError:
    spacy = None

import requests
import os
import logging
import uuid
import re
from .models import Conversation, Message
from projects.models import Projet, Tache, PhaseProjet, Etape
from accounts.models import User
from .text2sql import text2sql_generator

# Import de tous les modèles pour accéder à toutes les données
try:
    from documents.models import DocumentProjet, HistoriqueDocumentProjet, CommentaireDocumentProjet
except ImportError:
    DocumentProjet = None
    HistoriqueDocumentProjet = None
    CommentaireDocumentProjet = None

try:
    from accounts.models import Service, Role, Permission
except ImportError:
    Service = None
    Role = None
    Permission = None

logger = logging.getLogger(__name__)

# Charger le modèle spaCy (français moyen)
nlp = None
if spacy:
    try:
        # Essayer de charger le modèle français
        nlp = spacy.load("fr_core_news_md")
        logger.info("Modèle spaCy français chargé avec succès")
    except OSError:
        try:
            # Fallback vers le modèle français simple
            nlp = spacy.load("fr_core_news_sm")
            logger.info("Modèle spaCy français simple chargé avec succès")
        except OSError:
            try:
                # Fallback vers le modèle anglais si disponible
                nlp = spacy.load("en_core_web_sm")
                logger.warning("Modèle spaCy anglais chargé (modèle français non trouvé)")
            except OSError:
                logger.warning("Aucun modèle spaCy trouvé. Le traitement NLP sera désactivé.")
                nlp = None
else:
    logger.warning("spaCy non installé. Le traitement NLP sera désactivé.")

class ChatbotView(APIView):
    permission_classes = []  # Permettre l'accès sans authentification
    
    def post(self, request):
        # Récupérer la question (format frontend)
        user_input = request.data.get("question", "")
        session_id = request.data.get("session_id", str(uuid.uuid4()))
        
        if not user_input.strip():
            return Response({"answer": "Veuillez poser une question."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtenir ou créer une conversation
        conversation = self.get_or_create_conversation(request.user, session_id)
        
        # Traitement NLP avec spaCy (pour l'analyse du texte, pas pour générer des requêtes)
        tokens = []
        entities = []
        if nlp:
            try:
                doc = nlp(user_input)
                tokens = [token.text for token in doc]
                entities = [(ent.text, ent.label_) for ent in doc.ents]
                logger.info(f"[spaCy] Tokens: {tokens[:5]}..., Entités: {entities}")
            except Exception as e:
                logger.warning(f"Erreur spaCy : {e}")

        # Sauvegarder le message utilisateur
        user_message = Message.objects.create(
            conversation=conversation,
            sender='user',
            content=user_input,
            spacy_tokens=tokens,
            spacy_entities=entities
        )

        # ANALYSE INTELLIGENTE CONTEXTUELLE
        data_response = self.intelligent_context_analysis(user_input)
        logger.info(f"[Chatbot] Analyse contextuelle: {'Oui' if data_response else 'Non'}")
        
        # Si l'analyse contextuelle échoue, essayer la génération automatique
        if not data_response or "Je n'ai pas pu comprendre" in data_response:
            try:
                auto_response = text2sql_generator.process_natural_language_query(user_input)
                if auto_response and "Je n'ai pas pu comprendre" not in auto_response:
                    data_response = auto_response
                    logger.info(f"[Chatbot] Réponse automatique générée: Oui")
            except Exception as e:
                logger.warning(f"[Chatbot] Erreur génération automatique: {e}")
        
        # Dernier recours : méthode classique
        if not data_response or "Je n'ai pas pu comprendre" in data_response:
            data_response = self.analyze_and_respond(user_input.lower())
            logger.info(f"[Chatbot] Données récupérées (méthode classique): {'Oui' if data_response else 'Non'}")
        
        # Toujours utiliser DeepSeek avec les données disponibles
        if data_response:
            enhanced_prompt = f"""Question: {user_input}

Données disponibles dans la base de données:
{data_response}

IMPORTANT: 
- Utilise EXACTEMENT ces données pour répondre
- Ne dis JAMAIS qu'il n'y a pas de données si des données sont fournies
- Reformule les informations de façon naturelle et engageante
- Ajoute des conseils pratiques basés sur les données réelles
- Sois précis et utilise les informations exactes fournies"""
            logger.info(f"[Chatbot] Prompt enrichi avec données pour DeepSeek")
        else:
            enhanced_prompt = f"""Question: {user_input}

Tu es Marketges IA, assistant intelligent pour la gestion de projets marketing.
Réponds de manière naturelle et professionnelle. Si tu n'as pas d'informations spécifiques, propose des conseils généraux sur la gestion de projets marketing."""
            logger.info(f"[Chatbot] Prompt simple pour DeepSeek")
        
        deepseek_used = False  # Initialiser la variable
        try:
            logger.info(f"[Chatbot] Tentative d'appel DeepSeek avec prompt: {enhanced_prompt[:200]}...")
            bot_response = self.query_deepseek(enhanced_prompt)
            deepseek_used = True
            logger.info(f"[Chatbot] Réponse DeepSeek générée avec succès: {bot_response[:100]}...")
        except Exception as e:
            logger.error(f"[Chatbot] Erreur DeepSeek détaillée : {e}")
            logger.error(f"[Chatbot] Type d'erreur : {type(e).__name__}")
            # En cas d'erreur, utiliser les données avec reformulation intelligente
            if data_response:
                bot_response = f"Voici les informations demandées :\n\n{data_response}"
                logger.info(f"[Chatbot] Utilisation des données avec reformulation simple")
            else:
                bot_response = "Je n'ai pas pu récupérer les informations demandées. Veuillez réessayer dans quelques instants."
                logger.info(f"[Chatbot] Aucune donnée disponible")

        # Ajouter l'indicateur DeepSeek à la réponse
        if deepseek_used:
            bot_response_with_indicator = f"{bot_response}\n\n🤖 DeepSeek IA"
        else:
            bot_response_with_indicator = f"{bot_response}\n\n⚡ Système"

        # Sauvegarder la réponse du bot
        bot_message = Message.objects.create(
            conversation=conversation,
            sender='bot',
            content=bot_response,
            deepseek_used=deepseek_used
        )

        return Response({
            "answer": bot_response_with_indicator, 
            "session_id": session_id,
            "deepseek_used": deepseek_used
        })

    def get_or_create_conversation(self, user, session_id):
        """Obtenir ou créer une conversation"""
        if user and user.is_authenticated:
            conversation, created = Conversation.objects.get_or_create(
                user=user,
                defaults={'session_id': session_id}
            )
        else:
            conversation, created = Conversation.objects.get_or_create(
                session_id=session_id,
                defaults={'user': None}
            )
        return conversation

    def intelligent_context_analysis(self, user_input):
        """
        Analyse contextuelle intelligente qui comprend le langage naturel
        et fait des déductions basées sur les données disponibles
        """
        # Correction des fautes de frappe courantes
        corrected_input = self._correct_typos(user_input)
        user_input_lower = corrected_input.lower()
        logger.info(f"[Analyse Contextuelle] Question originale: {user_input}")
        logger.info(f"[Analyse Contextuelle] Question corrigée: {corrected_input}")
        
        try:
            # 1. VÉRIFICATION SI C'EST UNE QUESTION GÉNÉRALE (pas liée à l'application)
            if self._is_general_question(user_input_lower):
                logger.info("[Analyse Contextuelle] Question générale détectée - pas de données spécifiques")
                return None  # Laisser DeepSeek répondre naturellement
            
            # 2. ANALYSE DES MOTS-CLÉS CONTEXTUELS
            context_keywords = {
                'urgence': ['urgent', 'urgence', 'priorité', 'prioritaire', 'critique', 'important', 'pressé'],
                'statut': ['statut', 'état', 'en cours', 'terminé', 'en attente', 'actif', 'fini'],
                'projets': ['projet', 'projets', 'campagne', 'marketing', 'initiative'],
                'taches': ['tâche', 'tâches', 'tache', 'taches', 'todo', 'travail', 'activité'],
                'utilisateurs': ['utilisateur', 'utilisateurs', 'équipe', 'team', 'membre', 'membres', 'collaborateur'],
                'quantite': ['combien', 'nombre', 'total', 'quantité', 'combien de'],
                'liste': ['liste', 'afficher', 'montrer', 'voir', 'quels sont', 'donne-moi'],
                'recent': ['récent', 'dernier', 'nouveau', 'récemment', 'dernièrement'],
                'budgets': ['budget', 'budgets', 'coût', 'coûts', 'prix', 'argent', 'financement', 'financier', 'financière', 'économique', 'économiques'],
                'planning': ['planning', 'planification', 'début', 'fin', 'échéance', 'échéances', 'date', 'dates', 'durée', 'estimation', 'estimations'],
                'types': ['type', 'types', 'catégorie', 'catégories', 'classification'],
                'objectifs': ['objectif', 'objectifs', 'but', 'buts', 'cible', 'cibles', 'mission'],
                'descriptions': ['description', 'descriptions', 'détail', 'détails', 'contenu', 'contenus'],
                'risques': ['risque', 'risques', 'danger', 'problème', 'problèmes', 'exposé', 'exposés', 'retard', 'retards', 'dépendance', 'dépendances', 'surcharge', 'équipe', 'ressource', 'ressources']
            }
            
            # 3. DÉTECTION DU CONTEXTE PRINCIPAL
            detected_contexts = []
            for context, keywords in context_keywords.items():
                if any(keyword in user_input_lower for keyword in keywords):
                    detected_contexts.append(context)
            
            logger.info(f"[Analyse Contextuelle] Contextes détectés: {detected_contexts}")
            logger.info(f"[Analyse Contextuelle] Question analysée: '{user_input_lower}'")
            
            # 4. ANALYSE SPÉCIFIQUE PAR CONTEXTE
            if 'budgets' in detected_contexts:
                return self._analyze_budgets_context(user_input_lower, detected_contexts)
            elif 'planning' in detected_contexts:
                return self._analyze_planning_context(user_input_lower, detected_contexts)
            elif 'types' in detected_contexts:
                return self._analyze_types_context(user_input_lower, detected_contexts)
            elif 'objectifs' in detected_contexts:
                return self._analyze_objectives_context(user_input_lower, detected_contexts)
            elif 'descriptions' in detected_contexts:
                return self._analyze_descriptions_context(user_input_lower, detected_contexts)
            elif 'urgence' in detected_contexts:
                return self._analyze_urgency_context(user_input_lower, detected_contexts)
            elif 'statut' in detected_contexts:
                return self._analyze_status_context(user_input_lower, detected_contexts)
            elif 'projets' in detected_contexts:
                return self._analyze_projects_context(user_input_lower, detected_contexts)
            # Conditions spécifiques AVANT les conditions générales
            elif 'taches' in detected_contexts and ('equipe' in user_input_lower or 'équipe' in user_input_lower or 'equipes' in user_input_lower or 'équipes' in user_input_lower or 'membre' in user_input_lower or 'membres' in user_input_lower):
                return self._analyze_teams_tasks_context(user_input_lower, detected_contexts)
            elif 'taches' in detected_contexts and ('utilisateur' in user_input_lower or 'utilisateurs' in detected_contexts):
                return self._analyze_users_tasks_context(user_input_lower, detected_contexts)
            elif 'taches' in detected_contexts:
                return self._analyze_tasks_context(user_input_lower, detected_contexts)
            elif 'utilisateurs' in detected_contexts or 'utilisateur' in user_input_lower:
                return self._analyze_users_context(user_input_lower, detected_contexts)
            # Détection spécifique pour les équipes (même sans le mot "tâches")
            elif 'equipe' in user_input_lower or 'équipe' in user_input_lower or 'equipes' in user_input_lower or 'équipes' in user_input_lower:
                return self._analyze_teams_tasks_context(user_input_lower, detected_contexts)
            # Détection pour les questions sur les assignations et membres
            elif any(keyword in user_input_lower for keyword in ['assignées', 'assignée', 'assignés', 'assigné', 'membre', 'membres', 'collaborateur', 'collaborateurs']):
                return self._analyze_teams_tasks_context(user_input_lower, detected_contexts)
            elif 'quantite' in detected_contexts:
                return self._analyze_quantity_context(user_input_lower, detected_contexts)
            elif 'liste' in detected_contexts:
                return self._analyze_list_context(user_input_lower, detected_contexts)
            elif 'risques' in detected_contexts:
                return self._analyze_risks_context(user_input_lower, detected_contexts)
            
            # 5. ANALYSE PAR DÉDUCTION LOGIQUE
            return self._logical_deduction_analysis(user_input_lower)
            
        except Exception as e:
            logger.error(f"[Analyse Contextuelle] Erreur: {e}")
            return None
    
    def _correct_typos(self, user_input):
        """
        Corrige les fautes de frappe courantes dans les questions
        """
        # Dictionnaire de corrections courantes
        corrections = {
            # Mots liés aux projets
            'projet': ['projets', 'projet', 'projé', 'projét'],
            'projets': ['projets', 'projet', 'projé', 'projét'],
            'tache': ['tache', 'taches', 'tâche', 'tâches', 'tach', 'tachs'],
            'taches': ['tache', 'taches', 'tâche', 'tâches', 'tach', 'tachs'],
            'tâche': ['tache', 'taches', 'tâche', 'tâches', 'tach', 'tachs'],
            'tâches': ['tache', 'taches', 'tâche', 'tâches', 'tach', 'tachs'],
            
            # Mots liés aux utilisateurs
            'utilisateur': ['utilisateur', 'utilisateurs', 'user', 'users', 'utilisatuer', 'utilisateurs'],
            'utilisateurs': ['utilisateur', 'utilisateurs', 'user', 'users', 'utilisatuer', 'utilisateurs'],
            'user': ['utilisateur', 'utilisateurs', 'user', 'users', 'utilisatuer', 'utilisateurs'],
            'users': ['utilisateur', 'utilisateurs', 'user', 'users', 'utilisatuer', 'utilisateurs'],
            
            # Mots liés aux budgets
            'budget': ['budget', 'budgets', 'budgé', 'budgét', 'budjet', 'budjets'],
            'budgets': ['budget', 'budgets', 'budgé', 'budgét', 'budjet', 'budjets'],
            
            # Mots liés aux statuts
            'statut': ['statut', 'statuts', 'status', 'statue', 'statues'],
            'statuts': ['statut', 'statuts', 'status', 'statue', 'statues'],
            'status': ['statut', 'statuts', 'status', 'statue', 'statues'],
            
            # Mots liés aux priorités
            'priorite': ['priorite', 'priorité', 'priorites', 'priorités', 'priorité', 'priorites'],
            'priorité': ['priorite', 'priorité', 'priorites', 'priorités', 'priorité', 'priorites'],
            'priorites': ['priorite', 'priorité', 'priorites', 'priorités', 'priorité', 'priorites'],
            'priorités': ['priorite', 'priorité', 'priorites', 'priorités', 'priorité', 'priorites'],
            
            # Mots liés aux équipes
            'equipe': ['equipe', 'équipe', 'equipes', 'équipes', 'equip', 'equips'],
            'équipe': ['equipe', 'équipe', 'equipes', 'équipes', 'equip', 'equips'],
            'equipes': ['equipe', 'équipe', 'equipes', 'équipes', 'equip', 'equips'],
            'équipes': ['equipe', 'équipe', 'equipes', 'équipes', 'equip', 'equips'],
            
            # Mots liés aux assignations
            'assigne': ['assigne', 'assigné', 'assignee', 'assigné', 'assigné'],
            'assigné': ['assigne', 'assigné', 'assignee', 'assigné', 'assigné'],
            'assignee': ['assigne', 'assigné', 'assignee', 'assigné', 'assigné'],
            'assignes': ['assignes', 'assignés', 'assignees', 'assignés', 'assignés'],
            'assignés': ['assignes', 'assignés', 'assignees', 'assignés', 'assignés'],
            'assignees': ['assignes', 'assignés', 'assignees', 'assignés', 'assignés'],
            
            # Mots liés aux responsables
            'responsable': ['responsable', 'responsables', 'responsabl', 'responsabls'],
            'responsables': ['responsable', 'responsables', 'responsabl', 'responsabls'],
            
            # Mots liés aux listes
            'liste': ['liste', 'listes', 'list', 'lists', 'lise', 'lises'],
            'listes': ['liste', 'listes', 'list', 'lists', 'lise', 'lises'],
            'list': ['liste', 'listes', 'list', 'lists', 'lise', 'lises'],
            'lists': ['liste', 'listes', 'list', 'lists', 'lise', 'lises'],
            
            # Mots liés aux descriptions
            'description': ['description', 'descriptions', 'descripton', 'descriptons'],
            'descriptions': ['description', 'descriptions', 'descripton', 'descriptons'],
            
            # Mots liés aux objectifs
            'objectif': ['objectif', 'objectifs', 'objectiv', 'objectivs'],
            'objectifs': ['objectif', 'objectifs', 'objectiv', 'objectivs'],
            
            # Mots liés aux types
            'type': ['type', 'types', 'typ', 'typs'],
            'types': ['type', 'types', 'typ', 'typs'],
            
            # Mots liés aux plannings
            'planning': ['planning', 'plannings', 'planing', 'planings'],
            'plannings': ['planning', 'plannings', 'planing', 'planings'],
        }
        
        # Correction des mots
        corrected_input = user_input
        words = corrected_input.split()
        
        for i, word in enumerate(words):
            word_lower = word.lower()
            # Supprimer la ponctuation pour la comparaison
            word_clean = ''.join(c for c in word_lower if c.isalnum())
            
            # Chercher une correction
            for correct_word, variations in corrections.items():
                if word_clean in variations:
                    # Préserver la casse originale
                    if word.isupper():
                        words[i] = correct_word.upper()
                    elif word.istitle():
                        words[i] = correct_word.title()
                    else:
                        words[i] = correct_word
                    break
        
        return ' '.join(words)
    
    def _is_general_question(self, user_input_lower):
        """
        Détermine si c'est une question générale (pas liée à l'application)
        """
        # Mots-clés qui indiquent une question générale
        general_keywords = [
            # Géographie
            'congo', 'gabon', 'france', 'afrique', 'europe', 'pays', 'ville', 'capitale',
            # Personnalité
            'qui es-tu', 'qui es tu', 'présente', 'raconte', 'ton nom', 'ton âge',
            # Questions personnelles
            'comment ça va', 'ça va', 'humeur', 'sentiment', 'comment tu te sens',
            # Salutations
            'bonjour', 'salut', 'hello', 'bonsoir', 'coucou', 'bonne nuit',
            # Questions générales
            'que peux-tu', 'que peux tu', 'que sais-tu', 'que sais tu', 'capable',
            'aide', 'help', 'conseil', 'suggestion',
            # Questions sur le monde
            'météo', 'temps', 'actualité', 'news', 'sport', 'musique', 'film',
            # Questions philosophiques
            'vie', 'mort', 'amour', 'bonheur', 'sens de la vie', 'philosophie'
        ]
        
        # Mots-clés qui indiquent clairement une question sur l'application
        app_keywords = [
            'projet', 'projets', 'tâche', 'taches', 'utilisateur', 'utilisateurs', 
            'équipe', 'team', 'marketing', 'campagne', 'document', 'documents',
            'statistique', 'statistiques', 'liste', 'afficher', 'montrer', 'voir',
            'combien', 'nombre', 'total', 'qui', 'quels', 'donne-moi', 'donne moi'
        ]
        
        # Vérifier si la question contient des mots-clés généraux
        has_general_keywords = any(keyword in user_input_lower for keyword in general_keywords)
        
        # Vérifier si c'est une question avec mots-clés liés à l'application
        has_app_keywords = any(keyword in user_input_lower for keyword in app_keywords)
        
        # Si c'est une question avec des mots-clés d'application, ce n'est PAS une question générale
        if has_app_keywords:
            return False
        
        # Si c'est une question générale ET qu'il n'y a pas de mots-clés d'application
        if has_general_keywords and not has_app_keywords:
            return True
        
        # Si c'est une question très courte sans contexte d'application
        if len(user_input_lower.split()) <= 3 and not has_app_keywords:
            return True
            
        return False
    
    def _analyze_urgency_context(self, user_input_lower, contexts):
        """Analyse spécifique pour les questions d'urgence"""
        logger.info("[Analyse Urgence] Analyse des projets/tâches urgents")
        
        # Vérifier s'il y a des projets dans la base
        try:
            total_projects = Projet.objects.count()
            if total_projects == 0:
                return "Aucun projet trouvé dans la base de données."
            
            # Analyser les projets urgents
            urgent_projects = Projet.objects.filter(
                statut='en_cours'
            ).order_by('-priorite', 'date_fin_prevue')[:5]
            
            if urgent_projects.exists():
                response = f"Projets urgents/prioritaires ({urgent_projects.count()} trouvés) :\n"
                for project in urgent_projects:
                    priority_emoji = "🔴" if project.priorite == 'haute' else "🟡" if project.priorite == 'moyenne' else "🟢"
                    response += f"{priority_emoji} {project.nom}\n"
                    if project.date_fin_prevue:
                        response += f"   📅 Échéance: {project.date_fin_prevue.strftime('%d/%m/%Y')}\n"
                    response += f"   👤 Responsable: {project.responsable.username if project.responsable else 'Non assigné'}\n\n"
                
                return response.strip()
            else:
                # Analyser les tâches urgentes si pas de projets urgents
                urgent_tasks = Tache.objects.filter(
                    statut='en_cours'
                ).order_by('-priorite', 'date_fin_prevue')[:5]
                
                if urgent_tasks.exists():
                    response = f"Tâches urgentes ({urgent_tasks.count()} trouvées) :\n"
                    for task in urgent_tasks:
                        priority_emoji = "🔴" if task.priorite == 'haute' else "🟡" if task.priorite == 'moyenne' else "🟢"
                        response += f"{priority_emoji} {task.nom}\n"
                        if task.projet:
                            response += f"   📋 Projet: {task.projet.nom}\n"
                        response += f"   👤 Responsable: {task.responsable.username if task.responsable else 'Non assigné'}\n\n"
                    
                    return response.strip()
                else:
                    return f"Sur {total_projects} projets au total, aucun n'est actuellement marqué comme urgent. Tous les projets semblent être dans un état stable."
                    
        except Exception as e:
            logger.error(f"[Analyse Urgence] Erreur: {e}")
            return None
    
    def _analyze_status_context(self, user_input_lower, contexts):
        """Analyse spécifique pour les questions de statut"""
        logger.info("[Analyse Statut] Analyse des statuts")
        
        try:
            if 'en attente' in user_input_lower or 'attente' in user_input_lower:
                return self.get_pending_projects()
            elif 'en cours' in user_input_lower or 'actif' in user_input_lower:
                return self.get_active_projects()
            elif 'terminé' in user_input_lower or 'fini' in user_input_lower:
                return self.get_completed_projects()
            else:
                return self.get_projects_stats()
        except Exception as e:
            logger.error(f"[Analyse Statut] Erreur: {e}")
            return None
    
    def _analyze_projects_context(self, user_input_lower, contexts):
        """Analyse spécifique pour les questions sur les projets"""
        logger.info(f"[Analyse Projets] Analyse des projets - Question: '{user_input_lower}'")
        
        try:
            # Questions sur les projets terminés
            if any(keyword in user_input_lower for keyword in ['terminés', 'terminé', 'terminées', 'terminée', 'fini', 'finis', 'finies', 'complété', 'complétés', 'complétées', 'complété']):
                logger.info("[Analyse Projets] Détection: projets terminés")
                return self.get_projects_by_status('termine')
            
            # Questions sur les projets en attente
            elif any(keyword in user_input_lower for keyword in ['en attente', 'attente', 'en attente de', 'en standby', 'standby']):
                logger.info("[Analyse Projets] Détection: projets en attente")
                return self.get_projects_by_status('en_attente')
            
            # Questions sur les projets hors délai
            elif any(keyword in user_input_lower for keyword in ['hors délai', 'hors delai', 'retard', 'retards', 'en retard']):
                logger.info("[Analyse Projets] Détection: projets hors délai")
                return self.get_projects_by_status('hors_delai')
            
            # Questions sur les projets rejetés
            elif any(keyword in user_input_lower for keyword in ['rejetés', 'rejeté', 'rejetées', 'rejetée', 'annulés', 'annulé', 'annulées', 'annulée']):
                logger.info("[Analyse Projets] Détection: projets rejetés")
                return self.get_projects_by_status('rejete')
            
            # Questions sur les projets prioritaires
            elif any(keyword in user_input_lower for keyword in ['prioritaires', 'prioritaire', 'priorité', 'priorités', 'urgents', 'urgent', 'urgentes', 'urgente', 'critiques', 'critique']):
                logger.info("[Analyse Projets] Détection: projets prioritaires")
                return self.get_projects_by_priority('haut')
            
            # Questions sur le nombre/quantité de projets
            elif any(keyword in user_input_lower for keyword in ['combien', 'nombre', 'total', 'quantité', 'combien de']):
                logger.info("[Analyse Projets] Détection: quantité de projets")
                return self.get_projects_stats()
            
            # Questions sur la liste des projets
            elif any(keyword in user_input_lower for keyword in ['liste', 'afficher', 'montrer', 'voir', 'quels sont', 'donne-moi']):
                logger.info("[Analyse Projets] Détection: liste des projets")
                return self.get_projects_list()
            
            # Par défaut, donner les statistiques
            else:
                logger.info("[Analyse Projets] Aucun mot-clé spécifique, retour des statistiques générales")
                return self.get_projects_stats()
                
        except Exception as e:
            logger.error(f"[Analyse Projets] Erreur: {e}")
            return self.get_projects_stats()
    
    def _analyze_tasks_context(self, user_input_lower, contexts):
        """Analyse spécifique pour les questions sur les tâches"""
        logger.info(f"[Analyse Tâches] Analyse des tâches - Question: '{user_input_lower}'")
        
        try:
            # Questions sur les tâches terminées
            if any(keyword in user_input_lower for keyword in ['terminées', 'terminée', 'terminés', 'terminé', 'fini', 'finies', 'finis', 'complété', 'complétées', 'complétés', 'complété']):
                logger.info("[Analyse Tâches] Détection: tâches terminées")
                return self.get_tasks_by_status('termine')
            
            # Questions sur les tâches en cours
            elif any(keyword in user_input_lower for keyword in ['en cours', 'cours', 'actives', 'active', 'en cours de', 'en réalisation', 'réalisation']):
                logger.info("[Analyse Tâches] Détection: tâches en cours")
                return self.get_tasks_by_status('en_cours')
            
            # Questions sur les tâches en attente
            elif any(keyword in user_input_lower for keyword in ['en attente', 'attente', 'en attente de', 'en standby', 'standby', 'bloquées', 'bloquée', 'bloqués', 'bloqué']):
                logger.info("[Analyse Tâches] Détection: tâches en attente")
                return self.get_tasks_by_status('en_attente')
            
            # Questions sur les tâches prioritaires
            elif any(keyword in user_input_lower for keyword in ['prioritaires', 'prioritaire', 'priorité', 'priorités', 'urgentes', 'urgente', 'urgents', 'urgent', 'critiques', 'critique']):
                logger.info("[Analyse Tâches] Détection: tâches prioritaires")
                return self.get_tasks_by_priority('haute')
            
            # Questions sur le nombre/quantité de tâches
            elif any(keyword in user_input_lower for keyword in ['combien', 'nombre', 'total', 'quantité', 'combien de']):
                logger.info("[Analyse Tâches] Détection: quantité de tâches")
                return self.get_tasks_stats()
            
            # Questions sur la liste des tâches
            elif any(keyword in user_input_lower for keyword in ['liste', 'afficher', 'montrer', 'voir', 'quelles sont', 'donne-moi']):
                logger.info("[Analyse Tâches] Détection: liste des tâches")
                return self.get_tasks_list()
            
            # Par défaut, donner les statistiques
            else:
                logger.info("[Analyse Tâches] Aucun mot-clé spécifique, retour des statistiques générales")
                return self.get_tasks_stats()
                
        except Exception as e:
            logger.error(f"[Analyse Tâches] Erreur: {e}")
        return self.get_tasks_stats()
    
    def _analyze_users_context(self, user_input_lower, contexts):
        """Analyse spécifique pour les questions sur les utilisateurs"""
        logger.info("[Analyse Utilisateurs] Analyse des utilisateurs")
        
        try:
            if 'liste' in user_input_lower or 'afficher' in user_input_lower or 'montrer' in user_input_lower or 'voir' in user_input_lower:
                return self.get_users_list()
            elif 'combien' in user_input_lower or 'nombre' in user_input_lower or 'total' in user_input_lower:
                return self.get_users_stats()
            else:
                return self.get_users_list()  # Par défaut, donner la liste
        except Exception as e:
            logger.error(f"[Analyse Utilisateurs] Erreur: {e}")
            return None

    def _analyze_users_tasks_context(self, user_input_lower, contexts):
        """Analyse spécifique pour les questions sur les utilisateurs avec leurs tâches"""
        logger.info("[Analyse Utilisateurs-Tâches] Analyse des utilisateurs avec leurs tâches")
        
        try:
            # Vérifier si la question demande spécifiquement les utilisateurs avec leurs tâches
            if any(keyword in user_input_lower for keyword in ['tache', 'taches', 'tâche', 'tâches', 'assigné', 'assignée', 'assignés', 'assignées', 'responsable', 'responsables']):
                return self.get_users_tasks_list()
            else:
                return self.get_users_tasks_list()  # Par défaut, donner la liste complète
        except Exception as e:
            logger.error(f"[Analyse Utilisateurs-Tâches] Erreur: {e}")
            return None

    def _analyze_teams_tasks_context(self, user_input_lower, contexts):
        """Analyse spécifique pour les questions sur les équipes avec leurs tâches"""
        logger.info(f"[Analyse Équipes-Tâches] Analyse des équipes avec leurs tâches - Question: '{user_input_lower}'")
        
        try:
            # Vérifier si la question demande spécifiquement les équipes avec leurs tâches
            if any(keyword in user_input_lower for keyword in ['equipe', 'équipe', 'equipes', 'équipes', 'tache', 'taches', 'tâche', 'tâches', 'membre', 'membres', 'collaborateur', 'collaborateurs']):
                logger.info("[Analyse Équipes-Tâches] Mots-clés détectés, appel de get_teams_tasks_list()")
                result = self.get_teams_tasks_list()
                logger.info(f"[Analyse Équipes-Tâches] Résultat: {result[:100] if result else 'None'}...")
                return result
            else:
                logger.info("[Analyse Équipes-Tâches] Aucun mot-clé spécifique, appel par défaut de get_teams_tasks_list()")
                result = self.get_teams_tasks_list()  # Par défaut, donner la liste complète
                logger.info(f"[Analyse Équipes-Tâches] Résultat par défaut: {result[:100] if result else 'None'}...")
                return result
        except Exception as e:
            logger.error(f"[Analyse Équipes-Tâches] Erreur: {e}")
            return None
    
    def _analyze_quantity_context(self, user_input_lower, contexts):
        """Analyse spécifique pour les questions de quantité"""
        logger.info("[Analyse Quantité] Analyse des quantités")
        
        try:
            if 'projet' in user_input_lower:
                return self.get_projects_stats()
            elif 'utilisateur' in user_input_lower or 'équipe' in user_input_lower:
                return self.get_users_stats()
            elif 'tâche' in user_input_lower or 'tache' in user_input_lower:
                return self.get_tasks_stats()
            else:
                return self.get_projects_stats()  # Par défaut
        except Exception as e:
            logger.error(f"[Analyse Quantité] Erreur: {e}")
            return None
    
    def _analyze_list_context(self, user_input_lower, contexts):
        """Analyse spécifique pour les demandes de liste"""
        logger.info("[Analyse Liste] Analyse des listes")
        
        try:
            if 'projet' in user_input_lower:
                if 'urgent' in user_input_lower:
                    return self.get_urgent_projects()
                elif 'récent' in user_input_lower:
                    return self.get_recent_projects()
                elif 'tout' in user_input_lower or 'tous' in user_input_lower or 'complet' in user_input_lower:
                    return self.get_all_projects()
                else:
                    return self.get_all_projects()  # Par défaut, montrer tous les projets
            else:
                return self.get_projects_stats()
        except Exception as e:
            logger.error(f"[Analyse Liste] Erreur: {e}")
            return None
    
    def _logical_deduction_analysis(self, user_input_lower):
        """Analyse par déduction logique basée sur les mots-clés"""
        logger.info("[Analyse Logique] Déduction logique")
        
        try:
            # Vérifier d'abord s'il y a des données
            total_projects = Projet.objects.count()
            if total_projects == 0:
                return "Aucun projet trouvé dans la base de données."
            
            # Déduction basée sur les mots-clés
            if any(word in user_input_lower for word in ['urgent', 'priorité', 'critique']):
                return self.get_urgent_projects()
            elif any(word in user_input_lower for word in ['combien', 'nombre', 'total']):
                return self.get_projects_stats()
            elif any(word in user_input_lower for word in ['liste', 'afficher', 'montrer']):
                if 'tout' in user_input_lower or 'tous' in user_input_lower:
                    return self.get_all_projects()
                else:
                    return self.get_all_projects()  # Par défaut, montrer tous les projets
            else:
                return self.get_projects_stats()
                
        except Exception as e:
            logger.error(f"[Analyse Logique] Erreur: {e}")
            return None

    def query_deepseek(self, prompt):
        """Appel à l'API DeepSeek"""
        api_key = os.getenv("DEEPSEEK_API_KEY")
        logger.info(f"[DeepSeek] Tentative d'appel avec clé API: {'Présente' if api_key else 'Absente'}")
        
        if not api_key:
            raise Exception("Clé API DeepSeek manquante. Veuillez configurer DEEPSEEK_API_KEY dans vos variables d'environnement.")

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        data = {
            "model": "deepseek-chat",
            "messages": [
                {
                    "role": "system",
                    "content": """Tu es Marketges IA, un assistant intelligent et humain spécialisé dans la gestion de projets marketing, mais capable de répondre à TOUTES les questions.

TON PERSONNALITÉ :
- Tu es chaleureux, intelligent et empathique
- Tu parles comme un vrai humain, pas comme un robot
- Tu utilises un langage naturel et conversationnel
- Tu es curieux et tu poses des questions de suivi
- Tu adaptes ton ton selon le contexte

TES COMPÉTENCES :
- Gestion de projets marketing chez GABON Telecom au Gabon (ton domaine d'expertise)
- Questions générales sur la vie, le travail, la technologie
- Conseils personnels et professionnels
- Discussions amicales et philosophiques
- Tu peux parler de tout avec intelligence et bienveillance
- Tu as maintenant accès à un système intelligent qui peut répondre automatiquement aux questions sur les données

TON STYLE DE RÉPONSE - RÈGLES STRICTES :
- INTERDICTION ABSOLUE d'utiliser des astérisques (*) ou tout formatage markdown
- INTERDICTION d'utiliser des tirets (-) pour les listes
- INTERDICTION d'utiliser des numéros (1., 2., etc.) pour les listes
- Utiliser UNIQUEMENT des emojis et du texte naturel
- Pour les listes, utiliser des tirets simples (-) ou des puces (•)
- Être naturel, chaleureux et humain
- Reformuler intelligemment les données brutes en réponses naturelles
- Si tu reçois des données de la base, les utiliser pour donner une réponse précise et engageante
- Toujours terminer par une question ou une invitation à continuer

EXEMPLES DE TON COMPORTEMENT :
- Pour une question marketing avec données : "Excellente question ! D'après votre base de données, voici ce que j'ai trouvé..."
- Pour une question générale : "Ah, c'est une question intéressante ! Laisse-moi te donner mon avis..."
- Pour une question personnelle : "Je comprends ta situation. Voici ce que je pense..."
- Toujours être bienveillant et constructif

FORMATAGE INTERDIT :
❌ *texte en gras*
❌ **texte en gras**
❌ - liste avec tirets
❌ 1. liste numérotée
✅ Texte naturel avec emojis
✅ • Liste avec puces simples"""
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7
        }

        try:
            logger.info(f"[DeepSeek] Envoi de la requête: {prompt[:100]}...")
            res = requests.post(
                "https://api.deepseek.com/v1/chat/completions", 
                headers=headers, 
                json=data, 
                timeout=30  # Augmenter le timeout à 30 secondes
            )
            res.raise_for_status()

            response_data = res.json()
            logger.info(f"[DeepSeek] Réponse reçue avec succès")
            raw_response = response_data["choices"][0]["message"]["content"]
            
            # Nettoyer la réponse des astérisques et formatage markdown
            cleaned_response = self.clean_markdown_formatting(raw_response)
            return cleaned_response
        except requests.exceptions.Timeout:
            logger.warning(f"[DeepSeek] Timeout de connexion (30s) - utilisation du fallback")
            raise Exception("Timeout de connexion à DeepSeek")
        except requests.exceptions.ConnectionError as e:
            logger.warning(f"[DeepSeek] Erreur de connexion - utilisation du fallback: {e}")
            raise Exception("Erreur de connexion à DeepSeek")
        except requests.exceptions.RequestException as e:
            logger.error(f"[DeepSeek] Erreur de requête: {e}")
            raise Exception(f"Erreur de requête DeepSeek: {e}")
        except Exception as e:
            logger.error(f"[DeepSeek] Erreur inattendue: {e}")
            raise Exception(f"Erreur DeepSeek: {e}")

    def clean_markdown_formatting(self, text):
        """Nettoie le formatage markdown des réponses DeepSeek"""
        import re
        
        # Supprimer les astérisques pour le gras
        text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)  # **texte** -> texte
        text = re.sub(r'\*(.*?)\*', r'\1', text)      # *texte* -> texte
        
        # Remplacer les listes numérotées par des puces
        text = re.sub(r'^\d+\.\s*', '• ', text, flags=re.MULTILINE)
        
        # Remplacer les tirets de liste par des puces
        text = re.sub(r'^-\s*', '• ', text, flags=re.MULTILINE)
        
        # Nettoyer les espaces multiples
        text = re.sub(r'\n\s*\n\s*\n', '\n\n', text)
        
        return text.strip()

    def get_fallback_response(self, user_input):
        """Réponse de fallback intelligente"""
        user_input_lower = user_input.lower()
        
        if any(word in user_input_lower for word in ['projet', 'projets', 'combien', 'nombre', 'total', 'statut', 'état']):
            return self.get_projects_stats()
        elif any(word in user_input_lower for word in ['utilisateur', 'utilisateurs', 'équipe', 'team', 'membre', 'membres', 'admin', 'administrateur']):
            return self.get_users_stats()
        elif any(word in user_input_lower for word in ['tâche', 'tâches', 'tache', 'taches', 'todo', 'todos', 'travail', 'travaux']):
            return self.get_tasks_stats()
        elif any(word in user_input_lower for word in ['phase', 'phases', 'étape', 'étapes', 'etape', 'etapes', 'avancement']):
            return self.get_phases_stats()
        elif any(word in user_input_lower for word in ['document', 'documents', 'fichier', 'fichiers']):
            return self.get_documents_stats()
        else:
            return "Je suis Marketges IA, votre assistant pour la gestion de projets marketing. Comment puis-je vous aider ?"

    def analyze_and_respond(self, user_input):
        """Analyser la question et répondre avec les données appropriées"""
        user_input_lower = user_input.lower()
        
        # Priorité 1: Questions sur les utilisateurs/équipe (très spécifique)
        if any(word in user_input_lower for word in ['utilisateur', 'utilisateurs', 'équipe', 'team', 'membre', 'membres', 'admin', 'administrateur', 'collaborateur']):
            if any(word in user_input_lower for word in ['liste', 'afficher', 'montrer', 'voir', 'donne-moi', 'donne moi']):
                return self.get_users_list()  # Nouvelle fonction pour liste détaillée
            else:
                return self.get_users_stats()
        
        # Priorité 2: Questions sur les documents (plus spécifique)
        elif any(word in user_input_lower for word in ['document', 'documents', 'fichier', 'fichiers', 'généré', 'genere', 'générés', 'generes']):
            # Si c'est combiné avec "projet", c'est une question sur les projets avec documents
            if any(word in user_input_lower for word in ['projet', 'projets', 'combien', 'nombre', 'qui ont', 'avec']):
                return self.get_projects_with_documents()
            else:
                return self.get_documents_stats()
        
        # Priorité 3: Questions spécifiques sur l'application (marketing/projets)
        elif any(word in user_input_lower for word in ['projet', 'projets', 'marketing', 'campagne', 'budget', 'planification']):
            if any(word in user_input_lower for word in ['urgent', 'urgence', 'priorité', 'prioritaire', 'critique', 'important']):
                return self.get_urgent_projects()
            elif any(word in user_input_lower for word in ['en attente', 'attente', 'en_attente', 'pending']):
                return self.get_pending_projects()
            elif any(word in user_input_lower for word in ['en cours', 'cours', 'en_cours', 'active', 'actif']):
                return self.get_active_projects()
            elif any(word in user_input_lower for word in ['terminé', 'termine', 'terminé', 'fini', 'complété']):
                return self.get_completed_projects()
            elif any(word in user_input_lower for word in ['combien', 'nombre', 'total', 'statut', 'état', 'statistique']):
                return self.get_projects_stats()
            elif any(word in user_input_lower for word in ['récent', 'dernier', 'nouveau']):
                return self.get_recent_projects()
            elif any(word in user_input_lower for word in ['liste', 'afficher', 'montrer', 'voir', 'donne-moi', 'donne moi']):
                if 'tout' in user_input_lower or 'tous' in user_input_lower:
                    return self.get_all_projects()
                else:
                    return self.get_all_projects()  # Par défaut, montrer tous les projets
            else:
                return self.get_projects_stats()
        
        # Questions sur les tâches
        elif any(word in user_input_lower for word in ['tâche', 'tâches', 'tache', 'taches', 'todo', 'todos', 'travail', 'travaux', 'activité']):
            return self.get_tasks_stats()
        
        # Questions sur les phases/étapes
        elif any(word in user_input_lower for word in ['phase', 'phases', 'étape', 'étapes', 'etape', 'etapes', 'avancement', 'processus']):
            return self.get_phases_stats()
        
        # Questions sur les services/rôles
        elif any(word in user_input_lower for word in ['service', 'services', 'rôle', 'role', 'rôles', 'roles', 'permission', 'permissions']):
            return self.get_services_stats()
        
        # Questions sur l'historique des documents
        elif any(word in user_input_lower for word in ['historique', 'historiques', 'modification', 'modifications', 'changement', 'changements']):
            return self.get_historique_stats()
        
        # Questions sur les commentaires
        elif any(word in user_input_lower for word in ['commentaire', 'commentaires', 'avis', 'feedback']):
            return self.get_commentaires_stats()
        
        # Questions sur l'aide/conseils marketing
        elif any(word in user_input_lower for word in ['aide', 'help', 'conseil', 'conseils', 'comment', 'pourquoi', 'quoi', 'suggestion']):
            return self.get_help_advice()
        
        # Questions sur les statistiques générales
        elif any(word in user_input_lower for word in ['statistique', 'statistiques', 'stats', 'résumé', 'resume', 'aperçu', 'apercu', 'vue d\'ensemble']):
            return self.get_general_stats()
        
        # Questions de salutation ou générales - ne pas retourner de données spécifiques
        elif any(word in user_input_lower for word in ['bonjour', 'salut', 'hello', 'bonsoir', 'coucou', 'qui es-tu', 'qui es tu', 'présente', 'raconte']):
            return None  # Laisser DeepSeek répondre naturellement
        
        # Questions personnelles ou générales - ne pas retourner de données spécifiques
        elif any(word in user_input_lower for word in ['comment ça va', 'ça va', 'humeur', 'sentiment', 'pense', 'avis', 'opinion']):
            return None  # Laisser DeepSeek répondre naturellement
        
        # Par défaut, ne pas forcer les données si ce n'est pas clairement lié à l'application
        else:
            return None

    def _analyze_budgets_context(self, user_input_lower, detected_contexts):
        """Analyser le contexte des budgets"""
        logger.info("[Analyse Budgets] Analyse des budgets des projets")
        
        try:
            if 'liste' in user_input_lower or 'afficher' in user_input_lower or 'montrer' in user_input_lower or 'voir' in user_input_lower:
                return self.get_projects_budgets_list()
            elif 'combien' in user_input_lower or 'total' in user_input_lower or 'somme' in user_input_lower:
                return self.get_budgets_summary()
            elif 'moyen' in user_input_lower or 'moyenne' in user_input_lower:
                return self.get_budgets_average()
            elif 'plus' in user_input_lower and ('élevé' in user_input_lower or 'haut' in user_input_lower):
                return self.get_highest_budget_projects()
            elif 'plus' in user_input_lower and ('bas' in user_input_lower or 'faible' in user_input_lower):
                return self.get_lowest_budget_projects()
            else:
                return self.get_projects_budgets_overview()
        except Exception as e:
            logger.error(f"[Analyse Budgets] Erreur: {e}")
            return None

    def _analyze_planning_context(self, user_input_lower, detected_contexts):
        """Analyser le contexte du planning"""
        logger.info("[Analyse Planning] Analyse du planning des projets")
        
        try:
            if 'début' in user_input_lower or 'commence' in user_input_lower:
                return self.get_projects_start_dates()
            elif 'fin' in user_input_lower or 'échéance' in user_input_lower:
                return self.get_projects_end_dates()
            elif 'durée' in user_input_lower or 'estimation' in user_input_lower:
                return self.get_projects_duration()
            elif 'en retard' in user_input_lower or 'retard' in user_input_lower:
                return self.get_delayed_projects()
            else:
                return self.get_projects_planning_overview()
        except Exception as e:
            logger.error(f"[Analyse Planning] Erreur: {e}")
            return None

    def _analyze_types_context(self, user_input_lower, detected_contexts):
        """Analyser le contexte des types de projets"""
        logger.info("[Analyse Types] Analyse des types de projets")
        
        try:
            if 'liste' in user_input_lower or 'afficher' in user_input_lower:
                return self.get_projects_types_list()
            elif 'combien' in user_input_lower or 'nombre' in user_input_lower:
                return self.get_projects_types_count()
            else:
                return self.get_projects_types_overview()
        except Exception as e:
            logger.error(f"[Analyse Types] Erreur: {e}")
            return None

    def _analyze_objectives_context(self, user_input_lower, detected_contexts):
        """Analyser le contexte des objectifs"""
        logger.info("[Analyse Objectifs] Analyse des objectifs des projets")
        
        try:
            if 'liste' in user_input_lower or 'afficher' in user_input_lower:
                return self.get_projects_objectives_list()
            else:
                return self.get_projects_objectives_overview()
        except Exception as e:
            logger.error(f"[Analyse Objectifs] Erreur: {e}")
            return None

    def _analyze_descriptions_context(self, user_input_lower, detected_contexts):
        """Analyser le contexte des descriptions"""
        logger.info("[Analyse Descriptions] Analyse des descriptions des projets")
        
        try:
            if 'liste' in user_input_lower or 'afficher' in user_input_lower:
                return self.get_projects_descriptions_list()
            else:
                return self.get_projects_descriptions_overview()
        except Exception as e:
            logger.error(f"[Analyse Descriptions] Erreur: {e}")
            return None

    def _analyze_risks_context(self, user_input_lower, detected_contexts):
        """Analyser le contexte des risques"""
        try:
            # Questions spécifiques sur les risques
            if 'retard' in user_input_lower or 'retards' in user_input_lower:
                return self._analyze_delay_risks()
            elif 'exposé' in user_input_lower or 'exposés' in user_input_lower:
                return self._analyze_exposed_projects()
            elif 'dépendance' in user_input_lower or 'dépendances' in user_input_lower:
                return self._analyze_dependency_risks()
            elif 'surcharge' in user_input_lower:
                return self._analyze_overload_risks()
            elif 'budget' in user_input_lower:
                return self._analyze_budget_risks()
            elif 'équipe' in user_input_lower or 'ressource' in user_input_lower:
                return self._analyze_team_risks()
            
            # Détecter si c'est une question sur un projet spécifique
            project_keywords = ['projet', 'campagne', 'initiative']
            project_name = None
            
            for keyword in project_keywords:
                if keyword in user_input_lower:
                    # Essayer d'extraire le nom du projet
                    words = user_input_lower.split()
                    for i, word in enumerate(words):
                        if keyword in word and i + 1 < len(words):
                            # Prendre le mot suivant comme nom de projet
                            potential_name = words[i + 1]
                            if len(potential_name) > 2:  # Éviter les mots trop courts
                                project_name = potential_name
                                break
            
            # Analyser les risques
            if project_name:
                return self.analyze_project_risks(project_name)
            else:
                return self.analyze_project_risks()  # Analyse générale
                
        except Exception as e:
            logger.error(f"Erreur analyse contexte risques : {e}")
            return None

    def _analyze_delay_risks(self):
        """Analyser les risques de retard"""
        try:
            projects = Projet.objects.filter(statut='en_cours')
            delay_risks = []
            
            for project in projects:
                delay_risk = self._check_delay_risk(project)
                if delay_risk:
                    delay_risk['project'] = project.nom
                    delay_risks.append(delay_risk)
            
            if not delay_risks:
                return "✅ Aucun risque de retard identifié sur les projets actifs."
            
            # Trier par criticité
            delay_risks.sort(key=lambda x: x['criticity_score'], reverse=True)
            
            response = f"⏰ Analyse des risques de retard ({len(delay_risks)} projets concernés)\n\n"
            
            for i, risk in enumerate(delay_risks[:5], 1):
                criticity_emoji = "🔴" if risk['criticity'] == "Élevé" else "🟡" if risk['criticity'] == "Moyen" else "🟢"
                response += f"{i}. {criticity_emoji} **{risk['project']}** ({risk['criticity']})\n"
                response += f"   📝 {risk['description']}\n"
                response += f"   💡 Solution : {risk['solution']}\n\n"
            
            return response.strip()
            
        except Exception as e:
            logger.error(f"Erreur analyse retards : {e}")
            return "Erreur lors de l'analyse des risques de retard."

    def _analyze_exposed_projects(self):
        """Analyser les projets les plus exposés aux risques"""
        try:
            projects = Projet.objects.filter(statut='en_cours')
            exposed_projects = []
            
            for project in projects:
                risk_count = 0
                risks = []
                
                # Compter les risques
                if self._check_delay_risk(project):
                    risk_count += 1
                    risks.append("Retard")
                if self._check_resource_risk(project):
                    risk_count += 1
                    risks.append("Ressources")
                if self._check_dependency_risk(project):
                    risk_count += 1
                    risks.append("Dépendances")
                if self._check_budget_risk(project):
                    risk_count += 1
                    risks.append("Budget")
                if self._check_team_risk(project):
                    risk_count += 1
                    risks.append("Équipe")
                
                if risk_count > 0:
                    exposed_projects.append({
                        'project': project.nom,
                        'risk_count': risk_count,
                        'risks': risks,
                        'avancement': project.avancement
                    })
            
            if not exposed_projects:
                return "✅ Aucun projet exposé aux risques identifié."
            
            # Trier par nombre de risques
            exposed_projects.sort(key=lambda x: x['risk_count'], reverse=True)
            
            response = f"⚠️ Projets les plus exposés aux risques ({len(exposed_projects)} projets)\n\n"
            
            for i, project in enumerate(exposed_projects[:5], 1):
                response += f"{i}. **{project['project']}** ({project['risk_count']} risques)\n"
                response += f"   📊 Avancement : {project['avancement']}%\n"
                response += f"   ⚠️ Risques : {', '.join(project['risks'])}\n\n"
            
            return response.strip()
            
        except Exception as e:
            logger.error(f"Erreur analyse projets exposés : {e}")
            return "Erreur lors de l'analyse des projets exposés."

    def _analyze_dependency_risks(self):
        """Analyser les risques de dépendances"""
        try:
            projects = Projet.objects.filter(statut='en_cours')
            dependency_risks = []
            
            for project in projects:
                dependency_risk = self._check_dependency_risk(project)
                if dependency_risk:
                    dependency_risk['project'] = project.nom
                    dependency_risks.append(dependency_risk)
            
            if not dependency_risks:
                return "✅ Aucun risque de dépendance identifié."
            
            response = f"🔗 Analyse des risques de dépendances ({len(dependency_risks)} projets)\n\n"
            
            for i, risk in enumerate(dependency_risks, 1):
                criticity_emoji = "🔴" if risk['criticity'] == "Élevé" else "🟡" if risk['criticity'] == "Moyen" else "🟢"
                response += f"{i}. {criticity_emoji} **{risk['project']}** ({risk['criticity']})\n"
                response += f"   📝 {risk['description']}\n"
                response += f"   💡 Solution : {risk['solution']}\n\n"
            
            return response.strip()
            
        except Exception as e:
            logger.error(f"Erreur analyse dépendances : {e}")
            return "Erreur lors de l'analyse des dépendances."

    def _analyze_overload_risks(self):
        """Analyser les risques de surcharge"""
        try:
            projects = Projet.objects.filter(statut='en_cours')
            overload_risks = []
            
            for project in projects:
                resource_risk = self._check_resource_risk(project)
                if resource_risk:
                    resource_risk['project'] = project.nom
                    overload_risks.append(resource_risk)
            
            if not overload_risks:
                return "✅ Aucun risque de surcharge identifié."
            
            response = f"⚖️ Analyse des risques de surcharge ({len(overload_risks)} projets)\n\n"
            
            for i, risk in enumerate(overload_risks, 1):
                criticity_emoji = "🔴" if risk['criticity'] == "Élevé" else "🟡" if risk['criticity'] == "Moyen" else "🟢"
                response += f"{i}. {criticity_emoji} **{risk['project']}** ({risk['criticity']})\n"
                response += f"   📝 {risk['description']}\n"
                response += f"   💡 Solution : {risk['solution']}\n\n"
            
            return response.strip()
            
        except Exception as e:
            logger.error(f"Erreur analyse surcharge : {e}")
            return "Erreur lors de l'analyse de la surcharge."

    def _analyze_budget_risks(self):
        """Analyser les risques budgétaires"""
        try:
            projects = Projet.objects.filter(statut='en_cours')
            budget_risks = []
            
            for project in projects:
                budget_risk = self._check_budget_risk(project)
                if budget_risk:
                    budget_risk['project'] = project.nom
                    budget_risks.append(budget_risk)
            
            if not budget_risks:
                return "✅ Aucun risque budgétaire identifié."
            
            response = f"💰 Analyse des risques budgétaires ({len(budget_risks)} projets)\n\n"
            
            for i, risk in enumerate(budget_risks, 1):
                criticity_emoji = "🔴" if risk['criticity'] == "Élevé" else "🟡" if risk['criticity'] == "Moyen" else "🟢"
                response += f"{i}. {criticity_emoji} **{risk['project']}** ({risk['criticity']})\n"
                response += f"   📝 {risk['description']}\n"
                response += f"   💡 Solution : {risk['solution']}\n\n"
            
            return response.strip()
            
        except Exception as e:
            logger.error(f"Erreur analyse budget : {e}")
            return "Erreur lors de l'analyse budgétaire."

    def _analyze_team_risks(self):
        """Analyser les risques d'équipe"""
        try:
            projects = Projet.objects.filter(statut='en_cours')
            team_risks = []
            
            for project in projects:
                team_risk = self._check_team_risk(project)
                if team_risk:
                    team_risk['project'] = project.nom
                    team_risks.append(team_risk)
            
            if not team_risks:
                return "✅ Aucun risque d'équipe identifié."
            
            response = f"👥 Analyse des risques d'équipe ({len(team_risks)} projets)\n\n"
            
            for i, risk in enumerate(team_risks, 1):
                criticity_emoji = "🔴" if risk['criticity'] == "Élevé" else "🟡" if risk['criticity'] == "Moyen" else "🟢"
                response += f"{i}. {criticity_emoji} **{risk['project']}** ({risk['criticity']})\n"
                response += f"   📝 {risk['description']}\n"
                response += f"   💡 Solution : {risk['solution']}\n\n"
            
            return response.strip()
            
        except Exception as e:
            logger.error(f"Erreur analyse équipe : {e}")
            return "Erreur lors de l'analyse des risques d'équipe."

    # ===== NOUVELLES FONCTIONS POUR LES BUDGETS =====
    
    def get_projects_budgets_overview(self):
        """Vue d'ensemble des budgets des projets"""
        try:
            projects = Projet.objects.all()
            if not projects.exists():
                return "Aucun projet trouvé dans la base de données."
            
            projects_with_budget = projects.exclude(budget__isnull=True).exclude(budget='')
            projects_without_budget = projects.filter(models.Q(budget__isnull=True) | models.Q(budget=''))
            
            response = f"""💰 Aperçu des budgets des projets

📊 Statistiques générales :
• Total des projets : {projects.count()}
• Projets avec budget défini : {projects_with_budget.count()}
• Projets sans budget : {projects_without_budget.count()}

📋 Projets avec budget :"""
            
            if projects_with_budget.exists():
                for project in projects_with_budget[:10]:  # Limiter à 10 pour éviter une réponse trop longue
                    response += f"\n• {project.nom} : {project.budget}"
            else:
                response += "\n• Aucun projet n'a de budget défini"
            
            if projects_without_budget.exists():
                response += f"\n\n⚠️ Projets sans budget ({projects_without_budget.count()}) :"
                for project in projects_without_budget[:5]:
                    response += f"\n• {project.nom}"
            
            return response.strip()
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des budgets : {e}")
            return "Impossible de récupérer les informations sur les budgets."

    def get_projects_budgets_list(self):
        """Liste détaillée des budgets des projets"""
        try:
            projects = Projet.objects.exclude(budget__isnull=True).exclude(budget='').order_by('nom')
            
            if not projects.exists():
                return "Aucun projet avec budget défini trouvé."
            
            response = f"💰 Liste des budgets des projets ({projects.count()} projets)\n\n"
            
            for project in projects:
                response += f"• {project.nom}\n"
                response += f"   💰 Budget : {project.budget}\n"
                response += f"   📊 Statut : {project.get_statut_display()}\n"
                response += f"   👤 Propriétaire : {project.proprietaire.username if project.proprietaire else 'Non assigné'}\n\n"
            
            return response.strip()
        except Exception as e:
            logger.error(f"Erreur lors de la récupération de la liste des budgets : {e}")
            return "Impossible de récupérer la liste des budgets."

    def get_budgets_summary(self):
        """Résumé des budgets"""
        try:
            projects = Projet.objects.exclude(budget__isnull=True).exclude(budget='')
            
            if not projects.exists():
                return "Aucun projet avec budget défini trouvé."
            
            # Essayer de convertir les budgets en nombres pour calculer des statistiques
            numeric_budgets = []
            text_budgets = []
            
            for project in projects:
                budget_str = str(project.budget).strip()
                # Essayer d'extraire des nombres du budget
                import re
                numbers = re.findall(r'[\d,.\s]+', budget_str)
                if numbers:
                    try:
                        # Nettoyer et convertir le premier nombre trouvé
                        clean_number = re.sub(r'[^\d.,]', '', numbers[0])
                        if clean_number:
                            # Remplacer les virgules par des points pour la conversion
                            clean_number = clean_number.replace(',', '.')
                            numeric_budgets.append(float(clean_number))
                            text_budgets.append(f"{project.nom}: {budget_str}")
                    except:
                        text_budgets.append(f"{project.nom}: {budget_str}")
                else:
                    text_budgets.append(f"{project.nom}: {budget_str}")
            
            response = f"💰 Résumé des budgets ({projects.count()} projets)\n\n"
            
            if numeric_budgets:
                total_budget = sum(numeric_budgets)
                avg_budget = total_budget / len(numeric_budgets)
                max_budget = max(numeric_budgets)
                min_budget = min(numeric_budgets)
                
                response += f"📊 Statistiques numériques :\n"
                response += f"• Budget total : {total_budget:,.2f}€\n"
                response += f"• Budget moyen : {avg_budget:,.2f}€\n"
                response += f"• Budget maximum : {max_budget:,.2f}€\n"
                response += f"• Budget minimum : {min_budget:,.2f}€\n\n"
            
            response += f"📋 Détail des budgets :\n"
            for budget_info in text_budgets[:10]:  # Limiter à 10
                response += f"• {budget_info}\n"
            
            if len(text_budgets) > 10:
                response += f"\n... et {len(text_budgets) - 10} autres projets"
            
            return response.strip()
        except Exception as e:
            logger.error(f"Erreur lors du calcul du résumé des budgets : {e}")
            return "Impossible de calculer le résumé des budgets."

    def get_highest_budget_projects(self):
        """Projets avec les budgets les plus élevés"""
        try:
            projects = Projet.objects.exclude(budget__isnull=True).exclude(budget='')
            
            if not projects.exists():
                return "Aucun projet avec budget défini trouvé."
            
            # Trier par budget (en supposant que les budgets sont des chaînes contenant des nombres)
            projects_list = []
            for project in projects:
                projects_list.append({
                    'project': project,
                    'budget_str': project.budget,
                    'budget_num': self._extract_budget_number(project.budget)
                })
            
            # Trier par budget numérique (descendant)
            projects_list.sort(key=lambda x: x['budget_num'], reverse=True)
            
            response = f"💰 Projets avec les budgets les plus élevés\n\n"
            
            for i, item in enumerate(projects_list[:5], 1):
                project = item['project']
                response += f"{i}. {project.nom}\n"
                response += f"   💰 Budget : {project.budget}\n"
                response += f"   📊 Statut : {project.get_statut_display()}\n"
                response += f"   👤 Propriétaire : {project.proprietaire.username if project.proprietaire else 'Non assigné'}\n\n"
            
            return response.strip()
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des projets avec budgets élevés : {e}")
            return "Impossible de récupérer les projets avec budgets élevés."

    def get_lowest_budget_projects(self):
        """Projets avec les budgets les plus bas"""
        try:
            projects = Projet.objects.exclude(budget__isnull=True).exclude(budget='')
            
            if not projects.exists():
                return "Aucun projet avec budget défini trouvé."
            
            # Trier par budget (en supposant que les budgets sont des chaînes contenant des nombres)
            projects_list = []
            for project in projects:
                projects_list.append({
                    'project': project,
                    'budget_str': project.budget,
                    'budget_num': self._extract_budget_number(project.budget)
                })
            
            # Trier par budget numérique (ascendant)
            projects_list.sort(key=lambda x: x['budget_num'])
            
            response = f"💰 Projets avec les budgets les plus bas\n\n"
            
            for i, item in enumerate(projects_list[:5], 1):
                project = item['project']
                response += f"{i}. {project.nom}\n"
                response += f"   💰 Budget : {project.budget}\n"
                response += f"   📊 Statut : {project.get_statut_display()}\n"
                response += f"   👤 Propriétaire : {project.proprietaire.username if project.proprietaire else 'Non assigné'}\n\n"
            
            return response.strip()
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des projets avec budgets bas : {e}")
            return "Impossible de récupérer les projets avec budgets bas."

    def _extract_budget_number(self, budget_str):
        """Extraire un nombre d'une chaîne de budget"""
        try:
            import re
            numbers = re.findall(r'[\d,.\s]+', str(budget_str))
            if numbers:
                clean_number = re.sub(r'[^\d.,]', '', numbers[0])
                if clean_number:
                    clean_number = clean_number.replace(',', '.')
                    return float(clean_number)
            return 0
        except:
            return 0

    # ===== FONCTIONS POUR LE PLANNING =====
    
    def get_projects_planning_overview(self):
        """Vue d'ensemble du planning des projets"""
        try:
            projects = Projet.objects.all()
            if not projects.exists():
                return "Aucun projet trouvé dans la base de données."
            
            projects_with_dates = projects.exclude(debut__isnull=True, fin__isnull=True)
            projects_without_dates = projects.filter(debut__isnull=True, fin__isnull=True)
            
            response = f"""📅 Aperçu du planning des projets

📊 Statistiques générales :
• Total des projets : {projects.count()}
• Projets avec dates définies : {projects_with_dates.count()}
• Projets sans dates : {projects_without_dates.count()}

📋 Projets avec planning :"""
            
            if projects_with_dates.exists():
                for project in projects_with_dates[:10]:
                    response += f"\n• {project.nom}"
                    if project.debut:
                        response += f" - Début : {project.debut.strftime('%d/%m/%Y')}"
                    if project.fin:
                        response += f" - Fin : {project.fin.strftime('%d/%m/%Y')}"
                    if project.estimation_jours:
                        response += f" - Durée : {project.estimation_jours} jours"
            else:
                response += "\n• Aucun projet n'a de dates définies"
            
            return response.strip()
        except Exception as e:
            logger.error(f"Erreur lors de la récupération du planning : {e}")
            return "Impossible de récupérer les informations de planning."

    def get_projects_start_dates(self):
        """Dates de début des projets"""
        try:
            projects = Projet.objects.exclude(debut__isnull=True).order_by('debut')
            
            if not projects.exists():
                return "Aucun projet avec date de début définie trouvé."
            
            response = f"📅 Dates de début des projets ({projects.count()} projets)\n\n"
            
            for project in projects:
                response += f"• {project.nom}\n"
                response += f"   📅 Début : {project.debut.strftime('%d/%m/%Y')}\n"
                response += f"   📊 Statut : {project.get_statut_display()}\n\n"
            
            return response.strip()
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des dates de début : {e}")
            return "Impossible de récupérer les dates de début."

    def get_projects_end_dates(self):
        """Dates de fin des projets"""
        try:
            projects = Projet.objects.exclude(fin__isnull=True).order_by('fin')
            
            if not projects.exists():
                return "Aucun projet avec date de fin définie trouvé."
            
            response = f"📅 Dates de fin des projets ({projects.count()} projets)\n\n"
            
            for project in projects:
                response += f"• {project.nom}\n"
                response += f"   📅 Fin : {project.fin.strftime('%d/%m/%Y')}\n"
                response += f"   📊 Statut : {project.get_statut_display()}\n\n"
            
            return response.strip()
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des dates de fin : {e}")
            return "Impossible de récupérer les dates de fin."

    def get_projects_duration(self):
        """Durée des projets"""
        try:
            projects = Projet.objects.exclude(estimation_jours__isnull=True)
            
            if not projects.exists():
                return "Aucun projet avec durée estimée trouvé."
            
            response = f"⏱️ Durée des projets ({projects.count()} projets)\n\n"
            
            for project in projects:
                response += f"• {project.nom}\n"
                response += f"   ⏱️ Durée estimée : {project.estimation_jours} jours\n"
                response += f"   📊 Statut : {project.get_statut_display()}\n\n"
            
            return response.strip()
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des durées : {e}")
            return "Impossible de récupérer les durées des projets."

    def get_delayed_projects(self):
        """Projets en retard"""
        try:
            from datetime import datetime, date
            today = date.today()
            
            # Projets avec date de fin dépassée et statut non terminé
            delayed_projects = Projet.objects.filter(
                fin__lt=today,
                statut__in=['en_attente', 'en_cours']
            )
            
            if not delayed_projects.exists():
                return "✅ Aucun projet en retard identifié."
            
            response = f"⚠️ Projets en retard ({delayed_projects.count()} projets)\n\n"
            
            for project in delayed_projects:
                days_late = (today - project.fin.date()).days
                response += f"• {project.nom}\n"
                response += f"   📅 Échéance : {project.fin.strftime('%d/%m/%Y')}\n"
                response += f"   ⚠️ Retard : {days_late} jours\n"
                response += f"   📊 Statut : {project.get_statut_display()}\n\n"
            
            return response.strip()
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des projets en retard : {e}")
            return "Impossible de récupérer les projets en retard."

    # ===== FONCTIONS POUR LES TYPES =====
    
    def get_projects_types_overview(self):
        """Vue d'ensemble des types de projets"""
        try:
            from django.db.models import Count
            types_count = Projet.objects.values('type').annotate(count=Count('id')).order_by('-count')
            
            if not types_count.exists():
                return "Aucun type de projet trouvé."
            
            response = f"📋 Types de projets\n\n"
            
            for type_info in types_count:
                response += f"• {type_info['type']} : {type_info['count']} projet{'s' if type_info['count'] > 1 else ''}\n"
            
            return response.strip()
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des types : {e}")
            return "Impossible de récupérer les types de projets."

    def get_projects_types_list(self):
        """Liste des types de projets avec détails"""
        try:
            from django.db.models import Count
            types_count = Projet.objects.values('type').annotate(count=Count('id')).order_by('-count')
            
            if not types_count.exists():
                return "Aucun type de projet trouvé."
            
            response = f"📋 Liste des types de projets\n\n"
            
            for type_info in types_count:
                response += f"📂 {type_info['type']} ({type_info['count']} projet{'s' if type_info['count'] > 1 else ''})\n"
                
                # Récupérer quelques exemples de projets de ce type
                examples = Projet.objects.filter(type=type_info['type'])[:3]
                for project in examples:
                    response += f"   • {project.nom} ({project.get_statut_display()})\n"
                
                if type_info['count'] > 3:
                    response += f"   ... et {type_info['count'] - 3} autres projets\n"
                response += "\n"
            
            return response.strip()
        except Exception as e:
            logger.error(f"Erreur lors de la récupération de la liste des types : {e}")
            return "Impossible de récupérer la liste des types."

    def get_projects_types_count(self):
        """Nombre de projets par type"""
        try:
            from django.db.models import Count
            types_count = Projet.objects.values('type').annotate(count=Count('id')).order_by('-count')
            
            if not types_count.exists():
                return "Aucun type de projet trouvé."
            
            total_projects = sum(item['count'] for item in types_count)
            
            response = f"📊 Nombre de projets par type ({total_projects} projets au total)\n\n"
            
            for type_info in types_count:
                percentage = (type_info['count'] / total_projects) * 100
                response += f"• {type_info['type']} : {type_info['count']} projet{'s' if type_info['count'] > 1 else ''} ({percentage:.1f}%)\n"
            
            return response.strip()
        except Exception as e:
            logger.error(f"Erreur lors du comptage des types : {e}")
            return "Impossible de compter les types de projets."

    # ===== FONCTIONS POUR LES OBJECTIFS =====
    
    def get_projects_objectives_overview(self):
        """Vue d'ensemble des objectifs des projets"""
        try:
            projects = Projet.objects.exclude(objectif__isnull=True).exclude(objectif='')
            
            if not projects.exists():
                return "Aucun projet avec objectif défini trouvé."
            
            response = f"🎯 Aperçu des objectifs des projets ({projects.count()} projets)\n\n"
            
            for project in projects[:10]:  # Limiter à 10
                response += f"• {project.nom}\n"
                # Tronquer l'objectif s'il est trop long
                objectif = project.objectif[:100] + "..." if len(project.objectif) > 100 else project.objectif
                response += f"   🎯 {objectif}\n\n"
            
            if projects.count() > 10:
                response += f"... et {projects.count() - 10} autres projets avec objectifs"
            
            return response.strip()
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des objectifs : {e}")
            return "Impossible de récupérer les objectifs des projets."

    def get_projects_objectives_list(self):
        """Liste détaillée des objectifs des projets"""
        try:
            projects = Projet.objects.exclude(objectif__isnull=True).exclude(objectif='').order_by('nom')
            
            if not projects.exists():
                return "Aucun projet avec objectif défini trouvé."
            
            response = f"🎯 Objectifs des projets ({projects.count()} projets)\n\n"
            
            for project in projects:
                response += f"📋 {project.nom}\n"
                response += f"   🎯 Objectif : {project.objectif}\n"
                response += f"   📊 Statut : {project.get_statut_display()}\n\n"
            
            return response.strip()
        except Exception as e:
            logger.error(f"Erreur lors de la récupération de la liste des objectifs : {e}")
            return "Impossible de récupérer la liste des objectifs."

    # ===== FONCTIONS POUR LES DESCRIPTIONS =====
    
    def get_projects_descriptions_overview(self):
        """Vue d'ensemble des descriptions des projets"""
        try:
            projects = Projet.objects.exclude(description__isnull=True).exclude(description='')
            
            if not projects.exists():
                return "Aucun projet avec description trouvé."
            
            response = f"📝 Aperçu des descriptions des projets ({projects.count()} projets)\n\n"
            
            for project in projects[:10]:  # Limiter à 10
                response += f"• {project.nom}\n"
                # Tronquer la description si elle est trop longue
                description = project.description[:150] + "..." if len(project.description) > 150 else project.description
                response += f"   📝 {description}\n\n"
            
            if projects.count() > 10:
                response += f"... et {projects.count() - 10} autres projets avec descriptions"
            
            return response.strip()
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des descriptions : {e}")
            return "Impossible de récupérer les descriptions des projets."

    def get_projects_descriptions_list(self):
        """Liste détaillée des descriptions des projets"""
        try:
            projects = Projet.objects.exclude(description__isnull=True).exclude(description='').order_by('nom')
            
            if not projects.exists():
                return "Aucun projet avec description trouvé."
            
            response = f"📝 Descriptions des projets ({projects.count()} projets)\n\n"
            
            for project in projects:
                response += f"📋 {project.nom}\n"
                response += f"   📝 Description : {project.description}\n"
                response += f"   📊 Statut : {project.get_statut_display()}\n\n"
            
            return response.strip()
        except Exception as e:
            logger.error(f"Erreur lors de la récupération de la liste des descriptions : {e}")
            return "Impossible de récupérer la liste des descriptions."

    def get_projects_stats(self):
        """Récupérer les statistiques des projets"""
        try:
            total_projects = Projet.objects.count()
            active_projects = Projet.objects.filter(statut='en_cours').count()
            completed_projects = Projet.objects.filter(statut='termine').count()
            pending_projects = Projet.objects.filter(statut='en_attente').count()
            
            recent_projects = Projet.objects.order_by('-cree_le')[:5]
            recent_list = []
            for project in recent_projects:
                recent_list.append(f"• {project.nom} ({project.statut})")
            
            return f"""📊 Statistiques des projets

📈 Aperçu général :
• Total des projets : {total_projects}
• Projets actifs : {active_projects}
• Projets terminés : {completed_projects}
• Projets en attente : {pending_projects}

📋 Projets récents :
{chr(10).join(recent_list)}"""
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des statistiques projets : {e}")
            return "Impossible de récupérer les statistiques des projets."
    
    def get_urgent_projects(self):
        """Récupérer les projets urgents/prioritaires"""
        try:
            # Projets en cours avec priorité élevée ou échéance proche
            urgent_projects = Projet.objects.filter(
                statut='en_cours'
            ).order_by('-priorite', 'date_fin_prevue')[:5]
            
            if not urgent_projects.exists():
                return "Aucun projet urgent trouvé actuellement."
            
            response = "🚨 Projets urgents/prioritaires\n\n"
            for project in urgent_projects:
                priority_text = "🔴 Très urgent" if project.priorite == 'haute' else "🟡 Urgent" if project.priorite == 'moyenne' else "🟢 Normal"
                response += f"• {project.nom} ({priority_text})\n"
                if project.date_fin_prevue:
                    response += f"   📅 Échéance : {project.date_fin_prevue.strftime('%d/%m/%Y')}\n"
                response += f"   👤 Responsable : {project.responsable.username if project.responsable else 'Non assigné'}\n\n"
            
            return response.strip()
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des projets urgents : {e}")
            return "Impossible de récupérer les projets urgents."
    
    def get_pending_projects(self):
        """Récupérer les projets en attente"""
        try:
            pending_projects = Projet.objects.filter(statut='en_attente').order_by('-cree_le')[:10]
            
            if not pending_projects.exists():
                return "Aucun projet en attente actuellement."
            
            response = f"⏳ Projets en attente ({pending_projects.count()})\n\n"
            for project in pending_projects:
                response += f"• {project.nom}\n"
                response += f"   📅 Créé le : {project.cree_le.strftime('%d/%m/%Y')}\n"
                response += f"   👤 Responsable : {project.responsable.username if project.responsable else 'Non assigné'}\n\n"
            
            return response.strip()
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des projets en attente : {e}")
            return "Impossible de récupérer les projets en attente."
    
    def get_active_projects(self):
        """Récupérer les projets actifs/en cours"""
        try:
            active_projects = Projet.objects.filter(statut='en_cours').order_by('-cree_le')[:10]
            
            if not active_projects.exists():
                return "Aucun projet actif actuellement."
            
            response = f"🚀 Projets actifs ({active_projects.count()})\n\n"
            for project in active_projects:
                response += f"• {project.nom}\n"
                if project.date_fin_prevue:
                    response += f"   📅 Échéance : {project.date_fin_prevue.strftime('%d/%m/%Y')}\n"
                response += f"   👤 Responsable : {project.responsable.username if project.responsable else 'Non assigné'}\n\n"
            
            return response.strip()
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des projets actifs : {e}")
            return "Impossible de récupérer les projets actifs."
    
    def get_completed_projects(self):
        """Récupérer les projets terminés"""
        try:
            completed_projects = Projet.objects.filter(statut='termine').order_by('-date_fin_reelle')[:10]
            
            if not completed_projects.exists():
                return "Aucun projet terminé récemment."
            
            response = f"✅ Projets terminés récemment ({completed_projects.count()})\n\n"
            for project in completed_projects:
                response += f"• {project.nom}\n"
                if project.date_fin_reelle:
                    response += f"   📅 Terminé le : {project.date_fin_reelle.strftime('%d/%m/%Y')}\n"
                response += f"   👤 Responsable : {project.responsable.username if project.responsable else 'Non assigné'}\n\n"
            
            return response.strip()
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des projets terminés : {e}")
            return "Impossible de récupérer les projets terminés."

    def get_users_stats(self):
        """Récupérer les statistiques des utilisateurs"""
        try:
            total_users = User.objects.count()
            active_users = User.objects.filter(is_active=True).count()
            admin_users = User.objects.filter(is_staff=True).count()
            
            return f"""👥 Statistiques des utilisateurs

📊 Aperçu général :
• Total des utilisateurs : {total_users}
• Utilisateurs actifs : {active_users}
• Administrateurs : {admin_users}"""
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des statistiques utilisateurs : {e}")
            return "Impossible de récupérer les statistiques des utilisateurs."
    
    def get_users_list(self):
        """Récupérer la liste détaillée des utilisateurs"""
        try:
            users = User.objects.all().order_by('username')
            
            if not users.exists():
                return "Aucun utilisateur trouvé dans la base de données."
            
            response = f"👥 Liste des utilisateurs ({users.count()})\n\n"
            
            for user in users:
                status_emoji = "🟢" if user.is_active else "🔴"
                admin_emoji = "👑" if user.is_staff else "👤"
                
                response += f"{status_emoji} {admin_emoji} {user.username}\n"
                if user.first_name or user.last_name:
                    full_name = f"{user.first_name} {user.last_name}".strip()
                    response += f"   📝 Nom complet : {full_name}\n"
                response += f"   📧 Email : {user.email}\n"
                response += f"   📅 Dernière connexion : {user.last_login.strftime('%d/%m/%Y %H:%M') if user.last_login else 'Jamais'}\n"
                response += f"   🏢 Service : {user.service.nom if hasattr(user, 'service') and user.service else 'Non assigné'}\n\n"
            
            return response.strip()
        except Exception as e:
            logger.error(f"Erreur lors de la récupération de la liste des utilisateurs : {e}")
            return "Impossible de récupérer la liste des utilisateurs."

    def get_tasks_stats(self):
        """Récupérer les statistiques des tâches"""
        try:
            total_tasks = Tache.objects.count()
            completed_tasks = Tache.objects.filter(statut='termine').count()
            pending_tasks = Tache.objects.filter(statut='en_attente').count()
            in_progress_tasks = Tache.objects.filter(statut='en_cours').count()
            
            return f"""📝 Statistiques des tâches

📊 Aperçu général :
• Total des tâches : {total_tasks}
• Tâches terminées : {completed_tasks}
• Tâches en attente : {pending_tasks}
• Tâches en cours : {in_progress_tasks}"""
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des statistiques tâches : {e}")
            return "Impossible de récupérer les statistiques des tâches."

    def get_phases_stats(self):
        """Récupérer les statistiques des phases"""
        try:
            total_phases = PhaseProjet.objects.count()
            return f"Total des phases de projet : {total_phases}"
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des statistiques phases : {e}")
            return "Impossible de récupérer les statistiques des phases."

    def get_documents_stats(self):
        """Récupérer les statistiques des documents"""
        try:
            if DocumentProjet is None:
                return "Module documents non disponible."
            total_docs = DocumentProjet.objects.count()
            return f"Total des documents : {total_docs}"
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des statistiques documents : {e}")
            return "Impossible de récupérer les statistiques des documents."

    def get_services_stats(self):
        """Statistiques des services et rôles"""
        try:
            if Service is None or Role is None or Permission is None:
                return "Module accounts non disponible."
            
            total_services = Service.objects.count() if Service else 0
            total_roles = Role.objects.count() if Role else 0
            total_permissions = Permission.objects.count() if Permission else 0
            
            response = f"🏢 Statistiques des services et rôles :\n\n"
            response += f"- Services : {total_services}\n"
            response += f"- Rôles : {total_roles}\n"
            response += f"- Permissions : {total_permissions}\n"
            
            return response
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des statistiques services : {e}")
            return "Impossible de récupérer les statistiques des services."

    def get_historique_stats(self):
        """Statistiques de l'historique des documents"""
        try:
            if HistoriqueDocumentProjet is None:
                return "Module historique des documents non disponible."
            
            total_historique = HistoriqueDocumentProjet.objects.count()
            recent_historique = HistoriqueDocumentProjet.objects.order_by('-date_action')[:5]
            
            response = f"📜 Statistiques de l'historique :\n\n"
            response += f"- Total des actions : {total_historique}\n\n"
            
            if recent_historique:
                response += f"Actions récentes :\n"
                for hist in recent_historique:
                    response += f"- {hist.get_action_display()} sur {hist.document.projet.nom}\n"
            
            return response
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des statistiques historique : {e}")
            return "Impossible de récupérer les statistiques de l'historique."

    def get_commentaires_stats(self):
        """Statistiques des commentaires"""
        try:
            if CommentaireDocumentProjet is None:
                return "Module commentaires non disponible."
            
            total_commentaires = CommentaireDocumentProjet.objects.count()
            recent_commentaires = CommentaireDocumentProjet.objects.order_by('-date_creation')[:5]
            
            response = f"💬 Statistiques des commentaires :\n\n"
            response += f"- Total des commentaires : {total_commentaires}\n\n"
            
            if recent_commentaires:
                response += f"Commentaires récents :\n"
                for comm in recent_commentaires:
                    response += f"- {comm.auteur.username} sur {comm.document.projet.nom}\n"
            
            return response
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des statistiques commentaires : {e}")
            return "Impossible de récupérer les statistiques des commentaires."

    def get_projects_with_documents(self):
        """Récupérer les projets qui ont des documents générés"""
        try:
            if DocumentProjet is None:
                return "Module documents non disponible."
            
            # Compter les projets qui ont des documents générés
            projects_with_docs = Projet.objects.filter(documents__origine='genere').distinct().count()
            total_projects = Projet.objects.count()
            
            # Récupérer la liste des projets avec documents générés
            projects_with_docs_list = Projet.objects.filter(documents__origine='genere').distinct()[:10]
            
            response = f"""📄 Projets avec documents générés :
- Nombre de projets avec documents générés : {projects_with_docs}
- Total des projets : {total_projects}
- Pourcentage : {(projects_with_docs/total_projects*100):.1f}% des projets ont des documents générés

📋 Liste des projets avec documents générés :"""
            
            if projects_with_docs_list:
                for project in projects_with_docs_list:
                    doc_count = project.documents.filter(origine='genere').count()
                    response += f"\n- {project.nom} ({doc_count} document{'s' if doc_count > 1 else ''} généré{'s' if doc_count > 1 else ''})"
            else:
                response += "\n- Aucun projet avec documents générés trouvé"
            
            return response
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des projets avec documents : {e}")
            return "Impossible de récupérer les informations sur les projets avec documents."

    def get_recent_projects(self):
        """Récupérer les projets récents (limité à 5)"""
        try:
            recent_projects = Projet.objects.order_by('-cree_le')[:5]
            if not recent_projects:
                return "Aucun projet récent trouvé."
            
            projects_list = []
            for project in recent_projects:
                status_emoji = "🚀" if project.statut == 'en_cours' else "⏳" if project.statut == 'en_attente' else "✅"
                projects_list.append(f"• {project.nom} {status_emoji} ({project.statut})")
            
            return f"📋 Projets récents\n\n{chr(10).join(projects_list)}"
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des projets récents : {e}")
            return "Impossible de récupérer les projets récents."

    def get_all_projects(self):
        """Récupérer TOUS les projets"""
        try:
            all_projects = Projet.objects.all().order_by('-cree_le')
            if not all_projects.exists():
                return "Aucun projet trouvé dans la base de données."
            
            projects_list = []
            for project in all_projects:
                status_emoji = "🚀" if project.statut == 'en_cours' else "⏳" if project.statut == 'en_attente' else "✅"
                projects_list.append(f"• {project.nom} {status_emoji} ({project.statut})")
            
            return f"📋 Liste complète de tous les projets ({all_projects.count()})\n\n{chr(10).join(projects_list)}"
        except Exception as e:
            logger.error(f"Erreur lors de la récupération de tous les projets : {e}")
            return "Impossible de récupérer la liste des projets."

    def get_general_stats(self):
        """Récupérer les statistiques générales"""
        try:
            total_projects = Projet.objects.count()
            total_users = User.objects.count()
            total_tasks = Tache.objects.count()
            
            return f"""📊 Aperçu général de votre plateforme

🎯 Résumé :
• {total_projects} projets
• {total_users} utilisateurs
• {total_tasks} tâches

🚀 Votre plateforme de gestion marketing est bien active !"""
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des statistiques générales : {e}")
            return "Impossible de récupérer les statistiques générales."

    def get_help_advice(self):
        """Fournir de l'aide et des conseils"""
        return """🤝 Voici comment je peux vous aider

🎯 Mes compétences :
• 📊 Statistiques : Informations sur vos projets, utilisateurs, tâches
• 📋 Projets : Détails sur vos projets en cours ou terminés
• 👥 Équipe : Informations sur votre équipe
• 📝 Tâches : Suivi de l'avancement de vos tâches
• 📄 Documents : Gestion de vos documents de projet
• ⚠️ Analyse des risques : Identification des risques et solutions

💡 Exemples de questions :
• "Combien de projets ai-je ?"
• "Liste mes projets récents"
• "Statistiques de mon équipe"
• "Quels sont les risques actuels du projet X ?"
• "Quels projets sont les plus exposés aux retards ?"
• "Analyse générale des risques"

Que souhaitez-vous savoir ? 😊"""

    def analyze_project_risks(self, project_name=None):
        """Analyser les risques d'un projet spécifique ou de tous les projets"""
        try:
            if project_name:
                return self._analyze_single_project_risks(project_name)
            else:
                return self._analyze_all_projects_risks()
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse des risques : {e}")
            return "Impossible d'analyser les risques actuellement."

    def _analyze_single_project_risks(self, project_name):
        """Analyser les risques d'un projet spécifique"""
        try:
            # Chercher le projet
            project = Projet.objects.filter(nom__icontains=project_name).first()
            if not project:
                return f"Projet '{project_name}' non trouvé."

            risks = []
            
            # 1. Risque de retard
            delay_risk = self._check_delay_risk(project)
            if delay_risk:
                risks.append(delay_risk)
            
            # 2. Risque de surcharge des ressources
            resource_risk = self._check_resource_risk(project)
            if resource_risk:
                risks.append(resource_risk)
            
            # 3. Risque de dépendances critiques
            dependency_risk = self._check_dependency_risk(project)
            if dependency_risk:
                risks.append(dependency_risk)
            
            # 4. Risque de budget
            budget_risk = self._check_budget_risk(project)
            if budget_risk:
                risks.append(budget_risk)
            
            # 5. Risque d'équipe
            team_risk = self._check_team_risk(project)
            if team_risk:
                risks.append(team_risk)

            if not risks:
                return f"✅ Projet '{project.nom}' : Aucun risque majeur identifié actuellement."

            # Trier par criticité
            risks.sort(key=lambda x: x['criticity_score'], reverse=True)
            
            response = f"⚠️ Analyse des risques - Projet '{project.nom}'\n\n"
            response += f"📊 Statut : {project.statut} | Avancement : {project.avancement}%\n\n"
            
            for i, risk in enumerate(risks[:5], 1):
                criticity_emoji = "🔴" if risk['criticity'] == "Élevé" else "🟡" if risk['criticity'] == "Moyen" else "🟢"
                response += f"{criticity_emoji} **{risk['title']}** ({risk['criticity']})\n"
                response += f"   📝 {risk['description']}\n"
                response += f"   💡 Solution : {risk['solution']}\n"
                response += f"   📈 Impact : {risk['impact']}\n\n"
            
            return response.strip()
            
        except Exception as e:
            logger.error(f"Erreur analyse projet spécifique : {e}")
            return "Erreur lors de l'analyse des risques du projet."

    def _analyze_all_projects_risks(self):
        """Analyser les risques de tous les projets actifs"""
        try:
            active_projects = Projet.objects.filter(statut='en_cours')
            if not active_projects.exists():
                return "Aucun projet actif à analyser."

            all_risks = []
            
            for project in active_projects:
                project_risks = []
                
                # Analyser chaque type de risque
                delay_risk = self._check_delay_risk(project)
                if delay_risk:
                    delay_risk['project'] = project.nom
                    project_risks.append(delay_risk)
                
                resource_risk = self._check_resource_risk(project)
                if resource_risk:
                    resource_risk['project'] = project.nom
                    project_risks.append(resource_risk)
                
                dependency_risk = self._check_dependency_risk(project)
                if dependency_risk:
                    dependency_risk['project'] = project.nom
                    project_risks.append(dependency_risk)
                
                budget_risk = self._check_budget_risk(project)
                if budget_risk:
                    budget_risk['project'] = project.nom
                    project_risks.append(budget_risk)
                
                team_risk = self._check_team_risk(project)
                if team_risk:
                    team_risk['project'] = project.nom
                    project_risks.append(team_risk)
                
                all_risks.extend(project_risks)

            if not all_risks:
                return "✅ Aucun risque majeur identifié sur les projets actifs."

            # Trier par criticité
            all_risks.sort(key=lambda x: x['criticity_score'], reverse=True)
            
            response = f"⚠️ Analyse générale des risques ({len(active_projects)} projets actifs)\n\n"
            response += f"🔍 **Top 5 des risques majeurs identifiés :**\n\n"
            
            for i, risk in enumerate(all_risks[:5], 1):
                criticity_emoji = "🔴" if risk['criticity'] == "Élevé" else "🟡" if risk['criticity'] == "Moyen" else "🟢"
                response += f"{i}. {criticity_emoji} **{risk['title']}** ({risk['criticity']})\n"
                response += f"   📋 Projet : {risk['project']}\n"
                response += f"   📝 {risk['description']}\n"
                response += f"   💡 Solution : {risk['solution']}\n\n"
            
            # Statistiques
            high_risks = len([r for r in all_risks if r['criticity'] == "Élevé"])
            medium_risks = len([r for r in all_risks if r['criticity'] == "Moyen"])
            low_risks = len([r for r in all_risks if r['criticity'] == "Faible"])
            
            response += f"📊 **Résumé des risques :**\n"
            response += f"• 🔴 Risques élevés : {high_risks}\n"
            response += f"• 🟡 Risques moyens : {medium_risks}\n"
            response += f"• 🟢 Risques faibles : {low_risks}\n"
            
            return response.strip()
            
        except Exception as e:
            logger.error(f"Erreur analyse générale : {e}")
            return "Erreur lors de l'analyse générale des risques."

    def _check_delay_risk(self, project):
        """Vérifier le risque de retard"""
        try:
            if not project.date_fin_prevue:
                return None
            
            from datetime import datetime, timedelta
            today = datetime.now().date()
            days_remaining = (project.date_fin_prevue - today).days
            
            # Calculer le risque basé sur l'avancement et le temps restant
            if project.avancement == 0:
                progress_risk = 1.0
            else:
                expected_progress = min(100, (today - project.cree_le.date()).days / (project.date_fin_prevue - project.cree_le.date()).days * 100)
                progress_risk = max(0, (expected_progress - project.avancement) / 100)
            
            if days_remaining < 0:
                # Projet en retard
                return {
                    'title': 'Retard confirmé',
                    'description': f'Le projet est en retard de {abs(days_remaining)} jours',
                    'criticity': 'Élevé',
                    'criticity_score': 3,
                    'solution': 'Réviser le planning et allouer plus de ressources',
                    'impact': 'Délai, coût, qualité'
                }
            elif days_remaining < 7 and progress_risk > 0.3:
                # Risque élevé de retard
                return {
                    'title': 'Risque de retard imminent',
                    'description': f'Seulement {days_remaining} jours restants avec {project.avancement}% d\'avancement',
                    'criticity': 'Élevé',
                    'criticity_score': 3,
                    'solution': 'Accélérer le développement et réviser les priorités',
                    'impact': 'Délai, stress équipe'
                }
            elif days_remaining < 14 and progress_risk > 0.2:
                # Risque moyen
                return {
                    'title': 'Risque de retard modéré',
                    'description': f'{days_remaining} jours restants, avancement en dessous des attentes',
                    'criticity': 'Moyen',
                    'criticity_score': 2,
                    'solution': 'Surveiller de près et ajuster si nécessaire',
                    'impact': 'Délai potentiel'
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Erreur vérification retard : {e}")
            return None

    def _check_resource_risk(self, project):
        """Vérifier le risque lié aux ressources"""
        try:
            # Vérifier les tâches du projet
            tasks = Tache.objects.filter(projet=project)
            if not tasks.exists():
                return None
            
            # Analyser la charge des responsables
            responsible_users = {}
            for task in tasks:
                if task.responsable:
                    if task.responsable.username not in responsible_users:
                        responsible_users[task.responsable.username] = []
                    responsible_users[task.responsable.username].append(task)
            
            # Identifier les surcharges
            overloaded_users = []
            for username, user_tasks in responsible_users.items():
                if len(user_tasks) > 5:  # Plus de 5 tâches
                    overloaded_users.append(username)
            
            if overloaded_users:
                return {
                    'title': 'Surcharge des ressources',
                    'description': f'Utilisateurs surchargés : {", ".join(overloaded_users)}',
                    'criticity': 'Moyen',
                    'criticity_score': 2,
                    'solution': 'Redistribuer les tâches ou ajouter des ressources',
                    'impact': 'Qualité, délai, stress équipe'
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Erreur vérification ressources : {e}")
            return None

    def _check_dependency_risk(self, project):
        """Vérifier le risque lié aux dépendances"""
        try:
            # Vérifier les tâches avec dépendances
            tasks = Tache.objects.filter(projet=project)
            dependency_risks = []
            
            for task in tasks:
                # Vérifier les tâches en retard qui pourraient bloquer
                if task.statut == 'en_attente':
                    blocking_tasks = Tache.objects.filter(
                        projet=project,
                        statut='en_cours',
                        date_fin_prevue__lt=task.date_debut_prevue
                    )
                    if blocking_tasks.exists():
                        dependency_risks.append(f"Tâche '{task.nom}' bloquée")
            
            if dependency_risks:
                return {
                    'title': 'Dépendances critiques',
                    'description': f'Dépendances bloquantes : {len(dependency_risks)} tâches affectées',
                    'criticity': 'Moyen',
                    'criticity_score': 2,
                    'solution': 'Réorganiser les priorités et débloquer les dépendances',
                    'impact': 'Délai, coordination'
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Erreur vérification dépendances : {e}")
            return None

    def _check_budget_risk(self, project):
        """Vérifier le risque budgétaire"""
        try:
            if not project.budget or project.budget <= 0:
                return None
            
            # Calculer le budget utilisé (estimation basée sur l'avancement)
            budget_used = (project.avancement / 100) * project.budget
            budget_remaining = project.budget - budget_used
            
            # Vérifier si le budget est dépassé ou à risque
            if budget_used > project.budget:
                return {
                    'title': 'Dépassement budgétaire',
                    'description': f'Budget dépassé de {budget_used - project.budget:.2f}€',
                    'criticity': 'Élevé',
                    'criticity_score': 3,
                    'solution': 'Réviser les coûts et demander un budget supplémentaire',
                    'impact': 'Coût, approbation'
                }
            elif budget_remaining < project.budget * 0.1:  # Moins de 10% restant
                return {
                    'title': 'Budget critique',
                    'description': f'Seulement {budget_remaining:.2f}€ restants ({budget_remaining/project.budget*100:.1f}%)',
                    'criticity': 'Moyen',
                    'criticity_score': 2,
                    'solution': 'Surveiller les coûts et optimiser les ressources',
                    'impact': 'Coût, qualité'
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Erreur vérification budget : {e}")
            return None

    def _check_team_risk(self, project):
        """Vérifier le risque lié à l'équipe"""
        try:
            # Vérifier si le responsable est actif
            if project.responsable and not project.responsable.is_active:
                return {
                    'title': 'Responsable inactif',
                    'description': f'Le responsable {project.responsable.username} est inactif',
                    'criticity': 'Élevé',
                    'criticity_score': 3,
                    'solution': 'Nommer un nouveau responsable ou réactiver le compte',
                    'impact': 'Gouvernance, délai'
                }
            
            # Vérifier les tâches sans responsable
            tasks = Tache.objects.filter(projet=project, responsable__isnull=True)
            if tasks.exists():
                return {
                    'title': 'Tâches non assignées',
                    'description': f'{tasks.count()} tâches sans responsable assigné',
                    'criticity': 'Moyen',
                    'criticity_score': 2,
                    'solution': 'Assigner des responsables à toutes les tâches',
                    'impact': 'Délai, qualité'
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Erreur vérification équipe : {e}")
            return None

    def get_users_tasks_list(self):
        """Récupérer la liste des utilisateurs avec leurs tâches respectives"""
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            # Récupérer toutes les tâches avec leurs utilisateurs assignés
            all_tasks = Tache.objects.select_related('projet').prefetch_related('assigne_a').all()
            
            if not all_tasks.exists():
                return "Aucune tâche trouvée dans le système."
            
            # Grouper les tâches par utilisateur
            users_tasks = {}
            unassigned_tasks = []
            
            for task in all_tasks:
                assignes = task.assigne_a.all()
                if assignes.exists():
                    # Ajouter la tâche à chaque utilisateur assigné
                    for user in assignes:
                        if user not in users_tasks:
                            users_tasks[user] = []
                        users_tasks[user].append(task)
                else:
                    unassigned_tasks.append(task)
            
            users_info = []
            
            # Afficher les utilisateurs avec leurs tâches
            for user, tasks in users_tasks.items():
                user_info = f"**👤 {user.get_full_name() or user.username}** ({user.email})\n"
                user_info += f"📊 **{len(tasks)} tâche(s) assignée(s)**\n"
                
                for task in tasks:
                    user_info += f"  • **{task.titre}**\n"
                    user_info += f"    - Projet: {task.projet.nom} ({task.projet.code})\n"
                    user_info += f"    - Statut: {task.get_statut_display()}\n"
                    user_info += f"    - Priorité: {task.get_priorite_display()}\n"
                    user_info += f"    - Phase: {task.get_phase_display()}\n"
                    if task.debut and task.fin:
                        user_info += f"    - Période: {task.debut.strftime('%d/%m/%Y')} - {task.fin.strftime('%d/%m/%Y')}\n"
                    user_info += "\n"
                
                users_info.append(user_info)
            
            # Ajouter les tâches non assignées
            if unassigned_tasks:
                unassigned_info = f"**⚠️ Tâches non assignées ({len(unassigned_tasks)})**\n"
                for task in unassigned_tasks:
                    unassigned_info += f"  • **{task.titre}** - {task.projet.nom} ({task.get_statut_display()})\n"
                users_info.append(unassigned_info)
            
            if not users_info:
                return "Aucun utilisateur avec des tâches assignées trouvé."
            
            return f"**Liste des utilisateurs avec leurs tâches :**\n\n" + "\n\n".join(users_info)
            
        except Exception as e:
            logger.error(f"Erreur récupération utilisateurs-tâches: {e}")
            return None

    def get_teams_tasks_list(self):
        """Récupérer la liste des équipes avec leurs tâches respectives"""
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            from projects.models import MembreProjet
            
            # Récupérer tous les projets avec leurs membres
            projets_with_members = Projet.objects.prefetch_related('membres__utilisateur', 'taches__assigne_a').all()
            
            if not projets_with_members.exists():
                return "Aucun projet trouvé dans le système."
            
            teams_info = []
            has_teams_with_members = False
            
            # 1. Essayer d'abord avec les équipes formelles (membres de projet)
            for projet in projets_with_members:
                # Récupérer les membres de l'équipe
                membres = projet.membres.all()
                
                if not membres.exists():
                    continue
                
                has_teams_with_members = True
                projet_info = f"**🏢 Équipe du projet: {projet.nom} ({projet.code})**\n"
                projet_info += f"📋 **{membres.count()} membre(s) dans l'équipe**\n\n"
                
                # Pour chaque membre, récupérer ses tâches dans ce projet
                for membre in membres:
                    user = membre.utilisateur
                    user_tasks = projet.taches.filter(assigne_a=user)
                    
                    membre_info = f"  **👤 {user.get_full_name() or user.username}**\n"
                    membre_info += f"    - Rôle: {membre.role_projet}\n"
                    membre_info += f"    - Service: {membre.service.nom if membre.service else 'Non défini'}\n"
                    membre_info += f"    - Tâches assignées: {user_tasks.count()}\n"
                    
                    if user_tasks.exists():
                        for task in user_tasks:
                            membre_info += f"      • **{task.titre}**\n"
                            membre_info += f"        - Statut: {task.get_statut_display()}\n"
                            membre_info += f"        - Priorité: {task.get_priorite_display()}\n"
                            membre_info += f"        - Phase: {task.get_phase_display()}\n"
                            if task.debut and task.fin:
                                membre_info += f"        - Période: {task.debut.strftime('%d/%m/%Y')} - {task.fin.strftime('%d/%m/%Y')}\n"
                    else:
                        membre_info += f"      Aucune tâche assignée dans ce projet.\n"
                    
                    membre_info += "\n"
                    projet_info += membre_info
                
                # Ajouter les tâches non assignées dans ce projet
                unassigned_tasks = projet.taches.filter(assigne_a__isnull=True)
                if unassigned_tasks.exists():
                    projet_info += f"  **⚠️ Tâches non assignées dans ce projet ({unassigned_tasks.count()})**\n"
                    for task in unassigned_tasks:
                        projet_info += f"    • **{task.titre}** ({task.get_statut_display()})\n"
                    projet_info += "\n"
                
                teams_info.append(projet_info)
            
            # 2. Si aucune équipe formelle n'est trouvée, créer des équipes basées sur les tâches assignées
            if not has_teams_with_members:
                logger.info("[Équipes] Aucune équipe formelle trouvée, création d'équipes basées sur les tâches")
                
                # Récupérer tous les utilisateurs qui ont des tâches assignées
                users_with_tasks = User.objects.filter(taches_assignees__isnull=False).distinct()
                
                if users_with_tasks.exists():
                    teams_info.append("**🏢 Équipes basées sur les tâches assignées :**\n")
                    teams_info.append("*Note: Aucune équipe formelle n'est définie dans les projets. Voici les équipes basées sur les tâches assignées :*\n")
                    
                    for user in users_with_tasks:
                        user_tasks = Tache.objects.filter(assigne_a=user).select_related('projet').prefetch_related('assigne_a')
                        
                        user_info = f"**👤 Équipe de {user.get_full_name() or user.username}**\n"
                        user_info += f"📧 Email: {user.email}\n"
                        user_info += f"📊 **{user_tasks.count()} tâche(s) assignée(s)**\n\n"
                        
                        # Grouper les tâches par projet
                        tasks_by_project = {}
                        for task in user_tasks:
                            if task.projet not in tasks_by_project:
                                tasks_by_project[task.projet] = []
                            tasks_by_project[task.projet].append(task)
                        
                        for projet, tasks in tasks_by_project.items():
                            user_info += f"  **📋 Projet: {projet.nom} ({projet.code})**\n"
                            for task in tasks:
                                user_info += f"    • **{task.titre}**\n"
                                user_info += f"      - Statut: {task.get_statut_display()}\n"
                                user_info += f"      - Priorité: {task.get_priorite_display()}\n"
                                user_info += f"      - Phase: {task.get_phase_display()}\n"
                                if task.debut and task.fin:
                                    user_info += f"      - Période: {task.debut.strftime('%d/%m/%Y')} - {task.fin.strftime('%d/%m/%Y')}\n"
                            user_info += "\n"
                        
                        teams_info.append(user_info)
                    
                    # Ajouter les tâches non assignées
                    unassigned_tasks = Tache.objects.filter(assigne_a__isnull=True)
                    if unassigned_tasks.exists():
                        unassigned_info = f"**⚠️ Tâches non assignées ({unassigned_tasks.count()})**\n"
                        for task in unassigned_tasks:
                            unassigned_info += f"  • **{task.titre}** - {task.projet.nom} ({task.get_statut_display()})\n"
                        teams_info.append(unassigned_info)
                else:
                    return "Aucune équipe trouvée dans le système. Aucun utilisateur n'a de tâches assignées."
            
            if not teams_info:
                return "Aucune équipe trouvée dans le système."
            
            return f"**Liste des équipes avec leurs tâches :**\n\n" + "\n\n".join(teams_info)
            
        except Exception as e:
            logger.error(f"Erreur récupération équipes-tâches: {e}")
            return None

    def get_tasks_by_status(self, status):
        """Récupérer les tâches par statut"""
        try:
            # Mapping des statuts (basé sur le modèle Tache et l'interface)
            status_mapping = {
                'termine': 'termine',
                'en_attente': 'en_attente',
                'en_cours': 'en_attente',  # L'interface a "En cours" mais le modèle utilise "en_attente"
                'hors_delai': 'hors_delai',
                'rejete': 'rejete'
            }
            
            if status not in status_mapping:
                return f"Statut '{status}' non reconnu."
            
            # Récupérer les tâches avec ce statut
            tasks = Tache.objects.filter(statut=status_mapping[status]).select_related('projet').prefetch_related('assigne_a')
            
            if not tasks.exists():
                status_display = {
                    'termine': 'terminées',
                    'en_attente': 'en attente',
                    'en_cours': 'en cours',
                    'hors_delai': 'hors délai',
                    'rejete': 'rejetées'
                }
                return f"Aucune tâche {status_display.get(status, status)} trouvée."
            
            tasks_info = []
            for task in tasks:
                task_info = f"**📋 {task.titre}**\n"
                task_info += f"  - Projet: {task.projet.nom} ({task.projet.code})\n"
                task_info += f"  - Statut: {task.get_statut_display()}\n"
                task_info += f"  - Priorité: {task.get_priorite_display()}\n"
                task_info += f"  - Phase: {task.get_phase_display()}\n"
                assignes = task.assigne_a.all()
                if assignes.exists():
                    assignes_noms = ', '.join([assigne.get_full_name() or assigne.username for assigne in assignes])
                    task_info += f"  - Assigné à: {assignes_noms}\n"
                else:
                    task_info += f"  - Assigné à: Non assigné\n"
                if task.debut and task.fin:
                    task_info += f"  - Période: {task.debut.strftime('%d/%m/%Y')} - {task.fin.strftime('%d/%m/%Y')}\n"
                tasks_info.append(task_info)
            
            status_display = {
                'termine': 'terminées',
                'en_attente': 'en attente',
                'en_cours': 'en cours',
                'hors_delai': 'hors délai',
                'rejete': 'rejetées'
            }
            
            return f"**Tâches {status_display.get(status, status)} ({tasks.count()}) :**\n\n" + "\n".join(tasks_info)
            
        except Exception as e:
            logger.error(f"Erreur récupération tâches par statut: {e}")
            return None

    def get_tasks_by_priority(self, priority):
        """Récupérer les tâches par priorité"""
        try:
            # Mapping des priorités (basé sur le modèle Tache et l'interface)
            priority_mapping = {
                'haute': 'haut',
                'haut': 'haut',
                'moyenne': 'moyen',
                'moyen': 'moyen',
                'intermediaire': 'intermediaire',
                'intermédiaire': 'intermediaire',
                'basse': 'bas',
                'bas': 'bas'
            }
            
            if priority not in priority_mapping:
                return f"Priorité '{priority}' non reconnue."
            
            # Récupérer les tâches avec cette priorité
            tasks = Tache.objects.filter(priorite=priority_mapping[priority]).select_related('projet').prefetch_related('assigne_a')
            
            if not tasks.exists():
                priority_display = {
                    'haute': 'haute',
                    'haut': 'haute',
                    'moyenne': 'moyenne',
                    'moyen': 'moyenne',
                    'intermediaire': 'intermédiaire',
                    'intermédiaire': 'intermédiaire',
                    'basse': 'basse',
                    'bas': 'basse'
                }
                return f"Aucune tâche avec priorité {priority_display.get(priority, priority)} trouvée."
            
            tasks_info = []
            for task in tasks:
                task_info = f"**📋 {task.titre}**\n"
                task_info += f"  - Projet: {task.projet.nom} ({task.projet.code})\n"
                task_info += f"  - Statut: {task.get_statut_display()}\n"
                task_info += f"  - Priorité: {task.get_priorite_display()}\n"
                task_info += f"  - Phase: {task.get_phase_display()}\n"
                assignes = task.assigne_a.all()
                if assignes.exists():
                    assignes_noms = ', '.join([assigne.get_full_name() or assigne.username for assigne in assignes])
                    task_info += f"  - Assigné à: {assignes_noms}\n"
                else:
                    task_info += f"  - Assigné à: Non assigné\n"
                if task.debut and task.fin:
                    task_info += f"  - Période: {task.debut.strftime('%d/%m/%Y')} - {task.fin.strftime('%d/%m/%Y')}\n"
                tasks_info.append(task_info)
            
            priority_display = {
                'haute': 'haute',
                'haut': 'haute',
                'moyenne': 'moyenne',
                'moyen': 'moyenne',
                'intermediaire': 'intermédiaire',
                'intermédiaire': 'intermédiaire',
                'basse': 'basse',
                'bas': 'basse'
            }
            
            return f"**Tâches avec priorité {priority_display.get(priority, priority)} ({tasks.count()}) :**\n\n" + "\n".join(tasks_info)
            
        except Exception as e:
            logger.error(f"Erreur récupération tâches par priorité: {e}")
            return None

    def get_tasks_list(self):
        """Récupérer la liste complète des tâches"""
        try:
            # Récupérer toutes les tâches
            tasks = Tache.objects.select_related('projet').prefetch_related('assigne_a').all()
            
            if not tasks.exists():
                return "Aucune tâche trouvée dans le système."
            
            tasks_info = []
            for task in tasks:
                task_info = f"**📋 {task.titre}**\n"
                task_info += f"  - Projet: {task.projet.nom} ({task.projet.code})\n"
                task_info += f"  - Statut: {task.get_statut_display()}\n"
                task_info += f"  - Priorité: {task.get_priorite_display()}\n"
                task_info += f"  - Phase: {task.get_phase_display()}\n"
                assignes = task.assigne_a.all()
                if assignes.exists():
                    assignes_noms = ', '.join([assigne.get_full_name() or assigne.username for assigne in assignes])
                    task_info += f"  - Assigné à: {assignes_noms}\n"
                else:
                    task_info += f"  - Assigné à: Non assigné\n"
                if task.debut and task.fin:
                    task_info += f"  - Période: {task.debut.strftime('%d/%m/%Y')} - {task.fin.strftime('%d/%m/%Y')}\n"
                tasks_info.append(task_info)
            
            return f"**Liste complète des tâches ({tasks.count()}) :**\n\n" + "\n".join(tasks_info)
            
        except Exception as e:
            logger.error(f"Erreur récupération liste des tâches: {e}")
            return None

    def get_projects_by_status(self, status):
        """Récupérer les projets par statut"""
        try:
            # Mapping des statuts (basé sur le modèle Projet)
            status_mapping = {
                'termine': 'termine',
                'en_attente': 'en_attente',
                'hors_delai': 'hors_delai',
                'rejete': 'rejete'
            }
            
            if status not in status_mapping:
                return f"Statut '{status}' non reconnu."
            
            # Récupérer les projets avec ce statut
            projects = Projet.objects.filter(statut=status_mapping[status]).select_related('proprietaire')
            
            if not projects.exists():
                status_display = {
                    'termine': 'terminés',
                    'en_attente': 'en attente',
                    'hors_delai': 'hors délai',
                    'rejete': 'rejetés'
                }
                return f"Aucun projet {status_display.get(status, status)} trouvé."
            
            projects_info = []
            for project in projects:
                project_info = f"**📋 {project.nom} ({project.code})**\n"
                project_info += f"  - Statut: {project.get_statut_display()}\n"
                project_info += f"  - Priorité: {project.get_priorite_display()}\n"
                project_info += f"  - État: {project.get_etat_display()}\n"
                project_info += f"  - Propriétaire: {project.proprietaire.get_full_name() or project.proprietaire.username}\n"
                if project.debut and project.fin:
                    project_info += f"  - Période: {project.debut.strftime('%d/%m/%Y')} - {project.fin.strftime('%d/%m/%Y')}\n"
                if project.budget:
                    project_info += f"  - Budget: {project.budget}\n"
                projects_info.append(project_info)
            
            status_display = {
                'termine': 'terminés',
                'en_attente': 'en attente',
                'hors_delai': 'hors délai',
                'rejete': 'rejetés'
            }
            
            return f"**Projets {status_display.get(status, status)} ({projects.count()}) :**\n\n" + "\n".join(projects_info)
            
        except Exception as e:
            logger.error(f"Erreur récupération projets par statut: {e}")
            return None

    def get_projects_by_priority(self, priority):
        """Récupérer les projets par priorité"""
        try:
            # Mapping des priorités (basé sur le modèle Projet)
            priority_mapping = {
                'haut': 'haut',
                'moyen': 'moyen',
                'intermediaire': 'intermediaire',
                'bas': 'bas'
            }
            
            if priority not in priority_mapping:
                return f"Priorité '{priority}' non reconnue."
            
            # Récupérer les projets avec cette priorité
            projects = Projet.objects.filter(priorite=priority_mapping[priority]).select_related('proprietaire')
            
            if not projects.exists():
                priority_display = {
                    'haut': 'haute',
                    'moyen': 'moyenne',
                    'intermediaire': 'intermédiaire',
                    'bas': 'basse'
                }
                return f"Aucun projet avec priorité {priority_display.get(priority, priority)} trouvé."
            
            projects_info = []
            for project in projects:
                project_info = f"**📋 {project.nom} ({project.code})**\n"
                project_info += f"  - Statut: {project.get_statut_display()}\n"
                project_info += f"  - Priorité: {project.get_priorite_display()}\n"
                project_info += f"  - État: {project.get_etat_display()}\n"
                project_info += f"  - Propriétaire: {project.proprietaire.get_full_name() or project.proprietaire.username}\n"
                if project.debut and project.fin:
                    project_info += f"  - Période: {project.debut.strftime('%d/%m/%Y')} - {project.fin.strftime('%d/%m/%Y')}\n"
                if project.budget:
                    project_info += f"  - Budget: {project.budget}\n"
                projects_info.append(project_info)
            
            priority_display = {
                'haut': 'haute',
                'moyen': 'moyenne',
                'intermediaire': 'intermédiaire',
                'bas': 'basse'
            }
            
            return f"**Projets avec priorité {priority_display.get(priority, priority)} ({projects.count()}) :**\n\n" + "\n".join(projects_info)
            
        except Exception as e:
            logger.error(f"Erreur récupération projets par priorité: {e}")
            return None

    def get_detailed_project_info(self, project_name=None):
        """Récupérer des informations détaillées sur un projet"""
        try:
            if project_name:
                projects = Projet.objects.filter(nom__icontains=project_name)
            else:
                projects = Projet.objects.all()[:3]
            
            if not projects:
                return "Aucun projet trouvé."
            
            details = []
            for project in projects:
                details.append(f"""Projet : {project.nom}
- Statut : {project.statut}
- Description : {project.description[:100] if project.description else 'Aucune description'}""")
            
            return "\n\n".join(details)
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des détails projet : {e}")
            return "Impossible de récupérer les détails du projet."

    def reformulate_response_intelligently(self, data_response, user_input):
        """Reformuler intelligemment une réponse basée sur les données"""
        user_input_lower = user_input.lower()
        
        if 'projet' in user_input_lower and 'récent' in user_input_lower:
            return self.reformulate_recent_response(data_response, user_input)
        elif any(word in user_input_lower for word in ['document', 'documents', 'fichier', 'généré', 'genere']):
            return self.reformulate_documents_response(data_response, user_input)
        elif any(word in user_input_lower for word in ['aide', 'help', 'conseil']):
            return self.reformulate_help_response(data_response, user_input)
        elif any(word in user_input_lower for word in ['statistique', 'stats', 'combien']):
            return self.reformulate_stats_response(data_response, user_input)
        else:
            return self.reformulate_general_response(data_response, user_input)

    def reformulate_stats_response(self, data_response, user_input):
        """Reformuler une réponse de statistiques"""
        return f"""📊 Voici les informations que vous cherchez :

{data_response}

Ces données vous donnent une vue d'ensemble de votre activité. Avez-vous besoin de détails sur un aspect particulier ? 😊"""

    def reformulate_recent_response(self, data_response, user_input):
        """Reformuler une réponse sur les projets récents"""
        return f"""📋 Voici vos projets récents :

{data_response}

Ces projets montrent une bonne activité dans votre plateforme ! 🚀"""

    def reformulate_documents_response(self, data_response, user_input):
        """Reformuler une réponse sur les documents"""
        return f"""📄 Excellente question ! Voici ce que j'ai trouvé dans votre base de données :

{data_response}

C'est un bon indicateur de l'avancement de vos projets ! Voulez-vous plus de détails sur un projet spécifique ? 😊"""

    def reformulate_help_response(self, data_response, user_input):
        """Reformuler une réponse d'aide"""
        return f"""🤝 Je suis là pour vous aider !

{data_response}

N'hésitez pas à me poser des questions spécifiques sur vos projets, équipe ou tâches ! 💪"""

    def reformulate_general_response(self, data_response, user_input):
        """Reformuler une réponse générale"""
        return f"""✨ Voici ce que j'ai trouvé pour vous :

{data_response}

Y a-t-il autre chose que vous aimeriez savoir ? 😊"""

    def get_intelligent_fallback_response(self, user_input):
        """Réponse de fallback intelligente sans DeepSeek"""
        user_input_lower = user_input.lower()
        
        # Salutations
        if any(word in user_input_lower for word in ['bonjour', 'salut', 'hello', 'bonsoir', 'coucou']):
            return "Salut ! 👋 Ça va bien ? Je suis Marketges IA, ton assistant intelligent. Je peux t'aider avec tes projets marketing ou simplement discuter ! Qu'est-ce qui t'amène aujourd'hui ? 😊"
        
        # Questions sur l'identité
        elif any(word in user_input_lower for word in ['qui es-tu', 'qui es tu', 'présente', 'raconte']):
            return "Moi ? Je suis Marketges IA ! 🤖✨ Un assistant intelligent et chaleureux spécialisé dans la gestion de projets marketing. Mais je peux aussi parler de tout et n'importe quoi ! J'aime aider les gens et avoir des conversations intéressantes. Et toi, qui es-tu ? 😊"
        
        # Questions sur les capacités
        elif any(word in user_input_lower for word in ['que peux-tu', 'que peux tu', 'que sais-tu', 'que sais tu', 'capable']):
            return "Oh, je peux faire plein de choses ! 🎯 Je suis expert en gestion de projets marketing, mais je peux aussi discuter de la vie, donner des conseils, parler de technologie, ou simplement être là pour une conversation sympa. Qu'est-ce qui t'intéresse ? 😄"
        
        # Questions personnelles
        elif any(word in user_input_lower for word in ['comment ça va', 'ça va', 'humeur', 'sentiment']):
            return "Ça va super bien, merci ! 😊 Je suis toujours de bonne humeur quand je peux aider quelqu'un. Et toi, comment tu te sens aujourd'hui ? Raconte-moi ta journée ! 🌟"
        
        # Questions géographiques
        elif any(word in user_input_lower for word in ['congo', 'gabon', 'france', 'afrique', 'europe']):
            if 'congo' in user_input_lower:
                return "Ah, le Congo ! 🇨🇬 C'est un magnifique pays d'Afrique centrale ! Je connais bien cette région - c'est là que nous travaillons avec GABON Telecom au Gabon, qui est juste à côté ! Le Congo a une riche histoire et une culture fascinante. Tu es originaire de là-bas ou tu t'y intéresses ? 😊"
            elif 'gabon' in user_input_lower:
                return "Le Gabon ! 🇬🇦 C'est exactement là où nous opérons avec GABON Telecom ! C'est un pays magnifique avec une nature exceptionnelle et une économie en croissance. Tu connais bien cette région ? 😊"
            else:
                return "C'est une région fascinante ! 🌍 J'adore apprendre sur différents pays et cultures. Tu as des liens particuliers avec cette région ? 😊"
        
        # Questions sur les projets
        elif any(word in user_input_lower for word in ['projet', 'projets', 'marketing']):
            return "Ah, les projets ! 💼 C'est mon domaine de prédilection ! Je peux t'aider à analyser tes projets, te donner des conseils sur la gestion d'équipe, ou t'accompagner dans la planification. Qu'est-ce qui te préoccupe le plus dans tes projets actuels ? 🤔"
        
        # Questions sur l'équipe
        elif any(word in user_input_lower for word in ['équipe', 'team', 'utilisateur', 'collaborateur']):
            return "L'équipe, c'est le cœur de tout projet ! 👥 Je peux t'aider à optimiser la collaboration, analyser la répartition des tâches, ou donner des conseils sur la gestion d'équipe. Comment va ton équipe en ce moment ? 😊"
        
        # Questions sur les tâches
        elif any(word in user_input_lower for word in ['tâche', 'tache', 'todo', 'travail']):
            return "Les tâches, c'est la base de tout ! 📝 Je peux t'aider à organiser ton travail, prioriser tes tâches, ou te donner des conseils pour être plus productif. Tu as l'impression d'être débordé ou tout va bien ? 🤗"
        
        # Questions générales
        else:
            return "C'est une question intéressante ! 🤔 Je suis là pour t'aider, que ce soit avec tes projets marketing ou pour discuter de tout autre chose. Dis-moi, qu'est-ce qui te préoccupe ou t'intéresse en ce moment ? Je suis tout ouïe ! 😊"

class ChatHistoryView(APIView):
    """Vue pour récupérer l'historique des conversations"""
    permission_classes = []  # Permettre l'accès sans authentification
    
    def get(self, request):
        session_id = request.GET.get('session_id')
        if not session_id:
            return Response({"error": "session_id requis"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Récupérer la conversation
            if request.user and request.user.is_authenticated:
                conversation = Conversation.objects.filter(
                    Q(user=request.user) | Q(session_id=session_id)
                ).first()
            else:
                conversation = Conversation.objects.filter(session_id=session_id).first()
            
            if not conversation:
                return Response({"messages": []})
            
            # Récupérer tous les messages de la conversation
            messages = conversation.messages.all()
            
            # Formater les messages pour le frontend
            formatted_messages = []
            for msg in messages:
                formatted_messages.append({
                    'id': msg.id,
                    'sender': msg.sender,
                    'text': msg.content,
                    'timestamp': msg.timestamp.isoformat(),
                    'deepseek_used': msg.deepseek_used
                })
            
            return Response({
                "messages": formatted_messages,
                "conversation_id": conversation.id,
                "created_at": conversation.created_at.isoformat()
            })
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération de l'historique: {e}")
            return Response({"error": "Erreur serveur"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DeleteConversationView(APIView):
    """Vue pour supprimer une conversation"""
    permission_classes = []  # Permettre l'accès sans authentification
    
    def delete(self, request):
        session_id = request.data.get('session_id')
        conversation_id = request.data.get('conversation_id')
        
        if not session_id and not conversation_id:
            return Response({"error": "session_id ou conversation_id requis"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Trouver la conversation à supprimer
            if conversation_id:
                conversation = Conversation.objects.filter(id=conversation_id).first()
            else:
                if request.user and request.user.is_authenticated:
                    conversation = Conversation.objects.filter(
                        Q(user=request.user) | Q(session_id=session_id)
                    ).first()
                else:
                    conversation = Conversation.objects.filter(session_id=session_id).first()
            
            if not conversation:
                return Response({"error": "Conversation non trouvée"}, status=status.HTTP_404_NOT_FOUND)
            
            # Compter les messages avant suppression
            message_count = conversation.messages.count()
            
            # Supprimer la conversation (cascade supprime aussi les messages)
            conversation.delete()
            
            logger.info(f"Conversation supprimée: {conversation_id or session_id} ({message_count} messages)")
            
            return Response({
                "message": f"Conversation supprimée avec succès ({message_count} messages supprimés)",
                "deleted_messages": message_count
            })
            
        except Exception as e:
            logger.error(f"Erreur lors de la suppression de la conversation: {e}")
            return Response({"error": "Erreur serveur"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ClearAllConversationsView(APIView):
    """Vue pour supprimer toutes les conversations d'un utilisateur"""
    permission_classes = []  # Permettre l'accès sans authentification
    
    def delete(self, request):
        session_id = request.data.get('session_id')
        
        if not session_id:
            return Response({"error": "session_id requis"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Trouver toutes les conversations à supprimer
            if request.user and request.user.is_authenticated:
                conversations = Conversation.objects.filter(
                    Q(user=request.user) | Q(session_id=session_id)
                )
            else:
                conversations = Conversation.objects.filter(session_id=session_id)
            
            if not conversations.exists():
                return Response({"message": "Aucune conversation à supprimer"})
            
            # Compter les messages avant suppression
            total_messages = sum(conv.messages.count() for conv in conversations)
            conversation_count = conversations.count()
            
            # Supprimer toutes les conversations
            conversations.delete()
            
            logger.info(f"Toutes les conversations supprimées pour session: {session_id} ({conversation_count} conversations, {total_messages} messages)")
            
            return Response({
                "message": f"Toutes les conversations supprimées avec succès ({conversation_count} conversations, {total_messages} messages supprimés)",
                "deleted_conversations": conversation_count,
                "deleted_messages": total_messages
            })
            
        except Exception as e:
            logger.error(f"Erreur lors de la suppression de toutes les conversations: {e}")
            return Response({"error": "Erreur serveur"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
