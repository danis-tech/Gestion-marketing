import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  UserPlus, 
  Settings,
  Trash2,
  Edit3,
  Eye,
  UserCheck,
  UserX
} from 'lucide-react';
import { projectsService, teamService, userService } from '../../services/apiService';
import './TeamManagement.css';

const TeamManagement = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // États pour le drag & drop
  const [draggedMember, setDraggedMember] = useState(null);
  const [dragOverProject, setDragOverProject] = useState(null);

  useEffect(() => {
    loadProjects();
    loadAvailableUsers();
    loadAvailableServices();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadTeamMembers(selectedProject.id);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      
      const response = await projectsService.getProjects();
      
      // Vérifier la structure de la réponse
      const projectsData = response.data || response.results || response || [];
      
      setProjects(projectsData);
      
      if (projectsData.length > 0) {
        setSelectedProject(projectsData[0]);
      }
    } catch (error) {
      // Gestion silencieuse de l'erreur
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamMembers = async (projectId) => {
    try {
      const data = await teamService.getProjectMembers(projectId);
      const members = data.results || data.data || data || [];
      setTeamMembers(members);
      
      // Mettre à jour le nombre de membres dans le projet sélectionné
      if (selectedProject && selectedProject.id === projectId) {
        setProjects(prevProjects => 
          prevProjects.map(project => 
            project.id === projectId 
              ? { ...project, nombre_membres: members.length }
              : project
          )
        );
      }
    } catch (error) {
      // Gestion silencieuse de l'erreur
    }
  };

  // Filtrer les utilisateurs déjà membres du projet sélectionné
  const getAvailableUsersForProject = () => {
    if (!selectedProject) return availableUsers;
    
    const memberUserIds = teamMembers.map(member => member.utilisateur.id);
    return availableUsers.filter(user => !memberUserIds.includes(user.id));
  };

  const loadAvailableUsers = async () => {
    try {
      const data = await userService.getUsers();
      
      // Vérifier la structure de la réponse
      const users = data.results || data.data || data || [];
      setAvailableUsers(users);
    } catch (error) {
      // Gestion silencieuse de l'erreur
    }
  };

  const loadAvailableServices = async () => {
    try {
      const data = await userService.getServices();
      
      // Vérifier la structure de la réponse
      const services = data.results || data.data || data || [];
      setAvailableServices(services);
    } catch (error) {
      // Gestion silencieuse de l'erreur
    }
  };

  // Gestion du drag & drop
  const handleDragStart = (e, member) => {
    setDraggedMember(member);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, project) => {
    e.preventDefault();
    setDragOverProject(project);
  };

  const handleDragLeave = () => {
    setDragOverProject(null);
  };

  const handleDrop = async (e, targetProject) => {
    e.preventDefault();
    
    if (draggedMember && targetProject && draggedMember.projet !== targetProject.id) {
      try {
        // Préparer les données pour l'API
        const dragData = {
          utilisateur: draggedMember.utilisateur.id,
          service: draggedMember.service?.id,
          role_projet: draggedMember.role_projet,
          ajoute_le: draggedMember.ajoute_le
        };
        
        // Ajouter le membre au nouveau projet
        await teamService.addProjectMember(targetProject.id, dragData);
        
        // Supprimer le membre de l'ancien projet SEULEMENT si l'ajout a réussi
        await teamService.deleteProjectMember(draggedMember.projet, draggedMember.id);

        // Recharger les équipes
        await loadTeamMembers(selectedProject.id);
        if (targetProject.id !== selectedProject.id) {
          await loadTeamMembers(targetProject.id);
        }
        
        // Mettre à jour la liste des projets pour refléter les changements
        await loadProjects();
        
        // Afficher un message de succès
        alert(`Membre déplacé avec succès vers le projet "${targetProject.nom}"`);
        
      } catch (error) {
        // Gérer l'erreur métier et informer l'utilisateur
        if (error.response?.data?.non_field_errors) {
          const errorMessage = error.response.data.non_field_errors[0];
          alert(`Impossible de déplacer le membre : ${errorMessage}`);
        } else {
          alert('Erreur lors du déplacement du membre. Veuillez réessayer.');
        }
      }
    }
    
    setDraggedMember(null);
    setDragOverProject(null);
  };

  const handleDeleteMember = async (memberId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce membre de l\'équipe ?')) {
      try {
        await teamService.deleteProjectMember(selectedProject.id, memberId);
        await loadTeamMembers(selectedProject.id);
        
        // Mettre à jour la liste des projets pour refléter les changements
        await loadProjects();
      } catch (error) {
        // Gestion silencieuse de l'erreur
      }
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || project.statut === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="team-management-loading">
        <div className="loading-spinner"></div>
        <p>Chargement des projets...</p>
      </div>
    );
  }



  return (
    <div className="team-management">
      {/* Header */}
      <div className="team-header">
        <div className="header-left">
          <h1 className="page-title">
            <Users className="title-icon" />
            Gestion des Équipes
          </h1>
          <p className="page-subtitle">
            Organisez et gérez les équipes de vos projets
          </p>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddMemberModal(true)}
          >
            <UserPlus className="btn-icon" />
            Ajouter un membre
          </button>
        </div>
      </div>

             

       {/* Filtres et recherche */}
       <div className="filters-section">
         <div className="search-box">
           <Search className="search-icon" />
           <input
             type="text"
             placeholder="Rechercher un projet..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="search-input"
           />
         </div>
         
         <div className="filter-controls">
           <select
             value={filterStatus}
             onChange={(e) => setFilterStatus(e.target.value)}
             className="filter-select"
           >
             <option value="all">Tous les statuts</option>
             <option value="en_attente">En attente</option>
             <option value="termine">Terminé</option>
             <option value="hors_delai">Hors délai</option>
             <option value="rejete">Rejeté</option>
           </select>
         </div>
       </div>

      {/* Contenu principal */}
      <div className="team-content">
        {/* Liste des projets */}
        <div className="projects-list">
          <h3 className="section-title">Projets</h3>
          <div className="projects-grid">
            {filteredProjects.map(project => (
              <div
                key={project.id}
                className={`project-card ${selectedProject?.id === project.id ? 'selected' : ''} ${dragOverProject?.id === project.id ? 'drag-over' : ''}`}
                onClick={() => setSelectedProject(project)}
                onDragOver={(e) => handleDragOver(e, project)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, project)}
              >
                <div className="project-header">
                  <div className="project-code">{project.code}</div>
                  <div className={`project-status status-${project.statut}`}>
                    {project.statut}
                  </div>
                </div>
                
                <h4 className="project-name">{project.nom}</h4>
                <p className="project-description">{project.description}</p>
                
                <div className="project-meta">
                  <div className="project-owner">
                    <span className="label">Propriétaire:</span>
                    <span className="value">{project.proprietaire?.prenom} {project.proprietaire?.nom}</span>
                  </div>
                  <div className="project-members">
                    <span className="label">Membres:</span>
                    <span className="value">{project.nombre_membres || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Équipe du projet sélectionné */}
        {selectedProject && (
          <div className="team-details">
            <div className="team-header-details">
              <h3 className="section-title">
                Équipe du projet: {selectedProject.code}
              </h3>
              <div className="team-stats">
                <span className="stat-item">
                  <Users className="stat-icon" />
                  {teamMembers.length} membres
                </span>
              </div>
            </div>

            <div className="team-members-grid">
              {teamMembers.map(member => (
                <div
                  key={member.id}
                  className="member-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, member)}
                >
                  <div className="member-avatar">
                    {member.utilisateur.prenom?.[0] || member.utilisateur.username?.[0]}
                  </div>
                  
                  <div className="member-info">
                    <h4 className="member-name">
                      {member.utilisateur.prenom} {member.utilisateur.nom}
                    </h4>
                    <p className="member-username">@{member.utilisateur.username}</p>
                    <div className="member-role">{member.role_projet}</div>
                    {member.service && (
                      <div className="member-service">{member.service.nom}</div>
                    )}
                  </div>
                  
                  <div className="member-actions">
                    <button 
                      className="action-btn edit"
                      onClick={() => {
                        setEditingMember(member);
                        setShowEditMemberModal(true);
                      }}
                    >
                      <Edit3 className="action-icon" />
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDeleteMember(member.id)}
                    >
                      <Trash2 className="action-icon" />
                    </button>
                  </div>
                </div>
              ))}
              
              {teamMembers.length === 0 && (
                <div className="empty-team">
                  <Users className="empty-icon" />
                  <p>Aucun membre dans cette équipe</p>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowAddMemberModal(true)}
                  >
                    Ajouter le premier membre
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal d'ajout de membre */}
      {showAddMemberModal && (
        <AddMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          project={selectedProject}
          availableUsers={getAvailableUsersForProject()}
          availableServices={availableServices}
          onMemberAdded={loadTeamMembers}
          loadProjects={loadProjects}
        />
      )}

      {/* Modal d'édition de membre */}
      {showEditMemberModal && editingMember && (
        <EditMemberModal
          isOpen={showEditMemberModal}
          onClose={() => setShowEditMemberModal(false)}
          member={editingMember}
          project={selectedProject}
          availableServices={availableServices}
          onMemberUpdated={loadTeamMembers}
          loadProjects={loadProjects}
        />
      )}
    </div>
  );
};

// Composant Modal pour ajouter un membre
const AddMemberModal = ({ isOpen, onClose, project, availableUsers, availableServices, onMemberAdded, loadProjects }) => {
  const [formData, setFormData] = useState({
    utilisateur: '',
    service: '',
    role_projet: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      // S'assurer que tous les champs requis sont présents
      const memberData = {
        utilisateur: parseInt(formData.utilisateur), // Convertir en nombre
        service: formData.service ? parseInt(formData.service) : null, // Convertir en nombre ou null
        role_projet: formData.role_projet
        // Ne pas inclure projet car il est déjà dans l'URL
      };
      
      await teamService.addProjectMember(project.id, memberData);
      
      onMemberAdded(project.id);
      onClose();
      setFormData({ utilisateur: '', service: '', role_projet: '' });
      
      // Mettre à jour la liste des projets pour refléter les changements
      await loadProjects();
    } catch (error) {
      // Gérer les erreurs spécifiques
      if (error.response?.data?.utilisateur) {
        setError('Cet utilisateur est déjà membre de ce projet.');
      } else if (error.response?.data?.non_field_errors) {
        setError(error.response.data.non_field_errors[0]);
      } else if (error.response?.data) {
        // Afficher toutes les erreurs de validation
        const errorMessages = Object.entries(error.response.data)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('\n');
        setError(`Erreurs de validation:\n${errorMessages}`);
      } else {
        setError('Erreur lors de l\'ajout du membre. Veuillez réessayer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Ajouter un membre à l'équipe</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Affichage des erreurs */}
          {error && (
            <div className="error-message" style={{color: '#dc2626', backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', border: '1px solid #fecaca'}}>
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label>Utilisateur</label>
            <select
              value={formData.utilisateur}
              onChange={(e) => setFormData({...formData, utilisateur: e.target.value})}
              required
            >
              <option value="">Sélectionner un utilisateur</option>
              {availableUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.prenom} {user.nom} (@{user.username})
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Service</label>
            <select
              value={formData.service}
              onChange={(e) => {
                setFormData({...formData, service: e.target.value});
              }}
            >
              <option value="">Aucun service</option>
              {availableServices.map(service => (
                <option key={service.id} value={service.id}>
                  {service.nom} ({service.code})
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Rôle dans le projet</label>
            <input
              type="text"
              value={formData.role_projet}
              onChange={(e) => setFormData({...formData, role_projet: e.target.value})}
              placeholder="ex: Développeur, Designer, Chef de projet..."
              required
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Ajout en cours...' : 'Ajouter le membre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Composant Modal pour éditer un membre
const EditMemberModal = ({ isOpen, onClose, member, project, availableServices, onMemberUpdated, loadProjects }) => {
  const [formData, setFormData] = useState({
    service: member.service?.id || '',
    role_projet: member.role_projet
  });

  useEffect(() => {
    setFormData({
      service: member.service?.id || '',
      role_projet: member.role_projet || ''
    });
  }, [member]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // S'assurer que tous les champs requis sont présents
      const updateData = {
        ...formData,
        utilisateur: member.utilisateur.id, // Inclure l'utilisateur
        projet: project.id // Inclure le projet
      };
      
      await teamService.updateProjectMember(project.id, member.id, updateData);
      
      onMemberUpdated(project.id);
      onClose();
      
      // Mettre à jour la liste des projets pour refléter les changements
      await loadProjects();
    } catch (error) {
      // Gestion silencieuse de l'erreur
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Modifier le membre</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Utilisateur</label>
            <input
              type="text"
              value={`${member.utilisateur.prenom} ${member.utilisateur.nom}`}
              disabled
              className="disabled-input"
            />
          </div>
          
          <div className="form-group">
            <label>Service</label>
            <select
              value={formData.service}
              onChange={(e) => {
                setFormData({...formData, service: e.target.value});
              }}
            >
              <option value="">Aucun service</option>
              {availableServices.map(service => (
                <option key={service.id} value={service.id}>
                  {service.nom} ({service.code})
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Rôle dans le projet</label>
            <input
              type="text"
              value={formData.role_projet}
              onChange={(e) => setFormData({...formData, role_projet: e.target.value})}
              placeholder="ex: Développeur, Designer, Chef de projet..."
              required
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              Modifier le membre
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamManagement;
