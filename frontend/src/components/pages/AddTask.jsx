import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  TrendingUp,
  BarChart3,
  ClipboardList,
  CheckCircle,
  Clock,
  AlertCircle,
  Target
} from 'lucide-react';
import { TasksDataTable } from '../ui';
import { projectsService, tasksService } from '../../services/apiService';
import './TasksManagement.css';

const AddTask = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState('fcfa');
  const [currentUserName, setCurrentUserName] = useState("Utilisateur");
  
  // Récupérer l'utilisateur connecté depuis le localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const userName = user.prenom || user.username || user.name || user.nom || "Utilisateur";
        setCurrentUserName(userName);
        console.log('Utilisateur connecté:', user);
      } catch (error) {
        console.error('Erreur lors du parsing des données utilisateur:', error);
      }
    }
  }, []);

  // Charger les projets depuis l'API
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await projectsService.getProjects();
        
        // Adapter la structure des données selon votre API
        if (response.results) {
          // Si l'API retourne une structure paginée
          setProjects(response.results);
        } else if (Array.isArray(response)) {
          // Si l'API retourne directement un tableau
          setProjects(response);
        } else {
          console.error('Structure de réponse API inattendue:', response);
          setProjects([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des projets:', error);
        setProjects([]);
      }
    };

    loadProjects();
  }, []);

  // Charger les tâches depuis l'API
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setTableLoading(true);
        const response = await tasksService.getTasks();
        
        if (Array.isArray(response)) {
          setTasks(response);
        } else if (response && response.results && Array.isArray(response.results)) {
          setTasks(response.results);
        } else {
          console.warn('Structure de réponse API inattendue:', response);
          setTasks([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des tâches:', error);
        setTasks([]);
      } finally {
        setTableLoading(false);
      }
    };

    loadTasks();
  }, []);

  const handleCancel = () => {
    navigate('/dashboard');
  };

  const handleDeleteTask = async (task) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la tâche "${task.titre}" ?`)) {
      try {
        await tasksService.deleteTask(task.id);
        // Mettre à jour la liste locale
        setTasks(tasks.filter(t => t.id !== task.id));
        alert('Tâche supprimée avec succès !');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la tâche');
      }
    }
  };

  const handleViewTask = (task) => {
    navigate(`/dashboard/projets/${task.projet}/taches/${task.id}`);
  };

  const handleManageDocuments = (task) => {
    navigate(`/dashboard/projets/${task.projet}/taches/${task.id}/documents`);
  };

  // Fonction pour rafraîchir les données depuis l'API
  const refreshTasks = async () => {
    try {
      setTableLoading(true);
      const response = await tasksService.getTasks();
      setTasks(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setTableLoading(false);
    }
  };

  // Gérer le changement de devise
  const handleCurrencyChange = (newCurrency) => {
    setSelectedCurrency(newCurrency);
  };

  // Calculer les statistiques
  const stats = {
    total: tasks.length,
    enCours: tasks.filter(t => t.statut === 'en_cours').length,
    termine: tasks.filter(t => t.statut === 'termine').length,
    enAttente: tasks.filter(t => t.statut === 'en_attente').length,
    horsDelai: tasks.filter(t => t.statut === 'hors_delai').length,
    rejete: tasks.filter(t => t.statut === 'rejete').length,
    conception: tasks.filter(t => t.phase === 'conception').length,
    build: tasks.filter(t => t.phase === 'build').length,
    uat: tasks.filter(t => t.phase === 'uat').length,
    lancement: tasks.filter(t => t.phase === 'lancement').length,
    suivi: tasks.filter(t => t.phase === 'suivi').length,
    finDeVie: tasks.filter(t => t.phase === 'fin_de_vie').length
  };

  const statsCards = [
    {
      title: "Total Tâches",
      value: stats.total,
      icon: BarChart3,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "En Cours",
      value: stats.enCours,
      icon: ClipboardList,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600"
    },
    {
      title: "Terminées",
      value: stats.termine,
      icon: CheckCircle,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600"
    },
    {
      title: "En Attente",
      value: stats.enAttente,
      icon: Clock,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600"
    },
    {
      title: "Hors Délai",
      value: stats.horsDelai,
      icon: AlertCircle,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      textColor: "text-red-600"
    },
    {
      title: "Conception",
      value: stats.conception,
      icon: Target,
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec statistiques */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex justify-center w-full py-8">
          <div className="w-full max-w-7xl px-4">
            {/* Cartes de statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {statsCards.map((stat, index) => (
                <div key={index} className="bg-white border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium mb-2">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`${stat.bgColor} p-3 group-hover:scale-110 transition-transform duration-300`}>
                      <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Espaceur */}
      <div className="py-6"></div>

      {/* Contenu principal - Tableau centré */}
      <div className="flex justify-center w-full">
        <div className="w-full max-w-7xl px-4">
          <TasksDataTable
            tasks={tasks}
            loading={tableLoading}
            onDeleteTask={handleDeleteTask}
            onViewTask={handleViewTask}
            onManageDocuments={handleManageDocuments}
            onCurrencyChange={handleCurrencyChange}
            userName={currentUserName}
            onRefresh={refreshTasks}
            projects={projects}
          />
        </div>
      </div>

      {/* Espacement en bas */}
      <div className="py-6"></div>
    </div>
  );
};

export default AddTask;
