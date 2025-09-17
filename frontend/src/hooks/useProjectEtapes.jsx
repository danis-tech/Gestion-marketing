import { useState } from 'react';
import { etapesService } from '../services/apiService';
import useNotification from './useNotification';

export const useProjectEtapes = () => {
  const [expandedEtapes, setExpandedEtapes] = useState(new Set());
  const { showSuccess, showError } = useNotification();

  // Gestion de l'expansion des étapes
  const toggleEtapeExpansion = (etapeId) => {
    const newExpanded = new Set(expandedEtapes);
    if (newExpanded.has(etapeId)) {
      newExpanded.delete(etapeId);
    } else {
      newExpanded.add(etapeId);
    }
    setExpandedEtapes(newExpanded);
  };

  // Actions sur les étapes
  const handleEtapeAction = async (action, projectId, phaseId, etapeId, onSuccess) => {
    try {
      let response;
      let actionText = '';
      
      switch (action) {
        case 'start':
          response = await etapesService.startEtape(projectId, phaseId, etapeId);
          actionText = 'démarrée';
          break;
        case 'end':
          response = await etapesService.endEtape(projectId, phaseId, etapeId);
          actionText = 'terminée';
          break;
        case 'cancel':
          response = await etapesService.cancelEtape(projectId, phaseId, etapeId);
          actionText = 'annulée';
          break;
        default:
          throw new Error(`Action non supportée: ${action}`);
      }

      if (response) {
        showSuccess('Succès', `Étape ${actionText} avec succès`);
        // Appeler le callback de succès pour recharger les données
        if (onSuccess) {
          await onSuccess();
        }
        return { success: true, data: response };
      } else {
        throw new Error('Erreur lors de l\'action sur l\'étape');
      }
    } catch (error) {
      console.error(`Erreur lors de l'action ${action} sur l'étape:`, error);
      showError('Erreur', 'Impossible d\'effectuer cette action sur l\'étape');
      return { success: false, error: error.message };
    }
  };

  // Supprimer une étape
  const handleDeleteEtape = async (projectId, phaseId, etapeId, onSuccess) => {
    try {
      const response = await etapesService.deleteEtape(projectId, phaseId, etapeId);
      
      if (response) {
        showSuccess('Succès', 'Étape supprimée avec succès');
        // Appeler le callback de succès pour recharger les données
        if (onSuccess) {
          await onSuccess();
        }
        return { success: true };
      } else {
        throw new Error('Erreur lors de la suppression de l\'étape');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'étape:', error);
      showError('Erreur', 'Impossible de supprimer l\'étape');
      return { success: false, error: error.message };
    }
  };

  // Fonctions utilitaires pour les statuts des étapes
  const getEtapeStatusIcon = (etape) => {
    if (etape.statut === 'terminee') return <div className="w-3 h-3 bg-green-500 rounded-full"></div>;
    if (etape.statut === 'en_cours') return <div className="w-3 h-3 bg-blue-500 rounded-full"></div>;
    return <div className="w-3 h-3 bg-gray-300 rounded-full"></div>;
  };

  const getEtapeStatusColor = (etape) => {
    if (etape.statut === 'terminee') return 'bg-green-100 text-green-800 border-green-200';
    if (etape.statut === 'en_cours') return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getEtapeStatusText = (etape) => {
    if (etape.statut === 'terminee') return 'Terminée';
    if (etape.statut === 'en_cours') return 'En cours';
    return 'En attente';
  };

  const getPriorityColor = (priorite) => {
    switch (priorite) {
      case 'haute': return 'bg-red-100 text-red-800';
      case 'moyenne': return 'bg-yellow-100 text-yellow-800';
      case 'basse': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return {
    // État
    expandedEtapes,
    
    // Actions
    toggleEtapeExpansion,
    handleEtapeAction,
    handleDeleteEtape,
    
    // Fonctions utilitaires
    getEtapeStatusIcon,
    getEtapeStatusColor,
    getEtapeStatusText,
    getPriorityColor
  };
};
