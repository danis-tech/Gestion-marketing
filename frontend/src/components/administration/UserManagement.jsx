import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Plus,
  Building2,
  Shield,
  Key,
  Mail,
  Phone,
  User,
  Eye,
  EyeOff,
  Save,
  X,
  Check,
  AlertCircle,
  Image,
  Upload
} from 'lucide-react';
import { userService, roleService, serviceService } from '../../services/apiService';
import CustomDataTable from '../ui/DataTable';
import PhotoUpload from '../ui/PhotoUpload';
import './UserManagement.css';

const UserManagement = () => {
  // États principaux
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [services, setServices] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États pour les modales
  const [showUserModal, setShowUserModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingService, setEditingService] = useState(null);

  // États pour les filtres et recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // États pour les formulaires
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    prenom: '',
    nom: '',
    phone: '',
    photo_url: '',
    password: '',
    role_code: '',
    service_code: '',
    is_active: true,
    is_superuser: false
  });

  const [serviceForm, setServiceForm] = useState({
    code: '',
    nom: ''
  });

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
      const [usersData, rolesData, servicesData, statsData] = await Promise.all([
        userService.getUsers(),
        roleService.getRoles(),
        serviceService.getServices(),
        userService.getUsersStats()
      ]);

        setUsers(usersData.results || usersData);
        setRoles(rolesData.results || rolesData);
        setServices(servicesData.results || servicesData);
      setUserStats(statsData);

    } catch (err) {
      setError('Erreur lors du chargement des données: ' + (err.response?.data?.detail || err.message));
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Gestion des utilisateurs
  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Validation côté frontend
    if (!userForm.password || userForm.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    if (!userForm.username || !userForm.email || !userForm.prenom || !userForm.nom) {
      setError('Tous les champs obligatoires doivent être remplis');
      return;
    }
    
    try {
      // Préparer les données avec is_superuser
      const userData = {
        ...userForm
      };
      await userService.createUser(userData);
        await loadInitialData();
        setShowUserModal(false);
        resetUserForm();
    } catch (err) {
      setError('Erreur lors de la création de l\'utilisateur: ' + (err.response?.data?.detail || err.message));
      console.error('Erreur:', err);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      // Préparer les données avec is_superuser
      const userData = {
        ...userForm
      };
      await userService.updateUser(editingUser.id, userData);
        await loadInitialData();
        setShowUserModal(false);
        setEditingUser(null);
        resetUserForm();
    } catch (err) {
      setError('Erreur lors de la mise à jour de l\'utilisateur: ' + (err.response?.data?.detail || err.message));
      console.error('Erreur:', err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await userService.deleteUser(userId);
          await loadInitialData();
      } catch (err) {
        setError('Erreur lors de la suppression de l\'utilisateur: ' + (err.response?.data?.detail || err.message));
        console.error('Erreur:', err);
      }
    }
  };

  // Gestion des services
  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      await serviceService.createService(serviceForm);
        await loadInitialData();
        setShowServiceModal(false);
        resetServiceForm();
    } catch (err) {
      setError('Erreur lors de la création du service: ' + (err.response?.data?.detail || err.message));
      console.error('Erreur:', err);
    }
  };

  // Fonctions utilitaires
  const resetUserForm = () => {
    setUserForm({
      username: '',
      email: '',
      prenom: '',
      nom: '',
      phone: '',
      photo_url: '',
      password: '',
      role_code: '',
      service_code: '',
      is_active: true,
      is_superuser: false
    });
  };

  const resetServiceForm = () => {
    setServiceForm({
      code: '',
      nom: ''
    });
  };

  const openEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      email: user.email,
      prenom: user.prenom,
      nom: user.nom,
      phone: user.phone || '',
      photo_url: user.photo_url || '',
      password: '',
      role_code: user.role?.code || '',
      service_code: user.service?.code || '',
      is_active: user.is_active,
      is_superuser: user.is_superuser || false
    });
    setShowUserModal(true);
  };

  // Configuration des colonnes pour la DataTable
  const columns = useMemo(() => [
    {
      name: 'Utilisateur',
      selector: row => `${row.prenom} ${row.nom}`,
      sortable: true,
      cell: (row) => (
        <div className="user-cell">
          <div className="user-avatar">
            {row.photo_url ? (
              <img 
                src={row.photo_url} 
                alt={row.username}
                onError={(e) => {
                  console.log('Erreur de chargement de l\'image:', row.photo_url);
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="avatar-placeholder" 
              style={{ display: row.photo_url ? 'none' : 'flex' }}
            >
              <User size={20} />
        </div>
      </div>
          <div className="user-info">
            <div className="user-name">{row.prenom} {row.nom}</div>
            <div className="user-username">@{row.username}</div>
          </div>
        </div>
      ),
      wrap: true
    },
    {
      name: 'Email',
      selector: row => row.email,
      sortable: true,
      cell: (row) => (
        <div className="email-cell" title={row.email}>
          <Mail size={16} />
          <span>{row.email}</span>
        </div>
      ),
      wrap: true
    },
    {
      name: 'Rôle',
      selector: row => row.role?.nom || 'Aucun rôle',
      sortable: true,
      cell: (row) => (
        row.role ? (
          <div className="role-badge" title={row.role.description || row.role.nom}>
            <Shield size={16} />
            {row.role.nom}
          </div>
        ) : (
          <span className="no-role">Aucun rôle</span>
        )
      ),
    },
    {
      name: 'Service',
      selector: row => row.service?.nom || 'Aucun service',
      sortable: true,
      cell: (row) => (
        row.service ? (
          <div className="service-badge">
            <Building2 size={16} />
            {row.service.nom}
          </div>
        ) : (
          <span className="no-service">Aucun service</span>
        )
      ),
    },
    {
      name: 'Statut',
      selector: row => row.is_active ? 'Actif' : 'Inactif',
      sortable: true,
      cell: (row) => (
        <span className={`status-badge ${row.is_active ? 'active' : 'inactive'}`}>
          {row.is_active ? (
            <>
              <Check size={16} />
              Actif
            </>
          ) : (
            <>
              <X size={16} />
              Inactif
            </>
          )}
        </span>
      ),
    },
    {
      name: 'Super Admin',
      selector: row => row.is_superuser ? 'Oui' : 'Non',
      sortable: true,
      cell: (row) => {
        return (
          <span className={`status-badge ${row.is_superuser ? 'superuser' : 'normal'}`}>
            {row.is_superuser ? (
              <>
                <Shield size={16} />
                Super Admin
              </>
            ) : (
              <>
                <User size={16} />
                Utilisateur
              </>
            )}
          </span>
        );
      }
    },
    {
      name: 'Actions',
      cell: (row) => (
        <div className="table-action-container">
          <button 
            className="table-action-btn table-action-btn-edit"
            onClick={() => openEditUser(row)}
            title="Modifier l'utilisateur"
            type="button"
          >
            <Edit size={14} color="white" />
          </button>
          <button 
            className="table-action-btn table-action-btn-delete"
            onClick={() => handleDeleteUser(row.id)}
            title="Supprimer l'utilisateur"
            type="button"
          >
            <Trash2 size={14} color="white" />
          </button>
        </div>
      ),
      ignoreRowClick: true
    }
  ], []);

  // Filtrage des utilisateurs
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesRole = !filterRole || user.role?.code === filterRole;
      const matchesService = !filterService || user.service?.code === filterService;
      const matchesStatus = filterStatus === '' || 
                           (filterStatus === 'active' && user.is_active) ||
                           (filterStatus === 'inactive' && !user.is_active);

      return matchesRole && matchesService && matchesStatus;
    });
  }, [users, filterRole, filterService, filterStatus]);

  // Composant de filtres personnalisés
  const customFilters = (
    <div className="custom-filters">
        <select 
          value={filterRole} 
          onChange={(e) => setFilterRole(e.target.value)}
          className="admin-form-select"
          style={{ minWidth: '200px' }}
        >
          <option value="">Tous les rôles</option>
          {roles.map(role => (
            <option key={role.id} value={role.code}>{role.nom}</option>
          ))}
        </select>

        <select 
          value={filterService} 
          onChange={(e) => setFilterService(e.target.value)}
          className="admin-form-select"
          style={{ minWidth: '200px' }}
        >
          <option value="">Tous les services</option>
          {services.map(service => (
            <option key={service.id} value={service.code}>{service.nom}</option>
          ))}
        </select>

        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="admin-form-select"
          style={{ minWidth: '150px' }}
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
        </select>
      </div>
  );

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
          <Users size={32} />
          <div>
            <h1>Gestion des Utilisateurs</h1>
            <p style={{ fontSize: '14px', color: '#ffffff', margin: '4px 0 0 0', fontWeight: 'normal' }}>Administration • Utilisateurs</p>
                  </div>
                    </div>
        <div className="admin-section-actions">
                    <button 
            className="admin-btn admin-btn-primary"
            onClick={() => {
              resetUserForm();
              setEditingUser(null);
              setShowUserModal(true);
            }}
          >
            <UserPlus size={20} />
            Nouvel Utilisateur
                    </button>
                    <button 
            className="admin-btn admin-btn-secondary"
            onClick={() => setShowServiceModal(true)}
                    >
            <Plus size={20} />
            Nouveau Service
                    </button>
                  </div>
      </div>

      {/* Statistiques */}
      {userStats && (
        <div className="stats-container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <Users size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{userStats.total_users}</div>
                <div className="stat-label">Utilisateurs total</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Check size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{userStats.active_today}</div>
                <div className="stat-label">Actifs aujourd'hui</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Building2 size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{Object.keys(userStats.par_service || {}).length}</div>
                <div className="stat-label">Services</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Shield size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{Object.keys(userStats.par_role || {}).length}</div>
                <div className="stat-label">Rôles</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DataTable des utilisateurs */}
      <div className="table-container">
        <CustomDataTable
          data={filteredUsers}
          columns={columns}
          title="Liste des utilisateurs"
          searchable={true}
          filterable={true}
          exportable={true}
          pagination={true}
          loading={loading}
          searchPlaceholder="Rechercher un utilisateur..."
          exportFileName="utilisateurs"
          customFilterComponent={customFilters}
          onRefresh={loadInitialData}
          noDataMessage="Aucun utilisateur trouvé"
        />
      </div>

      {/* Modale Utilisateur */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <UserPlus size={20} />
                {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h3>
              <button 
                className="modal-close"
                onClick={() => setShowUserModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      <User size={16} />
                      Nom d'utilisateur *
                    </label>
                    <input
                      type="text"
                      value={userForm.username}
                      onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                      required
                      disabled={editingUser}
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Mail size={16} />
                      Email *
                    </label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <User size={16} />
                      Prénom *
                    </label>
                    <input
                      type="text"
                      value={userForm.prenom}
                      onChange={(e) => setUserForm({...userForm, prenom: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <User size={16} />
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={userForm.nom}
                      onChange={(e) => setUserForm({...userForm, nom: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Phone size={16} />
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={userForm.phone}
                      onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Image size={16} />
                      Photo de profil
                    </label>
                    <PhotoUpload
                      value={userForm.photo_url}
                      onChange={(photoUrl) => setUserForm({...userForm, photo_url: photoUrl})}
                      maxSize={500}
                      className="photo-upload-field"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Key size={16} />
                      Mot de passe {editingUser ? '(laisser vide pour ne pas changer)' : '*'}
                    </label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                      required={!editingUser}
                      minLength={8}
                      placeholder="Minimum 8 caractères"
                    />
                    {!editingUser && (
                      <small className="form-help">
                        Le mot de passe doit contenir au moins 8 caractères
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>
                      <Shield size={16} />
                      Rôle
                    </label>
                    <select
                      value={userForm.role_code}
                      onChange={(e) => setUserForm({...userForm, role_code: e.target.value})}
                    >
                      <option value="">Sélectionner un rôle</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.code}>{role.nom}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      <Building2 size={16} />
                      Service
                    </label>
                    <select
                      value={userForm.service_code}
                      onChange={(e) => setUserForm({...userForm, service_code: e.target.value})}
                    >
                      <option value="">Sélectionner un service</option>
                      {services.map(service => (
                        <option key={service.id} value={service.code}>{service.nom}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={userForm.is_active}
                        onChange={(e) => setUserForm({...userForm, is_active: e.target.checked})}
                      />
                      <span className="checkmark"></span>
                      Compte actif
                    </label>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={userForm.is_superuser}
                        onChange={(e) => setUserForm({...userForm, is_superuser: e.target.checked})}
                      />
                      <span className="checkmark"></span>
                      Super administrateur
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  {editingUser ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale Service */}
      {showServiceModal && (
        <div className="modal-overlay" onClick={() => setShowServiceModal(false)}>
          <div className="modal-content service-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <Building2 size={20} />
                Nouveau Service
              </h3>
              <button 
                className="modal-close"
                onClick={() => setShowServiceModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateService}>
              <div className="modal-body">
                <div className="form-group">
                  <label>
                    <Building2 size={16} />
                    Code du service *
                  </label>
                  <input
                    type="text"
                    value={serviceForm.code}
                    onChange={(e) => setServiceForm({...serviceForm, code: e.target.value})}
                    required
                    placeholder="Ex: marketing, dsi, finance"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Building2 size={16} />
                    Nom du service *
                  </label>
                  <input
                    type="text"
                    value={serviceForm.nom}
                    onChange={(e) => setServiceForm({...serviceForm, nom: e.target.value})}
                    required
                    placeholder="Ex: Service Marketing, Direction des Systèmes d'Information"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowServiceModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  Créer le service
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

export default UserManagement;
