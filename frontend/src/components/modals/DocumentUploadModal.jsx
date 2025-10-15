import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle, Info } from 'lucide-react';

const DocumentUploadModal = ({ 
  isOpen, 
  onClose, 
  selectedProject, 
  phases, 
  etapes, 
  onUpload,
  loading,
  onLoadEtapes,
  onLoadPhases
}) => {
  const [formData, setFormData] = useState({
    fichier: null,
    projet_id: '',
    phase_id: '',
    etape_id: '',
    titre: '',
    description: '',
    mots_cles: '',
    version: '1.0',
    est_public: false
  });
  const [errors, setErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setFormData({
        fichier: null,
        projet_id: selectedProject?.id || '',
        phase_id: '',
        etape_id: '',
        titre: '',
        description: '',
        mots_cles: '',
        version: '1.0',
        est_public: false
      });
      setErrors({});
    }
  }, [isOpen, selectedProject]);

  // Charger les étapes quand une phase est sélectionnée
  useEffect(() => {
    if (formData.phase_id) {
      console.log('Chargement des étapes pour la phase:', formData.phase_id);
      onLoadEtapes(formData.phase_id);
    } else {
      setFormData(prev => ({ ...prev, etape_id: '' }));
    }
  }, [formData.phase_id, onLoadEtapes]);

  // Charger les phases du projet automatiquement quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && selectedProject && phases.length === 0 && onLoadPhases) {
      console.log('Modal ouvert pour le projet:', selectedProject.nom);
      console.log('Chargement des phases...');
      onLoadPhases(selectedProject.id);
    }
  }, [isOpen, selectedProject?.id, onLoadPhases]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        fichier: file,
        titre: prev.titre || file.name.split('.')[0]
      }));
      
      if (errors.fichier) {
        setErrors(prev => ({ ...prev, fichier: '' }));
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFormData(prev => ({
        ...prev,
        fichier: file,
        titre: prev.titre || file.name.split('.')[0]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.fichier) {
      newErrors.fichier = 'Veuillez sélectionner un fichier';
    }
    if (!formData.titre.trim()) {
      newErrors.titre = 'Le titre est requis';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // Créer FormData pour l'upload
      const uploadData = new FormData();
      uploadData.append('fichier', formData.fichier);
      uploadData.append('projet_id', formData.projet_id);
      uploadData.append('titre', formData.titre);
      uploadData.append('description', formData.description);
      uploadData.append('mots_cles', formData.mots_cles);
      uploadData.append('version', formData.version);
      uploadData.append('est_public', formData.est_public ? 'true' : 'false');
      
      if (formData.phase_id) {
        uploadData.append('phase_id', formData.phase_id);
      }
      if (formData.etape_id) {
        uploadData.append('etape_id', formData.etape_id);
      }

      if (onUpload && typeof onUpload === 'function') {
        await onUpload(uploadData);
        onClose();
      } else {
        console.error('Fonction onUpload non définie');
        setErrors({ general: 'Erreur de configuration du modal' });
      }
    } catch (error) {
      console.error('Erreur lors du téléversement:', error);
      setErrors({ general: 'Erreur lors du téléversement du document' });
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    const iconMap = {
      pdf: '📄',
      docx: '📝',
      doc: '📝',
      xlsx: '📊',
      xls: '📊',
      pptx: '📽️',
      ppt: '📽️',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️',
      zip: '📦',
      rar: '📦',
      txt: '📄',
      csv: '📊'
    };
    return iconMap[extension] || '📄';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Téléverser un Document</h2>
              <p className="text-sm text-gray-500">Ajouter un nouveau document au projet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Affichage des erreurs générales */}
          {errors.general && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-700">{errors.general}</p>
              </div>
            </div>
          )}

          {/* Zone de téléversement améliorée */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Upload className="w-5 h-5 text-green-600" />
              </div>
              <label className="text-lg font-semibold text-gray-900">
                Fichier à téléverser <span className="text-red-500">*</span>
              </label>
            </div>
            
            <div
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                dragActive 
                  ? 'border-green-400 bg-gradient-to-br from-green-50 to-blue-50 scale-[1.02] shadow-lg' 
                  : errors.fichier 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 hover:border-green-400 hover:bg-gradient-to-br hover:from-gray-50 hover:to-green-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.txt,.csv,.zip,.rar"
              />
              
              {formData.fichier ? (
                <div className="space-y-4">
                  <div className="relative">
                    <div className="text-6xl mb-4">{getFileIcon(formData.fichier.name)}</div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="font-semibold text-gray-900 text-lg break-all">
                      {formData.fichier.name}
                    </div>
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        {formatFileSize(formData.fichier.size)}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        {formData.fichier.type || 'Type inconnu'}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, fichier: null }))}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Supprimer le fichier
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl flex items-center justify-center mb-4">
                      <Upload className="w-10 h-10 text-green-600" />
                    </div>
                    {dragActive && (
                      <div className="absolute inset-0 bg-green-500 bg-opacity-10 rounded-2xl flex items-center justify-center">
                        <div className="text-green-600 font-semibold">Déposez le fichier ici !</div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="text-xl font-semibold text-gray-900">
                      {dragActive ? 'Déposez votre fichier' : 'Glissez-déposez votre fichier ici'}
                    </div>
                    <div className="text-gray-600">
                      ou <span className="text-green-600 font-medium cursor-pointer">cliquez pour sélectionner</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      PDF
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Word
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Excel
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      PowerPoint
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      Images
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                      Archives
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                      Autres
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      Max 50MB
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {errors.fichier && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{errors.fichier}</p>
              </div>
            )}
          </div>

          {/* Informations du document */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Titre du document *
              </label>
              <input
                type="text"
                name="titre"
                value={formData.titre}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.titre ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Titre du document"
              />
              {errors.titre && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.titre}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Version
              </label>
              <input
                type="text"
                name="version"
                value={formData.version}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="1.0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Description du document (optionnel)"
            />
          </div>


          {/* Association au projet */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Association au projet</h3>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Phase du projet
                    <span className="text-xs text-gray-500 font-normal">(optionnel)</span>
                  </label>
                  <div className="relative">
                    <select
                      name="phase_id"
                      value={formData.phase_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm transition-all duration-200 appearance-none cursor-pointer"
                    >
                      <option value="">🎯 Sélectionner une phase</option>
                      {phases.length > 0 ? (
                        phases.map(phase => (
                          <option key={phase.id} value={phase.id}>
                            📋 {phase.nom || `Phase ${phase.ordre}`}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>⏳ Chargement des phases...</option>
                      )}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {phases.length === 0 && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-amber-700">Aucune phase disponible pour ce projet</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Étape de la phase
                    <span className="text-xs text-gray-500 font-normal">(optionnel)</span>
                  </label>
                  <div className="relative">
                    <select
                      name="etape_id"
                      value={formData.etape_id}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200 appearance-none cursor-pointer ${
                        !formData.phase_id 
                          ? 'border-gray-200 bg-gray-50 text-gray-400' 
                          : 'border-gray-300'
                      }`}
                      disabled={!formData.phase_id}
                    >
                      <option value="">
                        {!formData.phase_id ? '🔒 Sélectionnez d\'abord une phase' : '📝 Sélectionner une étape'}
                      </option>
                      {etapes.length > 0 ? (
                        etapes.map(etape => (
                          <option key={etape.id} value={etape.id}>
                            ✅ {etape.nom}
                          </option>
                        ))
                      ) : formData.phase_id ? (
                        <option value="" disabled>⏳ Chargement des étapes...</option>
                      ) : null}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className={`w-5 h-5 ${!formData.phase_id ? 'text-gray-300' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {formData.phase_id && etapes.length === 0 && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-amber-700">Aucune étape disponible pour cette phase</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Indicateur de sélection */}
              {(formData.phase_id || formData.etape_id) && (
                <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Sélection effectuée
                      </div>
                      <div className="text-sm text-gray-600">
                        {formData.phase_id && `Phase: ${phases.find(p => p.id == formData.phase_id)?.phase?.nom || 'Phase sélectionnée'}`}
                        {formData.phase_id && formData.etape_id && ' • '}
                        {formData.etape_id && `Étape: ${etapes.find(e => e.id == formData.etape_id)?.nom || 'Étape sélectionnée'}`}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Options de visibilité</h3>
            </div>
            
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-200">
              <div className="flex items-start space-x-4">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    id="est_public"
                    name="est_public"
                    checked={formData.est_public}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="est_public" className="text-sm font-semibold text-gray-900 cursor-pointer">
                    🌐 Document public
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Rendre ce document visible par tous les utilisateurs du système. 
                    Si non coché, le document sera privé et visible uniquement par vous et les administrateurs.
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className={`px-2 py-1 rounded-full ${formData.est_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {formData.est_public ? '🔓 Public' : '🔒 Privé'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Informations du projet */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900">Informations du projet</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-sm font-medium text-gray-700">Nom du projet</span>
                </div>
                <p className="text-lg font-semibold text-blue-900">
                  {selectedProject?.nom || 'Non sélectionné'}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  <span className="text-sm font-medium text-gray-700">Code projet</span>
                </div>
                <p className="text-lg font-semibold text-indigo-900">
                  {selectedProject?.code || 'N/A'}
                </p>
              </div>
            </div>
            {selectedProject && (
              <div className="mt-4 p-3 bg-white rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Projet sélectionné et prêt pour le téléversement</span>
                </div>
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 font-medium flex items-center gap-2"
              disabled={loading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Annuler
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              disabled={loading || !formData.fichier}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Téléversement en cours...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Téléverser Document
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentUploadModal;
