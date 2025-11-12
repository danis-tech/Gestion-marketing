import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  Target, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  BarChart3,
  Zap,
  Eye,
  Download,
  Share2,
  Star,
  Award,
  Timer,
  Users2
} from 'lucide-react';
import { projectsService, phasesService } from '../../services/apiService';
import './ProjectProgress.css';

const ProjectProgress = ({ projectId = null }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectPhases, setProjectPhases] = useState([]);
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('detailed'); // detailed, compact, timeline
  const [isAnimating, setIsAnimating] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState(new Set());
  const [showInsights, setShowInsights] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProjectData(projectId);
    } else {
      loadProjects();
    }
  }, [projectId]);

  const loadProjectData = async (id) => {
    try {
      setLoading(true);
      setIsAnimating(true);
      
      // Charger les informations du projet d'abord
      const project = await projectsService.getProject(id);
      setSelectedProject(project);
      
      // Charger les données détaillées du projet
      try {
        const { analyticsService } = await import('../../services/apiService');
        const data = await analyticsService.getProjectDetails(id);
        
        if (data && data.project) {
          setProjectData(data);
          // Utiliser les phases depuis projectData
          if (data.phases && data.phases.length > 0) {
            setProjectPhases(data.phases);
          } else {
            await loadProjectPhases(id);
          }
        } else {
          // Si pas de données détaillées, charger les phases normalement
          await loadProjectPhases(id);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des données détaillées:', err);
        // Charger les phases normalement en cas d'erreur
        await loadProjectPhases(id);
      }
      
      setError(null);
      
      setTimeout(() => {
        setIsAnimating(false);
      }, 600);
    } catch (err) {
      console.error('Erreur lors du chargement du projet:', err);
      setError('Impossible de charger le projet');
      setIsAnimating(false);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      setIsAnimating(true);
      const response = await projectsService.getProjects();
      
      // Gérer différents formats de réponse
      let projectsData = [];
      if (response && Array.isArray(response)) {
        projectsData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        projectsData = response.data;
      } else if (response && response.results && Array.isArray(response.results)) {
        projectsData = response.results;
      }
      
      setProjects(projectsData);
      setError(null);
      
      setTimeout(() => {
        setIsAnimating(false);
      }, 600);
    } catch (err) {
      console.error('Erreur lors du chargement des projets:', err);
      setError('Impossible de charger les projets');
      setIsAnimating(false);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectPhases = async (projectId) => {
    try {
      setLoading(true);
      const response = await phasesService.getProjectPhases(projectId);
      
      // Gérer différents formats de réponse
      let phasesData = [];
      if (response && Array.isArray(response)) {
        phasesData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        phasesData = response.data;
      } else if (response && response.results && Array.isArray(response.results)) {
        phasesData = response.results;
      }
      
      setProjectPhases(phasesData);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des phases:', err);
      setError('Impossible de charger les phases du projet');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    loadProjectPhases(project.id);
    setExpandedPhases(new Set());
  };

  const togglePhaseExpansion = (phaseId) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  const refreshProjectData = () => {
    if (selectedProject) {
      loadProjectData(selectedProject.id);
    }
  };

  // Rafraîchir automatiquement les données toutes les 30 secondes
  useEffect(() => {
    if (selectedProject) {
      const interval = setInterval(() => {
        refreshProjectData();
      }, 30000); // 30 secondes
      
      return () => clearInterval(interval);
    }
  }, [selectedProject]);

  const getPhaseStatusIcon = (phase) => {
    if (phase.terminee) return <CheckCircle2 size={16} className="text-green-600" />;
    if (phase.ignoree) return <AlertCircle size={16} className="text-red-600" />;
    if (phase.est_en_cours) return <Play size={16} className="text-blue-600" />;
    return <Clock size={16} className="text-gray-500" />;
  };

  const getPhaseStatusColor = (phase) => {
    if (phase.terminee) return 'bg-green-100 text-green-800 border-green-200';
    if (phase.ignoree) return 'bg-red-100 text-red-800 border-red-200';
    if (phase.est_en_cours) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPhaseStatusText = (phase) => {
    if (phase.terminee) return 'Terminée';
    if (phase.ignoree) return 'Ignorée';
    if (phase.est_en_cours) return 'En cours';
    return 'En attente';
  };

  const calculateProgress = () => {
    // Utiliser la progression du backend si disponible (basée sur les tâches)
    if (projectData?.progression?.globale !== undefined && projectData.progression.globale !== null) {
      return Math.round(projectData.progression.globale);
    }
    // Sinon, calculer basé sur les phases
    if (!projectPhases.length) {
      return 0;
    }
    const completedPhases = projectPhases.filter(phase => phase.terminee).length;
    const progress = Math.round((completedPhases / projectPhases.length) * 100);
    return progress;
  };

  const getProjectStatusColor = (project) => {
    switch (project.statut) {
      case 'termine': return 'text-green-600 bg-green-100';
      case 'en_attente': return 'text-yellow-600 bg-yellow-100';
      case 'en_cours': return 'text-blue-600 bg-blue-100';
      case 'hors_delai': return 'text-red-600 bg-red-100';
      case 'rejete': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProjectStatusText = (project) => {
    switch (project.statut) {
      case 'termine': return 'Terminé';
      case 'en_attente': return 'En attente';
      case 'en_cours': return 'En cours';
      case 'hors_delai': return 'Hors délai';
      case 'rejete': return 'Rejeté';
      default: return 'Inconnu';
    }
  };

  return (
    <div className="project-progress-container">
      {/* Sélecteur de projet simplifié - masqué si projectId est fourni */}
      {!projectId && (
        <div className="project-selector-section">
          <div style={{ marginBottom: '8px', fontSize: '12px', color: '#6b7280' }}>
            {loading ? 'Chargement...' : `${projects.length} projet(s) disponible(s)`}
          </div>
          <select 
            value={selectedProject?.id || ''} 
            onChange={(e) => {
              const project = projects.find(p => p.id === parseInt(e.target.value));
              if (project) handleProjectSelect(project);
            }}
            className="project-select"
            disabled={loading}
          >
            <option value="">Choisir un projet...</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.nom} - {getProjectStatusText(project)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Contenu principal du projet */}
      {(selectedProject || projectData) && (
        <div className="project-details">
          {/* Informations du projet */}
          <div className="project-info-card">
            <div className="project-main-info">
              <div className="project-header">
                <h4 className="project-name">
                  {projectData?.project?.nom || selectedProject?.nom || 'Projet'}
                </h4>
                <div className="project-progression-global">
                  <div className="progression-label">Progression Globale</div>
                  <div className="progression-value">{calculateProgress()}%</div>
                </div>
                <span className={`project-status ${getProjectStatusColor(selectedProject)}`}>
                  {getProjectStatusText(selectedProject)}
                </span>
              </div>
              <div className="project-meta">
                <div className="meta-item">
                  <Calendar size={14} />
                  <span>Début: {
                    projectData?.project?.debut 
                      ? new Date(projectData.project.debut).toLocaleDateString('fr-FR')
                      : selectedProject?.debut 
                        ? new Date(selectedProject.debut).toLocaleDateString('fr-FR')
                        : 'Non définie'
                  }</span>
                </div>
                <div className="meta-item">
                  <Calendar size={14} />
                  <span>Fin: {
                    projectData?.project?.fin 
                      ? new Date(projectData.project.fin).toLocaleDateString('fr-FR')
                      : selectedProject?.fin 
                        ? new Date(selectedProject.fin).toLocaleDateString('fr-FR')
                        : 'Non définie'
                  }</span>
                </div>
                <div className="meta-item">
                  <User size={14} />
                  <span>Responsable: {
                    projectData?.project?.proprietaire?.nom 
                      || projectData?.project?.proprietaire?.username
                      || selectedProject?.chef_projet 
                      || selectedProject?.proprietaire?.nom
                      || 'Non assigné'
                  }</span>
                </div>
                {projectData?.project?.code && (
                  <div className="meta-item">
                    <Target size={14} />
                    <span>Code: {projectData.project.code}</span>
                  </div>
                )}
                {projectData?.project?.priorite_display && (
                  <div className="meta-item">
                    <Zap size={14} />
                    <span>Priorité: {projectData.project.priorite_display}</span>
                  </div>
                )}
                {projectData?.taches && projectData.taches.total > 0 && (
                  <div className="meta-item">
                    <BarChart3 size={14} />
                    <span>{projectData.taches.total} tâche(s) • {projectData.taches.terminees || 0} terminée(s)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Barre de progression avancée */}
          <div className="progress-overview-card">
            <div className="progress-header-section">
              <h5>Progression Globale</h5>
              <div className="progress-percentage">{calculateProgress()}%</div>
            </div>
            
            
            <div className="progress-bar-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
                <div className="progress-milestones">
                  {projectPhases.map((phase, index) => (
                    <div 
                      key={phase.id}
                      className={`milestone ${phase.terminee ? 'completed' : phase.est_en_cours ? 'active' : ''}`}
                      style={{ left: `${(index + 1) * (100 / projectPhases.length)}%` }}
                    >
                      <div className="milestone-dot"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="progress-stats">
              <div className="stat-item">
                <div className="stat-icon">
                  <Target size={16} />
                </div>
                <div className="stat-content">
                  <span className="stat-number">
                    {projectData?.progression?.total_phases || projectPhases.length}
                  </span>
                  <span className="stat-label">Phases</span>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">
                  <CheckCircle2 size={16} />
                </div>
                <div className="stat-content">
                  <span className="stat-number">
                    {projectData?.progression?.phases_terminees || projectPhases.filter(p => p.terminee).length}
                  </span>
                  <span className="stat-label">Terminées</span>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">
                  <Play size={16} />
                </div>
                <div className="stat-content">
                  <span className="stat-number">
                    {projectData?.progression?.phases_en_cours || projectPhases.filter(p => p.est_en_cours).length}
                  </span>
                  <span className="stat-label">En cours</span>
                </div>
              </div>
              {projectData?.taches && (
                <>
                  <div className="stat-item">
                    <div className="stat-icon">
                      <BarChart3 size={16} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-number">
                        {projectData.taches.total || 0}
                      </span>
                      <span className="stat-label">Tâches</span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">
                      <CheckCircle2 size={16} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-number">
                        {projectData.taches.terminees || 0}
                      </span>
                      <span className="stat-label">Tâches terminées</span>
                    </div>
                  </div>
                  {projectData.taches.hors_delai > 0 && (
                    <div className="stat-item">
                      <div className="stat-icon">
                        <AlertCircle size={16} />
                      </div>
                      <div className="stat-content">
                        <span className="stat-number" style={{ color: '#ef4444' }}>
                          {projectData.taches.hors_delai}
                        </span>
                        <span className="stat-label">En retard</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Liste des phases simplifiée */}
          <div className="phases-section">
            <div className="phases-header">
              <h5>Phases du Projet</h5>
            </div>
            
            {(projectPhases.length > 0 || (projectData?.phases && projectData.phases.length > 0)) ? (
              <div className="phases-grid">
                {(projectData?.phases || projectPhases).map((phase, index) => {
                  const phaseData = projectData?.phases ? phase : null;
                  const phaseNom = phaseData?.nom || phase.phase?.nom || phase.nom || `Phase ${index + 1}`;
                  const phaseTerminee = phaseData?.terminee !== undefined ? phaseData.terminee : phase.terminee;
                  const phaseProgression = phaseData?.progression || phase.progression_pourcentage || 0;
                  const phaseTasksRaw = phaseData?.taches || phase.taches || [];
                  let phaseTasksTotal = 0;
                  let phaseTasksDone = 0;

                  if (Array.isArray(phaseTasksRaw)) {
                    phaseTasksTotal = phaseTasksRaw.length;
                    phaseTasksDone = phaseTasksRaw.filter((tache) => tache.statut === 'termine').length;
                  } else if (phaseTasksRaw && typeof phaseTasksRaw === 'object') {
                    phaseTasksTotal = phaseTasksRaw.total || phaseTasksRaw.nombre || 0;
                    phaseTasksDone = phaseTasksRaw.terminees || phaseTasksRaw.nombre_terminees || 0;
                  }
                  
                  return (
                  <div key={phase.id || phase.phase_id || index} className="phase-card">
                    <div className="phase-header">
                      <div className="phase-number">{index + 1}</div>
                      <div className="phase-info">
                        <h6 className="phase-name">{phaseNom}</h6>
                        <span className={`phase-status ${getPhaseStatusColor(phase)}`}>
                          {getPhaseStatusIcon(phase)}
                          {getPhaseStatusText(phase)}
                        </span>
                      </div>
                    </div>
                    <div className="phase-progress">
                      <div className="phase-progress-bar">
                        <div 
                          className="phase-progress-fill"
                          style={{ 
                            width: `${phaseProgression}%`
                          }}
                        ></div>
                      </div>
                      <span className="phase-progress-text">
                        {phaseProgression}%
                      </span>
                      {phaseTasksTotal > 0 && (
                        <div className="phase-etapes-info" style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                          {phaseTasksDone}/{phaseTasksTotal} tâches terminées
                          {phaseData && (
                            <>
                              {phaseData.taches_en_cours > 0 && (
                                <span style={{ marginLeft: '8px', color: '#3b82f6' }}>
                                  • {phaseData.taches_en_cours} en cours
                                </span>
                              )}
                              {phaseData.taches_en_attente > 0 && (
                                <span style={{ marginLeft: '8px', color: '#f59e0b' }}>
                                  • {phaseData.taches_en_attente} en attente
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      )}
                      {phaseData?.date_debut && (
                        <div className="phase-etapes-info" style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
                          <Clock size={10} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                          Début: {new Date(phaseData.date_debut).toLocaleDateString('fr-FR')}
                          {phaseData.date_fin && (
                            <> • Fin: {new Date(phaseData.date_fin).toLocaleDateString('fr-FR')}</>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-phases">
                <AlertCircle size={24} />
                <p>Aucune phase définie pour ce projet</p>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
                  Les phases seront chargées depuis l'API...
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* État vide */}
      {!selectedProject && (
        <div className="no-project-selected">
          <Target size={48} />
          <h4>Sélectionnez un projet</h4>
          <p>Choisissez un projet pour voir sa progression</p>
        </div>
      )}

      {/* Overlay de chargement */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <RotateCcw size={20} className="spinning" />
            <span>Chargement...</span>
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default ProjectProgress;
