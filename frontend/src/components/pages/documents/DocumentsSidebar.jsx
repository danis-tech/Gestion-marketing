import React from 'react';
import {  FileText, FolderOpen } from 'lucide-react';

const DocumentsSidebar = ({ 
  projects, 
  selectedProject, 
  onProjectSelect, 
  searchTerm, 
  onSearchChange 
}) => {
  return (
    <div className="lg:w-72 lg:flex-shrink-0">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-3xl font-semibold text-gray-900">Projets</h3>
          <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        {/* Recherche */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Rechercher un projet..."
            className="w-full pl-12 pr-4 py-4 text-lg border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        
        </div>

        {/* Statistiques rapides */}
        {selectedProject && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <FolderOpen className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Projet sélectionné</span>
            </div>
            <h4 className="font-semibold text-blue-900">{selectedProject.nom}</h4>
            <p className="text-sm text-blue-700">{selectedProject.code}</p>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                {selectedProject.phases_count} phases
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                {selectedProject.documents_count} documents
              </span>
            </div>
          </div>
        )}

        {/* Liste des projets */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {projects.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Aucun projet trouvé</p>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                onClick={() => onProjectSelect(project)}
                className={`group p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedProject?.id === project.id
                    ? 'bg-blue-50 border border-blue-200 shadow-sm'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-medium text-gray-900 truncate">{project.nom}</h4>
                    <p className="text-sm text-gray-500 truncate">{project.code}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs text-gray-400">
                        {project.phases_count} phases
                      </span>
                      <span className="text-xs text-gray-400">
                        {project.documents_count} docs
                      </span>
                    </div>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                    selectedProject?.id === project.id 
                      ? 'bg-blue-100 text-blue-700' 
                      : project.statut === 'termine' 
                        ? 'bg-green-100 text-green-700'
                        : project.statut === 'en_attente'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                  }`}>
                    {project.statut}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentsSidebar;
