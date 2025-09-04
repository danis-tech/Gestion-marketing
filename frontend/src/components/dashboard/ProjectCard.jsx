import React from 'react';
import './ProjectCard.css';

const ProjectCard = ({ 
  title, 
  description, 
  deadline, 
  teamCount, 
  status, 
  progress, 
  onClick 
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'in-progress':
        return 'in-progress';
      case 'completed':
        return 'completed';
      case 'pending':
        return 'pending';
      default:
        return 'pending';
    }
  };

  return (
    <div className="project-item" onClick={onClick}>
      <div className="project-info">
        <h4>{title}</h4>
        <p>{description}</p>
        <div className="project-meta">
          <span className="deadline">Échéance: {deadline}</span>
          <span className="team">{teamCount} équipes</span>
        </div>
      </div>
      <div className={`project-status ${getStatusColor(status)}`}>
        <span>{status === 'in-progress' ? 'En cours' : status === 'completed' ? 'Terminé' : 'En attente'}</span>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
