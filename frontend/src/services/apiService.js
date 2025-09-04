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
      console.log(` API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
      console.log(` API Request Headers:`, config.headers);
      console.log(` API Request Method:`, config.method);
    }
    
    return config;
  },
  (error) => {
    if (isDevelopment()) {
      console.error(' API Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et les erreurs
apiClient.interceptors.response.use(
  (response) => {
    if (isDevelopment()) {
      console.log(` API Response: ${response.status} ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error) => {
    if (isDevelopment()) {
      console.error(' API Response Error:', error.response?.status, error.response?.data);
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

// Service des équipes de projet
export const teamService = {
  // Récupérer les membres d'un projet
  getProjectMembers: async (projectId) => {
    const response = await apiClient.get(`/api/projects/${projectId}/membres/`);
    return response.data;
  },
  
  // Ajouter un membre à un projet
  addProjectMember: async (projectId, memberData) => {
    const response = await apiClient.post(`/api/projects/${projectId}/membres/`, memberData);
    return response.data;
  },
  
  // Modifier un membre d'un projet
  updateProjectMember: async (projectId, memberId, memberData) => {
    const response = await apiClient.put(`/api/projects/${projectId}/membres/${memberId}/`, memberData);
    return response.data;
  },
  
  // Supprimer un membre d'un projet
  deleteProjectMember: async (projectId, memberId) => {
    const response = await apiClient.delete(`/api/projects/${projectId}/membres/${memberId}/`);
    return response.data;
  },
  
  // Récupérer les permissions d'un projet
  getProjectPermissions: async (projectId) => {
    const response = await apiClient.get(`/api/projects/${projectId}/permissions/`);
    return response.data;
  },
  
  // Accorder des permissions à un utilisateur
  grantProjectPermission: async (projectId, permissionData) => {
    const response = await apiClient.post(`/api/projects/${projectId}/permissions/`, permissionData);
    return response.data;
  }
};

// Service des tâches
export const tasksService = {
  // Récupérer toutes les tâches avec pagination
  getTasks: async (params = {}) => {
    const response = await apiClient.get('/api/taches/', { params });
    return response.data;
  },
  
  // Récupérer une tâche par ID
  getTask: async (id) => {
    const response = await apiClient.get(`/api/taches/${id}/`);
    return response.data;
  },
  
  // Créer une nouvelle tâche
  createTask: async (taskData) => {
    const response = await apiClient.post('/api/taches/', taskData);
    return response.data;
  },
  
  // Mettre à jour une tâche
  updateTask: async (id, taskData) => {
    const response = await apiClient.put(`/api/taches/${id}/`, taskData);
    return response.data;
  },
  
  // Supprimer une tâche
  deleteTask: async (id) => {
    const response = await apiClient.delete(`/api/taches/${id}/`);
    return response.data;
  },
  
  // Mettre à jour le statut d'une tâche
  updateTaskStatus: async (id, status) => {
    const response = await apiClient.patch(`/api/taches/${id}/update_statut/`, { statut: status });
    return response.data;
  },
  
  // Récupérer les tâches d'un projet
  getProjectTasks: async (projectId) => {
    const response = await apiClient.get(`/api/taches/projet_taches/?projet_id=${projectId}`);
    return response.data;
  },
  
  // Récupérer les tâches assignées à l'utilisateur connecté
  getMyTasks: async (params = {}) => {
    const response = await apiClient.get('/api/taches/mes_taches/', { params });
    return response.data;
  }
};

// Service des projets
export const projectsService = {
  // Récupérer tous les projets avec pagination
  getProjects: async (params = {}) => {
    const response = await apiClient.get('/api/projects/', { params });
    return response.data;
  },
  
  // Récupérer un projet par ID
  getProject: async (id) => {
    const response = await apiClient.get(`/api/projects/${id}/`);
    return response.data;
  },
  
  // Créer un nouveau projet
  createProject: async (projectData) => {
    const response = await apiClient.post('/api/projects/', projectData);
    return response.data;
  },
  
  // Mettre à jour un projet
  updateProject: async (id, projectData) => {
    const response = await apiClient.put(`/api/projects/${id}/`, projectData);
    return response.data;
  },
  
  // Supprimer un projet
  deleteProject: async (id) => {
    const response = await apiClient.delete(`/api/projects/${id}/`);
    return response.data;
  },
  
  // Rechercher des projets
  searchProjects: async (searchTerm, filters = {}) => {
    const params = { search: searchTerm, ...filters };
    const response = await apiClient.get('/api/projects/', { params });
    return response.data;
  }
};

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

// Service des utilisateurs avec statistiques
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
  
  // Obtenir les statistiques des utilisateurs
  getUsersStats: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USER_STATS);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques utilisateurs:', error);
      return {
        total_users: 0,
        active_today: 0,
        active_this_week: 0,
        active_this_month: 0,
        online_users: 0,
        par_role: {},
        par_service: {}
      };
    }
  },
  
  // Obtenir le profil de l'utilisateur connecté
  getMe: async () => {
    const response = await apiClient.get(API_ENDPOINTS.ME);
    return response.data;
  },
  
  // Mettre à jour le mot de passe
  setPassword: async (id, passwordData) => {
    const response = await apiClient.post(API_ENDPOINTS.USER_SET_PASSWORD(id), passwordData);
    return response.data;
  },
  
  // Obtenir tous les services
  getServices: async () => {
    const response = await apiClient.get('/api/accounts/services/');
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
  
  createRole: async (roleData) => {
    const response = await apiClient.post(API_ENDPOINTS.ROLES_LIST, roleData);
    return response.data;
  },
  
  updateRole: async (id, roleData) => {
    const response = await apiClient.put(API_ENDPOINTS.ROLE_DETAIL(id), roleData);
    return response.data;
  },
  
  deleteRole: async (id) => {
    const response = await apiClient.delete(API_ENDPOINTS.ROLE_DETAIL(id));
    return response.data;
  },
  
  getRolePermissions: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.ROLE_PERMISSIONS(id));
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

