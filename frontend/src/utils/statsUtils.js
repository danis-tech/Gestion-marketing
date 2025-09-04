/**
 * Utilitaires pour les calculs de statistiques
 */

/**
 * Calcule le pourcentage de progression
 * @param {number} completed - Nombre d'éléments terminés
 * @param {number} total - Nombre total d'éléments
 * @returns {number} Pourcentage de progression
 */
export const calculateProgress = (completed, total) => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

/**
 * Détermine le statut de santé basé sur les métriques
 * @param {Object} metrics - Objet contenant les métriques
 * @returns {string} Statut de santé ('excellent', 'good', 'warning', 'critical')
 */
export const getHealthStatus = (metrics) => {
  const { completionRate, overdueCount, totalCount } = metrics;
  
  if (overdueCount > 0) return 'critical';
  if (completionRate >= 80) return 'excellent';
  if (completionRate >= 60) return 'good';
  if (completionRate >= 40) return 'warning';
  return 'critical';
};

/**
 * Formate les nombres pour l'affichage
 * @param {number} number - Nombre à formater
 * @returns {string} Nombre formaté
 */
export const formatNumber = (number) => {
  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  }
  if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  }
  return number.toString();
};

/**
 * Calcule la tendance (croissance/décroissance)
 * @param {number} current - Valeur actuelle
 * @param {number} previous - Valeur précédente
 * @returns {Object} Objet contenant la tendance et le pourcentage
 */
export const calculateTrend = (current, previous) => {
  if (previous === 0) {
    return { trend: 'neutral', percentage: 0 };
  }
  
  const percentage = ((current - previous) / previous) * 100;
  
  if (percentage > 5) {
    return { trend: 'positive', percentage: Math.abs(percentage) };
  } else if (percentage < -5) {
    return { trend: 'negative', percentage: Math.abs(percentage) };
  } else {
    return { trend: 'neutral', percentage: Math.abs(percentage) };
  }
};

/**
 * Génère des données de graphique basées sur les statistiques
 * @param {Object} stats - Statistiques de base
 * @param {string} type - Type de graphique ('line', 'bar', 'area')
 * @returns {Array} Données pour le graphique
 */
export const generateChartData = (stats, type = 'line') => {
  const { total, completed, inProgress, pending } = stats;
  
  switch (type) {
    case 'line':
      return [
        { x: 0, y: 0 },
        { x: 1, y: pending || 0 },
        { x: 2, y: (pending || 0) + (inProgress || 0) },
        { x: 3, y: total || 0 },
        { x: 4, y: completed || 0 }
      ];
    
    case 'bar':
      return [
        { label: 'En attente', value: pending || 0 },
        { label: 'En cours', value: inProgress || 0 },
        { label: 'Terminé', value: completed || 0 }
      ];
    
    default:
      return [pending || 0, inProgress || 0, completed || 0];
  }
};

/**
 * Calcule les couleurs dynamiques basées sur les performances
 * @param {number} performance - Score de performance (0-100)
 * @returns {Object} Objet contenant les couleurs
 */
export const getPerformanceColors = (performance) => {
  if (performance >= 80) {
    return {
      primary: '#10b981',
      secondary: '#059669',
      background: 'rgba(16, 185, 129, 0.1)',
      text: '#065f46'
    };
  } else if (performance >= 60) {
    return {
      primary: '#f59e0b',
      secondary: '#d97706',
      background: 'rgba(245, 158, 11, 0.1)',
      text: '#92400e'
    };
  } else if (performance >= 40) {
    return {
      primary: '#ef4444',
      secondary: '#dc2626',
      background: 'rgba(239, 68, 68, 0.1)',
      text: '#991b1b'
    };
  } else {
    return {
      primary: '#6b7280',
      secondary: '#4b5563',
      background: 'rgba(107, 114, 128, 0.1)',
      text: '#374151'
    };
  }
};

/**
 * Valide les données de statistiques
 * @param {Object} data - Données à valider
 * @returns {boolean} True si les données sont valides
 */
export const validateStatsData = (data) => {
  if (!data || typeof data !== 'object') return false;
  
  const requiredFields = ['total', 'completed'];
  return requiredFields.every(field => 
    data.hasOwnProperty(field) && typeof data[field] === 'number' && data[field] >= 0
  );
};

/**
 * Calcule les statistiques agrégées
 * @param {Array} items - Liste d'éléments
 * @param {string} groupBy - Champ pour grouper
 * @returns {Object} Statistiques agrégées
 */
export const aggregateStats = (items, groupBy = 'status') => {
  const aggregated = {};
  
  items.forEach(item => {
    const key = item[groupBy] || 'unknown';
    aggregated[key] = (aggregated[key] || 0) + 1;
  });
  
  return aggregated;
};
