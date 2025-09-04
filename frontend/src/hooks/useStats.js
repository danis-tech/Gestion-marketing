import { useState, useEffect } from 'react';
import { projectService, taskService, userService } from '../services/apiService';

/**
 * Hook personnalisé pour gérer les statistiques dynamiques
 * @returns {Object} Objet contenant les statistiques et les fonctions de gestion
 */
export const useStats = () => {
  const [stats, setStats] = useState({
    projects: null,
    tasks: null,
    users: null
  });
  
  const [loading, setLoading] = useState({
    projects: false,
    tasks: false,
    users: false
  });
  
  const [error, setError] = useState({
    projects: null,
    tasks: null,
    users: null
  });

  // Fonction pour récupérer les statistiques des projets
  const fetchProjectsStats = async () => {
    setLoading(prev => ({ ...prev, projects: true }));
    setError(prev => ({ ...prev, projects: null }));
    
    try {
      const data = await projectService.getProjectsStats();
      setStats(prev => ({ ...prev, projects: data }));
    } catch (err) {
      setError(prev => ({ ...prev, projects: err.message }));
      console.error('Erreur lors de la récupération des statistiques des projets:', err);
    } finally {
      setLoading(prev => ({ ...prev, projects: false }));
    }
  };

  // Fonction pour récupérer les statistiques des tâches
  const fetchTasksStats = async () => {
    setLoading(prev => ({ ...prev, tasks: true }));
    setError(prev => ({ ...prev, tasks: null }));
    
    try {
      const data = await taskService.getTasksStats();
      setStats(prev => ({ ...prev, tasks: data }));
    } catch (err) {
      setError(prev => ({ ...prev, tasks: err.message }));
      console.error('Erreur lors de la récupération des statistiques des tâches:', err);
    } finally {
      setLoading(prev => ({ ...prev, tasks: false }));
    }
  };

  // Fonction pour récupérer les statistiques des utilisateurs
  const fetchUsersStats = async () => {
    setLoading(prev => ({ ...prev, users: true }));
    setError(prev => ({ ...prev, users: null }));
    
    try {
      const data = await userService.getUsersStats();
      setStats(prev => ({ ...prev, users: data }));
    } catch (err) {
      setError(prev => ({ ...prev, users: err.message }));
      console.error('Erreur lors de la récupération des statistiques des utilisateurs:', err);
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  // Fonction pour récupérer toutes les statistiques
  const fetchAllStats = async () => {
    await Promise.all([
      fetchProjectsStats(),
      fetchTasksStats(),
      fetchUsersStats()
    ]);
  };

  // Fonction pour rafraîchir les statistiques
  const refreshStats = async (type = 'all') => {
    switch (type) {
      case 'projects':
        await fetchProjectsStats();
        break;
      case 'tasks':
        await fetchTasksStats();
        break;
      case 'users':
        await fetchUsersStats();
        break;
      case 'all':
      default:
        await fetchAllStats();
        break;
    }
  };

  // Fonction pour calculer les couleurs dynamiques basées sur les données
  const getDynamicColors = (type, data) => {
    const today = new Date();
    const isToday = (date) => {
      const compareDate = new Date(date);
      return compareDate.toDateString() === today.toDateString();
    };

    switch (type) {
      case 'projects':
        if (!data) return { color: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)', bgColor: 'rgba(107, 114, 128, 0.1)' };
        
        const totalProjects = data.total_projets || 0;
        const completedProjects = data.projets_par_statut?.termine || 0;
        const projectCompletionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
        
        if (projectCompletionRate >= 80) {
          return {
            color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            bgColor: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.12) 100%)'
          };
        } else if (projectCompletionRate >= 50) {
          return {
            color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            bgColor: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.12) 100%)'
          };
        } else {
          return {
            color: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            bgColor: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.12) 100%)'
          };
        }

      case 'tasks':
        if (!data) return { color: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)', bgColor: 'rgba(107, 114, 128, 0.1)' };
        
        const totalTasks = data.total_taches || 0;
        const completedTasks = data.taches_terminees || 0;
        const overdueTasks = data.taches_en_retard || 0;
        const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        
        if (overdueTasks > 0) {
          return {
            color: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            bgColor: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.12) 100%)'
          };
        } else if (taskCompletionRate >= 80) {
          return {
            color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            bgColor: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.12) 100%)'
          };
        } else {
          return {
            color: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            bgColor: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.12) 100%)'
          };
        }

      case 'users':
        if (!data) return { color: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', bgColor: 'rgba(139, 92, 246, 0.1)' };
        
        const totalUsers = data.total_users || 0;
        const activeUsers = data.active_users || 0;
        const activityRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
        
        if (activityRate >= 80) {
          return {
            color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            bgColor: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.12) 100%)'
          };
        } else if (activityRate >= 50) {
          return {
            color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            bgColor: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.12) 100%)'
          };
        } else {
          return {
            color: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            bgColor: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(124, 58, 237, 0.12) 100%)'
          };
        }

      default:
        return {
          color: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
          bgColor: 'rgba(107, 114, 128, 0.1)'
        };
    }
  };

  // Fonction pour calculer le changement (trend)
  const getChangeData = (type, data) => {
    if (!data) return { change: '0', changeType: 'neutral' };

    switch (type) {
      case 'projects':
        const totalProjects = data.total_projets || 0;
        const completedProjects = data.projets_par_statut?.termine || 0;
        const pendingProjects = data.projets_par_statut?.en_attente || 0;
        
        if (completedProjects > pendingProjects) {
          return { change: `+${completedProjects}`, changeType: 'positive' };
        } else if (pendingProjects > completedProjects) {
          return { change: `-${pendingProjects}`, changeType: 'negative' };
        } else {
          return { change: '0', changeType: 'neutral' };
        }

      case 'tasks':
        const totalTasks = data.total_taches || 0;
        const completedTasks = data.taches_terminees || 0;
        const overdueTasks = data.taches_en_retard || 0;
        
        if (overdueTasks > 0) {
          return { change: `${overdueTasks} en retard`, changeType: 'warning' };
        } else if (completedTasks > totalTasks / 2) {
          return { change: `+${completedTasks}`, changeType: 'positive' };
        } else {
          return { change: `${totalTasks - completedTasks} restantes`, changeType: 'neutral' };
        }

      case 'users':
        const totalUsers = data.total_users || 0;
        const activeUsers = data.active_users || 0;
        
        if (activeUsers > totalUsers * 0.8) {
          return { change: `${activeUsers} actifs`, changeType: 'positive' };
        } else if (activeUsers > totalUsers * 0.5) {
          return { change: `${activeUsers} actifs`, changeType: 'neutral' };
        } else {
          return { change: `${activeUsers} actifs`, changeType: 'warning' };
        }

      default:
        return { change: '0', changeType: 'neutral' };
    }
  };

  // Fonction pour générer des données de graphique basées sur les statistiques
  const getGraphData = (type, data) => {
    if (!data) return [10, 20, 15, 25, 30, 35, 40, 45, 50];

    switch (type) {
      case 'projects':
        const totalProjects = data.total_projets || 0;
        const completedProjects = data.projets_par_statut?.termine || 0;
        const inProgressProjects = data.projets_par_statut?.en_cours || 0;
        const pendingProjects = data.projets_par_statut?.en_attente || 0;
        
        return [
          totalProjects * 0.2,
          totalProjects * 0.3,
          totalProjects * 0.4,
          totalProjects * 0.5,
          totalProjects * 0.6,
          totalProjects * 0.7,
          totalProjects * 0.8,
          totalProjects * 0.9,
          totalProjects
        ];

      case 'tasks':
        const totalTasks = data.total_taches || 0;
        const completedTasks = data.taches_terminees || 0;
        const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) : 0;
        
        return [
          totalTasks * 0.1,
          totalTasks * 0.2,
          totalTasks * 0.3,
          totalTasks * 0.4,
          totalTasks * 0.5,
          totalTasks * 0.6,
          totalTasks * 0.7,
          totalTasks * 0.8,
          totalTasks * taskCompletionRate
        ];

      case 'users':
        const totalUsers = data.total_users || 0;
        const activeUsers = data.active_users || 0;
        const activityRate = totalUsers > 0 ? (activeUsers / totalUsers) : 0;
        
        return [
          totalUsers * 0.1,
          totalUsers * 0.2,
          totalUsers * 0.3,
          totalUsers * 0.4,
          totalUsers * 0.5,
          totalUsers * 0.6,
          totalUsers * 0.7,
          totalUsers * 0.8,
          totalUsers * activityRate
        ];

      default:
        return [10, 20, 15, 25, 30, 35, 40, 45, 50];
    }
  };

  // Charger les statistiques au montage du composant
  useEffect(() => {
    fetchAllStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refreshStats,
    getDynamicColors,
    getChangeData,
    getGraphData
  };
};
