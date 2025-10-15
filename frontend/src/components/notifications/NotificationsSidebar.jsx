import React from 'react';
import { Bell } from 'lucide-react';

const NotificationsSidebar = () => {
  return (
    <div className="notifications-sidebar-item">
      <div className="sidebar-item">
        <Bell className="sidebar-icon" />
        <span>Notifications</span>
      </div>
    </div>
  );
};

export default NotificationsSidebar;
