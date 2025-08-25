import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  variant = 'primary', 
  text = '', 
  overlay = false 
}) => {
  const spinnerClasses = `loading-spinner ${size} ${variant}`.trim();
  const containerClasses = overlay ? 'loading-overlay' : 'loading-container';

  return (
    <div className={containerClasses}>
      <div className={spinnerClasses}>
        <div className="spinner"></div>
        {text && <p className="loading-text">{text}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner;
