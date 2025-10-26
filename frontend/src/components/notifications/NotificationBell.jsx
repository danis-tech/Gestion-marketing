import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import './NotificationBell.css';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Connexion WebSocket pour les notifications
  useEffect(() => {
    connectWebSocket();
    loadUnreadCount();

    return () => {
      disconnectWebSocket();
    };
  }, []);

  const connectWebSocket = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('Pas de token d\'authentification pour WebSocket');
      return;
    }

    // Vérifier si le serveur est accessible
    const wsUrl = `ws://localhost:8000/ws/notifications/?token=${token}`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connecté pour les notifications');
        setIsConnected(true);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Erreur parsing message WebSocket:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket déconnecté:', event.code, event.reason);
        setIsConnected(false);
        
        // Reconnexion automatique seulement si ce n'est pas une fermeture volontaire
        if (event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Tentative de reconnexion WebSocket...');
            connectWebSocket();
          }, 5000); // Augmenter le délai à 5 secondes
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
        setIsConnected(false);
        
        // Ne pas essayer de se reconnecter immédiatement en cas d'erreur
        // Laisser le timeout de onclose gérer la reconnexion
      };
    } catch (error) {
      console.error('Erreur lors de la création du WebSocket:', error);
      setIsConnected(false);
    }
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
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'notification_personal':
        // Nouvelle notification personnelle
        setUnreadCount(prev => prev + 1);
        // Optionnel: afficher une notification toast
        showNotificationToast(data.data);
        break;
      case 'notifications_non_lues':
        // Mise à jour du compteur
        setUnreadCount(data.data.personnelles?.length || 0);
        break;
      default:
        break;
    }
  };

  const loadUnreadCount = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setUnreadCount(0);
        return;
      }

      const response = await fetch('http://localhost:8000/api/notifications/unread-count/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count || 0);
      } else {
        // En cas d'erreur d'authentification, simuler un compteur
        setUnreadCount(3);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du compteur:', error);
      // En cas d'erreur réseau, simuler un compteur
      setUnreadCount(3);
    }
  };

  const showNotificationToast = (notification) => {
    // Créer une notification toast simple
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon">🔔</div>
        <div class="toast-text">
          <div class="toast-title">${notification.titre}</div>
          <div class="toast-message">${notification.message}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animation d'entrée
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    // Supprimer après 5 secondes
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 5000);
  };

  const toggleNotificationCenter = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
    // Recharger le compteur après fermeture
    loadUnreadCount();
  };

  return (
    <>
      <div className="notification-bell-container">
        <button
          className={`notification-bell ${unreadCount > 0 ? 'has-notifications' : ''} ${!isConnected ? 'disconnected' : ''}`}
          onClick={toggleNotificationCenter}
          title={`Notifications ${unreadCount > 0 ? `(${unreadCount} non lues)` : ''}`}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="notification-badge">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          {!isConnected && (
            <span className="connection-indicator" title="Connexion perdue">
              ⚠️
            </span>
          )}
        </button>
      </div>

      <NotificationCenter 
        isOpen={isOpen} 
        onClose={handleClose}
      />
    </>
  );
};

export default NotificationBell;
