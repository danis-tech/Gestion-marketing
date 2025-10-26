import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { 
  Settings, 
  Users, 
  Building2, 
  Shield, 
  Key,
  BarChart3,
  Activity,
  Database,
  FileText,
  Bell
} from 'lucide-react';
import UserManagement from './UserManagement';
import RoleManagement from './RoleManagement';
import ServiceManagement from './ServiceManagement';
import PermissionManagement from './PermissionManagement';
import AnalyticsDashboard from '../analytics/AnalyticsDashboard';
import './Administration.css';

const Administration = () => {
  const [activeModule, setActiveModule] = useState('users');
  const [showAdminSidebar, setShowAdminSidebar] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Mettre à jour le module actif basé sur l'URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/administration/users')) {
      setActiveModule('users');
      setShowAdminSidebar(false); // Masquer le sidebar quand on est sur une page
    } else if (path.includes('/administration/services')) {
      setActiveModule('services');
      setShowAdminSidebar(false);
    } else if (path.includes('/administration/roles')) {
      setActiveModule('roles');
      setShowAdminSidebar(false);
    } else if (path.includes('/administration/permissions')) {
      setActiveModule('permissions');
      setShowAdminSidebar(false);
    } else if (path.includes('/administration/analytics')) {
      setActiveModule('analytics');
      setShowAdminSidebar(false);
    } else if (path.includes('/administration/logs')) {
      setActiveModule('logs');
      setShowAdminSidebar(false);
    } else if (path.includes('/administration/backup')) {
      setActiveModule('backup');
      setShowAdminSidebar(false);
    } else if (path.includes('/administration/reports')) {
      setActiveModule('reports');
      setShowAdminSidebar(false);
    } else if (path.includes('/administration/notifications-admin')) {
      setActiveModule('notifications-admin');
      setShowAdminSidebar(false);
    } else if (path === '/dashboard/administration') {
      setShowAdminSidebar(true); // Afficher le sidebar sur la page principale
    }
  }, [location]);

  // Composants placeholder pour les modules activés
  const ServiceManagementPlaceholder = () => (
    <div className="admin-module-placeholder">
      <div className="admin-placeholder-content">
        <Building2 size={64} />
        <h3>Gestion des Services</h3>
        <p>Administrer les services et départements</p>
        <div className="admin-placeholder-status">
          <span className="admin-status-badge coming-soon">Module en développement</span>
        </div>
      </div>
    </div>
  );

  const RoleManagementPlaceholder = () => (
    <div className="admin-module-placeholder">
      <div className="admin-placeholder-content">
        <Shield size={64} />
        <h3>Gestion des Rôles</h3>
        <p>Définir et gérer les rôles et permissions</p>
        <div className="admin-placeholder-status">
          <span className="admin-status-badge coming-soon">Module en développement</span>
        </div>
      </div>
    </div>
  );


  const modules = [
    {
      id: 'users',
      title: 'Gestion des Utilisateurs',
      description: 'Créer, modifier et gérer les utilisateurs du système',
      icon: Users,
      component: UserManagement,
      color: 'blue'
    },
    {
      id: 'services',
      title: 'Gestion des Services',
      description: 'Administrer les services et départements',
      icon: Building2,
      component: ServiceManagement,
      color: 'green'
    },
    {
      id: 'roles',
      title: 'Gestion des Rôles',
      description: 'Définir et gérer les rôles et permissions',
      icon: Shield,
      component: RoleManagement,
      color: 'purple'
    },
    {
      id: 'permissions',
      title: 'Gestion des Permissions',
      description: 'Configurer les permissions système',
      icon: Key,
      component: PermissionManagement,
      color: 'orange'
    },
    {
      id: 'analytics',
      title: 'Analytiques',
      description: 'Statistiques et rapports du système',
      icon: BarChart3,
      component: AnalyticsDashboard,
      color: 'indigo'
    },
    {
      id: 'logs',
      title: 'Journaux d\'Activité',
      description: 'Consulter les logs et activités',
      icon: Activity,
      component: null, // À implémenter
      color: 'red'
    },
    {
      id: 'backup',
      title: 'Sauvegarde',
      description: 'Gérer les sauvegardes et restaurations',
      icon: Database,
      component: null, // À implémenter
      color: 'teal'
    },
    {
      id: 'reports',
      title: 'Rapports',
      description: 'Générer et consulter les rapports',
      icon: FileText,
      component: null, // À implémenter
      color: 'pink'
    },
    {
      id: 'notifications-admin',
      title: 'Notifications Admin',
      description: 'Gérer les notifications système',
      icon: Bell,
      component: null, // À implémenter
      color: 'yellow'
    }
  ];

  const activeModuleData = modules.find(module => module.id === activeModule);
  const ActiveComponent = activeModuleData?.component;

  const handleModuleClick = (moduleId) => {
    setActiveModule(moduleId);
    setShowAdminSidebar(false); // Masquer le sidebar quand on clique sur un module
    navigate(`/dashboard/administration/${moduleId}`); // Naviguer vers la page
  };

  return (
    <div className="admin-administration">
      {/* Sidebar d'administration - affiché conditionnellement */}
      {showAdminSidebar && (
        <div className="admin-sidebar">
          <div className="admin-sidebar-header">
            <Settings size={24} />
            <h2>Administration</h2>
          </div>
          
          <nav className="admin-sidebar-nav">
            {modules.map(module => {
              const Icon = module.icon;
              const isActive = activeModule === module.id;
              const isImplemented = module.component !== null;
              
              return (
                <button
                  key={module.id}
                  className={`admin-nav-item ${isActive ? 'active' : ''} ${!isImplemented ? 'disabled' : ''}`}
                  onClick={() => isImplemented && handleModuleClick(module.id)}
                  disabled={!isImplemented}
                  title={!isImplemented ? 'Module à venir' : module.description}
                >
                  <div className={`admin-nav-icon ${module.color}`}>
                    <Icon size={20} />
                  </div>
                  <div className="admin-nav-content">
                    <span className="admin-nav-title">{module.title}</span>
                    <span className="admin-nav-description">{module.description}</span>
                  </div>
                  {!isImplemented && (
                    <div className="admin-coming-soon">
                      <span>Bientôt</span>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Contenu principal */}
      <div className={`admin-content ${!showAdminSidebar ? 'full-width' : ''}`}>
        <Routes>
          <Route path="/" element={
            <div className="admin-home">
              <div className="admin-home-content">
                <Settings size={64} />
                <h2>Administration</h2>
                <p>Sélectionnez un module d'administration dans la sidebar</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowAdminSidebar(true)}
                >
                  <Settings size={20} />
                  Afficher les modules
                </button>
              </div>
            </div>
          } />
           <Route path="/users" element={<UserManagement />} />
           <Route path="/services" element={<ServiceManagement />} />
           <Route path="/roles" element={<RoleManagement />} />
           <Route path="/permissions" element={<PermissionManagement />} />
           <Route path="/analytics" element={<AnalyticsDashboard />} />
           <Route path="/logs" element={
             <div className="admin-module-placeholder">
               <div className="admin-placeholder-content">
                 <Activity size={64} />
                 <h3>Journaux d'Activité</h3>
                 <p>Consulter les logs et activités</p>
                 <div className="admin-placeholder-status">
                   <span className="admin-status-badge coming-soon">Module en développement</span>
                 </div>
               </div>
             </div>
           } />
           <Route path="/backup" element={
             <div className="admin-module-placeholder">
               <div className="admin-placeholder-content">
                 <Database size={64} />
                 <h3>Sauvegarde</h3>
                 <p>Gérer les sauvegardes et restaurations</p>
                 <div className="admin-placeholder-status">
                   <span className="admin-status-badge coming-soon">Module en développement</span>
                 </div>
               </div>
             </div>
           } />
           <Route path="/reports" element={
             <div className="admin-module-placeholder">
               <div className="admin-placeholder-content">
                 <FileText size={64} />
                 <h3>Rapports</h3>
                 <p>Générer et consulter les rapports</p>
                 <div className="admin-placeholder-status">
                   <span className="admin-status-badge coming-soon">Module en développement</span>
                 </div>
               </div>
             </div>
           } />
           <Route path="/notifications-admin" element={
             <div className="admin-module-placeholder">
               <div className="admin-placeholder-content">
                 <Bell size={64} />
                 <h3>Notifications Admin</h3>
                 <p>Gérer les notifications système</p>
                 <div className="admin-placeholder-status">
                   <span className="admin-status-badge coming-soon">Module en développement</span>
                 </div>
               </div>
             </div>
           } />
        </Routes>
      </div>
    </div>
  );
};

export default Administration;
