import React, { useState } from 'react';
import { PhaseProgressCard, PhaseStatsCard } from '../ui';

const PhasesManagementDemo = () => {
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
      est_en_attente: false
    },
    {
      id: 2,
      phase: {
        id: 2,
        nom: 'Études de faisabilité',
        ordre: 2,
        description: 'Phase d\'étude de la faisabilité technique et commerciale'
      },
      terminee: true,
      ignoree: false,
      date_debut: '2024-01-21T09:00:00Z',
      date_fin: '2024-01-30T17:00:00Z',
      commentaire: 'Faisabilité confirmée, budget approuvé',
      est_en_cours: false,
      est_en_attente: false
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
      date_debut: '2024-02-01T09:00:00Z',
      date_fin: null,
      commentaire: 'Conception en cours, architecture définie',
      est_en_cours: true,
      est_en_attente: false
    },
    {
      id: 4,
      phase: {
        id: 4,
        nom: 'Développement / Implémentation',
        ordre: 4,
        description: 'Phase de développement et d\'implémentation'
      },
      terminee: false,
      ignoree: false,
      date_debut: null,
      date_fin: null,
      commentaire: '',
      est_en_cours: false,
      est_en_attente: true
    },
    {
      id: 5,
      phase: {
        id: 5,
        nom: 'Lancement commercial',
        ordre: 5,
        description: 'Phase de lancement commercial du projet'
      },
      terminee: false,
      ignoree: false,
      date_debut: null,
      date_fin: null,
      commentaire: '',
      est_en_cours: false,
      est_en_attente: true
    },
    {
      id: 6,
      phase: {
        id: 6,
        nom: 'Suppression d\'une offre',
        ordre: 6,
        description: 'Phase de suppression ou d\'arrêt de l\'offre'
      },
      terminee: false,
      ignoree: false,
      date_debut: null,
      date_fin: null,
      commentaire: '',
      est_en_cours: false,
      est_en_attente: true
    }
  ];

  const [viewMode, setViewMode] = useState('grid');

  const handlePhaseAction = (action, phaseId) => {
    console.log(`Action ${action} sur la phase ${phaseId}`);
  };

  const handleEditPhase = (phase) => {
    console.log('Modifier la phase:', phase);
  };

  const handleDeletePhase = (phaseId) => {
    console.log('Supprimer la phase:', phaseId);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Démonstration - Gestion des Phases
        </h1>

        {/* Statistiques */}
        <div className="mb-8">
          <PhaseStatsCard 
            progression={mockProgression} 
            projectName="Projet Marketing Demo"
          />
        </div>

        {/* Contrôles de vue */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Phases du Projet
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-400 hover:bg-gray-100'
                }`}
                title="Vue grille"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-400 hover:bg-gray-100'
                }`}
                title="Vue liste"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Affichage des phases */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockPhases.map((phase) => (
              <PhaseProgressCard
                key={phase.id}
                phase={phase}
                onAction={handlePhaseAction}
                onEdit={handleEditPhase}
                onDelete={handleDeletePhase}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {mockPhases.map((phase) => (
              <div
                key={phase.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      {phase.terminee ? (
                        <div className="w-5 h-5 text-green-500">✓</div>
                      ) : phase.est_en_cours ? (
                        <div className="w-5 h-5 text-blue-500">⏱</div>
                      ) : (
                        <div className="w-5 h-5 text-gray-400">○</div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {phase.phase.ordre}. {phase.phase.nom}
                        </h3>
                        <p className="text-sm text-gray-600">{phase.phase.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      phase.terminee ? 'bg-green-100 text-green-800' :
                      phase.est_en_cours ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {phase.terminee ? 'Terminée' : phase.est_en_cours ? 'En cours' : 'En attente'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PhasesManagementDemo;
