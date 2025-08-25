import axios from 'axios';
import { API_ENDPOINTS, API_CONFIG_DEFAULT } from '../config/api';
import { getConfig, isDevelopment } from '../config/environment';

// Créer une instance Axios avec la configuration par défaut
const apiClient = axios.create({
  baseURL: getConfig('API_URL'),
  timeout: getConfig('TIMEOUTS.API_REQUEST'),
  headers: API_CONFIG_DEFAULT.headers,
});

// Intercepteur pour ajouter le token d'authentification
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(getConfig('TOKENS.ACCESS_TOKEN_KEY'));
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (isDevelopment()) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config;
  },
  (error) => {
    if (isDevelopment()) {
      console.error('❌ API Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et les erreurs
apiClient.interceptors.response.use(
  (response) => {
    if (isDevelopment()) {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error) => {
    if (isDevelopment()) {
      console.error('❌ API Response Error:', error.response?.status, error.response?.data);
    }
    
    // Gérer les erreurs 401 (non autorisé)
    if (error.response?.status === 401) {
      // Essayer de rafraîchir le token
      const refreshToken = localStorage.getItem(getConfig('TOKENS.REFRESH_TOKEN_KEY'));
      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(API_ENDPOINTS.REFRESH_TOKEN, {
            refresh: refreshToken
          });
          
          const newAccessToken = refreshResponse.data.access;
          localStorage.setItem(getConfig('TOKENS.ACCESS_TOKEN_KEY'), newAccessToken);
          
          // Réessayer la requête originale
          error.config.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(error.config);
        } catch (refreshError) {
          // Le refresh token a expiré, déconnecter l'utilisateur
          localStorage.removeItem(getConfig('TOKENS.ACCESS_TOKEN_KEY'));
          localStorage.removeItem(getConfig('TOKENS.REFRESH_TOKEN_KEY'));
          localStorage.removeItem(getConfig('TOKENS.USER_DATA_KEY'));
          
          // Rediriger vers la page de connexion
          window.location.href = getConfig('ROUTES.LOGIN');
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Service d'authentification
export const authService = {
  // Connexion
  login: async (credentials) => {
    const response = await apiClient.post(API_ENDPOINTS.LOGIN, credentials);
    return response.data;
  },
  
  // Inscription
  signup: async (userData) => {
    const response = await apiClient.post(API_ENDPOINTS.SIGNUP, userData);
    return response.data;
  },
  
  // Déconnexion
  logout: async () => {
    const refreshToken = localStorage.getItem(getConfig('TOKENS.REFRESH_TOKEN_KEY'));
    if (refreshToken) {
      try {
        await apiClient.post(API_ENDPOINTS.LOGOUT, { refresh: refreshToken });
      } catch (error) {
        // Ignorer les erreurs de déconnexion
      }
    }
    
    // Nettoyer le localStorage
    localStorage.removeItem(getConfig('TOKENS.ACCESS_TOKEN_KEY'));
    localStorage.removeItem(getConfig('TOKENS.REFRESH_TOKEN_KEY'));
    localStorage.removeItem(getConfig('TOKENS.USER_DATA_KEY'));
  },
  
  // Récupérer les informations de l'utilisateur connecté
  getMe: async () => {
    const response = await apiClient.get(API_ENDPOINTS.ME);
    return response.data;
  },
  
  // Demande de réinitialisation de mot de passe
  requestPasswordReset: async (email) => {
    const response = await apiClient.post(API_ENDPOINTS.PASSWORD_RESET_REQUEST, { email });
    return response.data;
  },
  
  // Confirmation de réinitialisation de mot de passe
  confirmPasswordReset: async (uidb64, token, newPassword) => {
    const response = await apiClient.post(API_ENDPOINTS.PASSWORD_RESET_CONFIRM, {
      uidb64,
      token,
      new_password: newPassword
    });
    return response.data;
  },
};

// Service des utilisateurs
export const userService = {
  // Liste des utilisateurs
  getUsers: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.USERS_LIST, { params });
    return response.data;
  },
  
  // Détails d'un utilisateur
  getUser: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.USER_DETAIL(id));
    return response.data;
  },
  
  // Créer un utilisateur
  createUser: async (userData) => {
    const response = await apiClient.post(API_ENDPOINTS.USERS_LIST, userData);
    return response.data;
  },
  
  // Mettre à jour un utilisateur
  updateUser: async (id, userData) => {
    const response = await apiClient.put(API_ENDPOINTS.USER_DETAIL(id), userData);
    return response.data;
  },
  
  // Supprimer un utilisateur
  deleteUser: async (id) => {
    const response = await apiClient.delete(API_ENDPOINTS.USER_DETAIL(id));
    return response.data;
  },
  
  // Changer le mot de passe d'un utilisateur
  setUserPassword: async (id, passwordData) => {
    const response = await apiClient.post(API_ENDPOINTS.USER_SET_PASSWORD(id), passwordData);
    return response.data;
  },
};

// Service des rôles
export const roleService = {
  getRoles: async () => {
    const response = await apiClient.get(API_ENDPOINTS.ROLES_LIST);
    return response.data;
  },
  
  getRole: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.ROLE_DETAIL(id));
    return response.data;
  },
};

// Service des permissions
export const permissionService = {
  getPermissions: async () => {
    const response = await apiClient.get(API_ENDPOINTS.PERMISSIONS_LIST);
    return response.data;
  },
  
  getPermission: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.PERMISSION_DETAIL(id));
    return response.data;
  },
};

// Service des services
export const serviceService = {
  getServices: async () => {
    const response = await apiClient.get(API_ENDPOINTS.SERVICES_LIST);
    return response.data;
  },
  
  getService: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.SERVICE_DETAIL(id));
    return response.data;
  },
};

// Export de l'instance Axios pour les cas spéciaux
export { apiClient };

export default {
  auth: authService,
  users: userService,
  roles: roleService,
  permissions: permissionService,
  services: serviceService,
};
