import React from 'react';
import './ActionButton.css';

const ActionButton = ({ 
  icon, 
  label, 
  onClick, 
  variant = 'default',
  disabled = false 
}) => {
  return (
    <button 
      className={`action-btn ${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="action-icon">
        {icon}
      </div>
      <span className="action-label">{label}</span>
    </button>
  );
};

export default ActionButton;
