import React from 'react';
import { Filter } from 'lucide-react';

const PhasesFilters = ({ 
  filterStatus, 
  onFilterChange
}) => {
  return (
    <div className="bg-white shadow-sm border border-gray-200 p-4" style={{ borderRadius: '0' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 flex items-center justify-center" style={{ borderRadius: '0' }}>
            <Filter className="w-6 h-6 text-gray-600" />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => onFilterChange(e.target.value)}
            className="text-base border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 focus:bg-white"
            style={{ borderRadius: '0' }}
          >
            <option value="all">Toutes les phases</option>
            <option value="pending">En attente</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminées</option>
            <option value="ignored">Ignorées</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default PhasesFilters;
