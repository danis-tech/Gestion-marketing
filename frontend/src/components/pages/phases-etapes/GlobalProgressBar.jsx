import React from 'react';

const GlobalProgressBar = ({ progression }) => {
  return (
    <div className="max-w-6xl mx-auto mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900">Progression globale du projet</h3>
        <span className="text-lg font-bold text-indigo-600">{progression?.progression_pourcentage || 0}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-indigo-600 h-2 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progression?.progression_pourcentage || 0}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
};

export default GlobalProgressBar;
