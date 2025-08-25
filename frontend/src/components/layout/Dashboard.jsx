import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import DashboardHome from '../pages/DashboardHome';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleLogout = () => {
    onLogout();
  };

  return (
    <div className="dashboard">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={toggleSidebar}
        onLogout={handleLogout}
      />
      
      <div className={`dashboard-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardHome user={user} />} />
          <Route path="/dashboard/projets" element={<div>Page Projets</div>} />
          <Route path="/dashboard/etapes/kanban" element={<div>Page Kanban</div>} />
          <Route path="/dashboard/etapes/gantt" element={<div>Page Gantt</div>} />
          <Route path="/dashboard/documents" element={<div>Page Documents</div>} />
          <Route path="/dashboard/lancement" element={<div>Page Lancement</div>} />
          <Route path="/dashboard/archivage/archives" element={<div>Page Archives</div>} />
          <Route path="/dashboard/archivage/bilan" element={<div>Page Bilan</div>} />
          <Route path="/dashboard/administration/utilisateurs" element={<div>Page Utilisateurs</div>} />
          <Route path="/dashboard/administration/roles" element={<div>Page Rôles & Accès</div>} />
          <Route path="/dashboard/administration/parametres" element={<div>Page Paramètres</div>} />
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;
