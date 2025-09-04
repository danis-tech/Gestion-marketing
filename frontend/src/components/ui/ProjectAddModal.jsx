import React, { useState } from 'react';
import { 
  X, 
  Save,
  Plus,
  Calendar, 
  User, 
  DollarSign, 
  Target, 
  FileText,
  AlertCircle
} from 'lucide-react';
import './ProjectAddModal.css';

const ProjectAddModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nom: '',
    code: '',
    nom_createur: '',
    description: '',
    objectif: '',
    budget: '',
    type: '',
    statut: 'en_attente',
    priorite: 'haut',
    etat: 'On',
    debut: '',
    fin: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (!formData.nom_createur?.trim()) {
      newErrors.nom_createur = 'Le nom du créateur est requis';
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
         debut: formData.debut ? `${formData.debut}T09:00:00Z` : null,
         fin: formData.fin ? `${formData.fin}T18:00:00Z` : null
       };

      await onSave(dataToSave);
      
                           // Réinitialiser le formulaire
        setFormData({
          nom: '',
          code: '',
          nom_createur: '',
          description: '',
          objectif: '',
          budget: '',
          type: '',
          statut: 'en_attente',
          priorite: 'haut',
          etat: 'On',
          debut: '',
          fin: ''
        });
        setErrors({});
        
        onClose();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      setErrors({ submit: 'Erreur lors de la création du projet' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fermer le modal
  const handleClose = () => {
    if (!isSubmitting) {
                           // Réinitialiser le formulaire
        setFormData({
          nom: '',
          code: '',
          nom_createur: '',
          description: '',
          objectif: '',
          budget: '',
          type: '',
          statut: 'en_attente',
          priorite: 'haut',
          etat: 'On',
          debut: '',
          fin: ''
        });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="project-add-modal-overlay" onClick={handleClose}>
      <div className="project-add-modal-content" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="project-add-modal-header">
          <div className="project-add-modal-title">
            <Plus className="project-add-modal-icon" />
            Nouveau projet
          </div>
          <button
            className="project-add-modal-close"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="project-add-modal-body">
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
                   <label className="form-label">Nom du créateur *</label>
                   <input
                     type="text"
                     className={`form-input ${errors.nom_createur ? 'form-input-error' : ''}`}
                     value={formData.nom_createur}
                     onChange={(e) => handleInputChange('nom_createur', e.target.value)}
                     placeholder="Nom du créateur"
                     disabled={isSubmitting}
                   />
                   {errors.nom_createur && <span className="form-error">{errors.nom_createur}</span>}
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
                  className={`form-textarea ${errors.description ? 'form-input-error' : ''}`}
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
                  className={`form-textarea ${errors.objectif ? 'form-input-error' : ''}`}
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
                    <option value="en_cours">En cours</option>
                    <option value="termine">Terminé</option>
                    <option value="annule">Annulé</option>
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
                    <option value="basse">Basse</option>
                    <option value="moyenne">Moyenne</option>
                    <option value="haute">Haute</option>
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
                     placeholder="Type de projet"
                     disabled={isSubmitting}
                   />
                   {errors.type && <span className="form-error">{errors.type}</span>}
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
            <div className="project-add-modal-footer">
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
                {isSubmitting ? 'Création...' : (
                  <>
                    <Plus className="w-4 h-4" />
                    Créer le projet
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

export default ProjectAddModal;
