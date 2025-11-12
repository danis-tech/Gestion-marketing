import React, { useState, useEffect } from 'react';
import { projectsService, tasksService, projectService } from '../../services/apiService';
import { CheckCircle2, Play, Pause, AlertCircle, RotateCcw, User, Calendar, Filter } from 'lucide-react';
import useNotification from '../../hooks/useNotification';
import './KanbanBoard.css';

const KanbanBoard = () => {
  const { showSuccess, showError } = useNotification();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectTasks, setProjectTasks] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);

  // Charger les projets
  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await projectsService.getProjects();
      const projectsData = response?.results || response || [];
      setProjects(projectsData);
    } catch (err) {
      console.error('Erreur lors du chargement des projets:', err);
      setError('Impossible de charger les projets');
    } finally {
      setLoading(false);
    }
  };

  // Charger les membres d'un projet
  const loadProjectMembers = async (projectId) => {
    try {
      const response = await projectService.getProjectMembers(projectId);
      const members = response?.results || response || [];
      setProjectMembers(members);
    } catch (err) {
      console.error('Erreur lors du chargement des membres:', err);
    }
  };

  // Charger les tâches d'un projet
  const loadProjectTasks = async (projectId) => {
    if (!projectId) {
      setProjectTasks([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await tasksService.getProjectTasks(projectId);
      const tasks = response?.results || response || [];
      setProjectTasks(Array.isArray(tasks) ? tasks : []);
    } catch (err) {
      console.error('Erreur lors du chargement des tâches:', err);
      setError('Impossible de charger les tâches du projet');
    } finally {
      setLoading(false);
    }
  };

  // Sélectionner un projet
  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setSelectedMember(null);
    if (project) {
      loadProjectTasks(project.id);
      loadProjectMembers(project.id);
    } else {
      setProjectTasks([]);
      setProjectMembers([]);
    }
  };

  // Filtrer les tâches par membre
  const filteredTasks = selectedMember
    ? projectTasks.filter(task => 
        task.assigne_a && task.assigne_a.some(user => user.id === selectedMember.id)
      )
    : projectTasks;

  // Organiser les tâches en colonnes
  const organizeTasksIntoColumns = () => {
    const columns = {
      'À faire': [],
      'En cours': [],
      'Terminé': []
    };

    filteredTasks.forEach((task) => {
      if (task.statut === 'termine') {
        columns['Terminé'].push(task);
      } else if (task.statut === 'en_cours') {
        columns['En cours'].push(task);
      } else {
        columns['À faire'].push(task);
      }
    });

    return columns;
  };

  // Mettre à jour le statut d'une tâche
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await tasksService.updateTaskStatus(taskId, newStatus);
      showSuccess('Succès', 'Statut de la tâche mis à jour');
      if (selectedProject) {
        await loadProjectTasks(selectedProject.id);
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      showError('Erreur', 'Impossible de mettre à jour le statut de la tâche');
    }
  };

  // Gestion du drag & drop
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetColumn) => {
    e.preventDefault();
    if (!draggedTask) return;

    let newStatus;
    switch (targetColumn) {
      case 'À faire':
        newStatus = 'en_attente';
        break;
      case 'En cours':
        newStatus = 'en_cours';
        break;
      case 'Terminé':
        newStatus = 'termine';
        break;
      default:
        return;
    }

    if (draggedTask.statut !== newStatus) {
      await updateTaskStatus(draggedTask.id, newStatus);
    }

    setDraggedTask(null);
  };

  // Fonctions utilitaires
  const getTaskStatusColor = (task) => {
    if (task.statut === 'termine') return '#10b981';
    if (task.statut === 'en_cours') return '#3b82f6';
    return '#6b7280';
  };

  const getTaskStatusIcon = (task) => {
    if (task.statut === 'termine') return <CheckCircle2 size={14} />;
    if (task.statut === 'en_cours') return <Play size={14} />;
    return <Pause size={14} />;
  };

  const getTaskStatusText = (task) => {
    if (task.statut === 'termine') return 'Terminée';
    if (task.statut === 'en_cours') return 'En cours';
    return 'En attente';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Non définie';
    return date.toLocaleDateString('fr-FR');
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const columns = organizeTasksIntoColumns();
  const totalTasks = filteredTasks.length;
  const completedTasks = columns['Terminé'].length;
  const inProgressTasks = columns['En cours'].length;
  const pendingTasks = columns['À faire'].length;

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
            <h2>Sélectionnez un projet</h2>
            <p>Choisissez un projet pour voir les tâches de ses membres</p>
          </div>
          <div className="projects-list">
            {projects.length === 0 ? (
              <div className="empty-state">
                <AlertCircle size={48} />
                <p>Aucun projet disponible</p>
              </div>
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  className="project-card"
                  onClick={() => handleProjectSelect(project)}
                >
                  <div className="project-info">
                    <h3>{project.nom}</h3>
                    <p>{project.code || project.description || 'Aucune description'}</p>
                  </div>
                  <div className="project-arrow">→</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="kanban-container">
      <div className="kanban-header">
        <div className="kanban-header-left">
          <button
            onClick={() => handleProjectSelect(null)}
            className="back-btn"
          >
            ← Retour
          </button>
          <div className="project-info-header">
            <h2>{selectedProject.nom}</h2>
            <span className="project-code">{selectedProject.code}</span>
          </div>
        </div>
        <div className="kanban-header-right">
          <div className="filter-section">
            <Filter size={16} />
            <select
              value={selectedMember?.id || ''}
              onChange={(e) => {
                const memberId = e.target.value;
                const member = memberId ? projectMembers.find(m => m.id === parseInt(memberId)) : null;
                setSelectedMember(member);
              }}
              className="member-filter"
            >
              <option value="">Tous les membres</option>
              {projectMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.prenom} {member.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="kanban-stats">
            <div className="stat-item">
              <span className="stat-label">Total:</span>
              <span className="stat-value">{totalTasks}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Terminées:</span>
              <span className="stat-value completed">{completedTasks}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">En cours:</span>
              <span className="stat-value in-progress">{inProgressTasks}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">À faire:</span>
              <span className="stat-value pending">{pendingTasks}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="kanban-board">
        {Object.entries(columns).map(([columnName, tasks]) => (
          <div
            key={columnName}
            className="kanban-column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, columnName)}
          >
            <div className="column-header">
              <h3>{columnName}</h3>
              <span className="task-count">{tasks.length}</span>
            </div>
            <div className="column-content">
              {tasks.length === 0 ? (
                <div className="empty-column">
                  <p>Aucune tâche</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="task-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                  >
                    <div className="task-header">
                      <div className="task-status" style={{ color: getTaskStatusColor(task) }}>
                        {getTaskStatusIcon(task)}
                        <span>{getTaskStatusText(task)}</span>
                      </div>
                    </div>
                    <div className="task-body">
                      <h4>{task.titre}</h4>
                      {task.description && (
                        <p className="task-description">{task.description}</p>
                      )}
                    </div>
                    <div className="task-footer">
                      {task.assigne_a && task.assigne_a.length > 0 && (
                        <div className="task-assignees">
                          <User size={12} />
                          {task.assigne_a.map((user, idx) => (
                            <span key={user.id || idx} className="assignee-name">
                              {user.prenom} {user.nom}
                            </span>
                          ))}
                        </div>
                      )}
                      {task.fin && (
                        <div className="task-date">
                          <Calendar size={12} />
                          <span>{formatDate(task.fin)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard;

