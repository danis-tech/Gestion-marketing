import { useState, useEffect, useCallback, useRef } from 'react';
import { projectsService, phasesService } from '../services/apiService';

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
      
      // Charger les phases du projet (inclut désormais les tâches)
      const phasesResponse = await phasesService.getProjectPhases(projectId);
      const phases = phasesResponse || [];
      
      // Charger la progression
      const progressionResponse = await phasesService.getProjectPhasesProgression(projectId);
      
      // S'assurer que chaque phase possède la collection de tâches
      const phasesWithTasks = await Promise.all(
        phases.map(async (phase) => {
          if (Array.isArray(phase.taches)) {
            return phase;
          }
          
          try {
            const tasksResponse = await phasesService.getPhaseTasks(projectId, phase.id);
            const tasks = tasksResponse?.taches || tasksResponse || [];
            return { ...phase, taches: tasks };
          } catch (error) {
            console.error(`Erreur lors du chargement des tâches pour la phase ${phase.id}:`, error);
            return { ...phase, taches: [] };
          }
        })
      );
      
      setProjectPhases(phasesWithTasks);
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
