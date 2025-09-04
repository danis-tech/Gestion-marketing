import React from 'react';
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
import './ProjectDetailsModal.css';

const ProjectDetailsModal = ({ project, isOpen, onClose }) => {
  if (!isOpen || !project) return null;

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
    if (!budget || budget === 0) return 'Non défini';
    return budget.toLocaleString('fr-FR') + ' FCFA';
  };

  // Calcul de la progression (si dates disponibles)
  const calculateProgress = () => {
    const startDate = getFieldValue(project, ['debut', 'date_debut', 'cree_le']);
    const endDate = getFieldValue(project, ['fin', 'date_fin']);
    
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
              <h2 className="project-name">{getFieldValue(project, 'nom', 'Projet sans nom')}</h2>
              <p className="project-code">Code: {getFieldValue(project, 'code', 'N/A')}</p>
            </div>
            
            {/* Statistiques principales */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-card-value">{getFieldValue(project, 'nombre_membres', '0')}</div>
                <div className="stat-card-label">Membres</div>
                <div className="stat-card-description">Équipe du projet</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-value">{getFieldValue(project, 'estimation_jours', '0')}</div>
                <div className="stat-card-label">Jours Estimés</div>
                <div className="stat-card-description">Durée prévue</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-value">{progress}%</div>
                <div className="stat-card-label">Progression</div>
                <div className="stat-card-description">Avancement actuel</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-value">{formatBudget(getFieldValue(project, 'budget'))}</div>
                <div className="stat-card-label">Budget</div>
                <div className="stat-card-description">Allocation financière</div>
              </div>
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
                  {getFieldValue(project, 'description', 'Aucune description disponible')}
                </p>
              </div>
              <div className="info-item">
                <label className="info-label">Objectif</label>
                <p className="info-value">
                  {getFieldValue(project, 'objectif', 'Aucun objectif défini')}
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
                    {formatDate(getFieldValue(project, ['debut', 'date_debut', 'cree_le']))}
                  </p>
                </div>
                <div className="info-item">
                  <label className="info-label">Date de fin</label>
                  <p className="info-value">
                    {formatDate(getFieldValue(project, ['fin', 'date_fin']))}
                  </p>
                </div>
                <div className="info-item">
                  <label className="info-label">Estimation (jours)</label>
                  <p className="info-value">
                    {getFieldValue(project, 'estimation_jours', 'Non définie')} jours
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
                  <label className="info-label">Chef de projet</label>
                  <p className="info-value">
                    {getFieldValue(project, ['chef_projet', 'nom_createur', 'proprietaire.username'], 'Non défini')}
                  </p>
                </div>
                <div className="info-item">
                  <label className="info-label">Service</label>
                  <p className="info-value">
                    {getFieldValue(project, ['service', 'type'], 'Non défini')}
                  </p>
                </div>
                <div className="info-item">
                  <label className="info-label">Nombre de membres</label>
                  <p className="info-value">
                    {getFieldValue(project, 'nombre_membres', '0')} membre(s)
                  </p>
                </div>
                <div className="info-item">
                  <label className="info-label">Créateur</label>
                  <p className="info-value">
                    {getFieldValue(project, 'nom_createur', 'Non défini')}
                  </p>
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
                <span className={`status-badge status-${getFieldValue(project, ['statut', 'etat'], 'default').toLowerCase()}`}>
                  {getFieldValue(project, ['statut', 'etat'], 'Non défini')}
                </span>
              </div>
              <div className="status-item">
                <label className="status-label">Priorité</label>
                <span className={`priority-badge priority-${getFieldValue(project, 'priorite', 'default').toLowerCase()}`}>
                  {getFieldValue(project, 'priorite', 'Non définie')}
                </span>
              </div>
              <div className="status-item">
                <label className="status-label">État</label>
                <span className={`state-badge state-${getFieldValue(project, 'etat', 'off').toLowerCase()}`}>
                  {getFieldValue(project, 'etat') === 'On' ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          </div>

          {/* Métadonnées */}
          <div className="metadata-section">
            <div className="info-title">
              <Clock className="w-5 h-5 text-gray-600" />
              Métadonnées
            </div>
            <div className="metadata-grid">
              <div className="metadata-item">
                <span className="metadata-label">Créé le:</span>
                <span className="metadata-value">
                  {formatDate(getFieldValue(project, 'cree_le'))}
                </span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Mis à jour le:</span>
                <span className="metadata-value">
                  {formatDate(getFieldValue(project, 'mis_a_jour_le'))}
                </span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">ID:</span>
                <span className="metadata-value">{project.id}</span>
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
