import React, { useContext, useState } from 'react';
import { X, Trash2, Volume2, VolumeX } from 'lucide-react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { ChatbotContext } from './context.jsx';
import soundManager from '../../utils/robustSoundUtils';

const ChatWindow = ({ onClose }) => {
  const { clearMessages, messages } = useContext(ChatbotContext);
  const [isSoundEnabled, setIsSoundEnabled] = useState(soundManager.isSoundEnabled());

  const handleClearMessages = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer toute la conversation ?')) {
      await clearMessages();
    }
  };

  const toggleSound = () => {
    const newState = !isSoundEnabled;
    setIsSoundEnabled(newState);
    soundManager.setEnabled(newState);
    
    // Jouer un son de test si on active
    if (newState) {
      soundManager.playNotificationSound();
    }
  };

  return (
    <div className="fixed bottom-20 right-8 w-[800px] h-[900px] bg-white shadow-2xl flex flex-col border border-gray-200 overflow-hidden backdrop-blur-sm">
      {/* Header ultra-moderne avec gradient */}
      <div className="flex justify-between items-center bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white p-8 relative">
        {/* Effet de brillance */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="relative">
            <div className="w-6 h-6 bg-emerald-400 rounded-full animate-pulse shadow-lg"></div>
            <div className="absolute inset-0 w-6 h-6 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
            <div className="absolute inset-0 w-6 h-6 bg-emerald-300 rounded-full animate-ping opacity-50" style={{ animationDelay: '0.5s' }}></div>
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-wide">Marketges IA</h2>
            <p className="text-sm text-blue-100 font-medium">Assistant intelligent • En ligne</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 relative z-10">
          <button 
            onClick={toggleSound}
            className="p-3.5 hover:bg-white/20 transition-all duration-200 group backdrop-blur-sm"
            title={isSoundEnabled ? "Désactiver les sons" : "Activer les sons"}
          >
            {isSoundEnabled ? (
              <Volume2 size={24} className="group-hover:scale-110 transition-transform" />
            ) : (
              <VolumeX size={24} className="group-hover:scale-110 transition-transform" />
            )}
          </button>
          {messages.length > 0 && (
            <button 
              onClick={handleClearMessages}
              className="p-3.5 hover:bg-white/20 transition-all duration-200 group backdrop-blur-sm"
              title="Effacer la conversation"
            >
              <Trash2 size={24} className="group-hover:scale-110 transition-transform" />
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-3.5 hover:bg-white/20 transition-all duration-200 group backdrop-blur-sm"
            title="Fermer"
          >
            <X size={24} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>
      
      {/* Zone de messages avec design ultra-moderne */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 via-white to-gray-50 relative">
        {/* Effet de dégradé en haut et en bas */}
        <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-gray-50 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-50 to-transparent z-10 pointer-events-none"></div>
        
        <MessageList />
      </div>
      
      {/* Zone d'input fixée en bas */}
      <div className="flex-shrink-0">
        <MessageInput />
      </div>
    </div>
  );
};

export default ChatWindow;
