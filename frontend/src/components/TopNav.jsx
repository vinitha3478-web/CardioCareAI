import React from 'react';
import { Search, Bell, Menu, Calendar, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TopNav = ({ title = "Dashboard", onSearchChange, toggleSidebar }) => {
  const { doctor } = useAuth();

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="topnav-header neu-card-flat">
      <div className="topnav-left">
        <button className="neu-btn neu-btn-icon mobile-menu-btn" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
        <h1 className="topnav-title">{title}</h1>
      </div>

      <div className="topnav-center">
        <div className="search-box neu-inset">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search patient name, ID, or phone..."
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="topnav-right">
        <div className="date-chip neu-inset">
          <Calendar size={16} color="#6c47ff" />
          <span>{formattedDate}</span>
        </div>

        <button className="neu-btn neu-btn-icon notification-btn" title="Notifications">
          <Bell size={18} />
          <span className="notification-dot"></span>
        </button>

        <div className="doctor-header-profile">
          <div className="profile-avatar">
            <User size={18} color="#6c47ff" />
          </div>
          <div className="profile-text">
            <span className="profile-name">{doctor?.name || 'Dr. CardioCare'}</span>
            <span className="profile-role">Physician</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
