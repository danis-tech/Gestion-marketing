import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save,
  Edit,
  Plus,
  Calendar, 
  User, 
  Target, 
  FileText,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import './TaskAddModal.css';

const TaskEditModal = ({ isOpen, onClose, onEdit, task, projects = [] }) => {
  const [formData, setFormData] = useState({
    projet: '',
    titre: '',
    description: '',
    statut: 'en_attente',
    priorite: 'haut',
    phase: 'expression_besoin',
    debut: '',
    fin: '',
    assigne_a: [],
    tache_dependante: ''
  });
  const [assignedUsers, setAssignedUsers] = useState([{ id: '', user: null }]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [projectPhases, setProjectPhases] = useState([]);
  const [currentPhaseEtatId, setCurrentPhaseEtatId] = useState(null);

  // Charger les données de la tâche à modifier
  useEffect(() => {
    if (task && isOpen) {
      // Extraire l'ID du projet (peut être un objet ou un ID)
      let projetId = '';
      if (task.projet) {
        // Si c'est un objet avec un id
        if (typeof task.projet === 'object' && task.projet !== null) {
          if (task.projet.id !== undefined && task.projet.id !== null) {
            projetId = String(task.projet.id);
          }
        } 
        // Si c'est directement un nombre
        else if (typeof task.projet === 'number') {
          projetId = String(task.projet);
        } 
        // Si c'est une chaîne
        else if (typeof task.projet === 'string') {
          projetId = task.projet;
        }
      }
      // Vérifier aussi si projet_id existe directement
      if (!projetId && task.projet_id) {
        projetId = String(task.projet_id);
      }
      
      console.log('TaskEditModal - Projet extrait:', { 
        taskProjet: task.projet,
        projetId: task.projet_id,
        projetIdExtrait: projetId, 
        type: typeof task.projet,
        taskKeys: Object.keys(task)
      });
      
      // Extraire les IDs des assignés (peut être un tableau ou un objet unique)
      let assignesIds = [];
      if (task.assigne_a) {
        if (Array.isArray(task.assigne_a)) {
          // Si c'est un tableau d'objets ou d'IDs
          assignesIds = task.assigne_a.map(item => {
            if (typeof item === 'object' && item.id) {
              return String(item.id);
            }
            return String(item);
          });
        } else if (typeof task.assigne_a === 'object' && task.assigne_a.id) {
          assignesIds = [String(task.assigne_a.id)];
        } else if (typeof task.assigne_a === 'number' || typeof task.assigne_a === 'string') {
          assignesIds = [String(task.assigne_a)];
        }
      }
      
      // Créer les assignedUsers à partir des IDs
      const assignedUsersList = assignesIds.length > 0 
        ? assignesIds.map(id => ({ id, user: null }))
        : [{ id: '', user: null }];
      
      // Extraire l'ID de la tâche dépendante
      let dependanceId = '';
      if (task.tache_dependante) {
        if (typeof task.tache_dependante === 'object' && task.tache_dependante.id) {
          dependanceId = task.tache_dependante.id;
        } else if (typeof task.tache_dependante === 'number' || typeof task.tache_dependante === 'string') {
          dependanceId = task.tache_dependante;
        }
      }
      
      // Extraire le phase_etat_id de la tâche
      let phaseEtatId = null;
      if (task.phase_etat) {
        if (typeof task.phase_etat === 'object' && task.phase_etat.id) {
          phaseEtatId = task.phase_etat.id;
        } else if (typeof task.phase_etat === 'number') {
          phaseEtatId = task.phase_etat;
        }
      }
      // Vérifier aussi phase_etat_id directement
      if (!phaseEtatId && task.phase_etat_id) {
        phaseEtatId = task.phase_etat_id;
      }
      setCurrentPhaseEtatId(phaseEtatId);
      
      setFormData({
        projet: projetId,
        titre: task.titre || '',
        description: task.description || '',
        statut: task.statut || 'en_attente',
        priorite: task.priorite || 'haut',
        phase: task.phase || 'expression_besoin',
        debut: task.debut || '',
        fin: task.fin || '',
        assigne_a: assignesIds,
        tache_dependante: dependanceId
      });
      setAssignedUsers(assignedUsersList);
    }
  }, [task, isOpen]);

  // Charger les utilisateurs disponibles
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/accounts/users/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const users = await response.json();
          setAvailableUsers(users);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
      }
    };

    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  // Charger les phases d'état du projet et les tâches disponibles
  useEffect(() => {
    const loadProjectData = async () => {
      if (!formData.projet) {
        setAvailableTasks([]);
        setProjectPhases([]);
        return;
      }

      try {
        // Charger les phases d'état du projet
        const phasesResponse = await fetch(`http://localhost:8000/api/projects/${formData.projet}/phases/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (phasesResponse.ok) {
          const phasesData = await phasesResponse.json();
          // Gérer différents formats de réponse (liste directe ou paginée)
          const phases = Array.isArray(phasesData) ? phasesData : (phasesData.results || phasesData.data || []);
          console.log('Phases chargées pour le projet:', phases);
          setProjectPhases(phases);
        } else {
          console.error('Erreur API phases:', phasesResponse.status, phasesResponse.statusText);
          const errorText = await phasesResponse.text();
          console.error('Détails de l\'erreur:', errorText);
        }

        // Charger les tâches du projet
        const tasksResponse = await fetch(`http://localhost:8000/api/taches/projet_taches/?projet_id=${formData.projet}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (tasksResponse.ok) {
          const tasks = await tasksResponse.json();
          // Exclure la tâche actuelle de la liste des dépendances
          const filteredTasks = tasks.filter(t => t.id !== task?.id);
          setAvailableTasks(filteredTasks);
        } else {
          console.error('Erreur API tâches:', tasksResponse.status, tasksResponse.statusText);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données du projet:', error);
      }
    };

    loadProjectData();
  }, [formData.projet, task?.id]);

  // Gestion des changements de champs
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Réinitialiser les champs dépendants
    if (field === 'projet') {
      setFormData(prev => ({
        ...prev,
        tache_dependante: ''
      }));
    }
  };

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};

    if (!formData.projet || formData.projet === '') {
      newErrors.projet = 'Le projet est requis';
    }

    if (!formData.titre?.trim()) {
      newErrors.titre = 'Le titre de la tâche est requis';
    }

    if (!formData.phase?.trim()) {
      newErrors.phase = 'La phase est requise';
    }

    if (formData.debut && formData.fin && new Date(formData.debut) > new Date(formData.fin)) {
      newErrors.fin = 'La date de fin doit être postérieure à la date de début';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Préparer les données pour l'API
      // Filtrer les assignés vides et ne garder que les IDs (convertis en entiers)
      const assignesIds = assignedUsers
        .filter(item => item.id && item.id !== '')
        .map(item => parseInt(item.id, 10))
        .filter(id => !isNaN(id));
      
      // Trouver le phase_etat_id correspondant à la phase métier sélectionnée
      let phaseEtatId = currentPhaseEtatId;
      
      // Mapping des phases métier vers les noms de phases
      const phaseMapping = {
        'expression_besoin': 'Expression du besoin',
        'etudes_faisabilite': 'Études de faisabilité',
        'conception': 'Conception',
        'developpement': 'Développement / Implémentation',
        'lancement_commercial': 'Lancement commercial',
        'suppression_offre': "Suppression d'une offre"
      };
      
      const phaseNom = phaseMapping[formData.phase];
      console.log('Recherche de phase_etat_id:', { phaseNom, projectPhases, formDataPhase: formData.phase, currentPhaseEtatId });
      
      if (phaseNom && projectPhases.length > 0) {
        // Les phases peuvent être dans un format de liste ou directement
        const phasesList = Array.isArray(projectPhases) ? projectPhases : (projectPhases.results || []);
        console.log('Liste des phases à rechercher:', phasesList);
        
        const matchingPhase = phasesList.find(p => {
          const nom = p.nom || p.phase?.nom;
          console.log('Comparaison:', { nom, phaseNom, match: nom === phaseNom });
          return nom === phaseNom;
        });
        
        if (matchingPhase) {
          phaseEtatId = matchingPhase.id;
          console.log('Phase_etat_id trouvé:', phaseEtatId);
        } else {
          console.warn('Aucune phase correspondante trouvée. Phases disponibles:', phasesList.map(p => p.nom || p.phase?.nom));
        }
      } else {
        console.warn('Phases non disponibles ou phaseNom manquant:', { phaseNom, projectPhasesLength: projectPhases.length });
      }
      
      // Si on n'a toujours pas de phase_etat_id, utiliser celui de la tâche actuelle
      if (!phaseEtatId && currentPhaseEtatId) {
        phaseEtatId = currentPhaseEtatId;
        console.log('Utilisation du phase_etat_id de la tâche actuelle:', phaseEtatId);
      }
      
      // Si toujours pas de phase_etat_id, c'est une erreur
      if (!phaseEtatId) {
        const errorMsg = projectPhases.length === 0 
          ? 'Les phases du projet ne sont pas encore chargées. Veuillez attendre un instant et réessayer.'
          : `Impossible de trouver la phase d'état pour "${phaseNom}". Veuillez sélectionner un projet et une phase valides.`;
        throw new Error(errorMsg);
      }
      
      const dataToSave = {
        ...formData,
        // Envoyer les IDs pour les ForeignKey (Django attend des IDs, pas des objets)
        projet: parseInt(formData.projet) || null,
        debut: formData.debut || null,
        fin: formData.fin || null,
        // Envoyer le phase_etat_id requis par le backend
        phase_etat_id: phaseEtatId,
        // Envoyer les IDs pour les assignés (ManyToMany)
        assigne_a: assignesIds.length > 0 ? assignesIds : [],
        tache_dependante: formData.tache_dependante ? parseInt(formData.tache_dependante) : null
      };

      console.log('Données envoyées à l\'API:', dataToSave);

      await onEdit(task.id, dataToSave);
      
      // Fermer le modal après modification
      onClose();
      
    } catch (error) {
      console.error('❌ Erreur lors de la modification de la tâche:', error);
      // Afficher le message d'erreur du serveur si disponible
      let errorMessage = 'Erreur lors de la modification de la tâche';
      if (error.response?.data) {
        console.error('Détails de l\'erreur:', error.response.data);
        // Extraire les messages d'erreur du serveur
        if (typeof error.response.data === 'object') {
          const errorDetails = Object.entries(error.response.data)
            .map(([key, value]) => {
              if (Array.isArray(value)) {
                return `${key}: ${value.join(', ')}`;
              }
              return `${key}: ${value}`;
            })
            .join('; ');
          errorMessage = errorDetails || errorMessage;
        } else {
          errorMessage = error.response.data || errorMessage;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fermer le modal
  const handleClose = () => {
    if (!isSubmitting) {
      setErrors({});
      onClose();
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="task-add-modal-overlay" onClick={handleClose}>
      <div className="task-add-modal-content" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="task-add-modal-header">
          <div className="task-add-modal-title">
            <Edit className="task-add-modal-icon" />
            Modifier la tâche
          </div>
          <button
            className="task-add-modal-close"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="task-add-modal-body">
          <form onSubmit={handleSubmit}>
            
            {/* Informations principales */}
            <div className="form-section">
              <h3 className="form-section-title">
                <FileText className="w-5 h-5" />
                Informations principales
              </h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Projet *</label>
                  <select
                    className={`form-select ${errors.projet ? 'form-input-error' : ''}`}
                    value={formData.projet}
                    onChange={(e) => handleInputChange('projet', e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="">Sélectionner un projet</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.code} - {project.nom}
                      </option>
                    ))}
                  </select>
                  {errors.projet && <span className="form-error">{errors.projet}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Titre de la tâche *</label>
                  <input
                    type="text"
                    className={`form-input ${errors.titre ? 'form-input-error' : ''}`}
                    value={formData.titre}
                    onChange={(e) => handleInputChange('titre', e.target.value)}
                    placeholder="Titre de la tâche"
                    disabled={isSubmitting}
                  />
                  {errors.titre && <span className="form-error">{errors.titre}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className={`form-textarea ${errors.description ? 'form-input-error' : ''}`}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Description détaillée de la tâche"
                    rows="3"
                    disabled={isSubmitting}
                  />
                  {errors.description && <span className="form-error">{errors.description}</span>}
                </div>
              </div>
            </div>

            {/* Statut et priorité */}
            <div className="form-section">
              <h3 className="form-section-title">
                <AlertCircle className="w-5 h-5" />
                Statut et priorité
              </h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Statut</label>
                  <select
                    className="form-select"
                    value={formData.statut}
                    onChange={(e) => handleInputChange('statut', e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="en_attente">En attente</option>
                    <option value="en_cours">En cours</option>
                    <option value="termine">Terminé</option>
                    <option value="hors_delai">Hors délai</option>
                    <option value="rejete">Rejeté</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priorité</label>
                  <select
                    className="form-select"
                    value={formData.priorite}
                    onChange={(e) => handleInputChange('priorite', e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="haut">Haute</option>
                    <option value="moyen">Moyenne</option>
                    <option value="intermediaire">Intermédiaire</option>
                    <option value="bas">Basse</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Phase *</label>
                  <select
                    className={`form-select ${errors.phase ? 'form-input-error' : ''}`}
                    value={formData.phase}
                    onChange={(e) => handleInputChange('phase', e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="expression_besoin">Expression du besoin</option>
                    <option value="etudes_faisabilite">Études de faisabilité</option>
                    <option value="conception">Conception</option>
                    <option value="developpement">Développement / Implémentation</option>
                    <option value="lancement_commercial">Lancement commercial</option>
                    <option value="suppression_offre">Suppression d'une offre</option>
                  </select>
                  {errors.phase && <span className="form-error">{errors.phase}</span>}
                </div>
              </div>
            </div>

            {/* Dates et estimation */}
            <div className="form-section">
              <h3 className="form-section-title">
                <Calendar className="w-5 h-5" />
                Dates et estimation
              </h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Date de début</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.debut}
                    onChange={(e) => handleInputChange('debut', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Date de fin</label>
                  <input
                    type="date"
                    className={`form-input ${errors.fin ? 'form-input-error' : ''}`}
                    value={formData.fin}
                    onChange={(e) => handleInputChange('fin', e.target.value)}
                    disabled={isSubmitting}
                  />
                  {errors.fin && <span className="form-error">{errors.fin}</span>}
                </div>
              </div>
            </div>

            {/* Assignation et dépendances */}
            <div className="form-section">
              <h3 className="form-section-title">
                <User className="w-5 h-5" />
                Assignation et dépendances
              </h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Assigné à</label>
                  <div className="assigned-users-container">
                    {assignedUsers.map((assigned, index) => {
                      // Récupérer les IDs déjà sélectionnés (sauf celui en cours)
                      const selectedIds = assignedUsers
                        .map((a, i) => i !== index ? a.id : null)
                        .filter(id => id && id !== '');
                      
                      // Filtrer les utilisateurs disponibles (exclure ceux déjà sélectionnés)
                      const availableUsersForSelect = availableUsers.filter(
                        user => !selectedIds.includes(String(user.id))
                      );
                      
                      return (
                        <div key={index} className="assigned-user-row">
                          <select
                            className="form-select"
                            value={assigned.id}
                            onChange={(e) => {
                              const newAssigned = [...assignedUsers];
                              const selectedUser = availableUsers.find(u => String(u.id) === e.target.value);
                              newAssigned[index] = {
                                id: e.target.value,
                                user: selectedUser || null
                              };
                              setAssignedUsers(newAssigned);
                            }}
                            disabled={isSubmitting}
                          >
                            <option value="">Non assigné</option>
                            {availableUsersForSelect.map(user => (
                              <option key={user.id} value={user.id}>
                                {user.prenom || user.username} {user.nom || ''}
                              </option>
                            ))}
                          </select>
                          {assignedUsers.length > 1 && (
                            <button
                              type="button"
                              className="remove-assigned-btn"
                              onClick={() => {
                                const newAssigned = assignedUsers.filter((_, i) => i !== index);
                                setAssignedUsers(newAssigned);
                              }}
                              disabled={isSubmitting}
                              title="Supprimer cet assigné"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      className="add-assigned-btn"
                      onClick={() => {
                        setAssignedUsers([...assignedUsers, { id: '', user: null }]);
                      }}
                      disabled={isSubmitting}
                      title="Ajouter un autre assigné"
                    >
                      <Plus size={16} />
                      Ajouter un assigné
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tâche dépendante</label>
                  <select
                    className="form-select"
                    value={formData.tache_dependante}
                    onChange={(e) => handleInputChange('tache_dependante', e.target.value)}
                    disabled={!formData.projet || isSubmitting}
                  >
                    <option value="">Aucune dépendance</option>
                    {availableTasks.map(task => (
                      <option key={task.id} value={task.id}>
                        {task.titre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Erreur générale */}
            {errors.submit && (
              <div className="form-error-general">
                <AlertCircle className="w-5 h-5" />
                {errors.submit}
              </div>
            )}

            {/* Boutons d'action */}
            <div className="task-add-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Annuler
              </button>
              
              <button
                type="submit"
                className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Modification...' : (
                  <>
                    <Edit className="w-4 h-4" />
                    Modifier la tâche
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskEditModal;
