import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, Download, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { getPredictionDetail, downloadPatientPDF } from '../services/api';
import RiskGauge from '../components/RiskGauge';
import FeatureInfluenceChart from '../components/FeatureInfluenceChart';

const PredictionResultPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [predData, setPredData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrediction();
  }, [id]);

  const fetchPrediction = async () => {
    try {
      const res = await getPredictionDetail(id);
      setPredData(res.prediction);
    } catch (err) {
      console.error("Failed to load prediction details:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state neu-card">
        <Activity className="animate-spin" size={32} color="#6c47ff" />
        <p>Loading prediction inference details...</p>
      </div>
    );
  }

  if (!predData) {
    return (
      <div className="neu-card empty-state">
        <h3>Prediction Not Found</h3>
        <button onClick={() => navigate('/history')} className="neu-btn neu-btn-primary mt-4">
          Back to Prediction History
        </button>
      </div>
    );
  }

  const details = predData.prediction_details || {};
  const topFactors = details.top_contributing_factors || [];

  return (
    <div className="prediction-result-container">
      <div className="page-header-bar mb-6">
        <button onClick={() => navigate('/history')} className="neu-btn neu-btn-sm">
          <ArrowLeft size={16} />
          <span>Back to History</span>
        </button>
        <h1 className="page-title">Heart Disease Prediction Analysis</h1>
      </div>

      <div className="grid-2 gap-6 mb-6">
        {/* Main Result Card */}
        <div className="neu-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Prediction Result</h2>
              <p className="section-subtitle">Patient: <b>{predData.patient_name}</b> ({predData.patient_code})</p>
            </div>
            <span className="neu-badge badge-purple">{predData.model_version}</span>
          </div>

          <div className="result-card-body mt-6">
            <RiskGauge
              probability={predData.probability}
              riskLevel={predData.risk_level}
              size={220}
            />

            <div className="result-summary-box neu-inset mt-6">
              <h3 className="prediction-main-label">{predData.prediction_label}</h3>
              <p className="prediction-meta-time">Calculated on {predData.created_at} by {predData.doctor_name}</p>
            </div>

            <button
              onClick={() => downloadPatientPDF(predData.patient_id)}
              className="neu-btn neu-btn-primary full-width mt-4"
            >
              <Download size={18} />
              <span>Download Official Clinical PDF Report</span>
            </button>
          </div>
        </div>

        {/* Feature Influence Factors Chart */}
        <div className="neu-card">
          <div className="section-header mb-4">
            <div>
              <h2 className="section-title">Model Factor Contributions</h2>
              <p className="section-subtitle">Features with highest weight in this inference</p>
            </div>
          </div>

          <p className="factor-explanation-text text-muted mb-4">
            "These medical features had greater relative influence on the model output for this patient's risk probability calculation."
          </p>

          <FeatureInfluenceChart data={topFactors} height={280} />

          <div className="clinical-disclaimer-card neu-inset mt-4">
            <Info size={18} color="#6c47ff" />
            <p className="disclaimer-text">
              <b>Clinical Decision Support Disclaimer:</b> This model-based analysis estimates statistical probability. It is intended for clinical workflow guidance and does not provide an automated diagnosis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionResultPage;
