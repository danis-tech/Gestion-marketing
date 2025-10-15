import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, Wifi, WifiOff, MessageCircle } from 'lucide-react';
import './RealtimeChat.css';

const RealtimeChat = ({ isOpen, onClose, roomName = 'general' }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Connexion WebSocket
  useEffect(() => {
    if (isOpen) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [isOpen, roomName]);

  // Auto-scroll vers le bas
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWebSocket = () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const wsUrl = `ws://localhost:8000/ws/chat/${roomName}/`;
    console.log('Connexion WebSocket vers:', wsUrl);
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connecté pour le chat');
      setIsConnected(true);
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket déconnecté');
      setIsConnected(false);
      // Reconnexion automatique après 3 secondes
      reconnectTimeoutRef.current = setTimeout(() => {
        if (isOpen) {
          connectWebSocket();
        }
      }, 3000);
    };

    wsRef.current.onerror = (error) => {
      console.error('Erreur WebSocket:', error);
      setIsConnected(false);
    };
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'chat_message':
        setMessages(prev => [data.data, ...prev]);
        break;
      case 'recent_messages':
        setMessages(data.data.reverse()); // Inverser pour avoir l'ordre chronologique
        break;
      case 'user_typing':
        setTypingUsers(prev => {
          const filtered = prev.filter(user => user.id !== data.user.id);
          return [...filtered, data.user];
        });
        break;
      case 'user_stopped_typing':
        setTypingUsers(prev => prev.filter(user => user.id !== data.user.id));
        break;
      case 'online_users':
        setOnlineUsers(data.users);
        break;
      case 'online_users_update':
        setOnlineUsers(data.data.users);
        break;
      default:
        break;
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !isConnected) return;

    const messageData = {
      type: 'chat_message',
      message: newMessage.trim()
    };

    wsRef.current.send(JSON.stringify(messageData));
    setNewMessage('');
    
    // Arrêter l'indicateur de frappe
    stopTyping();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else {
      // Indicateur de frappe
      handleTyping();
    }
  };

  const handleTyping = () => {
    if (!isConnected) return;

    setIsTyping(true);
    
    // Envoyer l'indicateur de frappe
    wsRef.current.send(JSON.stringify({
      type: 'typing'
    }));

    // Arrêter l'indicateur après 3 secondes
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  const stopTyping = () => {
    if (!isConnected) return;

    setIsTyping(false);
    
    wsRef.current.send(JSON.stringify({
      type: 'stop_typing'
    }));

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  const getDisplayName = (user) => {
    if (user.prenom && user.nom) {
      return `${user.prenom} ${user.nom}`;
    }
    return user.username;
  };

  if (!isOpen) return null;

  return (
    <div className="chat-overlay" onClick={onClose}>
      <div className="chat-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="chat-header">
          <div className="chat-title">
            <MessageCircle size={20} />
            <h3>Chat Général</h3>
            <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
              <span>{isConnected ? 'Connecté' : 'Déconnecté'}</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Utilisateurs en ligne */}
        <div className="online-users">
          <Users size={16} />
          <span className="online-count">
            {onlineUsers.length} utilisateur{onlineUsers.length > 1 ? 's' : ''} en ligne
          </span>
          <div className="online-list">
            {onlineUsers.slice(0, 8).map(user => (
              <div key={user.id} className="online-user" title={`${getDisplayName(user)}${user.service ? ` - ${user.service}` : ''}`}>
                <div className="user-avatar">
                  {getDisplayName(user).charAt(0).toUpperCase()}
                </div>
                <div className="online-indicator"></div>
              </div>
            ))}
            {onlineUsers.length > 8 && (
              <div className="more-users" title={`${onlineUsers.length - 8} autres utilisateurs`}>
                +{onlineUsers.length - 8}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="empty-chat">
              <MessageCircle size={48} />
              <p>Aucun message pour le moment</p>
              <p>Soyez le premier à écrire !</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const showDate = index === 0 || 
                formatDate(message.cree_le) !== formatDate(messages[index - 1].cree_le);
              
              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="message-date">
                      {formatDate(message.cree_le)}
                    </div>
                  )}
                  
                  <div className={`message ${message.est_systeme ? 'system' : ''}`}>
                    {!message.est_systeme && (
                      <div className="message-avatar">
                        {getDisplayName(message.expediteur).charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    <div className="message-content">
                      {!message.est_systeme && (
                        <div className="message-header">
                          <span className="message-author">
                            {getDisplayName(message.expediteur)}
                          </span>
                          {message.service_nom && (
                            <span className="message-service">
                              {message.service_nom}
                            </span>
                          )}
                          <span className="message-time">
                            {formatTime(message.cree_le)}
                          </span>
                        </div>
                      )}
                      
                      <div className="message-text">
                        {message.message}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          
          {/* Indicateur de frappe */}
          {typingUsers.length > 0 && (
            <div className="typing-indicator">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="typing-text">
                {typingUsers.map(user => getDisplayName(user)).join(', ')} 
                {typingUsers.length === 1 ? ' tape' : ' tapent'}...
              </span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chat-input">
          <div className="input-container">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? "Tapez votre message..." : "Connexion perdue..."}
              disabled={!isConnected}
              rows={1}
              className="message-input"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || !isConnected}
              className="send-btn"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeChat;
