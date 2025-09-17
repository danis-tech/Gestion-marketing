import React from 'react';
import { 
  Edit, 
  Trash2, 
  Eye, 
  FileText, 
  Calendar, 
  User, 
  Clock,
  CheckCircle,
  AlertCircle,
  Archive
} from 'lucide-react';

const DocumentCard = ({ 
  document, 
  viewMode = 'grid',
  onEdit,
  onDelete,
  onView,
  getDocumentIcon,
  getDocumentColor
}) => {
  // Fonction pour tronquer intelligemment les noms de fichiers
  const truncateFileName = (fileName, maxLength = 30) => {
    if (!fileName) return '';
    
    if (fileName.length <= maxLength) {
      return fileName;
    }
    
    // Garder l'extension
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return fileName.substring(0, maxLength - 3) + '...';
    }
    
    const nameWithoutExt = fileName.substring(0, lastDotIndex);
    const extension = fileName.substring(lastDotIndex);
    
    if (nameWithoutExt.length <= maxLength - extension.length - 3) {
      return fileName;
    }
    
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 3);
    return truncatedName + '...' + extension;
  };
  const getStatusIcon = (statut) => {
    switch (statut) {
      case 'finalise':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'brouillon':
        return <Edit className="w-4 h-4 text-yellow-600" />;
      case 'archived':
        return <Archive className="w-4 h-4 text-gray-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'finalise':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'brouillon':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'archived':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {/* Icône du document */}
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
              style={{ backgroundColor: getDocumentColor(document.type_document) }}
            >
              {getDocumentIcon(document.type_document)}
            </div>

            {/* Informations principales */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate" title={document.nom_fichier}>
                  {truncateFileName(document.nom_fichier, 40)}
                </h3>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(document.statut)}`}>
                  {getStatusIcon(document.statut)}
                  {document.statut}
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  v{document.version}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {document.type_document}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {document.date_creation}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {document.cree_par}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatFileSize(document.taille_fichier)}
                </span>
              </div>

              {/* Phase et étape si disponibles */}
              {(document.phase || document.etape) && (
                <div className="mt-2 flex gap-2 text-xs">
                  {document.phase && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      Phase: {document.phase}
                    </span>
                  )}
                  {document.etape && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                      Étape: {document.etape}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onView(document)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Voir les détails"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(document)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Modifier"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(document)}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vue grille
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header de la carte */}
      <div className="flex items-start justify-between mb-3">
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
          style={{ backgroundColor: getDocumentColor(document.type_document) }}
        >
          {getDocumentIcon(document.type_document)}
        </div>
        <div className="flex items-center gap-1">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(document.statut)}`}>
            {getStatusIcon(document.statut)}
            {document.statut}
          </span>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2" title={document.nom_fichier}>
          {truncateFileName(document.nom_fichier, 60)}
        </h3>
        
        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <FileText className="w-3 h-3" />
            <span className="truncate">{document.type_document}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            <span>{document.date_creation}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <User className="w-3 h-3" />
            <span className="truncate">{document.cree_par}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>{formatFileSize(document.taille_fichier)}</span>
          </div>
        </div>

        {/* Phase et étape */}
        {(document.phase || document.etape) && (
          <div className="mt-3 flex flex-wrap gap-1">
            {document.phase && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                {document.phase}
              </span>
            )}
            {document.etape && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                {document.etape}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">v{document.version}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onView(document)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Voir les détails"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(document)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Modifier"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(document)}
            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;
