import React from 'react';
import { CheckCircle2, Clock, XCircle, Circle, TrendingUp } from 'lucide-react';

const PhaseProgressCard = ({ phase, onAction, onEdit, onDelete }) => {
  const getStatusIcon = (phase) => {
    if (phase.terminee) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    } else if (phase.ignoree) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    } else if (phase.est_en_cours) {
      return <Clock className="w-5 h-5 text-blue-500" />;
    } else {
      return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (phase) => {
    if (phase.terminee) return 'Terminée';
    if (phase.ignoree) return 'Ignorée';
    if (phase.est_en_cours) return 'En cours';
    return 'En attente';
  };

  const getStatusColor = (phase) => {
    if (phase.terminee) return 'bg-green-100 text-green-800 border-green-200';
    if (phase.ignoree) return 'bg-red-100 text-red-800 border-red-200';
    if (phase.est_en_cours) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getProgressPercentage = (phase) => {
    if (phase.terminee) return 100;
    if (phase.ignoree) return 0;
    if (phase.est_en_cours) return 50;
    return 0;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getStatusIcon(phase)}
          <div>
            <h3 className="font-semibold text-gray-900">
              {phase.phase.ordre}. {phase.phase.nom}
            </h3>
            <p className="text-sm text-gray-600">{phase.phase.description}</p>
          </div>
        </div>
        
        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(phase)}`}>
          {getStatusText(phase)}
        </span>
      </div>

      {/* Barre de progression */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>Progression</span>
          <span>{getProgressPercentage(phase)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              phase.terminee ? 'bg-green-500' :
              phase.ignoree ? 'bg-red-500' :
              phase.est_en_cours ? 'bg-blue-500' : 'bg-gray-400'
            }`}
            style={{ width: `${getProgressPercentage(phase)}%` }}
          ></div>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-600">Début:</span>
          <p className="font-medium">
            {phase.date_debut ? new Date(phase.date_debut).toLocaleDateString('fr-FR') : 'Non définie'}
          </p>
        </div>
        <div>
          <span className="text-gray-600">Fin:</span>
          <p className="font-medium">
            {phase.date_fin ? new Date(phase.date_fin).toLocaleDateString('fr-FR') : 'Non définie'}
          </p>
        </div>
      </div>

      {/* Commentaire */}
      {phase.commentaire && (
        <div className="mb-4">
          <span className="text-sm text-gray-600">Commentaire:</span>
          <p className="text-sm text-gray-800 mt-1">{phase.commentaire}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          {!phase.terminee && !phase.ignoree && !phase.est_en_cours && (
            <button
              onClick={() => onAction('start', phase.id)}
              className="flex items-center gap-1 px-3 py-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm"
            >
              <TrendingUp className="w-4 h-4" />
              Démarrer
            </button>
          )}
          
          {phase.est_en_cours && (
            <button
              onClick={() => onAction('end', phase.id)}
              className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Terminer
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(phase)}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            title="Modifier"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          
          <button
            onClick={() => onDelete(phase.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Supprimer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhaseProgressCard;
