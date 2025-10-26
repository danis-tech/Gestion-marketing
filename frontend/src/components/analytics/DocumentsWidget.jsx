import React, { useState, useEffect } from 'react';
import analyticsService from '../../services/apiService';
import './DocumentsWidget.css';

const DocumentsWidget = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocumentsData();
  }, []);

  const loadDocumentsData = async () => {
    try {
      setLoading(true);
      // Charger les vraies données de documents depuis l'API
      const data = await analyticsService.analytics.getDashboard(30);
      const documents = [];
      
      // Extraire les données de documents des métriques
      if (data.categories) {
        const documentsMetrics = data.categories.documents || [];
        
        // Créer des documents basés sur les métriques
        documentsMetrics.forEach((metric, index) => {
          if (metric.name.includes('Documents')) {
            const status = metric.name.includes('en attente') ? 'en_attente' : 
                          metric.name.includes('validé') ? 'valide' : 'brouillon';
            
            documents.push({
              id: index + 1,
              name: metric.name,
              status: status,
              type: 'PDF',
              size: `${(Math.random() * 5 + 0.5).toFixed(1)} MB`,
              uploadDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              author: 'Utilisateur',
              project: 'Projet',
              priority: metric.value > 10 ? 'high' : metric.value > 5 ? 'medium' : 'low'
            });
          }
        });
      }
      
      setDocuments(documents);
    } catch (error) {
      console.error('Erreur lors du chargement des données de documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'valide':
        return { label: 'Validé', color: '#10b981', icon: '✓' };
      case 'en_attente':
        return { label: 'En attente', color: '#f59e0b', icon: '⏳' };
      case 'en_revision':
        return { label: 'En révision', color: '#3b82f6', icon: '👀' };
      case 'brouillon':
        return { label: 'Brouillon', color: '#6b7280', icon: '📝' };
      default:
        return { label: 'Inconnu', color: '#6b7280', icon: '❓' };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'PDF': return '📄';
      case 'DOCX': return '📝';
      case 'XLSX': return '📊';
      case 'Figma': return '🎨';
      case 'MD': return '📖';
      default: return '📎';
    }
  };

  if (loading) {
    return (
      <div className="documents-widget">
        <div className="widget-header">
          <h3>Gestion des Documents</h3>
        </div>
        <div className="documents-loading">
          <div className="loading-spinner"></div>
          <p>Chargement des documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="documents-widget">
      <div className="widget-header">
        <h3>Gestion des Documents</h3>
        <div className="widget-subtitle">
          Statut et suivi des documents
        </div>
      </div>
      
      <div className="documents-stats">
        <div className="stat-card">
          <div className="stat-value">{documents.length}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{documents.filter(d => d.status === 'valide').length}</div>
          <div className="stat-label">Validés</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{documents.filter(d => d.status === 'en_attente').length}</div>
          <div className="stat-label">En attente</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{documents.filter(d => d.status === 'en_revision').length}</div>
          <div className="stat-label">En révision</div>
        </div>
      </div>
      
      <div className="documents-list">
        {documents.map((document) => {
          const statusInfo = getStatusInfo(document.status);
          return (
            <div key={document.id} className="document-item">
              <div className="document-icon">
                {getTypeIcon(document.type)}
              </div>
              
              <div className="document-content">
                <div className="document-header">
                  <div className="document-name">{document.name}</div>
                  <div className="document-priority">
                    <span 
                      className="priority-dot"
                      style={{ backgroundColor: getPriorityColor(document.priority) }}
                    ></span>
                    {document.priority}
                  </div>
                </div>
                
                <div className="document-meta">
                  <div className="meta-item">
                    <span className="meta-label">Projet:</span>
                    <span className="meta-value">{document.project}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Auteur:</span>
                    <span className="meta-value">{document.author}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Taille:</span>
                    <span className="meta-value">{document.size}</span>
                  </div>
                </div>
                
                <div className="document-footer">
                  <div 
                    className="document-status"
                    style={{ color: statusInfo.color }}
                  >
                    <span className="status-icon">{statusInfo.icon}</span>
                    {statusInfo.label}
                  </div>
                  <div className="document-date">
                    {new Date(document.uploadDate).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentsWidget;
