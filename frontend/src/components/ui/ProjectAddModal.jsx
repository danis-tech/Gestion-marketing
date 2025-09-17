import React, { useState, useEffect } from 'react';
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
import { userService } from '../../services/apiService';
import './ProjectAddModal.css';

const ProjectAddModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nom: '',
    code: '',
    proprietaire: '',
    description: '',
    objectif: '',
    budget: '',
    type: '',
    statut: 'en_attente',
    priorite: 'haut', // Valeur par défaut corrigée
    etat: 'Off', // Par défaut inactif
    debut: '',
    fin: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);

  // Récupérer l'utilisateur connecté et charger les utilisateurs disponibles
  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
      } catch (error) {
        console.error('Erreur lors du parsing des données utilisateur:', error);
      }
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
  }, [isOpen]);

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

    if (!formData.proprietaire?.trim()) {
      newErrors.proprietaire = 'Le propriétaire du projet est requis';
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
      // Préparer les données pour l'API avec le nom du créateur automatique
      const dataToSave = {
        ...formData,
        nom_createur: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Utilisateur inconnu',
        debut: formData.debut ? `${formData.debut}T09:00:00Z` : null,
        fin: formData.fin ? `${formData.fin}T18:00:00Z` : null
      };

      console.log('=== DONNÉES ENVOYÉES À L\'API ===');
      console.log('FormData complet:', formData);
      console.log('DataToSave:', dataToSave);
      console.log('Priorité:', formData.priorite);
      console.log('Statut:', formData.statut);

      await onSave(dataToSave);
      
      // Réinitialiser le formulaire
      setFormData({
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
        proprietaire: '',
        description: '',
        objectif: '',
        budget: '',
        type: '',
        statut: 'en_attente',
        priorite: 'haut',
        etat: 'Off', // Par défaut inactif
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
                    <option value="bas">Basse</option>
                    <option value="moyen">Moyenne</option>
                    <option value="intermediaire">Intermédiaire</option>
                    <option value="haut">Haute</option>
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
