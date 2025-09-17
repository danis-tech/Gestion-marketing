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
  BarChart3
} from 'lucide-react';
import { projectsService, phasesService, etapesService } from '../../services/apiService';
import useNotification from '../../hooks/useNotification';
import PhaseEditModal from '../modals/PhaseEditModal';
import EtapeEditModal from '../modals/EtapeEditModal';
import EtapeAddModal from '../modals/EtapeAddModal';
import './PhasesEtapesManagement.css';

const PhasesEtapesManagement = () => {
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
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline', 'grid', 'list'
  
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
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
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
        return <CheckSquare className="w-4 h-4 text-green-500" />;
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
    if (phase.terminee) return 'bg-green-100 text-green-800 border-green-200';
    if (phase.ignoree) return 'bg-red-100 text-red-800 border-red-200';
    if (phase.est_en_cours) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getEtapeStatusColor = (etape) => {
    switch (etape.statut) {
      case 'terminee': return 'bg-green-50 text-green-700 border-green-200';
      case 'en_cours': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'annulee': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priorite) => {
    switch (priorite) {
      case 'critique': return 'text-red-600 bg-red-100';
      case 'elevee': return 'text-orange-600 bg-orange-100';
      case 'normale': return 'text-blue-600 bg-blue-100';
      case 'faible': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
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
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header élégant */}
        {/* ...existing code... */}
      </div>
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
    </>
  );
};

export default PhasesEtapesManagement;
