// permissions.js - Constantes des permissions prédéfinies

export const PERMISSION_CATEGORIES = {
  ADMIN: {
    name: 'Administration Système',
    icon: '⚙️',
    permissions: [
      { code: 'admin:access', description: 'Accès à l\'administration' },
      { code: 'users:manage', description: 'Gestion des utilisateurs' },
      { code: 'roles:manage', description: 'Gestion des rôles' },
      { code: 'permissions:manage', description: 'Gestion des permissions' },
      { code: 'services:manage', description: 'Gestion des services' },
      { code: 'system:config', description: 'Configuration système' }
    ]
  },
  PROJETS: {
    name: 'Gestion des Projets',
    icon: '📋',
    permissions: [
      { code: 'projets:voir', description: 'Voir les projets' },
      { code: 'projets:creer', description: 'Créer des projets' },
      { code: 'projets:modifier', description: 'Modifier les projets' },
      { code: 'projets:supprimer', description: 'Supprimer les projets' },
      { code: 'projets:valider', description: 'Valider les projets' },
      { code: 'projets:statut', description: 'Changer le statut' },
      { code: 'projets:budget', description: 'Gérer le budget' },
      { code: 'projets:equipe', description: 'Gérer l\'équipe' },
      { code: 'projets:phases', description: 'Gérer les phases' },
      { code: 'projets:taches', description: 'Gérer les tâches' },
      { code: 'projets:exporter', description: 'Exporter les projets' },
      { code: 'projets:historique', description: 'Voir l\'historique' }
    ]
  },
  DOCUMENTS: {
    name: 'Gestion des Documents',
    icon: '📄',
    permissions: [
      { code: 'documents:voir', description: 'Voir les documents' },
      { code: 'documents:creer', description: 'Créer des documents' },
      { code: 'documents:modifier', description: 'Modifier les documents' },
      { code: 'documents:supprimer', description: 'Supprimer les documents' },
      { code: 'documents:valider', description: 'Valider les documents' },
      { code: 'documents:televerser', description: 'Téléverser des documents' },
      { code: 'documents:telecharger', description: 'Télécharger des documents' },
      { code: 'documents:generer', description: 'Générer des documents' },
      { code: 'documents:commenter', description: 'Commenter les documents' },
      { code: 'documents:historique', description: 'Voir l\'historique' }
    ]
  },
  NOTIFICATIONS: {
    name: 'Gestion des Notifications',
    icon: '🔔',
    permissions: [
      { code: 'notifications:voir', description: 'Voir les notifications' },
      { code: 'notifications:creer', description: 'Créer des notifications' },
      { code: 'notifications:modifier', description: 'Modifier les notifications' },
      { code: 'notifications:supprimer', description: 'Supprimer les notifications' },
      { code: 'notifications:envoyer', description: 'Envoyer des notifications' },
      { code: 'notifications:config', description: 'Configurer les notifications' }
    ]
  },
  CHATBOT: {
    name: 'Chatbot',
    icon: '🤖',
    permissions: [
      { code: 'chatbot:utiliser', description: 'Utiliser le chatbot' },
      { code: 'chatbot:config', description: 'Configurer le chatbot' },
      { code: 'chatbot:historique', description: 'Voir l\'historique des conversations' }
    ]
  },
  RAPPORTS: {
    name: 'Rapports et Analytics',
    icon: '📊',
    permissions: [
      { code: 'rapports:voir', description: 'Voir les rapports' },
      { code: 'rapports:generer', description: 'Générer des rapports' },
      { code: 'rapports:exporter', description: 'Exporter les rapports' },
      { code: 'analytics:voir', description: 'Voir les analytics' },
      { code: 'analytics:config', description: 'Configurer les analytics' }
    ]
  },
  SYSTEM: {
    name: 'Système',
    icon: '🔧',
    permissions: [
      { code: 'system:logs', description: 'Voir les logs' },
      { code: 'system:backup', description: 'Gérer les sauvegardes' },
      { code: 'system:maintenance', description: 'Maintenance système' },
      { code: 'system:monitoring', description: 'Monitoring système' }
    ]
  }
};

// Liste plate de toutes les permissions pour faciliter la recherche
export const ALL_PERMISSIONS = Object.values(PERMISSION_CATEGORIES)
  .flatMap(category => category.permissions);

// Fonction pour obtenir une permission par son code
export const getPermissionByCode = (code) => {
  return ALL_PERMISSIONS.find(permission => permission.code === code);
};

// Fonction pour obtenir les permissions d'une catégorie
export const getPermissionsByCategory = (categoryKey) => {
  return PERMISSION_CATEGORIES[categoryKey]?.permissions || [];
};

// Fonction pour obtenir toutes les catégories
export const getAllCategories = () => {
  return Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => ({
    key,
    ...category
  }));
};

// Rôles prédéfinis avec leurs permissions
export const PREDEFINED_ROLES = {
  SUPER_ADMIN: {
    name: 'Super Administrateur',
    description: 'Accès complet à toutes les fonctionnalités',
    permissions: ALL_PERMISSIONS.map(p => p.code)
  },
  ADMIN: {
    name: 'Administrateur',
    description: 'Gestion complète des projets et utilisateurs',
    permissions: [
      'admin:access',
      'users:manage',
      'projets:voir',
      'projets:creer',
      'projets:modifier',
      'projets:supprimer',
      'projets:valider',
      'projets:statut',
      'projets:budget',
      'projets:equipe',
      'projets:phases',
      'projets:taches',
      'projets:exporter',
      'projets:historique',
      'documents:voir',
      'documents:creer',
      'documents:modifier',
      'documents:supprimer',
      'documents:valider',
      'documents:televerser',
      'documents:telecharger',
      'documents:generer',
      'documents:commenter',
      'documents:historique',
      'notifications:voir',
      'notifications:creer',
      'notifications:modifier',
      'notifications:envoyer',
      'rapports:voir',
      'rapports:generer',
      'rapports:exporter',
      'analytics:voir',
      'system:logs'
    ]
  },
  MANAGER: {
    name: 'Manager',
    description: 'Gestion des projets et équipes',
    permissions: [
      'projets:voir',
      'projets:creer',
      'projets:modifier',
      'projets:valider',
      'projets:statut',
      'projets:equipe',
      'projets:phases',
      'projets:taches',
      'projets:exporter',
      'projets:historique',
      'documents:voir',
      'documents:creer',
      'documents:modifier',
      'documents:valider',
      'documents:televerser',
      'documents:telecharger',
      'documents:generer',
      'documents:commenter',
      'notifications:voir',
      'notifications:creer',
      'notifications:envoyer',
      'rapports:voir',
      'rapports:generer',
      'chatbot:utiliser'
    ]
  },
  USER: {
    name: 'Utilisateur',
    description: 'Accès de base aux projets et documents',
    permissions: [
      'projets:voir',
      'documents:voir',
      'documents:telecharger',
      'documents:commenter',
      'notifications:voir',
      'chatbot:utiliser'
    ]
  },
  VIEWER: {
    name: 'Lecteur',
    description: 'Accès en lecture seule',
    permissions: [
      'projets:voir',
      'documents:voir',
      'documents:telecharger',
      'notifications:voir'
    ]
  }
};
