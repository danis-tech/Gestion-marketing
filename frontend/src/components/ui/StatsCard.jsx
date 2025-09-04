import React from 'react';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';

/**
 * Composant StatsCard - Carte de statistiques réutilisable avec sections organisées
 * 
 * @param {Object} props - Les propriétés du composant
 * @param {string} props.title - Le titre de la carte
 * @param {string|number} props.value - La valeur principale à afficher
 * @param {string} props.change - Le changement (ex: "+12", "-2", "Nouveau")
 * @param {'positive'|'negative'|'warning'} props.changeType - Le type de changement
 * @param {React.Component} props.icon - L'icône Lucide React à afficher
 * @param {string} props.color - La couleur principale (gradient CSS)
 * @param {string} props.bgColor - La couleur de fond (rgba)
 * @param {Array<number>} [props.graphData] - Les données pour le graphique de tendance
 * @param {boolean} [props.showGraph=true] - Afficher ou non le graphique
 * @param {string} [props.className] - Classes CSS supplémentaires
 * @param {Function} [props.onClick] - Fonction appelée lors du clic
 * @param {string} [props.subtitle] - Sous-titre optionnel
 * @param {string} [props.period] - Période optionnelle (ex: "Ce mois", "Cette semaine")
 * 
 * @example
 * ```jsx
 * <StatsCard
 *   title="Projets Actifs"
 *   value="12"
 *   change="+3"
 *   changeType="positive"
 *   icon={BarChart3}
 *   color="linear-gradient(135deg, #10b981 0%, #059669 100%)"
 *   bgColor="rgba(16, 185, 129, 0.1)"
 *   graphData={[30, 40, 35, 50, 49, 60, 70, 91, 125]}
 *   subtitle="Projets en cours"
 *   period="Ce mois"
 *   onClick={() => console.log('Carte cliquée')}
 * />
 * ```
 */
const StatsCard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: IconComponent, 
  color, 
  bgColor, 
  graphData, 
  showGraph = true,
  className = "",
  onClick,
  subtitle = "Ce mois",
  period = "Ce mois"
}) => {
  const getChangeTypeStyles = () => {
    switch (changeType) {
      case 'positive':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive':
        return <TrendingUp className="w-5 h-5" />;
      case 'negative':
        return <TrendingDown className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div 
      className={`relative shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer transform hover:-translate-y-2 border border-gray-200 overflow-hidden ${className}`}
      style={{ background: bgColor }}
      onClick={onClick}
    >
      {/* Overlay de gradient subtil */}
      <div 
        className="absolute inset-0 opacity-5 transition-opacity duration-300 pointer-events-none"
        style={{ background: color }}
        
      ></div>
      
      <div className="relative z-10">
        {/* Section 1: Header avec icône et titre */}
        <div className="p-7 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div 
                className="p-3 shadow-md group-hover:shadow-lg transition-all duration-300"
                style={{ 
                  background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`
                }}
              >
              <IconComponent className="w-8 h-8 text-blue-500 mr-12" />

              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
                  {title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
              </div>
            </div>
            
            {/* Indicateur de changement */}
            <div className={`px-3 py-1.5 text-sm font-medium border transition-all duration-300 ${getChangeTypeStyles()}`}>
              <div className="flex items-center space-x-1.5">
                {getChangeIcon()}
                <span>{change}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Valeur principale */}
        <div className="px-7 pb-4">
          <div className="text-4xl font-bold text-gray-900 group-hover:scale-105 transition-transform duration-300">
            {value}
          </div>
        </div>

        {/* Section 3: Informations contextuelles et graphique */}
        <div className="px-7 pb-7">
          <div className="flex items-center justify-between">
            {/* Période avec icône */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 font-medium">{period}</span>
            </div>

            {/* Graphique de tendance */}
            {showGraph && graphData && (
              <div className="flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                <svg width="60" height="30" viewBox="0 0 60 30" className="w-14 h-7">
                  <defs>
                    <linearGradient id={`gradient-${title.replace(/\s+/g, '-')}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={`${color}70`} />
                      <stop offset="100%" stopColor={`${color}95`} />
                    </linearGradient>
                  </defs>
                  <polyline
                    fill="none"
                    stroke={`url(#gradient-${title.replace(/\s+/g, '-')})`}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={graphData.map((value, index) => 
                      `${index * 6.67},${30 - (value / 125) * 30}`
                    ).join(' ')}
                  />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;