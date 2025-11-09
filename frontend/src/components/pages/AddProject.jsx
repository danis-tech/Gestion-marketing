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
  AlertCircle
} from 'lucide-react';
import ProjectsDataTable from '../ui/ProjectsDataTable';
import { projectsService } from '../../services/apiService';

const AddProject = () => {
  const navigate = useNavigate();
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
      } catch (error) {
      }
    }
  }, []);

  // Charger les projets depuis l'API
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setTableLoading(true);
        const response = await projectsService.getProjects();
        
        // Adapter la structure des données selon votre API
        if (response.results) {
          // Si l'API retourne une structure paginée
          setProjects(response.results);
        } else if (Array.isArray(response)) {
          // Si l'API retourne directement un tableau
          setProjects(response);
        } else {
          setProjects([]);
        }
      } catch (error) {
        // En cas d'erreur, on peut garder quelques projets de démonstration
        setProjects([]);
      } finally {
        setTableLoading(false);
      }
    };

    loadProjects();
  }, []);

  const handleCancel = () => {
    navigate('/dashboard');
  };

  // La fonction handleAddProject n'est plus nécessaire car ProjectsDataTable gère maintenant l'ajout
  // via son modal intégré

  // La fonction handleEditProject n'est plus nécessaire car ProjectsDataTable gère maintenant la modification
  // via son modal intégré

  const handleDeleteProject = async (project) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.nom}" ?\n\nCette action est irréversible et supprimera :\n- Le projet et toutes ses données\n- Toutes les tâches associées\n- Tous les documents et fichiers\n- Tous les membres et permissions\n- Toutes les phases et étapes`)) {
      try {
        setTableLoading(true);
        await projectsService.deleteProject(project.id);
        
        // Rafraîchir la liste depuis le serveur pour s'assurer que tout est à jour
        await refreshProjects();
        
        alert('Projet supprimé avec succès !');
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la suppression du projet';
        alert(`Erreur lors de la suppression : ${errorMessage}`);
      } finally {
        setTableLoading(false);
      }
    }
  };

  const handleViewProject = (project) => {
    navigate(`/dashboard/projets/${project.id}`);
  };

  const handleManageDocuments = (project) => {
    navigate(`/dashboard/projets/${project.id}/documents`);
  };

  // Fonction pour rafraîchir les données depuis l'API
  const refreshProjects = async () => {
    try {
      setTableLoading(true);
      const response = await projectsService.getProjects();
      
      if (response.results) {
        setProjects(response.results);
      } else if (Array.isArray(response)) {
        setProjects(response);
      } else {
        setProjects([]);
      }
    } catch (error) {
    } finally {
      setTableLoading(false);
    }
  };

  // Gérer le changement de devise
  const handleCurrencyChange = (newCurrency) => {
    setSelectedCurrency(newCurrency);
  };

  // Fonction pour parser les budgets avec unités (K, M, T)
  const parseBudgetWithUnits = (budgetString) => {
    if (!budgetString) return 0;
    
    try {
      // Si c'est déjà un nombre, le retourner directement
      if (typeof budgetString === 'number') {
        return budgetString;
      }
      
      // Si c'est une chaîne, la parser
      if (typeof budgetString === 'string') {
        // Enlever tous les caractères non numériques sauf le point et les lettres K, M, T
        const cleanString = budgetString.trim().toUpperCase();
        
        // Extraire le nombre et l'unité
        const match = cleanString.match(/^([\d.]+)\s*([KMT]?)/);
        
        if (match) {
          const number = parseFloat(match[1]);
          const unit = match[2];
          
          if (isNaN(number)) return 0;
          
          // Multiplier selon l'unité
          switch (unit) {
            case 'K':
              return number * 1000;
            case 'M':
              return number * 1000000;
            case 'T':
              return number * 1000000000000;
            default:
              return number; // Pas d'unité, retourner le nombre tel quel
          }
        }
        
        // Si pas de match, essayer de parser comme un nombre simple
        const simpleNumber = parseFloat(cleanString.replace(/[^\d.]/g, ''));
        return isNaN(simpleNumber) ? 0 : simpleNumber;
      }
      
      return 0;
    } catch (error) {
      return 0;
    }
  };

  // Calculer les statistiques
  const stats = {
    total: projects.length,
    enCours: projects.filter(p => p.statut === 'en_cours').length,
    termine: projects.filter(p => p.statut === 'termine').length,
    enAttente: projects.filter(p => p.statut === 'en_attente').length,
    horsDelai: projects.filter(p => p.statut === 'hors_delai').length,
    budgetTotal: projects.reduce((sum, p) => {
      // Parser le budget avec la fonction robuste
      const budgetValue = parseBudgetWithUnits(p.budget);
      return sum + budgetValue;
    }, 0)
  };

  // Fonction pour formater le budget total selon la devise
  const formatBudgetTotal = (budget, currency) => {
    const exchangeRates = {
      fcfa: 1,
      eur: 0.00152,
      usd: 0.00167
    };
    
    const convertedAmount = budget * exchangeRates[currency];
    
    // Fonction pour formater les grands nombres de manière lisible
    const formatLargeNumber = (num) => {
      if (num >= 1e12) {
        return (num / 1e12).toFixed(1) + ' T';
      } else if (num >= 1e9) {
        return (num / 1e9).toFixed(1) + ' M';
      } else if (num >= 1e6) {
        return (num / 1e6).toFixed(1) + ' M';
      } else if (num >= 1e3) {
        return (num / 1e3).toFixed(1) + ' K';
      }
      return num.toFixed(0);
    };
    
    switch (currency) {
      case 'fcfa':
        const formattedFcfa = formatLargeNumber(convertedAmount);
        return `${formattedFcfa} FCFA`;
      case 'eur':
        const formattedEur = formatLargeNumber(convertedAmount);
        return `${formattedEur} €`;
      case 'usd':
        const formattedUsd = formatLargeNumber(convertedAmount);
        return `$${formattedUsd}`;
      default:
        const formattedDefault = formatLargeNumber(convertedAmount);
        return `${formattedDefault} FCFA`;
    }
  };

  const statsCards = [
    {
      title: "Total Projets",
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
      title: "Terminés",
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
       title: "Budget Total",
       value: formatBudgetTotal(stats.budgetTotal, selectedCurrency),
       fullValue: stats.budgetTotal ? `${stats.budgetTotal.toLocaleString('fr-FR')} FCFA` : '0 FCFA',
       icon: TrendingUp,
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
                       <p 
                         className="text-3xl font-bold text-gray-900"
                         title={stat.fullValue ? stat.fullValue : stat.value}
                       >
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
                     <ProjectsDataTable
             projects={projects}
             loading={tableLoading}
             onDeleteProject={handleDeleteProject}
             onViewProject={handleViewProject}
             onManageDocuments={handleManageDocuments}
             onCurrencyChange={handleCurrencyChange}
             userName={currentUserName}
             onRefresh={refreshProjects}
           />
        </div>
      </div>

      {/* Espacement en bas */}
      <div className="py-6"></div>
    </div>
  );
};

export default AddProject;