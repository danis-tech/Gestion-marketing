import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  User, 
  DollarSign, 
  Clock, 
  FileText,
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle,
  Info,
  Edit,
  Target,
  BarChart3
} from 'lucide-react';
import { projectsService } from '../../services/apiService';
import './ProjectDetailsModal.css';

const ProjectDetailsModal = ({ project, isOpen, onClose }) => {
  const [projectDetails, setProjectDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  // Charger les détails complets du projet quand le modal s'ouvre
  useEffect(() => {
    const loadProjectDetails = async () => {
      if (isOpen && project && project.id) {
        setLoading(true);
        try {
          const details = await projectsService.getProject(project.id);
          setProjectDetails(details);
        } catch (error) {
          console.error('Erreur lors du chargement des détails:', error);
          setProjectDetails(project); // Fallback sur les données de base
        } finally {
          setLoading(false);
        }
      }
    };

    loadProjectDetails();
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  // Utiliser les détails complets si disponibles, sinon les données de base
  const currentProject = projectDetails || project;


  // Fonction utilitaire pour gérer les valeurs par défaut
  const getFieldValue = (project, field, defaultValue = 'Non défini') => {
    if (!project) return defaultValue;
    
    const possibleFields = Array.isArray(field) ? field : [field];
    
    for (const f of possibleFields) {
      if (project[f] !== undefined && project[f] !== null && project[f] !== '') {
        return project[f];
      }
    }
    
    return defaultValue;
  };

  // Formatage des dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  // Formatage du budget
  const formatBudget = (budget) => {
    if (!budget || budget === 0 || budget === '0') return 'Non défini';
    
    // Convertir en nombre si c'est une chaîne
    const budgetNumber = typeof budget === 'string' ? parseFloat(budget) : budget;
    
    if (isNaN(budgetNumber)) return 'Non défini';
    
    return budgetNumber.toLocaleString('fr-FR') + ' FCFA';
  };

  // Calcul de la progression (si dates disponibles)
  const calculateProgress = () => {
    const startDate = getFieldValue(currentProject, ['debut', 'date_debut', 'cree_le']);
    const endDate = getFieldValue(currentProject, ['fin', 'date_fin']);
    
    if (!startDate || !endDate) return 0;
    
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const now = new Date();
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
      
      const totalDuration = end - start;
      const elapsed = now - start;
      
      if (totalDuration <= 0) return 100;
      if (elapsed <= 0) return 0;
      if (elapsed >= totalDuration) return 100;
      
      return Math.round((elapsed / totalDuration) * 100);
    } catch (error) {
      return 0;
    }
  };

  const progress = calculateProgress();

  return (
    <div className="project-details-modal-overlay" onClick={onClose}>
      <div className="project-details-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="project-details-modal-header">
          <div className="project-details-modal-title">
            <FileText className="project-details-modal-icon" />
            Détails du Projet
          </div>
          <button className="project-details-modal-close" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="project-details-modal-body">
          {/* Informations principales */}
          <div className="project-info-section">
            <div className="project-main-info">
              <h2 className="project-name">{getFieldValue(currentProject, 'nom', 'Projet sans nom')}</h2>
              <p className="project-code">Code: {getFieldValue(currentProject, 'code', 'N/A')}</p>
            </div>
            
          </div>

          {/* Description et objectif */}
          <div className="info-section">
            <div className="info-title">
              <Info className="w-5 h-5 text-blue-600" />
              Description du projet
            </div>
            <div className="info-content">
              <div className="info-item">
                <label className="info-label">Description</label>
                <p className="info-value">
                  {getFieldValue(currentProject, 'description', 'Aucune description disponible')}
                </p>
              </div>
              <div className="info-item">
                <label className="info-label">Objectif</label>
                <p className="info-value">
                  {getFieldValue(currentProject, 'objectif', 'Aucun objectif défini')}
                </p>
              </div>
            </div>
          </div>

          {/* Planning et estimation */}
          <div className="info-section">
            <div className="info-title">
              <Calendar className="w-5 h-5 text-purple-600" />
              Planning et estimation
            </div>
            <div className="info-content">
              <div className="info-grid">
                <div className="info-item">
                  <label className="info-label">Date de début</label>
                  <p className="info-value">
                    {formatDate(getFieldValue(currentProject, ['debut', 'date_debut', 'cree_le']))}
                  </p>
                </div>
                <div className="info-item">
                  <label className="info-label">Date de fin</label>
                  <p className="info-value">
                    {formatDate(getFieldValue(currentProject, ['fin', 'date_fin']))}
                  </p>
                </div>
                <div className="info-item">
                  <label className="info-label">Estimation (jours)</label>
                  <p className="info-value">
                    {getFieldValue(currentProject, 'estimation_jours', 'Non définie')} jours
                  </p>
                </div>
                <div className="info-item">
                  <label className="info-label">Progression</label>
                  <div className="progress-bar-container">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{progress}% terminé</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Équipe et responsabilités */}
          <div className="info-section">
            <div className="info-title">
              <Users className="w-5 h-5 text-green-600" />
              Équipe et responsabilités
            </div>
            <div className="info-content">
              <div className="info-grid">
                <div className="info-item">
                  <label className="info-label">Responsable du projet</label>
                  <p className="info-value">
                    {currentProject.proprietaire ? 
                      `${currentProject.proprietaire.prenom} ${currentProject.proprietaire.nom} (@${currentProject.proprietaire.username})` : 
                      'Non défini'
                    }
                  </p>
                </div>
                <div className="info-item">
                  <label className="info-label">Type de projet</label>
                  <p className="info-value">
                    {getFieldValue(currentProject, 'type', 'Non défini')}
                  </p>
                </div>
                <div className="info-item">
                  <label className="info-label">Créateur</label>
                  <p className="info-value">
                    {getFieldValue(currentProject, 'nom_createur', 'Non défini')}
                  </p>
                </div>
              </div>
              
              {/* Liste des membres de l'équipe */}
              <div className="team-members-section">
                <label className="info-label">
                  Membres de l'équipe ({currentProject.nombre_membres || currentProject.membres?.length || 0})
                </label>
                <div className="team-members-list">
                  {loading ? (
                    <div className="team-member-item">
                      <span className="member-name">Chargement des membres...</span>
                    </div>
                  ) : currentProject.membres && currentProject.membres.length > 0 ? (
                    currentProject.membres.map((membre, index) => (
                      <div key={membre.id || index} className="team-member-item">
                        <span className="member-name">
                          {membre.utilisateur ? 
                            `${membre.utilisateur.prenom} ${membre.utilisateur.nom}` : 
                            'Membre inconnu'
                          }
                        </span>
                        {membre.role_projet && (
                          <span className="member-role">({membre.role_projet})</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="team-member-item">
                      <span className="member-name">
                        {currentProject.nombre_membres > 0 ? 
                          `${currentProject.nombre_membres} membre(s) - Détails disponibles en mode édition` : 
                          'Aucun membre assigné'
                        }
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Statut et priorité */}
          <div className="status-section">
            <div className="info-title">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Statut du projet
            </div>
            <div className="status-grid">
              <div className="status-item">
                <label className="status-label">Statut</label>
                <span className={`status-badge status-${getFieldValue(currentProject, ['statut', 'etat'], 'default').toLowerCase()}`}>
                  {getFieldValue(currentProject, ['statut', 'etat'], 'Non défini')}
                </span>
              </div>
              <div className="status-item">
                <label className="status-label">Priorité</label>
                <span className={`priority-badge priority-${getFieldValue(currentProject, 'priorite', 'default').toLowerCase()}`}>
                  {getFieldValue(currentProject, 'priorite', 'Non définie')}
                </span>
              </div>
              <div className="status-item">
                <label className="status-label">État</label>
                <span className={`state-badge state-${getFieldValue(currentProject, 'etat', 'off').toLowerCase()}`}>
                  {getFieldValue(currentProject, 'etat') === 'On' ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          </div>

          {/* Métadonnées et statistiques de position */}
          <div className="metadata-section">
            <div className="info-title">
              <Clock className="w-5 h-5 text-gray-600" />
              Métadonnées et position
            </div>
            <div className="metadata-grid">
              <div className="metadata-item">
                <span className="metadata-label">Créé le:</span>
                <span className="metadata-value">
                  {formatDate(getFieldValue(currentProject, 'cree_le'))}
                </span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Mis à jour le:</span>
                <span className="metadata-value">
                  {formatDate(getFieldValue(currentProject, 'mis_a_jour_le'))}
                </span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Position dans l'application:</span>
                <span className="metadata-value">#{currentProject.id}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Position dans le mois:</span>
                <span className="metadata-value">
                  {(() => {
                    const createdDate = new Date(currentProject.cree_le);
                    const monthStart = new Date(createdDate.getFullYear(), createdDate.getMonth(), 1);
                    const dayOfMonth = createdDate.getDate();
                    return `Jour ${dayOfMonth} du mois`;
                  })()}
                </span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Position dans la semaine:</span>
                <span className="metadata-value">
                  {(() => {
                    const createdDate = new Date(currentProject.cree_le);
                    const dayOfWeek = createdDate.getDay();
                    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
                    return dayNames[dayOfWeek];
                  })()}
                </span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Position dans la journée:</span>
                <span className="metadata-value">
                  {(() => {
                    const createdDate = new Date(currentProject.cree_le);
                    const hour = createdDate.getHours();
                    const minute = createdDate.getMinutes();
                    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="project-details-modal-footer">
          <button className="project-details-modal-close-btn" onClick={onClose}>
            <X className="w-4 h-4" />
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsModal;
