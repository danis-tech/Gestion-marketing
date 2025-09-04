import React from 'react';
import { 
  X, 
  Calendar, 
  User, 
  Target, 
  Clock, 
  FileText,
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle,
  Info,
  Edit,
  Target as TargetIcon,
  BarChart3
} from 'lucide-react';
import './TaskDetailsModal.css';

const TaskDetailsModal = ({ task, isOpen, onClose }) => {
  if (!isOpen || !task) return null;

  // Fonction utilitaire pour gérer les valeurs par défaut
  const getFieldValue = (task, field, defaultValue = 'Non défini') => {
    if (!task) return defaultValue;
    
    // Gestion des champs imbriqués (ex: 'projet.code', 'assigne_a.prenom')
    if (field.includes('.')) {
      const parts = field.split('.');
      let value = task;
      
      for (const part of parts) {
        if (value && typeof value === 'object' && value[part] !== undefined) {
          value = value[part];
        } else {
          return defaultValue;
        }
      }
      
      return value !== undefined && value !== null && value !== '' ? value : defaultValue;
    }
    
    // Gestion des champs simples
    const possibleFields = Array.isArray(field) ? field : [field];
    
    for (const f of possibleFields) {
      if (task[f] !== undefined && task[f] !== null && task[f] !== '') {
        return task[f];
      }
    }
    
    return defaultValue;
  };

  // Fonction spéciale pour les objets imbriqués
  const getNestedValue = (obj, path, defaultValue = 'Non défini') => {
    if (!obj) return defaultValue;
    
    const parts = path.split('.');
    let value = obj;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && value[part] !== undefined) {
        value = value[part];
      } else {
        return defaultValue;
      }
    }
    
    return value !== undefined && value !== null && value !== '' ? value : defaultValue;
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
        day: 'numeric'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  // Progression fixée à 0% - à configurer selon tes besoins
  const progress = 0;

  // Fonction pour obtenir le texte du statut
  const getStatusText = (status) => {
    const statusMap = {
      'termine': 'Terminé',
      'en_cours': 'En cours',
      'en_attente': 'En attente',
      'hors_delai': 'Hors délai',
      'rejete': 'Rejeté'
    };
    return statusMap[status] || status;
  };

  // Fonction pour obtenir le texte de la priorité
  const getPriorityText = (priority) => {
    const priorityMap = {
      'haut': 'Haute',
      'moyen': 'Moyenne',
      'intermediaire': 'Intermédiaire',
      'bas': 'Basse'
    };
    return priorityMap[priority] || priority;
  };

  // Fonction pour obtenir le texte de la phase
  const getPhaseText = (phase) => {
    const phaseMap = {
      'conception': 'Conception',
      'build': 'Build',
      'uat': 'UAT',
      'lancement': 'Lancement',
      'suivi': 'Suivi',
      'fin_de_vie': 'Fin de vie'
    };
    return phaseMap[phase] || phase;
  };

  return (
    <div className="task-details-modal-overlay" onClick={onClose}>
      <div className="task-details-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="task-details-modal-header">
          <div className="task-details-modal-title">
            <FileText className="task-details-modal-icon" />
            Détails de la Tâche
          </div>
          <button className="task-details-modal-close" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="task-details-modal-body">
          {/* Informations principales */}
          <div className="task-info-section">
            <div className="task-main-info">
                             <div className="task-header">
                 <div className="task-code-badge">
                   {getNestedValue(task.projet, 'code') || 'N/A'}
                 </div>
              <h2 className="task-title">{getFieldValue(task, 'titre', 'Tâche sans titre')}</h2>
            </div>
               <p className="task-project">Projet: {getNestedValue(task.projet, 'nom') || 'N/A'}</p>
              
              {/* Description */}
              <div className="task-description">
                <label className="description-label">Description</label>
                <p className="description-text">
                  {getFieldValue(task, 'description') || 'Aucune description disponible pour cette tâche.'}
                </p>
              </div>
              </div>
            
                         {/* Assigné à */}
             <div className="assigned-section">
               <div className="assigned-card">
                 <div className="assigned-label">Assigné à</div>
                 <div className="assigned-value">
                   {getFieldValue(task, 'assigne_a.prenom') && getFieldValue(task, 'assigne_a.nom') 
                     ? `${getFieldValue(task, 'assigne_a.prenom')} ${getFieldValue(task, 'assigne_a.nom')}`
                     : getFieldValue(task, 'assigne_a.username', 'Non assigné')
                   }
              </div>
              </div>
            </div>
          </div>

          {/* Classification */}
          <div className="info-section">
            <div className="info-title">
              <Target className="w-5 h-5 text-blue-600" />
              Classification
            </div>
            <div className="info-content">
              <div className="info-grid">
                <div className="info-item">
                  <label className="info-label">Statut</label>
                  <p className="info-value">
                    <span className={`status-badge ${getFieldValue(task, 'statut', '')}`}>
                      {getStatusText(getFieldValue(task, 'statut', ''))}
                    </span>
                  </p>
                </div>
                <div className="info-item">
                  <label className="info-label">Priorité</label>
                  <p className="info-value">
                    <span className={`priority-badge ${getFieldValue(task, 'priorite', '')}`}>
                      {getPriorityText(getFieldValue(task, 'priorite', ''))}
                    </span>
                  </p>
                </div>
                <div className="info-item">
                  <label className="info-label">Phase</label>
                  <p className="info-value">
                    {getPhaseText(getFieldValue(task, 'phase', ''))}
                  </p>
                </div>
                <div className="info-item">
                  <label className="info-label">Tâche Dépendante</label>
                  <p className="info-value">
                    {getFieldValue(task, 'tache_dependante.titre', 'Aucune')}
                  </p>
                </div>
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
                    {formatDate(getFieldValue(task, 'debut'))}
                  </p>
                </div>
                <div className="info-item">
                  <label className="info-label">Date de fin</label>
                  <p className="info-value">
                    {formatDate(getFieldValue(task, 'fin'))}
                  </p>
                </div>
                <div className="info-item">
                  <label className="info-label">Estimation (jours)</label>
                  <p className="info-value">
                    {getFieldValue(task, 'nbr_jour_estimation', 'Non définie')} jours
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

          {/* Métadonnées */}
          <div className="info-section">
            <div className="info-title">
              <Info className="w-5 h-5 text-gray-600" />
              Métadonnées
            </div>
            <div className="info-content">
              <div className="info-grid">
                <div className="info-item">
                  <label className="info-label">Créé le</label>
                  <p className="info-value">
                    {formatDate(getFieldValue(task, 'cree_le'))}
                  </p>
                </div>
                <div className="info-item">
                  <label className="info-label">Mis à jour le</label>
                  <p className="info-value">
                    {formatDate(getFieldValue(task, 'mise_a_jour_le'))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="task-details-modal-footer">
          <button className="task-details-modal-close-btn" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            FERMER
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
