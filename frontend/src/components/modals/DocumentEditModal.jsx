import React, { useState, useEffect } from 'react';
import { X, Save, FileText, AlertCircle, CheckCircle } from 'lucide-react';

const DocumentEditModal = ({ 
  isOpen, 
  onClose, 
  document, 
  onSave,
  loading 
}) => {
  const [customData, setCustomData] = useState({});
  const [customDataText, setCustomDataText] = useState('');
  const [errors, setErrors] = useState({});

  // Charger les données du document quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && document) {
      // Ici vous pourriez charger les données personnalisées du document
      // Pour l'instant, on initialise avec des données vides
      setCustomData({});
      setCustomDataText('');
      setErrors({});
    }
  }, [isOpen, document]);

  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      // Parser les données personnalisées
      let parsedCustomData = {};
      if (customDataText.trim()) {
        try {
          parsedCustomData = JSON.parse(customDataText);
        } catch (error) {
          setErrors({ custom_data: 'Format JSON invalide' });
          return;
        }
      }

      await onSave(document.id, parsedCustomData);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };


  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Modifier le Document
              </h2>
              <p className="text-sm text-gray-500">
                {document.nom_fichier}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6">
          {/* Informations du document */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Informations du document
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-2 font-medium">{document.type_document}</span>
              </div>
              <div>
                <span className="text-gray-500">Statut:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  document.statut === 'finalise' 
                    ? 'bg-green-100 text-green-700'
                    : document.statut === 'brouillon'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {document.statut}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Version:</span>
                <span className="ml-2 font-medium">v{document.version}</span>
              </div>
              <div>
                <span className="text-gray-500">Taille:</span>
                <span className="ml-2 font-medium">
                  {Math.round(document.taille_fichier / 1024)} KB
                </span>
              </div>
              <div>
                <span className="text-gray-500">Créé le:</span>
                <span className="ml-2 font-medium">{document.date_creation}</span>
              </div>
              <div>
                <span className="text-gray-500">Créé par:</span>
                <span className="ml-2 font-medium">{document.cree_par}</span>
              </div>
            </div>
          </div>

          {/* Données personnalisées */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Données personnalisées
            </label>
            <textarea
              value={customDataText}
              onChange={(e) => setCustomDataText(e.target.value)}
              placeholder={`Exemple:
{
  "client_nom": "Jean Dupont",
  "client_adresse": "123 Rue de la Paix",
  "prestations": "Développement web",
  "prix": "5000",
  "conditions_paiement": "50% à la commande, 50% à la livraison"
}`}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-40 font-mono text-sm ${
                errors.custom_data ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.custom_data && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.custom_data}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Modifiez les données personnalisées qui seront incluses dans le document final
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Instructions
            </h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>1. Modifiez les données personnalisées ci-dessus si nécessaire</p>
              <p>2. Cliquez sur "Sauvegarder et Générer PDF" pour finaliser</p>
              <p>3. Le document PDF sera généré avec toutes les données du projet</p>
              <p>4. Une copie sera sauvegardée dans l'application</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Sauvegarder et Générer PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditModal;
