// 📁 src/components/chatbot/MessageInput.jsx
import React, { useState, useContext } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { ChatbotContext } from './context.jsx';
import './ChatbotInput.css';

const MessageInput = () => {
  const [input, setInput] = useState('');
  const { sendMessage, isLoading } = useContext(ChatbotContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chatbot-input-container">
      <form onSubmit={handleSubmit} className="chatbot-form">
        <div className="chatbot-input-wrapper">
          {/* Input principal avec design carré et gros */}
          <div className="chatbot-input-field">
            <input
              className="chatbot-input"
              type="text"
              placeholder="Tapez votre message ici..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
          </div>
          
          {/* Bouton d'envoi à l'extérieur */}
          <div className="chatbot-buttons">
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="chatbot-send-btn"
            >
              {isLoading ? (
                <Loader2 className="chatbot-send-icon animate-spin text-white" />
              ) : (
                <Send className="chatbot-send-icon" />
              )}
            </button>
          </div>
          
          
          {/* Compteur de caractères */}
          {input.length > 0 && (
            <div className="chatbot-char-counter">
              {input.length}/500
            </div>
          )}
        </div>
        
      </form>
    </div>
  );
};

export default MessageInput;
