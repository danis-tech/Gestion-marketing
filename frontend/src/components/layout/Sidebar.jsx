import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import moovLogo from '../../assets/img/logo.png';
import ThemeToggle from '../ui/ThemeToggle';
import './Sidebar.css';

const Sidebar = ({ isCollapsed, onToggleCollapse, onLogout }) => {
  const location = useLocation();

  const menuItems = [
    {
      id: 'accueil',
      label: 'Accueil',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      path: '/dashboard'
    },
    {
      id: 'projets',
      label: 'Projets',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      path: '/dashboard/projets'
    },
    {
      id: 'etapes',
      label: 'Étapes',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      subItems: [
        {
          id: 'kanban',
          label: 'Kanban',
          path: '/dashboard/etapes/kanban'
        },
        {
          id: 'gantt',
          label: 'Gantt',
          path: '/dashboard/etapes/gantt'
        }
      ]
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
        </svg>
      ),
      path: '/dashboard/documents'
    },
    {
      id: 'lancement',
      label: 'Lancement',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      path: '/dashboard/lancement'
    },
    {
      id: 'archivage',
      label: 'Archivage/Bilan',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      subItems: [
        {
          id: 'archives',
          label: 'Archives',
          path: '/dashboard/archivage/archives'
        },
        {
          id: 'bilan',
          label: 'Bilan',
          path: '/dashboard/archivage/bilan'
        }
      ]
    },
    {
      id: 'administration',
      label: 'Administration',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      subItems: [
        {
          id: 'utilisateurs',
          label: 'Utilisateurs',
          path: '/dashboard/administration/utilisateurs'
        },
        {
          id: 'roles',
          label: 'Rôles & Accès',
          path: '/dashboard/administration/roles'
        },
        {
          id: 'parametres',
          label: 'Paramètres',
          path: '/dashboard/administration/parametres'
        }
      ]
    }
  ];

  const [expandedItems, setExpandedItems] = useState(new Set());

  const toggleSubMenu = (itemId) => {
    const newExpandedItems = new Set(expandedItems);
    if (newExpandedItems.has(itemId)) {
      newExpandedItems.delete(itemId);
    } else {
      newExpandedItems.add(itemId);
    }
    setExpandedItems(newExpandedItems);
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isSubItemActive = (subItems) => {
    return subItems?.some(subItem => isActive(subItem.path));
  };

  return (
    <div className="sidebar-container">
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Header avec logo */}
        <div className="sidebar-header">
          <div className="logo-section">
            <img src={moovLogo} alt="Moov Africa" className="logo" />
            {!isCollapsed && (
              <div className="logo-text">
                <span className="company-name">Moov Africa</span>
                <span className="company-subtitle">Gabon Telecom</span>
              </div>
            )}
          </div>
        </div>

      {/* Menu items */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <div key={item.id} className="menu-item-container" data-tooltip={isCollapsed ? item.label : ''}>
            {item.subItems ? (
              // Item avec sous-menu
              <div className="menu-item-with-sub">
                <button
                  className={`menu-item ${isSubItemActive(item.subItems) ? 'active' : ''}`}
                  onClick={() => toggleSubMenu(item.id)}
                >
                  <span className="menu-icon">{item.icon}</span>
                  {!isCollapsed && <span className="menu-label">{item.label}</span>}
                  {!isCollapsed && (
                    <svg 
                      className={`submenu-arrow ${expandedItems.has(item.id) ? 'expanded' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
                {(!isCollapsed && expandedItems.has(item.id)) && (
                  <div className="submenu">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.id}
                        to={subItem.path}
                        className={`submenu-item ${isActive(subItem.path) ? 'active' : ''}`}
                      >
                        <span className="submenu-icon">→</span>
                        <span className="submenu-label">{subItem.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Item simple
              <Link
                to={item.path}
                className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
              >
                <span className="menu-icon">{item.icon}</span>
                {!isCollapsed && <span className="menu-label">{item.label}</span>}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Sélecteur de thème */}
      {!isCollapsed && (
        <div className="sidebar-theme-section">
          <div className="theme-section-label">Thème</div>
          <ThemeToggle />
        </div>
      )}
      
      {/* Footer avec déconnexion */}
      <div className="sidebar-footer">
        <button className="logout-button" onClick={onLogout}>
          <span className="menu-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </span>
          {!isCollapsed && <span className="menu-label">Déconnexion</span>}
        </button>
      </div>
      </div>
      
      {/* Bouton toggle à l'extérieur */}
      <button className="sidebar-toggle" onClick={onToggleCollapse}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>
    </div>
  );
};

export default Sidebar;
