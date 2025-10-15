// 📁 src/components/chatbot/context.js
import { createContext, useState, useEffect } from 'react';
import { sendToBot, getChatHistory, deleteConversation } from '../../services/chatbotApi';
import soundManager from '../../utils/robustSoundUtils';

export const ChatbotContext = createContext();

export const ChatbotProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charger l'historique au démarrage
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await getChatHistory();
        if (history.length > 0) {
          setMessages(history);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'historique:', error);
      }
    };
    
    loadHistory();
  }, []);

  const sendMessage = async (message) => {
    if (!message.trim()) return;
    
    // Jouer le son d'envoi de message
    soundManager.playMessageSentSound();
    
    // Ajouter le message utilisateur
    const userMsg = { 
      sender: 'user', 
      text: message, 
      timestamp: new Date().toISOString(),
      id: Date.now() + '_user'
    };
    setMessages((prev) => [...prev, userMsg]);
    
    // Ajouter un message de chargement
    const loadingMsg = { 
      sender: 'bot', 
      text: '...', 
      isLoading: true,
      timestamp: new Date().toISOString(),
      id: Date.now() + '_loading'
    };
    setMessages((prev) => [...prev, loadingMsg]);
    
    setIsLoading(true);
    setError(null);

    try {
      const botResponse = await sendToBot(message);
      
      // Remplacer le message de chargement par la vraie réponse
      setMessages((prev) => 
        prev.map(msg => 
          msg.id === loadingMsg.id 
            ? { 
                sender: 'bot', 
                text: botResponse, 
                isLoading: false,
                timestamp: new Date().toISOString(),
                id: Date.now() + '_bot'
              }
            : msg
        )
      );
      
      // Jouer le son de réception de message
      soundManager.playMessageReceivedSound();
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      setError('Erreur lors de l\'envoi du message');
      
      // Remplacer le message de chargement par un message d'erreur
      setMessages((prev) => 
        prev.map(msg => 
          msg.id === loadingMsg.id 
            ? { 
                sender: 'bot', 
                text: 'Désolé, une erreur est survenue. Veuillez réessayer.', 
                isLoading: false,
                isError: true,
                timestamp: new Date().toISOString(),
                id: Date.now() + '_error'
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = async () => {
    try {
      const result = await deleteConversation();
      if (result.success) {
        setMessages([]);
        setError(null);
        console.log('Conversation supprimée avec succès:', result.message);
      } else {
        console.error('Erreur lors de la suppression:', result.message);
        // En cas d'erreur, vider quand même l'état local
        setMessages([]);
        setError(null);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la conversation:', error);
      // En cas d'erreur, vider quand même l'état local
      setMessages([]);
      setError(null);
    }
  };

  return (
    <ChatbotContext.Provider value={{ 
      messages, 
      sendMessage, 
      isLoading, 
      error, 
      clearMessages 
    }}>
      {children}
    </ChatbotContext.Provider>
  );
};
