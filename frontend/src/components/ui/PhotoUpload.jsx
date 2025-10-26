import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image, Check, AlertCircle } from 'lucide-react';
import './PhotoUpload.css';

const PhotoUpload = ({ 
  value = '', 
  onChange, 
  maxSize = 500, // en KB
  accept = 'image/*',
  className = '',
  disabled = false 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(value);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Mettre à jour le preview quand la valeur change (pour la modification)
  useEffect(() => {
    setPreview(value);
  }, [value]);

  // Validation du fichier
  const validateFile = (file) => {
    if (!file) return false;
    
    // Vérifier le type
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner un fichier image valide');
      return false;
    }
    
    // Vérifier la taille (en KB)
    if (file.size > maxSize * 1024) {
      setError(`La taille du fichier ne doit pas dépasser ${maxSize}KB`);
      return false;
    }
    
    setError('');
    return true;
  };

  // Gestion du changement de fichier
  const handleFileChange = async (file) => {
    if (!validateFile(file)) return;
    
    setUploading(true);
    
    try {
      // Créer un FormData pour l'upload
      const formData = new FormData();
      formData.append('photo', file);
      
      // Upload vers le serveur
      const response = await fetch('http://localhost:8000/api/accounts/upload-photo/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload');
      }
      
      const result = await response.json();
      
      // Debug: afficher la réponse de l'API
      console.log('Réponse API upload:', result);
      console.log('URL de la photo:', result.photo_url);
      
      // Mettre à jour l'état
      setPreview(result.photo_url);
      if (onChange) {
        onChange(result.photo_url);
      }
      
    } catch (err) {
      setError('Erreur lors de l\'upload de la photo');
      console.error('Erreur upload:', err);
    } finally {
      setUploading(false);
    }
  };

  // Gestion du drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileChange(files[0]);
    }
  };

  // Gestion du clic sur l'input
  const handleInputChange = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileChange(files[0]);
    }
  };

  // Supprimer la photo
  const removePhoto = () => {
    setPreview('');
    if (onChange) {
      onChange('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Ouvrir le sélecteur de fichiers
  const openFileSelector = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`photo-upload ${className} ${disabled ? 'disabled' : ''}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />
      
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${preview ? 'has-preview' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileSelector}
      >
        {preview ? (
          <div className="photo-preview">
            <img 
              src={preview} 
              alt="Preview" 
              onError={(e) => {
                console.error('Erreur de chargement de l\'image:', preview);
                // Ne pas afficher d'erreur, juste masquer l'image
                e.target.style.display = 'none';
                // Afficher un placeholder à la place
                const placeholder = document.createElement('div');
                placeholder.className = 'image-placeholder';
                placeholder.innerHTML = '<div class="placeholder-content"><Image size={32} /><span>Photo uploadée</span></div>';
                e.target.parentNode.appendChild(placeholder);
              }}
              onLoad={() => {
                console.log('Image chargée avec succès:', preview);
                setError('');
              }}
            />
            <div className="photo-overlay">
              <button
                type="button"
                className="remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  removePhoto();
                }}
                disabled={disabled}
              >
                <X size={16} />
              </button>
              <button
                type="button"
                className="change-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  openFileSelector();
                }}
                disabled={disabled}
              >
                <Upload size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="upload-placeholder">
            {uploading ? (
              <div className="uploading">
                <div className="spinner"></div>
                <span>Upload en cours...</span>
              </div>
            ) : (
              <>
                <Image size={48} />
                <div className="upload-text">
                  <p>Glissez-déposez votre photo ici</p>
                  <p>ou cliquez pour sélectionner</p>
                </div>
                <div className="upload-info">
                  <p>Formats acceptés: JPG, PNG, GIF</p>
                  <p>Taille max: {maxSize}KB</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <div className="upload-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      
      {preview && !error && (
        <div className="upload-success">
          <Check size={16} />
          <span>Photo uploadée avec succès</span>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
