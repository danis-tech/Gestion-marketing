import React, { useState, useEffect } from 'react';
import { Target, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useProjectPhases, useProjectEtapes } from '../../hooks';
import { phasesService, projectCompletionService } from '../../services/apiService';
import useNotification from '../../hooks/useNotification';
import { 
  ProjectSidebar, 
  ProjectStats, 
  PhaseCard, 
  PhasesFilters, 
  PhasesHeader 
} from './phases-etapes';
import PhaseEditModal from '../modals/PhaseEditModal';
import EtapeEditModal from '../modals/EtapeEditModal';
import EtapeAddModal from '../modals/EtapeAddModal';

const PhasesEtapesManagementNew = () => {
  const { showSuccess, showError } = useNotification();
  
  const {
    projects,
    selectedProject,
    projectPhases,
    progression,
    loading,
    searchTerm,
    filterStatus,
    setSearchTerm,
    setFilterStatus,
    handleProjectSelect,
    loadProjectPhases,
    loadProjects
  } = useProjectPhases();

  // Hook pour la gestion des étapes
  const {
    expandedEtapes,
    toggleEtapeExpansion,
    handleEtapeAction: handleEtapeActionHook,
    handleDeleteEtape: handleDeleteEtapeHook,
    getEtapeStatusIcon,
    getEtapeStatusColor,
    getEtapeStatusText,
    getPriorityColor
  } = useProjectEtapes();

  // États locaux
  const [viewMode, setViewMode] = useState('list');
  const [expandedPhases, setExpandedPhases] = useState(new Set());
  const [forceRefresh, setForceRefresh] = useState(0);
  const [projectCompletionStatus, setProjectCompletionStatus] = useState(null);
  const [isCheckingCompletion, setIsCheckingCompletion] = useState(false);

  // Charger les projets au démarrage (une seule fois)
  useEffect(() => {
    loadProjects();
  }, []); // Dependencies vides pour éviter les re-renders

  // Vérifier le statut de completion quand un projet est sélectionné
  useEffect(() => {
    if (selectedProject) {
      checkProjectCompletionStatus();
    }
  }, [selectedProject]);

  // Fonctions pour la gestion de la completion du projet
  const checkProjectCompletionStatus = async () => {
    if (!selectedProject) return;
    
    try {
      setIsCheckingCompletion(true);
      const status = await projectCompletionService.peutEtreTermine(selectedProject.id);
      setProjectCompletionStatus(status);
    } catch (error) {
      console.error('Erreur lors de la vérification du statut de completion:', error);
      showError('Erreur', 'Impossible de vérifier le statut de completion du projet');
    } finally {
      setIsCheckingCompletion(false);
    }
  };

  const handleProjectCompletionToggle = async () => {
    if (!selectedProject) return;
    
    try {
         if (projectCompletionStatus?.peut_etre_termine && !projectCompletionStatus?.projet?.est_termine) {
        // Marquer comme terminé
        await projectCompletionService.marquerTermine(selectedProject.id);
        showSuccess('Succès', 'Projet marqué comme terminé avec succès');
      } else {
        // Marquer comme non terminé
        await projectCompletionService.marquerNonTermine(selectedProject.id);
        showSuccess('Succès', 'Projet marqué comme non terminé avec succès');
      }
      
      // Recharger les données
      await checkProjectCompletionStatus();
      await loadProjectPhases(selectedProject.id);
      setForceRefresh(prev => prev + 1);
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      if (error.response?.data?.error) {
        showError('Erreur', error.response.data.error);
      } else {
        showError('Erreur', 'Impossible de modifier le statut du projet');
      }
    }
  };

  
  // États des modaux
  const [isPhaseEditModalOpen, setIsPhaseEditModalOpen] = useState(false);
  const [isEtapeEditModalOpen, setIsEtapeEditModalOpen] = useState(false);
  const [isEtapeAddModalOpen, setIsEtapeAddModalOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [selectedEtape, setSelectedEtape] = useState(null);

  // Fonctions utilitaires pour les statuts des phases
  const getPhaseStatusIcon = (phase) => {
    if (phase.terminee) return <div className="w-4 h-4 bg-green-500 rounded-full"></div>;
    if (phase.ignoree) return <div className="w-4 h-4 bg-red-500 rounded-full"></div>;
    if (phase.est_en_cours) return <div className="w-4 h-4 bg-blue-500 rounded-full"></div>;
    return <div className="w-4 h-4 bg-gray-300 rounded-full"></div>;
  };

  const getPhaseStatusColor = (phase) => {
    if (phase.terminee) return 'bg-green-100 text-green-800 border-green-200';
    if (phase.ignoree) return 'bg-red-100 text-red-800 border-red-200';
    if (phase.est_en_cours) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPhaseStatusText = (phase) => {
    if (phase.terminee) return 'Terminée';
    if (phase.ignoree) return 'Ignorée';
    if (phase.est_en_cours) return 'En cours';
    return 'En attente';
  };

  // Gestion de l'expansion des phases
  const togglePhaseExpansion = (phaseId) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  // Actions sur les phases
  const handlePhaseAction = async (action, phaseId) => {
    try {
      if (!selectedProject) {
        showError('Erreur', 'Aucun projet sélectionné');
        return;
      }

      // Trouver la phase pour afficher son nom
      const phase = projectPhases.find(p => p.id === phaseId);
      const phaseName = phase?.phase?.nom || 'Phase';

      let response;
      
      switch (action) {
        case 'start':
          response = await phasesService.markPhaseStart(selectedProject.id, phaseId);
          if (response) {
            showSuccess('Succès', `Phase "${phaseName}" démarrée avec succès`);
          }
          break;
        case 'end':
          // Vérifier côté frontend si la phase peut être terminée (si la propriété est disponible)
          if (phase.peut_etre_terminee === false) {
            const etapesNonTerminees = phase.etapes_en_attente_ou_en_cours || [];
            const nomsEtapes = etapesNonTerminees.map(etape => etape.nom).join(', ');
            showError(
              'Impossible de terminer la phase', 
              `Toutes les étapes doivent être terminées ou annulées avant de terminer la phase. Étapes en attente/en cours : ${nomsEtapes}`
            );
            return;
          }
          
          response = await phasesService.markPhaseEnd(selectedProject.id, phaseId);
          if (response) {
            console.log('Réponse de termination de phase:', response);
            showSuccess('Succès', `Phase "${phaseName}" terminée avec succès`);
          }
          break;
        default:
          showError('Erreur', `Action non supportée: ${action}`);
          return;
      }

      if (response) {
        // Recharger les phases après l'action avec un petit délai pour s'assurer que le backend a bien mis à jour
        console.log('Rechargement des phases après action:', action, 'sur phase:', phaseId);
        
        // Attendre un peu pour s'assurer que le backend a bien traité la requête
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Recharger les phases
        await loadProjectPhases(selectedProject.id);
        console.log('Phases rechargées');
        
        // Forcer un refresh de l'interface
        setForceRefresh(prev => prev + 1);
        
        // Vérifier si la phase est bien terminée dans la réponse
        if (action === 'end' && response?.phase_etat) {
          console.log('Phase terminée dans la réponse:', response.phase_etat);
          console.log('ID de la phase dans la réponse:', response.phase_etat.id);
          console.log('ID de la phase cliquée:', phaseId);
          if (response.phase_etat.terminee) {
            console.log('Phase confirmée comme terminée côté backend');
          } else {
            console.warn('Phase NON terminée dans la réponse !');
            console.warn('Problème de cohérence détecté - forcer un rechargement complet');
            // Forcer un rechargement complet de la page en cas d'incohérence
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        }
        
        // Forcer un rechargement supplémentaire après un délai plus long
        setTimeout(async () => {
          console.log('Rechargement de sécurité des phases');
          await loadProjectPhases(selectedProject.id);
          setForceRefresh(prev => prev + 1);
        }, 500);
      }
    } catch (error) {
      console.error('Erreur lors de l\'action sur la phase:', error);
      
      // Gérer les erreurs spécifiques de validation
      if (error.response?.status === 400 && error.response?.data?.error) {
        const errorMessage = error.response.data.error;
        
        if (errorMessage.includes("déjà terminée")) {
          showError('Phase déjà terminée', 'Cette phase est déjà terminée.');
        } else if (errorMessage.includes("étapes ne sont pas terminées")) {
          const etapesEnAttente = error.response.data.etapes_en_attente || [];
          const nomsEtapes = etapesEnAttente.map(etape => etape.nom).join(', ');
          showError(
            'Impossible de terminer la phase', 
            `Toutes les étapes doivent être terminées ou annulées avant de terminer la phase. Étapes en attente/en cours : ${nomsEtapes}`
          );
        } else {
          showError('Erreur', errorMessage);
        }
      } else {
        showError('Erreur', 'Impossible d\'effectuer cette action sur la phase');
      }
    }
  };

  // Actions sur les étapes
  const handleEtapeAction = async (action, phaseId, etapeId) => {
    return await handleEtapeActionHook(action, selectedProject?.id, phaseId, etapeId, () => {
      if (selectedProject) {
        return loadProjectPhases(selectedProject.id);
      }
    });
  };

  // Gestion des modaux
  const handleEditPhase = (phase) => {
    setSelectedPhase(phase);
    setIsPhaseEditModalOpen(true);
  };

  const handleEditEtape = (etape) => {
    setSelectedEtape(etape);
    setIsEtapeEditModalOpen(true);
  };

  const handleAddEtape = (phaseId) => {
    const phase = projectPhases.find(p => p.id === phaseId);
    setSelectedPhase(phase);
    setIsEtapeAddModalOpen(true);
  };

  const handleDeleteEtape = async (phaseId, etapeId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette étape ?')) {
      return await handleDeleteEtapeHook(selectedProject?.id, phaseId, etapeId, () => {
        if (selectedProject) {
          return loadProjectPhases(selectedProject.id);
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <PhasesHeader progression={progression} />

      {/* Contenu principal */}
      <div className="w-full flex justify-center py-8">
        <div className="w-[90%] px-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <ProjectSidebar
            projects={projects}
            selectedProject={selectedProject}
            onProjectSelect={handleProjectSelect}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />

          {/* Contenu principal */}
          <div className="flex-1 min-w-0">
            {selectedProject ? (
              <div className="space-y-4">
                {/* Statistiques du projet */}
                <ProjectStats
                  selectedProject={selectedProject}
                  progression={progression}
                />

                {/* Bouton de completion du projet */}
                {(projectCompletionStatus || isCheckingCompletion) && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    {/* Interface de completion du projet */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                         {projectCompletionStatus?.projet?.est_termine ? (
                           <CheckCircle className="w-6 h-6 text-green-500" />
                         ) : (
                           <XCircle className="w-6 h-6 text-gray-400" />
                         )}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Statut du projet
                          </h3>
                           <p className="text-sm text-gray-600">
                             {projectCompletionStatus?.projet?.est_termine 
                               ? 'Projet terminé' 
                               : 'Projet en cours'
                             }
                           </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        {projectCompletionStatus?.phases_non_terminees?.length > 0 && (
                          <div className="text-sm text-gray-500">
                            <AlertCircle className="w-4 h-4 inline mr-1" />
                            {projectCompletionStatus.phases_non_terminees.length} phase(s) non terminée(s)
                          </div>
                        )}
                        
                        <button
                          onClick={handleProjectCompletionToggle}
                          disabled={isCheckingCompletion || !projectCompletionStatus}
                           className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                             projectCompletionStatus?.projet?.est_termine
                               ? 'bg-orange-100 text-orange-800 hover:bg-orange-200 border border-orange-300'
                               : projectCompletionStatus?.peut_etre_termine
                               ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300'
                               : 'bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-300'
                           }`}
                        >
                          {isCheckingCompletion ? (
                            'Vérification...'
                          ) : projectCompletionStatus?.projet?.est_termine ? (
                            'Marquer comme non terminé'
                          ) : projectCompletionStatus?.peut_etre_termine ? (
                            'Marquer comme terminé'
                          ) : (
                            'Impossible de terminer'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Filtres et contrôles */}
                <PhasesFilters
                  filterStatus={filterStatus}
                  onFilterChange={setFilterStatus}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />

                {/* Liste des phases */}
                <div className="space-y-4">
                  {projectPhases.length > 0 ? (
                    projectPhases.map((phase) => (
                      <PhaseCard
                        key={phase.id}
                        phase={phase}
                        isExpanded={expandedPhases.has(phase.id)}
                        onToggleExpansion={togglePhaseExpansion}
                        onPhaseAction={handlePhaseAction}
                        onEditPhase={handleEditPhase}
                        onAddEtape={handleAddEtape}
                        expandedEtapes={expandedEtapes}
                        onToggleEtapeExpansion={toggleEtapeExpansion}
                        onEtapeAction={handleEtapeAction}
                        onEditEtape={handleEditEtape}
                        onDeleteEtape={handleDeleteEtape}
                        getPhaseStatusIcon={getPhaseStatusIcon}
                        getPhaseStatusColor={getPhaseStatusColor}
                        getPhaseStatusText={getPhaseStatusText}
                        getEtapeStatusIcon={getEtapeStatusIcon}
                        getEtapeStatusColor={getEtapeStatusColor}
                        getEtapeStatusText={getEtapeStatusText}
                        getPriorityColor={getPriorityColor}
                      />
                    ))
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                      <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Aucune phase trouvée
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Ce projet n'a pas encore de phases définies.
                      </p>
                      <button
                        onClick={() => {
                          if (selectedProject) {
                            loadProjectPhases(selectedProject.id);
                          }
                        }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                      >
                        Recharger les phases
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucun projet sélectionné
                </h3>
                <p className="text-sm text-gray-600">
                  Sélectionnez un projet dans la liste pour voir ses phases et étapes
                </p>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Modals */}
      {isPhaseEditModalOpen && selectedPhase && (
        <PhaseEditModal
          isOpen={isPhaseEditModalOpen}
          onClose={() => {
            setIsPhaseEditModalOpen(false);
            setSelectedPhase(null);
          }}
          phase={selectedPhase}
          projectId={selectedProject?.id}
          onSuccess={() => {
            loadProjectPhases(selectedProject.id);
            setIsPhaseEditModalOpen(false);
            setSelectedPhase(null);
          }}
        />
      )}

      {isEtapeEditModalOpen && selectedEtape && (
        <EtapeEditModal
          isOpen={isEtapeEditModalOpen}
          onClose={() => {
            setIsEtapeEditModalOpen(false);
            setSelectedEtape(null);
          }}
          etape={selectedEtape}
          projectId={selectedProject?.id}
          onSuccess={() => {
            loadProjectPhases(selectedProject.id);
            setIsEtapeEditModalOpen(false);
            setSelectedEtape(null);
          }}
        />
      )}

      {isEtapeAddModalOpen && selectedPhase && (
        <EtapeAddModal
          isOpen={isEtapeAddModalOpen}
          onClose={() => {
            setIsEtapeAddModalOpen(false);
            setSelectedPhase(null);
          }}
          phaseId={selectedPhase.id}
          projectId={selectedProject?.id}
          onSuccess={() => {
            loadProjectPhases(selectedProject.id);
            setIsEtapeAddModalOpen(false);
            setSelectedPhase(null);
          }}
        />
      )}
    </div>
  );
};

export default PhasesEtapesManagementNew;
