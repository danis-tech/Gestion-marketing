// permissionService.js - Service de gestion des permissions basé sur JWT

import { jwtDecode } from 'jwt-decode';

class PermissionService {
  constructor() {
    this.token = null;
    this.userData = null;
    this.permissions = [];
    this.role = null;
  }

  /**
   * Initialise le service avec un token JWT
   * @param {string} token - Token JWT d'accès
   */
  initialize(token) {
    if (!token) {
      this.clear();
      return;
    }

    try {
      this.token = token;
      this.userData = jwtDecode(token);
      
      // Extraire les permissions et le rôle du token
      this.permissions = this.userData.permissions || [];
      this.role = this.userData.role;
      
      console.log('PermissionService initialized:', {
        user: this.userData.username,
        role: this.role?.nom || 'Aucun rôle',
        permissions: this.permissions
      });
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
      this.clear();
    }
  }

  /**
   * Vide les données du service
   */
  clear() {
    this.token = null;
    this.userData = null;
    this.permissions = [];
    this.role = null;
  }

  /**
   * Vérifie si l'utilisateur a une permission spécifique
   * @param {string} permission - Code de la permission (ex: 'projets:creer')
   * @returns {boolean}
   */
  hasPermission(permission) {
    if (!this.permissions || this.permissions.length === 0) {
      return false;
    }
    
    return this.permissions.includes(permission);
  }

  /**
   * Vérifie si l'utilisateur a au moins une des permissions
   * @param {string[]} permissions - Liste des permissions
   * @returns {boolean}
   */
  hasAnyPermission(permissions) {
    if (!Array.isArray(permissions)) {
      return this.hasPermission(permissions);
    }
    
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Vérifie si l'utilisateur a toutes les permissions
   * @param {string[]} permissions - Liste des permissions
   * @returns {boolean}
   */
  hasAllPermissions(permissions) {
    if (!Array.isArray(permissions)) {
      return this.hasPermission(permissions);
    }
    
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   * @param {string} roleCode - Code du rôle (ex: 'admin', 'manager')
   * @returns {boolean}
   */
  hasRole(roleCode) {
    return this.role && this.role.code === roleCode;
  }

  /**
   * Vérifie si l'utilisateur a au moins un des rôles
   * @param {string[]} roleCodes - Liste des codes de rôles
   * @returns {boolean}
   */
  hasAnyRole(roleCodes) {
    if (!Array.isArray(roleCodes)) {
      return this.hasRole(roleCodes);
    }
    
    return roleCodes.some(roleCode => this.hasRole(roleCode));
  }

  /**
   * Vérifie si l'utilisateur est super admin
   * @returns {boolean}
   */
  isSuperUser() {
    return this.userData && this.userData.is_superuser === true;
  }

  /**
   * Vérifie si l'utilisateur est actif
   * @returns {boolean}
   */
  isActive() {
    return this.userData && this.userData.is_active === true;
  }

  /**
   * Retourne les informations de l'utilisateur
   * @returns {object|null}
   */
  getUserData() {
    return this.userData;
  }

  /**
   * Retourne les permissions de l'utilisateur
   * @returns {string[]}
   */
  getPermissions() {
    return this.permissions || [];
  }

  /**
   * Retourne les informations du rôle
   * @returns {object|null}
   */
  getRole() {
    return this.role;
  }

  /**
   * Retourne le nom du rôle
   * @returns {string}
   */
  getRoleName() {
    return this.role ? this.role.nom : 'Aucun rôle';
  }

  /**
   * Retourne le code du rôle
   * @returns {string}
   */
  getRoleCode() {
    return this.role ? this.role.code : null;
  }

  /**
   * Vérifie si le token est valide et non expiré
   * @returns {boolean}
   */
  isTokenValid() {
    if (!this.token || !this.userData) {
      return false;
    }

    try {
      const currentTime = Date.now() / 1000;
      return this.userData.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  /**
   * Retourne le temps restant avant expiration du token (en secondes)
   * @returns {number}
   */
  getTokenTimeRemaining() {
    if (!this.userData || !this.userData.exp) {
      return 0;
    }

    const currentTime = Date.now() / 1000;
    return Math.max(0, this.userData.exp - currentTime);
  }
}

// Instance singleton
const permissionService = new PermissionService();

export default permissionService;
