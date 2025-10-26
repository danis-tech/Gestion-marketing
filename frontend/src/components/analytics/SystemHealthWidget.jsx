import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  Users, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { analyticsService } from '../../services/apiService';
import './SystemHealthWidget.css';

const SystemHealthWidget = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSystemHealth();
    const interval = setInterval(loadSystemHealth, 30000); // Mise à jour toutes les 30 secondes
    return () => clearInterval(interval);
  }, []);

  const loadSystemHealth = async () => {
    try {
      const data = await analyticsService.getCurrentSystemStatus();
      setHealthData(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des données système');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'critical':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <Activity size={16} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'critical':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getUsageColor = (usage) => {
    if (usage >= 90) return 'text-red-500';
    if (usage >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (loading) {
    return (
      <div className="system-health-widget">
        <div className="health-header">
          <Activity size={20} />
          <h3>Santé du Système</h3>
        </div>
        <div className="health-loading">
          <div className="loading-spinner"></div>
          <p>Chargement des métriques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="system-health-widget">
        <div className="health-header">
          <Activity size={20} />
          <h3>Santé du Système</h3>
        </div>
        <div className="health-error">
          <XCircle size={24} className="text-red-500" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const { status, data } = healthData || {};

  return (
    <div className="system-health-widget">
      <div className="health-header">
        <Activity size={20} />
        <h3>Santé du Système</h3>
        <div className="health-status">
          {getStatusIcon(status)}
          <span className={`status-text ${getStatusColor(status)}`}>
            {status === 'healthy' ? 'Opérationnel' : 
             status === 'warning' ? 'Attention' : 
             status === 'critical' ? 'Critique' : 'Inconnu'}
          </span>
        </div>
      </div>

      <div className="health-metrics">
        <div className="metric-row">
          <div className="metric-item">
            <Cpu size={16} />
            <span className="metric-label">CPU</span>
            <span className={`metric-value ${getUsageColor(data?.cpu_usage || 0)}`}>
              {data?.cpu_usage?.toFixed(1) || 0}%
            </span>
          </div>
          <div className="usage-bar">
            <div 
              className="usage-fill cpu"
              style={{ width: `${data?.cpu_usage || 0}%` }}
            ></div>
          </div>
        </div>

        <div className="metric-row">
          <div className="metric-item">
            <MemoryStick size={16} />
            <span className="metric-label">Mémoire</span>
            <span className={`metric-value ${getUsageColor(data?.memory_usage || 0)}`}>
              {data?.memory_usage?.toFixed(1) || 0}%
            </span>
          </div>
          <div className="usage-bar">
            <div 
              className="usage-fill memory"
              style={{ width: `${data?.memory_usage || 0}%` }}
            ></div>
          </div>
        </div>

        <div className="metric-row">
          <div className="metric-item">
            <HardDrive size={16} />
            <span className="metric-label">Disque</span>
            <span className={`metric-value ${getUsageColor(data?.disk_usage || 0)}`}>
              {data?.disk_usage?.toFixed(1) || 0}%
            </span>
          </div>
          <div className="usage-bar">
            <div 
              className="usage-fill disk"
              style={{ width: `${data?.disk_usage || 0}%` }}
            ></div>
          </div>
        </div>

        <div className="metric-row">
          <div className="metric-item">
            <Users size={16} />
            <span className="metric-label">Utilisateurs actifs</span>
            <span className="metric-value text-blue-500">
              {data?.active_users || 0}
            </span>
          </div>
        </div>

        <div className="metric-row">
          <div className="metric-item">
            <Activity size={16} />
            <span className="metric-label">Requêtes</span>
            <span className="metric-value text-purple-500">
              {data?.total_requests || 0}
            </span>
          </div>
        </div>

        <div className="metric-row">
          <div className="metric-item">
            <AlertTriangle size={16} />
            <span className="metric-label">Taux d'erreur</span>
            <span className={`metric-value ${getUsageColor(data?.error_rate || 0)}`}>
              {data?.error_rate?.toFixed(2) || 0}%
            </span>
          </div>
        </div>
      </div>

      <div className="health-footer">
        <span className="last-update">
          Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
        </span>
      </div>
    </div>
  );
};

export default SystemHealthWidget;
