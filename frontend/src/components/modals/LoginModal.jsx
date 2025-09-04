import React, { useState } from 'react';
import { authService } from '../../services/apiService';
import { getConfig } from '../../config/environment';
import LoadingSpinner from '../ui/LoadingSpinner';
import './LoginModal.css';

const LoginModal = ({ 
  isOpen, 
  onClose, 
  onLogin, 
  onLoginError, 
  onPasswordResetSuccess, 
  onPasswordResetError 
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember_me: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordResetRequested, setIsPasswordResetRequested] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      return;
    }

    setIsLoading(true);

    try {
      const data = await authService.login(formData);
      
      // Stocker les tokens en utilisant les clés de configuration
      localStorage.setItem(getConfig('TOKENS.ACCESS_TOKEN_KEY'), data.access);
      localStorage.setItem(getConfig('TOKENS.REFRESH_TOKEN_KEY'), data.refresh);
      localStorage.setItem(getConfig('TOKENS.USER_DATA_KEY'), JSON.stringify(data.user));
      
      onLogin(data);
    } catch (error) {
      console.error('Erreur de connexion:', error);
      
      let errorMessage = 'Erreur lors de la connexion.';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.email) {
        errorMessage = error.response.data.email[0];
      } else if (error.response?.data?.password) {
        errorMessage = error.response.data.password[0];
      }
      
      // Appeler le callback d'erreur
      if (onLoginError) {
        onLoginError(new Error(errorMessage));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (!resetEmail) {
      return;
    }

    setIsResetLoading(true);

    try {
      await authService.requestPasswordReset(resetEmail);
      setIsPasswordResetRequested(false);
      setResetEmail('');
      
      // Appeler le callback de succès
      if (onPasswordResetSuccess) {
        onPasswordResetSuccess();
      }
    } catch (error) {
      console.error('Erreur réinitialisation:', error);
      
      let errorMessage = 'Erreur lors de l\'envoi de l\'email de réinitialisation.';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.email) {
        errorMessage = error.response.data.email[0];
      }
      
      // Appeler le callback d'erreur
      if (onPasswordResetError) {
        onPasswordResetError(new Error(errorMessage));
      }
    } finally {
      setIsResetLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Connexion</h2>
          <button className="modal-close" onClick={onClose}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!isPasswordResetRequested ? (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <svg className="form-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                Adresse email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="votre@email.com"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <svg className="form-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Mot de passe
              </label>
              <div className="input-wrapper password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
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

            <div className="form-options">
              <label className="checkbox-wrapper">
                <input
                  type="checkbox"
                  name="remember_me"
                  checked={formData.remember_me}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                <span className="checkmark"></span>
                Se souvenir de moi
              </label>
              
              <button
                type="button"
                className="forgot-password-link"
                onClick={() => setIsPasswordResetRequested(true)}
                disabled={isLoading}
              >
                Mot de passe oublié ?
              </button>
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="button-loading">
                  <LoadingSpinner size="small" variant="white" />
                  <span>Connexion...</span>
                </div>
              ) : (
                <>
                  <svg className="submit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Se connecter
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordReset} className="password-reset-form">
            <div className="reset-header">
              <h3>Mot de passe oublié</h3>
              <p>Entrez votre adresse email pour recevoir un lien de réinitialisation.</p>
            </div>

            <div className="form-group">
              <label htmlFor="reset-email" className="form-label">
                <svg className="form-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                Adresse email
              </label>
              <input
                type="email"
                id="reset-email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className="form-input"
                placeholder="votre@email.com"
                disabled={isResetLoading}
              />
            </div>

            <div className="reset-actions">
              <button
                type="button"
                className="back-button"
                onClick={() => {
                  setIsPasswordResetRequested(false);
                  setResetEmail('');
                }}
                disabled={isResetLoading}
              >
                Retour
              </button>
              
              <button
                type="submit"
                className="submit-button"
                disabled={isResetLoading}
              >
                {isResetLoading ? (
                  <div className="button-loading">
                    <LoadingSpinner size="small" variant="white" />
                    <span>Envoi...</span>
                  </div>
                ) : (
                  <>
                    <svg className="submit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Envoyer
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
