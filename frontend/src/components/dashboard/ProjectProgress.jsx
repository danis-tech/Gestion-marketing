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

const ProjectProgress = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectPhases, setProjectPhases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('detailed'); // detailed, compact, timeline
  const [isAnimating, setIsAnimating] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState(new Set());
  const [showInsights, setShowInsights] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

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
      loadProjectPhases(selectedProject.id);
    }
  };

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
      case 'hors_delai': return 'text-red-600 bg-red-100';
      case 'rejete': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProjectStatusText = (project) => {
    switch (project.statut) {
      case 'termine': return 'Terminé';
      case 'en_attente': return 'En attente';
      case 'hors_delai': return 'Hors délai';
      case 'rejete': return 'Rejeté';
      default: return 'Inconnu';
    }
  };

  return (
    <div className="project-progress-container">
      {/* Sélecteur de projet simplifié */}
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

      {/* Contenu principal du projet */}
      {selectedProject && (
        <div className="project-details">
          {/* Informations du projet */}
          <div className="project-info-card">
            <div className="project-main-info">
              <div className="project-header">
                <h4 className="project-name">{selectedProject.nom}</h4>
                <span className={`project-status ${getProjectStatusColor(selectedProject)}`}>
                  {getProjectStatusText(selectedProject)}
                </span>
              </div>
              <div className="project-meta">
                <div className="meta-item">
                  <Calendar size={14} />
                  <span>Début: {selectedProject.debut ? new Date(selectedProject.debut).toLocaleDateString('fr-FR') : 'Non définie'}</span>
                </div>
                <div className="meta-item">
                  <Calendar size={14} />
                  <span>Fin: {selectedProject.fin ? new Date(selectedProject.fin).toLocaleDateString('fr-FR') : 'Non définie'}</span>
                </div>
                <div className="meta-item">
                  <User size={14} />
                  <span>Responsable: {selectedProject.chef_projet || 'Non assigné'}</span>
                </div>
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
                  <span className="stat-number">{projectPhases.length}</span>
                  <span className="stat-label">Phases</span>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">
                  <CheckCircle2 size={16} />
                </div>
                <div className="stat-content">
                  <span className="stat-number">{projectPhases.filter(p => p.terminee).length}</span>
                  <span className="stat-label">Terminées</span>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">
                  <Play size={16} />
                </div>
                <div className="stat-content">
                  <span className="stat-number">{projectPhases.filter(p => p.est_en_cours).length}</span>
                  <span className="stat-label">En cours</span>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des phases simplifiée */}
          <div className="phases-section">
            <div className="phases-header">
              <h5>Phases du Projet</h5>
            </div>
            
            {projectPhases.length > 0 ? (
              <div className="phases-grid">
                {projectPhases.map((phase, index) => (
                  <div key={phase.id} className="phase-card">
                    <div className="phase-header">
                      <div className="phase-number">{index + 1}</div>
                      <div className="phase-info">
                        <h6 className="phase-name">{phase.nom}</h6>
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
                            width: phase.terminee ? '100%' : phase.est_en_cours ? '60%' : '0%' 
                          }}
                        ></div>
                      </div>
                      <span className="phase-progress-text">
                        {phase.terminee ? '100%' : phase.est_en_cours ? '60%' : '0%'}
                      </span>
                    </div>
                  </div>
                ))}
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
