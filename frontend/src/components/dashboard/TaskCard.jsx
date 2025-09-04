import React from 'react';
import './TaskCard.css';

const TaskCard = ({ 
  title, 
  project, 
  assignee, 
  deadline, 
  priority, 
  isUrgent = false,
  onClick 
}) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'medium';
    }
  };

  return (
    <div className={`task-item ${isUrgent ? 'urgent' : ''}`} onClick={onClick}>
      <div className="task-info">
        <h4>{title}</h4>
        <p>Projet: {project}</p>
        <div className="task-meta">
          <span className="assignee">Assigné à: {assignee}</span>
          <span className="deadline">Échéance: {deadline}</span>
        </div>
      </div>
      <div className={`task-priority ${getPriorityColor(priority)}`}>
        <span>{priority === 'high' ? 'Haute' : priority === 'medium' ? 'Moyenne' : 'Basse'}</span>
      </div>
    </div>
  );
};

export default TaskCard;
