import React, { useState } from 'react';
import ChatWindow from './ChatWindow';
import { MessageCircle } from 'lucide-react';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <button
        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 group"
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          borderRadius: '20px',
          minWidth: '70px',
          minHeight: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '3px solid white',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
        }}
      >
        <MessageCircle size={32} className="group-hover:scale-110 transition-transform duration-200" />
        
        {/* Indicateur de notification */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
          1
        </div>
      </button>
      {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}
    </div>
  );
};

export default ChatWidget;