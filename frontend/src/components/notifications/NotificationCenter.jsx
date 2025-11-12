import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, X, Check, Archive, Filter, Search,
  AlertTriangle, Clock, User, Megaphone, Wrench,
  CheckSquare, CheckCircle, Crown, ThumbsUp, PlayCircle,
  AlertCircle, Flag, FileCheck, FileX, Upload,
  Target, MessageSquare, Edit, Trash2, Eye, Download,
  Circle, CircleDot, Users
} from 'lucide-react';
import './NotificationCenter.css';
import './NotificationStyles.css';
import WhatsAppChat from './WhatsAppChat';
import ConnectionStatus from './ConnectionStatus';

const NotificationCenter = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showConnectionStatus, setShowConnectionStatus] = useState(false);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Types de notifications
  const notificationTypes = {
    'all': { label: 'Toutes', icon: <Bell className="w-4 h-4" /> },
    'general': { label: 'Générales', icon: <Megaphone className="w-4 h-4" /> },
    'personal': { label: 'Personnelles', icon: <User className="w-4 h-4" /> },
    'chat': { label: 'Chat', icon: <MessageSquare className="w-4 h-4" /> }
  };

  // Priorités
  const priorities = {
    'faible': { label: 'Faible', color: '#10b981', icon: <Circle className="w-3 h-3 text-green-500" /> },
    'normale': { label: 'Normale', color: '#3b82f6', icon: <Circle className="w-3 h-3 text-blue-500" /> },
    'elevee': { label: 'Élevée', color: '#f59e0b', icon: <Circle className="w-3 h-3 text-yellow-500" /> },
    'critique': { label: 'Critique', color: '#ef4444', icon: <Circle className="w-3 h-3 text-red-500" /> }
  };

  // Icônes par type de notification
  const getNotificationIcon = (typeCode) => {
    const iconMap = {
      'projet_retard': <AlertTriangle className="w-4 h-4 text-red-500" />,
      'tache_retard': <Clock className="w-4 h-4 text-orange-500" />,
      'session_connexion': <User className="w-4 h-4 text-blue-500" />,
      'message_chat': <MessageSquare className="w-4 h-4 text-green-500" />,
      'systeme_maintenance': <Wrench className="w-4 h-4 text-purple-500" />,
      'annonce_generale': <Megaphone className="w-4 h-4 text-indigo-500" />,
      'tache_assignee': <CheckSquare className="w-4 h-4 text-blue-500" />,
      'tache_terminee': <CheckCircle className="w-4 h-4 text-green-500" />,
      'projet_chef': <Crown className="w-4 h-4 text-yellow-500" />,
      'projet_valide': <ThumbsUp className="w-4 h-4 text-green-500" />,
      'projet_en_cours': <PlayCircle className="w-4 h-4 text-blue-500" />,
      'projet_retard_perso': <AlertCircle className="w-4 h-4 text-red-500" />,
      'equipe_membre': <Users className="w-4 h-4 text-purple-500" />,
      'document_valide': <FileCheck className="w-4 h-4 text-green-500" />,
      'document_rejete': <FileX className="w-4 h-4 text-red-500" />
    };
    return iconMap[typeCode] || <Bell className="w-4 h-4 text-gray-500" />;
  };

  // Statuts
  const statuses = {
    'all': { label: 'Tous', color: '#6b7280' },
    'non_lue': { label: 'Non lues', color: '#ef4444' },
    'lue': { label: 'Lues', color: '#10b981' },
    'archivee': { label: 'Archivées', color: '#6b7280' }
  };

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
  }, [isOpen]);

  // Charger les notifications
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, activeTab]);

  // Filtrer les notifications
  useEffect(() => {
    filterNotifications();
  }, [notifications, searchTerm, filterStatus, filterPriority, activeTab]);

  const connectWebSocket = () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const wsUrl = `ws://localhost:8000/ws/notifications/?token=${token}`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connecté pour les notifications');
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket déconnecté');
      // Reconnexion automatique après 3 secondes
      reconnectTimeoutRef.current = setTimeout(() => {
        if (isOpen) {
          connectWebSocket();
        }
      }, 3000);
    };

    wsRef.current.onerror = (error) => {
      console.error('Erreur WebSocket:', error);
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
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'notification_general':
      case 'notification_personal':
        // Nouvelle notification reçue
        setNotifications(prev => [data.data, ...prev]);
        if (data.type === 'notification_personal') {
          setUnreadCount(prev => prev + 1);
        }
        break;
      case 'notifications_non_lues':
        // Mise à jour des notifications non lues
        setNotifications(prev => {
          const updated = [...prev];
          data.data.personnelles.forEach(notif => {
            const index = updated.findIndex(n => n.id === notif.id);
            if (index === -1) {
              updated.unshift(notif);
            }
          });
          return updated;
        });
        setUnreadCount(data.data.personnelles.length);
        break;
      default:
        break;
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      if (activeTab !== 'all') {
        params.append('type', activeTab);
      }
      if (filterStatus !== 'all') {
        params.append('statut', filterStatus);
      }
      if (filterPriority !== 'all') {
        params.append('priorite', filterPriority);
      }

      const response = await fetch(`http://localhost:8000/api/notifications/?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.results || data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = [...notifications];

    // Filtrer par type
    if (activeTab === 'general') {
      filtered = filtered.filter(n => n.est_generale);
    } else if (activeTab === 'personal') {
      filtered = filtered.filter(n => n.est_personnelle);
    }

    // Filtrer par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(n => n.statut === filterStatus);
    }

    // Filtrer par priorité
    if (filterPriority !== 'all') {
      filtered = filtered.filter(n => n.priorite === filterPriority);
    }

    // Filtrer par terme de recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(n => 
        n.titre.toLowerCase().includes(term) ||
        n.message.toLowerCase().includes(term)
      );
    }

    setFilteredNotifications(filtered);
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/notifications/mark-read/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notification_ids: [notificationId]
        })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, statut: 'lue', lue_le: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/notifications/mark-read/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          marquer_toutes: true
        })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, statut: 'lue', lue_le: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Erreur lors du marquage de toutes comme lues:', error);
    }
  };

  const archiveNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/notifications/archive/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notification_ids: [notificationId]
        })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, statut: 'archivee' }
              : n
          )
        );
      }
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Il y a quelques minutes';
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 48) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notification-center-overlay" onClick={onClose}>
      <div className="notification-center" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="notification-header">
          <div className="notification-title">
            <Bell className="notification-icon" />
            <h2>Centre de Notifications</h2>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </div>
          <div className="header-actions">
            <button 
              className="connection-status-btn"
              onClick={() => setShowConnectionStatus(true)}
              title="Statut des connexions"
            >
              <Users size={18} />
            </button>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="notification-tabs">
          {Object.entries(notificationTypes).map(([key, type]) => (
            <button
              key={key}
              className={`tab ${activeTab === key ? 'active' : ''}`}
              onClick={() => {
                if (key === 'chat') {
                  setShowChat(true);
                } else {
                  setActiveTab(key);
                }
              }}
            >
              <span className="tab-icon">{type.icon}</span>
              {type.label}
            </button>
          ))}
        </div>

        {/* Filtres et recherche */}
        <div className="notification-filters">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-controls">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              {Object.entries(statuses).map(([key, status]) => (
                <option key={key} value={key}>{status.label}</option>
              ))}
            </select>
            
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">Toutes priorités</option>
              {Object.entries(priorities).map(([key, priority]) => (
                <option key={key} value={key}>{priority.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="notification-actions">
          <button 
            className="action-btn mark-all-read"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <Check size={16} />
            Tout marquer comme lu
          </button>
        </div>

        {/* Liste des notifications */}
        <div className="notification-list">
          {loading ? (
            <div className="loading">Chargement...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <Bell size={48} />
              <p>Aucune notification</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item type-${notification.type_notification?.code} ${notification.statut} priority-${notification.priorite}`}
                onClick={() => notification.statut === 'non_lue' && markAsRead(notification.id)}
              >
                <div className="notification-content">
                  <div className="notification-meta">
                    <span className="priority-indicator priority-${notification.priorite}">
                      {priorities[notification.priorite]?.icon}
                    </span>
                    <span className={`notification-type-icon ${notification.type_notification?.code}`}>
                      {getNotificationIcon(notification.type_notification?.code)}
                    </span>
                    <span className={`notification-type-badge ${notification.type_notification?.est_generale ? 'generale' : 'personnelle'}`}>
                      {notification.type_notification?.est_generale ? 'Générale' : 'Personnelle'}
                    </span>
                    <span className="notification-date">
                      {formatDate(notification.cree_le)}
                    </span>
                  </div>
                  
                  <h4 className="notification-title-text">
                    {notification.titre}
                  </h4>
                  
                  <p className="notification-message">
                    {notification.message}
                  </p>
                  
                  {notification.projet_nom && (
                    <div className="notification-context">
                      <Eye className="w-3 h-3 inline mr-1" />
                      Projet: {notification.projet_nom}
                    </div>
                  )}
                  
                  {notification.tache_titre && (
                    <div className="notification-context">
                      <CheckSquare className="w-3 h-3 inline mr-1" />
                      Tâche: {notification.tache_titre}
                    </div>
                  )}
                </div>
                
                <div className="notification-actions-item">
                  {notification.statut === 'non_lue' && (
                    <button
                      className="action-btn-small"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      title="Marquer comme lu"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  
                  <button
                    className="action-btn-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      archiveNotification(notification.id);
                    }}
                    title="Archiver"
                  >
                    <Archive size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
             </div>
             
             {/* Connection Status */}
             <ConnectionStatus 
               isOpen={showConnectionStatus} 
               onClose={() => setShowConnectionStatus(false)} 
             />
           </div>
         );
       };

export default NotificationCenter;
