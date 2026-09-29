import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, Activity, Download, ArrowLeft, Heart, Calendar, Phone, Mail, MapPin,
  Clock, CheckCircle, AlertTriangle, Cpu, Sparkles
} from 'lucide-react';
import { getPatientDetail, runPrediction, downloadPatientPDF } from '../services/api';
import RiskGauge from '../components/RiskGauge';
import FeatureInfluenceChart from '../components/FeatureInfluenceChart';
import Toast from '../components/Toast';

const PatientProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [toast, setToast] = useState(null);
  const [activePrediction, setActivePrediction] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await getPatientDetail(id);
      setPatientData(res.patient);
      if (res.patient.last_prediction) {
        setActivePrediction(res.patient.last_prediction);
      }
    } catch (err) {
      setToast({ message: "Failed to load patient profile", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleRunPrediction = async () => {
    setPredicting(true);
    setToast(null);

    try {
      const res = await runPrediction(id);
      setActivePrediction(res.result);
      setToast({
        message: `Prediction Complete: ${res.result.prediction_label} (${res.result.probability}% - ${res.result.risk_level})`,
        type: res.result.risk_level === 'High Risk' ? 'warning' : 'success'
      });
      // Refresh profile history
      fetchProfile();
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Prediction execution failed", type: "error" });
    } finally {
      setPredicting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state neu-card">
        <Activity className="animate-spin" size={32} color="#6c47ff" />
        <p>Loading patient profile & medical records...</p>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="neu-card empty-state">
        <h3>Patient Not Found</h3>
        <button onClick={() => navigate('/patients')} className="neu-btn neu-btn-primary mt-4">
          Return to Patients Roster
        </button>
      </div>
    );
  }

  const latestMed = patientData.latest_medical_record || {};
  const history = patientData.prediction_history || [];

  return (
    <div className="patient-profile-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Profile Header */}
      <div className="profile-header-card neu-card mb-6">
        <div className="profile-header-main">
          <button onClick={() => navigate('/patients')} className="neu-btn neu-btn-sm mb-4">
            <ArrowLeft size={16} />
            <span>Back to Roster</span>
          </button>

          <div className="profile-identity-row">
            <div className="profile-identity-left">
              <div className="profile-big-avatar neu-inset">
                {patientData.name.charAt(0)}
              </div>
              <div>
                <div className="profile-title-group">
                  <h1 className="patient-name-heading">{patientData.name}</h1>
                  <span className="neu-badge badge-purple">{patientData.patient_id}</span>
                </div>
                <p className="patient-meta-subtitle">
                  {patientData.age} Years Old • {patientData.gender_label} • Record date locked: {patientData.record_date || patientData.created_at}
                </p>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="profile-actions-right">
              <button
                onClick={() => navigate(`/patients/${patientData.id}/edit`)}
                className="neu-btn"
              >
                <User size={18} />
                <span>Edit Dynamic Fields</span>
              </button>
              <button
                onClick={handleRunPrediction}
                className="neu-btn neu-btn-primary run-predict-btn"
                disabled={predicting}
              >
                <Sparkles size={18} />
                <span>{predicting ? 'Processing ML Model...' : 'Run Heart Disease Prediction'}</span>
              </button>

              <button
                onClick={() => downloadPatientPDF(patientData.id)}
                className="neu-btn download-pdf-btn"
              >
                <Download size={18} />
                <span>Download PDF Report</span>
              </button>
            </div>
          </div>

          <div className="profile-contact-chips mt-4">
            <div className="contact-chip neu-inset">
              <Phone size={15} color="#6c47ff" />
              <span>{patientData.phone || 'No phone'}</span>
            </div>
            <div className="contact-chip neu-inset">
              <Mail size={15} color="#6c47ff" />
              <span>{patientData.email || 'No email'}</span>
            </div>
            <div className="contact-chip neu-inset">
              <MapPin size={15} color="#6c47ff" />
              <span>{patientData.address || 'No address specified'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Latest Prediction Result & Medical Input Parameters */}
      <div className="grid-2 gap-6 mb-6">
        {/* Latest Prediction Status Card */}
        <div className="neu-card prediction-status-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Latest ML Prediction Result</h2>
              <p className="section-subtitle">Calculated by Logistic Regression model</p>
            </div>
            <span className="neu-badge">v1.0.0</span>
          </div>

          {activePrediction ? (
            <div className="prediction-results-body mt-4">
              <RiskGauge
                probability={activePrediction.probability}
                riskLevel={activePrediction.risk_level}
              />

              <div className="prediction-label-banner neu-inset mt-4">
                <p className="banner-result-title">
                  {activePrediction.prediction_label}
                </p>
                <p className="banner-date">
                  Calculated: {activePrediction.created_at}
                </p>
              </div>
            </div>
          ) : (
            <div className="empty-state neu-inset mt-4">
              <Activity size={36} color="#9790b0" />
              <h4>No Prediction Executed Yet</h4>
              <p>Click "Run Heart Disease Prediction" to execute Logistic Regression analysis on this patient's medical parameters.</p>
            </div>
          )}
        </div>

        {/* Clinical Medical Parameters Matrix */}
        <div className="neu-card medical-parameters-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Recorded Medical Parameters</h2>
              <p className="section-subtitle">Features used for classification</p>
            </div>
          </div>

          <div className="med-params-grid grid-2 gap-3 mt-4">
            <div className="param-item-card neu-inset">
              <span className="param-name">Chest Pain (cp)</span>
              <span className="param-val">Type {latestMed.cp ?? 'N/A'}</span>
            </div>
            <div className="param-item-card neu-inset">
              <span className="param-name">Resting BP (trestbps)</span>
              <span className="param-val">{latestMed.trestbps ?? 'N/A'} mm Hg</span>
            </div>
            <div className="param-item-card neu-inset">
              <span className="param-name">Serum Cholesterol (chol)</span>
              <span className="param-val">{latestMed.chol ?? 'N/A'} mg/dl</span>
            </div>
            <div className="param-item-card neu-inset">
              <span className="param-name">Fasting Sugar (fbs)</span>
              <span className="param-val">{latestMed.fbs === 1 ? '> 120 mg/dl' : 'Normal'}</span>
            </div>
            <div className="param-item-card neu-inset">
              <span className="param-name">Resting ECG (restecg)</span>
              <span className="param-val">Result {latestMed.restecg ?? '0'}</span>
            </div>
            <div className="param-item-card neu-inset">
              <span className="param-name">Max Heart Rate (thalach)</span>
              <span className="param-val">{latestMed.thalach ?? 'N/A'} bpm</span>
            </div>
            <div className="param-item-card neu-inset">
              <span className="param-name">Exercise Angina (exang)</span>
              <span className="param-val">{latestMed.exang === 1 ? 'Yes' : 'No'}</span>
            </div>
            <div className="param-item-card neu-inset">
              <span className="param-name">ST Depression (oldpeak)</span>
              <span className="param-val">{latestMed.oldpeak ?? '0.0'}</span>
            </div>
            <div className="param-item-card neu-inset">
              <span className="param-name">ST Slope (slope)</span>
              <span className="param-val">Slope {latestMed.slope ?? '1'}</span>
            </div>
            <div className="param-item-card neu-inset">
              <span className="param-name">Major Vessels (ca)</span>
              <span className="param-val">{latestMed.ca ?? '0'} vessels</span>
            </div>
            <div className="param-item-card neu-inset" style={{ gridColumn: 'span 2' }}>
              <span className="param-name">Thalassemia (thal)</span>
              <span className="param-val">{latestMed.thal === 1 ? 'Normal' : latestMed.thal === 2 ? 'Fixed Defect' : 'Reversible Defect'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Prediction History Timeline */}
      <div className="neu-card">
        <div className="section-header mb-4">
          <div>
            <h2 className="section-title">Prediction History Timeline</h2>
            <p className="section-subtitle">Past ML risk assessments for {patientData.name}</p>
          </div>
        </div>

        {history.length === 0 ? (
          <p className="empty-state-text">No previous predictions stored in database.</p>
        ) : (
          <div className="neu-table-container">
            <table className="neu-table">
              <thead>
                <tr>
                  <th>Prediction Date</th>
                  <th>Classification</th>
                  <th>Probability</th>
                  <th>Risk Band</th>
                  <th>Model Version</th>
                  <th>Attending Physician</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td><Clock size={14} style={{ display: 'inline', marginRight: 6 }} />{item.created_at}</td>
                    <td><b>{item.prediction_label}</b></td>
                    <td><b>{item.probability}%</b></td>
                    <td>
                      <span className={`neu-badge badge-${item.risk_level.toLowerCase().replace(' ', '-')}`}>
                        {item.risk_level}
                      </span>
                    </td>
                    <td>{item.model_version}</td>
                    <td>{item.doctor_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientProfilePage;
