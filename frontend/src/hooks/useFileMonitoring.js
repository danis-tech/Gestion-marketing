import { useCallback, useRef, useEffect } from 'react';
import { apiClient } from '../services/apiService';

/**
 * Hook pour surveiller les modifications de fichiers et synchroniser automatiquement
 */
export const useFileMonitoring = (documentId, onSyncComplete) => {
  const intervalRef = useRef(null);
  const lastCheckRef = useRef(null);

  // Fonction pour vérifier les modifications
  const checkForModifications = useCallback(async () => {
    if (!documentId) return;

    try {
      const response = await apiClient.post(`/api/documents/dashboard/${documentId}/verifier_modifications/`);
      
      if (response.data.success && response.data.modified) {
        // Le fichier a été modifié
        console.log('📄 Modification détectée:', response.data);
        if (onSyncComplete) {
          onSyncComplete({
            success: true,
            message: response.data.message,
            version: response.data.version,
            size: response.data.size,
            lastModified: response.data.last_modified
          });
        }
      } else if (response.data.success && !response.data.modified) {
        // Pas de modification, mais on peut logger pour debug
        console.log('📄 Aucune modification détectée pour le document', documentId);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des modifications:', error);
    }
  }, [documentId, onSyncComplete]);

  // Démarrer la surveillance
  const startMonitoring = useCallback((intervalMs = 5000) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Vérification immédiate
    checkForModifications();
    lastCheckRef.current = Date.now();

    // Vérifications périodiques
    intervalRef.current = setInterval(() => {
      checkForModifications();
      lastCheckRef.current = Date.now();
    }, intervalMs);
  }, [checkForModifications]);

  // Arrêter la surveillance
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Nettoyage automatique
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    startMonitoring,
    stopMonitoring,
    checkForModifications,
    isMonitoring: intervalRef.current !== null
  };
};

export default useFileMonitoring;
