import React from 'react';
import { Search, Users } from 'lucide-react';

const ProjectSidebar = ({ 
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
          <h3 className="text-2xl font-semibold text-gray-900">Projets</h3>
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
        </div>
        
        {/* Recherche */}
        <div className="relative mb-4">
          {/* <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" /> */}
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full pl-12 pr-4 py-3 text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Liste des projets */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {projects.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              <p className="text-sm">Aucun projet trouvé</p>
            </div>
          ) : (
            projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onProjectSelect(project)}
              className={`group p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                selectedProject?.id === project.id
                  ? 'bg-indigo-50 border border-indigo-200 shadow-sm'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-medium text-gray-900 truncate">{project.nom}</h4>
                  <p className="text-sm text-gray-500 truncate">{project.code}</p>
                </div>
                <div className={`text-sm px-3 py-1 rounded-full font-medium ${
                  selectedProject?.id === project.id 
                    ? 'bg-indigo-100 text-indigo-700' 
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

export default ProjectSidebar;
