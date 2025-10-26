import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  Calendar, 
  BarChart3, 
  PieChart, 
  LineChart,
  Settings,
  Eye,
  Share2,
  Printer
} from 'lucide-react';
import { analyticsService } from '../../services/apiService';
import './ReportGenerator.css';

const ReportGenerator = ({ onReportGenerated }) => {
  const [reportConfig, setReportConfig] = useState({
    name: '',
    description: '',
    type: 'executive',
    period: '30',
    includeCharts: true,
    chartTypes: ['bar', 'pie', 'line'],
    sections: ['projects', 'users', 'tasks', 'performance']
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const reportTypes = [
    {
      id: 'executive',
      name: 'Rapport Exécutif',
      description: 'Résumé complet pour les décideurs',
      icon: <BarChart3 size={20} />,
      color: 'blue'
    },
    {
      id: 'technical',
      name: 'Rapport Technique',
      description: 'Analyse détaillée des performances',
      icon: <Settings size={20} />,
      color: 'green'
    },
    {
      id: 'users',
      name: 'Rapport Utilisateurs',
      description: 'Analyse de l\'activité utilisateur',
      icon: <PieChart size={20} />,
      color: 'purple'
    },
    {
      id: 'custom',
      name: 'Rapport Personnalisé',
      description: 'Configurez votre propre rapport',
      icon: <FileText size={20} />,
      color: 'orange'
    }
  ];

  const chartTypeOptions = [
    { id: 'bar', name: 'Graphiques en barres', icon: <BarChart3 size={16} /> },
    { id: 'pie', name: 'Graphiques en camembert', icon: <PieChart size={16} /> },
    { id: 'line', name: 'Graphiques linéaires', icon: <LineChart size={16} /> }
  ];

  const sectionOptions = [
    { id: 'projects', name: 'Projets', description: 'Métriques des projets' },
    { id: 'users', name: 'Utilisateurs', description: 'Activité des utilisateurs' },
    { id: 'tasks', name: 'Tâches', description: 'Performance des tâches' },
    { id: 'performance', name: 'Performance', description: 'Métriques de performance' },
    { id: 'documents', name: 'Documents', description: 'Gestion des documents' },
    { id: 'system', name: 'Système', description: 'Santé du système' }
  ];

  const handleGenerateReport = async () => {
    if (!reportConfig.name.trim()) {
      setError('Le nom du rapport est requis');
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const reportData = {
        report_type: reportConfig.type,
        name: reportConfig.name,
        description: reportConfig.description,
        period_days: parseInt(reportConfig.period),
        config: {
          include_charts: reportConfig.includeCharts,
          chart_types: reportConfig.chartTypes,
          sections: reportConfig.sections
        }
      };

      const report = await analyticsService.generateReport(reportData);
      
      if (onReportGenerated) {
        onReportGenerated(report);
      }

      // Afficher un message de succès
      alert('Rapport généré avec succès !');
      
    } catch (err) {
      setError('Erreur lors de la génération du rapport: ' + (err.response?.data?.detail || err.message));
    } finally {
      setGenerating(false);
    }
  };

  const handleChartTypeChange = (chartType) => {
    setReportConfig(prev => ({
      ...prev,
      chartTypes: prev.chartTypes.includes(chartType)
        ? prev.chartTypes.filter(type => type !== chartType)
        : [...prev.chartTypes, chartType]
    }));
  };

  const handleSectionChange = (section) => {
    setReportConfig(prev => ({
      ...prev,
      sections: prev.sections.includes(section)
        ? prev.sections.filter(s => s !== section)
        : [...prev.sections, section]
    }));
  };

  return (
    <div className="report-generator">
      <div className="report-header">
        <h2>Générateur de Rapports</h2>
        <p>Créez des rapports personnalisés avec des graphiques et analyses détaillées</p>
      </div>

      <div className="report-form">
        {/* Informations de base */}
        <div className="form-section">
          <h3>Informations du Rapport</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Nom du rapport *</label>
              <input
                type="text"
                value={reportConfig.name}
                onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Rapport Mensuel - Janvier 2024"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Période (jours)</label>
              <select
                value={reportConfig.period}
                onChange={(e) => setReportConfig(prev => ({ ...prev, period: e.target.value }))}
                className="form-select"
              >
                <option value="7">7 derniers jours</option>
                <option value="30">30 derniers jours</option>
                <option value="90">3 derniers mois</option>
                <option value="365">12 derniers mois</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={reportConfig.description}
              onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description du rapport..."
              rows={3}
              className="form-textarea"
            />
          </div>
        </div>

        {/* Type de rapport */}
        <div className="form-section">
          <h3>Type de Rapport</h3>
          <div className="report-types">
            {reportTypes.map(type => (
              <div
                key={type.id}
                className={`report-type-card ${reportConfig.type === type.id ? 'selected' : ''}`}
                onClick={() => setReportConfig(prev => ({ ...prev, type: type.id }))}
              >
                <div className={`type-icon ${type.color}`}>
                  {type.icon}
                </div>
                <div className="type-content">
                  <h4>{type.name}</h4>
                  <p>{type.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration des graphiques */}
        <div className="form-section">
          <h3>Configuration des Graphiques</h3>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={reportConfig.includeCharts}
                onChange={(e) => setReportConfig(prev => ({ ...prev, includeCharts: e.target.checked }))}
              />
              <span>Inclure des graphiques</span>
            </label>
          </div>
          
          {reportConfig.includeCharts && (
            <div className="chart-types">
              <label>Types de graphiques</label>
              <div className="chart-options">
                {chartTypeOptions.map(option => (
                  <label key={option.id} className="chart-option">
                    <input
                      type="checkbox"
                      checked={reportConfig.chartTypes.includes(option.id)}
                      onChange={() => handleChartTypeChange(option.id)}
                    />
                    <span className="option-icon">{option.icon}</span>
                    <span>{option.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sections à inclure */}
        <div className="form-section">
          <h3>Sections à Inclure</h3>
          <div className="section-options">
            {sectionOptions.map(section => (
              <label key={section.id} className="section-option">
                <input
                  type="checkbox"
                  checked={reportConfig.sections.includes(section.id)}
                  onChange={() => handleSectionChange(section.id)}
                />
                <div className="section-content">
                  <h4>{section.name}</h4>
                  <p>{section.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          {error && (
            <div className="error-message">
              <span>{error}</span>
            </div>
          )}
          
          <div className="action-buttons">
            <button
              onClick={handleGenerateReport}
              disabled={generating || !reportConfig.name.trim()}
              className="btn btn-primary"
            >
              <Download size={16} />
              {generating ? 'Génération...' : 'Générer le Rapport'}
            </button>
            
            <button
              onClick={() => setReportConfig({
                name: '',
                description: '',
                type: 'executive',
                period: '30',
                includeCharts: true,
                chartTypes: ['bar', 'pie', 'line'],
                sections: ['projects', 'users', 'tasks', 'performance']
              })}
              className="btn btn-secondary"
            >
              <Settings size={16} />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
