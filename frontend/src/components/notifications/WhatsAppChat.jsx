import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Users, Wifi, WifiOff, MessageCircle, X, Smile, 
  Paperclip, MoreVertical, Trash2, Check, CheckCheck, Mic 
} from 'lucide-react';
import './WhatsAppChat.css';

const WhatsAppChat = ({ isOpen, onClose, roomName = 'general' }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMessageMenu, setShowMessageMenu] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSuperUser, setIsSuperUser] = useState(false);
  
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Emojis populaires
  const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'];

  // Connexion WebSocket
  useEffect(() => {
    if (isOpen) {
      connectWebSocket();
      loadCurrentUser();
      loadOnlineUsers();
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

  // Mettre à jour les utilisateurs en ligne toutes les 30 secondes
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        loadOnlineUsers();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const loadCurrentUser = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/accounts/profile/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('Données utilisateur chargées:', userData);
        setCurrentUser(userData);
        setIsSuperUser(userData.is_superuser || false);
        console.log('isSuperUser défini à:', userData.is_superuser || false);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    }
  };

  const loadOnlineUsers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('Aucun token d\'accès trouvé');
        // Simuler des utilisateurs en ligne pour les tests
        setOnlineUsers([{ id: 1, username: 'test', prenom: 'Test', nom: 'User' }]);
        return;
      }
      
      const response = await fetch('http://localhost:8000/api/notifications/chat/online-users/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Données utilisateurs en ligne reçues:', data);
        setOnlineUsers(data.online_users || []);
        console.log('Utilisateurs en ligne mis à jour:', data.online_users?.length || 0);
      } else if (response.status === 401) {
        console.error('Token expiré, tentative de rafraîchissement...');
        // Essayer de rafraîchir le token
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          try {
            const refreshResponse = await fetch('http://localhost:8000/api/accounts/token/refresh/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refresh: refreshToken }),
            });
            
            if (refreshResponse.ok) {
              const tokenData = await refreshResponse.json();
              localStorage.setItem('access_token', tokenData.access);
              console.log('Token rafraîchi, nouvelle tentative...');
              // Réessayer l'appel
              setTimeout(() => loadOnlineUsers(), 1000);
            }
          } catch (refreshError) {
            console.error('Erreur lors du rafraîchissement du token:', refreshError);
          }
        }
      } else {
        console.error('Erreur API utilisateurs en ligne:', response.status);
        // En cas d'erreur, simuler au moins 1 utilisateur (l'utilisateur actuel)
        setOnlineUsers([{ id: 1, username: 'current', prenom: 'Utilisateur', nom: 'Actuel' }]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs en ligne:', error);
      // En cas d'erreur réseau, simuler au moins 1 utilisateur
      setOnlineUsers([{ id: 1, username: 'current', prenom: 'Utilisateur', nom: 'Actuel' }]);
    }
  };

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
      // Reconnexion automatique après 5 secondes (augmenté)
      reconnectTimeoutRef.current = setTimeout(() => {
        if (isOpen) {
          connectWebSocket();
        }
      }, 5000);
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
        // Ajouter le nouveau message à la fin (comme WhatsApp)
        setMessages(prev => [...prev, data.data]);
        break;
      case 'recent_messages':
        // Les messages récents sont déjà dans l'ordre chronologique
        setMessages(data.data);
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
        console.log('Mise à jour utilisateurs en ligne reçue:', data);
        setOnlineUsers(data.data?.users || data.users || []);
        break;
      case 'message_deleted':
        setMessages(prev => prev.filter(msg => msg.id !== data.message_id));
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
    
    // Fermer le sélecteur d'emojis
    setShowEmojiPicker(false);
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

  const deleteMessage = (messageId) => {
    console.log('deleteMessage appelée:', { messageId, isSuperUser });
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // Envoyer la suppression via WebSocket uniquement
        wsRef.current.send(JSON.stringify({
          type: 'delete_message',
          message_id: messageId
        }));
        console.log('Suppression envoyée via WebSocket:', messageId);
      } else {
        console.error('WebSocket non connecté');
      }
    }
    
    setShowMessageMenu(null);
  };

  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
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

  const isMyMessage = (message) => {
    if (!currentUser || !message.expediteur) {
      return false;
    }
    
    // Comparer par ID (plus fiable)
    const isMyMsg = message.expediteur.id === currentUser.id;
    
    return isMyMsg;
  };

  if (!isOpen) return null;

  return (
    <div className="whatsapp-chat-overlay" onClick={onClose}>
      <div className="whatsapp-chat-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="whatsapp-chat-header">
          <div className="chat-info">
            <div className="chat-avatar">
              <MessageCircle size={20} />
            </div>
            <div className="chat-details">
              <h3>Chat Général</h3>
              <div className="chat-status">
                <div className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                  <div className="status-dot"></div>
                </div>
                <span className="online-count">
                  {onlineUsers.length} utilisateur{onlineUsers.length > 1 ? 's' : ''} en ligne
                </span>
              </div>
            </div>
          </div>
          
          <div className="chat-actions">
            <div className="online-users-preview">
              {onlineUsers.slice(0, 3).map(user => (
                <div key={user.id} className="mini-avatar" title={getDisplayName(user)}>
                  {getDisplayName(user).charAt(0).toUpperCase()}
                </div>
              ))}
              {onlineUsers.length > 3 && (
                <div className="more-users">+{onlineUsers.length - 3}</div>
              )}
            </div>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="whatsapp-messages">
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
              
              // Ne pas afficher les messages système
              if (message.est_systeme || 
                  message.message.includes('s\'est connecté') || 
                  message.message.includes('s\'est déconnecté') ||
                  message.message.includes('connecté') ||
                  message.message.includes('déconnecté') ||
                  message.message.includes('BOUSSENGUI') ||
                  message.message.includes('système') ||
                  message.message.includes('notification') ||
                  message.message.includes('🔴') ||
                  message.message.includes('🟢') ||
                  message.message.includes('déconnexion') ||
                  message.message.includes('connexion') ||
                  message.message.includes('🔴 BOUSSENGUI') ||
                  message.message.includes('🟢 BOUSSENGUI') ||
                  message.expediteur?.username === 'system' ||
                  message.expediteur?.username === 'System') {
                console.log('Message système filtré:', message.message);
                return null;
              }
              
              const isMyMsg = isMyMessage(message);
              
              // Clé unique combinant ID et index pour éviter les doublons
              const uniqueKey = `msg-${message.id}-${index}`;
              
              return (
                <div key={uniqueKey}>
                  {showDate && (
                    <div className="message-date-separator">
                      {formatDate(message.cree_le)}
                    </div>
                  )}
                  
                  <div className={`whatsapp-message ${isMyMsg ? 'my-message' : 'other-message'} ${message.est_systeme ? 'system-message' : ''}`}>
                    {message.est_systeme ? (
                      <div className="system-message-content">
                        <span className="system-text">{message.message}</span>
                      </div>
                    ) : (
                      <>
                        <div className="message-bubble">
                          <div className="message-text">
                            {message.message}
                          </div>
                          <div className="message-meta">
                            <span className="message-time">
                              {formatTime(message.cree_le)}
                            </span>
                            {isMyMsg && (
                              <div className="message-status">
                                <CheckCheck size={12} />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {isSuperUser && !isMyMsg && (
                          <div className="message-actions">
                            <button 
                              className="action-btn"
                              onClick={() => setShowMessageMenu(showMessageMenu === message.id ? null : message.id)}
                            >
                              <MoreVertical size={16} />
                            </button>
                            {showMessageMenu === message.id && (
                              <div className="message-menu">
                                <button 
                                  className="delete-btn"
                                  onClick={() => deleteMessage(message.id)}
                                >
                                  <Trash2 size={14} />
                                  Supprimer
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
          
          {/* Indicateur de frappe */}
          {typingUsers.length > 0 && (
            <div className="typing-indicator">
              <div className="typing-bubble">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <span className="typing-text">
                {typingUsers.map(user => getDisplayName(user)).join(', ')} 
                {typingUsers.length === 1 ? ' tape' : ' tapent'}...
              </span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input WhatsApp Style */}
        <div className="whatsapp-input">
          <div className="input-container">
            <button 
              className="input-action-btn"
              title="Pièces jointes"
            >
              <Paperclip size={20} />
            </button>
            
            <button 
              className="input-action-btn"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Emojis"
            >
              <Smile size={20} />
            </button>
            
            <div className="input-wrapper">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isConnected ? "Tapez un message" : "Connexion perdue..."}
                disabled={!isConnected}
                rows={1}
                className="message-input"
              />
            </div>
            
            {newMessage.trim() ? (
              <button
                onClick={sendMessage}
                disabled={!isConnected}
                className="send-btn"
                title="Envoyer"
              >
                <Send size={18} />
              </button>
            ) : (
            <button
              className="input-action-btn"
              title="Enregistrement vocal"
            >
              <Mic size={20} />
            </button>
            )}
          </div>
          
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="emoji-picker">
              <div className="emoji-grid">
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    className="emoji-btn-small"
                    onClick={() => addEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppChat;
