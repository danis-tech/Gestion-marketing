import React, { useState, useEffect } from 'react';
import { 
  Bell, MessageCircle, Users, Settings, Filter, Search,
  AlertTriangle, Clock, User, Megaphone, Wrench,
  CheckSquare, CheckCircle, Crown, ThumbsUp, PlayCircle,
  AlertCircle, Flag, FileCheck, FileX, Upload,
  Target, MessageSquare, Edit, Trash2, Eye, Download
} from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import RealtimeChat from './RealtimeChat';
import './NotificationPages.css';

const NotificationPages = () => {
  const [activePage, setActivePage] = useState('general');
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [stats, setStats] = useState({
    activeProjects: 0,
    onlineUsers: 0,
    delayedProjects: 0,
    activeTasks: 0
  });

  const pages = {
    general: {
      id: 'general',
      label: 'Générales',
      icon: <Bell className="w-5 h-5" />,
      description: 'Notifications générales, retards de projets, sessions de connexion et chat en temps réel'
    },
    personal: {
      id: 'personal',
      label: 'Personnelles',
      icon: <Users className="w-5 h-5" />,
      description: 'Vos notifications personnelles, tâches assignées, projets, équipes'
    }
  };

  const handlePageChange = (pageId) => {
    setActivePage(pageId);
    if (pageId === 'general') {
      setShowChat(false);
      setShowNotificationCenter(true);
    } else {
      setShowChat(false);
      setShowNotificationCenter(true);
    }
  };

  const openChat = () => {
    setShowChat(true);
    setShowNotificationCenter(false);
  };

  const openNotifications = () => {
    setShowNotificationCenter(true);
    setShowChat(false);
  };

  // Charger les statistiques en temps réel
  useEffect(() => {
    loadStats();
    loadOnlineUsers();
    
    // Actualiser toutes les 30 secondes
    const interval = setInterval(() => {
      loadStats();
      loadOnlineUsers();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      // Charger les statistiques des notifications
      const response = await fetch('http://localhost:8000/api/notifications/stats/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(prev => ({
          ...prev,
          activeProjects: data.total_notifications || 0,
          delayedProjects: data.notifications_par_priorite?.elevee || 0,
          activeTasks: data.notifications_par_type?.tache_assignee || 0
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const loadOnlineUsers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://localhost:8000/api/notifications/chat/online-users/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOnlineUsers(data.online_users || []);
        setStats(prev => ({
          ...prev,
          onlineUsers: data.count || 0
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs en ligne:', error);
    }
  };

  const closeModals = () => {
    setShowNotificationCenter(false);
    setShowChat(false);
  };

  return (
    <div className="notification-pages">
      {/* Header */}
      <div className="notification-pages-header">
        <div className="header-content">
          <div className="header-title">
            <Bell size={24} />
            <h1>Centre de Notifications</h1>
          </div>
          <p className="header-description">
            Gérez vos notifications générales et personnelles en temps réel
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="notification-pages-nav">
        {Object.values(pages).map((page) => (
          <button
            key={page.id}
            className={`nav-item ${activePage === page.id ? 'active' : ''}`}
            onClick={() => handlePageChange(page.id)}
          >
            <div className="nav-icon">{page.icon}</div>
            <div className="nav-content">
              <div className="nav-label">{page.label}</div>
              <div className="nav-description">{page.description}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="notification-pages-content">
        {activePage === 'general' && (
          <div className="page-content">
            <div className="content-header">
              <h2>Notifications Générales</h2>
              <p>Retards de projets, sessions de connexion, annonces et communication en temps réel</p>
            </div>

            <div className="content-grid">
              {/* Notifications générales */}
              <div className="content-card">
                <div className="card-header">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <h3>Notifications Système</h3>
                </div>
                <div className="card-content">
                  <p>Consultez les notifications générales du système :</p>
                  <ul>
                    <li className="flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span>Projets en retard</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span>Tâches en retard</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <User className="w-4 h-4 text-blue-500" />
                      <span>Sessions de connexion</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Megaphone className="w-4 h-4 text-indigo-500" />
                      <span>Annonces générales</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Wrench className="w-4 h-4 text-purple-500" />
                      <span>Maintenance système</span>
                    </li>
                  </ul>
                </div>
                <div className="card-actions">
                  <button 
                    className="action-btn primary"
                    onClick={openNotifications}
                  >
                    <Bell className="w-4 h-4" />
                    Voir les notifications
                  </button>
                </div>
              </div>

              {/* Chat en temps réel */}
              <div className="content-card">
                <div className="card-header">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  <h3>Chat Général</h3>
                </div>
                <div className="card-content">
                  <p>Communication en temps réel avec toute l'équipe :</p>
                  <ul>
                    <li className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4 text-green-500" />
                      <span>Messages instantanés</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span>Utilisateurs en ligne</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Edit className="w-4 h-4 text-gray-500" />
                      <span>Indicateur de frappe</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-yellow-500" />
                      <span>Notifications de connexion</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Settings className="w-4 h-4 text-purple-500" />
                      <span>Interface responsive</span>
                    </li>
                  </ul>
                </div>
                <div className="card-actions">
                  <button 
                    className="action-btn primary"
                    onClick={openChat}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Ouvrir le chat
                  </button>
                </div>
              </div>

              {/* Statistiques */}
              <div className="content-card">
                <div className="card-header">
                  <Users className="w-5 h-5 text-purple-600" />
                  <h3>Activité Générale</h3>
                </div>
                <div className="card-content">
                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-value">{stats.activeProjects}</div>
                      <div className="stat-label">Notifications totales</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{stats.onlineUsers}</div>
                      <div className="stat-label">Utilisateurs en ligne</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{stats.delayedProjects}</div>
                      <div className="stat-label">Notifications urgentes</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{stats.activeTasks}</div>
                      <div className="stat-label">Tâches assignées</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activePage === 'personal' && (
          <div className="page-content">
            <div className="content-header">
              <h2>Notifications Personnelles</h2>
              <p>Vos notifications personnelles, tâches, projets et équipes</p>
            </div>

            <div className="content-grid">
              {/* Tâches assignées */}
              <div className="content-card">
                <div className="card-header">
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                  <h3>Tâches Assignées</h3>
                </div>
                <div className="card-content">
                  <p>Notifications liées à vos tâches :</p>
                  <ul>
                    <li className="flex items-center gap-3">
                      <CheckSquare className="w-4 h-4 text-green-500" />
                      <span>Nouvelles tâches assignées</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-red-500" />
                      <span>Tâches en retard</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Target className="w-4 h-4 text-blue-500" />
                      <span>Tâches terminées</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Edit className="w-4 h-4 text-orange-500" />
                      <span>Modifications de tâches</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4 text-purple-500" />
                      <span>Commentaires sur vos tâches</span>
                    </li>
                  </ul>
                </div>
                <div className="card-actions">
                  <button 
                    className="action-btn primary"
                    onClick={openNotifications}
                  >
                    <CheckSquare className="w-4 h-4" />
                    Voir mes tâches
                  </button>
                </div>
              </div>

              {/* Projets */}
              <div className="content-card">
                <div className="card-header">
                  <Users className="w-5 h-5 text-purple-600" />
                  <h3>Projets & Équipes</h3>
                </div>
                <div className="card-content">
                  <p>Notifications liées à vos projets :</p>
                  <ul>
                    <li className="flex items-center gap-3">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      <span>Chef de projet</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span>Ajout à une équipe</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <ThumbsUp className="w-4 h-4 text-green-500" />
                      <span>Projet validé</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <PlayCircle className="w-4 h-4 text-blue-500" />
                      <span>Projet en cours</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span>Projet en retard</span>
                    </li>
                  </ul>
                </div>
                <div className="card-actions">
                  <button 
                    className="action-btn primary"
                    onClick={openNotifications}
                  >
                    <Users className="w-4 h-4" />
                    Voir mes projets
                  </button>
                </div>
              </div>

              {/* Documents */}
              <div className="content-card">
                <div className="card-header">
                  <Settings className="w-5 h-5 text-green-600" />
                  <h3>Documents & Validation</h3>
                </div>
                <div className="card-content">
                  <p>Notifications liées aux documents :</p>
                  <ul>
                    <li className="flex items-center gap-3">
                      <FileCheck className="w-4 h-4 text-green-500" />
                      <span>Document validé</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <FileX className="w-4 h-4 text-red-500" />
                      <span>Document rejeté</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Edit className="w-4 h-4 text-blue-500" />
                      <span>Demande de validation</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Edit className="w-4 h-4 text-orange-500" />
                      <span>Document modifié</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Upload className="w-4 h-4 text-purple-500" />
                      <span>Document téléversé</span>
                    </li>
                  </ul>
                </div>
                <div className="card-actions">
                  <button 
                    className="action-btn primary"
                    onClick={openNotifications}
                  >
                    <Settings className="w-4 h-4" />
                    Voir les documents
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <NotificationCenter 
        isOpen={showNotificationCenter} 
        onClose={closeModals}
        defaultTab={activePage}
      />
      
      <RealtimeChat 
        isOpen={showChat} 
        onClose={closeModals}
        roomName="general"
      />
    </div>
  );
};

export default NotificationPages;
