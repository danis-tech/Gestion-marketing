import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  variant = 'primary', 
  text = '', 
  overlay = false,
  fullScreen = false
}) => {
  const spinnerClasses = `loading-spinner ${size} ${variant}`.trim();
  const containerClasses = fullScreen ? 'loading-fullscreen' : (overlay ? 'loading-overlay' : 'loading-container');

  // Si c'est un écran de chargement plein écran, utiliser le design moderne
  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        <div className="modern-loading-content">
          {/* Logo et nom de l'app */}
          <div className="app-brand">
            <div className="app-logo">
              <div className="logo-circle">
                <div className="logo-inner"></div>
              </div>
            </div>
            <h1 className="app-name">Marketges</h1>
            <p className="app-subtitle">Gestion de projets nouvelle génération</p>
          </div>
          
          {/* Spinner moderne */}
          <div className="modern-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          
          {/* Texte de chargement */}
          {text && (
            <div className="loading-message">
              <p className="loading-text">{text}</p>
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Pour les autres cas, utiliser l'ancien design
  return (
    <div className={containerClasses}>
      <div className={spinnerClasses}>
        <div className="spinner"></div>
        {text && <p className="loading-text">{text}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner;
