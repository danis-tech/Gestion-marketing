import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginModal from './components/modals/LoginModal';
import PasswordResetPage from './components/pages/PasswordResetPage';
import Dashboard from './components/layout/Dashboard';
import LoadingSpinner from './components/ui/LoadingSpinner';
import NotificationModal from './components/modals/NotificationModal';
import useNotification from './hooks/useNotification';


import { 
  Users, 
  Target, 
  TrendingUp, 
  Zap, 
  Globe, 
  Rocket,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import './App.css';
import './styles/themes.css';
import moovLogo from './assets/img/logo.png';
import Button from './components/ui/Button';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { notification, showSuccess, showError, showInfo, hideNotification } = useNotification();

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté au chargement
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
        showSuccess('Connexion réussie', 'Bienvenue ! Vous êtes connecté.');
      } catch (error) {
        console.error('Erreur lors du parsing des données utilisateur:', error);
        localStorage.removeItem('user_data');
        showError('Erreur de session', 'Votre session a expiré. Veuillez vous reconnecter.');
      }
    }
    
    // Durée minimale de 2 secondes pour l'écran de chargement
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [showSuccess, showError]);

  const handleLogin = (loginData) => {
    setUser(loginData.user);
    setIsModalOpen(false);
    showSuccess('Connexion réussie', `Bienvenue ${loginData.user.prenom || loginData.user.username} !`);
  };

  const handleLoginError = (error) => {
    showError('Erreur de connexion', error.message);
  };

  const handlePasswordResetSuccess = () => {
    showSuccess('Email envoyé', 'Un email de réinitialisation a été envoyé à votre adresse email.');
  };

  const handlePasswordResetError = (error) => {
    showError('Erreur d\'envoi', error.message);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    showInfo('Déconnexion', 'Vous avez été déconnecté avec succès.');
  };

  if (isLoading) {
    return (
      <LoadingSpinner 
        fullScreen={true}
        size="large"
        text="Chargement de l'application..."
      />
    );
  }

  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Route pour la page de réinitialisation de mot de passe */}
          <Route 
            path="/password-reset-confirm/:uidb64/:token" 
            element={<PasswordResetPage />} 
          />
          
          {/* Route pour le dashboard (utilisateur connecté) */}
          <Route 
            path="/dashboard/*" 
            element={
              user ? (
                <Dashboard user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          
          {/* Route principale (page d'accueil) */}
          <Route 
            path="/" 
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <div className="main-content">
                  {/* Left Panel - Modern Design (2/3 width) */}
                  <div className="left-panel">
                    <div className="left-content">
                      {/* Main Content Block */}
                      <div className="main-content-block">
                        {/* Main Icon - First Position */}
                        <div className="main-icon-section">
                          <Users className="main-icon" />
                        </div>
                        
                        {/* App Name */}
                        <div className="app-name">
                          <h1>Bienvenue sur</h1>
                          <h2>Marketges</h2>
                          <p className="app-subtitle">
                            La plateforme de gestion de projets nouvelle génération
                          </p>
                        </div>
                        
                        {/* Quote */}
                        <div className="quote-section">
                          <p className="quote-text">
                            "L'innovation et la collaboration sont les moteurs du succès dans le monde numérique d'aujourd'hui."
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Panel - Information (1/3 width) */}
                  <div className="right-panel">
                    {/* Logo */}
                    <div className="logo">
                      <img src={moovLogo} alt="Moov Africa" className="logo-image" />
                    </div>

                    {/* Title */}
                    <h1 className="title">Marketges</h1>

                    {/* Slogan */}
                    <p className="slogan">Gérez les projets efficacement et facilement !</p>

                    {/* Call to Action Button */}
                    <Button 
                      variant="primary" 
                      size="large"
                      onClick={() => setIsModalOpen(true)}
                    >
                      Se Connecter
                    </Button>

                    {/* Decorative curve */}
                    <div className="decorative-curve"></div>
                  </div>
                </div>
              )
            } 
          />
        </Routes>

        <LoginModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          onLogin={handleLogin}
          onLoginError={handleLoginError}
          onPasswordResetSuccess={handlePasswordResetSuccess}
          onPasswordResetError={handlePasswordResetError}
        />

        {/* Notification Modal */}
        <NotificationModal
          isOpen={notification.isOpen}
          onClose={hideNotification}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          autoClose={notification.autoClose}
          autoCloseDelay={notification.autoCloseDelay}
          showCloseButton={notification.showCloseButton}
          actions={notification.actions}
        />
      </div>


    </Router>
  );
}

export default App;
