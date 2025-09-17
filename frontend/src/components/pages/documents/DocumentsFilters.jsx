import React from 'react';
import { Filter, Grid3X3, List, Calendar, User, FileText } from 'lucide-react';

const DocumentsFilters = ({ 
  filterStatus, 
  onFilterChange, 
  viewMode, 
  onViewModeChange,
  sortBy,
  onSortChange,
  documentTypes,
  selectedType,
  onTypeChange
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Filtres de gauche */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtre par statut */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => onFilterChange(e.target.value)}
              className="px-3 py-3 text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="brouillon">Brouillons</option>
              <option value="finalise">Finalisés</option>
              <option value="archived">Archivés</option>
            </select>
          </div>

          {/* Filtre par type */}
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            <select
              value={selectedType}
              onChange={(e) => onTypeChange(e.target.value)}
              className="px-3 py-3 text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">Tous les types</option>
              {documentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.icone} {type.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Tri */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-3 py-3 text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="date_desc">Plus récent</option>
              <option value="date_asc">Plus ancien</option>
              <option value="name_asc">Nom A-Z</option>
              <option value="name_desc">Nom Z-A</option>
              <option value="size_desc">Plus gros</option>
              <option value="size_asc">Plus petit</option>
            </select>
          </div>
        </div>

        {/* Contrôles de droite */}
        <div className="flex items-center gap-3">
          {/* Mode d'affichage */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white shadow-sm text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Vue grille"
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white shadow-sm text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Vue liste"
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          {/* Compteur de résultats */}
          <div className="text-sm text-gray-500">
            {/* Le compteur sera calculé dans le composant parent */}
          </div>
        </div>
      </div>

      {/* Filtres actifs */}
      {(filterStatus !== 'all' || selectedType !== 'all') && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">Filtres actifs:</span>
            
            {filterStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                Statut: {filterStatus}
                <button
                  onClick={() => onFilterChange('all')}
                  className="ml-1 hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            )}
            
            {selectedType !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                Type: {documentTypes.find(t => t.id === selectedType)?.nom}
                <button
                  onClick={() => onTypeChange('all')}
                  className="ml-1 hover:text-green-900"
                >
                  ×
                </button>
              </span>
            )}
            
            <button
              onClick={() => {
                onFilterChange('all');
                onTypeChange('all');
              }}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Effacer tous les filtres
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsFilters;
