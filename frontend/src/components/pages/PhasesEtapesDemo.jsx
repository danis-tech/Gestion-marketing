import React, { useState } from 'react';
import { 
  Target, 
  Zap, 
  CheckCircle, 
  Clock, 
  Circle, 
  Play, 
  Pause, 
  Edit3, 
  Trash2, 
  Plus,
  User,
  Calendar,
  Star,
  AlertTriangle,
  BarChart3,
  TrendingUp
} from 'lucide-react';

const PhasesEtapesDemo = () => {
  // Données de démonstration
  const mockProgression = {
    total_phases: 6,
    phases_terminees: 2,
    phases_ignorees: 0,
    phases_en_cours: 1,
    progression_pourcentage: 33.33
  };

  const mockPhases = [
    {
      id: 1,
      phase: {
        id: 1,
        nom: 'Expression du besoin',
        ordre: 1,
        description: 'Phase de collecte et d\'analyse des besoins'
      },
      terminee: true,
      ignoree: false,
      date_debut: '2024-01-15T09:00:00Z',
      date_fin: '2024-01-20T17:00:00Z',
      commentaire: 'Besoins bien définis et validés par le client',
      est_en_cours: false,
      est_en_attente: false,
      etapes: [
        {
          id: 1,
          nom: 'Rencontrer le client',
          description: 'Prise de contact et compréhension des besoins',
          ordre: 1,
          statut: 'terminee',
          priorite: 'elevee',
          responsable: { prenom: 'Jean', nom: 'Dupont' },
          progression_pourcentage: 100,
          date_debut_prevue: '2024-01-15',
          date_fin_prevue: '2024-01-16',
          date_debut_reelle: '2024-01-15',
          date_fin_reelle: '2024-01-16',
          commentaire: 'Réunion très productive'
        },
        {
          id: 2,
          nom: 'Analyser les besoins',
          description: 'Analyse détaillée des besoins exprimés',
          ordre: 2,
          statut: 'terminee',
          priorite: 'normale',
          responsable: { prenom: 'Marie', nom: 'Martin' },
          progression_pourcentage: 100,
          date_debut_prevue: '2024-01-17',
          date_fin_prevue: '2024-01-18',
          date_debut_reelle: '2024-01-17',
          date_fin_reelle: '2024-01-18',
          commentaire: 'Analyse complète réalisée'
        },
        {
          id: 3,
          nom: 'Définir les objectifs',
          description: 'Définition des objectifs SMART',
          ordre: 3,
          statut: 'terminee',
          priorite: 'elevee',
          responsable: { prenom: 'Pierre', nom: 'Durand' },
          progression_pourcentage: 100,
          date_debut_prevue: '2024-01-19',
          date_fin_prevue: '2024-01-20',
          date_debut_reelle: '2024-01-19',
          date_fin_reelle: '2024-01-20',
          commentaire: 'Objectifs clairs et mesurables'
        }
      ]
    },
    {
      id: 2,
      phase: {
        id: 2,
        nom: 'Études de faisabilité',
        ordre: 2,
        description: 'Phase d\'étude de la faisabilité technique et commerciale'
      },
      terminee: false,
      ignoree: false,
      date_debut: '2024-01-21T09:00:00Z',
      date_fin: null,
      commentaire: 'Études en cours',
      est_en_cours: true,
      est_en_attente: false,
      etapes: [
        {
          id: 4,
          nom: 'Étude technique',
          description: 'Analyse de la faisabilité technique',
          ordre: 1,
          statut: 'en_cours',
          priorite: 'critique',
          responsable: { prenom: 'Sophie', nom: 'Leroy' },
          progression_pourcentage: 60,
          date_debut_prevue: '2024-01-21',
          date_fin_prevue: '2024-01-25',
          date_debut_reelle: '2024-01-21',
          date_fin_reelle: null,
          commentaire: 'Analyse en cours, quelques points à clarifier'
        },
        {
          id: 5,
          nom: 'Étude financière',
          description: 'Évaluation des coûts et rentabilité',
          ordre: 2,
          statut: 'en_attente',
          priorite: 'elevee',
          responsable: { prenom: 'Thomas', nom: 'Moreau' },
          progression_pourcentage: 0,
          date_debut_prevue: '2024-01-26',
          date_fin_prevue: '2024-01-30',
          date_debut_reelle: null,
          date_fin_reelle: null,
          commentaire: 'En attente de l\'étude technique'
        }
      ]
    },
    {
      id: 3,
      phase: {
        id: 3,
        nom: 'Conception',
        ordre: 3,
        description: 'Phase de conception détaillée du projet'
      },
      terminee: false,
      ignoree: false,
      date_debut: null,
      date_fin: null,
      commentaire: null,
      est_en_cours: false,
      est_en_attente: true,
      etapes: []
    }
  ];

  const [expandedPhases, setExpandedPhases] = useState(new Set([1, 2]));
  const [expandedEtapes, setExpandedEtapes] = useState(new Set([4]));

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
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (phase.ignoree) {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    } else if (phase.est_en_cours) {
      return <Clock className="w-5 h-5 text-blue-500" />;
    } else {
      return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getEtapeStatusIcon = (etape) => {
    switch (etape.statut) {
      case 'terminee':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'en_cours':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'annulee':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
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

  return (
    <div className="phases-etapes-demo p-8 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Target className="w-8 h-8" />
              Démonstration - Phases & Étapes
            </h1>
            <p className="text-blue-100 text-lg">
              Exemple concret de gestion des phases et étapes d'un projet
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl font-bold">{mockProgression.progression_pourcentage}%</div>
              <div className="text-sm text-blue-100">Progression</div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Progression du Projet
          </h2>
          <div className="text-3xl font-bold text-blue-600">
            {mockProgression.progression_pourcentage}%
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${mockProgression.progression_pourcentage}%` }}
          ></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{mockProgression.total_phases}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{mockProgression.phases_terminees}</div>
            <div className="text-sm text-green-600">Terminées</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{mockProgression.phases_en_cours}</div>
            <div className="text-sm text-blue-600">En cours</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{mockProgression.phases_ignorees}</div>
            <div className="text-sm text-red-600">Ignorées</div>
          </div>
        </div>
      </div>

      {/* Timeline des phases */}
      <div className="space-y-6">
        {mockPhases.map((phase) => (
          <div key={phase.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* En-tête de la phase */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => togglePhaseExpansion(phase.id)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {expandedPhases.has(phase.id) ? (
                      <TrendingUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <Play className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                  
                  <div className="flex items-center gap-3">
                    {getPhaseStatusIcon(phase)}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                          {phase.phase.ordre}
                        </span>
                        {phase.phase.nom}
                      </h3>
                      <p className="text-gray-600 mt-1">{phase.phase.description}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getPhaseStatusColor(phase)}`}>
                    {getPhaseStatusText(phase)}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" title="Modifier la phase">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenu de la phase (expandable) */}
            {expandedPhases.has(phase.id) && (
              <div className="p-6">
                {/* Informations de la phase */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Dates
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600">
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
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Commentaires
                    </h4>
                    <p className="text-sm text-gray-600">
                      {phase.commentaire || 'Aucun commentaire'}
                    </p>
                  </div>
                </div>

                {/* Section des étapes */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-purple-600" />
                      Étapes ({phase.etapes?.length || 0})
                    </h4>
                    <button className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                      <Plus className="w-4 h-4" />
                      Ajouter une étape
                    </button>
                  </div>

                  {/* Liste des étapes */}
                  <div className="space-y-3">
                    {phase.etapes && phase.etapes.length > 0 ? (
                      phase.etapes.map((etape) => (
                        <div key={etape.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleEtapeExpansion(etape.id)}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                {expandedEtapes.has(etape.id) ? (
                                  <TrendingUp className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <Play className="w-4 h-4 text-gray-400" />
                                )}
                              </button>
                              
                              <div className="flex items-center gap-2">
                                {getEtapeStatusIcon(etape)}
                                <div>
                                  <h5 className="font-medium text-gray-900 flex items-center gap-2">
                                    {etape.nom}
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(etape.priorite)}`}>
                                      {etape.priorite}
                                    </span>
                                  </h5>
                                  <p className="text-sm text-gray-600">{etape.description}</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getEtapeStatusColor(etape)}`}>
                                {getEtapeStatusText(etape)}
                              </span>
                              
                              <div className="flex items-center gap-2">
                                <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" title="Modifier l'étape">
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer l'étape">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Détails de l'étape (expandable) */}
                          {expandedEtapes.has(etape.id) && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <h6 className="font-medium text-gray-900 mb-2">Responsable</h6>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <User className="w-4 h-4" />
                                    <span>{etape.responsable ? `${etape.responsable.prenom} ${etape.responsable.nom}` : 'Non assigné'}</span>
                                  </div>
                                </div>
                                
                                <div>
                                  <h6 className="font-medium text-gray-900 mb-2">Progression</h6>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${etape.progression_pourcentage}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-sm text-gray-600">{etape.progression_pourcentage}%</span>
                                  </div>
                                </div>
                                
                                <div>
                                  <h6 className="font-medium text-gray-900 mb-2">Dates prévues</h6>
                                  <div className="space-y-1 text-sm text-gray-600">
                                    <div>Début: {etape.date_debut_prevue ? new Date(etape.date_debut_prevue).toLocaleDateString('fr-FR') : 'Non définie'}</div>
                                    <div>Fin: {etape.date_fin_prevue ? new Date(etape.date_fin_prevue).toLocaleDateString('fr-FR') : 'Non définie'}</div>
                                  </div>
                                </div>
                              </div>
                              
                              {etape.commentaire && (
                                <div className="mt-4">
                                  <h6 className="font-medium text-gray-900 mb-2">Commentaire</h6>
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
                      <div className="text-center py-8 text-gray-500">
                        <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Aucune étape définie pour cette phase</p>
                        <button className="mt-2 text-blue-600 hover:text-blue-700 font-medium">
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

      {/* Légende */}
      <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Légende</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Phases</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Terminée</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>En cours</span>
              </div>
              <div className="flex items-center gap-2">
                <Circle className="w-4 h-4 text-gray-400" />
                <span>En attente</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Priorités des Étapes</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-100">Critique</span>
                <span>Urgent et important</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-full text-xs font-medium text-orange-600 bg-orange-100">Élevée</span>
                <span>Important</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-full text-xs font-medium text-blue-600 bg-blue-100">Normale</span>
                <span>Standard</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhasesEtapesDemo;
