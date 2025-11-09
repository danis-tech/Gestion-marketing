import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Bell, Users, MessageSquare, Activity, AlertTriangle, 
  Clock, User, Megaphone, Wrench, CheckCircle, 
  TrendingUp, Eye, Send, Smile, Paperclip, Mic, Trash2,
  Play, Pause, Search, Filter, SortAsc, SortDesc, 
  Calendar, Tag, Archive, Star, X, ChevronDown, ChevronUp, CheckSquare
} from 'lucide-react';
import axios from 'axios';
import { getConfig } from '../../config/environment';
import './NotificationsPage.css';

const NotificationsPage = () => {
  // États pour les notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [newNotification, setNewNotification] = useState(null);
  
  // États pour le chat
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [lastTypingTime, setLastTypingTime] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [deletedMessages, setDeletedMessages] = useState(new Set());
  const [animationsDisabled, setAnimationsDisabled] = useState(false);
  
  // États pour les filtres et la recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, general, personal
  const [filterStatus, setFilterStatus] = useState('all'); // all, unread, read, archived
  const [filterPriority, setFilterPriority] = useState('all'); // all, faible, normale, elevee, critique
  const [filterDate, setFilterDate] = useState('all'); // all, today, week, month
  const [sortBy, setSortBy] = useState('date'); // date, priority, type
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [showFilters, setShowFilters] = useState(false);
  
  // États pour les statistiques
  const [stats, setStats] = useState({
    totalNotifications: 0,
    onlineUsers: 0,
    urgentNotifications: 0,
    assignedTasks: 0
  });
  
  // État pour les tâches assignées
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [showTasksModal, setShowTasksModal] = useState(false);
  
  // Refs
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  
  // Emojis populaires
  const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'];

  // Fonction pour basculer les animations
  const toggleAnimations = () => {
    setAnimationsDisabled(!animationsDisabled);
  };

  // Fonctions de filtrage et tri
  const getFilteredNotifications = () => {
    let filtered = [...notifications];

    // Filtre par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(notif => 
        notif.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (notif.type_notification && notif.type_notification.nom.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtre par type
    if (filterType !== 'all') {
      filtered = filtered.filter(notif => {
        if (filterType === 'general') return notif.destinataire === null || notif.destinataire === undefined;
        if (filterType === 'personal') return notif.destinataire !== null && notif.destinataire !== undefined;
        return true;
      });
    }

    // Filtre par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(notif => {
        if (filterStatus === 'unread') return !notif.lue;
        if (filterStatus === 'read') return notif.lue;
        if (filterStatus === 'archived') return notif.archivée;
        return true;
      });
    }

    // Filtre par priorité
    if (filterPriority !== 'all') {
      filtered = filtered.filter(notif => notif.priorite === filterPriority);
    }

    // Filtre par date
    if (filterDate !== 'all') {
      const now = new Date();
      
      filtered = filtered.filter(notif => {
        const notifDate = new Date(notif.cree_le);
        let matches = false;
        
        switch (filterDate) {
          case 'today':
            // Comparer les dates en ignorant l'heure
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const notifToday = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());
            matches = notifToday.getTime() === today.getTime();
            break;
          case 'yesterday':
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
            const notifYesterday = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());
            matches = notifYesterday.getTime() === yesterdayDate.getTime();
            break;
          case 'week':
            // Filtrer pour les 7 derniers jours
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matches = notifDate >= weekAgo && notifDate <= now;
            break;
          case 'month':
            // Filtrer pour les 30 derniers jours
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matches = notifDate >= monthAgo && notifDate <= now;
            break;
          default:
            matches = true;
        }
        
        return matches;
      });
    }

    // Tri
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.cree_le) - new Date(b.cree_le);
          break;
        case 'priority':
          const priorityOrder = { 'critique': 4, 'elevee': 3, 'normale': 2, 'faible': 1 };
          comparison = (priorityOrder[a.priorite] || 0) - (priorityOrder[b.priorite] || 0);
          break;
        case 'type':
          comparison = (a.type_notification?.nom || '').localeCompare(b.type_notification?.nom || '');
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterDate('all');
    setSortBy('date');
    setSortOrder('desc');
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critique': return '#dc2626';
      case 'elevee': return '#ea580c';
      case 'normale': return '#2563eb';
      case 'faible': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critique': return <AlertTriangle size={16} />;
      case 'elevee': return <AlertTriangle size={16} />;
      case 'normale': return <Bell size={16} />;
      case 'faible': return <CheckCircle size={16} />;
      default: return <Bell size={16} />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Aujourd\'hui';
    if (diffDays === 2) return 'Hier';
    if (diffDays <= 7) return `Il y a ${diffDays - 1} jours`;
    return date.toLocaleDateString('fr-FR');
  };

  // Effet pour appliquer les styles selon l'état des animations
  useEffect(() => {
    const style = document.createElement('style');
    if (animationsDisabled) {
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
        .notification-item:hover,
        .chat-block-large:hover,
        .activity-block:hover,
        .stat-card:hover,
        .message-bubble:hover,
        .send-btn-whatsapp:hover,
        .emoji-btn-whatsapp:hover,
        .delete-btn:hover,
        .action-button:hover {
          transform: none !important;
        }
      `;
    }
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [animationsDisabled]);

  // Créer une instance Axios avec authentification (mémorisée pour éviter les recréations)
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: `${getConfig('API_URL')}/api`,
      timeout: getConfig('TIMEOUTS.API_REQUEST'),
    headers: {
      'Content-Type': 'application/json',
    }
  });


    // Intercepteur pour ajouter le token d'authentification
    instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(getConfig('TOKENS.ACCESS_TOKEN_KEY'));
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
        
        
    return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Intercepteur pour gérer les erreurs 401
    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Le refresh token est géré par apiService, on redirige simplement
          localStorage.removeItem(getConfig('TOKENS.ACCESS_TOKEN_KEY'));
          localStorage.removeItem(getConfig('TOKENS.REFRESH_TOKEN_KEY'));
          localStorage.removeItem(getConfig('TOKENS.USER_DATA_KEY'));
          window.location.href = getConfig('ROUTES.HOME');
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, []);


  // Fonction pour charger l'utilisateur actuel
  const loadCurrentUser = async () => {
    try {
      const response = await api.get('/accounts/me/');
      setCurrentUser(response.data);
      setIsSuperAdmin(response.data.is_superuser || false);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du chargement de l\'utilisateur:', error);
      // Si l'utilisateur n'est pas authentifié, rediriger vers la page d'accueil
      if (error.response?.status === 401) {
        window.location.href = getConfig('ROUTES.HOME');
      }
      return null;
    }
  };

  // Charger les données initiales
  useEffect(() => {
    const initializeData = async () => {
      await loadCurrentUser();
      loadInitialData();
      connectWebSocket();
    };
    
    initializeData();
    
    return () => {
      disconnectWebSocket();
    };
  }, []);

  // Auto-scroll vers le bas pour les messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Vérifier si l'utilisateur est authentifié avant de charger les données
      const token = localStorage.getItem(getConfig('TOKENS.ACCESS_TOKEN_KEY'));
      if (!token) {
        window.location.href = getConfig('ROUTES.HOME');
        return;
      }
      
      // Charger TOUTES les notifications (générales + personnelles)
      const notificationsResponse = await api.get('/notifications/');
      const notificationsData = notificationsResponse.data.results || notificationsResponse.data || [];
      
      
      setNotifications(notificationsData);
      
      // Charger le compteur de notifications non lues
      const unreadResponse = await api.get('/notifications/unread-count/');
      setUnreadCount(unreadResponse.data.unread_count || 0);
      
      // Charger les utilisateurs en ligne
      const onlineResponse = await api.get('/notifications/chat/online-users/');
      setOnlineUsers(onlineResponse.data.online_users || []);
      
      // Charger le profil utilisateur
      const profileResponse = await api.get('/accounts/me/');
      setCurrentUser(profileResponse.data);
      
      // Charger les messages récents
      const messagesResponse = await api.get('/notifications/chat/messages/');
      const messagesData = messagesResponse.data.results || messagesResponse.data || [];
      setMessages(messagesData);
      
      // Charger les tâches assignées
      const tasksData = await loadAssignedTasks();
      
      // Calculer les statistiques
      setStats({
        totalNotifications: notificationsResponse.data.results?.length || notificationsResponse.data?.length || 0,
        onlineUsers: onlineResponse.data.online_users?.length || 0,
        urgentNotifications: (notificationsResponse.data.results || notificationsResponse.data || []).filter(n => n.priorite === 'elevee' || n.priorite === 'critique').length,
        assignedTasks: tasksData ? tasksData.length : 0
      });
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      // Si erreur 401, rediriger vers la page d'accueil
      if (error.response?.status === 401) {
        window.location.href = getConfig('ROUTES.HOME');
        return;
      }
      // Valeurs par défaut en cas d'erreur
      setOnlineUsers([{ id: 1, username: 'current', prenom: 'Utilisateur', nom: 'Actuel' }]);
      setStats(prev => ({ ...prev, onlineUsers: 1 }));
    } finally {
      setLoading(false);
    }
  };

  const loadAssignedTasks = async () => {
    try {
      const tasksResponse = await api.get('/notifications/assigned-tasks/');
      const tasksData = tasksResponse.data.assigned_tasks || [];
      setAssignedTasks(tasksData);
      return tasksData;
    } catch (error) {
      console.error('Erreur lors du chargement des tâches assignées:', error);
      return [];
    }
  };

  // Connexion WebSocket
  const connectWebSocket = () => {
    const token = localStorage.getItem(getConfig('TOKENS.ACCESS_TOKEN_KEY'));
    if (!token) return;

    const wsUrl = `ws://localhost:8000/ws/notifications/?token=${token}`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connecté pour les notifications');
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
        connectWebSocket();
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
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'notification_general':
        setNotifications(prev => [data.data, ...prev]);
        setStats(prev => ({ ...prev, totalNotifications: prev.totalNotifications + 1 }));
        showNotificationAlert(data.data);
        break;
      case 'notification_personal':
        setNotifications(prev => [data.data, ...prev]);
        setUnreadCount(prev => prev + 1);
        setStats(prev => ({ ...prev, totalNotifications: prev.totalNotifications + 1 }));
        showNotificationAlert(data.data);
        break;
      case 'chat_message':
        // Éviter les doublons en vérifiant si le message existe déjà
        setMessages(prev => {
          const messageExists = prev.some(msg => msg.id === data.data.id);
          if (messageExists) return prev;
          return [...prev, data.data];
        });
        break;
      case 'online_users_update':
        setOnlineUsers(data.data?.users || data.users || []);
        setStats(prev => ({ ...prev, onlineUsers: data.data?.users?.length || data.users?.length || 0 }));
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
      case 'message_deleted':
        setMessages(prev => prev.filter(msg => msg.id !== data.message_id));
        setDeletedMessages(prev => new Set([...prev, data.message_id]));
        console.log('Message supprimé en temps réel:', data.message_id, 'par:', data.deleted_by);
        break;
      case 'all_messages_deleted':
        setMessages([]);
        setDeletedMessages(new Set());
        console.log('Tous les messages supprimés par:', data.deleted_by);
        break;
      case 'error':
        console.error('Erreur WebSocket:', data.message);
        break;
      case 'notifications_non_lues':
        if (data.data?.generales) {
          setNotifications(prev => [...data.data.generales, ...prev]);
          setStats(prev => ({ ...prev, totalNotifications: prev.totalNotifications + data.data.generales.length }));
        }
        if (data.data?.personnelles) {
          setUnreadCount(prev => prev + data.data.personnelles.length);
          setStats(prev => ({ ...prev, totalNotifications: prev.totalNotifications + data.data.personnelles.length }));
        }
        break;
      default:
        break;
    }
  };

  // Fonction pour afficher une alerte de notification avec son
  const showNotificationAlert = (notification) => {
    // Jouer un son de notification
    playNotificationSound();
    
    // Afficher le toast
    setNewNotification(notification);
    setShowNotificationToast(true);
    
    // Masquer le toast après 5 secondes
    setTimeout(() => {
      setShowNotificationToast(false);
      setNewNotification(null);
    }, 5000);
  };

  // Fonction pour jouer un son de notification
  const playNotificationSound = () => {
    try {
      // Créer un contexte audio
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Réveiller le contexte audio si nécessaire (pour les navigateurs qui bloquent l'audio automatique)
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          playSound(audioContext);
        }).catch(() => {
          // Si on ne peut pas réveiller, essayer quand même
          playSound(audioContext);
        });
      } else {
        playSound(audioContext);
      }
    } catch (error) {
      // Essayer une méthode alternative avec un élément audio HTML
      try {
        const audio = new Audio();
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OSfTQ8OUKfk8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBtpvfDkn00PDlCn5PC2YxwGOJHX8sx5LAUkd8fw3ZBAC';
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Ignorer les erreurs d'autoplay
        });
      } catch (e) {
        // Ignorer les erreurs
      }
    }
  };

  // Fonction helper pour jouer le son
  const playSound = (audioContext) => {
    try {
      // Créer un oscillateur pour générer un son
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Connecter les nœuds
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configurer le son (fréquence, type d'onde)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800 Hz
      oscillator.type = 'sine';
      
      // Configurer le volume (fade in/out)
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
      
      // Jouer le son
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      // Ignorer les erreurs
    }
  };

  // Gérer la frappe
  const handleTyping = () => {
    if (!isConnected || !currentUser) return;
    
    const now = Date.now();
    setLastTypingTime(now);
    
    if (!isTyping) {
      setIsTyping(true);
      const typingData = {
        type: 'user_typing',
        user: currentUser
      };
      wsRef.current.send(JSON.stringify(typingData));
    }
    
    // Arrêter l'indicateur de frappe après 2 secondes
    setTimeout(() => {
      if (Date.now() - now >= 2000) {
        stopTyping();
      }
    }, 2000);
  };

  const stopTyping = () => {
    if (isTyping && isConnected && currentUser) {
      setIsTyping(false);
      const stopTypingData = {
        type: 'user_stopped_typing',
        user: currentUser
      };
      wsRef.current.send(JSON.stringify(stopTypingData));
    }
  };

  // Envoyer un message
  const sendMessage = () => {
    if (!newMessage.trim() || !isConnected) return;

    const messageData = {
      type: 'chat_message',
      message: newMessage.trim()
    };

    if (wsRef.current) {
      wsRef.current.send(JSON.stringify(messageData));
      setNewMessage('');
      setShowEmojiPicker(false);
      stopTyping();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else {
      handleTyping();
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Supprimer un message - Temps réel via WebSocket
  const deleteMessage = (messageId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      if (wsRef.current && isConnected) {
        const deleteData = {
          type: 'delete_message',
          message_id: messageId
        };
        wsRef.current.send(JSON.stringify(deleteData));
        console.log('Suppression envoyée via WebSocket:', deleteData);
      } else {
        console.error('WebSocket non connecté');
      }
    }
  };

  // Supprimer tous les messages (super admin seulement)
  const deleteAllMessages = () => {
    if (!isSuperAdmin) return;
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer TOUS les messages ? Cette action est irréversible !')) {
      if (wsRef.current && isConnected) {
        const deleteData = {
          type: 'delete_message',
          delete_all: true
        };
        wsRef.current.send(JSON.stringify(deleteData));
        console.log('Suppression de tous les messages envoyée via WebSocket:', deleteData);
      } else {
        console.error('WebSocket non connecté');
      }
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
    return message.expediteur.id === currentUser.id;
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await api.post('/notifications/mark-read/', {
        notification_ids: [notificationId]
      });
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, lue: true, lue_le: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
      if (error.response?.status === 401) {
        window.location.href = getConfig('ROUTES.HOME');
      }
    }
  };

  const archiveNotification = async (notificationId) => {
    try {
      await api.post('/notifications/archive/', {
        notification_ids: [notificationId]
      });
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, archivée: true, archivée_le: new Date().toISOString() }
            : n
        )
      );
      
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error);
      if (error.response?.status === 401) {
        window.location.href = getConfig('ROUTES.HOME');
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.lue);
      if (unreadNotifications.length === 0) return;

      const notificationIds = unreadNotifications.map(n => n.id);
      await api.post('/notifications/mark-read/', {
        notification_ids: notificationIds
      });
      
      setNotifications(prev => 
        prev.map(n => 
          !n.lue 
            ? { ...n, lue: true, lue_le: new Date().toISOString() }
            : n
        )
      );
      
      setUnreadCount(0);
      
    } catch (error) {
      console.error('Erreur lors du marquage en masse:', error);
    }
  };

  const archiveAll = async () => {
    try {
      const unarchivedNotifications = notifications.filter(n => !n.archivée);
      if (unarchivedNotifications.length === 0) return;

      const notificationIds = unarchivedNotifications.map(n => n.id);
      await api.post('/notifications/archive/', {
        notification_ids: notificationIds
      });
      
      setNotifications(prev => 
        prev.map(n => 
          !n.archivée 
            ? { ...n, archivée: true, archivée_le: new Date().toISOString() }
            : n
        )
      );
      
    } catch (error) {
      console.error('Erreur lors de l\'archivage en masse:', error);
      if (error.response?.status === 401) {
        window.location.href = getConfig('ROUTES.HOME');
      }
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}/`);
      
      setNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
      
      // Mettre à jour le compteur si c'était une notification non lue
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.lue) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      if (error.response?.status === 401) {
        window.location.href = getConfig('ROUTES.HOME');
      }
    }
  };

  const deleteAllNotifications = async () => {
    try {
      if (notifications.length === 0) return;

      // Confirmation avant suppression
      if (!window.confirm('Êtes-vous sûr de vouloir supprimer toutes les notifications ? Cette action est irréversible.')) {
        return;
      }

      const notificationIds = notifications.map(n => n.id);
      await api.post('/notifications/delete-bulk/', {
        notification_ids: notificationIds
      });
      
      setNotifications([]);
      setUnreadCount(0);
      
    } catch (error) {
      console.error('Erreur lors de la suppression en masse:', error);
      if (error.response?.status === 401) {
        window.location.href = getConfig('ROUTES.HOME');
      }
    }
  };

  return (
    <div className={`notifications-page ${animationsDisabled ? 'animations-disabled' : ''}`}>
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <Bell className="header-icon" />
            <h1>Centre de Notifications</h1>
          </div>
          <p className="header-subtitle">
            Gérez vos notifications générales et personnelles en temps réel
          </p>
          <div className="header-controls">
            <button 
              onClick={toggleAnimations}
              className={`animation-toggle-btn ${animationsDisabled ? 'disabled' : 'enabled'}`}
              title={animationsDisabled ? 'Activer les animations' : 'Désactiver les animations'}
            >
              {animationsDisabled ? <Play size={16} /> : <Pause size={16} />}
              {animationsDisabled ? ' Activer' : ' Désactiver'} les animations
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="page-content">
        {/* Bloc 1: Notifications Système */}
        <div className="notification-block">
          <div className="block-header">
            <Bell className="block-icon" />
            <h2>Notifications Système</h2>
            <div className="header-actions">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="filter-toggle-btn"
                title="Afficher/Masquer les filtres"
              >
                <Filter size={16} />
                Filtres
              </button>
              <button 
                onClick={markAllAsRead}
                className="action-btn-bulk mark-all-read"
                title="Marquer toutes comme lues"
              >
                <CheckCircle size={16} />
                Tout marquer lu
              </button>
              <button 
                onClick={archiveAll}
                className="action-btn-bulk archive-all"
                title="Archiver toutes les notifications"
              >
                <Archive size={16} />
                Tout archiver
              </button>
              {isSuperAdmin && (
                <button 
                  onClick={deleteAllNotifications}
                  className="action-btn-bulk delete-all"
                  title="Supprimer toutes les notifications (Super Admin)"
                >
                  <Trash2 size={16} />
                  Tout supprimer
                </button>
              )}
            </div>
          </div>
          <div className="block-content">
            <p className="block-description">
              Consultez toutes vos notifications (générales et personnelles) :
            </p>
            
            {/* Barre de recherche et filtres */}
            <div className="notification-controls">
              <div className="search-bar">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Rechercher dans les notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="clear-search-btn"
                    title="Effacer la recherche"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              
              {showFilters && (
                <div className="filters-panel">
                  <div className="filters-row">
                    <div className="filter-group">
                      <label>Type :</label>
                      <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                        <option value="all">Tous</option>
                        <option value="general">Générales</option>
                        <option value="personal">Personnelles</option>
                      </select>
                    </div>
                    
                    <div className="filter-group">
                      <label>Statut :</label>
                      <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="all">Tous</option>
                        <option value="unread">Non lues</option>
                        <option value="read">Lues</option>
                        <option value="archived">Archivées</option>
                      </select>
                    </div>
                    
                    <div className="filter-group">
                      <label>Priorité :</label>
                      <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                        <option value="all">Toutes</option>
                        <option value="critique">Critique</option>
                        <option value="elevee">Élevée</option>
                        <option value="normale">Normale</option>
                        <option value="faible">Faible</option>
                      </select>
                    </div>
                    
                    <div className="filter-group">
                      <label>Période :</label>
                      <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)}>
                        <option value="all">Toutes</option>
                        <option value="today">Aujourd'hui</option>
                        <option value="yesterday">Hier</option>
                        <option value="week">Cette semaine</option>
                        <option value="month">Ce mois</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="filters-row">
                    <div className="filter-group">
                      <label>Trier par :</label>
                      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="date">Date</option>
                        <option value="priority">Priorité</option>
                        <option value="type">Type</option>
                      </select>
                    </div>
                    
                    <div className="filter-group">
                      <label>Ordre :</label>
                      <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                        <option value="desc">Décroissant</option>
                        <option value="asc">Croissant</option>
                      </select>
                    </div>
                    
                    <button onClick={clearFilters} className="clear-filters-btn">
                      <X size={16} />
                      Effacer les filtres
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="notification-list">
              {loading ? (
                <div className="loading">Chargement...</div>
              ) : getFilteredNotifications().length === 0 ? (
                <div className="empty-state">
                  <Bell size={32} />
                  <p>
                    {searchTerm || filterType !== 'all' || filterStatus !== 'all' || filterPriority !== 'all' || filterDate !== 'all' 
                      ? 'Aucune notification ne correspond aux critères de recherche'
                      : 'Aucune notification'
                    }
                  </p>
                  {(searchTerm || filterType !== 'all' || filterStatus !== 'all' || filterPriority !== 'all' || filterDate !== 'all') && (
                    <button onClick={clearFilters} className="clear-filters-btn">
                      Effacer les filtres
                    </button>
                  )}
                </div>
              ) : (
                getFilteredNotifications().map((notification, index) => (
                  <div
                    key={`notification-${notification.id}-${index}`}
                    className={`notification-item ${notification.lue ? 'lue' : 'non_lue'} priority-${notification.priorite}`}
                    onClick={() => !notification.lue && markNotificationAsRead(notification.id)}
                  >
                    <div className="notification-content">
                      <div className="notification-header">
                      <div className="notification-meta">
                        <div className="notification-meta-left">
                            <div className="priority-badge" style={{ backgroundColor: getPriorityColor(notification.priorite) }}>
                              {getPriorityIcon(notification.priorite)}
                              <span>{notification.priorite}</span>
                        </div>
                            <span className="notification-type">
                              {notification.type_notification?.nom || 'Système'}
                            </span>
                            {(!notification.destinataire || notification.destinataire === null) ? (
                              <span className="notification-category general">Générale</span>
                            ) : (
                              <span className="notification-category personal">Personnelle</span>
                            )}
                          </div>
                          <div className="notification-meta-right">
                        <span className="notification-date">
                          {formatDate(notification.cree_le)}
                        </span>
                            <span className="notification-time">
                              {new Date(notification.cree_le).toLocaleTimeString('fr-FR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                        </span>
                      </div>
                        </div>
                      </div>
                      
                      <div className="notification-body">
                      <h4 className="notification-title">
                        {notification.titre}
                      </h4>
                      <p className="notification-message">
                        {notification.message}
                      </p>
                        
                        {/* Informations supplémentaires */}
                        <div className="notification-details">
                          {notification.cree_par && (
                            <div className="notification-author">
                              <User size={14} />
                              <span>Créé par: {notification.cree_par.prenom} {notification.cree_par.nom}</span>
                            </div>
                          )}

                          {notification.destinataire && (
                            <div className="notification-recipient">
                              <User size={14} />
                              <span>Destinataire: {
                                (notification.destinataire.prenom && notification.destinataire.nom) 
                                  ? `${notification.destinataire.prenom} ${notification.destinataire.nom}`
                                  : notification.destinataire.username
                              }</span>
                            </div>
                          )}
                          
                          {notification.projet && (
                            <div className="notification-project">
                              <Activity size={14} />
                              <span>Projet: {notification.projet.nom}</span>
                            </div>
                          )}
                          
                          {notification.tache && (
                            <div className="notification-task">
                              <CheckCircle size={14} />
                              <span>Tâche: {notification.tache.titre}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="notification-footer">
                        <div className="notification-status">
                          {notification.lue ? (
                            <span className="status-read">
                              <CheckCircle size={14} />
                              Lue
                            </span>
                          ) : (
                            <span className="status-unread">
                              <Eye size={14} />
                              Non lue
                            </span>
                          )}
                          {notification.archivée && (
                            <span className="status-archived">
                              <Archive size={14} />
                              Archivée
                            </span>
                          )}
                        </div>
                        
                        <div className="notification-actions">
                          {!notification.lue && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                markNotificationAsRead(notification.id);
                              }}
                              className="action-btn mark-read"
                              title="Marquer comme lue"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                          
                          {!notification.archivée && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                archiveNotification(notification.id);
                              }}
                              className="action-btn archive"
                              title="Archiver"
                            >
                              <Archive size={14} />
                            </button>
                          )}
                          
                          {isSuperAdmin && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Êtes-vous sûr de vouloir supprimer cette notification ? Cette action est irréversible.')) {
                                  deleteNotification(notification.id);
                                }
                              }}
                              className="action-btn delete"
                              title="Supprimer (Super Admin)"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bloc 2: Chat Général (Plus grand) */}
        <div className="chat-block-large">
          <div className="block-header">
            <MessageSquare className="block-icon" />
            <h2>Chat Général</h2>
            <div className="connection-status">
              <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected && <div className="pulse-dot"></div>}
              </div>
              <span className="status-text">
                {isConnected ? (
                  <>
                    <span className="realtime-indicator">●</span>
                    {onlineUsers.length} utilisateur{onlineUsers.length > 1 ? 's' : ''} en ligne
                  </>
                ) : (
                  'Connexion perdue'
                )}
              </span>
              {isSuperAdmin && (
                <button
                  className="delete-all-messages-btn"
                  onClick={deleteAllMessages}
                  title="Supprimer tous les messages (Super Admin)"
                >
                  <Trash2 size={16} />
                  <span>Vider le chat</span>
                </button>
              )}
            </div>
          </div>
          <div className="block-content">
            <div className="chat-messages-large">
              {messages.length === 0 ? (
                <div className="empty-chat">
                  <MessageSquare size={48} />
                  <p>Aucun message pour le moment</p>
                  <p>Soyez le premier à écrire !</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  // Filtrer les messages système
                  if (message.est_systeme || 
                      message.message.includes('s\'est connecté') || 
                      message.message.includes('s\'est déconnecté')) {
                    return null;
                  }
                  
                  const isMyMsg = isMyMessage(message);
                  const showDate = index === 0 || 
                    formatDate(message.cree_le) !== formatDate(messages[index - 1].cree_le);
                  
                  
                  return (
                    <div key={`msg-${message.id}-${index}-${message.cree_le}`}>
                      {showDate && (
                        <div className="message-date-separator">
                          {formatDate(message.cree_le)}
                        </div>
                      )}
                      
                      <div className={`chat-message ${isMyMsg ? 'my-message' : 'other-message'}`}>
                        <div className={`message-sender-info ${isMyMsg ? 'my-sender-info' : 'other-sender-info'}`}>
                          <span className="sender-name">
                            {message.expediteur?.prenom} {message.expediteur?.nom}
                          </span>
                          <span className="sender-service">
                            {message.expediteur?.service?.nom || 
                             message.expediteur?.service_nom || 
                             'Service non défini'}
                          </span>
                        </div>
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
                    <CheckCircle size={12} />
                  </div>
                )}
                {/* Bouton de suppression - visible pour tous sur leurs messages, et pour super admin sur tous */}
                {(isMyMsg || isSuperAdmin) && (
                  <button
                    className="delete-message-btn"
                    onClick={() => deleteMessage(message.id)}
                    title={isMyMsg ? "Supprimer votre message" : "Supprimer le message (Super Admin)"}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      opacity: 1,
                      visibility: 'visible'
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                            {/* Debug: Afficher le statut super admin */}
                            {process.env.NODE_ENV === 'development' && (
                              <span style={{fontSize: '14px', color: 'rgba(255,255,255,0.3)'}}>
                                SA: {isSuperAdmin ? 'OUI' : 'NON'}
                              </span>
                            )}
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
                    {typingUsers.length === 1 
                      ? `${typingUsers[0].prenom} est en train d'écrire...`
                      : `${typingUsers.length} personnes sont en train d'écrire...`
                    }
                  </span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input de chat style WhatsApp */}
            <div className="chat-input-whatsapp">
              <div className="input-container-whatsapp">
                <button 
                  className="emoji-btn-whatsapp"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  title="Emojis"
                >
                  <Smile size={20} />
                </button>
                
                <div className="input-wrapper-whatsapp">
                  <textarea
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder={isConnected ? "Tapez un message..." : "Connexion perdue..."}
                    disabled={!isConnected}
                    rows={1}
                    className="message-input-whatsapp"
                  />
                </div>
                
                {newMessage.trim() ? (
                  <button
                    onClick={sendMessage}
                    disabled={!isConnected}
                    className="send-btn-whatsapp"
                    title="Envoyer"
                  >
                    <Send size={18} />
                  </button>
                ) : (
                  <div className="send-placeholder"></div>
                )}
              </div>
              
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="emoji-picker-whatsapp">
                  <div className="emoji-grid-whatsapp">
                    {emojis.map((emoji, index) => (
                      <button
                        key={index}
                        className="emoji-btn-picker"
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

        {/* Bloc 3: Activité Générale */}
        <div className="activity-block">
          <div className="block-header">
            <Activity className="block-icon" />
            <h2>Activité Générale</h2>
          </div>
          <div className="block-content">
            <div className="stats-grid">
              <div className="stat-card notifications-total">
                <div className="stat-icon">
                  <Bell size={24} />
                </div>
                <div className="stat-content">
                <div className="stat-number">{stats.totalNotifications}</div>
                <div className="stat-label">NOTIFICATIONS TOTALES</div>
              </div>
              </div>
              
              <div className="stat-card online-users">
                <div className="stat-icon">
                  <Users size={24} />
                </div>
                <div className="stat-content">
                <div className="stat-number">{stats.onlineUsers}</div>
                <div className="stat-label">UTILISATEURS EN LIGNE</div>
              </div>
              </div>
              
              
              
              <div className="stat-card assigned-tasks" onClick={() => setShowTasksModal(true)}>
                <div className="stat-icon">
                  <CheckSquare size={24} />
                </div>
                <div className="stat-content">
                <div className="stat-number">{stats.assignedTasks}</div>
                <div className="stat-label">TÂCHES ASSIGNÉES</div>
              </div>
                {stats.assignedTasks > 0 && (
                  <div className="stat-badge">
                    <span>Cliquez pour voir</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast de notification */}
      {showNotificationToast && newNotification && (
        <div className="notification-toast">
          <div className="toast-content">
            <div className="toast-icon">
              <Bell size={20} />
            </div>
            <div className="toast-text">
              <div className="toast-title">{newNotification.titre}</div>
              <div className="toast-message">{newNotification.message}</div>
            </div>
            <button 
              className="toast-close"
              onClick={() => setShowNotificationToast(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Modal des tâches assignées */}
      {showTasksModal && (
        <div className="modal-overlay" onClick={() => setShowTasksModal(false)}>
          <div className="modal-content tasks-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <CheckSquare size={20} />
                Tâches Assignées
              </h3>
              <button 
                className="modal-close"
                onClick={() => setShowTasksModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              {assignedTasks.length === 0 ? (
                <div className="empty-tasks">
                  <CheckSquare size={48} />
                  <p>Aucune tâche assignée</p>
                  <span>Vous n'avez actuellement aucune tâche en cours</span>
                </div>
              ) : (
                <div className="tasks-list">
                  {assignedTasks.map((task) => (
                    <div key={task.id} className="task-item">
                      <div className="task-header">
                        <div className="task-title">{task.titre}</div>
                        <div className={`task-status status-${task.statut}`}>
                          {task.statut.replace('_', ' ')}
                        </div>
                      </div>
                      
                      <div className="task-details">
                        <div className="task-project">
                          <Activity size={14} />
                          <span>{task.projet.nom}</span>
                        </div>
                        
                        {task.description && (
                          <div className="task-description">
                            {task.description}
                          </div>
                        )}
                        
                        <div className="task-meta">
                          <div className="task-priority">
                            <span className={`priority-badge priority-${task.priorite}`}>
                              {task.priorite}
                            </span>
                          </div>
                          
                          {task.fin && (
                            <div className="task-deadline">
                              <Clock size={14} />
                              <span>Échéance: {new Date(task.fin).toLocaleDateString('fr-FR')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
