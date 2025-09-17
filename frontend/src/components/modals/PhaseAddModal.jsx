import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, MessageSquare } from 'lucide-react';
import { phasesService } from '../../services/apiService';
import useNotification from '../../hooks/useNotification';

const PhaseAddModal = ({ isOpen, onClose, projectId, onSuccess }) => {
  const [availablePhases, setAvailablePhases] = useState([]);
  const [formData, setFormData] = useState({
    phase_id: '',
    terminee: false,
    ignoree: false,
    date_debut: '',
    date_fin: '',
    commentaire: ''
  });
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (isOpen) {
      loadAvailablePhases();
    }
  }, [isOpen]);

  const loadAvailablePhases = async () => {
    try {
      const phases = await phasesService.getPhases();
      setAvailablePhases(phases);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les phases disponibles');
      console.error('Erreur lors du chargement des phases:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectId || !formData.phase_id) return;

    try {
      setLoading(true);
      
      const phaseData = {
        phase_id: parseInt(formData.phase_id),
        terminee: formData.terminee,
        ignoree: formData.ignoree,
        date_debut: formData.date_debut ? new Date(formData.date_debut).toISOString() : null,
        date_fin: formData.date_fin ? new Date(formData.date_fin).toISOString() : null,
        commentaire: formData.commentaire
      };

      await phasesService.updateProjectPhase(projectId, formData.phase_id, phaseData);
      showSuccess('Succès', 'Phase ajoutée avec succès');
      onSuccess();
    } catch (error) {
      showError('Erreur', 'Impossible d\'ajouter la phase');
      console.error('Erreur lors de l\'ajout:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      phase_id: '',
      terminee: false,
      ignoree: false,
      date_debut: '',
      date_fin: '',
      commentaire: ''
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Ajouter une Phase
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Ajoutez une nouvelle phase au projet
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Sélection de la phase */}
          <div>
            <label htmlFor="phase_id" className="block text-sm font-medium text-gray-700 mb-2">
              Phase à ajouter
            </label>
            <select
              id="phase_id"
              name="phase_id"
              value={formData.phase_id}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionnez une phase</option>
              {availablePhases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.ordre}. {phase.nom}
                </option>
              ))}
            </select>
            {formData.phase_id && (
              <p className="text-sm text-gray-600 mt-1">
                {availablePhases.find(p => p.id === parseInt(formData.phase_id))?.description}
              </p>
            )}
          </div>

          {/* Statut de la phase */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="terminee"
                name="terminee"
                checked={formData.terminee}
                onChange={handleInputChange}
                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
              />
              <label htmlFor="terminee" className="ml-2 text-sm font-medium text-gray-900">
                Phase terminée
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="ignoree"
                name="ignoree"
                checked={formData.ignoree}
                onChange={handleInputChange}
                className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
              />
              <label htmlFor="ignoree" className="ml-2 text-sm font-medium text-gray-900">
                Phase ignorée
              </label>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date_debut" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date de début
              </label>
              <input
                type="datetime-local"
                id="date_debut"
                name="date_debut"
                value={formData.date_debut}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="date_fin" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date de fin
              </label>
              <input
                type="datetime-local"
                id="date_fin"
                name="date_fin"
                value={formData.date_fin}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Commentaire */}
          <div>
            <label htmlFor="commentaire" className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Commentaire
            </label>
            <textarea
              id="commentaire"
              name="commentaire"
              value={formData.commentaire}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Ajoutez un commentaire sur cette phase..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !formData.phase_id}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              {loading ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PhaseAddModal;
