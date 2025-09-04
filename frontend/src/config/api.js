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
    STATS: '/accounts/users/stats/',
  },
  
  // Endpoints des rôles
  ROLES: {
    LIST: '/accounts/roles/',
    DETAIL: (id) => `/accounts/roles/${id}/`,
    PERMISSIONS: (id) => `/accounts/roles/${id}/permissions/`,
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
  
  // Endpoints des projets
  PROJECTS: {
    LIST: '/projects/',
    DETAIL: (id) => `/projects/${id}/`,
    STATS: '/projects/stats/',
    UPDATE_STATUS: (id) => `/projects/${id}/update_statut/`,
    
    // Membres de projet
    MEMBERS: {
      LIST: (projectId) => `/projects/${projectId}/membres/`,
      DETAIL: (projectId, memberId) => `/projects/${projectId}/membres/${memberId}/`,
    },
    
    // Permissions de projet
    PERMISSIONS: {
      LIST: (projectId) => `/projects/${projectId}/permissions/`,
      DETAIL: (projectId, permissionId) => `/projects/${projectId}/permissions/${permissionId}/`,
      USER_PERMISSIONS: (projectId) => `/projects/${projectId}/permissions/utilisateur-permissions/`,
      GRANT_MULTIPLE: (projectId) => `/projects/${projectId}/permissions/accorder-multiple/`,
    },
    
    // Historique de projet
    HISTORY: {
      LIST: (projectId) => `/projects/${projectId}/historiques/`,
      DETAIL: (projectId, historyId) => `/projects/${projectId}/historiques/${historyId}/`,
    },
  },
  
  // Endpoints des tâches
  TASKS: {
    LIST: '/taches/',
    DETAIL: (id) => `/taches/${id}/`,
    STATS: '/taches/stats/',
    UPDATE_STATUS: (id) => `/taches/${id}/update_statut/`,
    PROJECT_TASKS: (projectId) => `/taches/projet_taches/?projet_id=${projectId}`,
    MY_TASKS: '/taches/mes_taches/',
    OVERDUE_TASKS: '/taches/en_retard/',
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
  USER_STATS: buildApiUrl(API_CONFIG.USERS.STATS),
  
  // Role endpoints
  ROLES_LIST: buildApiUrl(API_CONFIG.ROLES.LIST),
  ROLE_DETAIL: (id) => buildApiUrl(API_CONFIG.ROLES.DETAIL(id)),
  ROLE_PERMISSIONS: (id) => buildApiUrl(API_CONFIG.ROLES.PERMISSIONS(id)),
  
  // Permission endpoints
  PERMISSIONS_LIST: buildApiUrl(API_CONFIG.PERMISSIONS.LIST),
  PERMISSION_DETAIL: (id) => buildApiUrl(API_CONFIG.PERMISSIONS.DETAIL(id)),
  
  // Service endpoints
  SERVICES_LIST: buildApiUrl(API_CONFIG.SERVICES.LIST),
  SERVICE_DETAIL: (id) => buildApiUrl(API_CONFIG.SERVICES.DETAIL(id)),
  
  // Role-Permission endpoints
  ROLE_PERMISSIONS_LIST: buildApiUrl(API_CONFIG.ROLE_PERMISSIONS.LIST),
  ROLE_PERMISSION_DETAIL: (id) => buildApiUrl(API_CONFIG.ROLE_PERMISSIONS.DETAIL(id)),
  
  // Project endpoints
  PROJECTS_LIST: buildApiUrl(API_CONFIG.PROJECTS.LIST),
  PROJECT_DETAIL: (id) => buildApiUrl(API_CONFIG.PROJECTS.DETAIL(id)),
  PROJECTS_STATS: buildApiUrl(API_CONFIG.PROJECTS.STATS),
  PROJECT_UPDATE_STATUS: (id) => buildApiUrl(API_CONFIG.PROJECTS.UPDATE_STATUS(id)),
  
  // Project members endpoints
  PROJECT_MEMBERS_LIST: (projectId) => buildApiUrl(API_CONFIG.PROJECTS.MEMBERS.LIST(projectId)),
  PROJECT_MEMBER_DETAIL: (projectId, memberId) => buildApiUrl(API_CONFIG.PROJECTS.MEMBERS.DETAIL(projectId, memberId)),
  
  // Project permissions endpoints
  PROJECT_PERMISSIONS_LIST: (projectId) => buildApiUrl(API_CONFIG.PROJECTS.PERMISSIONS.LIST(projectId)),
  PROJECT_PERMISSION_DETAIL: (projectId, permissionId) => buildApiUrl(API_CONFIG.PROJECTS.PERMISSIONS.DETAIL(projectId, permissionId)),
  PROJECT_USER_PERMISSIONS: (projectId) => buildApiUrl(API_CONFIG.PROJECTS.PERMISSIONS.USER_PERMISSIONS(projectId)),
  PROJECT_GRANT_MULTIPLE_PERMISSIONS: (projectId) => buildApiUrl(API_CONFIG.PROJECTS.PERMISSIONS.GRANT_MULTIPLE(projectId)),
  
  // Project history endpoints
  PROJECT_HISTORY_LIST: (projectId) => buildApiUrl(API_CONFIG.PROJECTS.HISTORY.LIST(projectId)),
  PROJECT_HISTORY_DETAIL: (projectId, historyId) => buildApiUrl(API_CONFIG.PROJECTS.HISTORY.DETAIL(projectId, historyId)),
  
  // Task endpoints
  TASKS_LIST: buildApiUrl(API_CONFIG.TASKS.LIST),
  TASK_DETAIL: (id) => buildApiUrl(API_CONFIG.TASKS.DETAIL(id)),
  TASKS_STATS: buildApiUrl(API_CONFIG.TASKS.STATS),
  TASK_UPDATE_STATUS: (id) => buildApiUrl(API_CONFIG.TASKS.UPDATE_STATUS(id)),
  PROJECT_TASKS: (projectId) => buildApiUrl(API_CONFIG.TASKS.PROJECT_TASKS(projectId)),
  MY_TASKS: buildApiUrl(API_CONFIG.TASKS.MY_TASKS),
  OVERDUE_TASKS: buildApiUrl(API_CONFIG.TASKS.OVERDUE_TASKS),
};

// Configuration par défaut pour Axios
export const API_CONFIG_DEFAULT = {
  timeout: 10000, // 10 secondes
  headers: {
    'Content-Type': 'application/json',
  },
};

export default API_CONFIG;
