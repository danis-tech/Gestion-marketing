import React, { useState, useEffect, useMemo } from 'react';
import { 
  Key, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Shield,
  Save,
  X,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Settings
} from 'lucide-react';
import { permissionService, roleService, rolePermissionService } from '../../services/apiService';
import CustomDataTable from '../ui/DataTable';
import PermissionSelector from '../ui/PermissionSelector';
import { ALL_PERMISSIONS } from '../../constants/permissions';
import './PermissionManagement.css';

const PermissionManagement = () => {
  // États principaux
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États pour les modales
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showRolePermissionModal, setShowRolePermissionModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);

  // États pour les filtres et recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterPermission, setFilterPermission] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // États pour les formulaires
  const [permissionForm, setPermissionForm] = useState({
    code: '',
    description: ''
  });
  
  // État pour le sélecteur de permissions prédéfinies
  const [selectedPredefinedPermission, setSelectedPredefinedPermission] = useState('');

  // Fonction pour réinitialiser le formulaire de permission
  const resetPermissionForm = () => {
    setPermissionForm({
      code: '',
      description: ''
    });
    setSelectedPredefinedPermission('');
  };

  // Fonction pour réinitialiser tous les filtres
  const resetAllFilters = () => {
    setSearchTerm('');
    setFilterRole('');
    setFilterPermission('');
    setFilterStatus('');
  };

  // Fonction pour gérer la sélection d'une permission prédéfinie
  const handlePredefinedPermissionSelect = (permissionCode) => {
    if (permissionCode) {
      // Trouver la permission dans les constantes
      const permission = ALL_PERMISSIONS.find(p => p.code === permissionCode);
      
      if (permission) {
        setPermissionForm({
          code: permission.code,
          description: permission.description
        });
        setSelectedPredefinedPermission(permissionCode);
      }
    } else {
      // Si aucune permission sélectionnée, réinitialiser
      setSelectedPredefinedPermission('');
    }
  };

  const [rolePermissionForm, setRolePermissionForm] = useState({
    role_id: '',
    permission_id: ''
  });

  // Charger les données initiales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [permissionsData, rolesData, rolePermissionsData] = await Promise.all([
        permissionService.getPermissions(),
        roleService.getRoles(),
        rolePermissionService.getRolePermissions()
      ]);

      setPermissions(permissionsData.results || permissionsData);
      setRoles(rolesData.results || rolesData);
      setRolePermissions(rolePermissionsData.results || rolePermissionsData);

    } catch (err) {
      setError('Erreur lors du chargement des données: ' + (err.response?.data?.detail || err.message));
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Gestion des permissions
  const handleCreatePermission = async (e) => {
    e.preventDefault();
    
    if (!permissionForm.code || !permissionForm.description) {
      setError('Tous les champs sont obligatoires');
      return;
    }
    
    try {
      await permissionService.createPermission(permissionForm);
      await loadInitialData();
      setShowPermissionModal(false);
      resetPermissionForm();
    } catch (err) {
      setError('Erreur lors de la création de la permission: ' + (err.response?.data?.detail || err.message));
      console.error('Erreur:', err);
    }
  };

  const handleUpdatePermission = async (e) => {
    e.preventDefault();
    try {
      await permissionService.updatePermission(editingPermission.id, permissionForm);
      await loadInitialData();
      setShowPermissionModal(false);
      setEditingPermission(null);
      resetPermissionForm();
    } catch (err) {
      setError('Erreur lors de la mise à jour de la permission: ' + (err.response?.data?.detail || err.message));
      console.error('Erreur:', err);
    }
  };

  const handleDeletePermission = async (permissionId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette permission ?')) {
      try {
        await permissionService.deletePermission(permissionId);
        await loadInitialData();
      } catch (err) {
        setError('Erreur lors de la suppression de la permission: ' + (err.response?.data?.detail || err.message));
        console.error('Erreur:', err);
      }
    }
  };

  // Gestion des rôles-permissions
  const handleCreateRolePermission = async (e) => {
    e.preventDefault();
    try {
      await rolePermissionService.createRolePermission(rolePermissionForm);
      await loadInitialData();
      setShowRolePermissionModal(false);
      resetRolePermissionForm();
    } catch (err) {
      setError('Erreur lors de l\'assignation de la permission: ' + (err.response?.data?.detail || err.message));
      console.error('Erreur:', err);
    }
  };

  const handleDeleteRolePermission = async (rolePermissionId) => {
    if (window.confirm('Êtes-vous sûr de vouloir retirer cette permission du rôle ?')) {
      try {
        await rolePermissionService.deleteRolePermission(rolePermissionId);
        await loadInitialData();
      } catch (err) {
        setError('Erreur lors de la suppression de l\'assignation: ' + (err.response?.data?.detail || err.message));
        console.error('Erreur:', err);
      }
    }
  };

  // Fonctions utilitaires

  const resetRolePermissionForm = () => {
    setRolePermissionForm({
      role_id: '',
      permission_id: ''
    });
  };

  const openEditPermission = (permission) => {
    setEditingPermission(permission);
    setPermissionForm({
      code: permission.code,
      description: permission.description
    });
    setShowPermissionModal(true);
  };

  // Configuration des colonnes pour la DataTable des permissions
  const permissionColumns = useMemo(() => [
    {
      name: 'Code',
      selector: row => row.code,
      sortable: true,
      cell: (row) => (
        <div className="permission-code-cell">
          <Key size={16} />
          <code className="permission-code">{row.code}</code>
        </div>
      ),
      wrap: true
    },
    {
      name: 'Description',
      selector: row => row.description,
      sortable: true,
      cell: (row) => (
        <div className="permission-description-cell">
          {row.description}
        </div>
      ),
      wrap: true
    },
    {
      name: 'Rôles Associés',
      selector: row => {
        // Maintenant rp.permission est un objet, on compare avec rp.permission.id
        const associatedRoles = rolePermissions.filter(rp => rp.permission && rp.permission.id === row.id);
        return associatedRoles.length;
      },
      sortable: true,
      cell: (row) => {
        const associatedRoles = rolePermissions.filter(rp => rp.permission && rp.permission.id === row.id);
        return (
          <div className="roles-count">
            <Shield size={16} />
            <span className="count-badge">{associatedRoles.length}</span>
            <span className="count-label">rôle{associatedRoles.length > 1 ? 's' : ''}</span>
          </div>
        );
      }
    },
    {
      name: 'Actions',
      cell: (row) => (
        <div className="table-action-container">
          <button 
            className="table-action-btn table-action-btn-edit"
            onClick={() => openEditPermission(row)}
            title="Modifier la permission"
            type="button"
          >
            <Edit size={14} color="white" />
          </button>
          <button 
            className="table-action-btn table-action-btn-delete"
            onClick={() => handleDeletePermission(row.id)}
            title="Supprimer la permission"
            type="button"
          >
            <Trash2 size={14} color="white" />
          </button>
        </div>
      ),
      ignoreRowClick: true
    }
  ], [rolePermissions]);

  // Configuration des colonnes pour la DataTable des rôles-permissions
  const rolePermissionColumns = useMemo(() => [
    {
      name: 'Rôle',
      selector: row => {
        // Le backend envoie maintenant un objet role complet
        return row.role ? row.role.nom : 'Rôle inconnu';
      },
      sortable: true,
      cell: (row) => {
        return row.role ? (
          <div className="role-cell">
            <Shield size={16} />
            <span className="role-name">{row.role.nom}</span>
            <code className="role-code">{row.role.code}</code>
          </div>
        ) : (
          <span className="unknown-role">Rôle inconnu</span>
        );
      }
    },
    {
      name: 'Permission',
      selector: row => {
        // Le backend envoie maintenant un objet permission complet
        return row.permission ? row.permission.description : 'Permission inconnue';
      },
      sortable: true,
      cell: (row) => {
        return row.permission ? (
          <div className="permission-cell">
            <Key size={16} />
            <span className="permission-description">{row.permission.description}</span>
            <code className="permission-code">{row.permission.code}</code>
          </div>
        ) : (
          <span className="unknown-permission">Permission inconnue</span>
        );
      }
    },
    {
      name: 'Actions',
      cell: (row) => (
        <div className="table-action-container">
          <button 
            className="table-action-btn table-action-btn-delete"
            onClick={() => handleDeleteRolePermission(row.id)}
            title="Retirer cette permission du rôle"
            type="button"
          >
            <Trash2 size={14} color="white" />
          </button>
        </div>
      ),
      ignoreRowClick: true
    }
  ], [roles, permissions]);

  // Filtrage des permissions
  const filteredPermissions = useMemo(() => {
    return permissions.filter(permission => {
      const matchesSearch = !searchTerm || 
        permission.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [permissions, searchTerm]);

  // Filtrage des rôles-permissions
  const filteredRolePermissions = useMemo(() => {
    return rolePermissions.filter(rp => {
      // Filtre par rôle
      const matchesRole = !filterRole || (rp.role && rp.role.id === parseInt(filterRole));
      
      // Filtre par permission
      const matchesPermission = !filterPermission || (rp.permission && rp.permission.id === parseInt(filterPermission));
      
      // Filtre par statut (actif/inactif) - pour l'instant on considère que toutes les assignations sont actives
      const matchesStatus = !filterStatus || filterStatus === 'actif';
      
      return matchesRole && matchesPermission && matchesStatus;
    });
  }, [rolePermissions, filterRole, filterPermission, filterStatus]);

  // Composant de filtres personnalisés pour les permissions
  const permissionFilters = (
    <div className="custom-filters">
      <div className="search-box">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          placeholder="Rechercher une permission..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="admin-search-input"
        />
      </div>
    </div>
  );

  // Composant de filtres personnalisés pour les rôles-permissions
  const rolePermissionFilters = (
    <div className="custom-filters" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
      {/* Filtre par rôle */}
      <select 
        value={filterRole} 
        onChange={(e) => setFilterRole(e.target.value)}
        className="admin-form-select"
        style={{ minWidth: '180px' }}
      >
        <option value="">Tous les rôles</option>
        {roles.map(role => (
          <option key={role.id} value={role.id}>{role.nom}</option>
        ))}
      </select>

      {/* Filtre par permission */}
      <select 
        value={filterPermission} 
        onChange={(e) => setFilterPermission(e.target.value)}
        className="admin-form-select"
        style={{ minWidth: '200px' }}
      >
        <option value="">Toutes les permissions</option>
        {permissions.map(permission => (
          <option key={permission.id} value={permission.id}>
            {permission.code} - {permission.description}
          </option>
        ))}
      </select>

      {/* Filtre par statut */}
      <select 
        value={filterStatus} 
        onChange={(e) => setFilterStatus(e.target.value)}
        className="admin-form-select"
        style={{ minWidth: '120px' }}
      >
        <option value="">Tous les statuts</option>
        <option value="actif">Actif</option>
        <option value="inactif">Inactif</option>
      </select>

      {/* Bouton pour effacer tous les filtres */}
      <button
        type="button"
        onClick={() => {
          setFilterRole('');
          setFilterPermission('');
          setFilterStatus('');
        }}
        className="btn btn-secondary"
        style={{ 
          padding: '8px 12px', 
          fontSize: '12px',
          minWidth: 'auto'
        }}
        disabled={!filterRole && !filterPermission && !filterStatus}
      >
        Effacer
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="permission-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="permission-management">
      {/* En-tête */}
      <div className="admin-section-header">
        <div className="admin-section-title">
          <Key size={32} />
          <div>
            <h1>Gestion des Permissions</h1>
            <p style={{ fontSize: '14px', color: '#ffffff', margin: '4px 0 0 0', fontWeight: 'normal' }}>Administration • Permissions</p>
          </div>
        </div>
        <div className="admin-section-actions">
          <button 
            className="admin-btn admin-btn-primary"
            onClick={() => {
              resetPermissionForm();
              setEditingPermission(null);
              setShowPermissionModal(true);
            }}
          >
            <Plus size={20} />
            Nouvelle Permission
          </button>
          <button 
            className="admin-btn admin-btn-secondary"
            onClick={() => setShowRolePermissionModal(true)}
          >
            <Settings size={20} />
            Assigner Permission
          </button>
        </div>
      </div>

      {/* Section Permissions */}
      <div className="permissions-section">
        <h2 className="section-title">
          <Key size={24} />
          Permissions Disponibles
        </h2>

        <div className="table-container">
          <CustomDataTable
            data={filteredPermissions}
            columns={permissionColumns}
            title="Liste des permissions"
            searchable={true}
            filterable={true}
            exportable={true}
            pagination={true}
            loading={loading}
            searchPlaceholder="Rechercher une permission..."
            exportFileName="permissions"
            customFilterComponent={permissionFilters}
            onRefresh={loadInitialData}
            noDataMessage="Aucune permission trouvée"
          />
        </div>
      </div>

      {/* Section Rôles-Permissions */}
      <div className="role-permissions-section">
        <h2 className="section-title">
          <Shield size={24} />
          Assignations Rôles-Permissions
        </h2>
        
        {/* Indicateur de résultats filtrés */}
        <div style={{ 
          marginBottom: '16px', 
          padding: '12px 16px', 
          background: '#f0f9ff', 
          borderRadius: '8px', 
          border: '1px solid #bae6fd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#0369a1', fontWeight: '500' }}>
              {filteredRolePermissions.length} assignation(s) trouvée(s)
            </span>
            {(filterRole || filterPermission || filterStatus) && (
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                (sur {rolePermissions.length} au total)
              </span>
            )}
          </div>
          {(filterRole || filterPermission || filterStatus) && (
            <button
              type="button"
              onClick={resetAllFilters}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Effacer tous les filtres
            </button>
          )}
        </div>
        
        <div className="table-container">
          <CustomDataTable
            data={filteredRolePermissions}
            columns={rolePermissionColumns}
            title="Liste des assignations"
            searchable={false}
            filterable={true}
            exportable={true}
            pagination={true}
            loading={loading}
            exportFileName="role-permissions"
            customFilterComponent={rolePermissionFilters}
            onRefresh={loadInitialData}
            noDataMessage="Aucune assignation trouvée"
          />
        </div>
      </div>

      {/* Modale Permission */}
      {showPermissionModal && (
        <div className="modal-overlay" onClick={() => setShowPermissionModal(false)}>
          <div className="modal-content permission-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <Key size={20} />
                {editingPermission ? 'Modifier la permission' : 'Nouvelle permission'}
              </h3>
              <button 
                className="modal-close"
                onClick={() => setShowPermissionModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={editingPermission ? handleUpdatePermission : handleCreatePermission}>
              <div className="modal-body">
                <div className="form-group">
                  <label>
                    <Key size={16} />
                    Code de la permission *
                  </label>
                  {editingPermission ? (
                    <input
                      type="text"
                      value={permissionForm.code}
                      disabled
                      className="form-input-disabled"
                    />
                  ) : (
                    <PermissionSelector
                      selectedPermissions={selectedPredefinedPermission ? [selectedPredefinedPermission] : []}
                      onPermissionsChange={(permissions) => {
                        console.log('Permissions sélectionnées:', permissions); // Debug
                        if (permissions.length > 0) {
                          handlePredefinedPermissionSelect(permissions[0]);
                        } else {
                          handlePredefinedPermissionSelect('');
                        }
                      }}
                      multiple={false}
                      placeholder="Sélectionner une permission prédéfinie..."
                      className="permission-selector-modal"
                    />
                  )}
                  <small className="form-help">
                    Sélectionnez une permission prédéfinie ou créez-en une nouvelle
                  </small>
                  
                  {/* Option pour créer une permission personnalisée */}
                  <div style={{ marginTop: '12px', padding: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>
                      Ou créer une permission personnalisée :
                    </label>
                    <input
                      type="text"
                      value={permissionForm.code}
                      onChange={(e) => {
                        setPermissionForm({...permissionForm, code: e.target.value});
                        if (e.target.value) {
                          setSelectedPredefinedPermission(''); // Désélectionner la permission prédéfinie
                        }
                      }}
                      placeholder="Ex: projets:creer, etudes:valider"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                    <small style={{ display: 'block', marginTop: '4px', color: '#6b7280', fontSize: '12px' }}>
                      Format recommandé: module:action (ex: projets:creer)
                    </small>
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <Settings size={16} />
                    Description *
                  </label>
                  <textarea
                    value={permissionForm.description}
                    onChange={(e) => setPermissionForm({...permissionForm, description: e.target.value})}
                    required
                    placeholder="Description détaillée de la permission"
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPermissionModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  {editingPermission ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale Rôle-Permission */}
      {showRolePermissionModal && (
        <div className="modal-overlay" onClick={() => setShowRolePermissionModal(false)}>
          <div className="modal-content role-permission-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <Settings size={20} />
                Assigner une Permission à un Rôle
              </h3>
              <button 
                className="modal-close"
                onClick={() => setShowRolePermissionModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateRolePermission}>
              <div className="modal-body">
                <div className="form-group">
                  <label>
                    <Shield size={16} />
                    Rôle *
                  </label>
                  <select
                    value={rolePermissionForm.role_id}
                    onChange={(e) => setRolePermissionForm({...rolePermissionForm, role_id: e.target.value})}
                    required
                  >
                    <option value="">Sélectionner un rôle</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.nom} ({role.code})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <Key size={16} />
                    Permission *
                  </label>
                  <select
                    value={rolePermissionForm.permission_id}
                    onChange={(e) => setRolePermissionForm({...rolePermissionForm, permission_id: e.target.value})}
                    required
                  >
                    <option value="">Sélectionner une permission</option>
                    {permissions.map(permission => (
                      <option key={permission.id} value={permission.id}>
                        {permission.description} ({permission.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRolePermissionModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  Assigner
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

export default PermissionManagement;
