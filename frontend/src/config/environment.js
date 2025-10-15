// Configuration des variables d'environnement
const ENV_CONFIG = {
  // Environnement
  NODE_ENV: import.meta.env.MODE || 'development',
  
  // API
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  
  // Application
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Gestion Marketing',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Fonctionnalités
  FEATURES: {
    DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',
    ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    ENABLE_NOTIFICATIONS: import.meta.env.VITE_ENABLE_NOTIFICATIONS !== 'false',
  },
  
  // Configuration des tokens
  TOKENS: {
    ACCESS_TOKEN_KEY: import.meta.env.VITE_ACCESS_TOKEN_KEY || 'access_token',
    REFRESH_TOKEN_KEY: import.meta.env.VITE_REFRESH_TOKEN_KEY || 'refresh_token',
    USER_DATA_KEY: import.meta.env.VITE_USER_DATA_KEY || 'user_data',
  },
  
  // Configuration des timeouts
  TIMEOUTS: {
    API_REQUEST: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000, // Increased from 10s to 30s
    SESSION_TIMEOUT: parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 3600000, // 1 heure
    REFRESH_TOKEN_BEFORE_EXPIRY: parseInt(import.meta.env.VITE_REFRESH_TOKEN_BEFORE_EXPIRY) || 300000, // 5 minutes
  },
  
  // Configuration des routes
  ROUTES: {
    HOME: '/',
    LOGIN: '/', // Page d'accueil avec modal de connexion
    DASHBOARD: '/dashboard',
    PROFILE: '/profile',
    PASSWORD_RESET: '/password-reset',
  },
  
  // Configuration des messages
  MESSAGES: {
    DEFAULT_ERROR: 'Une erreur est survenue. Veuillez réessayer.',
    NETWORK_ERROR: 'Erreur de connexion au serveur.',
    SESSION_EXPIRED: 'Votre session a expiré. Veuillez vous reconnecter.',
    UNAUTHORIZED: 'Vous n\'êtes pas autorisé à accéder à cette ressource.',
  },
};

// Fonction pour vérifier si on est en mode développement
export const isDevelopment = () => ENV_CONFIG.NODE_ENV === 'development';

// Fonction pour vérifier si on est en mode production
export const isProduction = () => ENV_CONFIG.NODE_ENV === 'production';

// Fonction pour obtenir une configuration
export const getConfig = (key, defaultValue = null) => {
  const keys = key.split('.');
  let value = ENV_CONFIG;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return defaultValue;
    }
  }
  
  return value;
};

// Fonction pour logger les configurations (uniquement en développement)
export const logConfig = () => {
  if (isDevelopment()) {
    console.log('🔧 Configuration de l\'environnement:', ENV_CONFIG);
  }
};

export default ENV_CONFIG;
