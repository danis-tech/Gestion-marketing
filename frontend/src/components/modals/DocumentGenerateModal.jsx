import React, { useState, useEffect } from 'react';
import { X, FileText, Plus, AlertCircle, CheckCircle, Info, Code, Database } from 'lucide-react';

const DocumentGenerateModal = ({
  isOpen,
  onClose,
  selectedProject,
  phases,
  documentTypes,
  onGenerate,
  loading,
  onLoadPhases
}) => {
  const [formData, setFormData] = useState({
    titre: '',
    type_document: '',
    projet_id: '',
    phase_id: '',
    phase_nom: ''
  });
  const [errors, setErrors] = useState({});

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setFormData({
        titre: '',
        type_document: '',
        projet_id: '',
        phase_id: '',
        phase_nom: ''
      });
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && selectedProject && phases.length === 0 && onLoadPhases) {
      onLoadPhases(selectedProject.id);
    }
  }, [isOpen, selectedProject?.id, onLoadPhases]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    if (!formData.type_document) {
      newErrors.type_document = 'Le type de document est requis';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const data = {
        ...formData,
        projet_id: selectedProject.id
      };

      await onGenerate(data);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
    }
  };

  const getDocumentTypeInfo = (typeId) => {
    return documentTypes.find(type => type.id === typeId);
  };

  const getProjectData = () => {
    if (!selectedProject) return [];

    return [
      { label: 'Nom', value: selectedProject.nom },
      { label: 'Code', value: selectedProject.code },
      { label: 'Statut', value: selectedProject.statut },
      { label: 'Chef de projet', value: selectedProject.chef_projet },
      { label: 'Phases', value: selectedProject.phases_count },
      { label: 'Tâches', value: selectedProject.taches_count }
    ];
  };

  const jsonExample = {
    "client_nom": "Jean Dupont",
    "client_email": "jean.dupont@email.com",
    "client_telephone": "01 23 45 67 89",
    "client_adresse": "123 Rue de la Paix, 75001 Paris",
    "montant": "5000€",
    "delai_livraison": "30 jours",
    "description_projet": "Développement d'une application web moderne",
    "exigences_speciales": "Interface responsive, API REST, base de données sécurisée"
  };

  if (!isOpen) return null;

  return (
    <div className="document-generate-modal">
      <div className="modal-content">
        {/* En-tête */}
        <div className="modal-header">
          <div className="flex items-center">
            <div className="title-icon">
              <Plus className="w-6 h-6" />
            </div>
            <h3>Générer un Document</h3>
          </div>
          <button
            onClick={onClose}
            className="close-button"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Informations du projet */}
        {selectedProject && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-800">Projet sélectionné</span>
            </div>
            <p className="text-blue-700 font-medium">{selectedProject.nom}</p>
            <p className="text-sm text-blue-600">Code: {selectedProject.code}</p>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type de document */}
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de document <span className="required">*</span>
            </label>
            <select
              value={formData.type_document}
              onChange={(e) => setFormData(prev => ({ ...prev, type_document: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.type_document ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            >
              <option value="">Sélectionner un type de document</option>
              {documentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.icone} {type.nom}
                </option>
              ))}
            </select>
            {errors.type_document && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.type_document}
              </p>
            )}
            {formData.type_document && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Description:</strong> {getDocumentTypeInfo(formData.type_document)?.description}
                </p>
              </div>
            )}
          </div>

          {/* Phase (optionnel) */}
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phase (optionnel)
            </label>
            <select
              value={formData.phase_id}
              onChange={(e) => setFormData(prev => ({ ...prev, phase_id: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="">Sélectionnez une phase</option>
              {phases.map(phase => (
                <option key={phase.id} value={phase.id}>{phase.nom}</option>
              ))}
            </select>
          </div>

          {/* Information sur le workflow */}
          <div className="p-4 bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-800">Workflow de génération</span>
            </div>
            <div className="text-sm text-blue-700 space-y-2">
              <div className="flex items-start gap-2">
                <span className="font-bold text-blue-800">1.</span>
                <span>Le template Word correspondant s'ouvrira automatiquement</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-blue-800">2.</span>
                <span>Toutes les données du projet seront déjà pré-remplies dans le document</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-blue-800">3.</span>
                <span>Vous pourrez ajouter vos informations personnalisées directement dans Word</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-blue-800">4.</span>
                <span>Sauvegardez le document finalisé pour l'enregistrer dans le système</span>
              </div>
            </div>
          </div>

          {/* Données automatiques du projet */}
          <div className="automatic-data">
            <h4 className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Données automatiques du projet
            </h4>
            <ul>
              {getProjectData().map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <strong>{item.label}:</strong> {item.value}
                </li>
              ))}
            </ul>
            <div className="more-info">
              + 18 autres variables automatiquement incluses
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="generate-button"
              disabled={loading || !formData.type_document}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Génération...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Générer Document
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentGenerateModal;