import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Key,
  Save,
  X,
  Check,
  AlertCircle,
  Users
} from 'lucide-react';
import { roleService, permissionService } from '../../services/apiService';
import CustomDataTable from '../ui/DataTable';
import './UserManagement.css';

const RoleManagement = () => {
  // États principaux
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États pour les modales
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  // États pour les filtres et recherche
  const [searchTerm, setSearchTerm] = useState('');

  // États pour les formulaires
  const [roleForm, setRoleForm] = useState({
    code: '',
    nom: '',
    permissions: []
  });

  // Charger les données initiales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [rolesData, permissionsData] = await Promise.all([
        roleService.getRoles(),
        permissionService.getPermissions()
      ]);

      setRoles(rolesData.results || rolesData);
      setPermissions(permissionsData.results || permissionsData);

    } catch (err) {
      setError('Erreur lors du chargement des données: ' + (err.response?.data?.detail || err.message));
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Gestion des rôles
  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      await roleService.createRole(roleForm);
      await loadInitialData();
      setShowRoleModal(false);
      resetRoleForm();
    } catch (err) {
      setError('Erreur lors de la création du rôle: ' + (err.response?.data?.detail || err.message));
      console.error('Erreur:', err);
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    try {
      await roleService.updateRole(editingRole.id, roleForm);
      await loadInitialData();
      setShowRoleModal(false);
      setEditingRole(null);
      resetRoleForm();
    } catch (err) {
      setError('Erreur lors de la mise à jour du rôle: ' + (err.response?.data?.detail || err.message));
      console.error('Erreur:', err);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) {
      try {
        await roleService.deleteRole(roleId);
        await loadInitialData();
      } catch (err) {
        setError('Erreur lors de la suppression du rôle: ' + (err.response?.data?.detail || err.message));
        console.error('Erreur:', err);
      }
    }
  };

  // Fonctions utilitaires
  const resetRoleForm = () => {
    setRoleForm({
      code: '',
      nom: '',
      permissions: []
    });
  };

  const openEditRole = (role) => {
    setEditingRole(role);
    setRoleForm({
      code: role.code,
      nom: role.nom,
      permissions: role.permissions || []
    });
    setShowRoleModal(true);
  };

  const handlePermissionToggle = (permissionId) => {
    const isSelected = roleForm.permissions.includes(permissionId);
    if (isSelected) {
      setRoleForm({
        ...roleForm,
        permissions: roleForm.permissions.filter(id => id !== permissionId)
      });
    } else {
      setRoleForm({
        ...roleForm,
        permissions: [...roleForm.permissions, permissionId]
      });
    }
  };

  // Configuration des colonnes pour la DataTable
  const columns = useMemo(() => [
    {
      name: 'Code',
      selector: row => row.code,
      sortable: true,
      cell: (row) => (
        <div className="role-code">{row.code}</div>
      ),
      width: '150px'
    },
    {
      name: 'Nom',
      selector: row => row.nom,
      sortable: true,
      cell: (row) => (
        <div className="role-name">{row.nom}</div>
      ),
      width: '200px'
    },
    {
      name: 'Permissions',
      selector: row => row.permissions?.length || 0,
      sortable: true,
      cell: (row) => (
        <div className="permissions-list">
          {row.permissions && row.permissions.length > 0 ? (
            <div className="permissions-count">
              <Key size={16} />
              {row.permissions.length} permission(s)
            </div>
          ) : (
            <span className="no-permissions">Aucune permission</span>
          )}
        </div>
      ),
      width: '200px'
    },
    {
      name: 'Actions',
      cell: (row) => (
        <div className="table-action-container">
          <button 
            className="table-action-btn table-action-btn-edit"
            onClick={() => openEditRole(row)}
            title="Modifier le rôle"
            type="button"
          >
            <Edit size={14} color="white" />
          </button>
          <button 
            className="table-action-btn table-action-btn-delete"
            onClick={() => handleDeleteRole(row.id)}
            title="Supprimer le rôle"
            type="button"
          >
            <Trash2 size={14} color="white" />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: false,
      button: true,
      minWidth: '300px',
      center: true
    }
  ], []);

  // Filtrage des rôles
  const filteredRoles = useMemo(() => {
    return roles.filter(role => {
      const matchesSearch = role.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           role.nom.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [roles, searchTerm]);

  if (loading) {
    return (
      <div className="user-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      {/* En-tête */}
      <div className="admin-section-header">
        <div className="admin-section-title">
          <Shield size={32} />
          <div>
            <h1>Gestion des Rôles</h1>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0', fontWeight: 'normal' }}>Administration • Rôles</p>
          </div>
        </div>
        <div className="admin-section-actions">
          <button 
            className="admin-btn admin-btn-primary"
            onClick={() => {
              resetRoleForm();
              setEditingRole(null);
              setShowRoleModal(true);
            }}
          >
            <Plus size={20} />
            Nouveau Rôle
          </button>
        </div>
      </div>

      {/* DataTable des rôles */}
      <CustomDataTable
        data={filteredRoles}
        columns={columns}
        title="Liste des rôles"
        searchable={true}
        filterable={false}
        exportable={true}
        pagination={true}
        loading={loading}
        searchPlaceholder="Rechercher un rôle..."
        onRefresh={loadInitialData}
        noDataMessage="Aucun rôle trouvé"
      />

      {/* Modale Rôle */}
      {showRoleModal && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="modal-content user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <Shield size={20} />
                {editingRole ? 'Modifier le rôle' : 'Nouveau rôle'}
              </h3>
              <button 
                className="modal-close"
                onClick={() => setShowRoleModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={editingRole ? handleUpdateRole : handleCreateRole}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      <Shield size={16} />
                      Code du rôle *
                    </label>
                    <input
                      type="text"
                      value={roleForm.code}
                      onChange={(e) => setRoleForm({...roleForm, code: e.target.value})}
                      required
                      placeholder="Ex: admin, marketing, dsi"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Shield size={16} />
                      Nom du rôle *
                    </label>
                    <input
                      type="text"
                      value={roleForm.nom}
                      onChange={(e) => setRoleForm({...roleForm, nom: e.target.value})}
                      required
                      placeholder="Ex: Administrateur, Responsable Marketing"
                    />
                  </div>

                  <div className="form-group checkbox-group">
                    <label>
                      <Key size={16} />
                      Permissions
                    </label>
                    <div className="permissions-grid">
                      {permissions.map(permission => (
                        <label key={permission.id} className="permission-checkbox">
                          <input
                            type="checkbox"
                            checked={roleForm.permissions.includes(permission.id)}
                            onChange={() => handlePermissionToggle(permission.id)}
                          />
                          <span className="checkmark"></span>
                          <div className="permission-info">
                            <div className="permission-code">{permission.code}</div>
                            <div className="permission-description">{permission.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRoleModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  {editingRole ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Messages d'erreur */}
      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          {error}
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
