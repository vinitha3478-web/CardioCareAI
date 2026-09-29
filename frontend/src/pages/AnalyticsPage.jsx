import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import { BarChart3, Activity, Users, PieChart as PieIcon } from 'lucide-react';
import { getPatientAnalytics, getPredictionAnalytics } from '../services/api';

const AnalyticsPage = () => {
  const [patientAnalytics, setPatientAnalytics] = useState(null);
  const [predictionAnalytics, setPredictionAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [pRes, predRes] = await Promise.all([
        getPatientAnalytics(),
        getPredictionAnalytics()
      ]);
      setPatientAnalytics(pRes);
      setPredictionAnalytics(predRes);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state neu-card">
        <Activity className="animate-spin" size={32} color="#6c47ff" />
        <p>Generating dynamic clinical analytics charts...</p>
      </div>
    );
  }

  const ageData = patientAnalytics?.age_distribution || [];
  const genderData = patientAnalytics?.gender_distribution || [];
  const riskData = predictionAnalytics?.risk_distribution || [];

  const GENDER_COLORS = ['#6c47ff', '#ec4899'];
  const RISK_COLORS = ['#38a169', '#dd6b20', '#e53e3e'];

  return (
    <div className="analytics-page-container">
      <div className="page-header-bar mb-6">
        <div>
          <h1 className="page-title">Clinical Analytics Dashboard</h1>
          <p className="section-subtitle">Real-time statistics derived from registered patient database & ML predictions</p>
        </div>
      </div>

      <div className="grid-2 gap-6 mb-6">
        {/* Patient Age Distribution */}
        <div className="neu-card">
          <div className="section-header mb-4">
            <div className="flex-align-gap">
              <BarChart3 size={20} color="#6c47ff" />
              <h2 className="section-title">Patient Age Distribution</h2>
            </div>
            <span className="neu-badge badge-purple">{patientAnalytics?.total_patients || 0} Patients</span>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0d6f2" />
                <XAxis dataKey="range" stroke="#6e6785" />
                <YAxis stroke="#6e6785" allowDecimals={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="neu-card-flat tooltip-card">
                          <p style={{ fontWeight: 700 }}>Age Group: {payload[0].payload.range}</p>
                          <p>Count: <b>{payload[0].value} patients</b></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#6c47ff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Prediction Risk Bands Distribution */}
        <div className="neu-card">
          <div className="section-header mb-4">
            <div className="flex-align-gap">
              <PieIcon size={20} color="#6c47ff" />
              <h2 className="section-title">Risk Category Breakdown</h2>
            </div>
            <span className="neu-badge">{predictionAnalytics?.total_predictions || 0} Runs</span>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="risk_level"
                  label={({ risk_level, percentage }) => `${risk_level}: ${percentage}%`}
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`risk-cell-${index}`} fill={RISK_COLORS[index % RISK_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Gender Distribution Card */}
      <div className="neu-card">
        <div className="section-header mb-4">
          <h2 className="section-title">Demographic Gender Breakdown</h2>
        </div>

        <div className="grid-2 gap-6">
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genderData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0d6f2" horizontal={false} />
                <XAxis type="number" stroke="#6e6785" />
                <YAxis dataKey="gender" type="category" stroke="#2a2538" />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {genderData.map((entry, index) => (
                    <Cell key={`gender-cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="demographic-stats-summary neu-inset">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Key Insights</h3>
            {genderData.map((g) => (
              <div key={g.gender} className="insight-row">
                <span>{g.gender} Ratio:</span>
                <b>{g.count} Patients ({g.percentage}%)</b>
              </div>
            ))}
            <p className="insight-note mt-3">
              Statistical distributions update dynamically whenever new patient records are saved to the database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
