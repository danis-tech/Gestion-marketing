import React from 'react';
import { 
  X, 
  TrendingUp, 
  CheckCircle, 
  Users, 
  Clock,
  AlertTriangle,
  BarChart3,
  PieChart
} from 'lucide-react';
import './StatsModal.css';

/**
 * Modal pour afficher les détails des statistiques
 * @param {Object} props - Les propriétés du composant
 * @param {boolean} props.isOpen - État d'ouverture du modal
 * @param {Function} props.onClose - Fonction de fermeture
 * @param {Object} props.statsData - Données des statistiques
 * @param {string} props.title - Titre du modal
 * @param {string} props.type - Type de statistiques ('projects', 'tasks', 'users')
 */
const StatsModal = ({ isOpen, onClose, statsData, title, type }) => {
  if (!isOpen) return null;

  const getIconForType = (type) => {
    switch (type) {
      case 'projects':
        return <TrendingUp className="stats-modal-icon" />;
      case 'tasks':
        return <CheckCircle className="stats-modal-icon" />;
      case 'users':
        return <Users className="stats-modal-icon" />;
      default:
        return <BarChart3 className="stats-modal-icon" />;
    }
  };

  const renderProjectsStats = () => (
    <div>
      {/* Statistiques principales */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-value">{statsData.total_projets || 0}</div>
          <div className="stat-card-label">Total Projets</div>
          <div className="stat-card-description">Tous les projets créés</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{statsData.projets_par_statut?.termine || 0}</div>
          <div className="stat-card-label">Terminés</div>
          <div className="stat-card-description">Projets achevés avec succès</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{statsData.projets_par_statut?.en_cours || 0}</div>
          <div className="stat-card-label">En Cours</div>
          <div className="stat-card-description">Projets actuellement en développement</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{statsData.projets_par_statut?.en_attente || 0}</div>
          <div className="stat-card-label">En Attente</div>
          <div className="stat-card-description">Projets en attente de démarrage</div>
        </div>
      </div>

      {/* Taux de réussite */}
      <div className="success-rate-section">
        <div className="success-rate-title">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Taux de Réussite
        </div>
        <div className="success-rate-value">
          {statsData.total_projets > 0 
            ? Math.round((statsData.projets_par_statut?.termine / statsData.total_projets) * 100)
            : 0}%
        </div>
        <div className="success-rate-description">
          {statsData.projets_par_statut?.termine || 0} projets terminés sur {statsData.total_projets || 0} au total
        </div>
      </div>

      {/* Par statut */}
      {statsData.projets_par_statut && (
        <div className="progress-section">
          <div className="progress-title">
            <PieChart className="w-5 h-5" />
            Répartition par Statut
          </div>
          {Object.entries(statsData.projets_par_statut).map(([statut, count]) => (
            <div key={statut} className="progress-item">
              <span className="progress-label capitalize">{statut.replace('_', ' ')}</span>
              <span className="progress-value">{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Par priorité */}
      {statsData.projets_par_priorite && (
        <div className="breakdown-section">
          <div className="breakdown-title">
            <BarChart3 className="w-5 h-5" />
            Par Priorité
          </div>
          <div className="breakdown-grid">
            {Object.entries(statsData.projets_par_priorite).map(([priorite, count]) => (
              <div key={priorite} className="breakdown-item">
                <div className="breakdown-item-label capitalize">{priorite}</div>
                <div className="breakdown-item-value">{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderTasksStats = () => (
    <div>
      {/* Statistiques principales */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-value">{statsData.total_taches || 0}</div>
          <div className="stat-card-label">Total Tâches</div>
          <div className="stat-card-description">Toutes les tâches assignées</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{statsData.taches_terminees || 0}</div>
          <div className="stat-card-label">Terminées</div>
          <div className="stat-card-description">Tâches accomplies avec succès</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{statsData.taches_en_retard || 0}</div>
          <div className="stat-card-label">En Retard</div>
          <div className="stat-card-description">Tâches dépassant la date limite</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{statsData.taux_completion?.toFixed(1) || 0}%</div>
          <div className="stat-card-label">Taux Completion</div>
          <div className="stat-card-description">Pourcentage de tâches terminées</div>
        </div>
      </div>

             {/* Performance des tâches */}
       <div className="performance-section">
         <div className="performance-title">
           <TrendingUp className="w-5 h-5 text-orange-500" />
           Performance des Tâches
         </div>
        <div className="performance-grid">
          <div className="performance-item">
            <div className="performance-label">Tâches en cours</div>
            <div className="performance-value">{statsData.par_statut?.en_cours || 0}</div>
            <div className="performance-description">Actuellement en développement</div>
          </div>
          <div className="performance-item">
            <div className="performance-label">Tâches en attente</div>
            <div className="performance-value">{statsData.par_statut?.en_attente || 0}</div>
            <div className="performance-description">En attente de démarrage</div>
          </div>
        </div>
      </div>

      {/* Par statut */}
      {statsData.par_statut && (
        <div className="progress-section">
          <div className="progress-title">
            <PieChart className="w-5 h-5" />
            Répartition par Statut
          </div>
          {Object.entries(statsData.par_statut).map(([statut, count]) => (
            <div key={statut} className="progress-item">
              <span className="progress-label capitalize">{statut.replace('_', ' ')}</span>
              <span className="progress-value">{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Par priorité */}
      {statsData.par_priorite && (
        <div className="breakdown-section">
          <div className="breakdown-title">
            <BarChart3 className="w-5 h-5" />
            Par Priorité
          </div>
          <div className="breakdown-grid">
            {Object.entries(statsData.par_priorite).map(([priorite, count]) => (
              <div key={priorite} className="breakdown-item">
                <div className="breakdown-item-label capitalize">{priorite}</div>
                <div className="breakdown-item-value">{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Par phase */}
      {statsData.par_phase && (
        <div className="breakdown-section">
          <div className="breakdown-title">
            <Clock className="w-5 h-5" />
            Par Phase
          </div>
          <div className="breakdown-grid">
            {Object.entries(statsData.par_phase).map(([phase, count]) => (
              <div key={phase} className="breakdown-item">
                <div className="breakdown-item-label capitalize">{phase.replace('_', ' ')}</div>
                <div className="breakdown-item-value">{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderUsersStats = () => (
    <div>
      {/* Statistiques principales */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-value">{statsData.total_users || 0}</div>
          <div className="stat-card-label">Total Utilisateurs</div>
          <div className="stat-card-description">Tous les utilisateurs actifs</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{statsData.online_users || 0}</div>
          <div className="stat-card-label">En Ligne</div>
          <div className="stat-card-description">Connectés aujourd'hui</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{statsData.active_this_week || 0}</div>
          <div className="stat-card-label">Cette Semaine</div>
          <div className="stat-card-description">Actifs ces 7 derniers jours</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{statsData.active_this_month || 0}</div>
          <div className="stat-card-label">Ce Mois</div>
          <div className="stat-card-description">Actifs ces 30 derniers jours</div>
        </div>
      </div>

      {/* Engagement des utilisateurs */}
      <div className="engagement-section">
        <div className="engagement-title">
          <Users className="w-5 h-5 text-purple-500" />
          Engagement des Utilisateurs
        </div>
        <div className="engagement-grid">
          <div className="engagement-item">
            <div className="engagement-label">Taux de présence</div>
            <div className="engagement-value">
              {statsData.total_users > 0 ? Math.round((statsData.online_users / statsData.total_users) * 100) : 0}%
            </div>
            <div className="engagement-description">Utilisateurs connectés aujourd'hui</div>
          </div>
          <div className="engagement-item">
            <div className="engagement-label">Engagement hebdomadaire</div>
            <div className="engagement-value">
              {statsData.total_users > 0 ? Math.round((statsData.active_this_week / statsData.total_users) * 100) : 0}%
            </div>
            <div className="engagement-description">Utilisateurs actifs cette semaine</div>
          </div>
        </div>
      </div>

      {/* Taux d'activité */}
      <div className="progress-section">
        <div className="progress-title">
          <TrendingUp className="w-5 h-5" />
          Taux d'Activité
        </div>
        <div className="progress-item">
          <span className="progress-label">Aujourd'hui</span>
          <span className="progress-value">
            {statsData.total_users > 0 ? Math.round((statsData.online_users / statsData.total_users) * 100) : 0}%
          </span>
        </div>
        <div className="progress-item">
          <span className="progress-label">Cette semaine</span>
          <span className="progress-value">
            {statsData.total_users > 0 ? Math.round((statsData.active_this_week / statsData.total_users) * 100) : 0}%
          </span>
        </div>
        <div className="progress-item">
          <span className="progress-label">Ce mois</span>
          <span className="progress-value">
            {statsData.total_users > 0 ? Math.round((statsData.active_this_month / statsData.total_users) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Par rôle */}
      {statsData.par_role && Object.keys(statsData.par_role).length > 0 && (
        <div className="breakdown-section">
          <div className="breakdown-title">
            <Users className="w-5 h-5" />
            Par Rôle
          </div>
          <div className="breakdown-grid">
            {Object.entries(statsData.par_role).map(([role, count]) => (
              <div key={role} className="breakdown-item">
                <div className="breakdown-item-label capitalize">{role}</div>
                <div className="breakdown-item-value">{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Par service */}
      {statsData.par_service && Object.keys(statsData.par_service).length > 0 && (
        <div className="breakdown-section">
          <div className="breakdown-title">
            <BarChart3 className="w-5 h-5" />
            Par Service
          </div>
          <div className="breakdown-grid">
            {Object.entries(statsData.par_service).map(([service, count]) => (
              <div key={service} className="breakdown-item">
                <div className="breakdown-item-label capitalize">{service}</div>
                <div className="breakdown-item-value">{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dernière mise à jour */}
      {statsData.derniere_mise_a_jour && (
        <div className="last-updated">
          Dernière mise à jour : {new Date(statsData.derniere_mise_a_jour).toLocaleString('fr-FR')}
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (type) {
      case 'projects':
        return renderProjectsStats();
      case 'tasks':
        return renderTasksStats();
      case 'users':
        return renderUsersStats();
      default:
        return (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucune donnée disponible</p>
          </div>
        );
    }
  };

  return (
    <div className="stats-modal-overlay" onClick={onClose}>
      <div className="stats-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="stats-modal-header">
          <div className="stats-modal-title">
            {getIconForType(type)}
            {title}
          </div>
          <button className="stats-modal-close" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="stats-modal-body">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="stats-modal-footer">
          <button className="stats-modal-close-btn" onClick={onClose}>
            <X className="w-4 h-4" />
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatsModal;