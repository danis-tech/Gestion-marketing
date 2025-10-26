// PermissionSelector.jsx - Composant de sélection de permissions prédéfinies

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Search, Check, X } from 'lucide-react';
import { PERMISSION_CATEGORIES, ALL_PERMISSIONS, getPermissionByCode } from '../../constants/permissions';
import './PermissionSelector.css';

const PermissionSelector = ({
  selectedPermissions = [],
  onPermissionsChange,
  multiple = true,
  placeholder = "Sélectionner des permissions...",
  disabled = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});

  // Filtrer les permissions selon le terme de recherche
  const filteredPermissions = searchTerm
    ? ALL_PERMISSIONS.filter(permission =>
        permission.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : ALL_PERMISSIONS;

  // Grouper les permissions filtrées par catégorie
  const filteredCategories = Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => {
    const categoryPermissions = category.permissions.filter(permission =>
      filteredPermissions.some(fp => fp.code === permission.code)
    );
    
    return {
      key,
      ...category,
      permissions: categoryPermissions
    };
  }).filter(category => category.permissions.length > 0);

  // Gérer la sélection d'une permission
  const handlePermissionToggle = (permissionCode) => {
    if (disabled) return;

    let newSelectedPermissions;
    
    if (multiple) {
      if (selectedPermissions.includes(permissionCode)) {
        newSelectedPermissions = selectedPermissions.filter(code => code !== permissionCode);
      } else {
        newSelectedPermissions = [...selectedPermissions, permissionCode];
      }
    } else {
      newSelectedPermissions = selectedPermissions.includes(permissionCode) ? [] : [permissionCode];
      setIsOpen(false);
    }

    onPermissionsChange(newSelectedPermissions);
  };

  // Gérer la sélection/désélection d'une catégorie entière
  const handleCategoryToggle = (categoryKey) => {
    if (disabled) return;

    const category = PERMISSION_CATEGORIES[categoryKey];
    const categoryPermissionCodes = category.permissions.map(p => p.code);
    
    const allSelected = categoryPermissionCodes.every(code => 
      selectedPermissions.includes(code)
    );

    let newSelectedPermissions;
    if (allSelected) {
      // Désélectionner toute la catégorie
      newSelectedPermissions = selectedPermissions.filter(code => 
        !categoryPermissionCodes.includes(code)
      );
    } else {
      // Sélectionner toute la catégorie
      newSelectedPermissions = [
        ...selectedPermissions.filter(code => 
          !categoryPermissionCodes.includes(code)
        ),
        ...categoryPermissionCodes
      ];
    }

    onPermissionsChange(newSelectedPermissions);
  };

  // Basculer l'expansion d'une catégorie
  const toggleCategoryExpansion = (categoryKey) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  // Vérifier si une catégorie est entièrement sélectionnée
  const isCategoryFullySelected = (categoryKey) => {
    const category = PERMISSION_CATEGORIES[categoryKey];
    const categoryPermissionCodes = category.permissions.map(p => p.code);
    return categoryPermissionCodes.every(code => selectedPermissions.includes(code));
  };

  // Vérifier si une catégorie est partiellement sélectionnée
  const isCategoryPartiallySelected = (categoryKey) => {
    const category = PERMISSION_CATEGORIES[categoryKey];
    const categoryPermissionCodes = category.permissions.map(p => p.code);
    const selectedInCategory = categoryPermissionCodes.filter(code => 
      selectedPermissions.includes(code)
    );
    return selectedInCategory.length > 0 && selectedInCategory.length < categoryPermissionCodes.length;
  };

  // Obtenir le texte d'affichage
  const getDisplayText = () => {
    if (selectedPermissions.length === 0) {
      return placeholder;
    }
    
    if (selectedPermissions.length === 1) {
      const permission = getPermissionByCode(selectedPermissions[0]);
      return permission ? permission.description : selectedPermissions[0];
    }
    
    return `${selectedPermissions.length} permission(s) sélectionnée(s)`;
  };

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.permission-selector')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`permission-selector ${className}`}>
      <div
        className={`permission-selector-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="permission-selector-text">
          {getDisplayText()}
        </span>
        <ChevronDown className={`permission-selector-arrow ${isOpen ? 'rotated' : ''}`} size={16} />
      </div>

      {isOpen && (
        <div className="permission-selector-dropdown">
          {/* Barre de recherche */}
          <div className="permission-selector-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Rechercher une permission..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="permission-selector-search-input"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="permission-selector-search-clear"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Liste des catégories et permissions */}
          <div className="permission-selector-list">
            {filteredCategories.map(category => (
              <div key={category.key} className="permission-category">
                {/* En-tête de catégorie */}
                <div
                  className="permission-category-header"
                  onClick={() => toggleCategoryExpansion(category.key)}
                >
                  <div className="permission-category-toggle">
                    {expandedCategories[category.key] ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </div>
                  
                  <div className="permission-category-checkbox">
                    <input
                      type="checkbox"
                      checked={isCategoryFullySelected(category.key)}
                      ref={input => {
                        if (input) {
                          input.indeterminate = isCategoryPartiallySelected(category.key);
                        }
                      }}
                      onChange={() => handleCategoryToggle(category.key)}
                      disabled={disabled}
                    />
                  </div>
                  
                  <span className="permission-category-icon">{category.icon}</span>
                  <span className="permission-category-name">{category.name}</span>
                  <span className="permission-category-count">
                    ({category.permissions.length})
                  </span>
                </div>

                {/* Permissions de la catégorie */}
                {expandedCategories[category.key] && (
                  <div className="permission-category-items">
                    {category.permissions.map(permission => (
                      <div
                        key={permission.code}
                        className={`permission-item ${selectedPermissions.includes(permission.code) ? 'selected' : ''}`}
                        onClick={() => handlePermissionToggle(permission.code)}
                      >
                        <div className="permission-checkbox">
                          <input
                            type={multiple ? 'checkbox' : 'radio'}
                            checked={selectedPermissions.includes(permission.code)}
                            onChange={() => handlePermissionToggle(permission.code)}
                            disabled={disabled}
                          />
                        </div>
                        
                        <div className="permission-content">
                          <div className="permission-code">{permission.code}</div>
                          <div className="permission-description">{permission.description}</div>
                        </div>
                        
                        {selectedPermissions.includes(permission.code) && (
                          <Check size={16} className="permission-check-icon" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {filteredCategories.length === 0 && (
              <div className="permission-selector-empty">
                Aucune permission trouvée pour "{searchTerm}"
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="permission-selector-actions">
            <button
              type="button"
              onClick={() => onPermissionsChange([])}
              className="permission-selector-clear"
              disabled={disabled || selectedPermissions.length === 0}
            >
              Effacer tout
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="permission-selector-close"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionSelector;
