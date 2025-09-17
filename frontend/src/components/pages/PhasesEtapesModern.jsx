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
  List,
  Users,
  Target,
  Zap,
  ArrowRight,
  ArrowDown,
  Star,
  AlertTriangle,
  CheckSquare,
  Square,
  User,
  Timer,
  BarChart3,
  MoreHorizontal,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { projectsService, phasesService, etapesService } from '../../services/apiService';
import useNotification from '../../hooks/useNotification';
import PhaseEditModal from '../modals/PhaseEditModal';
import EtapeEditModal from '../modals/EtapeEditModal';
import EtapeAddModal from '../modals/EtapeAddModal';

const PhasesEtapesModern = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectPhases, setProjectPhases] = useState([]);
  const [progression, setProgression] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedPhases, setExpandedPhases] = useState(new Set());
  const [expandedEtapes, setExpandedEtapes] = useState(new Set());
  const [isPhaseEditModalOpen, setIsPhaseEditModalOpen] = useState(false);
  const [isEtapeEditModalOpen, setIsEtapeEditModalOpen] = useState(false);
  const [isEtapeAddModalOpen, setIsEtapeAddModalOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [selectedEtape, setSelectedEtape] = useState(null);
  const [viewMode, setViewMode] = useState('timeline');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
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
      
      // Charger les étapes pour chaque phase
      const phasesWithEtapes = await Promise.all(
        phasesResponse.map(async (phase) => {
          try {
            const etapes = await etapesService.getPhaseEtapes(projectId, phase.id);
            return { ...phase, etapes };
          } catch (error) {
            console.error(`Erreur lors du chargement des étapes pour la phase ${phase.id}:`, error);
            return { ...phase, etapes: [] };
          }
        })
      );
      
      setProjectPhases(phasesWithEtapes);
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
    setExpandedEtapes(new Set());
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

  const handleEtapeAction = async (action, phaseId, etapeId) => {
    if (!selectedProject) return;

    try {
      setLoading(true);
      let response;
      
      switch (action) {
        case 'start':
          response = await etapesService.startEtape(selectedProject.id, phaseId, etapeId);
          break;
        case 'end':
          response = await etapesService.endEtape(selectedProject.id, phaseId, etapeId);
          break;
        case 'cancel':
          response = await etapesService.cancelEtape(selectedProject.id, phaseId, etapeId);
          break;
        default:
          return;
      }
      
      showSuccess('Succès', response.message);
      loadProjectPhases(selectedProject.id);
    } catch (error) {
      showError('Erreur', 'Impossible d\'effectuer cette action');
      console.error('Erreur lors de l\'action sur l\'étape:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPhase = (phase) => {
    setSelectedPhase(phase);
    setIsPhaseEditModalOpen(true);
  };

  const handleEditEtape = (etape) => {
    setSelectedEtape(etape);
    setIsEtapeEditModalOpen(true);
  };

  const handleAddEtape = (phaseId) => {
    setSelectedPhase(projectPhases.find(p => p.id === phaseId));
    setIsEtapeAddModalOpen(true);
  };

  const handleDeleteEtape = async (phaseId, etapeId) => {
    if (!selectedProject) return;
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette étape ?')) {
      try {
        setLoading(true);
        await etapesService.deleteEtape(selectedProject.id, phaseId, etapeId);
        showSuccess('Succès', 'Étape supprimée avec succès');
        loadProjectPhases(selectedProject.id);
      } catch (error) {
        showError('Erreur', 'Impossible de supprimer l\'étape');
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

  const toggleEtapeExpansion = (etapeId) => {
    const newExpanded = new Set(expandedEtapes);
    if (newExpanded.has(etapeId)) {
      newExpanded.delete(etapeId);
    } else {
      newExpanded.add(etapeId);
    }
    setExpandedEtapes(newExpanded);
  };

  const getPhaseStatusIcon = (phase) => {
    if (phase.terminee) {
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    } else if (phase.ignoree) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    } else if (phase.est_en_cours) {
      return <Clock className="w-5 h-5 text-blue-500" />;
    } else {
      return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getEtapeStatusIcon = (etape) => {
    switch (etape.statut) {
      case 'terminee':
        return <CheckSquare className="w-4 h-4 text-emerald-500" />;
      case 'en_cours':
        return <Timer className="w-4 h-4 text-blue-500" />;
      case 'annulee':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Square className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPhaseStatusText = (phase) => {
    if (phase.terminee) return 'Terminée';
    if (phase.ignoree) return 'Ignorée';
    if (phase.est_en_cours) return 'En cours';
    return 'En attente';
  };

  const getEtapeStatusText = (etape) => {
    switch (etape.statut) {
      case 'terminee': return 'Terminée';
      case 'en_cours': return 'En cours';
      case 'annulee': return 'Annulée';
      default: return 'En attente';
    }
  };

  const getPhaseStatusColor = (phase) => {
    if (phase.terminee) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (phase.ignoree) return 'bg-red-50 text-red-700 border-red-200';
    if (phase.est_en_cours) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getEtapeStatusColor = (etape) => {
    switch (etape.statut) {
      case 'terminee': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'en_cours': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'annulee': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priorite) => {
    switch (priorite) {
      case 'critique': return 'text-red-600 bg-red-50 border-red-200';
      case 'elevee': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'normale': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'faible': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
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
    <div className="min-h-screen bg-slate-50">
      {/* Header moderne et minimaliste */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-sm">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Phases & Étapes</h1>
                <p className="text-sm text-slate-500">Gestion des projets</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">{progression?.progression_pourcentage || 0}%</div>
                <div className="text-xs text-slate-500">Progression</div>
              </div>
              <div className="w-12 h-12 relative">
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-indigo-600"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={`${progression?.progression_pourcentage || 0}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar compacte */}
          <div className={`lg:col-span-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:col-span-1' : ''}`}>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">Projets</h3>
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {sidebarCollapsed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              
              {!sidebarCollapsed && (
                <>
                  {/* Recherche */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Liste des projets */}
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        onClick={() => handleProjectSelect(project)}
                        className={`group p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedProject?.id === project.id
                            ? 'bg-indigo-50 border border-indigo-200'
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-slate-900 truncate">{project.nom}</h4>
                            <p className="text-xs text-slate-500 truncate">{project.code}</p>
                          </div>
                          <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            selectedProject?.id === project.id 
                              ? 'bg-indigo-100 text-indigo-700' 
                              : project.statut === 'termine' 
                                ? 'bg-emerald-100 text-emerald-700'
                                : project.statut === 'en_attente'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-700'
                          }`}>
                            {project.statut}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-3">
            {selectedProject ? (
              <div className="space-y-6">
                {/* Statistiques du projet */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{selectedProject.nom}</h2>
                      <p className="text-sm text-slate-500">Projet {selectedProject.code}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-slate-900">{progression?.progression_pourcentage || 0}%</div>
                      <div className="text-xs text-slate-500">Complété</div>
                    </div>
                  </div>
                  
                  {/* Barre de progression */}
                  <div className="mb-4">
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-1.5 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${progression?.progression_pourcentage || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Statistiques détaillées */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="text-lg font-bold text-slate-900">{progression?.total_phases || 0}</div>
                      <div className="text-xs text-slate-500 font-medium">Total</div>
                    </div>
                    <div className="text-center p-3 bg-emerald-50 rounded-lg">
                      <div className="text-lg font-bold text-emerald-600">{progression?.phases_terminees || 0}</div>
                      <div className="text-xs text-emerald-600 font-medium">Terminées</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">{progression?.phases_en_cours || 0}</div>
                      <div className="text-xs text-blue-600 font-medium">En cours</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-lg font-bold text-red-600">{progression?.phases_ignorees || 0}</div>
                      <div className="text-xs text-red-600 font-medium">Ignorées</div>
                    </div>
                  </div>
                </div>

                {/* Filtres et contrôles */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Filter className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 focus:bg-white"
                      >
                        <option value="all">Toutes les phases</option>
                        <option value="pending">En attente</option>
                        <option value="in_progress">En cours</option>
                        <option value="completed">Terminées</option>
                        <option value="ignored">Ignorées</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewMode('timeline')}
                        className={`p-1.5 rounded-lg transition-all ${
                          viewMode === 'timeline' 
                            ? 'bg-indigo-100 text-indigo-600' 
                            : 'text-slate-400 hover:bg-slate-100'
                        }`}
                        title="Vue timeline"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-lg transition-all ${
                          viewMode === 'grid' 
                            ? 'bg-indigo-100 text-indigo-600' 
                            : 'text-slate-400 hover:bg-slate-100'
                        }`}
                        title="Vue grille"
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-lg transition-all ${
                          viewMode === 'list' 
                            ? 'bg-indigo-100 text-indigo-600' 
                            : 'text-slate-400 hover:bg-slate-100'
                        }`}
                        title="Vue liste"
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Timeline des phases et étapes */}
                <div className="space-y-4">
                  {filteredPhases.map((phase, index) => (
                    <div key={phase.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      {/* En-tête de la phase */}
                      <div className="bg-slate-50 p-4 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => togglePhaseExpansion(phase.id)}
                              className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                              {expandedPhases.has(phase.id) ? (
                                <ChevronDown className="w-4 h-4 text-slate-600" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-600" />
                              )}
                            </button>
                            
                            <div className="flex items-center gap-3">
                              {getPhaseStatusIcon(phase)}
                              <div>
                                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                  <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                    {phase.phase.ordre}
                                  </span>
                                  {phase.phase.nom}
                                </h3>
                                <p className="text-sm text-slate-600">{phase.phase.description}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPhaseStatusColor(phase)}`}>
                              {getPhaseStatusText(phase)}
                            </span>
                            
                            <div className="flex items-center gap-1">
                              {!phase.terminee && !phase.ignoree && !phase.est_en_cours && (
                                <button
                                  onClick={() => handlePhaseAction('start', phase.id)}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Démarrer la phase"
                                >
                                  <Play className="w-4 h-4" />
                                </button>
                              )}
                              
                              {phase.est_en_cours && (
                                <button
                                  onClick={() => handlePhaseAction('end', phase.id)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Terminer la phase"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleEditPhase(phase)}
                                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Modifier la phase"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contenu de la phase (expandable) */}
                      {expandedPhases.has(phase.id) && (
                        <div className="p-4">
                          {/* Informations de la phase */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-slate-50 rounded-lg p-3">
                              <h4 className="font-medium text-slate-900 mb-2 flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4" />
                                Dates
                              </h4>
                              <div className="space-y-1 text-xs text-slate-600">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Début:</span>
                                  <span>{phase.date_debut ? new Date(phase.date_debut).toLocaleDateString('fr-FR') : 'Non définie'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Fin:</span>
                                  <span>{phase.date_fin ? new Date(phase.date_fin).toLocaleDateString('fr-FR') : 'Non définie'}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-slate-50 rounded-lg p-3">
                              <h4 className="font-medium text-slate-900 mb-2 flex items-center gap-2 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                Commentaires
                              </h4>
                              <p className="text-xs text-slate-600">
                                {phase.commentaire || 'Aucun commentaire'}
                              </p>
                            </div>
                          </div>

                          {/* Section des étapes */}
                          <div className="border-t border-slate-200 pt-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-purple-600" />
                                Étapes ({phase.etapes?.length || 0})
                              </h4>
                              <button
                                onClick={() => handleAddEtape(phase.id)}
                                className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Ajouter
                              </button>
                            </div>

                            {/* Liste des étapes */}
                            <div className="space-y-2">
                              {phase.etapes && phase.etapes.length > 0 ? (
                                phase.etapes.map((etape) => (
                                  <div key={etape.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => toggleEtapeExpansion(etape.id)}
                                          className="p-1 hover:bg-slate-200 rounded"
                                        >
                                          {expandedEtapes.has(etape.id) ? (
                                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                          ) : (
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                          )}
                                        </button>
                                        
                                        <div className="flex items-center gap-2">
                                          {getEtapeStatusIcon(etape)}
                                          <div>
                                            <h5 className="font-medium text-slate-900 flex items-center gap-2 text-sm">
                                              {etape.nom}
                                              <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(etape.priorite)}`}>
                                                {etape.priorite}
                                              </span>
                                            </h5>
                                            <p className="text-xs text-slate-600">{etape.description}</p>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getEtapeStatusColor(etape)}`}>
                                          {getEtapeStatusText(etape)}
                                        </span>
                                        
                                        <div className="flex items-center gap-1">
                                          {etape.statut === 'en_attente' && (
                                            <button
                                              onClick={() => handleEtapeAction('start', phase.id, etape.id)}
                                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                              title="Démarrer l'étape"
                                            >
                                              <Play className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                          
                                          {etape.statut === 'en_cours' && (
                                            <button
                                              onClick={() => handleEtapeAction('end', phase.id, etape.id)}
                                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                              title="Terminer l'étape"
                                            >
                                              <CheckCircle className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                          
                                          <button
                                            onClick={() => handleEditEtape(etape)}
                                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                            title="Modifier l'étape"
                                          >
                                            <Edit3 className="w-3.5 h-3.5" />
                                          </button>
                                          
                                          <button
                                            onClick={() => handleDeleteEtape(phase.id, etape.id)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Supprimer l'étape"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Détails de l'étape (expandable) */}
                                    {expandedEtapes.has(etape.id) && (
                                      <div className="mt-3 pt-3 border-t border-slate-200">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                          <div>
                                            <h6 className="font-medium text-slate-900 mb-1 text-xs">Responsable</h6>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                              <User className="w-3.5 h-3.5" />
                                              <span>{etape.responsable ? `${etape.responsable.prenom} ${etape.responsable.nom}` : 'Non assigné'}</span>
                                            </div>
                                          </div>
                                          
                                          <div>
                                            <h6 className="font-medium text-slate-900 mb-1 text-xs">Progression</h6>
                                            <div className="flex items-center gap-2">
                                              <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                                                <div 
                                                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                                  style={{ width: `${etape.progression_pourcentage}%` }}
                                                ></div>
                                              </div>
                                              <span className="text-xs text-slate-600">{etape.progression_pourcentage}%</span>
                                            </div>
                                          </div>
                                          
                                          <div>
                                            <h6 className="font-medium text-slate-900 mb-1 text-xs">Dates prévues</h6>
                                            <div className="space-y-0.5 text-xs text-slate-600">
                                              <div>Début: {etape.date_debut_prevue ? new Date(etape.date_debut_prevue).toLocaleDateString('fr-FR') : 'Non définie'}</div>
                                              <div>Fin: {etape.date_fin_prevue ? new Date(etape.date_fin_prevue).toLocaleDateString('fr-FR') : 'Non définie'}</div>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {etape.commentaire && (
                                          <div className="mt-3">
                                            <h6 className="font-medium text-slate-900 mb-1 text-xs">Commentaire</h6>
                                            <p className="text-xs text-slate-600 bg-slate-100 p-2 rounded-lg">
                                              {etape.commentaire}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-6 text-slate-500">
                                  <Zap className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                  <p className="text-sm">Aucune étape définie pour cette phase</p>
                                  <button
                                    onClick={() => handleAddEtape(phase.id)}
                                    className="mt-1 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                                  >
                                    Ajouter la première étape
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Aucun projet sélectionné
                </h3>
                <p className="text-slate-600">
                  Sélectionnez un projet dans la liste pour voir ses phases et étapes
                </p>
              </div>
            )}
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

export default PhasesEtapesModern;


