import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MetricsCard = ({ 
  title, 
  value, 
  unit, 
  icon, 
  trend, 
  color = 'blue',
  subtitle,
  loading = false 
}) => {
  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUp size={16} className="text-green-500" />;
    if (trend < 0) return <TrendingDown size={16} className="text-red-500" />;
    return <Minus size={16} className="text-gray-500" />;
  };

  const getTrendColor = () => {
    if (trend > 0) return 'text-green-500';
    if (trend < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const formatValue = (val) => {
    if (typeof val === 'number') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
      return val.toLocaleString();
    }
    return val;
  };

  if (loading) {
    return (
      <div className={`metrics-card metrics-${color} loading`}>
        <div className="metrics-skeleton">
          <div className="skeleton-icon"></div>
          <div className="skeleton-content">
            <div className="skeleton-title"></div>
            <div className="skeleton-value"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`metrics-card metrics-${color}`}>
      <div className="metrics-header">
        <div className="metrics-icon">
          {icon}
        </div>
        <div className="metrics-trend">
          {getTrendIcon()}
          <span className={`trend-value ${getTrendColor()}`}>
            {trend !== undefined ? `${Math.abs(trend)}%` : ''}
          </span>
        </div>
      </div>
      
      <div className="metrics-content">
        <h3 className="metrics-title">{title}</h3>
        <div className="metrics-value">
          <span className="value">{formatValue(value)}</span>
          {unit && <span className="unit">{unit}</span>}
        </div>
        {subtitle && (
          <p className="metrics-subtitle">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default MetricsCard;
