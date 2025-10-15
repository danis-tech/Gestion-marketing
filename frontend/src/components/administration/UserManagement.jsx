import React, { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
import './UserManagement.css';

const UserManagement = () => {
  // États principaux
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [services, setServices] = useState([]);
  const [permissions, setPermissions] = useState([]);
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
    password: '',
    role_code: '',
    service_code: '',
    is_active: true
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
      const [usersRes, rolesRes, servicesRes, permissionsRes] = await Promise.all([
        fetch('/api/accounts/users/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/accounts/roles/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/accounts/services/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/accounts/permissions/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.results || usersData);
      }

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(rolesData.results || rolesData);
      }

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData.results || servicesData);
      }

      if (permissionsRes.ok) {
        const permissionsData = await permissionsRes.json();
        setPermissions(permissionsData.results || permissionsData);
      }

    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Gestion des utilisateurs
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/accounts/users/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userForm)
      });

      if (response.ok) {
        await loadInitialData();
        setShowUserModal(false);
        resetUserForm();
      } else {
        const errorData = await response.json();
        setError('Erreur lors de la création de l\'utilisateur: ' + JSON.stringify(errorData));
      }
    } catch (err) {
      setError('Erreur lors de la création de l\'utilisateur');
      console.error('Erreur:', err);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/accounts/users/${editingUser.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userForm)
      });

      if (response.ok) {
        await loadInitialData();
        setShowUserModal(false);
        setEditingUser(null);
        resetUserForm();
      } else {
        const errorData = await response.json();
        setError('Erreur lors de la mise à jour de l\'utilisateur: ' + JSON.stringify(errorData));
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour de l\'utilisateur');
      console.error('Erreur:', err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        const response = await fetch(`/api/accounts/users/${userId}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          await loadInitialData();
        } else {
          setError('Erreur lors de la suppression de l\'utilisateur');
        }
      } catch (err) {
        setError('Erreur lors de la suppression de l\'utilisateur');
        console.error('Erreur:', err);
      }
    }
  };

  // Gestion des services
  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/accounts/services/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(serviceForm)
      });

      if (response.ok) {
        await loadInitialData();
        setShowServiceModal(false);
        resetServiceForm();
      } else {
        const errorData = await response.json();
        setError('Erreur lors de la création du service: ' + JSON.stringify(errorData));
      }
    } catch (err) {
      setError('Erreur lors de la création du service');
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
      password: '',
      role_code: '',
      service_code: '',
      is_active: true
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
      password: '',
      role_code: user.role?.code || '',
      service_code: user.service?.code || '',
      is_active: user.is_active
    });
    setShowUserModal(true);
  };

  // Filtrage des utilisateurs
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.nom.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !filterRole || user.role?.code === filterRole;
    const matchesService = !filterService || user.service?.code === filterService;
    const matchesStatus = filterStatus === '' || 
                         (filterStatus === 'active' && user.is_active) ||
                         (filterStatus === 'inactive' && !user.is_active);

    return matchesSearch && matchesRole && matchesService && matchesStatus;
  });

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
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0', fontWeight: 'normal' }}>Administration • Utilisateurs</p>
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

      {/* Filtres et recherche */}
      <div className="admin-search-container">
        <div className="admin-search-box">
          <Search className="admin-search-icon" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-search-input"
          />
        </div>
        
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

      {/* Tableau des utilisateurs */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Service</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.photo_url ? (
                        <img src={user.photo_url} alt={user.username} />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                    <div className="user-details">
                      <div className="user-name">{user.prenom} {user.nom}</div>
                      <div className="user-username">@{user.username}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="email-cell">
                    <Mail size={16} />
                    {user.email}
                  </div>
                </td>
                <td>
                  {user.role ? (
                    <div className="role-badge">
                      <Shield size={16} />
                      {user.role.nom}
                    </div>
                  ) : (
                    <span className="no-role">Aucun rôle</span>
                  )}
                </td>
                <td>
                  {user.service ? (
                    <div className="service-badge">
                      <Building2 size={16} />
                      {user.service.nom}
                    </div>
                  ) : (
                    <span className="no-service">Aucun service</span>
                  )}
                </td>
                <td>
                  <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                    {user.is_active ? (
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
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn-icon btn-edit"
                      onClick={() => openEditUser(user)}
                      title="Modifier"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="btn-icon btn-delete"
                      onClick={() => handleDeleteUser(user.id)}
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                      <Key size={16} />
                      Mot de passe {editingUser ? '(laisser vide pour ne pas changer)' : '*'}
                    </label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                      required={!editingUser}
                    />
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
