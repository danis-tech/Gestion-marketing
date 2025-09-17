import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save,
  Edit3,
  Calendar, 
  User, 
  DollarSign, 
  Target, 
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { userService } from '../../services/apiService';
import './ProjectEditModal.css';

const ProjectEditModal = ({ project, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nom: '',
    code: '',
    proprietaire: '',
    description: '',
    objectif: '',
    budget: '',
    type: '',
    statut: 'en_attente',
    priorite: 'haut',
    etat: 'Off', // Par défaut inactif
    debut: '',
    fin: '',
    estimation_jours: '',
    nom_createur: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);

  // Initialiser le formulaire avec les données du projet et charger les utilisateurs
  useEffect(() => {
    if (project) {
      // S'assurer que tous les champs ont des valeurs définies (pas undefined)
      setFormData({
        nom: project.nom ?? '',
        code: project.code ?? '',
        proprietaire: project.proprietaire?.id ?? '',
        description: project.description ?? '',
        objectif: project.objectif ?? '',
        budget: project.budget ?? '',
        type: project.type ?? '',
        statut: project.statut ?? 'en_attente',
        priorite: project.priorite ?? 'haut',
        etat: project.etat ?? 'Off',
        debut: project.debut ? project.debut.split('T')[0] : '',
        fin: project.fin ? project.fin.split('T')[0] : '',
        estimation_jours: project.estimation_jours ?? '',
        nom_createur: project.nom_createur ?? ''
      });
      setErrors({});
    }

    // Charger la liste des utilisateurs disponibles
    const loadUsers = async () => {
      try {
        const response = await userService.getUsers();
        setAvailableUsers(response.results || response.data || response || []);
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
      }
    };

    if (isOpen) {
      loadUsers();
    }
  }, [project, isOpen]);

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
  };

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};

    if (!formData.nom?.trim()) {
      newErrors.nom = 'Le nom du projet est requis';
    }

    if (!formData.code?.trim()) {
      newErrors.code = 'Le code du projet est requis';
    }

    if (!formData.proprietaire) {
      newErrors.proprietaire = 'Le Responsable du projet est requis';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'La description du projet est requise';
    }

    if (!formData.objectif?.trim()) {
      newErrors.objectif = 'L\'objectif du projet est requis';
    }

    if (!formData.type?.trim()) {
      newErrors.type = 'Le type de projet est requis';
    }

    // Validation des dates obligatoires
    if (!formData.debut?.trim()) {
      newErrors.debut = 'La date de début est requise';
    }

    if (!formData.fin?.trim()) {
      newErrors.fin = 'La date de fin est requise';
    }

    if (formData.debut && formData.fin && new Date(formData.debut) > new Date(formData.fin)) {
      newErrors.fin = 'La date de fin doit être postérieure à la date de début';
    }

    if (formData.estimation_jours && (isNaN(formData.estimation_jours) || formData.estimation_jours < 0)) {
      newErrors.estimation_jours = 'L\'estimation doit être un nombre positif';
    }

    if (formData.budget && (isNaN(formData.budget) || formData.budget < 0)) {
      newErrors.budget = 'Le budget doit être un nombre positif';
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
        budget: formData.budget ? parseFloat(formData.budget) : null,
        estimation_jours: formData.estimation_jours ? parseInt(formData.estimation_jours) : null,
        debut: formData.debut ? `${formData.debut}T00:00:00` : null,
        fin: formData.fin ? `${formData.fin}T23:59:59` : null
      };

      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setErrors({ submit: 'Erreur lors de la sauvegarde du projet' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fermer le modal
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen || !project || !formData) return null;

  return (
    <div className="project-edit-modal-overlay" onClick={handleClose}>
      <div className="project-edit-modal-content" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="project-edit-modal-header">
          <div className="project-edit-modal-title">
            <Edit3 className="project-edit-modal-icon" />
            Modifier le projet
          </div>
          <button
            className="project-edit-modal-close"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="project-edit-modal-body">
          <form onSubmit={handleSubmit}>
            
            {/* Informations principales */}
            <div className="form-section">
              <h3 className="form-section-title">
                <FileText className="w-5 h-5" />
                Informations principales
              </h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nom du projet *</label>
                  <input
                    type="text"
                    className={`form-input ${errors.nom ? 'form-input-error' : ''}`}
                    value={formData.nom}
                    onChange={(e) => handleInputChange('nom', e.target.value)}
                    placeholder="Nom du projet"
                    disabled={isSubmitting}
                  />
                  {errors.nom && <span className="form-error">{errors.nom}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Code du projet *</label>
                  <input
                    type="text"
                    className={`form-input ${errors.code ? 'form-input-error' : ''}`}
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    placeholder="Code du projet"
                    disabled={isSubmitting}
                  />
                  {errors.code && <span className="form-error">{errors.code}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Responsable du projet *</label>
                  <select
                    className={`form-select ${errors.proprietaire ? 'form-input-error' : ''}`}
                    value={formData.proprietaire}
                    onChange={(e) => handleInputChange('proprietaire', e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="">Sélectionner un Responsable</option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.prenom} {user.nom} (@{user.username})
                      </option>
                    ))}
                  </select>
                  {errors.proprietaire && <span className="form-error">{errors.proprietaire}</span>}
                </div>
              </div>
            </div>

            {/* Description et objectif */}
            <div className="form-section">
              <h3 className="form-section-title">
                <Target className="w-5 h-5" />
                Description et objectif
              </h3>
              
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  className={`form-textarea ${errors.description ? 'form-textarea-error' : ''}`}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Description du projet"
                  rows={3}
                  disabled={isSubmitting}
                />
                {errors.description && <span className="form-error">{errors.description}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Objectif *</label>
                <textarea
                  className={`form-textarea ${errors.objectif ? 'form-textarea-error' : ''}`}
                  value={formData.objectif}
                  onChange={(e) => handleInputChange('objectif', e.target.value)}
                  placeholder="Objectif du projet"
                  rows={2}
                  disabled={isSubmitting}
                />
                {errors.objectif && <span className="form-error">{errors.objectif}</span>}
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
                    <option value="bas">Bas</option>
                    <option value="intermediaire">Intermédiaire</option>
                    <option value="moyen">Moyen</option>
                    <option value="haut">Haut</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">État</label>
                  <select
                    className="form-select"
                    value={formData.etat}
                    onChange={(e) => handleInputChange('etat', e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="On">Actif</option>
                    <option value="Off">Inactif</option>
                  </select>
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
                  <label className="form-label">Date de début *</label>
                  <input
                    type="date"
                    className={`form-input ${errors.debut ? 'form-input-error' : ''}`}
                    value={formData.debut}
                    onChange={(e) => handleInputChange('debut', e.target.value)}
                    disabled={isSubmitting}
                  />
                  {errors.debut && <span className="form-error">{errors.debut}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Date de fin *</label>
                  <input
                    type="date"
                    className={`form-input ${errors.fin ? 'form-input-error' : ''}`}
                    value={formData.fin}
                    onChange={(e) => handleInputChange('fin', e.target.value)}
                    disabled={isSubmitting}
                  />
                  {errors.fin && <span className="form-error">{errors.fin}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Estimation (jours)</label>
                  <input
                    type="number"
                    className={`form-input ${errors.estimation_jours ? 'form-input-error' : ''}`}
                    value={formData.estimation_jours}
                    onChange={(e) => handleInputChange('estimation_jours', e.target.value)}
                    placeholder="Nombre de jours"
                    min="0"
                    disabled={isSubmitting}
                  />
                  {errors.estimation_jours && <span className="form-error">{errors.estimation_jours}</span>}
                </div>
              </div>
            </div>

            {/* Budget et type */}
            <div className="form-section">
              <h3 className="form-section-title">
                <DollarSign className="w-5 h-5" />
                Budget et type
              </h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Budget (FCFA)</label>
                  <input
                    type="number"
                    className={`form-input ${errors.budget ? 'form-input-error' : ''}`}
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    placeholder="Montant du budget"
                    min="0"
                    step="1000"
                    disabled={isSubmitting}
                  />
                  {errors.budget && <span className="form-error">{errors.budget}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Type de projet *</label>
                  <input
                    type="text"
                    className={`form-input ${errors.type ? 'form-input-error' : ''}`}
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    placeholder="Ex : Nouvelle offre de forfait mobile , etc."
                    disabled={isSubmitting}
                  />
                  {errors.type && <span className="form-error">{errors.type}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Créateur</label>
                  <select
                    className="form-select"
                    value={formData.nom_createur}
                    onChange={(e) => handleInputChange('nom_createur', e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="">Sélectionner un Créateur</option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={`${user.prenom} ${user.nom}`}>
                        {user.prenom} {user.nom} (@{user.username})
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
            <div className="project-edit-modal-footer">
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
                {isSubmitting ? 'Sauvegarde...' : (
                  <>
                    <Save className="w-4 h-4" />
                    Sauvegarder
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

export default ProjectEditModal;
