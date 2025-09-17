import React from 'react';
import { Filter, ArrowRight, Grid3X3, List } from 'lucide-react';

const PhasesFilters = ({ 
  filterStatus, 
  onFilterChange, 
  viewMode, 
  onViewModeChange 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <Filter className="w-6 h-6 text-gray-600" />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => onFilterChange(e.target.value)}
            className="text-base border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 focus:bg-white"
          >
            <option value="all">Toutes les phases</option>
            <option value="pending">En attente</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminées</option>
            <option value="ignored">Ignorées</option>
          </select>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => onViewModeChange('timeline')}
            className={`p-3 rounded-lg transition-all ${
              viewMode === 'timeline' 
                ? 'bg-indigo-100 text-indigo-600' 
                : 'text-gray-400 hover:bg-gray-100'
            }`}
            title="Vue timeline"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-3 rounded-lg transition-all ${
              viewMode === 'grid' 
                ? 'bg-indigo-100 text-indigo-600' 
                : 'text-gray-400 hover:bg-gray-100'
            }`}
            title="Vue grille"
          >
            <Grid3X3 className="w-6 h-6" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-3 rounded-lg transition-all ${
              viewMode === 'list' 
                ? 'bg-indigo-100 text-indigo-600' 
                : 'text-gray-400 hover:bg-gray-100'
            }`}
            title="Vue liste"
          >
            <List className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhasesFilters;
