import React from 'react';
import { 
  Download, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Archive,
  FileText,
  Image,
  FileSpreadsheet,
  Presentation,
  Archive as ArchiveIcon
} from 'lucide-react';

const UploadedDocumentCard = ({ 
  document, 
  onDownload, 
  onDelete, 
  onValidate,
  canValidate = false,
  canDelete = false 
}) => {
  const getFileIcon = (typeFichier, estImage, estDocumentOffice, estArchive) => {
    if (estImage) {
      return <Image className="w-6 h-6 text-green-600" />;
    } else if (estDocumentOffice) {
      if (typeFichier === 'xlsx' || typeFichier === 'xls') {
        return <FileSpreadsheet className="w-6 h-6 text-green-600" />;
      } else if (typeFichier === 'pptx' || typeFichier === 'ppt') {
        return <Presentation className="w-6 h-6 text-orange-600" />;
      } else {
        return <FileText className="w-6 h-6 text-blue-600" />;
      }
    } else if (estArchive) {
      return <ArchiveIcon className="w-6 h-6 text-purple-600" />;
    } else {
      return <FileText className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusIcon = (statut) => {
    switch (statut) {
      case 'valide':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejete':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'archive':
        return <Archive className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'valide':
        return 'bg-green-100 text-green-800';
      case 'rejete':
        return 'bg-red-100 text-red-800';
      case 'archive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (statut) => {
    switch (statut) {
      case 'valide':
        return 'Validé';
      case 'rejete':
        return 'Rejeté';
      case 'archive':
        return 'Archivé';
      default:
        return 'En attente';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow max-w-full">
      {/* Header compact */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
            {getFileIcon(
              document.type_fichier,
              document.est_image,
              document.est_document_office,
              document.est_archive
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-gray-900 truncate" title={document.titre}>
              {document.titre}
            </h3>
            <p className="text-sm text-gray-500 truncate" title={document.nom_fichier_original}>
              {document.nom_fichier_original}
            </p>
          </div>
        </div>
        
        <div className="flex-shrink-0 ml-2">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.statut)}`}>
            {getStatusIcon(document.statut)}
            {getStatusText(document.statut)}
          </span>
        </div>
      </div>

      {/* Description compacte */}
      {document.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {document.description}
        </p>
      )}

      {/* Métadonnées en grille compacte */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Taille:</span>
          <span className="text-gray-900 font-medium">{formatFileSize(document.taille_fichier)}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Version:</span>
          <span className="text-gray-900 font-medium">v{document.version}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Téléversé le:</span>
          <span className="text-gray-900 font-medium">{formatDate(document.date_televersement)}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Par:</span>
          <span className="text-gray-900 font-medium truncate" title={`${document.televerse_par?.first_name} ${document.televerse_par?.last_name}`}>
            {document.televerse_par?.first_name} {document.televerse_par?.last_name}
          </span>
        </div>
      </div>

      {/* Mots-clés compacts */}
      {document.mots_cles && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {document.mots_cles.split(',').slice(0, 3).map((mot, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
              >
                {mot.trim()}
              </span>
            ))}
            {document.mots_cles.split(',').length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                +{document.mots_cles.split(',').length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Commentaire de validation compact */}
      {document.commentaire_validation && (
        <div className="mb-3 p-2 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700 line-clamp-2">
            <strong>Commentaire:</strong> {document.commentaire_validation}
          </p>
        </div>
      )}

      {/* Actions compactes */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDownload(document.id, document.nom_fichier_original, document.type_fichier)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Télécharger"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {canValidate && document.statut === 'en_attente' && (
            <>
              <button
                onClick={() => onValidate(document.id, 'valide')}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Valider"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => onValidate(document.id, 'rejete')}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Rejeter"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          
          {canDelete && (
            <button
              onClick={() => onDelete(document.id)}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadedDocumentCard;
