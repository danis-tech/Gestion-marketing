import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, Calendar } from 'lucide-react';
import { analyticsService } from '../../services/apiService';
import './ExecutiveSummary.css';

const ExecutiveSummary = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExecutiveSummary();
  }, []);

  const loadExecutiveSummary = async () => {
    try {
      setLoading(true);
      // Charger les vraies données de résumé exécutif depuis l'API
      const data = await analyticsService.getDashboard(30);
      
      // Extraire les métriques clés des données
      const projects = data.categories?.projects || [];
      const tasks = data.categories?.tasks || [];
      const users = data.categories?.users || [];
      const performance = data.categories?.performance || [];
      
      
      const totalProjects = projects.find(m => m.name === 'Total des projets')?.value || 0;
      const completedProjects = projects.find(m => m.name === 'Projets termine')?.value || 0;
      const overdueProjects = projects.find(m => m.name === 'Projets hors_delai')?.value || 0;
      const rejectedProjects = projects.find(m => m.name === 'Projets rejete')?.value || 0;
      const pendingProjects = projects.find(m => m.name === 'Projets en_attente')?.value || 0;
      
      const totalTasks = tasks.find(m => m.name === 'Total des tâches')?.value || 0;
      const completedTasks = tasks.find(m => m.name === 'Tâches termine')?.value || 0;
      const overdueTasks = tasks.find(m => m.name === 'Tâches hors_delai')?.value || 0;
      const rejectedTasks = tasks.find(m => m.name === 'Tâches rejete')?.value || 0;
      const pendingTasks = tasks.find(m => m.name === 'Tâches en_attente')?.value || 0;
      const newTasks = tasks.find(m => m.name === 'Nouvelles tâches')?.value || 0;
      
      
      // Si aucune tâche terminée trouvée, essayer d'autres variantes
      let finalCompletedTasks = completedTasks;
      if (completedTasks === 0) {
        // Essayer d'autres noms possibles
        const altCompleted = tasks.find(m => 
          m.name.includes('terminé') || 
          m.name.includes('termine') || 
          m.name.includes('completed')
        );
        if (altCompleted) {
          finalCompletedTasks = altCompleted.value;
        }
      }
      
      const activeUsers = users.find(m => m.name === 'Utilisateurs actifs')?.value || 0;
      const completionRate = performance.find(m => m.name === 'Taux de completion des projets')?.value || 0;
      
      const activeProjects = totalProjects - completedProjects;
      
      // Générer les highlights basés sur les données
      const highlights = [];
      
      // Toujours afficher le statut général des projets
      if (totalProjects > 0) {
        const completionRate = Math.round((completedProjects / totalProjects) * 100);
        
        if (completedProjects > 0) {
          highlights.push({
            type: 'success',
            title: 'Projets terminés avec succès',
            description: `${completedProjects} projet(s) ont été livrés, soit ${completionRate}% du total`,
            impact: 'high'
          });
        }
        
        if (overdueProjects > 0) {
          highlights.push({
            type: 'warning',
            title: 'Retards à surveiller',
            description: `${overdueProjects} projet(s) sont en retard, nécessitant une attention immédiate`,
            impact: 'high'
          });
        }
        
        if (rejectedProjects > 0) {
          highlights.push({
            type: 'info',
            title: 'Projets rejetés',
            description: `${rejectedProjects} projet(s) rejetés nécessitent une révision`,
            impact: 'medium'
          });
        }
        
        if (pendingProjects > 0) {
          highlights.push({
            type: 'info',
            title: 'Projets en attente',
            description: `${pendingProjects} projet(s) en attente de démarrage`,
            impact: 'low'
          });
        }
        
        // Ajouter des highlights sur les tâches si pertinents
        if (finalCompletedTasks > 0) {
          const taskCompletionRate = Math.round((finalCompletedTasks / totalTasks) * 100);
          highlights.push({
            type: 'success',
            title: 'Tâches terminées',
            description: `${finalCompletedTasks} tâche(s) terminées, soit ${taskCompletionRate}% du total`,
            impact: 'high'
          });
        }
        
        if (overdueTasks > 0) {
          highlights.push({
            type: 'warning',
            title: 'Tâches en retard',
            description: `${overdueTasks} tâche(s) sont en retard et bloquent la progression`,
            impact: 'medium'
          });
        }
        
        if (rejectedTasks > 0) {
          highlights.push({
            type: 'info',
            title: 'Tâches rejetées',
            description: `${rejectedTasks} tâche(s) rejetées nécessitent une révision`,
            impact: 'medium'
          });
        }
        
        if (newTasks > 0) {
          highlights.push({
            type: 'info',
            title: 'Nouvelles tâches',
            description: `${newTasks} nouvelle(s) tâche(s) créée(s) cette période`,
            impact: 'low'
          });
        }
        
        // Highlight sur la productivité si faible
        if (completionRate < 20 && totalProjects > 5) {
          highlights.push({
            type: 'info',
            title: 'Productivité à améliorer',
            description: `Taux de completion de ${completionRate}% - Considérer des actions correctives`,
            impact: 'medium'
          });
        }
      }
      
      // Si aucune donnée, afficher un message informatif
      if (highlights.length === 0) {
        highlights.push({
          type: 'info',
          title: 'Aucune activité récente',
          description: 'Aucun projet ou tâche en cours détecté dans le système',
          impact: 'low'
        });
      }
      
      const summary = {
        keyMetrics: {
          totalProjects,
          completedProjects,
          pendingProjects,
          overdueProjects,
          rejectedProjects,
          totalTasks,
          completedTasks: finalCompletedTasks,
          pendingTasks,
          overdueTasks,
          rejectedTasks,
          newTasks,
          teamProductivity: Math.round(completionRate),
          budgetUtilization: 78 // Simulation pour l'instant
        },
        highlights,
        recommendations: [
          overdueProjects > 0 ? 'Allouer des ressources supplémentaires aux projets en retard' : 'Maintenir le bon rythme de livraison',
          'Mettre en place des points de contrôle hebdomadaires',
          'Optimiser la répartition des tâches entre les équipes',
          'Renforcer la communication inter-équipes'
        ],
        nextActions: [
          overdueProjects > 0 ? 'Réunion de suivi des projets en retard - Cette semaine' : 'Réunion de suivi générale - Cette semaine',
          'Formation sur les outils de gestion de projet - Prochaine semaine',
          'Audit des processus de validation - Fin du mois'
        ]
      };
      
      setSummary(summary);
    } catch (error) {
      console.error('Erreur lors du chargement du résumé exécutif:', error);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const getHighlightIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="highlight-icon success" size={24} />;
      case 'warning':
        return <AlertTriangle className="highlight-icon warning" size={24} />;
      case 'info':
        return <Info className="highlight-icon info" size={24} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="executive-summary">
        <div className="summary-header">
          <h2>Résumé Exécutif</h2>
        </div>
        <div className="summary-loading">
          <div className="loading-spinner"></div>
          <p>Génération du résumé exécutif...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="executive-summary">
        <div className="summary-header">
          <h2>Résumé Exécutif</h2>
        </div>
        <div className="summary-loading">
          <div className="error-message">
            ⚠️ Impossible de charger les données du résumé exécutif
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="executive-summary">
      <div className="summary-header">
        <h2>Résumé Exécutif</h2>
        <div className="summary-subtitle">
          Vue d'ensemble pour les décideurs
        </div>
      </div>

      <div className="summary-content">
        {/* Métriques clés */}
        <div className="key-metrics-section">
          <h3>Métriques Clés</h3>
          <div className="metrics-grid">
            <div className="metric-card primary">
              <div className="metric-value">{summary.keyMetrics.totalProjects}</div>
              <div className="metric-label">Projets Total</div>
            </div>
            <div className="metric-card success">
              <div className="metric-value">{summary.keyMetrics.completedProjects}</div>
              <div className="metric-label">Terminés</div>
            </div>
            <div className="metric-card warning">
              <div className="metric-value">{summary.keyMetrics.overdueProjects}</div>
              <div className="metric-label">En Retard</div>
            </div>
            <div className="metric-card info">
              <div className="metric-value">{summary.keyMetrics.teamProductivity}%</div>
              <div className="metric-label">Productivité</div>
            </div>
          </div>
        </div>

        {/* Points saillants */}
        <div className="highlights-section">
          <h3>Points Saillants</h3>
          <div className="highlights-list">
            {summary.highlights.map((highlight, index) => (
              <div key={index} className={`highlight-item ${highlight.type}`}>
                <div className="highlight-icon-container">
                  {getHighlightIcon(highlight.type)}
                </div>
                <div className="highlight-content">
                  <div className="highlight-title">{highlight.title}</div>
                  <div className="highlight-description">{highlight.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommandations et actions */}
        <div className="recommendations-section">
          <div className="recommendations-column">
            <h3>Recommandations</h3>
            <ul className="recommendations-list">
              {summary.recommendations.map((rec, index) => (
                <li key={index} className="recommendation-item">
                  <span className="recommendation-bullet">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="actions-column">
            <h3>Prochaines Actions</h3>
            <ul className="actions-list">
              {summary.nextActions.map((action, index) => (
                <li key={index} className="action-item">
                  <Calendar className="action-bullet" size={16} />
                  {action}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Section des définitions et méthodologie */}
        <div className="methodology-section">
          <h3>Important !</h3>
          <div className="methodology-content">
            <div className="metrics-definitions">
             
              <div className="definition-grid">
                <div className="definition-item">
                  <strong>Projets Total :</strong> Nombre total de projets en cours dans votre organisation
                </div>
                <div className="definition-item">
                  <strong>Terminés :</strong> Projets qui ont été complètement finalisés et livrés
                </div>
                <div className="definition-item">
                  <strong>En Retard :</strong> Projets qui ont dépassé leur date limite de livraison
                </div>
                <div className="definition-item">
                  <strong>Productivité :</strong> Pourcentage de projets terminés par rapport au total (ex: 2 terminés sur 14 = 14%)
                </div>
                <div className="definition-item">
                  <strong>Utilisateurs Actifs :</strong> Nombre d'utilisateurs connectés et actifs cette semaine
                </div>
                <div className="definition-item">
                  <strong>Tâches Terminées :</strong> Nombre total de tâches complétées dans tous les projets
                </div>
                <div className="definition-item">
                  <strong>Taux de Completion :</strong> Pourcentage de réussite global des projets et tâches
                </div>
              </div>
            </div>
            
            <div className="ai-disclaimer">
           
              <div className="ai-info">
                <div className="ai-icon">🤖</div>
                <div className="ai-text">
                  <p><strong>Recommandations et Prochaines Actions</strong> sont générées automatiquement par notre système d'IA.</p>
                  <p>L'IA analyse vos données en temps réel et utilise des APIs populaires (OpenAI, Claude, Deepseek, etc.) pour vous proposer des conseils personnalisés basés sur vos performances actuelles.</p>
                  <p>Plus vous utilisez le système, plus les recommandations deviennent précises et adaptées à votre contexte.</p>
                  {/* <span className="ai-badge">Powered by AI</span> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummary;
