import React, { useState, useEffect } from 'react';
import { X, Plus, User, Calendar, AlertCircle, Star } from 'lucide-react';
import { etapesService, userService } from '../../services/apiService';
import useNotification from '../../hooks/useNotification';

const EtapeAddModal = ({ isOpen, onClose, phaseId, projectId, onSuccess }) => {
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    ordre: 1,
    priorite: 'normale',
    responsable_id: null,
    date_debut_prevue: '',
    date_fin_prevue: '',
    commentaire: ''
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      // Réinitialiser le formulaire
      setFormData({
        nom: '',
        description: '',
        ordre: 1,
        priorite: 'normale',
        responsable_id: null,
        date_debut_prevue: '',
        date_fin_prevue: '',
        commentaire: ''
      });
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers();
      setUsers(response.results || response);
    } catch (error) {
      showError('Erreur', 'Impossible de charger la liste des utilisateurs');
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!phaseId || !projectId) {
      showError('Erreur', 'Données manquantes pour la création');
      return;
    }

    try {
      setSaving(true);
      
      // Préparer les données pour l'API
      const createData = {
        ...formData,
        date_debut_prevue: formData.date_debut_prevue ? `${formData.date_debut_prevue}T00:00:00Z` : null,
        date_fin_prevue: formData.date_fin_prevue ? `${formData.date_fin_prevue}T23:59:59Z` : null,
        responsable_id: formData.responsable_id || null
      };

      await etapesService.createEtape(projectId, phaseId, createData);
      
      showSuccess('Succès', 'Étape créée avec succès');
      onSuccess();
    } catch (error) {
      showError('Erreur', 'Impossible de créer l\'étape');
      console.error('Erreur lors de la création de l\'étape:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
      <div className="bg-white shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-b from-blue-700 to-blue-500 text-white p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-4xl font-bold flex items-center gap-4">
              <Plus className="w-10 h-10" />
              NOUVELLE ÉTAPE
            </h2>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/20 transition-colors bg-red-500 hover:bg-red-600"
            >
              <X className="w-8 h-8" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Informations générales */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-3">
              NOM DE L'ÉTAPE *
            </label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleInputChange}
              required
              className="w-full px-5 py-4 text-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Nom de l'étape"
            />
          </div>

          {/* Section Description */}
          <div className="bg-white shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-green-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Description et détails</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-3 text-base border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Description de l'étape"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    Ordre dans la phase *
                  </label>
                  <input
                    type="number"
                    name="ordre"
                    value={formData.ordre}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full px-4 py-3 text-base border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    <Star className="w-4 h-4 inline mr-2" />
                    Priorité
                  </label>
                  <select
                    name="priorite"
                    value={formData.priorite}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 text-base border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="faible">Faible</option>
                    <option value="normale">Normale</option>
                    <option value="elevee">Élevée</option>
                    <option value="critique">Critique</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section Responsable et Planning */}
          <div className="bg-white shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Responsable et planning</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                  Responsable
                </label>
                <select
                  name="responsable_id"
                  value={formData.responsable_id || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Sélectionner un responsable</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.prenom} {user.nom} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Date de début prévue
                  </label>
                  <input
                    type="date"
                    name="date_debut_prevue"
                    value={formData.date_debut_prevue}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 text-base border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Date de fin prévue
                  </label>
                  <input
                    type="date"
                    name="date_fin_prevue"
                    value={formData.date_fin_prevue}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 text-base border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section Commentaire */}
          <div className="bg-white shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-orange-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Commentaires et notes</h3>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                Commentaire
              </label>
              <textarea
                name="commentaire"
                value={formData.commentaire}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Commentaire sur l'étape"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-8 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-base text-white bg-gray-500 hover:bg-gray-600 transition-colors font-semibold"
            >
              ANNULER
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold text-base"
            >
              <Plus className="w-5 h-5" />
              {saving ? 'CRÉATION...' : '+ CRÉER L\'ÉTAPE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EtapeAddModal;
