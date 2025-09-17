import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import Sidebar from './Sidebar';
import { DashboardHome, AddProject, AddTask, TeamManagement, PhasesManagement, PhasesEtapesManagementNew, DocumentsManagement } from '../pages';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleLogout = () => {
    onLogout();
  };

  const formatDate = (date) => {
    const options = { 
      weekday: 'short', 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  return (
    <div className="dashboard">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={toggleSidebar}
        onLogout={handleLogout}
      />
      
      <div className={`dashboard-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Top Bar */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 h-6 flex items-center justify-center shadow-lg">
          <div className="flex items-center space-x-2 text-white"></div>
        </div>

        {/* Main Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm w-full">
          <div className="px-10 py-8">
            <div className="flex justify-between items-center w-full">
              
              {/* --- Titre décalé --- */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 pl-50 ml-20">
               
              </h1>

              {/* --- Section droite --- */}
              <div className="flex items-center gap-8 pr-6">

                
                {/* Bienvenue utilisateur */}
                <div className="text-sm md:text-base text-gray-600">
                  <span className="font-medium">Bienvenue : </span>
                  <span className="font-semibold text-gray-900">
                    {user?.prenom || user?.username || 'Utilisateur'}
                  </span>
                </div>

                {/* Date & heure */}
                <div className="hidden sm:flex items-center text-sm text-gray-600 bg-gray-50 px-8 py-5 rounded-none shadow-sm">
                  <span className="font-medium">{formatDate(currentTime)}</span>
                </div>

                {/* Notifications + Avatar */}
                <div className="flex items-center gap-5">
                  {/* Notifications */}
                  <div className="relative">
                    <button className="p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <Bell className="w-8 h-8 text-gray-600" />
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                        3
                      </span>
                    </button>
                  </div>
                  {/* Avatar utilisateur */}
                  <div className="w-12 h-12 mr-12 bg-blue-500 rounded-none flex items-center justify-center text-white font-semibold text-lg">
                    {(user?.prenom?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Bloc transparent pour espacer */}
        <div className="w-full h-6 bg-transparent"></div>

        <Routes>
          <Route path="/" element={<DashboardHome user={user} />} />
          <Route path="/projets/equipe" element={<TeamManagement />} />
          <Route path="/projets/ajouter" element={<AddProject />} />
          <Route path="/projets/taches/ajouter" element={<AddTask />} />
          <Route path="/etapes/kanban" element={<div>Page Kanban</div>} />
          <Route path="/etapes/gantt" element={<div>Page Ganttt</div>} />
          <Route path="/etapes/validations" element={<PhasesEtapesManagementNew />} />
          <Route path="/documents" element={<DocumentsManagement />} />
          <Route path="/lancement" element={<div>Page Lancement</div>} />
          <Route path="/archivage/archives" element={<div>Page Archives</div>} />
          <Route path="/archivage/bilan" element={<div>Page Bilan</div>} />
          <Route path="/administration/utilisateurs" element={<div>Page Utilisateurs</div>} />
          <Route path="/administration/roles" element={<div>Page Rôles & Accès</div>} />
          <Route path="/administration/parametres" element={<div>Page Paramètres</div>} />
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;
