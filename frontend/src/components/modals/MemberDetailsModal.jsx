import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, User, Mail, Phone, CheckCircle, Clock, Star, Award } from 'lucide-react';
import { userService, tasksService } from '../../services/apiService';

const MemberDetailsModal = ({ isOpen, onClose, member, projectId }) => {
  const [memberDetails, setMemberDetails] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(true);
  const loadingRef = useRef(false);

  // Mémoriser la fonction de chargement pour éviter les re-rendus infinis
  const loadMemberDetails = useCallback(async () => {
    if (!member || loadingRef.current) return;
    
    loadingRef.current = true;
    
    try {
      setLoading(true);
      
      // Utiliser les données du membre directement d'abord
      setMemberDetails(member);
      
      // Si le membre a des tâches déjà disponibles, les utiliser
      if (member.taches && Array.isArray(member.taches)) {
        setTasks(member.taches);
      } else if (member.taches && typeof member.taches === 'object' && member.taches.liste) {
        setTasks(member.taches.liste);
      }
      
      // Si le membre a un ID, essayer de charger les détails complets
      if (member.id && isMountedRef.current) {
        try {
          const userDetails = await userService.getUser(member.id);
          if (isMountedRef.current) {
            setMemberDetails(userDetails);
          }
        } catch (userError) {
          // Si l'API échoue, garder les données du membre
          console.error('Erreur lors du chargement des détails utilisateur:', userError);
        }
      }

      // Charger les tâches assignées à cet utilisateur dans le projet
      if (projectId && member.id && isMountedRef.current) {
        try {
          const projectTasks = await tasksService.getProjectTasks(projectId);
          const allTasks = Array.isArray(projectTasks) ? projectTasks : 
                          (projectTasks.results || projectTasks.data || []);
          const userTasks = allTasks.filter(task => {
            if (!task) return false;
            const assignes = task.assigne_a || [];
            return assignes.some(assigne => {
              const assigneId = typeof assigne === 'object' ? assigne.id : assigne;
              return assigneId === member.id;
            });
          });
          // Utiliser les tâches chargées
          if (isMountedRef.current) {
            setTasks(prevTasks => {
              // Si on a déjà des tâches et que les nouvelles sont vides, garder les anciennes
              if (prevTasks.length > 0 && userTasks.length === 0) {
                return prevTasks;
              }
              // Sinon, utiliser les nouvelles tâches
              return userTasks;
            });
          }
        } catch (error) {
          console.error('Erreur lors du chargement des tâches:', error);
          // En cas d'erreur, garder les tâches existantes si disponibles
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails du membre:', error);
      // En cas d'erreur, utiliser les données du membre directement
      if (isMountedRef.current) {
        setMemberDetails(member);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      loadingRef.current = false;
    }
  }, [member, projectId]);

  useEffect(() => {
    isMountedRef.current = true;
    if (isOpen && member) {
      loadMemberDetails();
    } else {
      // Réinitialiser les données quand le modal se ferme
      setMemberDetails(null);
      setTasks([]);
      setLoading(false);
      loadingRef.current = false;
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [isOpen, member, loadMemberDetails]);


  if (!isOpen) return null;
  
  // S'assurer qu'on a au moins le membre de base
  if (!member) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6" onClick={onClose}>
        <div className="w-full max-w-3xl bg-white border border-gray-200 shadow-2xl p-6" style={{ borderRadius: '0' }}>
          <p className="text-red-600">Erreur : Aucune information sur le membre disponible.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white" style={{ borderRadius: '0' }}>Fermer</button>
        </div>
      </div>
    );
  }

  const memberData = memberDetails || member;
  
  // Calculer les statistiques des tâches de manière sécurisée
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const completedTasks = safeTasks.filter(t => t && t.statut === 'termine');
  const pendingTasks = safeTasks.filter(t => t && t.statut !== 'termine');
  
  // Calcul de la note sur 20 basée sur le taux de complétion
  const completionRate = safeTasks.length > 0 ? (completedTasks.length / safeTasks.length) * 100 : 0;
  const note = Math.round((completionRate / 100) * 20 * 10) / 10; // Note sur 20 avec 1 décimale

  // Récupérer les informations du membre de manière sécurisée
  const getStringValue = (value, defaultValue = '') => {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'object') {
      // Si c'est un objet, essayer d'extraire une propriété utile
      if (Array.isArray(value)) return defaultValue;
      // Essayer les propriétés communes
      const stringValue = value.nom || value.code || value.name || value.titre || value.label || value.text;
      if (stringValue && typeof stringValue === 'string') return stringValue;
      // Si aucune propriété string n'est trouvée, retourner la valeur par défaut
      return defaultValue;
    }
    return String(value);
  };

  const memberName = getStringValue(
    memberData?.nom_complet || 
    `${getStringValue(memberData?.prenom)} ${getStringValue(memberData?.nom)}`.trim() || 
    getStringValue(memberData?.username) || 
    'Membre'
  ).trim() || 'Membre';
  const memberPhoto = memberData?.photo_url || null;
  const memberEmail = getStringValue(memberData?.email || memberData?.email_professionnel, 'Non disponible');
  const memberPhone = getStringValue(memberData?.telephone || memberData?.telephone_professionnel || memberData?.phone, 'Non disponible');
  const memberRole = getStringValue(memberData?.role_projet || memberData?.role, 'Non défini');
  // Extraire le nom du service de manière sécurisée
  let memberService = 'Non défini';
  if (memberData?.service) {
    // Si service est une chaîne, l'utiliser directement
    if (typeof memberData.service === 'string') {
      memberService = memberData.service;
    } else if (typeof memberData.service === 'object' && memberData.service.nom) {
      memberService = memberData.service.nom;
    }
  } else if (memberData?.service_info) {
    // Si service_info est un objet, extraire le nom
    if (typeof memberData.service_info === 'object') {
      memberService = memberData.service_info.nom || memberData.service_info.code || 'Non défini';
    } else if (typeof memberData.service_info === 'string') {
      memberService = memberData.service_info;
    }
  }

  // Empêcher la fermeture accidentelle
  const handleBackdropClick = (e) => {
    // Ne fermer que si on clique directement sur le backdrop, pas sur le contenu
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6" 
      onClick={handleBackdropClick}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div 
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', zIndex: 1, borderRadius: '0' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white p-6" style={{ borderRadius: '0' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {memberPhoto ? (
                <img 
                  src={memberPhoto} 
                  alt={memberName}
                  className="w-16 h-16 rounded-full object-cover border-4 border-white/30"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`w-16 h-16 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30 ${memberPhoto ? 'hidden' : ''}`}>
                <User className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {memberName}
                </h2>
                {memberRole !== 'Non défini' && typeof memberRole === 'string' && (
                  <p className="text-blue-100 text-sm mt-1">{memberRole}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des informations...</p>
            </div>
          ) : (
            <>
              {/* Informations personnelles */}
              <div className="bg-white border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Informations personnelles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Nom</label>
                    <p className="text-gray-900">{getStringValue(memberData?.nom, 'Non renseigné')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Prénom</label>
                    <p className="text-gray-900">{getStringValue(memberData?.prenom, 'Non renseigné')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <p className="text-gray-900">{memberEmail}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      Téléphone
                    </label>
                    <p className="text-gray-900">{memberPhone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Username</label>
                    <p className="text-gray-900">{getStringValue(memberData?.username, 'Non renseigné')}</p>
                  </div>
                  {memberService !== 'Non défini' && typeof memberService === 'string' && (
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1 block">Service</label>
                      <p className="text-gray-900">{memberService}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Note sur 20 */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-600" />
                      Note de performance
                    </h3>
                    <p className="text-sm text-gray-600">
                      Basée sur le taux de complétion des tâches
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-yellow-600 mb-1">
                      {note.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600 font-semibold">/ 20</div>
                    <div className="mt-2 text-xs text-gray-500">
                      {completedTasks.length} / {safeTasks.length} tâches terminées
                    </div>
                  </div>
                </div>
                <div className="mt-4 w-full bg-gray-200 h-3">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-3 transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                  ></div>
                </div>
              </div>

              {/* Tâches assignées */}
              <div className="bg-white border border-gray-200 p-6" style={{ borderRadius: '0' }}>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Tâches assignées ({safeTasks.length})
                </h3>
                {safeTasks.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {safeTasks.map((task, index) => {
                      if (!task) return null;
                      const taskId = task.id || task.tache_id || index;
                      const taskTitle = task.titre || task.nom || 'Tâche sans titre';
                      const taskStatus = task.statut || 'en_attente';
                      const getStatusText = (statut) => {
                        const statusMap = {
                          'termine': 'Terminé',
                          'en_cours': 'En cours',
                          'en_attente': 'En attente',
                          'hors_delai': 'Hors délai',
                          'rejete': 'Rejeté'
                        };
                        return statusMap[statut] || statut;
                      };
                      const getStatusClass = (statut) => {
                        if (statut === 'termine') return 'bg-green-100 text-green-800';
                        if (statut === 'en_cours') return 'bg-blue-100 text-blue-800';
                        if (statut === 'hors_delai') return 'bg-red-100 text-red-800';
                        return 'bg-yellow-100 text-yellow-800';
                      };
                      
                      return (
                        <div
                          key={taskId}
                          className={`p-4 border ${
                            taskStatus === 'termine' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                          }`}
                          style={{ borderRadius: '0' }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">{taskTitle}</h4>
                              {task.description && (
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                  {typeof task.description === 'string' ? task.description : String(task.description || '')}
                                </p>
                              )}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-1 text-xs font-semibold ${getStatusClass(taskStatus)}`} style={{ borderRadius: '0' }}>
                                  {task.statut_display || getStatusText(taskStatus)}
                                </span>
                                {task.priorite && (
                                  <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700" style={{ borderRadius: '0' }}>
                                    Priorité: {task.priorite_display || (typeof task.priorite === 'string' ? task.priorite : (task.priorite?.nom || task.priorite?.code || 'N/A'))}
                                  </span>
                                )}
                                {task.progression !== undefined && (
                                  <span className="text-xs text-gray-600">
                                    Progression: {task.progression}%
                                  </span>
                                )}
                              </div>
                            </div>
                            {taskStatus === 'termine' && (
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Aucune tâche assignée à ce membre</p>
                  </div>
                )}
              </div>

              {/* Statistiques des tâches */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-700">{completedTasks.length}</div>
                  <div className="text-sm text-green-600 font-semibold">Tâches terminées</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 p-4 text-center">
                  <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-yellow-700">{pendingTasks.length}</div>
                  <div className="text-sm text-yellow-600 font-semibold">Tâches en cours</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberDetailsModal;

