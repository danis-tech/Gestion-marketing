import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  ChevronDown,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Target,
  Users,
  Flag,
  MoreHorizontal,
  TrendingUp
} from 'lucide-react';
import { projectsService, phasesService } from '../../services/apiService';
import './KanbanBoard.css';

const KanbanBoard = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectPhases, setProjectPhases] = useState([]);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [draggedPhase, setDraggedPhase] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsService.getProjects();
      
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
    } catch (err) {
      console.error('Erreur lors du chargement des projets:', err);
      setError('Impossible de charger les projets');
    } finally {
      setLoading(false);
    }
  };

  const loadProjectPhases = async (projectId) => {
    try {
      setLoading(true);
      const response = await phasesService.getProjectPhases(projectId);
      
      let phasesData = [];
      if (response && Array.isArray(response)) {
        phasesData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        phasesData = response.data;
      } else if (response && response.results && Array.isArray(response.results)) {
        phasesData = response.results;
      }
      
      // Debug des données reçues (à supprimer en production)
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Données des phases reçues:', phasesData);
        console.log('🔍 Structure de la première phase:', phasesData[0]);
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
    setSelectedPhase(null); // Réinitialiser la phase sélectionnée
    loadProjectPhases(project.id);
  };

  const handlePhaseSelect = (phase) => {
    setSelectedPhase(phase);
    console.log('🎯 Phase sélectionnée:', phase.nom);
  };

  const calculateProgress = (item) => {
    if (item.type === 'etape') {
      // Pour les étapes, utiliser la progression réelle
      return item.progression_pourcentage || 0;
    } else {
      // Pour les phases, utiliser la progression calculée côté backend
      return item.progression_pourcentage || 0;
    }
  };

  const getPhaseStatusColor = (item) => {
    if (item.type === 'etape') {
      // Pour les étapes
      if (item.statut === 'terminee') return '#10b981';
      if (item.statut === 'en_cours') return '#3b82f6';
      return '#6b7280';
    } else {
      // Pour les phases
      if (item.terminee) return '#10b981';
      if (item.est_en_cours) return '#3b82f6';
      return '#6b7280';
    }
  };

  const getPhaseStatusIcon = (item) => {
    if (item.type === 'etape') {
      // Pour les étapes
      if (item.statut === 'terminee') return <CheckCircle2 size={14} />;
      if (item.statut === 'en_cours') return <Play size={14} />;
      return <Pause size={14} />;
    } else {
      // Pour les phases
      if (item.terminee) return <CheckCircle2 size={14} />;
      if (item.est_en_cours) return <Play size={14} />;
      return <Pause size={14} />;
    }
  };

  const getPhaseStatusText = (item) => {
    if (item.type === 'etape') {
      // Pour les étapes
      if (item.statut === 'terminee') return 'Terminée';
      if (item.statut === 'en_cours') return 'En cours';
      return 'En attente';
    } else {
      // Pour les phases
      if (item.terminee) return 'Terminée';
      if (item.est_en_cours) return 'En cours';
      if (item.est_en_attente) return 'En attente';
      return 'En attente';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'haute': return '#ef4444';
      case 'moyenne': return '#f59e0b';
      case 'basse': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'haute': return <AlertCircle size={12} />;
      case 'moyenne': return <Clock size={12} />;
      case 'basse': return <CheckCircle2 size={12} />;
      default: return <Flag size={12} />;
    }
  };

  // Organiser les phases par colonnes Kanban
  const organizePhasesIntoColumns = () => {
    const columns = {
      'À faire': [], // Toutes les phases du projet
      'En cours': [], // Étapes en cours de la phase sélectionnée
      'Terminé': [] // Étapes terminées de la phase sélectionnée
    };

    // Organiser les phases dans "À faire"
    projectPhases.forEach((phase, index) => {
      const uniquePhase = {
        ...phase,
        uniqueKey: `${phase.id}-${index}-${phase.nom || phase.phase?.nom || 'phase'}`,
        type: 'phase',
        // Utiliser les données directement disponibles depuis le sérialiseur
        nom: phase.nom || phase.phase?.nom || 'Phase sans nom',
        description: phase.description || phase.phase?.description || 'Aucune description',
        ordre: phase.ordre || phase.phase?.ordre || 0,
        priorite: phase.priorite || 'normale',
        // Conserver les dates et commentaires de la phase
        date_debut: phase.date_debut,
        date_fin: phase.date_fin,
        commentaire: phase.commentaire,
        terminee: phase.terminee,
        est_en_cours: phase.est_en_cours,
        est_en_attente: phase.est_en_attente
      };

      // Debug de la phase organisée (à supprimer en production)
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Phase organisée:', uniquePhase);
        console.log(`  - ${uniquePhase.nom}: terminee=${uniquePhase.terminee}, est_en_cours=${uniquePhase.est_en_cours}, est_en_attente=${uniquePhase.est_en_attente}, ignoree=${phase.ignoree}`);
        console.log(`  - Progression calculée: ${calculateProgress(uniquePhase)}%`);
        if (uniquePhase.toutes_les_etapes) {
          console.log(`  - Étapes: ${uniquePhase.toutes_les_etapes.length}`);
        }
      }
      
      // Ne pas afficher les phases ignorées
      if (phase.ignoree) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🚫 Phase ignorée:', phase.nom);
        }
        return; // Skip cette phase
      }
      
      // Toutes les phases vont dans "À faire"
      columns['À faire'].push(uniquePhase);
    });

    // Si une phase est sélectionnée, afficher ses étapes dans "En cours" et "Terminé"
    if (selectedPhase) {
      const etapes = selectedPhase.toutes_les_etapes || selectedPhase.etapes_en_attente_ou_en_cours || [];
      
      etapes.forEach((etape, etapeIndex) => {
        const uniqueEtape = {
          ...etape,
          uniqueKey: `etape-${etape.id}-${etapeIndex}`,
          type: 'etape',
          phaseParent: selectedPhase
        };

        if (etape.statut === 'en_cours') {
          columns['En cours'].push(uniqueEtape);
        } else if (etape.statut === 'terminee') {
          columns['Terminé'].push(uniqueEtape);
        }
      });
    } else {
      // Si aucune phase sélectionnée, afficher les phases terminées dans "Terminé"
      projectPhases.forEach((phase, index) => {
        if (phase.terminee && !phase.ignoree) {
          const uniquePhase = {
            ...phase,
            uniqueKey: `phase-terminee-${phase.id}-${index}`,
            type: 'phase',
            nom: phase.nom || phase.phase?.nom || 'Phase sans nom',
            description: phase.description || phase.phase?.description || 'Aucune description',
            ordre: phase.ordre || phase.phase?.ordre || 0,
            priorite: phase.priorite || 'normale',
            progression_pourcentage: phase.progression_pourcentage || 0
          };
          columns['Terminé'].push(uniquePhase);
        }
      });
    }

    return columns;
  };

  const handleDragStart = (e, phase) => {
    setDraggedPhase(phase);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetColumn) => {
    e.preventDefault();
    if (!draggedPhase) return;

    // Ici vous pourriez implémenter la logique pour mettre à jour le statut de la phase
    console.log(`Déplacer ${draggedPhase.nom} vers ${targetColumn}`);
    setDraggedPhase(null);
  };

  const columns = organizePhasesIntoColumns();
  const totalPhases = projectPhases.length;
  const completedPhases = projectPhases.filter(p => p.terminee).length;
  const inProgressPhases = projectPhases.filter(p => p.est_en_cours).length;
  const pendingPhases = projectPhases.filter(p => !p.terminee && !p.est_en_cours).length;

  if (loading && !selectedProject) {
    return (
      <div className="kanban-container">
        <div className="kanban-loading">
          <div className="loading-spinner">
            <RotateCcw size={20} className="spinning" />
            <span>Chargement des projets...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !selectedProject) {
    return (
      <div className="kanban-container">
        <div className="kanban-error">
          <AlertCircle size={24} />
          <h3>Erreur de chargement</h3>
          <p>{error}</p>
          <button onClick={loadProjects} className="retry-btn">
            <RotateCcw size={16} />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="kanban-container">
        <div className="kanban-project-selector">
          <div className="selector-header">
            <div className="selector-icon">
              <FolderOpen size={48} />
            </div>
            <h2>Sélectionnez un Projet</h2>
            <p>Choisissez un projet pour voir son diagramme Kanban</p>
          </div>

          <div className="projects-list">
            <div className="projects-header">
              <h3>Projets Disponibles</h3>
              <span className="projects-count">{projects.length} projet(s)</span>
            </div>
            
            <div className="projects-grid">
              {projects.map(project => (
                <div
                  key={`project-${project.id}-${project.nom}`}
                  className="project-card"
                  onClick={() => handleProjectSelect(project)}
                >
                  <div className="project-card-header">
                    <div className="project-icon">
                      <FolderOpen size={20} />
                    </div>
                    <div className="project-status">
                      <span className={`status-badge ${project.statut?.toLowerCase() || 'en-attente'}`}>
                        {project.statut || 'En attente'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="project-card-content">
                    <h4 className="project-name">{project.nom}</h4>
                    <p className="project-description">{project.description || 'Aucune description'}</p>
                    
                    <div className="project-meta">
                      <div className="meta-item">
                        <Calendar size={14} />
                        <span>Début: {project.debut ? new Date(project.debut).toLocaleDateString('fr-FR') : 'Non définie'}</span>
                      </div>
                      <div className="meta-item">
                        <Calendar size={14} />
                        <span>Fin: {project.fin ? new Date(project.fin).toLocaleDateString('fr-FR') : 'Non définie'}</span>
                      </div>
                      <div className="meta-item">
                        <User size={14} />
                        <span>Responsable: {project.chef_projet || 'Non assigné'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="project-card-footer">
                    <div className="project-code">{project.code}</div>
                    <div className="project-priority">
                      <Flag size={14} />
                      <span>{project.priorite || 'Normale'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="kanban-container">
      {/* Header amélioré */}
      <div className="kanban-header">
        <div className="kanban-project-info">
          <div className="project-header">
            <div className="project-icon">
              <FolderOpen size={24} />
            </div>
            <div className="project-details">
              <h2>{selectedProject.nom}</h2>
              <p>{selectedProject.description || 'Aucune description'}</p>
            </div>
          </div>
          
          <div className="project-meta-info">
            <div className="meta-item">
              <Calendar size={16} />
              <span>Début: {selectedProject.debut ? new Date(selectedProject.debut).toLocaleDateString('fr-FR') : 'Non définie'}</span>
            </div>
            <div className="meta-item">
              <Calendar size={16} />
              <span>Fin: {selectedProject.fin ? new Date(selectedProject.fin).toLocaleDateString('fr-FR') : 'Non définie'}</span>
            </div>
            <div className="meta-item">
              <User size={16} />
              <span>Responsable: {selectedProject.chef_projet || 'Non assigné'}</span>
            </div>
          </div>
        </div>
        
        <div className="kanban-actions">
          <button 
            className="change-project-btn"
            onClick={() => setSelectedProject(null)}
          >
            <ChevronDown size={16} />
            Changer de projet
          </button>
        </div>
      </div>


      {/* Statistiques du projet */}
      <div className="project-stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <Target size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{totalPhases}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">
            <Clock size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{pendingPhases}</span>
            <span className="stat-label">En attente</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon progress">
            <Play size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{inProgressPhases}</span>
            <span className="stat-label">En cours</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon completed">
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{completedPhases}</span>
            <span className="stat-label">Terminé</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon progress-rate">
            <TrendingUp size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{Math.round((completedPhases / totalPhases) * 100) || 0}%</span>
            <span className="stat-label">Progression</span>
          </div>
        </div>
      </div>

      {/* Board Kanban amélioré */}
      <div className="kanban-board">
        {Object.entries(columns).map(([columnName, phases]) => (
          <div 
            key={columnName}
            className="kanban-column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, columnName)}
          >
            <div className="column-header">
              <div className="column-title">
                <h3>{columnName}</h3>
                <span className="column-count">{phases.length}</span>
              </div>
            </div>
            
            <div className="column-content">
              {phases.length === 0 ? (
                <div className="empty-column">
                  <Target size={32} />
                  <p>
                    {columnName === 'À faire' ? 'Toutes les phases du projet' :
                     columnName === 'En cours' ? (selectedPhase ? 'Aucune étape en cours' : 'Sélectionnez une phase') :
                     selectedPhase ? 'Aucune étape terminée' : 'Aucune phase terminée'}
                  </p>
                </div>
              ) : (
                phases.map(item => (
                  <div 
                    key={item.uniqueKey}
                    className={`phase-card ${item.type === 'phase' ? 'clickable-phase' : ''} ${selectedPhase && selectedPhase.id === item.id ? 'selected-phase' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    onClick={() => item.type === 'phase' && handlePhaseSelect(item)}
                  >
                    {/* En-tête avec ID et statut */}
                    <div className="phase-header">
                      <div className="phase-number">{item.id}</div>
                      <div className="phase-status">
                        {getPhaseStatusIcon(item)}
                        <span style={{ color: getPhaseStatusColor(item) }}>
                          {getPhaseStatusText(item)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Contenu principal */}
                    <div className="phase-content">
                      <h4 className="phase-name">
                        {item.type === 'etape' ? item.nom : (item.phase?.nom || item.nom)}
                      </h4>
                      <p className="phase-description">
                        {item.type === 'etape' 
                          ? (item.description || 'Aucune description')
                          : (item.phase?.description || item.description || 'Aucune description')
                        }
                      </p>
                      
                      <div className="phase-priority">
                        <span 
                          className="priority-badge"
                          style={{ backgroundColor: getPriorityColor(item.priorite) }}
                        >
                          {getPriorityIcon(item.priorite)}
                          {item.priorite || 'Normale'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Métadonnées selon le type */}
                    <div className="phase-footer">
                      <div className="phase-meta">
                        {item.type === 'etape' ? (
                          // Affichage pour les étapes
                          <>
                            <div className="meta-item">
                              <Clock size={12} />
                              <span>{item.duree_prevue || 'N/A'} jours</span>
                            </div>
                            <div className="meta-item">
                              <Users size={12} />
                              <span>{item.responsable?.prenom || 'Non assigné'}</span>
                            </div>
                            <div className="meta-item">
                              <Calendar size={12} />
                              <span>Début: {item.date_debut_prevue ? new Date(item.date_debut_prevue).toLocaleDateString('fr-FR') : 'Non définie'}</span>
                            </div>
                            <div className="meta-item">
                              <Calendar size={12} />
                              <span>Fin: {item.date_fin_prevue ? new Date(item.date_fin_prevue).toLocaleDateString('fr-FR') : 'Non définie'}</span>
                            </div>
                          </>
                        ) : (
                          // Affichage pour les phases
                          <>
                            <div className="meta-item">
                              <Clock size={12} />
                              <span>
                                {item.date_debut && item.date_fin ? 
                                  Math.ceil((new Date(item.date_fin) - new Date(item.date_debut)) / (1000 * 60 * 60 * 24)) + ' jours' :
                                  'Phase ' + (item.ordre || 0)
                                }
                              </span>
                            </div>
                            <div className="meta-item">
                              <Users size={12} />
                              <span>
                                {item.commentaire || 'Phase standard'}
                              </span>
                            </div>
                            <div className="meta-item">
                              <Calendar size={12} />
                              <span>Début: {item.date_debut ? new Date(item.date_debut).toLocaleDateString('fr-FR') : 'En attente'}</span>
                            </div>
                            <div className="meta-item">
                              <Calendar size={12} />
                              <span>Fin: {item.date_fin ? new Date(item.date_fin).toLocaleDateString('fr-FR') : 'En attente'}</span>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="phase-actions">
                        <button className="action-btn" title="Plus d'options">
                          <MoreHorizontal size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="phase-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${calculateProgress(item)}%`,
                            backgroundColor: getPhaseStatusColor(item)
                          }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {calculateProgress(item)}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="kanban-loading-overlay">
          <div className="loading-spinner">
            <RotateCcw size={20} className="spinning" />
            <span>Chargement des phases...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="kanban-error-message">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;