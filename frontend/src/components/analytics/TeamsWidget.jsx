import React, { useState, useEffect } from 'react';
import analyticsService from '../../services/apiService';
import './TeamsWidget.css';

const TeamsWidget = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamsData();
  }, []);

  const loadTeamsData = async () => {
    try {
      setLoading(true);
      // Charger les vraies données d'équipes depuis l'API
      const data = await analyticsService.analytics.getDashboard(30);
      const teams = [];
      
      // Extraire les données d'équipes des métriques
      if (data.categories) {
        const users = data.categories.users || [];
        const projects = data.categories.projects || [];
        
        // Récupérer les équipes (services) et leurs métriques
        const teamMetrics = users.filter(m => m.name.includes('Membres -'));
        
        teamMetrics.forEach((team, index) => {
          const teamName = team.metadata?.team || team.name.replace('Membres - ', '');
          const members = team.value;
          
          // Calculer la productivité basée sur les projets actifs
          const activeProjects = projects.find(p => p.metadata?.owner === teamName)?.value || 0;
          const productivity = members > 0 ? Math.min((activeProjects / members) * 100, 100) : 0;
          
          teams.push({
            id: index + 1,
            name: teamName,
            members: members,
            activeProjects: activeProjects,
            completedProjects: Math.floor(Math.random() * 10) + 5, // Simulation pour l'instant
            productivity: Math.round(productivity),
            color: `hsl(${index * 60}, 70%, 50%)`
          });
        });
      }
      
      setTeams(teams);
    } catch (error) {
      console.error('Erreur lors du chargement des données d\'équipes:', error);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const getProductivityColor = (productivity) => {
    if (productivity >= 90) return '#10b981';
    if (productivity >= 80) return '#3b82f6';
    if (productivity >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const getProductivityLabel = (productivity) => {
    if (productivity >= 90) return 'Excellent';
    if (productivity >= 80) return 'Très bon';
    if (productivity >= 70) return 'Bon';
    return 'À améliorer';
  };

  if (loading) {
    return (
      <div className="teams-widget">
        <div className="widget-header">
          <h3>Performance des Équipes</h3>
        </div>
        <div className="teams-loading">
          <div className="loading-spinner"></div>
          <p>Chargement des données d'équipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="teams-widget">
      <div className="widget-header">
        <h3>Performance des Équipes</h3>
        <div className="widget-subtitle">
          Vue d'ensemble des performances par équipe
        </div>
      </div>
      
      <div className="teams-grid">
        {teams.map((team) => (
          <div key={team.id} className="team-card">
            <div className="team-header">
              <div className="team-name" style={{ color: team.color }}>
                {team.name}
              </div>
              <div className="team-members">
                {team.members} membres
              </div>
            </div>
            
            <div className="team-metrics">
              <div className="metric-row">
                <div className="metric-label">Projets actifs</div>
                <div className="metric-value">{team.activeProjects}</div>
              </div>
              
              <div className="metric-row">
                <div className="metric-label">Projets terminés</div>
                <div className="metric-value">{team.completedProjects}</div>
              </div>
              
              <div className="metric-row">
                <div className="metric-label">Productivité</div>
                <div className="metric-value-container">
                  <div className="metric-value">{team.productivity}%</div>
                  <div 
                    className="productivity-label"
                    style={{ color: getProductivityColor(team.productivity) }}
                  >
                    {getProductivityLabel(team.productivity)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="team-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${team.productivity}%`,
                    backgroundColor: getProductivityColor(team.productivity)
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamsWidget;