// Service des rôles-permissions
export const rolePermissionService = {
  getRolePermissions: async () => {
    const response = await apiClient.get(API_ENDPOINTS.ROLE_PERMISSIONS_LIST);
    return response.data;
  },
  
  getRolePermission: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.ROLE_PERMISSION_DETAIL(id));
    return response.data;
  },
  
  createRolePermission: async (rolePermissionData) => {
    const response = await apiClient.post(API_ENDPOINTS.ROLE_PERMISSIONS_LIST, rolePermissionData);
    return response.data;
  },
  
  deleteRolePermission: async (id) => {
    const response = await apiClient.delete(API_ENDPOINTS.ROLE_PERMISSION_DETAIL(id));
    return response.data;
  },
};

// Service des projets
export const projectService = {
  // Liste des projets
  getProjects: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.PROJECTS_LIST, { params });
    return response.data;
  },
  
  // Détails d'un projet
  getProject: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.PROJECT_DETAIL(id));
    return response.data;
  },
  
  // Créer un projet
  createProject: async (projectData) => {
    const response = await apiClient.post(API_ENDPOINTS.PROJECTS_LIST, projectData);
    return response.data;
  },
  
  // Mettre à jour un projet
  updateProject: async (id, projectData) => {
    const response = await apiClient.put(API_ENDPOINTS.PROJECT_DETAIL(id), projectData);
    return response.data;
  },
  
  // Supprimer un projet
  deleteProject: async (id) => {
    const response = await apiClient.delete(API_ENDPOINTS.PROJECT_DETAIL(id));
    return response.data;
  },
  
  // Mettre à jour le statut d'un projet
  updateProjectStatus: async (id, statusData) => {
    const response = await apiClient.patch(API_ENDPOINTS.PROJECT_UPDATE_STATUS(id), statusData);
    return response.data;
  },
  
  // Obtenir les statistiques des projets
  getProjectsStats: async () => {
    const response = await apiClient.get(API_ENDPOINTS.PROJECTS_STATS);
    return response.data;
  },
  
  // Membres de projet
  getProjectMembers: async (projectId) => {
    const response = await apiClient.get(API_ENDPOINTS.PROJECT_MEMBERS_LIST(projectId));
    return response.data;
  },
  
  getProjectMember: async (projectId, memberId) => {
    const response = await apiClient.get(API_ENDPOINTS.PROJECT_MEMBER_DETAIL(projectId, memberId));
    return response.data;
  },
  
  createProjectMember: async (projectId, memberData) => {
    const response = await apiClient.post(API_ENDPOINTS.PROJECT_MEMBERS_LIST(projectId), memberData);
    return response.data;
  },
  
  updateProjectMember: async (projectId, memberId, memberData) => {
    const response = await apiClient.put(API_ENDPOINTS.PROJECT_MEMBER_DETAIL(projectId, memberId), memberData);
    return response.data;
  },
  
  deleteProjectMember: async (projectId, memberId) => {
    const response = await apiClient.delete(API_ENDPOINTS.PROJECT_MEMBER_DETAIL(projectId, memberId));
    return response.data;
  },
  
  // Permissions de projet
  getProjectPermissions: async (projectId) => {
    const response = await apiClient.get(API_ENDPOINTS.PROJECT_PERMISSIONS_LIST(projectId));
    return response.data;
  },
  
  getProjectPermission: async (projectId, permissionId) => {
    const response = await apiClient.get(API_ENDPOINTS.PROJECT_PERMISSION_DETAIL(projectId, permissionId));
    return response.data;
  },
  
  createProjectPermission: async (projectId, permissionData) => {
    const response = await apiClient.post(API_ENDPOINTS.PROJECT_PERMISSIONS_LIST(projectId), permissionData);
    return response.data;
  },
  
  updateProjectPermission: async (projectId, permissionId, permissionData) => {
    const response = await apiClient.put(API_ENDPOINTS.PROJECT_PERMISSION_DETAIL(projectId, permissionId), permissionData);
    return response.data;
  },
  
  deleteProjectPermission: async (projectId, permissionId) => {
    const response = await apiClient.delete(API_ENDPOINTS.PROJECT_PERMISSION_DETAIL(projectId, permissionId));
    return response.data;
  },
  
  // Obtenir les permissions d'un utilisateur sur un projet
  getUserProjectPermissions: async (projectId, userId) => {
    const response = await apiClient.get(API_ENDPOINTS.PROJECT_USER_PERMISSIONS(projectId), {
      params: { utilisateur: userId }
    });
    return response.data;
  },
  
  // Accorder plusieurs permissions à un utilisateur
  grantMultiplePermissions: async (projectId, permissionsData) => {
    const response = await apiClient.post(API_ENDPOINTS.PROJECT_GRANT_MULTIPLE_PERMISSIONS(projectId), permissionsData);
    return response.data;
  },
  
  // Historique de projet
  getProjectHistory: async (projectId) => {
    const response = await apiClient.get(API_ENDPOINTS.PROJECT_HISTORY_LIST(projectId));
    return response.data;
  },
  
  getProjectHistoryItem: async (projectId, historyId) => {
    const response = await apiClient.get(API_ENDPOINTS.PROJECT_HISTORY_DETAIL(projectId, historyId));
    return response.data;
  },
};

