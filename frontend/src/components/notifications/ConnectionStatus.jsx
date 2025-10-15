import React, { useState, useEffect } from 'react';
import { Users, Wifi, WifiOff, UserPlus, UserMinus } from 'lucide-react';
import './ConnectionStatus.css';

const ConnectionStatus = ({ isOpen, onClose }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connectionMessages, setConnectionMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadOnlineUsers();
      loadConnectionMessages();
      
      // Actualiser toutes les 30 secondes
      const interval = setInterval(() => {
        loadOnlineUsers();
        loadConnectionMessages();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const loadOnlineUsers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/notifications/chat/online-users/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOnlineUsers(data.online_users || []);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs en ligne:', error);
      setIsConnected(false);
    }
  };

  const loadConnectionMessages = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/notifications/chat/messages/?system_only=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filtrer seulement les messages de connexion/déconnexion
        const connectionMsgs = data.results?.filter(msg => 
          msg.est_systeme && 
          (msg.message.includes('s\'est connecté') || msg.message.includes('s\'est déconnecté'))
        ) || [];
        
        setConnectionMessages(connectionMsgs.slice(0, 10)); // Derniers 10 messages
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages de connexion:', error);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getDisplayName = (user) => {
    if (user.prenom && user.nom) {
      return `${user.prenom} ${user.nom}`;
    }
    return user.username;
  };

  if (!isOpen) return null;

  return (
    <div className="connection-status-overlay" onClick={onClose}>
      <div className="connection-status-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="connection-status-header">
          <div className="status-title">
            <Users size={20} />
            <h3>Statut des Connexions</h3>
            <div className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
              <span>{isConnected ? 'Connecté' : 'Déconnecté'}</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Utilisateurs en ligne */}
        <div className="online-users-section">
          <h4>Utilisateurs en ligne ({onlineUsers.length})</h4>
          <div className="online-users-grid">
            {onlineUsers.map(user => (
              <div key={user.id} className="online-user-card">
                <div className="user-avatar">
                  {getDisplayName(user).charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <div className="user-name">{getDisplayName(user)}</div>
                  {user.service && (
                    <div className="user-service">{user.service}</div>
                  )}
                </div>
                <div className="online-indicator"></div>
              </div>
            ))}
            {onlineUsers.length === 0 && (
              <div className="no-users">
                <Users size={32} />
                <p>Aucun utilisateur en ligne</p>
              </div>
            )}
          </div>
        </div>

        {/* Messages de connexion */}
        <div className="connection-messages-section">
          <h4>Activité récente</h4>
          <div className="connection-messages">
            {connectionMessages.map(message => (
              <div key={message.id} className="connection-message">
                <div className="message-icon">
                  {message.message.includes('connecté') ? (
                    <UserPlus size={16} className="connect-icon" />
                  ) : (
                    <UserMinus size={16} className="disconnect-icon" />
                  )}
                </div>
                <div className="message-content">
                  <div className="message-text">{message.message}</div>
                  <div className="message-time">{formatTime(message.cree_le)}</div>
                </div>
              </div>
            ))}
            {connectionMessages.length === 0 && (
              <div className="no-messages">
                <p>Aucune activité récente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus;
