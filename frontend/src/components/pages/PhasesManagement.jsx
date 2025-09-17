import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Plus, 
  Trash2, 
  Calendar,
  Clock,
  TrendingUp,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Circle,
  Grid3X3,
  List
} from 'lucide-react';
import { projectsService, phasesService } from '../../services/apiService';
import useNotification from '../../hooks/useNotification';
import PhaseEditModal from '../modals/PhaseEditModal';
import PhaseAddModal from '../modals/PhaseAddModal';
import { PhaseProgressCard, PhaseStatsCard } from '../ui';
import './PhasesManagement.css';

const PhasesManagement = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectPhases, setProjectPhases] = useState([]);
  const [progression, setProgression] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedPhases, setExpandedPhases] = useState(new Set());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  
  const { showSuccess, showError } = useNotification();

  // Charger les projets au montage
  useEffect(() => {
    loadProjects();
  }, []);

  // Charger les phases du projet sélectionné
  useEffect(() => {
    if (selectedProject) {
      loadProjectPhases(selectedProject.id);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsService.getProjects();
      setProjects(response.results || response);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les projets');
      console.error('Erreur lors du chargement des projets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectPhases = async (projectId) => {
    try {
      setLoading(true);
      const [phasesResponse, progressionResponse] = await Promise.all([
        phasesService.getProjectPhases(projectId),
        phasesService.getProjectPhasesProgression(projectId)
      ]);
      
      setProjectPhases(phasesResponse);
      setProgression(progressionResponse);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les phases du projet');
      console.error('Erreur lors du chargement des phases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setExpandedPhases(new Set());
  };

  const handlePhaseAction = async (action, phaseId) => {
    if (!selectedProject) return;

    try {
      setLoading(true);
      let response;
      
      switch (action) {
        case 'start':
          response = await phasesService.markPhaseStart(selectedProject.id, phaseId);
          break;
        case 'end':
          response = await phasesService.markPhaseEnd(selectedProject.id, phaseId);
          break;
        default:
          return;
      }
      
      showSuccess('Succès', response.message);
      loadProjectPhases(selectedProject.id);
    } catch (error) {
      showError('Erreur', 'Impossible d\'effectuer cette action');
      console.error('Erreur lors de l\'action sur la phase:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPhase = (phase) => {
    setSelectedPhase(phase);
    setIsEditModalOpen(true);
  };

  const handleAddPhase = () => {
    setIsAddModalOpen(true);
  };

  const handleDeletePhase = async (phaseId) => {
    if (!selectedProject) return;
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette phase ?')) {
      try {
        setLoading(true);
        await phasesService.updateProjectPhase(selectedProject.id, phaseId, { ignoree: true });
        showSuccess('Succès', 'Phase supprimée avec succès');
        loadProjectPhases(selectedProject.id);
      } catch (error) {
        showError('Erreur', 'Impossible de supprimer la phase');
        console.error('Erreur lors de la suppression:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const togglePhaseExpansion = (phaseId) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  const getPhaseStatusIcon = (phase) => {
    if (phase.terminee) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    } else if (phase.ignoree) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    } else if (phase.est_en_cours) {
      return <Clock className="w-5 h-5 text-blue-500" />;
    } else {
      return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPhaseStatusText = (phase) => {
    if (phase.terminee) return 'Terminée';
    if (phase.ignoree) return 'Ignorée';
    if (phase.est_en_cours) return 'En cours';
    return 'En attente';
  };

  const getPhaseStatusColor = (phase) => {
    if (phase.terminee) return 'bg-green-100 text-green-800';
    if (phase.ignoree) return 'bg-red-100 text-red-800';
    if (phase.est_en_cours) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const filteredPhases = projectPhases.filter(phase => {
    const matchesSearch = phase.phase.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'completed' && phase.terminee) ||
      (filterStatus === 'in_progress' && phase.est_en_cours) ||
      (filterStatus === 'pending' && phase.est_en_attente) ||
      (filterStatus === 'ignored' && phase.ignoree);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="phases-management">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Gestion des Phases & Étapes
            </h1>
            <p className="text-gray-600">
              Gérez les phases de vos projets et suivez leur progression
            </p>
          </div>
          <button
            onClick={handleAddPhase}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter une Phase
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Liste des projets */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Projets</h3>
            
            {/* Recherche */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un projet..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Liste des projets */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleProjectSelect(project)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedProject?.id === project.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{project.nom}</h4>
                      <p className="text-sm text-gray-600">{project.code}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {project.statut}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="lg:col-span-3">
          {selectedProject ? (
            <div className="space-y-6">
              {/* Statistiques du projet */}
              <PhaseStatsCard 
                progression={progression} 
                projectName={selectedProject.nom}
              />

              {/* Filtres et contrôles */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">Toutes les phases</option>
                      <option value="pending">En attente</option>
                      <option value="in_progress">En cours</option>
                      <option value="completed">Terminées</option>
                      <option value="ignored">Ignorées</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'grid' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title="Vue grille"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'list' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title="Vue liste"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Liste des phases */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPhases.map((phase) => (
                    <PhaseProgressCard
                      key={phase.id}
                      phase={phase}
                      onAction={handlePhaseAction}
                      onEdit={handleEditPhase}
                      onDelete={handleDeletePhase}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPhases.map((phase) => (
                    <div
                      key={phase.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => togglePhaseExpansion(phase.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              {expandedPhases.has(phase.id) ? (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                            
                            <div className="flex items-center gap-3">
                              {getPhaseStatusIcon(phase)}
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {phase.phase.ordre}. {phase.phase.nom}
                                </h3>
                                <p className="text-sm text-gray-600">{phase.phase.description}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPhaseStatusColor(phase)}`}>
                              {getPhaseStatusText(phase)}
                            </span>
                            
                            <div className="flex items-center gap-2">
                              {!phase.terminee && !phase.ignoree && !phase.est_en_cours && (
                                <button
                                  onClick={() => handlePhaseAction('start', phase.id)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Démarrer la phase"
                                >
                                  <Play className="w-4 h-4" />
                                </button>
                              )}
                              
                              {phase.est_en_cours && (
                                <button
                                  onClick={() => handlePhaseAction('end', phase.id)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Terminer la phase"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleEditPhase(phase)}
                                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                title="Modifier la phase"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => handleDeletePhase(phase.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer la phase"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Détails de la phase (expandable) */}
                        {expandedPhases.has(phase.id) && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Dates</h4>
                                <div className="space-y-1 text-sm text-gray-600">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>Début: {phase.date_debut ? new Date(phase.date_debut).toLocaleDateString('fr-FR') : 'Non définie'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>Fin: {phase.date_fin ? new Date(phase.date_fin).toLocaleDateString('fr-FR') : 'Non définie'}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Commentaires</h4>
                                <p className="text-sm text-gray-600">
                                  {phase.commentaire || 'Aucun commentaire'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun projet sélectionné
              </h3>
              <p className="text-gray-600">
                Sélectionnez un projet dans la liste pour voir ses phases
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isEditModalOpen && selectedPhase && (
        <PhaseEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedPhase(null);
          }}
          phase={selectedPhase}
          projectId={selectedProject?.id}
          onSuccess={() => {
            loadProjectPhases(selectedProject.id);
            setIsEditModalOpen(false);
            setSelectedPhase(null);
          }}
        />
      )}

      {isAddModalOpen && (
        <PhaseAddModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          projectId={selectedProject?.id}
          onSuccess={() => {
            if (selectedProject) {
              loadProjectPhases(selectedProject.id);
            }
            setIsAddModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default PhasesManagement;
