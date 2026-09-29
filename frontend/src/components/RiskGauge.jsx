import React from 'react';

const RiskGauge = ({ probability = 0, riskLevel = "Low Risk", size = 200 }) => {
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (probability / 100) * circumference;

  let color = "#38a169"; // Low Risk Green
  let badgeClass = "badge-low-risk";

  if (riskLevel === "High Risk" || probability > 65) {
    color = "#e53e3e"; // High Risk Red
    badgeClass = "badge-high-risk";
  } else if (riskLevel === "Moderate Risk" || probability >= 35) {
    color = "#dd6b20"; // Moderate Risk Orange
    badgeClass = "badge-moderate-risk";
  }

  return (
    <div className="risk-gauge-container">
      <div className="svg-gauge-wrapper" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="gauge-svg">
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e7e0f3"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Colored progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1s ease-in-out',
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%'
            }}
          />
        </svg>

        <div className="gauge-center-content">
          <span className="gauge-percentage" style={{ color }}>
            {probability.toFixed(1)}%
          </span>
          <span className="gauge-label">Probability</span>
        </div>
      </div>

      <div className="risk-gauge-badge-wrapper">
        <span className={`neu-badge ${badgeClass} risk-level-large-badge`}>
          {riskLevel}
        </span>
      </div>
    </div>
  );
};

export default RiskGauge;
