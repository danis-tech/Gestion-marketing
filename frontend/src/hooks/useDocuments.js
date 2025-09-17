import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiService';

export const useDocuments = () => {
  // États principaux
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [phases, setPhases] = useState([]);
  const [etapes, setEtapes] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [documents, setDocuments] = useState([]);
  
  // États UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [viewMode, setViewMode] = useState('grid');

  // Charger les données initiales
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const [projectsRes, typesRes] = await Promise.all([
        apiClient.get('/api/documents/dashboard/projets_disponibles/'),
        apiClient.get('/api/documents/dashboard/types_documents/')
      ]);
      
      setProjects(projectsRes.data.projets);
      setDocumentTypes(typesRes.data.types_documents);
    } catch (error) {
      setError('Erreur lors du chargement des données');
      console.error('Erreur loadInitialData:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les phases d'un projet
  const loadPhases = useCallback(async (projectId) => {
    try {
      const response = await apiClient.get(`/api/documents/dashboard/phases_projet/?projet_id=${projectId}`);
      setPhases(response.data.phases);
    } catch (error) {
      console.error('Erreur loadPhases:', error);
    }
  }, []);

  // Charger les étapes d'une phase
  const loadEtapes = useCallback(async (phaseId) => {
    try {
      const response = await apiClient.get(`/api/documents/dashboard/etapes_phase/?phase_id=${phaseId}`);
      setEtapes(response.data.etapes);
    } catch (error) {
      console.error('Erreur loadEtapes:', error);
    }
  }, []);

  // Charger les documents d'un projet
  const loadDocuments = useCallback(async (projectId) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/documents/dashboard/documents_projet/?projet_id=${projectId}`);
      setDocuments(response.data.documents);
    } catch (error) {
      setError('Erreur lors du chargement des documents');
      console.error('Erreur loadDocuments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sélectionner un projet
  const selectProject = useCallback((project) => {
    setSelectedProject(project);
    setPhases([]);
    setEtapes([]);
    if (project) {
      loadPhases(project.id);
      loadDocuments(project.id);
    }
  }, [loadPhases, loadDocuments]);

  // Générer un document
  const generateDocument = useCallback(async (data) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiClient.post('/api/documents/dashboard/generer_document_word/', data);
      
      if (response.data.success) {
        // Recharger les documents
        if (selectedProject) {
          await loadDocuments(selectedProject.id);
        }
        return response.data;
      } else {
        throw new Error(response.data.error || 'Erreur lors de la génération');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Erreur lors de la génération';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [selectedProject, loadDocuments]);

  // Sauvegarder un document
  const saveDocument = useCallback(async (documentId, customData = {}) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiClient.post('/api/documents/dashboard/sauvegarder_document/', {
        document_id: documentId,
        custom_data: customData
      });
      
      if (response.data.success) {
        // Recharger les documents
        if (selectedProject) {
          await loadDocuments(selectedProject.id);
        }
        return response.data;
      } else {
        throw new Error(response.data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Erreur lors de la sauvegarde';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [selectedProject, loadDocuments]);


  // Ouvrir le document pour modification
  const editDocument = useCallback(async (documentId) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiClient.post(`/api/documents/dashboard/${documentId}/ouvrir_document/`);
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.error || 'Erreur lors de l\'ouverture du document');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Erreur lors de l\'ouverture du document';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Visualiser le document
  const viewDocument = useCallback(async (documentId) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiClient.post(`/api/documents/dashboard/${documentId}/visualiser_document/`);
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.error || 'Erreur lors de la visualisation du document');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Erreur lors de la visualisation du document';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Supprimer le document
  const deleteDocument = useCallback(async (documentId) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiClient.delete(`/api/documents/dashboard/${documentId}/supprimer_document/`);
      
      if (response.data.success) {
        // Recharger les documents après suppression
        if (selectedProject) {
          await loadDocuments(selectedProject.id);
        }
        return response.data;
      } else {
        throw new Error(response.data.error || 'Erreur lors de la suppression du document');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Erreur lors de la suppression du document';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [selectedProject, loadDocuments]);

  // Vérifier les modifications d'un document
  const checkDocumentModifications = useCallback(async (documentId) => {
    try {
      const response = await apiClient.post(`/api/documents/dashboard/${documentId}/verifier_modifications/`);
      
      if (response.data.success) {
        // Recharger les documents si modifié
        if (response.data.modified && selectedProject) {
          await loadDocuments(selectedProject.id);
        }
        return response.data;
      } else {
        throw new Error(response.data.error || 'Erreur lors de la vérification des modifications');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Erreur lors de la vérification des modifications';
      setError(errorMessage);
      throw error;
    }
  }, [selectedProject, loadDocuments]);

  // Filtrer et trier les documents
  const filteredDocuments = documents.filter(doc => {
    // Filtre par statut
    if (filterStatus !== 'all' && doc.statut !== filterStatus) {
      return false;
    }
    
    // Filtre par type
    if (selectedType !== 'all' && doc.type_document !== selectedType) {
      return false;
    }
    
    // Filtre par recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        doc.nom_fichier.toLowerCase().includes(searchLower) ||
        doc.type_document.toLowerCase().includes(searchLower) ||
        doc.cree_par.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'date_desc':
        return new Date(b.date_creation) - new Date(a.date_creation);
      case 'date_asc':
        return new Date(a.date_creation) - new Date(b.date_creation);
      case 'name_asc':
        return a.nom_fichier.localeCompare(b.nom_fichier);
      case 'name_desc':
        return b.nom_fichier.localeCompare(a.nom_fichier);
      case 'size_desc':
        return b.taille_fichier - a.taille_fichier;
      case 'size_asc':
        return a.taille_fichier - b.taille_fichier;
      default:
        return 0;
    }
  });

  // Projets filtrés par recherche
  const filteredProjects = projects.filter(project => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      project.nom.toLowerCase().includes(searchLower) ||
      project.code.toLowerCase().includes(searchLower)
    );
  });

  // Statistiques
  const stats = {
    totalDocuments: documents.length,
    documentsFinalises: documents.filter(d => d.statut === 'finalise').length,
    documentsBrouillons: documents.filter(d => d.statut === 'brouillon').length,
    documentsArchives: documents.filter(d => d.statut === 'archived').length,
  };

  // Effacer les erreurs
  const clearError = useCallback(() => {
    setError('');
  }, []);

  // Charger les données au montage
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    // Données
    projects: filteredProjects,
    selectedProject,
    phases,
    etapes,
    documentTypes,
    documents: filteredDocuments,
    
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
    loadPhases,
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
  };
};