// Service des tâches
export const taskService = {
  // Liste des tâches
  getTasks: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.TASKS_LIST, { params });
    return response.data;
  },
  
  // Détails d'une tâche
  getTask: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.TASK_DETAIL(id));
    return response.data;
  },
  
  // Créer une tâche
  createTask: async (taskData) => {
    const response = await apiClient.post(API_ENDPOINTS.TASKS_LIST, taskData);
    return response.data;
  },
  
  // Mettre à jour une tâche
  updateTask: async (id, taskData) => {
    const response = await apiClient.put(API_ENDPOINTS.TASK_DETAIL(id), taskData);
    return response.data;
  },
  
  // Supprimer une tâche
  deleteTask: async (id) => {
    const response = await apiClient.delete(API_ENDPOINTS.TASK_DETAIL(id));
    return response.data;
  },
  
  // Mettre à jour le statut d'une tâche
  updateTaskStatus: async (id, statusData) => {
    const response = await apiClient.patch(API_ENDPOINTS.TASK_UPDATE_STATUS(id), statusData);
    return response.data;
  },
  
  // Obtenir les statistiques des tâches
  getTasksStats: async () => {
    const response = await apiClient.get(API_ENDPOINTS.TASKS_STATS);
    return response.data;
  },
  
  // Tâches d'un projet
  getProjectTasks: async (projectId) => {
    const response = await apiClient.get(API_ENDPOINTS.PROJECT_TASKS(projectId));
    return response.data;
  },
  
  // Mes tâches
  getMyTasks: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.MY_TASKS, { params });
    return response.data;
  },
  
  // Tâches en retard
  getOverdueTasks: async () => {
    const response = await apiClient.get(API_ENDPOINTS.OVERDUE_TASKS);
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
  rolePermissions: rolePermissionService,
  projects: projectService,
  tasks: taskService,
};
