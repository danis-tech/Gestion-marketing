import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  FileText,
  Filter,
  Calendar,
  User,
  DollarSign,
  AlertCircle,
  Download,
  BarChart3,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Hash
} from 'lucide-react';
import ProjectDetailsModal from './ProjectDetailsModal';
import ProjectEditModal from './ProjectEditModal';
import ProjectAddModal from './ProjectAddModal';
import { projectsService } from '../../services/apiService';

const ProjectsDataTable = ({ 
  projects = [], 
  onDeleteProject, 
  onViewProject,
  onManageDocuments,
  loading = false,
  onCurrencyChange,
  userName = 'Utilisateur',
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('nom');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currency, setCurrency] = useState('fcfa'); // Devise par défaut : FCFA
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal de détails
  const [selectedProject, setSelectedProject] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  // Modal de modification
  const [editingProject, setEditingProject] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Modal d'ajout
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);


  
  // Filtrage et tri des projets
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      // Recherche dans le nom ET la description (gestion des champs optionnels)
      const searchFields = [
        project.nom || '',
        project.description || '',
        project.code || ''
      ].filter(field => field); // Filtrer les champs vides
      
      const matchesSearch = searchFields.some(field => 
        field.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Filtre par statut - adapter aux valeurs de votre API
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        // Mapping des statuts selon votre API
        const statusMapping = {
          'en_cours': ['en_cours', 'En cours', 'EN_COURS'],
          'termine': ['termine', 'Terminé', 'TERMINE', 'finished'],
          'en_attente': ['en_attente', 'En attente', 'EN_ATTENTE', 'pending']
        };
        matchesStatus = statusMapping[statusFilter]?.some(status => 
          project.statut === status || project.etat === status
        ) || false;
      }
      
      return matchesSearch && matchesStatus;
    });

    // Tri
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (sortField === 'date_debut' || sortField === 'date_fin' || sortField === 'debut' || sortField === 'fin') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });


    
    return filtered;
  }, [projects, searchTerm, statusFilter, sortField, sortDirection]);

  // Pagination
  const totalRows = filteredAndSortedProjects.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedProjects = filteredAndSortedProjects.slice(startIndex, endIndex);

  // Réinitialiser la page courante quand les filtres changent
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Gestion de la pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Retour à la première page
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  
  // Gestion du modal de détails
  const handleViewProject = (project) => {
    setSelectedProject(project);
    setIsDetailsModalOpen(true);
  };
  
  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedProject(null);
  };
  
  // Gestion du modal de modification
  const handleEditProject = (project) => {
    setEditingProject(project);
    setIsEditModalOpen(true);
  };
  
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingProject(null);
  };
  
  // Gestion du modal d'ajout
  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };
  
  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };
  
    const handleSaveProject = async (updatedData) => {
    try {
      // Vérifier si l'utilisateur est authentifié
      const accessToken = localStorage.getItem('access_token');
      console.log('Token d\'accès trouvé:', accessToken ? 'Oui' : 'Non');
      
      if (!accessToken) {
        throw new Error('Vous devez être connecté pour modifier un projet. Veuillez vous reconnecter.');
      }

      // Utiliser le service API qui gère l'authentification
      const updatedProject = await projectsService.updateProject(editingProject.id, updatedData);
      console.log('Projet mis à jour avec succès:', updatedProject);

      // Le projet est mis à jour directement via l'API, pas besoin d'appeler une fonction externe

      // Fermer le modal
      handleCloseEditModal();

      // Rafraîchir les données si la fonction onRefresh existe
      if (onRefresh) {
        await onRefresh();
      }

      // Optionnel : Afficher un message de succès
      console.log('Projet mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      
      // Afficher plus de détails sur l'erreur
      if (error.response) {
        console.error('Réponse de l\'API:', error.response.data);
        console.error('Status:', error.response.status);
        console.error('Headers:', error.response.headers);
        
        // Si l'API retourne des erreurs de validation, les afficher
        if (error.response.data && typeof error.response.data === 'object') {
          const apiErrors = error.response.data;
          if (apiErrors.non_field_errors) {
            throw new Error(`Erreur API: ${apiErrors.non_field_errors.join(', ')}`);
          } else if (Object.keys(apiErrors).length > 0) {
            const errorMessages = Object.entries(apiErrors)
              .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('; ');
            throw new Error(`Erreurs de validation: ${errorMessages}`);
          }
        }
      }
      
      throw error; // Propager l'erreur pour l'afficher dans le modal
    }
  };
  
  const handleAddProject = async (newProjectData) => {
    try {
      // Vérifier si l'utilisateur est authentifié
      const accessToken = localStorage.getItem('access_token');
      console.log('Token d\'accès trouvé:', accessToken ? 'Oui' : 'Non');
      
      if (!accessToken) {
        throw new Error('Vous devez être connecté pour créer un projet. Veuillez vous reconnecter.');
      }

      // Log des données envoyées pour debug
      console.log('Données envoyées à l\'API:', newProjectData);

      // Utiliser le service API qui gère l'authentification
      const newProject = await projectsService.createProject(newProjectData);
      console.log('Projet créé avec succès:', newProject);

      // Le projet est créé directement via l'API, pas besoin d'appeler une fonction externe

      // Fermer le modal
      handleCloseAddModal();

      // Rafraîchir les données si la fonction onRefresh existe
      if (onRefresh) {
        await onRefresh();
      }

      // Optionnel : Afficher un message de succès
      console.log('Projet créé avec succès');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      
      // Afficher plus de détails sur l'erreur
      if (error.response) {
        console.error('Réponse de l\'API:', error.response.data);
        console.error('Status:', error.response.status);
        console.error('Headers:', error.response.headers);
        
        // Si l'API retourne des erreurs de validation, les afficher
        if (error.response.data && typeof error.response.data === 'object') {
          const apiErrors = error.response.data;
          if (apiErrors.non_field_errors) {
            throw new Error(`Erreur API: ${apiErrors.non_field_errors.join(', ')}`);
          } else if (Object.keys(apiErrors).length > 0) {
            const errorMessages = Object.entries(apiErrors)
              .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('; ');
            throw new Error(`Erreurs de validation: ${errorMessages}`);
          }
        }
      }
      
      throw error; // Propager l'erreur pour l'afficher dans le modal
    }
  };

     const getStatusColor = (status) => {
     if (!status) return 'bg-gray-100 text-gray-900 border-2 border-gray-300 shadow-sm';
     
     const normalizedStatus = status.toLowerCase();
     switch (normalizedStatus) {
       case 'en_cours': return 'bg-blue-100 text-blue-900 border-2 border-blue-300 shadow-sm';
       case 'termine': return 'bg-emerald-100 text-emerald-900 border-2 border-emerald-300 shadow-sm';
       case 'en_attente': return 'bg-amber-100 text-amber-900 border-2 border-amber-300 shadow-sm';
       case 'annule': return 'bg-red-100 text-red-900 border-2 border-red-300 shadow-sm';
       default: return 'bg-gray-100 text-gray-900 border-2 border-gray-300 shadow-sm';
     }
   };

  const getStatusText = (status) => {
    if (!status) return 'Non défini';
    
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'en_cours': return 'En cours';
      case 'termine': return 'Terminé';
      case 'en_attente': return 'En attente';
      case 'annule': return 'Annulé';
      default: return status;
    }
  };

     const getPriorityColor = (priority) => {
     if (!priority) return 'text-gray-900 bg-gray-100 border-2 border-gray-300 shadow-sm';
     
     const normalizedPriority = priority.toLowerCase();
     switch (normalizedPriority) {
       case 'haute':
       case 'haut': return 'text-red-900 bg-red-100 border-2 border-red-300 shadow-sm';
       case 'moyenne':
       case 'moyen': return 'text-amber-900 bg-amber-100 border-2 border-amber-300 shadow-sm';
       case 'basse':
       case 'bas': return 'text-emerald-900 bg-emerald-100 border-2 border-emerald-300 shadow-sm';
       default: return 'text-gray-900 bg-gray-100 border-2 border-gray-300 shadow-sm';
     }
   };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    try {
    const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
    return date.toLocaleDateString('fr-FR');
    } catch (error) {
      console.error('Erreur de formatage de date:', error, dateString);
      return 'Date invalide';
    }
  };

  // Taux de conversion (à mettre à jour régulièrement)
  const exchangeRates = {
    fcfa: 1,        // 1 FCFA = 1 FCFA
    eur: 0.00152,   // 1 FCFA = 0.00152 EUR
    usd: 0.00167    // 1 FCFA = 0.00167 USD
  };

  // Symboles des devises
  const currencySymbols = {
    fcfa: 'FCFA',
    eur: '€',
    usd: '$'
  };

  const formatBudget = (budget) => {
    if (!budget || budget === 0) return 'Non défini';
    
    try {
    // Convertir le budget (supposé en FCFA) vers la devise sélectionnée
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
    
    // Formater selon la devise
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
    } catch (error) {
      console.error('Erreur de formatage du budget:', error, budget);
      return 'Erreur de formatage';
    }
  };

       const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return (
      <span className="ml-2 text-blue-600 font-bold text-lg bg-blue-100 px-2 py-1">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  // Fonction utilitaire pour gérer les valeurs par défaut
  const getFieldValue = (project, field, defaultValue = 'Non défini') => {
    if (!project) return defaultValue;
    
    // Essayer différents noms de champs possibles
    const possibleFields = Array.isArray(field) ? field : [field];
    
    for (const f of possibleFields) {
      if (project[f] !== undefined && project[f] !== null && project[f] !== '') {
        return project[f];
      }
    }
    
    return defaultValue;
  };

  // Fonction pour limiter le texte à 120 caractères
  const truncateText = (text, maxLength = 120) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };



  // Fonction pour exporter le tableau vers Excel avec style avancé
  const exportToExcel = () => {
    try {
             // Préparer les données pour l'export
       const exportData = [
         // En-têtes
         [
           'Code',
           'Nom du projet',
           'Description', 
           'Statut',
           'Priorité',
           'Date de début',
           'Date de fin',
           'Chef projet',
           'Service',
           'Budget (FCFA)',
           'Budget (EUR)',
           'Budget (USD)'
         ],
                 // Données des projets - Exporter TOUTES les données filtrées, pas seulement la page actuelle
                   ...filteredAndSortedProjects.map(project => {
            // Fonction pour formater les grands nombres dans l'export
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
            
            return [
           project.code || 'N/A',
           project.nom || '',
           project.description || '',
           getStatusText(project.statut) || '',
           project.priorite || '',
           formatDate(project.date_debut) || '',
           formatDate(project.date_fin) || '',
           project.chef_projet || '',
           project.service || '',
              project.budget ? formatLargeNumber(project.budget) + ' FCFA' : '0',
              project.budget ? formatLargeNumber(project.budget * 0.00152) + ' EUR' : '0',
              project.budget ? formatLargeNumber(project.budget * 0.00167) + ' USD' : '0'
            ];
          })
      ];

      // Créer le workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(exportData);

             // Ajuster la largeur des colonnes
       const columnWidths = [
         { wch: 15 }, // Code
         { wch: 25 }, // Nom du projet
         { wch: 40 }, // Description
         { wch: 15 }, // Statut
         { wch: 12 }, // Priorité
         { wch: 15 }, // Date de début
         { wch: 15 }, // Date de fin
         { wch: 20 }, // Chef projet
         { wch: 15 }, // Service
         { wch: 18 }, // Budget FCFA
         { wch: 15 }, // Budget EUR
         { wch: 15 }  // Budget USD
       ];
      worksheet['!cols'] = columnWidths;

      // Appliquer des styles aux cellules
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      
      // Style pour l'en-tête (première ligne)
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!worksheet[cellAddress]) continue;
        
        worksheet[cellAddress].s = {
          font: {
            bold: true,
            color: { rgb: "FFFFFF" },
            sz: 12
          },
          fill: {
            fgColor: { rgb: "4472C4" }
          },
          alignment: {
            horizontal: "center",
            vertical: "center"
          },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }

      // Style pour les lignes de données (alternance de couleurs)
      for (let row = range.s.r + 1; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (!worksheet[cellAddress]) continue;
          
          const isEvenRow = row % 2 === 0;
          worksheet[cellAddress].s = {
            font: {
              sz: 10,
              color: { rgb: isEvenRow ? "000000" : "2F2F2F" }
            },
            fill: {
              fgColor: { rgb: isEvenRow ? "F2F2F2" : "FFFFFF" }
            },
            alignment: {
              horizontal: col === 0 ? "left" : "center", // Nom du projet aligné à gauche
              vertical: "center"
            },
            border: {
              top: { style: "thin", color: { rgb: "D0D0D0" } },
              bottom: { style: "thin", color: { rgb: "D0D0D0" } },
              left: { style: "thin", color: { rgb: "D0D0D0" } },
              right: { style: "thin", color: { rgb: "D0D0D0" } }
            }
          };
        }
      }

             // Style spécial pour les colonnes de budget (formatage monétaire)
       const budgetColumns = [9, 10, 11]; // Indices des colonnes de budget (Code ajouté, donc +1)
       budgetColumns.forEach(colIndex => {
        for (let row = range.s.r + 1; row <= range.e.r; row++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: colIndex });
          if (worksheet[cellAddress]) {
            worksheet[cellAddress].s = {
              ...worksheet[cellAddress].s,
              font: {
                ...worksheet[cellAddress].s.font,
                bold: true,
                color: { rgb: "006100" } // Vert pour les montants
              },
              alignment: {
                horizontal: "right",
                vertical: "center"
              }
            };
          }
        }
      });

             // Style spécial pour les colonnes de statut et priorité
       const statusColumns = [3, 4]; // Statut et Priorité (Code ajouté, donc +1)
       statusColumns.forEach(colIndex => {
        for (let row = range.s.r + 1; row <= range.e.r; row++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: colIndex });
          if (worksheet[cellAddress]) {
            worksheet[cellAddress].s = {
              ...worksheet[cellAddress].s,
              font: {
                ...worksheet[cellAddress].s.font,
                bold: true
              },
              alignment: {
                horizontal: "center",
                vertical: "center"
              }
            };
          }
        }
      });

      // Ajouter la feuille au workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Projets');

      // Générer le nom du fichier avec le nom de l'utilisateur, la date et l'heure
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const userDisplayName = userName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      const fileName = `projets_export_${userDisplayName}_${dateStr}_${timeStr}.xlsx`;

      // Télécharger le fichier
      XLSX.writeFile(workbook, fileName);

      // Message de confirmation
      alert(` Export réussi ! ${filteredAndSortedProjects.length} projet(s) exporté(s) vers ${fileName}`);
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
              alert('Erreur lors de l\'export Excel');
    }
  };

  return (
    <div className="bg-white shadow-sm border border-gray-200 w-full">
      {/* Header */}
      <div className="px-8 py-6 bg-white border-b border-gray-200">
                 <div className="flex justify-between items-center mb-6">
           <div>
             <h2 className="text-2xl font-semibold text-gray-900 mb-2">Gestion des projets</h2>
             <p className="text-sm text-gray-600">Gérez et suivez tous vos projets en un seul endroit</p>
           </div>
                       <div className="flex items-center space-x-4">
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white px-6 py-4 text-sm font-bold transition-all duration-200 flex items-center space-x-3 border-2 border-amber-600 hover:border-amber-700 disabled:border-amber-400 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                  title="Rafraîchir les données depuis l'API"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{loading ? 'Chargement...' : 'Rafraîchir'}</span>
                </button>
              )}
              <button
                onClick={exportToExcel}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 text-sm font-bold transition-all duration-200 flex items-center space-x-3 border-2 border-green-600 hover:border-green-700 shadow-lg hover:shadow-xl"
              >
                <Download className="w-5 h-5" />
                <span>Exporter Excel</span>
              </button>
              <button
                 onClick={handleOpenAddModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-sm font-bold transition-all duration-200 flex items-center space-x-3 border-2 border-blue-600 hover:border-blue-700 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                <span>Nouveau projet</span>
              </button>
            </div>
         </div>

        {/* Filtres et recherche */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                     {/* Filtres de statut */}
           <div className="flex bg-white border-2 border-gray-300 shadow-lg">
             <button
               onClick={() => setStatusFilter('all')}
               className={`px-6 py-3 text-sm font-bold transition-all duration-200 border-r border-gray-300 ${
                 statusFilter === 'all'
                   ? 'bg-blue-600 text-white shadow-inner'
                   : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'
               }`}
             >
               Tous
             </button>
             <button
               onClick={() => setStatusFilter('en_cours')}
               className={`px-6 py-3 text-sm font-bold transition-all duration-200 border-r border-gray-300 ${
                 statusFilter === 'en_cours'
                   ? 'bg-blue-600 text-white shadow-inner'
                   : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'
               }`}
             >
               En cours
             </button>
             <button
               onClick={() => setStatusFilter('termine')}
               className={`px-6 py-3 text-sm font-bold transition-all duration-200 border-r border-gray-300 ${
                 statusFilter === 'termine'
                   ? 'bg-blue-600 text-white shadow-inner'
                   : 'text-gray-300 hover:text-blue-700 hover:bg-blue-50'
               }`}
             >
               Terminé
             </button>
             <button
               onClick={() => setStatusFilter('en_attente')}
               className={`px-6 py-3 text-sm font-bold transition-all duration-200 ${
                 statusFilter === 'en_attente'
                   ? 'bg-blue-600 text-white shadow-inner'
                   : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'
               }`}
             >
               En attente
             </button>
           </div>

                     {/* Sélecteur de devise et barre de recherche */}
           <div className="flex flex-col lg:flex-row gap-8 items-center">
             {/* Sélecteur de devise */}
             <div className="flex flex-col items-start space-y-3">
               <span className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b-2 border-blue-500 pb-1">Devise</span>
               <div className="flex bg-white border-2 border-gray-300 shadow-lg">
                 <button
                   onClick={() => {
                     setCurrency('fcfa');
                     if (onCurrencyChange) onCurrencyChange('fcfa');
                   }}
                   className={`px-6 py-3 text-sm font-bold transition-all duration-300 border-r border-gray-300 ${
                     currency === 'fcfa'
                       ? 'bg-blue-600 text-white shadow-inner'
                       : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'
                   }`}
                 >
                   🇨🇫 FCFA
                 </button>
                 <button
                   onClick={() => {
                     setCurrency('eur');
                     if (onCurrencyChange) onCurrencyChange('eur');
                   }}
                   className={`px-6 py-3 text-sm font-bold transition-all duration-300 border-r border-gray-300 ${
                     currency === 'eur'
                       ? 'bg-blue-600 text-white shadow-inner'
                       : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'
                   }`}
                 >
                   🇪🇺 EUR
                 </button>
                 <button
                   onClick={() => {
                     setCurrency('usd');
                     if (onCurrencyChange) onCurrencyChange('usd');
                   }}
                   className={`px-6 py-3 text-sm font-bold transition-all duration-300 ${
                     currency === 'usd'
                       ? 'bg-blue-600 text-white shadow-inner'
                       : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'
                   }`}
                 >
                   🇺🇸 USD
                 </button>
               </div>
             </div>

                         {/* Barre de recherche */}
             <div className="w-full lg:w-80">
               <div className="relative">
                 
                 <input
                   type="text"
                   placeholder="Rechercher un projet..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-16 pr-6 py-4 border-2 border-gray-300 focus:border-blue-600 bg-white text-base font-semibold text-gray-900 placeholder-gray-500 transition-all duration-200 shadow-lg"
                 />
               </div>
             </div>
          </div>
        </div>
      </div>



       {/* Contrôles de pagination améliorés - Au-dessus du tableau */}
       <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 p-6 mb-6 shadow-lg">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
          {/* Section gauche - Lignes par page et compteur */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
                              <span className="text-base font-semibold text-blue-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Lignes par page :
                </span>
              <select
                value={rowsPerPage}
                onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                className="border-2 border-blue-300 px-4 py-2 text-base font-medium text-blue-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={40}>40</option>
                <option value={50}>50</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-blue-800">
                {startIndex + 1}-{Math.min(endIndex, totalRows)}
              </span>
              <span className="text-base text-blue-700">sur</span>
              <span className="text-lg font-bold text-blue-800">
                {totalRows}
              </span>
              <span className="text-sm text-blue-600 ml-2">
                ({totalPages} page{totalPages > 1 ? 's' : ''})
              </span>
            </div>
          </div>
          
          {/* Section droite - Navigation des pages */}
          <div className="flex items-center space-x-3">
            {/* Boutons de navigation principaux */}
            <button
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-semibold border-2 border-blue-300 text-blue-700 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 shadow-sm"
            >
               <ChevronsLeft className="w-4 h-4 inline mr-2" />
               Première
            </button>
            
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-semibold border-2 border-blue-300 text-blue-700 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 shadow-sm"
            >
               <ChevronLeft className="w-4 h-4 inline mr-2" />
               Précédente
            </button>
            
            {/* Numéros de pages */}
            <div className="flex items-center space-x-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-4 py-2 text-base font-bold border-2 transition-all duration-200 shadow-sm ${
                      currentPage === pageNum
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-lg scale-105'
                        : 'border-blue-300 text-blue-700 bg-white hover:bg-blue-50 hover:border-blue-400 hover:scale-105'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-semibold border-2 border-blue-300 text-blue-700 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 shadow-sm"
            >
               Suivante
               <ChevronRight className="w-4 h-4 inline ml-2" />
            </button>
            
            <button
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-semibold border-2 border-blue-300 text-blue-700 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 shadow-sm"
            >
               Dernière
               <ChevronsRight className="w-4 h-4 inline ml-2" />
            </button>
          </div>
        </div>
        
        {/* Barre de progression visuelle */}
        <div className="mt-4 w-full bg-blue-200 h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 transition-all duration-300"
            style={{ width: `${(currentPage / totalPages) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full">
                     <thead>
             <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
               {/* Colonne Code */}
               <th 
                 className="px-4 py-5 text-left text-base font-bold text-blue-900 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-all duration-200"
                 onClick={() => handleSort('code')}
               >
                 <div className="flex items-center space-x-2">
                    <Hash className="w-5 h-5 text-blue-600" />
                   <span>Code</span>
                   <SortIcon field="code" />
                 </div>
               </th>
               
               {/* Colonne Nom du projet */}
               <th 
                 className="px-6 py-5 text-left text-base font-bold text-blue-900 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-all duration-200"
                 onClick={() => handleSort('nom')}
               >
                 <div className="flex items-center space-x-2">
                   <FileText className="w-5 h-5 text-blue-600" />
                   <span>Nom du projet</span>
                   <SortIcon field="nom" />
                 </div>
               </th>
              <th className="px-4 py-5 text-left text-base font-bold text-blue-900 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <span>Priorité</span>
                </div>
              </th>
              {/* <th className="px-4 py-5 text-center text-base font-bold text-blue-900 uppercase tracking-wider">
                <div className="flex items-center justify-center space-x-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span>Documents</span>
                </div>
              </th> */}
              <th 
                className="px-4 py-5 text-left text-base font-bold text-blue-900 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-all duration-200"
                onClick={() => handleSort('statut')}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Statut</span>
                  <SortIcon field="statut" />
                </div>
              </th>
              <th 
                className="px-4 py-5 text-left text-base font-bold text-blue-900 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-all duration-200"
                onClick={() => handleSort('date_debut')}
              >
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span>Date de début</span>
                  <SortIcon field="date_debut" />
                </div>
              </th>
              <th 
                className="px-4 py-5 text-left text-base font-bold text-blue-900 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-all duration-200"
                onClick={() => handleSort('date_fin')}
              >
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span>Date de fin</span>
                  <SortIcon field="date_fin" />
                </div>
              </th>
                             <th className="px-4 py-5 text-left text-base font-bold text-blue-900 uppercase tracking-wider">
                 <div className="flex items-center space-x-2">
                   <span>Budget</span>
                 </div>
               </th>
                             <th className="px-6 py-5 text-center text-base font-bold text-blue-900 uppercase tracking-wider">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span>Actions</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-blue-100">
                         {loading ? (
               <tr>
                 <td colSpan="9" className="px-6 py-16 text-center">
                                     <div className="flex items-center justify-center space-x-3 text-blue-600">
                     <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                     <span className="text-lg font-semibold">Chargement des projets...</span>
                   </div>
                </td>
              </tr>
                         ) : filteredAndSortedProjects.length === 0 ? (
               <tr>
                 <td colSpan="9" className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center space-y-4 text-gray-500">
                    <AlertCircle className="w-16 h-16 text-blue-300" />
                    <span className="text-xl font-bold text-gray-800">Aucun projet trouvé</span>
                    <span className="text-base">Essayez de modifier vos filtres ou ajoutez un nouveau projet</span>
                  </div>
                </td>
              </tr>
            ) : (
                             paginatedProjects.map((project, index) => (
                 <tr 
                   key={project.id} 
                   className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border-l-4 border-transparent hover:border-l-blue-400"
                 >
                                      {/* Colonne Code */}
                   <td className="px-4 py-5">
                     <div className="flex items-center space-x-2">
                       <span className="text-lg font-bold text-blue-600 bg-blue-50 px-3 py-2 border-2 border-blue-200" title={project.code || project.id || 'N/A'}>
                         {truncateText(project.code || project.id || 'N/A', 120)}
                       </span>
                     </div>
                   </td>
                   
                   {/* Colonne Nom du projet */}
                   <td className="px-6 py-5">
                     <div>
                       <div className="text-lg font-bold text-gray-900 mb-2" title={project.nom || 'Sans nom'}>
                         {truncateText(project.nom || 'Sans nom', 120)}
                         </div>
                       <div className="flex items-center space-x-6 text-sm text-gray-600">
                         <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 border border-blue-200">
                           <User className="w-4 h-4 text-blue-600" />
                           <span className="font-medium">Chef: {truncateText(getFieldValue(project, ['chef_projet', 'nom_createur', 'proprietaire.username']), 120)}</span>
                         </div>
                         <div className="flex items-center space-x-2 bg-purple-50 px-3 py-1 border border-purple-200">
                           <Calendar className="w-4 h-4 text-purple-600" />
                           <span className="font-medium">{truncateText(getFieldValue(project, ['service', 'type']), 120)}</span>
                         </div>
                       </div>
                     </div>
                   </td>
                                     <td className="px-4 py-5">
                     <span className={`inline-flex px-3 py-2 text-sm font-bold border-2 ${getPriorityColor(getFieldValue(project, 'priorite'))}`} title={getFieldValue(project, 'priorite', 'Non définie')}>
                       {truncateText(getFieldValue(project, 'priorite', 'Non définie'), 120)}
                     </span>
                   </td>
                  {/* <td className="px-4 py-5 text-center">
                                         <button
                       onClick={() => onManageDocuments(project)}
                       className="w-12 h-12 bg-green-100 hover:bg-green-200 flex items-center justify-center transition-all duration-200 border-2 border-green-200 hover:border-green-300"
                     >
                      <FileText className="w-5 h-5 text-green-700" />
                    </button>
                  </td> */}
                                     <td className="px-4 py-5">
                     <span className={`inline-flex px-3 py-2 text-sm font-bold border-2 ${getStatusColor(getFieldValue(project, ['statut', 'etat']))}`} title={getStatusText(getFieldValue(project, ['statut', 'etat']))}>
                       {truncateText(getStatusText(getFieldValue(project, ['statut', 'etat'])), 120)}
                     </span>
                   </td>
                                     <td className="px-4 py-5 text-base text-gray-900 font-semibold">
                     <span title={formatDate(getFieldValue(project, ['date_debut', 'debut', 'cree_le']))}>
                       {truncateText(formatDate(getFieldValue(project, ['date_debut', 'debut', 'cree_le'])), 120)}
                     </span>
                   </td>
                   <td className="px-4 py-5 text-base text-gray-900 font-semibold">
                     <span title={formatDate(getFieldValue(project, ['date_fin', 'fin']))}>
                       {truncateText(formatDate(getFieldValue(project, ['date_fin', 'fin'])), 120)}
                     </span>
                   </td>
                                     <td className="px-4 py-5">
                     <div className="flex flex-col space-y-1">
                       <div className="flex items-center space-x-2">
                         <DollarSign className="w-5 h-5 text-emerald-600" />
                         <span className="text-base font-bold text-gray-900" title={formatBudget(getFieldValue(project, 'budget'))}>
                           {truncateText(formatBudget(getFieldValue(project, 'budget')), 120)}
                         </span>
                       </div>
                       <div className="text-xs text-gray-500 font-medium">
                           {currency !== 'fcfa' && getFieldValue(project, 'budget') && (
                           <span className="bg-gray-100 px-2 py-1 border border-gray-300">
                               {Number(getFieldValue(project, 'budget')).toLocaleString('fr-FR')} FCFA
                           </span>
                         )}
                       </div>
                     </div>
                   </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center space-x-2">
                                             <button
                          onClick={() => handleViewProject(project)}
                         className="p-3 text-blue-600 hover:text-blue-800 hover:bg-blue-100 transition-all duration-200"
                         title="Voir les détails"
                       >
                         <Eye className="w-5 h-5" />
                       </button>
                       <button
                         onClick={() => handleEditProject(project)}
                         className="p-3 text-amber-600 hover:text-amber-800 hover:bg-amber-100 transition-all duration-200"
                         title="Modifier"
                       >
                         <Edit className="w-5 h-5" />
                       </button>
                       <button
                         onClick={() => onDeleteProject(project)}
                         className="p-3 text-red-600 hover:text-red-800 hover:bg-red-100 transition-all duration-200"
                         title="Supprimer"
                       >
                         <Trash2 className="w-5 h-5" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>



      {/* Footer avec statistiques */}
       <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-t-2 border-blue-200">
         <div className="flex justify-between items-center">
           <span className="text-base font-semibold text-blue-900">
              {paginatedProjects.length} projet(s) affiché(s) sur {filteredAndSortedProjects.length} filtré(s) sur {projects.length} total
           </span>
           <span className="flex items-center space-x-2 text-base font-medium text-blue-800">
             <Filter className="w-5 h-5 text-blue-600" />
             <span>Filtre : {statusFilter !== 'all' ? getStatusText(statusFilter) : 'Tous'}</span>
           </span>
         </div>
       </div>

       {/* Modal de détails du projet */}
       <ProjectDetailsModal
         project={selectedProject}
         isOpen={isDetailsModalOpen}
         onClose={handleCloseDetailsModal}
       />
       
              {/* Modal de modification du projet */}
       <ProjectEditModal
         project={editingProject}
         isOpen={isEditModalOpen}
         onClose={handleCloseEditModal}
         onSave={handleSaveProject}
       />
       
       {/* Modal d'ajout de projet */}
       <ProjectAddModal
         isOpen={isAddModalOpen}
         onClose={handleCloseAddModal}
         onSave={handleAddProject}
       />

     </div>
   );
 };

export default ProjectsDataTable;