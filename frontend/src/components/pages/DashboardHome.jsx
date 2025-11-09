import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  ClipboardList, 
  CheckCircle, 
  Users, 
  Clock, 
  ChevronDown,
  Target,
  FolderOpen,
  Users2
} from 'lucide-react';
import StatsCard from '../ui/StatsCard';
import OnlineUsersCard from '../ui/OnlineUsersCard';
import StatsModal from '../ui/StatsModal';
import SummaryCharts from '../dashboard/SummaryCharts';
import ProjectProgress from '../dashboard/ProjectProgress';
import { useStats } from '../../hooks/useStats';
import { projectService } from '../../services/apiService';
import './DashboardHome.css';

const DashboardHome = ({ user }) => {
  const [selectedStat, setSelectedStat] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  
  // Utiliser le hook personnalisé pour les statistiques
  const { 
    stats, 
    loading, 
    error, 
    refreshStats, 
    getDynamicColors, 
    getChangeData, 
    getGraphData 
  } = useStats();

  // Charger les projets et sélectionner le plus récent par défaut
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoadingProjects(true);
        console.log('[DashboardHome] Chargement des projets...');
        const response = await projectService.getProjects({ ordering: '-cree_le' });
        
        let projectsData = [];
        if (response && Array.isArray(response)) {
          projectsData = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          projectsData = response.data;
        } else if (response && response.results && Array.isArray(response.results)) {
          projectsData = response.results;
        }
        
        console.log('[DashboardHome] Projets chargés:', projectsData.length, projectsData);
        setProjects(projectsData);
        
        // Sélectionner le projet le plus récent par défaut
        if (projectsData.length > 0) {
          const mostRecentProject = projectsData[0];
          console.log('[DashboardHome] Sélection du projet le plus récent:', mostRecentProject.id, mostRecentProject.nom);
          setSelectedProjectId(mostRecentProject.id);
        } else {
          console.log('[DashboardHome] Aucun projet trouvé');
          setSelectedProjectId(null);
        }
      } catch (err) {
        console.error('[DashboardHome] Erreur lors du chargement des projets:', err);
        setSelectedProjectId(null);
      } finally {
        setLoadingProjects(false);
      }
    };
    
    loadProjects();
  }, []);

  const handleCardClick = (stat) => {
    setSelectedStat(stat);
    setIsModalOpen(true);
  };

  // Configuration des cartes avec données dynamiques
  const getStatsCards = () => {
    const projectsColors = getDynamicColors('projects', stats.projects);
    const tasksColors = getDynamicColors('tasks', stats.tasks);
    
    const projectsChange = getChangeData('projects', stats.projects);
    const tasksChange = getChangeData('tasks', stats.tasks);

    return [
      {
        id: 1,
        title: 'Projets Actifs',
        value: stats.projects?.total_projets || '0',
        change: projectsChange.change,
        changeType: projectsChange.changeType,
        icon: BarChart3,
        color: projectsColors.color,
        bgColor: projectsColors.bgColor,
        graphData: getGraphData('projects', stats.projects),
        subtitle: 'Projets en cours',
        period: 'Ce mois',
        type: 'projects',
        loading: loading.projects
      },
      {
        id: 2,
        title: 'Tâches en Cours',
        value: stats.tasks?.total_taches || '0',
        change: tasksChange.change,
        changeType: tasksChange.changeType,
        icon: ClipboardList,
        color: tasksColors.color,
        bgColor: tasksColors.bgColor,
        graphData: getGraphData('tasks', stats.tasks),
        subtitle: 'Tâches en cours',
        period: 'En cours',
        type: 'tasks',
        loading: loading.tasks
      },
      {
        id: 3,
        title: 'Tâches Terminées',
        value: stats.tasks?.taches_terminees || '0',
        change: `+${stats.tasks?.taches_terminees || 0}`,
        changeType: 'positive',
        icon: CheckCircle,
        color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        bgColor: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.12) 100%)',
        graphData: getGraphData('tasks', stats.tasks),
        subtitle: 'Tâches complétées',
        period: 'Ce mois',
        type: 'tasks_completed',
        loading: loading.tasks
      },
      {
        id: 4,
        title: 'En Attente',
        value: stats.tasks?.taches_en_retard || '0',
        change: stats.tasks?.taches_en_retard > 0 ? `${stats.tasks.taches_en_retard} en retard` : 'Aucun',
        changeType: stats.tasks?.taches_en_retard > 0 ? 'warning' : 'positive',
        icon: Clock,
        color: stats.tasks?.taches_en_retard > 0 
          ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        bgColor: stats.tasks?.taches_en_retard > 0
          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.12) 100%)'
          : 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.12) 100%)',
        graphData: [2, 3, 1, 4, 2, 5, 3, 6, 4],
        subtitle: 'En attente de validation',
        period: 'Validation',
        showGraph: false,
        type: 'overdue_tasks',
        loading: loading.tasks
      }
    ];
  };

  const statsCards = getStatsCards();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

      {/* --- Stats Cards avec plus d'espacement --- */}
      <div className="flex">
        {/* Bloc transparent pour espacer de la sidebar */}
        <div className="w-3 h-full bg-transparent flex-shrink-0"></div>
        
        {/* Conteneur des cartes sur toute la largeur */}
        <div className="flex-1 px-6 pt-20 pb-16">
          {/* Messages d'erreur */}
          {(error.projects || error.tasks || error.users) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                Erreur lors du chargement des statistiques. 
                {error.projects && <span className="block">Projets: {error.projects}</span>}
                {error.tasks && <span className="block">Tâches: {error.tasks}</span>}
                {error.users && <span className="block">Utilisateurs: {error.users}</span>}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 w-full">
            {/* Cartes de statistiques normales */}
            {statsCards.map((stat, index) => (
              <StatsCard
                key={stat.id}
                title={stat.title}
                value={stat.loading ? '...' : stat.value}
                change={stat.loading ? '...' : stat.change}
                changeType={stat.changeType}
                icon={stat.icon}
                color={stat.color}
                bgColor={stat.bgColor}
                graphData={stat.graphData}
                showGraph={stat.showGraph !== false}
                subtitle={stat.subtitle}
                period={stat.period}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => handleCardClick(stat)}
              />
            ))}
            
            {/* Carte spécialisée pour les utilisateurs en ligne */}
            <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <OnlineUsersCard
                statsData={stats.users}
                loading={loading.users}
                onClick={() => handleCardClick({
                  title: 'Utilisateurs Actifs',
                  type: 'users'
                })}
              />
            </div>
          </div>
        </div>
       <div className="w-3 h-full bg-transparent flex-shrink-0"></div>
      </div>

      {/* Sélecteur de projet amélioré */}
      <div className="flex">
        <div className="w-3 h-full bg-transparent flex-shrink-0"></div>
        <div className="flex-1 px-6 pb-6">
          <div className="project-filter-card">
            <div className="project-filter-header">
              <div className="project-filter-icon-wrapper">
                <FolderOpen size={22} className="project-filter-icon" />
              </div>
              <div className="project-filter-content">
                <label htmlFor="project-select" className="project-filter-label">
                  Filtrer par projet
                </label>
                <div className="project-select-wrapper">
                  <select
                    id="project-select"
                    value={selectedProjectId || ''}
                    onChange={(e) => setSelectedProjectId(e.target.value ? parseInt(e.target.value) : null)}
                    disabled={loadingProjects}
                    className="project-select-input"
                  >
                    {loadingProjects ? (
                      <option>Chargement des projets...</option>
                    ) : (
                      <>
                        <option value="">📊 Tous les projets</option>
                        {projects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.code} - {project.nom}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <div className="project-select-arrow">
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>
              {selectedProjectId && (
                <div className="project-filter-badge">
                  <div className="project-filter-badge-content">
                    <div className="project-filter-badge-dot"></div>
                    <span className="project-filter-badge-text">
                      {projects.find(p => p.id === selectedProjectId)?.nom}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="w-3 h-full bg-transparent flex-shrink-0"></div>
      </div>

      {/* Nouvelles sections - Grille 2x2 professionnelle */}
      <div className="dashboard-sections">
        {/* Section 1: Projets */}
        <div className="chart-card projects-card">
          <div className="chart-header">
            <div className="chart-icon">
              <BarChart3 size={24} />
            </div>
            <div className="chart-title">
              <h3>Projets</h3>
              <span className="chart-subtitle">Gestion et suivi des projets</span>
            </div>
          </div>
          <SummaryCharts type="projects" projectId={selectedProjectId} />
        </div>

        {/* Section 2: Tâches */}
        <div className="chart-card tasks-card">
          <div className="chart-header">
            <div className="chart-icon">
              <ClipboardList size={24} />
            </div>
            <div className="chart-title">
              <h3>Tâches</h3>
              <span className="chart-subtitle">Performance et productivité</span>
            </div>
          </div>
          <SummaryCharts type="tasks" projectId={selectedProjectId} />
        </div>

        {/* Section 3: Équipes */}
        <div className="chart-card teams-card">
          <div className="chart-header">
            <div className="chart-icon">
              <Users size={24} />
            </div>
            <div className="chart-title">
              <h3>Équipes</h3>
              <span className="chart-subtitle">Répartition par services</span>
            </div>
          </div>
          <SummaryCharts type="teams" projectId={selectedProjectId} />
        </div>

        {/* Section 4: Progression */}
        <div className="chart-card progress-card">
          <div className="chart-header">
            <div className="chart-icon">
              <Target size={24} />
            </div>
            <div className="chart-title">
              <h3>Progression</h3>
              <span className="chart-subtitle">Suivi par phase</span>
            </div>
          </div>
          <ProjectProgress projectId={selectedProjectId} />
        </div>
      </div>

      {/* Modal pour les détails des statistiques */}
      <StatsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        statsData={selectedStat?.type === 'projects' ? stats.projects : 
                   selectedStat?.type === 'tasks' || selectedStat?.type === 'tasks_completed' || selectedStat?.type === 'overdue_tasks' ? stats.tasks : 
                   selectedStat?.type === 'users' ? stats.users : null}
        title={selectedStat?.title || 'Détails des statistiques'}
        type={selectedStat?.type?.includes('projects') ? 'projects' : 
              selectedStat?.type?.includes('tasks') ? 'tasks' : 
              selectedStat?.type?.includes('users') ? 'users' : 'projects'}
      />
    </div>
  );
};

export default DashboardHome;