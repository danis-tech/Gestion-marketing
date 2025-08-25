import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/apiService';
import { getConfig } from '../../config/environment';
import LoadingSpinner from '../ui/LoadingSpinner';
import NotificationModal from '../modals/NotificationModal';
import moovLogo from '../../assets/img/logo.png';
import './PasswordResetPage.css';

const PasswordResetPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notification, setNotification] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  // Récupérer le token depuis l'URL
  const getTokenFromUrl = () => {
    const pathParts = window.location.pathname.split('/');
    // L'URL est maintenant: /password-reset-confirm/{uidb64}/{token}/
    // Donc uidb64 est à l'index 2 et token à l'index 3
    const uidb64 = pathParts[2];
    const token = pathParts[3];
    
    if (uidb64 && token) {
      return {
        uidb64: uidb64,
        token: token
      };
    }
    return null;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const showNotification = (type, title, message) => {
    setNotification({
      isOpen: true,
      type,
      title,
      message
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.new_password !== formData.confirm_password) {
      showNotification('error', 'Erreur de validation', 'Les mots de passe ne correspondent pas.');
      return;
    }

    if (formData.new_password.length < 8) {
      showNotification('error', 'Erreur de validation', 'Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    const tokenData = getTokenFromUrl();
    if (!tokenData) {
      showNotification('error', 'Token invalide', 'Le lien de réinitialisation n\'est pas valide.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await authService.confirmPasswordReset(tokenData.uidb64, tokenData.token, formData.new_password);
      showNotification('success', 'Succès', data.detail);
      setFormData({ new_password: '', confirm_password: '' });
      
      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      console.error('Erreur réinitialisation:', error);
      
      let errorMessage = 'Erreur lors de la réinitialisation du mot de passe.';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.request) {
        errorMessage = getConfig('MESSAGES.NETWORK_ERROR');
      } else {
        errorMessage = getConfig('MESSAGES.DEFAULT_ERROR');
      }
      
      showNotification('error', 'Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="password-reset-page">
      <div className="password-reset-container">
        {/* Loading Overlay */}
        {isLoading && (
          <LoadingSpinner 
            overlay={true}
            size="medium"
            text="Réinitialisation en cours..."
          />
        )}

        {/* Header */}
        <div className="password-reset-header">
          <div className="logo-section">
            <img src={moovLogo} alt="Moov Africa" className="logo" />
            <h1 className="title">Réinitialisation du mot de passe</h1>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="password-reset-form">
          <div className="form-group">
            <label htmlFor="new_password" className="form-label">
              <svg className="form-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Nouveau mot de passe
            </label>
            <div className="input-wrapper password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="new_password"
                name="new_password"
                value={formData.new_password}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="••••••••"
                minLength="8"
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePasswordVisibility('password')}
                disabled={isLoading}
              >
                {showPassword ? (
                  <svg className="eye-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="eye-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirm_password" className="form-label">
              <svg className="form-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Confirmer le mot de passe
            </label>
            <div className="input-wrapper password-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirm_password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="••••••••"
                minLength="8"
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePasswordVisibility('confirm')}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <svg className="eye-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="eye-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="button-loading">
                <LoadingSpinner size="small" variant="white" />
                <span>Réinitialisation...</span>
              </div>
            ) : (
              <>
                <svg className="submit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Réinitialiser le mot de passe
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="password-reset-footer">
          <p className="footer-text">
            Retourner à la{' '}
            <a href="/" className="footer-link">
              page de connexion
            </a>
          </p>
        </div>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={hideNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        autoClose={notification.type === 'success'}
        autoCloseDelay={notification.type === 'success' ? 3000 : 5000}
        actions={notification.type === 'success' ? [
          {
            label: 'Aller à la connexion',
            variant: 'primary',
            onClick: () => navigate('/')
          }
        ] : []}
      />
    </div>
  );
};

export default PasswordResetPage;
