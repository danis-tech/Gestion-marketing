import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Play,
  CheckCircle,
  Edit3,
  Calendar,
  AlertCircle,
  ListTodo,
  User,
  Clock,
  PlayCircle
} from 'lucide-react';
import { phasesService, tasksService } from '../../../services/apiService';
import useNotification from '../../../hooks/useNotification';

const formatDate = (value) => {
  if (!value) return 'Non définie';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Non définie';
  return date.toLocaleDateString('fr-FR');
};

const getTaskStatusBadge = (task) => {
  const statut = task.statut || 'en_attente';
  switch (statut) {
    case 'termine':
      return 'bg-green-100 text-green-800 border border-green-200';
    case 'en_cours':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    default:
      return 'bg-gray-100 text-gray-700 border border-gray-200';
  }
};

const PhaseCard = ({
  phase,
  isExpanded,
  onToggleExpansion,
  onPhaseAction,
  onEditPhase,
  getPhaseStatusIcon,
  getPhaseStatusColor,
  getPhaseStatusText,
  projectId,
  onRefresh
}) => {
  const { showSuccess, showError } = useNotification();
  const [tasks, setTasks] = useState(Array.isArray(phase.taches) ? phase.taches : []);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const loadTasks = useCallback(async () => {
    if (!projectId) {
      setTasks([]);
      return;
    }

    setLoadingTasks(true);
    try {
      const response = await phasesService.getPhaseTasks(projectId, phase.id);
      const fetchedTasks = response?.taches || response || [];
      setTasks(Array.isArray(fetchedTasks) ? fetchedTasks : []);
    } catch (error) {
      console.error(`Erreur lors du chargement des tâches pour la phase ${phase.id}:`, error);
      showError('Erreur', "Impossible de charger les tâches de la phase");
    } finally {
      setLoadingTasks(false);
    }
  }, [phase.id, projectId, showError]);

  useEffect(() => {
    setTasks(Array.isArray(phase.taches) ? phase.taches : []);
  }, [phase.taches]);

  useEffect(() => {
    if (isExpanded) {
      loadTasks();
    }
  }, [isExpanded, loadTasks]);

  const handleStartTask = async (taskId, title) => {
    try {
      // Mettre à jour immédiatement l'état local pour un feedback instantané
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, statut: 'en_cours' } : task
        )
      );
      
      const response = await tasksService.startTask(taskId);
      showSuccess('Tâche démarrée', `La tâche "${title}" est maintenant en cours.`);
      
      // Recharger les tâches depuis le serveur pour avoir les données à jour
      await loadTasks();
      
      // Rafraîchir les phases pour mettre à jour le statut de la phase
      if (typeof onRefresh === 'function') {
        onRefresh();
      }
    } catch (error) {
      // En cas d'erreur, recharger les tâches pour revenir à l'état réel
      await loadTasks();
      console.error('Erreur lors du démarrage de la tâche:', error);
      const message = error?.response?.data?.message || error.message || 'Erreur lors du démarrage de la tâche';
      showError('Erreur', message);
    }
  };

  const handleValidateTask = async (taskId, title) => {
    try {
      // Mettre à jour immédiatement l'état local pour un feedback instantané
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, statut: 'termine' } : task
        )
      );
      
      const response = await tasksService.validateTask(taskId);
      showSuccess('Tâche validée', `La tâche "${title}" est maintenant terminée.`);
      
      // Recharger les tâches depuis le serveur pour avoir les données à jour
      await loadTasks();
      
      // Rafraîchir les phases pour mettre à jour le statut de la phase
      if (typeof onRefresh === 'function') {
        onRefresh();
      }
      
      // Attendre un peu pour que le backend mette à jour la phase et le projet automatiquement
      setTimeout(async () => {
        if (typeof onRefresh === 'function') {
          onRefresh();
        }
        // Recharger les tâches une dernière fois pour s'assurer que tout est à jour
        await loadTasks();
      }, 1000);
    } catch (error) {
      // En cas d'erreur, recharger les tâches pour revenir à l'état réel
      await loadTasks();
      console.error('Erreur lors de la validation de la tâche:', error);
      const message = error?.response?.data?.message || error.message || 'Erreur lors de la validation de la tâche';
      showError('Erreur', message);
    }
  };

  // Calculer les statistiques des tâches de manière optimisée
  const completedTasks = tasks.filter((task) => task.statut === 'termine');
  const pendingTasks = tasks.filter((task) => task.statut !== 'termine');
  const progression = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  return (
    <div className="bg-white shadow-sm border border-gray-200 overflow-hidden transition-all" style={{ borderRadius: '0' }}>
      <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => onToggleExpansion(phase.id)}
            className="p-2 hover:bg-gray-200 transition-colors"
            style={{ borderRadius: '0' }}
            aria-label={isExpanded ? 'Réduire la phase' : 'Développer la phase'}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
          </button>

          <div className="flex items-center gap-3 min-w-0">
            {getPhaseStatusIcon(phase)}
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 truncate">
                <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {phase.phase.ordre}
                </span>
                <span className="truncate">{phase.phase.nom}</span>
              </h3>
              {phase.phase.description && (
                <p className="text-xs text-gray-600 mt-1 truncate">
                  {phase.phase.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 text-sm font-medium border ${getPhaseStatusColor(phase)}`} style={{ borderRadius: '0' }}>
            {getPhaseStatusText(phase)}
          </span>

          <div className="flex items-center gap-2">
            {!phase.terminee && !phase.ignoree && !phase.est_en_cours && (
              <button
                onClick={() => onPhaseAction('start', phase.id)}
                className="p-2 text-green-600 hover:bg-green-50 transition-colors"
                style={{ borderRadius: '0' }}
                title="Démarrer la phase"
              >
                <Play className="w-4 h-4" />
              </button>
            )}

            {phase.est_en_cours && !phase.terminee && (
              <button
                onClick={() => onPhaseAction('end', phase.id)}
                className={`p-2 transition-colors ${
                  phase.peut_etre_terminee === false
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
                style={{ borderRadius: '0' }}
                title={
                  phase.peut_etre_terminee === false
                    ? 'Impossible de terminer : toutes les tâches doivent être terminées'
                    : 'Terminer la phase'
                }
                disabled={phase.peut_etre_terminee === false}
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => onEditPhase(phase)}
              className="p-2 text-gray-600 hover:bg-gray-50 transition-colors"
              style={{ borderRadius: '0' }}
              title="Modifier la phase"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3" style={{ borderRadius: '0' }}>
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                <Calendar className="w-3 h-3" />
                Informations temporelles
              </h4>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Début :</span>
                  <span>{formatDate(phase.date_debut)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Fin :</span>
                  <span>{formatDate(phase.date_fin)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-3" style={{ borderRadius: '0' }}>
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                <ListTodo className="w-3 h-3" />
                Progression des tâches
              </h4>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Total :</span>
                  <span className="font-medium">{tasks.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Terminées :</span>
                  <span className="font-medium text-green-700">{tasks.length - pendingTasks.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>En cours / en attente :</span>
                  <span className="font-medium text-blue-600">{pendingTasks.length}</span>
                </div>
                <div>
                  <div className="w-full bg-gray-200 h-2" style={{ borderRadius: '0' }}>
                    <div
                      className="bg-blue-500 h-2"
                      style={{ width: `${progression}%`, borderRadius: '0' }}
                    />
                  </div>
                  <p className="mt-1 text-right text-[11px] text-gray-500">{progression}% de tâches terminées</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-3" style={{ borderRadius: '0' }}>
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                <AlertCircle className="w-3 h-3" />
                Commentaires
              </h4>
              <p className="text-xs text-gray-600 min-h-[48px]">
                {phase.commentaire || 'Aucun commentaire'}
              </p>
            </div>
          </div>

          <div className="border border-gray-200" style={{ borderRadius: '0' }}>
            <div className="flex items-center justify-between p-3 bg-gray-100 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <ListTodo className="w-4 h-4 text-purple-600" />
                <h5 className="text-sm font-semibold text-gray-900">
                  Tâches de la phase ({tasks.length})
                </h5>
                {pendingTasks.length > 0 && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1" style={{ borderRadius: '0' }}>
                    {pendingTasks.length} tâche(s) à finaliser
                  </span>
                )}
              </div>
              <button
                onClick={loadTasks}
                disabled={loadingTasks}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                {loadingTasks ? 'Actualisation...' : 'Actualiser'}
              </button>
            </div>

            {loadingTasks ? (
              <div className="p-6 text-center text-sm text-gray-500">
                Chargement des tâches...
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                Aucune tâche associée à cette phase.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Tâche</th>
                      <th className="px-4 py-3 text-left">Statut</th>
                      <th className="px-4 py-3 text-left">Priorité</th>
                      <th className="px-4 py-3 text-left">Assignés</th>
                      <th className="px-4 py-3 text-left">Dates</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 align-top w-1/3">
                          <div className="flex items-start gap-2">
                            <div className="mt-1">
                              <ListTodo className="w-4 h-4 text-gray-400" />
                            </div>
                            <div>
                              <p className={`font-semibold text-gray-900 ${task.statut === 'termine' ? 'line-through text-green-700' : ''}`}>
                                {task.titre}
                              </p>
                              {task.description && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className={`px-2 py-1 text-xs font-semibold ${getTaskStatusBadge(task)}`} style={{ borderRadius: '0' }}>
                            {task.statut_display || task.statut}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className="text-xs capitalize text-gray-700">
                            {task.priorite_display || task.priorite || 'Normale'}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          {task.assigne_a && task.assigne_a.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {task.assigne_a.map((user) => (
                                <span
                                  key={user.id || `${user.prenom}-${user.nom}`}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 border border-gray-200"
                                >
                                  <User className="w-3 h-3 text-gray-500" />
                                  {user.prenom} {user.nom}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">Non assignée</span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span>Fin prévue : {formatDate(task.fin)}</span>
                          </div>
                          {task.debut && (
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3 text-gray-500" />
                              <span>Début : {formatDate(task.debut)}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top text-right">
                          {task.statut === 'en_attente' ? (
                            <button
                              onClick={() => handleStartTask(task.id, task.titre)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                              style={{ borderRadius: '0' }}
                            >
                              <PlayCircle className="w-4 h-4" />
                              Démarrer
                            </button>
                          ) : task.statut === 'en_cours' ? (
                            <button
                              onClick={() => handleValidateTask(task.id, task.titre)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors"
                              style={{ borderRadius: '0' }}
                            >
                              <CheckCircle className="w-4 h-4" />
                              Valider
                            </button>
                          ) : task.statut === 'termine' ? (
                            <span className="text-xs text-green-700 font-medium">Terminé</span>
                          ) : (
                            <span className="text-xs text-gray-500 font-medium">{task.statut_display || task.statut}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhaseCard;
