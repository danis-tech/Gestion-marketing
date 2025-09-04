import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save,
  Edit,
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
    phase: 'conception',
    debut: '',
    fin: '',
    assigne_a: '',
    tache_dependante: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);

  // Charger les données de la tâche à modifier
  useEffect(() => {
    if (task && isOpen) {
      // Extraire l'ID du projet (peut être un objet ou un ID)
      let projetId = '';
      if (task.projet) {
        if (typeof task.projet === 'object' && task.projet.id) {
          projetId = task.projet.id;
        } else if (typeof task.projet === 'number' || typeof task.projet === 'string') {
          projetId = task.projet;
        }
      }
      
      // Extraire l'ID de l'assigné
      let assigneId = '';
      if (task.assigne_a) {
        if (typeof task.assigne_a === 'object' && task.assigne_a.id) {
          assigneId = task.assigne_a.id;
        } else if (typeof task.assigne_a === 'number' || typeof task.assigne_a === 'string') {
          assigneId = task.assigne_a;
        }
      }
      
      // Extraire l'ID de la tâche dépendante
      let dependanceId = '';
      if (task.tache_dependante) {
        if (typeof task.tache_dependante === 'object' && task.tache_dependante.id) {
          dependanceId = task.tache_dependante.id;
        } else if (typeof task.tache_dependante === 'number' || typeof task.tache_dependante === 'string') {
          dependanceId = task.tache_dependante;
        }
      }
      
      setFormData({
        projet: projetId,
        titre: task.titre || '',
        description: task.description || '',
        statut: task.statut || 'en_attente',
        priorite: task.priorite || 'haut',
        phase: task.phase || 'conception',
        debut: task.debut || '',
        fin: task.fin || '',
        assigne_a: assigneId,
        tache_dependante: dependanceId
      });
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

  // Charger les tâches disponibles quand un projet est sélectionné
  useEffect(() => {
    const loadTasks = async () => {
      if (!formData.projet) {
        setAvailableTasks([]);
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/api/taches/projet_taches/?projet_id=${formData.projet}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const tasks = await response.json();
          // Exclure la tâche actuelle de la liste des dépendances
          const filteredTasks = tasks.filter(t => t.id !== task?.id);
          setAvailableTasks(filteredTasks);
        } else {
          console.error('Erreur API:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des tâches:', error);
      }
    };

    loadTasks();
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
      const dataToSave = {
        ...formData,
        // Envoyer les IDs pour les ForeignKey (Django attend des IDs, pas des objets)
        projet: parseInt(formData.projet) || null,
        debut: formData.debut || null,
        fin: formData.fin || null,
        // Envoyer les IDs pour les ForeignKey
        assigne_a: formData.assigne_a ? parseInt(formData.assigne_a) : null,
        tache_dependante: formData.tache_dependante ? parseInt(formData.tache_dependante) : null
      };



      await onEdit(task.id, dataToSave);
      
      // Fermer le modal après modification
      onClose();
      
    } catch (error) {
      console.error('❌ Erreur lors de la modification de la tâche:', error);
      setErrors({ submit: 'Erreur lors de la modification de la tâche' });
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
                    <option value="conception">Conception</option>
                    <option value="build">Build</option>
                    <option value="uat">UAT</option>
                    <option value="lancement">Lancement</option>
                    <option value="suivi">Suivi</option>
                    <option value="fin_de_vie">Fin de vie</option>
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
                  <select
                    className="form-select"
                    value={formData.assigne_a}
                    onChange={(e) => handleInputChange('assigne_a', e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="">Non assigné</option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.prenom || user.username} {user.nom || ''}
                      </option>
                    ))}
                  </select>
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
