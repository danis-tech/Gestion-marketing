import React, { useState, useEffect, useRef } from 'react';
import { useDocuments } from '../../../hooks/useDocuments';
import { useFileMonitoring } from '../../../hooks/useFileMonitoring';
import { apiClient } from '../../../services/apiService';
import DocumentsSidebar from './DocumentsSidebar';
import DocumentsHeader from './DocumentsHeader';
import DocumentsFilters from './DocumentsFilters';
import DocumentCard from './DocumentCard';
import DocumentGenerateModal from '../../modals/DocumentGenerateModal';
import DocumentEditModal from '../../modals/DocumentEditModal';
import useNotification from '../../../hooks/useNotification';
import { FileText, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import './DocumentsManagement.css';

const DocumentsManagement = () => {
  const {
    // Données
    projects,
    selectedProject,
    phases,
    etapes,
    documentTypes,
    documents,
    
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
    
    // Actions
    selectProject,
    loadEtapes,
    loadDocuments,
    generateDocument,
    saveDocument,
    editDocument,
    viewDocument,
    deleteDocument,
    checkDocumentModifications,
    clearError,
    
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
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [monitoredDocumentId, setMonitoredDocumentId] = useState(null);

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
              documentsCount={documents.length}
              onGenerateDocument={() => setGenerateModalOpen(true)}
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
            ) : documents.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">📄</span>
                </div>
                <h3 className="text-2xl font-medium text-gray-900 mb-4">
                  Aucun document trouvé
                </h3>
                <p className="text-lg text-gray-500 mb-6">
                  Ce projet n'a pas encore de documents générés
                </p>
                <button
                  onClick={() => setGenerateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
                >
                  <span className="text-xl">+</span>
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

          </div>
        </div>
      </div>

      {/* Modals */}
      <DocumentGenerateModal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        selectedProject={selectedProject}
        phases={phases}
        etapes={etapes}
        documentTypes={documentTypes}
        onGenerate={handleGenerateDocument}
        loading={loading}
        onLoadEtapes={loadEtapes}
      />

      <DocumentEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        document={selectedDocument}
        onSave={handleSaveDocument}
        loading={loading}
      />
    </div>
  );
};

export default DocumentsManagement;
