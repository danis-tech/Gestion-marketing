import axios from 'axios';

const API_URL = 'http://localhost:8000/api/chatbot/ask/';
const HISTORY_URL = 'http://localhost:8000/api/chatbot/history/';
const DELETE_URL = 'http://localhost:8000/api/chatbot/delete/';
const CLEAR_ALL_URL = 'http://localhost:8000/api/chatbot/clear-all/';

// Générer un ID de session unique pour les utilisateurs non connectés
const getSessionId = () => {
  let sessionId = localStorage.getItem('chatbot_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('chatbot_session_id', sessionId);
  }
  return sessionId;
};

export const sendToBot = async (message) => {
  try {
    const response = await axios.post(API_URL, { 
      question: message,
      session_id: getSessionId()
    });
    
    if (response.data.answer) {
      return response.data.answer;
    } else {
      return "Je n'ai pas compris votre question.";
    }
  } catch (error) {
    console.error('Erreur API chatbot:', error);
    
    // Gestion d'erreurs plus détaillée
    if (error.response) {
      // Erreur de réponse du serveur
      if (error.response.status === 400) {
        return "Votre question semble vide ou invalide. Pouvez-vous reformuler ?";
      } else if (error.response.status === 500) {
        return "Le service est temporairement indisponible. Veuillez réessayer dans quelques instants.";
      }
    } else if (error.request) {
      // Erreur de réseau
      return "Problème de connexion. Vérifiez votre connexion internet et réessayez.";
    }
    
    return "Une erreur inattendue est survenue. Veuillez réessayer.";
  }
};

export const getChatHistory = async () => {
  try {
    const response = await axios.get(HISTORY_URL, {
      params: { session_id: getSessionId() }
    });
    
    if (response.data.messages) {
      return response.data.messages.map(msg => ({
        id: msg.id,
        sender: msg.sender,
        text: msg.text,
        timestamp: msg.timestamp,
        isLoading: false,
        isError: false
      }));
    }
    return [];
  } catch (error) {
    console.error('Erreur lors du chargement de l\'historique:', error);
    return [];
  }
};

export const deleteConversation = async () => {
  try {
    const response = await axios.delete(DELETE_URL, {
      data: { session_id: getSessionId() }
    });
    
    if (response.data.message) {
      return { success: true, message: response.data.message };
    }
    return { success: true, message: 'Conversation supprimée avec succès' };
  } catch (error) {
    console.error('Erreur lors de la suppression de la conversation:', error);
    return { success: false, message: 'Erreur lors de la suppression de la conversation' };
  }
};

export const clearAllConversations = async () => {
  try {
    const response = await axios.delete(CLEAR_ALL_URL, {
      data: { session_id: getSessionId() }
    });
    
    if (response.data.message) {
      return { success: true, message: response.data.message };
    }
    return { success: true, message: 'Toutes les conversations supprimées avec succès' };
  } catch (error) {
    console.error('Erreur lors de la suppression de toutes les conversations:', error);
    return { success: false, message: 'Erreur lors de la suppression des conversations' };
  }
};
