import React from 'react';
import { Target } from 'lucide-react';

const PhasesHeader = ({ progression }) => {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="w-full flex justify-center">
        <div className="w-[90%] px-6">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900"> Validations Par Étapes de projets</h1>
              {/* <p className="text-lg text-gray-500">Gestion des projets</p> */}
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-5xl font-bold text-gray-900">{progression?.progression_pourcentage || 0}%</div>
              <div className="text-lg text-gray-500">Progression globale</div>
            </div>
            <div className="w-20 h-20 relative">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                <Target className="w-12 h-12 text-indigo-600" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">{progression?.total_phases || 0}</span>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default PhasesHeader;
