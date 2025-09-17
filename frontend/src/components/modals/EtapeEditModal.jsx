import React, { useState, useEffect } from 'react';
import { X, Save, User, Calendar, AlertCircle, Star } from 'lucide-react';
import { etapesService, userService } from '../../services/apiService';
import useNotification from '../../hooks/useNotification';

const EtapeEditModal = ({ isOpen, onClose, etape, projectId, onSuccess }) => {
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    ordre: 1,
    statut: 'en_attente',
    priorite: 'normale',
    responsable_id: null,
    date_debut_prevue: '',
    date_fin_prevue: '',
    date_debut_reelle: '',
    date_fin_reelle: '',
    progression_pourcentage: 0,
    commentaire: '',
    notes_internes: ''
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      if (etape) {
        setFormData({
          nom: etape.nom || '',
          description: etape.description || '',
          ordre: etape.ordre || 1,
          statut: etape.statut || 'en_attente',
          priorite: etape.priorite || 'normale',
          responsable_id: etape.responsable?.id || null,
          date_debut_prevue: etape.date_debut_prevue ? etape.date_debut_prevue.split('T')[0] : '',
          date_fin_prevue: etape.date_fin_prevue ? etape.date_fin_prevue.split('T')[0] : '',
          date_debut_reelle: etape.date_debut_reelle ? etape.date_debut_reelle.split('T')[0] : '',
          date_fin_reelle: etape.date_fin_reelle ? etape.date_fin_reelle.split('T')[0] : '',
          progression_pourcentage: etape.progression_pourcentage || 0,
          commentaire: etape.commentaire || '',
          notes_internes: etape.notes_internes || ''
        });
      }
    }
  }, [isOpen, etape]);

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
    
    if (!etape || !projectId) {
      showError('Erreur', 'Données manquantes pour la mise à jour');
      return;
    }

    try {
      setSaving(true);
      
      // Préparer les données pour l'API
      const updateData = {
        ...formData,
        date_debut_prevue: formData.date_debut_prevue ? `${formData.date_debut_prevue}T00:00:00Z` : null,
        date_fin_prevue: formData.date_fin_prevue ? `${formData.date_fin_prevue}T23:59:59Z` : null,
        date_debut_reelle: formData.date_debut_reelle ? `${formData.date_debut_reelle}T00:00:00Z` : null,
        date_fin_reelle: formData.date_fin_reelle ? `${formData.date_fin_reelle}T23:59:59Z` : null,
        responsable_id: formData.responsable_id || null
      };

      // Récupérer l'ID de la phase
      const phaseId = etape.phase_etat_id || (typeof etape.phase_etat === 'object' ? etape.phase_etat.id : etape.phase_etat);
      
      console.log('Debug - Mise à jour étape:', {
        projectId,
        phaseId,
        etapeId: etape.id,
        etape: etape
      });
      
      await etapesService.updateEtape(projectId, phaseId, etape.id, updateData);
      
      showSuccess('Succès', 'Étape mise à jour avec succès');
      onSuccess();
    } catch (error) {
      showError('Erreur', 'Impossible de mettre à jour l\'étape');
      console.error('Erreur lors de la mise à jour de l\'étape:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black bg-opacity-30 flex items-center justify-center z-50 p-6">
      <div className="bg-white shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold flex items-center gap-4">
              <Star className="w-8 h-8" />
              MODIFIER L'ÉTAPE
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
          <div className="bg-gray-50 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Description et détails</h3>
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

          {/* Section Statut et Responsable */}
          <div className="bg-gray-50 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Statut et responsable</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                  Statut
                </label>
                <select
                  name="statut"
                  value={formData.statut}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 text-base border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="en_attente">En attente</option>
                  <option value="en_cours">En cours</option>
                  <option value="terminee">Terminée</option>
                  <option value="annulee">Annulée</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                  <User className="w-4 h-4 inline mr-2" />
                  Responsable
                </label>
                <select
                  name="responsable_id"
                  value={formData.responsable_id || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 text-base border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Sélectionner un responsable</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.prenom} {user.nom} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section Dates */}
          <div className="bg-gray-50 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Dates et planning</h3>
            <div className="space-y-6">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Date de début réelle
                  </label>
                  <input
                    type="date"
                    name="date_debut_reelle"
                    value={formData.date_debut_reelle}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 text-base border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Date de fin réelle
                  </label>
                  <input
                    type="date"
                    name="date_fin_reelle"
                    value={formData.date_fin_reelle}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 text-base border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section Progression */}
          <div className="bg-gray-50 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Progression</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                Progression (%)
              </label>
              <input
                type="number"
                name="progression_pourcentage"
                value={formData.progression_pourcentage}
                onChange={handleInputChange}
                min="0"
                max="100"
                className="w-full px-4 py-3 text-base border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <div className="mt-3">
                <div className="w-full bg-gray-200 h-3">
                  <div 
                    className="bg-blue-500 h-3 transition-all duration-300"
                    style={{ width: `${formData.progression_pourcentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Commentaires */}
          <div className="bg-gray-50 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Commentaires et notes</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  Commentaire
                </label>
                <textarea
                  name="commentaire"
                  value={formData.commentaire}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-3 text-base border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Commentaire public"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                  Notes internes
                </label>
                <textarea
                  name="notes_internes"
                  value={formData.notes_internes}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-3 text-base border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Notes internes (non visibles par tous)"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-6 pt-8 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-4 text-lg text-white bg-gray-500 hover:bg-gray-600 transition-colors font-semibold"
            >
              ANNULER
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-3 px-8 py-4 text-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold"
            >
              <Save className="w-6 h-6" />
              {saving ? 'SAUVEGARDE...' : 'SAUVEGARDER'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EtapeEditModal;
