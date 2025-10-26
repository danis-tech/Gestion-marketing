import React, { useState, useEffect } from 'react';
import analyticsService from '../../services/apiService';
import './DelayMetricsWidget.css';

const DelayMetricsWidget = () => {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDelayMetrics();
  }, []);

  const loadDelayMetrics = async () => {
    try {
      setLoading(true);
      // Charger les vraies données de métriques de retard depuis l'API
      const data = await analyticsService.analytics.getDashboard(30);
      const metrics = [];
      
      // Extraire les métriques de retard des données
      if (data.categories) {
        // Projets en retard
        const overdueProjects = data.categories.projects?.find(m => m.name === 'Projets en retard');
        if (overdueProjects) {
          metrics.push({
            id: 1,
            name: 'Projets en retard',
            value: overdueProjects.value,
            unit: 'projets',
            alert_level: overdueProjects.value > 0 ? 'high' : 'normal',
            description: 'Projets dépassant leur date de fin prévue',
            trend: '+0',
            trend_direction: 'stable'
          });
        }
        
        // Tâches en retard
        const overdueTasks = data.categories.tasks?.find(m => m.name === 'Tâches en retard');
        if (overdueTasks) {
          metrics.push({
            id: 2,
            name: 'Tâches en retard',
            value: overdueTasks.value,
            unit: 'tâches',
            alert_level: overdueTasks.value > 5 ? 'high' : 'normal',
            description: 'Tâches dépassant leur date de fin prévue',
            trend: '+0',
            trend_direction: 'stable'
          });
        }
        
        // Projets à risque
        const atRiskProjects = data.categories.projects?.find(m => m.name === 'Projets à risque');
        if (atRiskProjects) {
          metrics.push({
            id: 3,
            name: 'Projets à risque',
            value: atRiskProjects.value,
            unit: 'projets',
            alert_level: atRiskProjects.value > 0 ? 'medium' : 'normal',
            description: 'Projets se terminant dans les 7 prochains jours',
            trend: '+0',
            trend_direction: 'stable'
          });
        }
        
        // Tâches à risque
        const atRiskTasks = data.categories.tasks?.find(m => m.name === 'Tâches à risque');
        if (atRiskTasks) {
          metrics.push({
            id: 4,
            name: 'Tâches à risque',
            value: atRiskTasks.value,
            unit: 'tâches',
            alert_level: atRiskTasks.value > 0 ? 'medium' : 'normal',
            description: 'Tâches se terminant dans les 3 prochains jours',
            trend: '+0',
            trend_direction: 'stable'
          });
        }
        
        // Documents en attente
        const pendingDocs = data.categories.documents?.find(m => m.name === 'Documents en attente');
        if (pendingDocs) {
          metrics.push({
            id: 5,
            name: 'Documents en attente',
            value: pendingDocs.value,
            unit: 'documents',
            alert_level: pendingDocs.value > 10 ? 'medium' : 'low',
            description: 'Documents en attente de validation',
            trend: '+0',
            trend_direction: 'stable'
          });
        }
      }
      
      setMetrics(metrics);
    } catch (error) {
      console.error('Erreur lors du chargement des métriques de retard:', error);
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  };

  const getAlertLevelClass = (level) => {
    switch (level) {
      case 'high': return 'metric-high';
      case 'medium': return 'metric-medium';
      case 'low': return 'metric-low';
      default: return '';
    }
  };

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'up':
        return (
          <svg className="trend-icon up" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'down':
        return (
          <svg className="trend-icon down" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'stable':
        return (
          <svg className="trend-icon stable" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="delay-metrics-widget">
        <div className="widget-header">
          <h3>Métriques de Retard</h3>
        </div>
        <div className="metrics-loading">
          <div className="loading-spinner"></div>
          <p>Chargement des métriques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="delay-metrics-widget">
      <div className="widget-header">
        <h3>Métriques de Retard</h3>
        <div className="widget-subtitle">
          Surveillance des retards et risques
        </div>
      </div>
      
      <div className="metrics-grid">
        {metrics.map((metric) => (
          <div key={metric.id} className={`metric-card ${getAlertLevelClass(metric.alert_level)}`}>
            <div className="metric-header">
              <div className="metric-title">{metric.name}</div>
              <div className="metric-alert-level">
                {metric.alert_level === 'high' && '🔴'}
                {metric.alert_level === 'medium' && '🟡'}
                {metric.alert_level === 'low' && '🟢'}
              </div>
            </div>
            
            <div className="metric-value">
              <span className="value">{metric.value}</span>
              <span className="unit">{metric.unit}</span>
            </div>
            
            <div className="metric-trend">
              <div className="trend-container">
                {getTrendIcon(metric.trend_direction)}
                <span className={`trend-value ${metric.trend_direction}`}>
                  {metric.trend}
                </span>
              </div>
            </div>
            
            <div className="metric-description">
              {metric.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DelayMetricsWidget;
