import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = "#6c47ff", subtext, badgeText, badgeType = "purple" }) => {
  return (
    <div className="neu-card stat-card">
      <div className="stat-card-header">
        <div className="stat-icon-wrapper neu-inset" style={{ color: color }}>
          <Icon size={24} />
        </div>
        {badgeText && (
          <span className={`neu-badge badge-${badgeType}`}>
            {badgeText}
          </span>
        )}
      </div>

      <div className="stat-card-body">
        <h3 className="stat-value">{value}</h3>
        <p className="stat-title">{title}</p>
        {subtext && <p className="stat-subtext">{subtext}</p>}
      </div>
    </div>
  );
};

export default StatCard;
