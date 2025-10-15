import React from 'react';
import { FileText, Download, Plus, Filter, Upload } from 'lucide-react';

const DocumentsHeader = ({ 
  selectedProject, 
  documentsCount, 
  onGenerateDocument,
  onUploadDocument,
  onFilterChange,
  onSearchChange,
  searchTerm,
  filterStatus
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Titre et informations */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Documents
            </h1>
            {selectedProject ? (
              <p className="text-lg text-gray-600">
                Projet: <span className="font-semibold text-blue-600">{selectedProject.nom}</span>
                <span className="text-gray-400 mx-2">•</span>
                {documentsCount} document{documentsCount !== 1 ? 's' : ''}
              </p>
            ) : (
              <p className="text-lg text-gray-500">Sélectionnez un projet pour commencer</p>
            )}
          </div>
        </div>

        {/* Actions et contrôles */}
        <div className="flex flex-col sm:flex-row gap-3">
            {/* Recherche */}
            <div className="relative">
             
              <input
                type="text"
                placeholder="Rechercher un document..."
                className="pl-10 pr-4 py-3 text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white w-64"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>

          {/* Filtres */}
          <select
            value={filterStatus}
            onChange={(e) => onFilterChange(e.target.value)}
            className="px-3 py-3 text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="all">Tous les documents</option>
            <option value="brouillon">Brouillons</option>
            <option value="finalise">Finalisés</option>
            <option value="archived">Archivés</option>
          </select>

          {/* Boutons d'action */}
          <div className="flex gap-2">
            <button
              onClick={onUploadDocument}
              disabled={!selectedProject}
              className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <Upload className="w-4 h-4" />
              Téléverser
            </button>
            <button
              onClick={onGenerateDocument}
              disabled={!selectedProject}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-lg"
            >
              <Plus className="w-5 h-5" />
              Générer Document
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      {selectedProject && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-base text-blue-600 font-medium">Total Documents</p>
                <p className="text-2xl font-bold text-blue-900">{documentsCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Download className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-base text-green-600 font-medium">Finalisés</p>
                <p className="text-2xl font-bold text-green-900">
                  {selectedProject.documents_finalises || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-base text-yellow-600 font-medium">Brouillons</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {selectedProject.documents_brouillons || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsHeader;
