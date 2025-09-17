import React from 'react';
import { TrendingUp, CheckCircle2, Clock, XCircle, Circle } from 'lucide-react';

const PhaseStatsCard = ({ progression, projectName }) => {
  const stats = [
    {
      label: 'Total',
      value: progression?.total_phases || 0,
      icon: Circle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    },
    {
      label: 'Terminées',
      value: progression?.phases_terminees || 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'En cours',
      value: progression?.phases_en_cours || 0,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Ignorées',
      value: progression?.phases_ignorees || 0,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

  const progressPercentage = progression?.progression_pourcentage || 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Progression du Projet
          </h3>
          <p className="text-sm text-gray-600">{projectName}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600">
            {progressPercentage.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Complété</div>
        </div>
      </div>

      {/* Barre de progression principale */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Statistiques détaillées */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${stat.bgColor} mb-2`}>
                <IconComponent className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Indicateur de performance */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Performance</span>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">
              {progressPercentage >= 80 ? 'Excellent' :
               progressPercentage >= 60 ? 'Bon' :
               progressPercentage >= 40 ? 'Moyen' :
               progressPercentage >= 20 ? 'Faible' : 'Très faible'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhaseStatsCard;
