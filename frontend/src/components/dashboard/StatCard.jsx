import React from 'react';
import './StatCard.css';

const StatCard = ({ 
  title, 
  number, 
  change, 
  changeType = 'positive', 
  details, 
  icon, 
  variant = 'default',
  onClick 
}) => {
  return (
    <div 
      className={`stat-card ${variant}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className={`stat-icon ${variant}`}>
        {icon}
      </div>
      <div className="stat-content">
        <h3>{title}</h3>
        <p className="stat-number">{number}</p>
        <p className={`stat-change ${changeType}`}>{change}</p>
        {details && <p className="stat-details">{details}</p>}
      </div>
    </div>
  );
};

export default StatCard;
