import React from 'react';
import { Users, Wifi, WifiOff } from 'lucide-react';

/**
 * Composant spécialisé pour afficher les utilisateurs en ligne
 * 
 * @param {Object} props - Les propriétés du composant
 * @param {Object} props.statsData - Données des statistiques utilisateurs
 * @param {boolean} props.loading - État de chargement
 * @param {Function} props.onClick - Fonction appelée lors du clic
 */
const OnlineUsersCard = ({ statsData, loading, onClick }) => {
  const onlineUsers = statsData?.online_users || 0;
  const totalUsers = statsData?.total_users || 0;
  const isOnline = onlineUsers > 0;
  
  const getStatusColor = () => {
    if (onlineUsers === 0) return 'text-gray-500';
    if (onlineUsers >= totalUsers * 0.8) return 'text-green-500';
    if (onlineUsers >= totalUsers * 0.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusText = () => {
    if (onlineUsers === 0) return 'Aucun utilisateur en ligne';
    if (onlineUsers === 1) return '1 utilisateur en ligne';
    return `${onlineUsers} utilisateurs en ligne`;
  };

  const getStatusIcon = () => {
    if (onlineUsers === 0) {
      return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
    return <Wifi className="w-4 h-4 text-green-500" />;
  };

  return (
    <div 
      className="relative shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer transform hover:-translate-y-2 border border-gray-200 overflow-hidden bg-white"
      onClick={onClick}
    >
      {/* Indicateur de statut en ligne */}
      <div className="absolute top-4 right-4 z-20">
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
          isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
        }`}>
          {getStatusIcon()}
          <span>{isOnline ? 'En ligne' : 'Hors ligne'}</span>
        </div>
      </div>

      <div className="relative z-10">
        {/* Section 1: Header avec icône et titre */}
        <div className="p-7 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 shadow-md group-hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-purple-500 to-indigo-600">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
                  Utilisateurs Actifs
                </h3>
                <p className="text-sm text-gray-600 mt-1">Utilisateurs connectés</p>
              </div>
            </div>
            
            {/* Indicateur de statut */}
            <div className={`px-3 py-1.5 text-sm font-medium border transition-all duration-300 ${
              isOnline ? 'bg-green-100 text-green-800 border-green-300' : 'bg-gray-100 text-gray-800 border-gray-300'
            }`}>
              <div className="flex items-center space-x-1.5">
                {getStatusIcon()}
                <span>{loading ? '...' : onlineUsers}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Valeur principale */}
        <div className="px-7 pb-4">
          <div className="text-4xl font-bold text-gray-900 group-hover:scale-105 transition-transform duration-300">
            {loading ? '...' : onlineUsers}
          </div>
          <p className="text-sm text-gray-600 mt-2">{getStatusText()}</p>
        </div>

        {/* Section 3: Informations contextuelles */}
        <div className="px-7 pb-7">
          <div className="flex items-center justify-between">
            {/* Statistiques détaillées */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-sm font-semibold text-gray-700">{totalUsers}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Cette semaine</p>
                <p className="text-sm font-semibold text-blue-600">{statsData?.active_this_week || 0}</p>
              </div>
            </div>

            {/* Indicateur de pourcentage */}
            <div className="text-right">
              <p className="text-xs text-gray-500">Taux d'activité</p>
              <p className={`text-sm font-semibold ${getStatusColor()}`}>
                {totalUsers > 0 ? Math.round((onlineUsers / totalUsers) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay de gradient subtil */}
      <div 
        className="absolute inset-0 opacity-5 transition-opacity duration-300 pointer-events-none"
        style={{ 
          background: isOnline 
            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
        }}
      ></div>
    </div>
  );
};

export default OnlineUsersCard;
