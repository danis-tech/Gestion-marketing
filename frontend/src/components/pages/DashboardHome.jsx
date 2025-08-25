import React from 'react';
import './DashboardHome.css';

const DashboardHome = ({ user }) => {
  return (
    <div className="dashboard-home">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Bienvenue, {user?.prenom || user?.username || 'Utilisateur'} !</h1>
          <p>Gérez vos projets marketing efficacement avec Marketges</p>
        </div>
        <div className="user-info">
          <div className="user-avatar">
            {user?.photo_url ? (
              <img src={user.photo_url} alt="Avatar" />
            ) : (
              <div className="avatar-placeholder">
                {(user?.prenom?.[0] || user?.username?.[0] || 'U').toUpperCase()}
              </div>
            )}
          </div>
          <div className="user-details">
            <span className="user-name">{user?.prenom} {user?.nom}</span>
            <span className="user-role">{user?.role?.nom || 'Utilisateur'}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon projects">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div className="stat-content">
            <h3>Projets Actifs</h3>
            <p className="stat-number">12</p>
            <p className="stat-change positive">+3 ce mois</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon tasks">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div className="stat-content">
            <h3>Tâches en Cours</h3>
            <p className="stat-number">48</p>
            <p className="stat-change positive">+8 cette semaine</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon completed">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-content">
            <h3>Projets Terminés</h3>
            <p className="stat-number">156</p>
            <p className="stat-change positive">+12 ce trimestre</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon team">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <div className="stat-content">
            <h3>Équipe</h3>
            <p className="stat-number">24</p>
            <p className="stat-change neutral">Stable</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content-grid">
        <div className="content-card recent-projects">
          <div className="card-header">
            <h2>Projets Récents</h2>
            <button className="view-all-btn">Voir tout</button>
          </div>
          <div className="card-content">
            <div className="project-item">
              <div className="project-info">
                <h4>Campagne Marketing Q4</h4>
                <p>Campagne publicitaire pour les fêtes de fin d'année</p>
              </div>
              <div className="project-status in-progress">
                <span>En cours</span>
              </div>
            </div>
            <div className="project-item">
              <div className="project-info">
                <h4>Refonte Site Web</h4>
                <p>Modernisation de l'interface utilisateur</p>
              </div>
              <div className="project-status completed">
                <span>Terminé</span>
              </div>
            </div>
            <div className="project-item">
              <div className="project-info">
                <h4>Stratégie Réseaux Sociaux</h4>
                <p>Plan de communication sur les réseaux sociaux</p>
              </div>
              <div className="project-status pending">
                <span>En attente</span>
              </div>
            </div>
          </div>
        </div>

        <div className="content-card quick-actions">
          <div className="card-header">
            <h2>Actions Rapides</h2>
          </div>
          <div className="card-content">
            <div className="action-grid">
              <button className="action-btn">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Nouveau Projet</span>
              </button>
              <button className="action-btn">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>Nouvelle Tâche</span>
              </button>
              <button className="action-btn">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
                <span>Importer Document</span>
              </button>
              <button className="action-btn">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Planifier Réunion</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
