// Configuration de l'API
const API_CONFIG = {
  // URL de base de l'API
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  
  // Préfixe de l'API
  API_PREFIX: '/api',
  
  // Endpoints d'authentification
  AUTH: {
    LOGIN: '/accounts/login/',
    SIGNUP: '/accounts/signup/',
    REFRESH_TOKEN: '/accounts/refresh/',
    LOGOUT: '/accounts/logout/',
    ME: '/accounts/me/',
    PASSWORD_RESET_REQUEST: '/accounts/password-reset-request/',
    PASSWORD_RESET_CONFIRM: '/accounts/password-reset-confirm/',
  },
  
  // Endpoints utilisateurs
  USERS: {
    LIST: '/accounts/users/',
    DETAIL: (id) => `/accounts/users/${id}/`,
    SET_PASSWORD: (id) => `/accounts/users/${id}/set_password/`,
  },
  
  // Endpoints des rôles
  ROLES: {
    LIST: '/accounts/roles/',
    DETAIL: (id) => `/accounts/roles/${id}/`,
  },
  
  // Endpoints des permissions
  PERMISSIONS: {
    LIST: '/accounts/permissions/',
    DETAIL: (id) => `/accounts/permissions/${id}/`,
  },
  
  // Endpoints des services
  SERVICES: {
    LIST: '/accounts/services/',
    DETAIL: (id) => `/accounts/services/${id}/`,
  },
  
  // Endpoints des rôles-permissions
  ROLE_PERMISSIONS: {
    LIST: '/accounts/role-permissions/',
    DETAIL: (id) => `/accounts/role-permissions/${id}/`,
  },
};

// Fonction utilitaire pour construire les URLs complètes
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}${endpoint}`;
};

// Fonction utilitaire pour construire les URLs avec paramètres
export const buildApiUrlWithParams = (endpoint, params = {}) => {
  let url = buildApiUrl(endpoint);
  
  // Ajouter les paramètres de requête
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value);
    }
  });
  
  if (queryParams.toString()) {
    url += `?${queryParams.toString()}`;
  }
  
  return url;
};

// Export des endpoints prêts à l'emploi
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: buildApiUrl(API_CONFIG.AUTH.LOGIN),
  SIGNUP: buildApiUrl(API_CONFIG.AUTH.SIGNUP),
  REFRESH_TOKEN: buildApiUrl(API_CONFIG.AUTH.REFRESH_TOKEN),
  LOGOUT: buildApiUrl(API_CONFIG.AUTH.LOGOUT),
  ME: buildApiUrl(API_CONFIG.AUTH.ME),
  PASSWORD_RESET_REQUEST: buildApiUrl(API_CONFIG.AUTH.PASSWORD_RESET_REQUEST),
  PASSWORD_RESET_CONFIRM: buildApiUrl(API_CONFIG.AUTH.PASSWORD_RESET_CONFIRM),
  
  // User endpoints
  USERS_LIST: buildApiUrl(API_CONFIG.USERS.LIST),
  USER_DETAIL: (id) => buildApiUrl(API_CONFIG.USERS.DETAIL(id)),
  USER_SET_PASSWORD: (id) => buildApiUrl(API_CONFIG.USERS.SET_PASSWORD(id)),
  
  // Role endpoints
  ROLES_LIST: buildApiUrl(API_CONFIG.ROLES.LIST),
  ROLE_DETAIL: (id) => buildApiUrl(API_CONFIG.ROLES.DETAIL(id)),
  
  // Permission endpoints
  PERMISSIONS_LIST: buildApiUrl(API_CONFIG.PERMISSIONS.LIST),
  PERMISSION_DETAIL: (id) => buildApiUrl(API_CONFIG.PERMISSIONS.DETAIL(id)),
  
  // Service endpoints
  SERVICES_LIST: buildApiUrl(API_CONFIG.SERVICES.LIST),
  SERVICE_DETAIL: (id) => buildApiUrl(API_CONFIG.SERVICES.DETAIL(id)),
  
  // Role-Permission endpoints
  ROLE_PERMISSIONS_LIST: buildApiUrl(API_CONFIG.ROLE_PERMISSIONS.LIST),
  ROLE_PERMISSION_DETAIL: (id) => buildApiUrl(API_CONFIG.ROLE_PERMISSIONS.DETAIL(id)),
};

// Configuration par défaut pour Axios
export const API_CONFIG_DEFAULT = {
  timeout: 10000, // 10 secondes
  headers: {
    'Content-Type': 'application/json',
  },
};

export default API_CONFIG;
