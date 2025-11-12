import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Users,
  FolderOpen,
  CheckCircle,
  Activity,
  Target,
  RefreshCw,
  Eye,
  BarChart2,
  Users2,
  Clock,
  AlertCircle,
  Calendar,
  User,
  Zap,
  Star,
  Award,
  Hash,
  FileText
} from 'lucide-react';
import { analyticsService } from '../../services/apiService';
import { apiClient } from '../../services/apiService';
import MemberDetailsModal from '../modals/MemberDetailsModal';
import TaskDetailsModal from '../ui/TaskDetailsModal';
import { AlertTriangle, Bell } from 'lucide-react';
import './SummaryCharts.css';

const SummaryCharts = ({ type = 'all', projectId = null }) => {
  const [data, setData] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartTypes, setChartTypes] = useState({
    projects: 'pie',
    tasks: 'bar',
    teams: 'line'
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [urgentNotifications, setUrgentNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const wsRef = React.useRef(null);

  useEffect(() => {
    // Réinitialiser les données quand projectId change
    setData(null);
    setProjectData(null);
    setError(null);
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Charger les notifications urgentes
  const loadUrgentNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      params.append('priorite', 'critique');
      params.append('statut', 'non_lue');
      params.append('ordering', '-cree_le');

      const response = await fetch(`http://localhost:8000/api/notifications/?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        let notifications = data.results || data || [];
        
        // Si pas assez de notifications critiques, ajouter les élevées
        if (notifications.length < 5) {
          const paramsElevee = new URLSearchParams();
          paramsElevee.append('priorite', 'elevee');
          paramsElevee.append('statut', 'non_lue');
          paramsElevee.append('ordering', '-cree_le');
          
          const responseElevee = await fetch(`http://localhost:8000/api/notifications/?${paramsElevee}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (responseElevee.ok) {
            const dataElevee = await responseElevee.json();
            const notificationsElevee = dataElevee.results || dataElevee || [];
            notifications.push(...notificationsElevee.slice(0, 5 - notifications.length));
          }
        }
        
        // Filtrer et limiter à 5 notifications les plus récentes (critique ou élevée, non lues)
        const urgentOnly = notifications.filter(n => 
          (n.priorite === 'critique' || n.priorite === 'elevee') && n.statut === 'non_lue'
        ).slice(0, 5);
        setUrgentNotifications(urgentOnly);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications urgentes:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Connexion WebSocket pour les notifications en temps réel
  useEffect(() => {
    const connectWebSocket = () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const wsUrl = `ws://localhost:8000/ws/notifications/?token=${token}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        // WebSocket connecté
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Erreur parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        // Ne pas reconnecter si la fermeture est normale (code 1000) ou si le composant est en train de se démonter
        if (event.code !== 1000 && wsRef.current) {
          // Reconnexion automatique après 3 secondes
          setTimeout(() => {
            if (wsRef.current?.readyState === WebSocket.CLOSED) {
              connectWebSocket();
            }
          }, 3000);
        }
      };

      wsRef.current.onerror = () => {
        // Ignore WebSocket errors silently
      };
    };

    connectWebSocket();
    loadUrgentNotifications();

    return () => {
      if (wsRef.current) {
        try {
          wsRef.current.close(1000, 'Component unmounting');
        } catch (error) {
          // Ignore errors during cleanup
        }
        wsRef.current = null;
      }
    };
  }, []);

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'notification_general':
      case 'notification_personal':
        // Nouvelle notification reçue
        const newNotif = data.data;
        if (newNotif && (newNotif.priorite === 'critique' || newNotif.priorite === 'elevee') && newNotif.statut === 'non_lue') {
          setUrgentNotifications(prev => {
            const updated = [newNotif, ...prev.filter(n => n.id !== newNotif.id)];
            return updated.slice(0, 5);
          });
        }
        break;
      case 'notifications_non_lues':
        // Mise à jour des notifications non lues
        if (data.data && data.data.personnelles) {
          const urgentNotifs = data.data.personnelles.filter(n => 
            (n.priorite === 'critique' || n.priorite === 'elevee') && n.statut === 'non_lue'
          );
          if (urgentNotifs.length > 0) {
            setUrgentNotifications(prev => {
              const updated = [...urgentNotifs, ...prev.filter(n => 
                !urgentNotifs.some(un => un.id === n.id)
              )];
              return updated.slice(0, 5);
            });
          }
        }
        break;
      default:
        break;
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setIsAnimating(true);
      
      if (projectId) {
        // Charger les données détaillées du projet
        try {
          const response = await analyticsService.getProjectDetails(projectId);
          
          if (response && response.project) {
            setProjectData(response);
            setData(null);
            setError(null);
          } else {
            setError('Projet non trouvé');
            setProjectData(null);
            setData(null);
          }
        } catch (err) {
          // Si le projet n'existe pas, charger les données générales
          const response = await analyticsService.getDashboard(30, null);
          setData(response);
          setProjectData(null);
          setError('Projet non trouvé, affichage des données générales');
        }
      } else {
        // Charger les données générales du dashboard
        const response = await analyticsService.getDashboard(30, null);
        setData(response);
        setProjectData(null);
        setError(null);
      }

      setTimeout(() => {
        setIsAnimating(false);
      }, 800);
    } catch (err) {
      setError('Impossible de charger les données');
      setIsAnimating(false);
    } finally {
      setLoading(false);
    }
  };

  const handleChartTypeChange = (chartName, newType) => {
    setChartTypes(prev => ({
      ...prev,
      [chartName]: newType
    }));
  };

  if (loading) {
    return (
      <div className="chart-content-placeholder">
        <div className="loading-spinner">Chargement des données...</div>
      </div>
    );
  }

  if (error || (!data && !projectData)) {
    return (
      <div className="chart-content-placeholder">
        <div className="error-message">{error || 'Aucune donnée disponible'}</div>
      </div>
    );
  }

  // Si un projet est sélectionné, utiliser les données du projet
  let projectsData, totalProjects, completedProjects;
  let tasksData, totalTasks, completedTasks;
  let teamsData, totalMembers;

  if (projectData) {
    // --- Projects Data (Progression par phase) ---
    const progression = projectData.progression || {};
    projectsData = [
      { name: 'Terminées', value: progression.phases_terminees || 0, color: '#22c55e' },
      { name: 'En cours', value: progression.phases_en_cours || 0, color: '#3b82f6' },
      { name: 'En attente', value: progression.phases_en_attente || 0, color: '#f59e0b' },
    ].filter(item => item.value > 0);
    totalProjects = progression.total_phases || 0;
    completedProjects = progression.phases_terminees || 0;

    // --- Tasks Data (Tâches du projet) ---
    const taches = projectData.taches || {};
    const tachesParStatut = taches.par_statut || {};
    // Ordre des statuts : En attente, En cours, Terminées, En retard
    tasksData = [
      { 
        name: 'En attente', 
        value: tachesParStatut.en_attente || 0, 
        color: '#f59e0b',
        icon: '⏳',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
      },
      { 
        name: 'En cours', 
        value: tachesParStatut.en_cours || 0, 
        color: '#3b82f6',
        icon: '🔄',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
      },
      { 
        name: 'Terminées', 
        value: tachesParStatut.termine || 0, 
        color: '#22c55e',
        icon: '✅',
        gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
      },
      { 
        name: 'Hors délai', 
        value: tachesParStatut.hors_delai || 0, 
        color: '#dc2626',
        icon: '⚠️',
        gradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
      },
    ].filter(item => item.value > 0);
    totalTasks = taches.total || 0;
    completedTasks = tachesParStatut.termine || 0;

    // --- Teams Data (Membres par service) ---
    const equipe = projectData.equipe || {};
    teamsData = (equipe.par_service || []).map((service, index) => ({
      name: service.service,
      value: service.count,
      color: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]
    })).filter(item => item.value > 0);
    totalMembers = equipe.total_membres || 0;
  } else {
    // Données générales (pas de projet sélectionné)
  const projectsMetrics = data.categories?.projects || [];
  const tasksMetrics = data.categories?.tasks || [];
  const usersMetrics = data.categories?.users || [];

  // --- Projects Data ---
    projectsData = [
    { name: 'En attente', value: projectsMetrics.find(m => m.name === 'Projets en_attente')?.value || 0, color: '#f59e0b' },
    { name: 'Terminés', value: projectsMetrics.find(m => m.name === 'Projets termine')?.value || 0, color: '#22c55e' },
    { name: 'En retard', value: projectsMetrics.find(m => m.name === 'Projets hors_delai')?.value || 0, color: '#dc2626' },
    { name: 'Rejetés', value: projectsMetrics.find(m => m.name === 'Projets rejete')?.value || 0, color: '#ef4444' },
    { name: 'Nouveaux', value: projectsMetrics.find(m => m.name === 'Nouveaux projets')?.value || 0, color: '#3b82f6' },
  ].filter(item => item.value > 0);
    totalProjects = projectsMetrics.find(m => m.name === 'Total des projets')?.value || 0;
    completedProjects = projectsMetrics.find(m => m.name === 'Projets termine')?.value || 0;

  // --- Tasks Data ---
    tasksData = [
    { name: 'Nouvelles', value: tasksMetrics.find(m => m.name === 'Nouvelles tâches')?.value || 0, color: '#8b5cf6' },
    { name: 'En attente', value: tasksMetrics.find(m => m.name === 'Tâches en_attente')?.value || 0, color: '#f59e0b' },
    { name: 'Terminées', value: tasksMetrics.find(m => m.name === 'Tâches termine')?.value || 0, color: '#22c55e' },
    { name: 'En retard', value: tasksMetrics.find(m => m.name === 'Tâches hors_delai')?.value || 0, color: '#dc2626' },
    { name: 'Priorité haute', value: tasksMetrics.find(m => m.name === 'Tâches haut')?.value || 0, color: '#ef4444' },
  ].filter(item => item.value > 0);
    totalTasks = tasksMetrics.find(m => m.name === 'Total des tâches')?.value || 0;
    completedTasks = tasksMetrics.find(m => m.name === 'Tâches termine')?.value || 0;

    // --- Teams Data ---
    teamsData = (usersMetrics || [])
    .filter(m => m.name.startsWith('Membres - '))
    .map((m, index) => ({
      name: m.name.replace('Membres - ', ''),
      value: m.value,
      color: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]
    }))
    .filter(item => item.value > 0);
    totalMembers = teamsData.reduce((sum, item) => sum + item.value, 0);
  }

  const renderChartContent = (chartType, data, dataKey, nameKey, colors, icon, noDataMessage) => {
    if (data.length === 0) {
      return (
        <div className="no-data" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          minHeight: '160px',
          textAlign: 'center',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}>
          {icon && React.cloneElement(icon, { 
            size: 48, 
            style: { 
              color: '#9ca3af', 
              marginBottom: '16px',
              opacity: 0.6,
              display: 'block',
              margin: '0 auto 16px'
            } 
          })}
          <p style={{
            fontSize: '16px',
            color: '#374151',
            margin: '0 auto',
            fontWeight: '600',
            lineHeight: '1.5',
            maxWidth: '500px',
            textAlign: 'center',
            width: '100%',
            display: 'block'
          }}>{noDataMessage}</p>
          <p style={{
            fontSize: '13px',
            color: '#6b7280',
            margin: '8px auto 0',
            lineHeight: '1.5',
            textAlign: 'center',
            maxWidth: '500px',
            width: '100%',
            display: 'block'
          }}>Les données apparaîtront ici une fois disponibles</p>
        </div>
      );
    }

    const commonTooltipStyle = {
      background: 'rgba(255, 255, 255, 0.95)',
      border: 'none',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      padding: '10px',
    };

    switch (chartType) {
      case 'pie':
        return (
          <PieChart>
            <defs>
              {data.map((entry, index) => (
                <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={entry.color || colors[index % colors.length]} stopOpacity={1} />
                  <stop offset="100%" stopColor={entry.color || colors[index % colors.length]} stopOpacity={0.8} />
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={140}
              innerRadius={70}
              dataKey={dataKey}
              nameKey={nameKey}
              animationBegin={0}
              animationDuration={1200}
              animationEasing="ease-out"
              label={({ name, percent, value, cx, cy, midAngle, innerRadius, outerRadius }) => {
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                
                return (
                  <g>
                    <text 
                      x={x} 
                      y={y - 8} 
                      textAnchor={x > cx ? 'start' : 'end'} 
                      dominantBaseline="central"
                      style={{ 
                        fontSize: '15px', 
                        fontWeight: '700', 
                        fill: '#1f2937',
                        textShadow: '0 1px 2px rgba(255,255,255,0.8)'
                      }}
                    >
                      {name}
                    </text>
                    <text 
                      x={x} 
                      y={y + 12} 
                      textAnchor={x > cx ? 'start' : 'end'} 
                      dominantBaseline="central"
                      style={{ 
                        fontSize: '18px', 
                        fontWeight: '800', 
                        fill: '#111827',
                        textShadow: '0 1px 2px rgba(255,255,255,0.8)'
                      }}
                    >
                      {value}
                    </text>
                    <text 
                      x={x} 
                      y={y + 28} 
                      textAnchor={x > cx ? 'start' : 'end'} 
                      dominantBaseline="central"
                      style={{ 
                        fontSize: '13px', 
                        fill: '#6b7280',
                        fontWeight: '600',
                        textShadow: '0 1px 2px rgba(255,255,255,0.8)'
                      }}
                    >
                      {`${(percent * 100).toFixed(1)}%`}
                    </text>
                  </g>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={`url(#gradient-${index})`}
                  stroke="#ffffff"
                  strokeWidth={3}
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name) => [value, name]} 
              contentStyle={{
                ...commonTooltipStyle, 
                fontSize: '14px', 
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                fontWeight: '600'
              }} 
              labelStyle={{ fontWeight: '700', marginBottom: '6px', fontSize: '15px' }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '13px', paddingTop: '24px', fontWeight: '600' }} 
              iconSize={18}
              iconType="circle"
              formatter={(value) => <span style={{ color: '#374151', fontWeight: '600' }}>{value}</span>}
            />
          </PieChart>
        );
      case 'radial':
        return (
          <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" barSize={20} data={data}>
            <RadialBar minAngle={15} label={{ position: 'insideStart', fill: '#fff', fontSize: 14 }} background clockWise dataKey={dataKey}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
              ))}
            </RadialBar>
            <Tooltip formatter={(value, name) => [value, name]} contentStyle={{...commonTooltipStyle, fontSize: '14px', padding: '12px'}} />
            <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }} iconSize={16} />
          </RadialBarChart>
        );
      case 'bar':
        return (
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey={nameKey} 
              tick={{ fontSize: 14, fill: '#374151' }}
              label={{ value: nameKey, position: 'insideBottom', offset: -10, style: { fontSize: 14, fill: '#374151' } }}
            />
            <YAxis 
              tick={{ fontSize: 14, fill: '#374151' }}
              label={{ value: dataKey, angle: -90, position: 'insideLeft', style: { fontSize: 14, fill: '#374151' } }}
            />
            <Tooltip formatter={(value, name) => [value, name]} contentStyle={{...commonTooltipStyle, fontSize: '14px', padding: '12px'}} />
            <Bar dataKey={dataKey} radius={[8, 8, 0, 0]} barSize={60}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        );
      case 'area':
        return (
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey={nameKey} 
              tick={{ fontSize: 14, fill: '#374151' }}
              label={{ value: nameKey, position: 'insideBottom', offset: -10, style: { fontSize: 14, fill: '#374151' } }}
            />
            <YAxis 
              tick={{ fontSize: 14, fill: '#374151' }}
              label={{ value: dataKey, angle: -90, position: 'insideLeft', style: { fontSize: 14, fill: '#374151' } }}
            />
            <Tooltip formatter={(value, name) => [value, name]} contentStyle={{...commonTooltipStyle, fontSize: '14px', padding: '12px'}} />
            <Area type="monotone" dataKey={dataKey} stroke={colors[0]} strokeWidth={3} fill={colors[0]} fillOpacity={0.6} />
          </AreaChart>
        );
      case 'line':
        return (
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey={nameKey} 
              tick={{ fontSize: 14, fill: '#374151' }}
              label={{ value: nameKey, position: 'insideBottom', offset: -10, style: { fontSize: 14, fill: '#374151' } }}
            />
            <YAxis 
              tick={{ fontSize: 14, fill: '#374151' }}
              label={{ value: dataKey, angle: -90, position: 'insideLeft', style: { fontSize: 14, fill: '#374151' } }}
            />
            <Tooltip formatter={(value, name) => [value, name]} contentStyle={{...commonTooltipStyle, fontSize: '14px', padding: '12px'}} />
            <Line type="monotone" dataKey={dataKey} stroke={colors[0]} strokeWidth={4} dot={{ fill: colors[0], strokeWidth: 2, r: 8 }} activeDot={{ r: 10 }} />
          </LineChart>
        );
      default:
        return null;
    }
  };

  const renderChartCard = (chartName, title, subtitle, icon, data, dataKey, nameKey, colors, stats, noDataMessage = null) => (
    <div className={`summary-chart-card ${isAnimating ? 'animating' : ''}`}>
      <div className="chart-header">
        <div className="chart-title">
          <div className={`chart-icon-wrapper ${chartName}`}>
            {icon && React.cloneElement(icon, { size: 20 })}
          </div>
          <div className="chart-title-text">
            {title && <h3>{title}</h3>}
            <span className="chart-subtitle">{subtitle}</span>
          </div>
        </div>
        <div className="chart-controls">
          {chartName === 'projects' && (
            <>
              <button
                className={`chart-btn ${chartTypes.projects === 'pie' ? 'active' : ''}`}
                onClick={() => handleChartTypeChange('projects', 'pie')}
              >
                <PieChartIcon size={14} />
                Camembert
              </button>
              <button
                className={`chart-btn ${chartTypes.projects === 'radial' ? 'active' : ''}`}
                onClick={() => handleChartTypeChange('projects', 'radial')}
              >
                <Target size={14} />
                Radial
              </button>
              <button
                className={`chart-btn ${chartTypes.projects === 'bar' ? 'active' : ''}`}
                onClick={() => handleChartTypeChange('projects', 'bar')}
              >
                <BarChart2 size={14} />
                Barres
              </button>
            </>
          )}
          {chartName === 'tasks' && (
            <>
              <button
                className={`chart-btn ${chartTypes.tasks === 'bar' ? 'active' : ''}`}
                onClick={() => handleChartTypeChange('tasks', 'bar')}
              >
                <BarChart2 size={14} />
                Barres
              </button>
              <button
                className={`chart-btn ${chartTypes.tasks === 'area' ? 'active' : ''}`}
                onClick={() => handleChartTypeChange('tasks', 'area')}
              >
                <Activity size={14} />
                Aire
              </button>
              <button
                className={`chart-btn ${chartTypes.tasks === 'line' ? 'active' : ''}`}
                onClick={() => handleChartTypeChange('tasks', 'line')}
              >
                <TrendingUp size={14} />
                Ligne
              </button>
            </>
          )}
          {chartName === 'teams' && (
            <>
              <button
                className={`chart-btn ${chartTypes.teams === 'line' ? 'active' : ''}`}
                onClick={() => handleChartTypeChange('teams', 'line')}
              >
                <TrendingUp size={14} />
                Ligne
              </button>
              <button
                className={`chart-btn ${chartTypes.teams === 'bar' ? 'active' : ''}`}
                onClick={() => handleChartTypeChange('teams', 'bar')}
              >
                <BarChart2 size={14} />
                Barres
              </button>
              <button
                className={`chart-btn ${chartTypes.teams === 'pie' ? 'active' : ''}`}
                onClick={() => handleChartTypeChange('teams', 'pie')}
              >
                <PieChartIcon size={14} />
                Camembert
              </button>
            </>
          )}
        </div>
      </div>
      <div className="chart-content" style={{ display: 'flex', gap: '20px', alignItems: 'stretch' }}>
        <div style={{ flex: '1.2', minWidth: 0, display: 'flex', alignItems: 'center' }}>
          <ResponsiveContainer width="100%" height={300} minHeight={300}>
            {renderChartContent(
              chartTypes[chartName],
              data,
              dataKey,
              nameKey,
              colors,
              icon,
              noDataMessage || `Aucun(e) ${title.toLowerCase()} disponible`
            )}
          </ResponsiveContainer>
        </div>
        <div className="chart-footer" style={{ 
          flex: '0 0 200px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          padding: '20px',
          background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <div className="chart-stats" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stats.map((stat, index) => (
              <div key={index} className="stat-item" style={{
                padding: '18px 16px',
                background: stat.bgGradient || '#ffffff',
                borderRadius: '12px',
                border: stat.bgGradient ? 'none' : '1px solid #e5e7eb',
                textAlign: 'center',
                boxShadow: stat.bgGradient 
                  ? '0 4px 12px rgba(0,0,0,0.15)' 
                  : '0 2px 4px rgba(0,0,0,0.08)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'default',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.boxShadow = stat.bgGradient 
                  ? '0 8px 20px rgba(0,0,0,0.2)' 
                  : '0 6px 12px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = stat.bgGradient 
                  ? '0 4px 12px rgba(0,0,0,0.15)' 
                  : '0 2px 4px rgba(0,0,0,0.08)';
              }}
              >
                {stat.bgGradient && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
                    pointerEvents: 'none'
                  }} />
                )}
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: '800', 
                  color: stat.bgGradient ? (stat.color || '#111827') : '#111827', 
                  marginBottom: '8px', 
                  lineHeight: '1.2',
                  textShadow: 'none',
                  position: 'relative',
                  zIndex: 1
                }}>
                  {stat.value}
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  color: stat.bgGradient ? (stat.color || '#374151') : '#6b7280', 
                  fontWeight: '700', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.8px',
                  position: 'relative',
                  zIndex: 1,
                  marginBottom: stat.sublabel ? '4px' : '0'
                }}>
                  {stat.label}
                </div>
                {stat.sublabel && (
                  <div style={{ 
                    fontSize: '10px', 
                    color: stat.bgGradient ? (stat.color ? `${stat.color}AA` : '#6b7280') : '#9ca3af', 
                    fontWeight: '600',
                    marginTop: '4px',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    {stat.sublabel}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
  switch (type) {
    case 'projects':
      // Si un projet est sélectionné, afficher la répartition par statut des tâches
      if (projectData) {
        // Créer des statistiques améliorées avec plus de détails
        const statsWithDetails = [
          { 
            value: totalTasks, 
            label: 'TÂCHES',
            sublabel: 'Total',
            color: '#3b82f6',
            bgGradient: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)'
          },
          { 
            value: completedTasks, 
            label: 'TERMINÉES',
            sublabel: `${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%`,
            color: '#10b981',
            bgGradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
          },
          {
            value: tasksData.find(t => t.name === 'En cours')?.value || 0,
            label: 'EN COURS',
            sublabel: 'Actives',
            color: '#6366f1',
            bgGradient: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)'
          },
          {
            value: tasksData.find(t => t.name === 'En attente')?.value || 0,
            label: 'EN ATTENTE',
            sublabel: 'En pause',
            color: '#f59e0b',
            bgGradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
          },
          {
            value: tasksData.find(t => t.name === 'Hors délai')?.value || 0,
            label: 'HORS DÉLAI',
            sublabel: 'Retard',
            color: '#ef4444',
            bgGradient: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
          }
        ].filter(stat => stat.value > 0 || stat.label === 'TÂCHES' || stat.label === 'TERMINÉES');

        return renderChartCard(
          'projects',
          '',
          'Répartition par statut des tâches',
          <FolderOpen />,
          tasksData,
          'value',
          'name',
          ['#f59e0b', '#3b82f6', '#22c55e', '#dc2626'],
          statsWithDetails,
          totalTasks === 0 
            ? 'Aucune tâche n\'a été créée pour ce projet pour le moment' 
            : 'Aucune donnée de tâche disponible'
        );
      }
      // Sinon, afficher les données générales des projets
      return renderChartCard(
        'projects',
        'Évolution des Projets',
        'Répartition par statut',
        <FolderOpen />,
        projectsData,
        'value',
        'name',
        ['#f59e0b', '#22c55e', '#dc2626', '#ef4444', '#3b82f6'],
        [
          { value: totalProjects, label: 'Total' },
          { value: completedProjects, label: 'Terminés' },
        ]
      );
    case 'tasks':
      const taches = projectData?.taches || {};
      const tachesList = taches.liste || [];
      
      // Fonctions utilitaires pour le tableau
      const getTaskStatusColor = (statut) => {
        const normalizedStatus = statut?.toLowerCase();
        switch (normalizedStatus) {
          case 'termine': return 'bg-emerald-100 text-emerald-900 border-2 border-emerald-300';
          case 'en_cours': return 'bg-blue-100 text-blue-900 border-2 border-blue-300';
          case 'en_attente': return 'bg-amber-100 text-amber-900 border-2 border-amber-300';
          case 'hors_delai': return 'bg-red-100 text-red-900 border-2 border-red-300';
          case 'rejete': return 'bg-red-100 text-red-900 border-2 border-red-300';
          default: return 'bg-gray-100 text-gray-900 border-2 border-gray-300';
        }
      };

      const getTaskStatusText = (statut) => {
        const normalizedStatus = statut?.toLowerCase();
        switch (normalizedStatus) {
          case 'termine': return 'Terminé';
          case 'en_cours': return 'En cours';
          case 'en_attente': return 'En attente';
          case 'hors_delai': return 'Hors délai';
          case 'rejete': return 'Rejeté';
          default: return statut || 'Non défini';
        }
      };

      const getPriorityColor = (priorite) => {
        const normalizedPriority = priorite?.toLowerCase();
        switch (normalizedPriority) {
          case 'haute':
          case 'haut': return 'text-red-900 bg-red-100 border-2 border-red-300';
          case 'moyenne':
          case 'moyen': return 'text-amber-900 bg-amber-100 border-2 border-amber-300';
          case 'basse':
          case 'bas': return 'text-emerald-900 bg-emerald-100 border-2 border-emerald-300';
          default: return 'text-gray-900 bg-gray-100 border-2 border-gray-300';
        }
      };

      const formatDate = (dateString) => {
        if (!dateString) return 'Non définie';
        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return 'Date invalide';
          return date.toLocaleDateString('fr-FR');
        } catch (error) {
          return 'Date invalide';
        }
      };
      
      // Si un projet est sélectionné, afficher le tableau des tâches
      if (projectData) {
        return (
          <div className={`summary-chart-card ${isAnimating ? 'animating' : ''}`}>
            <div className="chart-header">
              <div className="chart-title">
                <div className={`chart-icon-wrapper tasks`}>
                  <CheckCircle size={20} />
                </div>
                <div className="chart-title-text">
                  <h3>Tâches du Projet</h3>
                  <span className="chart-subtitle">Liste des tâches ({tachesList.length})</span>
                </div>
              </div>
            </div>
            <div className="chart-content" style={{ padding: '0', display: 'flex', flexDirection: 'column', gap: '0' }}>
              <div style={{ padding: '0 24px 0 24px' }}>
              {tachesList.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  <CheckCircle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                    Aucune tâche n'a été créée pour ce projet
                  </p>
                  <p style={{ fontSize: '14px' }}>
                    Les tâches apparaîtront ici une fois créées
                  </p>
                </div>
              ) : (
                <div className="tasks-table-container" style={{ 
                  background: '#ffffff',
                  borderRadius: '0',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  overflow: 'hidden'
                }}>
                  <div className="overflow-x-auto" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="tasks-table w-full" style={{ 
                      borderCollapse: 'separate',
                      borderSpacing: 0
                    }}>
                      <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                        <tr style={{ 
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: 'white',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                        }}>
                          <th style={{ 
                            padding: '14px 16px', 
                            textAlign: 'left', 
                            fontWeight: '700', 
                            fontSize: '12px', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.8px',
                            whiteSpace: 'nowrap'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FileText size={16} style={{ opacity: 0.9 }} />
                              <span>Titre</span>
                            </div>
                          </th>
                          <th style={{ 
                            padding: '14px 16px', 
                            textAlign: 'left', 
                            fontWeight: '700', 
                            fontSize: '12px', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.8px',
                            whiteSpace: 'nowrap'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <AlertCircle size={16} style={{ opacity: 0.9 }} />
                              <span>Statut</span>
                            </div>
                          </th>
                          <th style={{ 
                            padding: '14px 16px', 
                            textAlign: 'left', 
                            fontWeight: '700', 
                            fontSize: '12px', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.8px',
                            whiteSpace: 'nowrap'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <User size={16} style={{ opacity: 0.9 }} />
                              <span>Responsable</span>
                            </div>
                          </th>
                          <th style={{ 
                            padding: '14px 16px', 
                            textAlign: 'center', 
                            fontWeight: '700', 
                            fontSize: '12px', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.8px',
                            whiteSpace: 'nowrap',
                            width: '80px'
                          }}>
                            <span>Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {tachesList.map((tache, index) => (
                          <tr 
                            key={tache.id}
                            style={{
                              borderBottom: index < tachesList.length - 1 ? '1px solid #f1f5f9' : 'none',
                              transition: 'all 0.2s ease',
                              background: index % 2 === 0 ? '#ffffff' : '#fafbfc'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f0f9ff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#fafbfc';
                            }}
                          >
                            <td style={{ 
                              padding: '14px 16px', 
                              fontWeight: '600', 
                              color: '#111827',
                              fontSize: '14px',
                              verticalAlign: 'middle'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '4px',
                                  height: '32px',
                                  background: tache.statut === 'termine' ? '#22c55e' :
                                            tache.statut === 'en_cours' ? '#3b82f6' :
                                            tache.statut === 'hors_delai' ? '#dc2626' : '#f59e0b',
                                  flexShrink: 0
                                }} />
                                <span style={{ lineHeight: '1.4' }}>
                                  {tache.titre || 'Sans titre'}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                              <span className={`inline-flex px-3 py-1.5 text-xs font-bold border-2 rounded shadow-sm ${getTaskStatusColor(tache.statut)}`}>
                                {getTaskStatusText(tache.statut)}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {tache.responsable?.photo_url ? (
                                  <img 
                                    src={tache.responsable.photo_url} 
                                    alt={tache.responsable.nom_complet}
                                    style={{ 
                                      width: '32px', 
                                      height: '32px', 
                                      borderRadius: '50%', 
                                      objectFit: 'cover', 
                                      border: '2px solid #e5e7eb'
                                    }}
                                  />
                                ) : tache.responsable ? (
                                  <div style={{ 
                                    width: '32px', 
                                    height: '32px', 
                                    borderRadius: '50%', 
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: '700',
                                    fontSize: '12px',
                                    border: '2px solid #e5e7eb'
                                  }}>
                                    {tache.responsable.prenom?.[0]?.toUpperCase() || tache.responsable.nom?.[0]?.toUpperCase() || '?'}
                                  </div>
                                ) : (
                                  <div style={{ 
                                    width: '32px', 
                                    height: '32px', 
                                    borderRadius: '50%', 
                                    background: '#e5e7eb', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    color: '#9ca3af',
                                    fontWeight: '600',
                                    fontSize: '12px'
                                  }}>
                                    ?
                                  </div>
                                )}
                                <span style={{ 
                                  color: '#374151', 
                                  fontSize: '14px', 
                                  fontWeight: '500',
                                  lineHeight: '1.4'
                                }}>
                                  {tache.responsable?.nom_complet || tache.responsable?.nom || 'Non assigné'}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                              <button
                                onClick={() => {
                                  setSelectedTask(tache);
                                  setIsTaskModalOpen(true);
                                }}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '0',
                                  background: '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s ease',
                                  fontWeight: '700',
                                  fontSize: '18px',
                                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#2563eb';
                                  e.currentTarget.style.transform = 'scale(1.1)';
                                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#3b82f6';
                                  e.currentTarget.style.transform = 'scale(1)';
                                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                                }}
                                title="Voir les détails"
                              >
                                +
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              </div>
              
              {/* Section Notifications Urgentes */}
              <div style={{ padding: '0 24px 24px 24px' }}>
              <div style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  color: 'white',
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontWeight: '700',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <AlertTriangle size={18} />
                  <span>Notifications Urgentes du Système</span>
                  {urgentNotifications.length > 0 && (
                    <span style={{
                      marginLeft: 'auto',
                      background: 'rgba(255, 255, 255, 0.2)',
                      padding: '4px 10px',
                      borderRadius: '0',
                      fontSize: '12px',
                      fontWeight: '700'
                    }}>
                      {urgentNotifications.length}
                    </span>
                  )}
                </div>
                
                <div style={{ padding: '16px 20px', maxHeight: '300px', overflowY: 'auto' }}>
                  {notificationsLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                      <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                      <p style={{ marginTop: '10px', fontSize: '14px' }}>Chargement des notifications...</p>
                    </div>
                  ) : urgentNotifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
                      <Bell size={24} style={{ opacity: 0.5, marginBottom: '10px' }} />
                      <p style={{ fontSize: '14px' }}>Aucune notification urgente</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {urgentNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          style={{
                            padding: '14px',
                            background: notif.statut === 'lue' ? '#f9fafb' : '#fef2f2',
                            border: `2px solid ${notif.statut === 'lue' ? '#e5e7eb' : '#fecaca'}`,
                            borderRadius: '0',
                            borderLeft: `4px solid ${notif.statut === 'lue' ? '#9ca3af' : '#dc2626'}`,
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = notif.statut === 'lue' ? '#f3f4f6' : '#fee2e2';
                            e.currentTarget.style.transform = 'translateX(4px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = notif.statut === 'lue' ? '#f9fafb' : '#fef2f2';
                            e.currentTarget.style.transform = 'translateX(0)';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <div style={{
                              width: '8px',
                              height: '8px',
                              background: notif.statut === 'lue' ? '#9ca3af' : '#dc2626',
                              borderRadius: '50%',
                              marginTop: '6px',
                              flexShrink: 0
                            }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <h4 style={{
                                  fontSize: '14px',
                                  fontWeight: '700',
                                  color: '#111827',
                                  margin: 0
                                }}>
                                  {notif.titre || 'Notification'}
                                </h4>
                                {notif.statut === 'non_lue' && (
                                  <span style={{
                                    background: '#dc2626',
                                    color: 'white',
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    padding: '2px 6px',
                                    borderRadius: '0',
                                    textTransform: 'uppercase'
                                  }}>
                                    Nouveau
                                  </span>
                                )}
                              </div>
                              <p style={{
                                fontSize: '13px',
                                color: '#6b7280',
                                margin: 0,
                                lineHeight: '1.5'
                              }}>
                                {notif.message || notif.contenu || 'Aucun message'}
                              </p>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginTop: '8px',
                                fontSize: '11px',
                                color: '#9ca3af'
                              }}>
                                {notif.cree_le && (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={12} />
                                    {new Date(notif.cree_le).toLocaleString('fr-FR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                )}
                                {notif.type_notification && (
                                  <span style={{
                                    background: '#e5e7eb',
                                    padding: '2px 8px',
                                    borderRadius: '0',
                                    fontSize: '10px',
                                    fontWeight: '600',
                                    textTransform: 'uppercase'
                                  }}>
                                    {typeof notif.type_notification === 'object' 
                                      ? (notif.type_notification.nom || notif.type_notification.code || 'Notification')
                                      : notif.type_notification}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              </div>
            </div>
          </div>
        );
      }
      
      // Sinon, afficher juste la carte normale
      return renderChartCard(
        'tasks',
        projectData ? 'Tâches du Projet' : 'Performance des Tâches',
        projectData ? 'Répartition par statut' : 'Suivi de productivité',
        <CheckCircle />,
        tasksData,
        'value',
        'name',
        ['#8b5cf6', '#f59e0b', '#22c55e', '#dc2626', '#ef4444'],
        [
          { value: totalTasks, label: 'Total' },
          { value: completedTasks, label: 'Terminées' },
        ],
        projectData && totalTasks === 0 
          ? 'Aucune tâche n\'a été créée pour ce projet pour le moment' 
          : 'Aucune donnée de tâche disponible'
      );
    case 'teams':
      const equipe = projectData?.equipe || {};
      const membresList = equipe.membres || [];
      const membresParService = equipe.par_service || [];
      
      if (projectData && membresList.length === 0 && equipe.total_membres > 0) {
      }
      
      // Si un projet est sélectionné, afficher la liste des membres sans le diagramme
      if (projectData) {
        return (
          <div style={{ width: '100%' }}>
            {/* Liste des membres du projet - TOUJOURS AFFICHÉE */}
            <div className="team-members-list" style={{ 
              paddingTop: '0px', 
              borderTop: 'none', 
              background: '#ffffff', 
              borderRadius: '8px', 
              padding: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                Membres de l'équipe ({membresList.length || equipe.total_membres || 0})
              </h4>
              {membresList.length > 0 ? (
                <div className="members-grid" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                  gap: '12px',
                  minHeight: '100px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  padding: '4px',
                  paddingRight: '12px',
                  width: '100%'
                }}>
                {membresList.map((membre) => {
                  return (
                  <div 
                    key={membre.id} 
                    className="member-card" 
                    onClick={() => {
                      setSelectedMember(membre);
                      setIsMemberModalOpen(true);
                    }}
                    style={{ 
                      padding: '10px', 
                      background: '#f9fafb', 
                      borderRadius: '8px', 
                      border: '1px solid #e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f9fafb';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {membre.photo_url ? (
                      <img 
                        src={membre.photo_url} 
                        alt={membre.nom_complet}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        background: '#e0e7ff', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: '#4f46e5',
                        fontWeight: '600',
                        fontSize: '12px',
                        border: '1px solid #c7d2fe'
                      }}>
                        {membre.prenom?.[0]?.toUpperCase() || membre.nom?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {membre.nom_complet}
                      </div>
                      {membre.role_projet && (
                        <div style={{ fontSize: '11px', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {membre.role_projet}
                        </div>
                      )}
                      {membre.service && (
                        <div style={{ fontSize: '11px', color: '#6366f1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                          {typeof membre.service === 'string' 
                            ? membre.service 
                            : (membre.service?.nom || membre.service?.code || 'Service')}
                        </div>
                      )}
                      {membre.taches && membre.taches.total > 0 && (
                        <div style={{ fontSize: '10px', color: '#10b981', marginTop: '4px', fontWeight: '500' }}>
                          {membre.taches.total} tâche{membre.taches.total > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  <Users size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <p>Aucun membre trouvé dans l'équipe</p>
                  {equipe.total_membres > 0 && (
                    <p style={{ fontSize: '12px', marginTop: '4px' }}>
                      Total membres: {equipe.total_membres} (données en cours de chargement...)
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {/* Statistiques : Nombre de services et membres */}
                            <div style={{ 
              marginTop: '20px', 
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px'
            }}>
                          <div style={{ 
                padding: '20px',
                background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                borderRadius: '8px',
                textAlign: 'center',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
                color: '#1e40af',
                border: '1px solid #c7d2fe',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.08)';
              }}
              >
                <div style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px', lineHeight: '1.2' }}>
                  {teamsData.length || membresParService.length || 0}
                              </div>
                <div style={{ fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>
                  Services
                </div>
              </div>
                                      <div style={{ 
                padding: '20px',
                background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                borderRadius: '8px',
                textAlign: 'center',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
                color: '#6b21a8',
                border: '1px solid #e9d5ff',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.08)';
              }}
              >
                <div style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px', lineHeight: '1.2' }}>
                  {totalMembers || membresList.length || equipe.total_membres || 0}
                                      </div>
                <div style={{ fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>
                  Membres
                                  </div>
                              </div>
                            </div>
          </div>
        );
      }
      
      // Sinon, afficher juste la carte normale
      return renderChartCard(
        'teams',
        projectData ? 'Équipe du Projet' : 'Répartition par Service',
        projectData ? 'Membres par service' : 'Distribution des équipes',
        <Users />,
        teamsData,
        'value',
        'name',
        ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
        [
          { value: teamsData.length, label: 'Services' },
          { value: totalMembers, label: 'Membres' },
        ]
      );
    default:
      return null;
  }
  };

  return (
    <>
      {renderContent()}
      {isMemberModalOpen && selectedMember && (
        <MemberDetailsModal
          isOpen={isMemberModalOpen}
          onClose={() => {
            setIsMemberModalOpen(false);
            setSelectedMember(null);
          }}
          member={selectedMember}
          projectId={projectId}
        />
      )}
      {selectedTask && (
        <TaskDetailsModal
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
        />
      )}
    </>
  );
};

export default SummaryCharts;