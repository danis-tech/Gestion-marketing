import React from 'react';

const ProjectStats = ({ selectedProject, progression }) => {
  if (!selectedProject) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{selectedProject.nom}</h2>
          <p className="text-sm text-gray-500">Projet {selectedProject.code}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{progression?.progression_pourcentage || 0}%</div>
          <div className="text-sm text-gray-500">Complété</div>
        </div>
      </div>
      
      {/* Barre de progression */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progression?.progression_pourcentage || 0}%` }}
          ></div>
        </div>
      </div>

      {/* Statistiques détaillées */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900">{progression?.total_phases || 0}</div>
          <div className="text-xs text-gray-500 font-medium">Total</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-600">{progression?.phases_terminees || 0}</div>
          <div className="text-xs text-green-600 font-medium">Terminées</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-600">{progression?.phases_en_cours || 0}</div>
          <div className="text-xs text-blue-600 font-medium">En cours</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-lg font-bold text-red-600">{progression?.phases_ignorees || 0}</div>
          <div className="text-xs text-red-600 font-medium">Ignorées</div>
        </div>
      </div>
    </div>
  );
};

export default ProjectStats;
