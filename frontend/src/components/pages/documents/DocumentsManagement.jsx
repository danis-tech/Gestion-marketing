import React, { useState, useEffect, useRef } from 'react';
import { useDocuments } from '../../../hooks/useDocuments';
import { useFileMonitoring } from '../../../hooks/useFileMonitoring';
import { apiClient } from '../../../services/apiService';
import DocumentsSidebar from './DocumentsSidebar';
import DocumentsHeader from './DocumentsHeader';
import DocumentsFilters from './DocumentsFilters';
import DocumentCard from './DocumentCard';
import UploadedDocumentCard from './UploadedDocumentCard';
import DocumentGenerateModal from '../../modals/DocumentGenerateModal';
import DocumentEditModal from '../../modals/DocumentEditModal';
import DocumentUploadModal from '../../modals/DocumentUploadModal';
import useNotification from '../../../hooks/useNotification';
import { FileText, Plus, AlertCircle, CheckCircle, Upload, FolderOpen } from 'lucide-react';
import './DocumentsManagement.css';

const DocumentsManagement = () => {
  const {
    // Données
    projects,
    selectedProject,
    phases,
    documentTypes,
    documents,
    documentsTeleverses,
    
    // États UI
    loading,
    error,
    searchTerm,
    filterStatus,
    selectedType,
    sortBy,
    viewMode,
    
    // Statistiques
    stats,
    
    // Actions - Documents générés
    selectProject,
    loadPhases,
    loadDocuments,
    generateDocument,
    saveDocument,
    editDocument,
    viewDocument,
    deleteDocument,
    checkDocumentModifications,
    clearError,
    
    // Actions - Documents téléversés
    loadDocumentsTeleverses,
    televerserDocument,
    telechargerDocumentTeleverse,
    validerDocumentTeleverse,
    supprimerDocumentTeleverse,
    
    // Setters
    setSearchTerm,
    setFilterStatus,
    setSelectedType,
    setSortBy,
    setViewMode,
  } = useDocuments();

  const { showNotification } = useNotification();
  
  // États des modals
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [monitoredDocumentId, setMonitoredDocumentId] = useState(null);
  
  // État pour les onglets
  const [activeTab, setActiveTab] = useState('generated'); // 'generated' ou 'uploaded'

  // Surveillance automatique des modifications
  const { startMonitoring, stopMonitoring } = useFileMonitoring(
    monitoredDocumentId,
    async (result) => {
      if (result.success) {
        showNotification(
          `✅ ${result.message} - Taille: ${(result.size / 1024).toFixed(1)} KB`,
          'success'
        );
        
        // Recharger les documents pour mettre à jour l'interface
        if (selectedProject) {
          try {
            await loadDocuments(selectedProject.id);
            console.log('📄 Documents rechargés après modification détectée');
          } catch (error) {
            console.error('Erreur lors du rechargement des documents:', error);
          }
        }
      }
    }
  );

  // Les documents téléversés sont maintenant chargés automatiquement dans selectProject

  // Gestion des erreurs
  React.useEffect(() => {
    if (error) {
      showNotification(error, 'error');
      clearError();
    }
  }, [error, showNotification, clearError]);

  // Handlers
  const handleGenerateDocument = async (data) => {
    try {
      const result = await generateDocument(data);
      
      // Message de succès personnalisé selon le résultat
      if (result.auto_opened) {
        showNotification(
          'Document Word généré et ouvert automatiquement ! Vous pouvez maintenant l\'éditer et le sauvegarder.',
          'success'
        );
      } else {
        showNotification(
          'Document Word généré avec succès ! Vérifiez votre dossier de téléchargements.',
          'success'
        );
      }
      
      setGenerateModalOpen(false);
    } catch (error) {
      showNotification(error.message || 'Erreur lors de la génération', 'error');
    }
  };

  const handleSaveDocument = async (documentId, customData) => {
    try {
      const result = await saveDocument(documentId, customData);
      showNotification('Document sauvegardé et PDF généré avec succès !', 'success');
      setEditModalOpen(false);
    } catch (error) {
      showNotification(error.message || 'Erreur lors de la sauvegarde', 'error');
    }
  };


  const handleEditDocument = async (document) => {
    try {
      const result = await editDocument(document.id);
      showNotification(result.message || 'Document ouvert pour modification', 'success');
      
      // Démarrer la surveillance automatique
      setMonitoredDocumentId(document.id);
      startMonitoring(3000); // Vérification toutes les 3 secondes
      
      showNotification(
        '🔍 Surveillance automatique activée - Les modifications seront détectées automatiquement',
        'info'
      );
    } catch (error) {
      showNotification(error.message || 'Erreur lors de l\'ouverture du document', 'error');
    }
  };

  const handleDeleteDocument = async (document) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le document "${document.nom_fichier}" ?`)) {
      try {
        const result = await deleteDocument(document.id);
        showNotification(result.message || 'Document supprimé avec succès', 'success');
      } catch (error) {
        showNotification(error.message || 'Erreur lors de la suppression du document', 'error');
      }
    }
  };

  const handleViewDocument = async (document) => {
    try {
      const result = await viewDocument(document.id);
      showNotification(result.message || 'Document ouvert pour visualisation', 'success');
    } catch (error) {
      showNotification(error.message || 'Erreur lors de la visualisation du document', 'error');
    }
  };

  const handleStopMonitoring = () => {
    stopMonitoring();
    setMonitoredDocumentId(null);
    showNotification('🔍 Surveillance automatique arrêtée', 'info');
  };

  const handleForceSync = async (documentId) => {
    try {
      const response = await apiClient.post(`/api/documents/dashboard/${documentId}/forcer_synchronisation/`);
      if (response.data.success) {
        showNotification(
          `🔄 ${response.data.message} - Taille: ${(response.data.size / 1024).toFixed(1)} KB`,
          'success'
        );
        // Recharger les documents
        if (selectedProject) {
          await loadDocuments(selectedProject.id);
        }
      }
    } catch (error) {
      showNotification('Erreur lors de la synchronisation forcée', 'error');
    }
  };

  // ========================================
  // HANDLERS POUR DOCUMENTS TÉLÉVERSÉS
  // ========================================
  
  const handleUploadDocument = async (formData) => {
    try {
      const result = await televerserDocument(formData);
      showNotification('Document téléversé avec succès !', 'success');
      setUploadModalOpen(false);
    } catch (error) {
      showNotification(error.message || 'Erreur lors du téléversement', 'error');
    }
  };

  const handleDownloadUploadedDocument = async (documentId, nomFichier, typeFichier) => {
    try {
      await telechargerDocumentTeleverse(documentId, nomFichier, false, typeFichier);
      showNotification('Téléchargement démarré !', 'success');
    } catch (error) {
      showNotification(error.message || 'Erreur lors du téléchargement', 'error');
    }
  };

  const handleValidateUploadedDocument = async (documentId, statut) => {
    const action = statut === 'valide' ? 'valider' : 'rejeter';
    
    // Demander les informations de validation
    const nomValidateur = window.prompt(`Nom du validateur pour ${action} le document:`);
    if (!nomValidateur) return;
    
    const fonctionValidateur = window.prompt(`Fonction du validateur:`);
    if (!fonctionValidateur) return;
    
    const commentaire = window.prompt(`Commentaire pour ${action} le document (optionnel):`);
    if (commentaire === null) return; // L'utilisateur a annulé
    
    try {
      await validerDocumentTeleverse(documentId, statut, commentaire || '', nomValidateur, fonctionValidateur);
      showNotification(`Document ${action} avec succès !`, 'success');
    } catch (error) {
      showNotification(error.message || `Erreur lors de la ${action}`, 'error');
    }
  };

  const handleDeleteUploadedDocument = async (documentId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document téléversé ?')) {
      try {
        await supprimerDocumentTeleverse(documentId);
        showNotification('Document supprimé avec succès !', 'success');
      } catch (error) {
        showNotification(error.message || 'Erreur lors de la suppression', 'error');
      }
    }
  };


  // Fonctions utilitaires pour les icônes et couleurs
  const getDocumentIcon = (type) => {
    const docType = documentTypes.find(dt => dt.id === type);
    return docType ? docType.icone : '📄';
  };

  const getDocumentColor = (type) => {
    const docType = documentTypes.find(dt => dt.id === type);
    return docType ? docType.couleur : '#666';
  };

  return (
    <div className="min-h-screen bg-gray-50 documents-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <DocumentsSidebar
            projects={projects}
            selectedProject={selectedProject}
            onProjectSelect={selectProject}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />

          {/* Contenu principal */}
          <div className="flex-1">
            {/* Header */}
            <DocumentsHeader
              selectedProject={selectedProject}
              documentsCount={documents.length + documentsTeleverses.length}
              onGenerateDocument={() => setGenerateModalOpen(true)}
              onUploadDocument={() => setUploadModalOpen(true)}
              onFilterChange={setFilterStatus}
              onSearchChange={setSearchTerm}
              searchTerm={searchTerm}
              filterStatus={filterStatus}
            />

            {/* Indicateur de surveillance */}
            {monitoredDocumentId && (
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg"></span>
                      <span className="text-sm text-blue-800 font-semibold">
                        Surveillance active
                      </span>
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        ID: {monitoredDocumentId}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleForceSync(monitoredDocumentId)}
                      className="px-3 py-1 text-xs text-green-700 bg-green-100 hover:bg-green-200 rounded-full transition-colors font-medium"
                    >
                      🔄  Synchroniser
                    </button>
                    <button
                      onClick={handleStopMonitoring}
                      className="px-3 py-1 text-xs text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors font-medium"
                    >
                      Arrêter
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Filtres */}
            <DocumentsFilters
              filterStatus={filterStatus}
              onFilterChange={setFilterStatus}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              sortBy={sortBy}
              onSortChange={setSortBy}
              documentTypes={documentTypes}
              selectedType={selectedType}
              onTypeChange={setSelectedType}
            />

            {/* Onglets pour distinguer les types de documents */}
            {selectedProject && (
              <div className="mb-6">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('generated')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'generated'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Documents Générés ({documents.length})
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('uploaded')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'uploaded'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Documents Téléversés ({documentsTeleverses.length})
                      </div>
                    </button>
                  </nav>
                </div>
              </div>
            )}

            {/* Liste des documents */}
            {!selectedProject ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">📁</span>
                </div>
                <h3 className="text-2xl font-medium text-gray-900 mb-4">
                  Sélectionnez un projet
                </h3>
                <p className="text-lg text-gray-500">
                  Choisissez un projet dans la sidebar pour voir ses documents
                </p>
              </div>
            ) : (
              <>
                {/* Documents Générés */}
                {activeTab === 'generated' && (
                  <>
                    {documents.length === 0 ? (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center">
                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <FileText className="w-12 h-12 text-blue-600" />
                        </div>
                        <h3 className="text-2xl font-medium text-gray-900 mb-4">
                          Aucun document généré
                        </h3>
                        <p className="text-lg text-gray-500 mb-6">
                          Ce projet n'a pas encore de documents générés automatiquement
                        </p>
                        <button
                          onClick={() => setGenerateModalOpen(true)}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
                        >
                          <Plus className="w-5 h-5" />
                          Générer le premier document
                        </button>
                      </div>
                    ) : (
                      <div className={`grid gap-4 ${
                        viewMode === 'grid' 
                          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                          : 'grid-cols-1'
                      }`}>
                        {documents.map((document) => (
                          <DocumentCard
                            key={document.id}
                            document={document}
                            viewMode={viewMode}
                            onEdit={handleEditDocument}
                            onDelete={handleDeleteDocument}
                            onView={handleViewDocument}
                            getDocumentIcon={getDocumentIcon}
                            getDocumentColor={getDocumentColor}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Documents Téléversés */}
                {activeTab === 'uploaded' && (
                  <>
                    {documentsTeleverses.length === 0 ? (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Upload className="w-12 h-12 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-medium text-gray-900 mb-4">
                          Aucun document téléversé
                        </h3>
                        <p className="text-lg text-gray-500 mb-6">
                          Ce projet n'a pas encore de documents téléversés
                        </p>
                        <button
                          onClick={() => setUploadModalOpen(true)}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-medium"
                        >
                          <Upload className="w-5 h-5" />
                          Téléverser le premier document
                        </button>
                      </div>
                    ) : (
                      <div className={`grid gap-4 ${
                        viewMode === 'grid' 
                          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                          : 'grid-cols-1'
                      }`}>
                        {documentsTeleverses.map((document) => (
                          <UploadedDocumentCard
                            key={document.id}
                            document={document}
                            onDownload={handleDownloadUploadedDocument}
                            onDelete={handleDeleteUploadedDocument}
                            onValidate={handleValidateUploadedDocument}
                            canValidate={true} // TODO: Basé sur les permissions utilisateur
                            canDelete={true} // TODO: Basé sur les permissions utilisateur
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

          </div>
        </div>
      </div>

      {/* Modals */}
      <DocumentGenerateModal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        selectedProject={selectedProject}
        phases={phases}
        documentTypes={documentTypes}
        onGenerate={handleGenerateDocument}
        loading={loading}
        onLoadPhases={loadPhases}
      />

      <DocumentEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        document={selectedDocument}
        onSave={handleSaveDocument}
        loading={loading}
      />

      <DocumentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        selectedProject={selectedProject}
        phases={phases}
        onUpload={handleUploadDocument}
        loading={loading}
        onLoadPhases={loadPhases}
      />
    </div>
  );
};

export default DocumentsManagement;
