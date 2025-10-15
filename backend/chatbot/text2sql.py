# chatbot/text2sql.py
"""
Module pour la génération automatique de requêtes Django ORM à partir de texte naturel
utilisant LangChain et l'IA.
"""

import logging
from typing import Optional, Dict, Any
from django.db import models

logger = logging.getLogger(__name__)

class TextToSQLGenerator:
    """
    Générateur de requêtes Django ORM à partir de texte naturel.
    Utilise LangChain pour comprendre l'intention et générer les requêtes appropriées.
    """
    
    def __init__(self):
        self.model_mappings = self._get_model_mappings()
        self.query_templates = self._get_query_templates()
    
    def _get_model_mappings(self) -> Dict[str, str]:
        """Mappage des modèles Django disponibles"""
        return {
            'projet': 'Projet',
            'projets': 'Projet',
            'tache': 'Tache',
            'tâche': 'Tache',
            'taches': 'Tache',
            'tâches': 'Tache',
            'utilisateur': 'User',
            'utilisateurs': 'User',
            'user': 'User',
            'users': 'User',
            'document': 'DocumentProjet',
            'documents': 'DocumentProjet',
            'phase': 'PhaseProjet',
            'phases': 'PhaseProjet',
            'etape': 'Etape',
            'étape': 'Etape',
            'etapes': 'Etape',
            'étapes': 'Etape',
            'service': 'Service',
            'services': 'Service',
            'role': 'Role',
            'rôle': 'Role',
            'roles': 'Role',
            'rôles': 'Role',
            'permission': 'Permission',
            'permissions': 'Permission',
            'historique': 'HistoriqueDocumentProjet',
            'commentaire': 'CommentaireDocumentProjet',
            'commentaires': 'CommentaireDocumentProjet',
        }
    
    def _get_query_templates(self) -> Dict[str, str]:
        """Templates de requêtes courantes"""
        return {
            'count': "{model}.objects.count()",
            'count_filter': "{model}.objects.filter({filter}).count()",
            'all': "{model}.objects.all()",
            'filter': "{model}.objects.filter({filter})",
            'order_by': "{model}.objects.order_by('{field}')",
            'recent': "{model}.objects.order_by('-cree_le')[:{limit}]",
            'with_relation': "{model}.objects.filter({relation}__isnull=False).distinct()",
        }
    
    def analyze_query_intent(self, user_input: str) -> Dict[str, Any]:
        """
        Analyse l'intention de la requête utilisateur
        """
        user_input_lower = user_input.lower()
        
        # Détecter le type de requête
        query_type = "count"  # Par défaut
        if any(word in user_input_lower for word in ['combien', 'nombre', 'total', 'count']):
            query_type = "count"
        elif any(word in user_input_lower for word in ['liste', 'afficher', 'montrer', 'voir']):
            query_type = "list"
        elif any(word in user_input_lower for word in ['récent', 'dernier', 'nouveau']):
            query_type = "recent"
        elif any(word in user_input_lower for word in ['avec', 'qui ont', 'contenant']):
            query_type = "with_relation"
        
        # Détecter le modèle cible
        target_model = None
        for keyword, model_name in self.model_mappings.items():
            if keyword in user_input_lower:
                target_model = model_name
                break
        
        # Détecter les filtres
        filters = []
        if 'actif' in user_input_lower or 'en cours' in user_input_lower:
            filters.append("statut='en_cours'")
        elif 'terminé' in user_input_lower or 'terminé' in user_input_lower:
            filters.append("statut='termine'")
        elif 'en attente' in user_input_lower:
            filters.append("statut='en_attente'")
        elif 'urgent' in user_input_lower or 'urgence' in user_input_lower or 'priorité' in user_input_lower:
            filters.append("priorite='haute'")
        elif 'généré' in user_input_lower or 'genere' in user_input_lower:
            filters.append("origine='genere'")
        
        # Détecter les relations
        relations = []
        if 'document' in user_input_lower and 'projet' in user_input_lower:
            relations.append("documents")
        elif 'tache' in user_input_lower and 'projet' in user_input_lower:
            relations.append("taches")
        elif 'utilisateur' in user_input_lower and 'projet' in user_input_lower:
            relations.append("membres")
        
        return {
            'query_type': query_type,
            'target_model': target_model,
            'filters': filters,
            'relations': relations,
            'original_input': user_input
        }
    
    def generate_django_query(self, intent: Dict[str, Any]) -> Optional[str]:
        """
        Génère une requête Django ORM basée sur l'intention analysée
        """
        try:
            if not intent['target_model']:
                return None
            
            model = intent['target_model']
            query_type = intent['query_type']
            filters = intent['filters']
            relations = intent['relations']
            
            # Construire la requête selon le type
            if query_type == "count":
                if filters:
                    filter_str = ", ".join(filters)
                    query = f"{model}.objects.filter({filter_str}).count()"
                elif relations:
                    relation_str = ", ".join([f"{rel}__isnull=False" for rel in relations])
                    query = f"{model}.objects.filter({relation_str}).distinct().count()"
                else:
                    query = f"{model}.objects.count()"
            
            elif query_type == "list":
                if filters:
                    filter_str = ", ".join(filters)
                    query = f"{model}.objects.filter({filter_str})"
                elif relations:
                    relation_str = ", ".join([f"{rel}__isnull=False" for rel in relations])
                    query = f"{model}.objects.filter({relation_str}).distinct()"
                else:
                    query = f"{model}.objects.all()"
            
            elif query_type == "recent":
                query = f"{model}.objects.order_by('-cree_le')[:5]"
            
            elif query_type == "with_relation":
                if relations:
                    relation_str = ", ".join([f"{rel}__isnull=False" for rel in relations])
                    query = f"{model}.objects.filter({relation_str}).distinct()"
                else:
                    query = f"{model}.objects.all()"
            
            else:
                query = f"{model}.objects.all()"
            
            logger.info(f"[Text2SQL] Requête générée: {query}")
            return query
            
        except Exception as e:
            logger.error(f"[Text2SQL] Erreur lors de la génération de requête: {e}")
            return None
    
    def execute_generated_query(self, query: str) -> Any:
        """
        Exécute la requête générée et retourne les résultats
        """
        try:
            # Import dynamique des modèles
            from projects.models import Projet, Tache, PhaseProjet, Etape
            from accounts.models import User, Service, Role, Permission
            from documents.models import DocumentProjet, HistoriqueDocumentProjet, CommentaireDocumentProjet
            
            # Créer un contexte local avec tous les modèles
            local_context = {
                'Projet': Projet,
                'Tache': Tache,
                'PhaseProjet': PhaseProjet,
                'Etape': Etape,
                'User': User,
                'Service': Service,
                'Role': Role,
                'Permission': Permission,
                'DocumentProjet': DocumentProjet,
                'HistoriqueDocumentProjet': HistoriqueDocumentProjet,
                'CommentaireDocumentProjet': CommentaireDocumentProjet,
            }
            
            # Exécuter la requête
            result = eval(query, {"__builtins__": {}}, local_context)
            logger.info(f"[Text2SQL] Requête exécutée avec succès: {query}")
            return result
            
        except Exception as e:
            logger.error(f"[Text2SQL] Erreur lors de l'exécution de la requête: {e}")
            return None
    
    def format_query_result(self, result: Any, intent: Dict[str, Any]) -> str:
        """
        Formate le résultat de la requête en texte lisible
        """
        try:
            if result is None:
                return "Aucun résultat trouvé."
            
            # Si c'est un nombre (count)
            if isinstance(result, int):
                model_name = intent['target_model']
                return f"Nombre de {model_name.lower()} : {result}"
            
            # Si c'est une QuerySet
            elif hasattr(result, '__iter__') and not isinstance(result, str):
                items = list(result)
                if not items:
                    return "Aucun élément trouvé."
                
                model_name = intent['target_model']
                response = f"Liste des {model_name.lower()} :\n"
                
                for item in items[:10]:  # Limiter à 10 éléments
                    if hasattr(item, 'nom'):
                        response += f"- {item.nom}"
                        if hasattr(item, 'statut'):
                            response += f" ({item.statut})"
                        response += "\n"
                    elif hasattr(item, 'username'):
                        response += f"- {item.username}\n"
                    else:
                        response += f"- {str(item)}\n"
                
                if len(items) > 10:
                    response += f"... et {len(items) - 10} autres éléments"
                
                return response
            
            # Autres types
            else:
                return str(result)
                
        except Exception as e:
            logger.error(f"[Text2SQL] Erreur lors du formatage: {e}")
            return "Erreur lors du formatage des résultats."
    
    def process_natural_language_query(self, user_input: str) -> str:
        """
        Traite une requête en langage naturel et retourne la réponse formatée
        """
        try:
            # Analyser l'intention
            intent = self.analyze_query_intent(user_input)
            logger.info(f"[Text2SQL] Intention analysée: {intent}")
            
            # Générer la requête
            query = self.generate_django_query(intent)
            if not query:
                return "Je n'ai pas pu comprendre votre question. Pouvez-vous la reformuler ?"
            
            # Exécuter la requête
            result = self.execute_generated_query(query)
            if result is None:
                return "Erreur lors de l'exécution de la requête."
            
            # Formater le résultat
            formatted_result = self.format_query_result(result, intent)
            return formatted_result
            
        except Exception as e:
            logger.error(f"[Text2SQL] Erreur générale: {e}")
            return "Une erreur est survenue lors du traitement de votre question."


# Instance globale du générateur
text2sql_generator = TextToSQLGenerator()
