import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, MessageSquare } from 'lucide-react';
import { phasesService } from '../../services/apiService';
import useNotification from '../../hooks/useNotification';

const PhaseEditModal = ({ isOpen, onClose, phase, projectId, onSuccess }) => {
  const [formData, setFormData] = useState({
    terminee: false,
    ignoree: false,
    date_debut: '',
    date_fin: '',
    commentaire: ''
  });
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (phase && isOpen) {
      setFormData({
        terminee: phase.terminee || false,
        ignoree: phase.ignoree || false,
        date_debut: phase.date_debut ? new Date(phase.date_debut).toISOString().slice(0, 16) : '',
        date_fin: phase.date_fin ? new Date(phase.date_fin).toISOString().slice(0, 16) : '',
        commentaire: phase.commentaire || ''
      });
    }
  }, [phase, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectId || !phase) return;

    try {
      setLoading(true);
      
      const updateData = {
        terminee: formData.terminee,
        ignoree: formData.ignoree,
        date_debut: formData.date_debut ? new Date(formData.date_debut).toISOString() : null,
        date_fin: formData.date_fin ? new Date(formData.date_fin).toISOString() : null,
        commentaire: formData.commentaire
      };

      await phasesService.updateProjectPhase(projectId, phase.id, updateData);
      showSuccess('Succès', 'Phase mise à jour avec succès');
      onSuccess();
    } catch (error) {
      showError('Erreur', 'Impossible de mettre à jour la phase');
      console.error('Erreur lors de la mise à jour:', error);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black bg-opacity-30 flex items-center justify-center z-50 p-6">
      <div className="bg-white shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">
                Modifier la Phase
              </h2>
              <p className="text-lg text-blue-100 mt-2">
                {phase?.phase?.nom}
              </p>
            </div>
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
          {/* Statut de la phase */}
          <div className="bg-gray-50 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Statut de la phase</h3>
            <div className="grid grid-cols-2 gap-8">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="terminee"
                  name="terminee"
                  checked={formData.terminee}
                  onChange={handleInputChange}
                  className="w-6 h-6 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 focus:ring-2"
                />
                <label htmlFor="terminee" className="ml-3 text-lg font-semibold text-gray-900">
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
                  className="w-6 h-6 text-red-600 bg-gray-100 border-gray-300 focus:ring-red-500 focus:ring-2"
                />
                <label htmlFor="ignoree" className="ml-3 text-lg font-semibold text-gray-900">
                  Phase ignorée
                </label>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-gray-50 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Dates de la phase</h3>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label htmlFor="date_debut" className="block text-lg font-semibold text-gray-700 mb-3">
                  <Calendar className="w-6 h-6 inline mr-2" />
                  Date de début
                </label>
                <input
                  type="datetime-local"
                  id="date_debut"
                  name="date_debut"
                  value={formData.date_debut}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 text-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="date_fin" className="block text-lg font-semibold text-gray-700 mb-3">
                  <Calendar className="w-6 h-6 inline mr-2" />
                  Date de fin
                </label>
                <input
                  type="datetime-local"
                  id="date_fin"
                  name="date_fin"
                  value={formData.date_fin}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 text-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Commentaire */}
          <div className="bg-gray-50 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Commentaires</h3>
            <div>
              <label htmlFor="commentaire" className="block text-lg font-semibold text-gray-700 mb-3">
                <MessageSquare className="w-6 h-6 inline mr-2" />
                Commentaire
              </label>
              <textarea
                id="commentaire"
                name="commentaire"
                value={formData.commentaire}
                onChange={handleInputChange}
                rows={5}
                className="w-full px-4 py-3 text-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Ajoutez un commentaire sur cette phase..."
              />
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
              disabled={loading}
              className="flex items-center gap-3 px-8 py-4 text-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              <Save className="w-6 h-6" />
              {loading ? 'SAUVEGARDE...' : 'SAUVEGARDER'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PhaseEditModal;
