import React from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Play, 
  CheckCircle, 
  Edit3, 
  Calendar, 
  AlertCircle,
  Zap,
  Plus,
  Trash2
} from 'lucide-react';

const PhaseCard = ({ 
  phase, 
  isExpanded, 
  onToggleExpansion, 
  onPhaseAction, 
  onEditPhase, 
  onAddEtape,
  expandedEtapes,
  onToggleEtapeExpansion,
  onEtapeAction,
  onEditEtape,
  onDeleteEtape,
  getPhaseStatusIcon,
  getPhaseStatusColor,
  getPhaseStatusText,
  getEtapeStatusIcon,
  getEtapeStatusColor,
  getEtapeStatusText,
  getPriorityColor
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* En-tête de la phase */}
      <div className="bg-gray-50 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onToggleExpansion(phase.id)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
            
            <div className="flex items-center gap-3">
              {getPhaseStatusIcon(phase)}
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    {phase.phase.ordre}
                  </span>
                  {phase.phase.nom}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{phase.phase.description}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPhaseStatusColor(phase)}`}>
              {getPhaseStatusText(phase)}
            </span>
            
            <div className="flex items-center gap-2">
              {!phase.terminee && !phase.ignoree && !phase.est_en_cours && (
                <button
                  onClick={() => onPhaseAction('start', phase.id)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Démarrer la phase"
                >
                  <Play className="w-4 h-4" />
                </button>
              )}
              
              {phase.est_en_cours && !phase.terminee && (
                <button
                  onClick={() => {
                    console.log('Clic sur terminer phase:', {id: phase.id, nom: phase.phase.nom, terminee: phase.terminee});
                    onPhaseAction('end', phase.id);
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    phase.peut_etre_terminee === false
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-blue-600 hover:bg-blue-50'
                  }`}
                  title={
                    phase.peut_etre_terminee === false
                      ? "Impossible de terminer : toutes les étapes doivent être terminées ou annulées"
                      : "Terminer la phase"
                  }
                  disabled={phase.peut_etre_terminee === false}
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
              
              <button
                onClick={() => onEditPhase(phase)}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                title="Modifier la phase"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu de la phase (expandable) */}
      {isExpanded && (
        <div className="p-4">
          {/* Informations de la phase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                <Calendar className="w-3 h-3" />
                Dates
              </h4>
              <div className="space-y-1 text-xs text-gray-600">
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
            
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                <AlertCircle className="w-3 h-3" />
                Commentaires
              </h4>
              <p className="text-xs text-gray-600">
                {phase.commentaire || 'Aucun commentaire'}
              </p>
            </div>
          </div>

          {/* Section des étapes */}
          <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-600" />
                Étapes ({phase.etapes?.length || 0})
              </h4>
              {phase.est_en_cours && phase.peut_etre_terminee === false && (
                <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                  <AlertCircle className="w-3 h-3" />
                  <span>Étapes à terminer</span>
                </div>
              )}
            </div>
              <button
                onClick={() => onAddEtape(phase.id)}
                className="flex items-center gap-2 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Ajouter une étape
              </button>
            </div>

            {/* Liste des étapes */}
            <div className="space-y-3">
              {phase.etapes && phase.etapes.length > 0 ? (
                phase.etapes.map((etape) => (
                  <div key={etape.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onToggleEtapeExpansion(etape.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          {expandedEtapes.has(etape.id) ? (
                            <ChevronDown className="w-3 h-3 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                        
                        <div className="flex items-center gap-2">
                          {getEtapeStatusIcon(etape)}
                          <div>
                            <h5 className="font-medium text-gray-900 flex items-center gap-2 text-sm">
                              {etape.nom}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(etape.priorite)}`}>
                                {etape.priorite}
                              </span>
                            </h5>
                            <p className="text-xs text-gray-600">{etape.description}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getEtapeStatusColor(etape)}`}>
                          {getEtapeStatusText(etape)}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {etape.statut === 'en_attente' && (
                            <button
                              onClick={() => onEtapeAction('start', phase.id, etape.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Démarrer l'étape"
                            >
                              <Play className="w-3 h-3" />
                            </button>
                          )}
                          
                          {etape.statut === 'en_cours' && (
                            <button
                              onClick={() => onEtapeAction('end', phase.id, etape.id)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Terminer l'étape"
                            >
                              <CheckCircle className="w-3 h-3" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => onEditEtape(etape)}
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                            title="Modifier l'étape"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          
                          <button
                            onClick={() => onDeleteEtape(phase.id, etape.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Supprimer l'étape"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Détails de l'étape (expandable) */}
                    {expandedEtapes.has(etape.id) && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h6 className="font-medium text-gray-900 mb-2 text-sm">Progression</h6>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>{etape.progression_pourcentage || 0}%</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${etape.progression_pourcentage || 0}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h6 className="font-medium text-gray-900 mb-2 text-sm">Dates prévues</h6>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div>Début: {etape.date_debut_prevue ? new Date(etape.date_debut_prevue).toLocaleDateString('fr-FR') : 'Non définie'}</div>
                              <div>Fin: {etape.date_fin_prevue ? new Date(etape.date_fin_prevue).toLocaleDateString('fr-FR') : 'Non définie'}</div>
                            </div>
                          </div>
                        </div>
                        
                        {etape.commentaire && (
                          <div className="mt-4">
                            <h6 className="font-medium text-gray-900 mb-2 text-sm">Commentaire</h6>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                              {etape.commentaire}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Zap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm mb-3">Aucune étape définie pour cette phase</p>
                  <button
                    onClick={() => onAddEtape(phase.id)}
                    className="mt-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
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
  );
};

export default PhaseCard;
