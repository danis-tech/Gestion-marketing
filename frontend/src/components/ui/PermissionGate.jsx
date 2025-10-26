// PermissionGate.jsx - Composant pour contrôler l'accès basé sur les permissions

import React from 'react';
import permissionService from '../../services/permissionService';

/**
 * Composant qui affiche ses enfants seulement si l'utilisateur a les permissions requises
 * 
 * @param {Object} props
 * @param {string|string[]} props.permission - Permission(s) requise(s)
 * @param {string|string[]} props.role - Rôle(s) requis(s)
 * @param {boolean} props.requireAll - Si true, l'utilisateur doit avoir TOUTES les permissions (défaut: false)
 * @param {React.ReactNode} props.children - Contenu à afficher si les conditions sont remplies
 * @param {React.ReactNode} props.fallback - Contenu à afficher si les conditions ne sont pas remplies
 * @param {boolean} props.superUser - Si true, seuls les super utilisateurs peuvent voir le contenu
 * @param {boolean} props.invert - Si true, inverse la logique (affiche si l'utilisateur N'A PAS la permission)
 */
const PermissionGate = ({
  permission,
  role,
  requireAll = false,
  children,
  fallback = null,
  superUser = false,
  invert = false,
  ...props
}) => {
  // Vérifier si l'utilisateur est super utilisateur
  if (superUser) {
    const isSuperUser = permissionService.isSuperUser();
    return invert ? (!isSuperUser ? children : fallback) : (isSuperUser ? children : fallback);
  }

  // Vérifier les permissions
  let hasPermission = false;
  if (permission) {
    if (requireAll) {
      hasPermission = permissionService.hasAllPermissions(permission);
    } else {
      hasPermission = permissionService.hasAnyPermission(permission);
    }
  }

  // Vérifier les rôles
  let hasRole = false;
  if (role) {
    hasRole = permissionService.hasAnyRole(role);
  }

  // Logique de vérification
  let canAccess = false;
  
  if (permission && role) {
    // L'utilisateur doit avoir la permission ET le rôle
    canAccess = hasPermission && hasRole;
  } else if (permission) {
    // Seulement la permission est requise
    canAccess = hasPermission;
  } else if (role) {
    // Seulement le rôle est requis
    canAccess = hasRole;
  } else {
    // Aucune condition spécifiée, accès autorisé
    canAccess = true;
  }

  // Appliquer l'inversion si demandée
  if (invert) {
    canAccess = !canAccess;
  }

  return canAccess ? children : fallback;
};

/**
 * Hook pour vérifier les permissions dans les composants
 */
export const usePermissions = () => {
  return {
    hasPermission: (permission) => permissionService.hasPermission(permission),
    hasAnyPermission: (permissions) => permissionService.hasAnyPermission(permissions),
    hasAllPermissions: (permissions) => permissionService.hasAllPermissions(permissions),
    hasRole: (role) => permissionService.hasRole(role),
    hasAnyRole: (roles) => permissionService.hasAnyRole(roles),
    isSuperUser: () => permissionService.isSuperUser(),
    isActive: () => permissionService.isActive(),
    getUserData: () => permissionService.getUserData(),
    getPermissions: () => permissionService.getPermissions(),
    getRole: () => permissionService.getRole(),
    getRoleName: () => permissionService.getRoleName(),
    getRoleCode: () => permissionService.getRoleCode(),
    isTokenValid: () => permissionService.isTokenValid(),
  };
};

/**
 * Composant pour afficher des informations de debug sur les permissions
 */
export const PermissionDebug = () => {
  const userData = permissionService.getUserData();
  const permissions = permissionService.getPermissions();
  const role = permissionService.getRole();

  if (!userData) {
    return <div>Non connecté</div>;
  }

  return (
    <div style={{ 
      padding: '10px', 
      backgroundColor: '#f5f5f5', 
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      <h4>Debug Permissions</h4>
      <p><strong>Utilisateur:</strong> {userData.username}</p>
      <p><strong>Email:</strong> {userData.email}</p>
      <p><strong>Super User:</strong> {userData.is_superuser ? 'Oui' : 'Non'}</p>
      <p><strong>Actif:</strong> {userData.is_active ? 'Oui' : 'Non'}</p>
      <p><strong>Rôle:</strong> {role ? `${role.nom} (${role.code})` : 'Aucun'}</p>
      <p><strong>Permissions:</strong></p>
      <ul>
        {permissions.map(perm => (
          <li key={perm}>{perm}</li>
        ))}
      </ul>
    </div>
  );
};

export default PermissionGate;
