import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserPlus, Activity, History,
  BarChart3, Cpu, LogOut, HeartPulse
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { logout, doctor } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Patients', path: '/patients', icon: Users },
    { label: 'Add Patient', path: '/patients/new', icon: UserPlus },
    { label: 'Predictions', path: '/predictions', icon: Activity },
    { label: 'History', path: '/history', icon: History },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Model Performance', path: '/model-performance', icon: Cpu }
  ];

  return (
    <aside className={`sidebar-container ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-logo-icon">
            <HeartPulse size={24} color="#6c47ff" />
          </div>
          <div className="brand-text">
            <h2>CardioCare <span>AI</span></h2>
            <span className="brand-sub">Clinical Decision Support</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => isOpen && toggleSidebar && toggleSidebar()}
            >
              <Icon size={20} className="nav-icon" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="doctor-badge-card neu-inset">
          <div className="doctor-avatar">
            {doctor?.name ? doctor.name.charAt(0) : 'D'}
          </div>
          <div className="doctor-info">
            <p className="doctor-name">{doctor?.name || 'Dr. CardioCare'}</p>
            <p className="doctor-spec">{doctor?.specialization || 'Cardiology'}</p>
          </div>
        </div>

        <button onClick={handleLogout} className="neu-btn neu-btn-danger sidebar-logout-btn">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
