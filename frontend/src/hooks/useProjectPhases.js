import { useState, useEffect, useCallback, useRef } from 'react';
import { projectsService, phasesService, etapesService } from '../services/apiService';

export const useProjectPhases = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectPhases, setProjectPhases] = useState([]);
  const [progression, setProgression] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Référence pour éviter les appels multiples
  const loadingRef = useRef(false);
  const projectsLoadedRef = useRef(false);

  // Charger tous les projets
  const loadProjects = useCallback(async () => {
    // Éviter les appels multiples avec une référence
    if (loadingRef.current) {
      return;
    }
    
    try {
      loadingRef.current = true;
      setLoading(true);
      const response = await projectsService.getProjects();
      
      // Le service retourne déjà response.data, donc response contient directement les données
      // Gérer la pagination Django REST Framework
      const projectsData = response?.results || response || [];
      setProjects(projectsData);
      projectsLoadedRef.current = true;
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
      setProjects([]); // S'assurer que la liste est vide en cas d'erreur
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []); // Dependencies vides pour éviter les re-créations

  // Charger les phases d'un projet
  const loadProjectPhases = async (projectId) => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      
      // Charger les phases du projet
      const phasesResponse = await phasesService.getProjectPhases(projectId);
      const phases = phasesResponse || [];
      
      // Charger la progression
      const progressionResponse = await phasesService.getProjectPhasesProgression(projectId);
      
      // Charger les étapes pour chaque phase
      const phasesWithEtapes = await Promise.all(
        phases.map(async (phase) => {
          try {
            const etapesResponse = await etapesService.getPhaseEtapes(projectId, phase.id);
            const etapes = etapesResponse || [];
            // S'assurer que chaque étape a l'ID de la phase
            const etapesWithPhaseId = etapes.map(etape => ({
              ...etape,
              phase_etat_id: phase.id
            }));
            return { ...phase, etapes: etapesWithPhaseId };
          } catch (error) {
            console.error(`Erreur lors du chargement des étapes pour la phase ${phase.id}:`, error);
            return { ...phase, etapes: [] };
          }
        })
      );
      
      console.log('Données des phases mises à jour:', phasesWithEtapes);
      
      // Log des phases terminées pour debug
      const phasesTerminees = phasesWithEtapes.filter(p => p.terminee);
      console.log('Phases terminées:', phasesTerminees.map(p => ({id: p.id, nom: p.phase.nom, terminee: p.terminee})));
      
      setProjectPhases(phasesWithEtapes);
      setProgression(progressionResponse);
    } catch (error) {
      console.error('Erreur lors du chargement des phases:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sélectionner un projet
  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    loadProjectPhases(project.id);
  };

  // Filtrer les phases
  const filteredPhases = projectPhases.filter((phase) => {
    const matchesSearch = searchTerm === '' || 
      phase.phase.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phase.phase.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'completed' && phase.terminee) ||
      (filterStatus === 'in_progress' && phase.est_en_cours) ||
      (filterStatus === 'pending' && !phase.terminee && !phase.est_en_cours && !phase.ignoree) ||
      (filterStatus === 'ignored' && phase.ignoree);
    
    return matchesSearch && matchesFilter;
  });

  // Filtrer les projets
  const filteredProjects = projects.filter(project =>
    project.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    // Charger les projets une seule fois au montage du composant
    if (!projectsLoadedRef.current) {
      loadProjects();
    }
  }, []); // Dependencies vides pour éviter les re-renders

  return {
    // État
    projects: filteredProjects,
    selectedProject,
    projectPhases: filteredPhases,
    progression,
    loading,
    searchTerm,
    filterStatus,
    
    // Actions
    setSearchTerm,
    setFilterStatus,
    handleProjectSelect,
    loadProjectPhases,
    loadProjects
  };
};
