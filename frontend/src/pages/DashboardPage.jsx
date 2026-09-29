import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Activity, AlertTriangle, Cpu, ArrowRight, UserPlus, FileText, ChevronRight } from 'lucide-react';
import StatCard from '../components/StatCard';
import { getDashboardSummary } from '../services/api';

const DashboardPage = () => {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const data = await getDashboardSummary();
      setSummaryData(data);
    } catch (err) {
      console.error("Failed to load dashboard summary:", err);
    } finally {
      setLoading(false);
    }
  };

  const summary = summaryData?.summary || {};
  const recentPatients = summaryData?.recent_patients || [];
  const recentPredictions = summaryData?.recent_predictions || [];

  if (loading) {
    return (
      <div className="loading-state neu-card">
        <Activity className="animate-spin" size={32} color="#6c47ff" />
        <p>Loading CardioCare AI Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page-container">
      {/* KPI Cards Grid */}
      <div className="grid-4 mb-6">
        <StatCard
          title="Total Registered Patients"
          value={summary.total_patients ?? 0}
          icon={Users}
          color="#6c47ff"
          badgeText="Active Roster"
          badgeType="purple"
        />
        <StatCard
          title="Predictions Executed"
          value={summary.predictions_completed ?? 0}
          icon={Activity}
          color="#0284c7"
          badgeText="ML Runs"
          badgeType="purple"
        />
        <StatCard
          title="High Risk Cases"
          value={summary.high_risk_cases ?? 0}
          icon={AlertTriangle}
          color="#e53e3e"
          badgeText="Clinical Flags"
          badgeType="high-risk"
        />
        <StatCard
          title="ML Model Accuracy"
          value={`${summary.model_accuracy ?? 78.2}%`}
          icon={Cpu}
          color="#16a34a"
          subtext="Stratified 5-Fold CV Score"
          badgeText="Logistic Regression"
          badgeType="low-risk"
        />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid-2 gap-6">
        {/* Recent Registered Patients */}
        <div className="neu-card dashboard-section-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Recent Patients</h2>
              <p className="section-subtitle">Newly registered patient records</p>
            </div>
            <Link to="/patients/new" className="neu-btn neu-btn-primary neu-btn-sm">
              <UserPlus size={16} />
              <span>Add Patient</span>
            </Link>
          </div>

          <div className="recent-list">
            {recentPatients.length === 0 ? (
              <p className="empty-state-text">No patients registered yet.</p>
            ) : (
              recentPatients.map((patient) => (
                <div key={patient.id} className="recent-item-row neu-inset">
                  <div className="item-patient-info">
                    <div className="patient-avatar-circle">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="item-name">{patient.name}</h4>
                      <span className="item-meta">
                        {patient.patient_id} • {patient.age} yrs • {patient.gender_label}
                      </span>
                    </div>
                  </div>

                  <div className="item-actions">
                    {patient.last_prediction ? (
                      <span className={`neu-badge badge-${patient.last_prediction.risk_level.toLowerCase().replace(' ', '-')}`}>
                        {patient.last_prediction.risk_level}
                      </span>
                    ) : (
                      <span className="neu-badge">No Prediction</span>
                    )}

                    <button
                      onClick={() => navigate(`/patients/${patient.id}`)}
                      className="neu-btn neu-btn-sm neu-btn-icon"
                      title="View Profile"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="section-footer">
            <Link to="/patients" className="view-all-link">
              <span>View All Patients</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Recent ML Predictions */}
        <div className="neu-card dashboard-section-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Recent Predictions</h2>
              <p className="section-subtitle">Latest Logistic Regression risk analyses</p>
            </div>
            <Link to="/predictions" className="neu-btn neu-btn-sm">
              <Activity size={16} />
              <span>View History</span>
            </Link>
          </div>

          <div className="recent-list">
            {recentPredictions.length === 0 ? (
              <p className="empty-state-text">No predictions run yet.</p>
            ) : (
              recentPredictions.map((pred) => (
                <div key={pred.id} className="recent-item-row neu-inset">
                  <div className="item-patient-info">
                    <div className="pred-prob-badge" style={{
                      color: pred.risk_level === 'High Risk' ? '#e53e3e' : pred.risk_level === 'Moderate Risk' ? '#dd6b20' : '#38a169'
                    }}>
                      {pred.probability.toFixed(1)}%
                    </div>
                    <div>
                      <h4 className="item-name">{pred.patient_name}</h4>
                      <span className="item-meta">{pred.created_at}</span>
                    </div>
                  </div>

                  <div className="item-actions">
                    <span className={`neu-badge badge-${pred.risk_level.toLowerCase().replace(' ', '-')}`}>
                      {pred.risk_level}
                    </span>
                    <button
                      onClick={() => navigate(`/patients/${pred.patient_id}`)}
                      className="neu-btn neu-btn-sm"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="section-footer">
            <Link to="/analytics" className="view-all-link">
              <span>Open Clinical Analytics</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
