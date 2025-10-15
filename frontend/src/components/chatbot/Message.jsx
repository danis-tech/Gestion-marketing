import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

const Message = ({ sender, text, isLoading, isError, timestamp }) => {
  const isUser = sender === 'user';

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 message-container`}>
      <div className={`flex flex-col max-w-4xl w-full ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Message bubble simple et lisible */}
        <div className={`relative px-4 py-3 message-bubble ${
          isUser 
            ? 'bg-blue-500 text-white text-base font-semibold' 
            : isError 
              ? 'bg-red-50 text-red-800 border border-red-200 text-base font-medium'
              : 'bg-white text-gray-800 border border-gray-200 text-base font-medium'
        }`}>
          {isLoading ? (
            <div className="flex items-center gap-2 p-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          ) : isError ? (
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="font-medium">{text}</span>
            </div>
          ) : (
            <div className="message-text">{text}</div>
          )}
          
        </div>
        
        {/* Timestamp simple */}
        {timestamp && (
          <span className={`text-xs mt-2 ${
            isUser 
              ? 'text-gray-400' 
              : 'text-gray-500'
          }`}>
            {formatTime(timestamp)}
          </span>
        )}
      </div>
    </div>
  );
};

export default Message;
