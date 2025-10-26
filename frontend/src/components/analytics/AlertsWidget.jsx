import React, { useState, useEffect } from 'react';
import analyticsService from '../../services/apiService';
import './AlertsWidget.css';

const AlertsWidget = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      // Charger les vraies données d'alertes depuis l'API
      const data = await analyticsService.analytics.getDashboard(30);
      const alerts = [];
      
      // Extraire les alertes des métriques
      if (data.categories) {
        // Projets en retard
        const overdueProjects = data.categories.projects?.find(m => m.name === 'Projets en retard');
        if (overdueProjects && overdueProjects.value > 0) {
          alerts.push({
            id: 1,
            type: 'overdue_project',
            title: 'Projets en retard',
            message: `${overdueProjects.value} projet(s) dépassent leur date de fin prévue`,
            severity: 'high',
            date: new Date().toISOString().split('T')[0],
            count: overdueProjects.value
          });
        }
        
        // Tâches en retard
        const overdueTasks = data.categories.tasks?.find(m => m.name === 'Tâches en retard');
        if (overdueTasks && overdueTasks.value > 0) {
          alerts.push({
            id: 2,
            type: 'overdue_task',
            title: 'Tâches en retard',
            message: `${overdueTasks.value} tâche(s) dépassent leur date de fin prévue`,
            severity: overdueTasks.value > 5 ? 'high' : 'medium',
            date: new Date().toISOString().split('T')[0],
            count: overdueTasks.value
          });
        }
        
        // Projets à risque
        const atRiskProjects = data.categories.projects?.find(m => m.name === 'Projets à risque');
        if (atRiskProjects && atRiskProjects.value > 0) {
          alerts.push({
            id: 3,
            type: 'at_risk_project',
            title: 'Projets à risque',
            message: `${atRiskProjects.value} projet(s) se terminent dans les 7 prochains jours`,
            severity: 'medium',
            date: new Date().toISOString().split('T')[0],
            count: atRiskProjects.value
          });
        }
        
        // Documents en attente
        const pendingDocs = data.categories.documents?.find(m => m.name === 'Documents en attente');
        if (pendingDocs && pendingDocs.value > 0) {
          alerts.push({
            id: 4,
            type: 'pending_document',
            title: 'Documents en attente',
            message: `${pendingDocs.value} document(s) attendent validation`,
            severity: pendingDocs.value > 10 ? 'medium' : 'low',
            date: new Date().toISOString().split('T')[0],
            count: pendingDocs.value
          });
        }
      }
      
      setAlerts(alerts);
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return (
          <svg className="alert-icon high" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="alert-icon medium" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'low':
        return (
          <svg className="alert-icon low" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'high': return 'alert-high';
      case 'medium': return 'alert-medium';
      case 'low': return 'alert-low';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="alerts-widget">
        <div className="alerts-header">
          <h3>Alertes & Retards</h3>
        </div>
        <div className="alerts-loading">
          <div className="loading-spinner"></div>
          <p>Chargement des alertes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="alerts-widget">
      <div className="alerts-header">
        <h3>Alertes & Retards</h3>
        <div className="alerts-count">
          {alerts.length} alertes
        </div>
      </div>
      
      <div className="alerts-list">
        {alerts.length === 0 ? (
          <div className="no-alerts">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p>Aucune alerte en cours</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className={`alert-item ${getSeverityClass(alert.severity)}`}>
              <div className="alert-icon-container">
                {getSeverityIcon(alert.severity)}
              </div>
              <div className="alert-content">
                <div className="alert-title">
                  {alert.title}
                  {alert.count > 1 && (
                    <span className="alert-count">({alert.count})</span>
                  )}
                </div>
                <div className="alert-message">{alert.message}</div>
                <div className="alert-date">
                  {new Date(alert.date).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsWidget;
