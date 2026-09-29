import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, Filter, UserPlus, Eye, Edit, Activity, History, Trash2, Download
} from 'lucide-react';
import { getPatients, deletePatient, runPrediction, downloadPatientPDF } from '../services/api';
import Toast from '../components/Toast';

const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [toast, setToast] = useState(null);
  const [predictingId, setPredictingId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchPatientsList();
  }, [search, genderFilter, riskFilter]);

  const fetchPatientsList = async () => {
    setLoading(true);
    try {
      const data = await getPatients({
        search,
        gender: genderFilter,
        risk: riskFilter
      });
      setPatients(data.patients || []);
    } catch (err) {
      setToast({ message: "Failed to load patient roster", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete patient record for ${name}?`)) {
      try {
        await deletePatient(id);
        setToast({ message: `Patient ${name} deleted successfully`, type: "success" });
        fetchPatientsList();
      } catch (err) {
        setToast({ message: "Failed to delete patient", type: "error" });
      }
    }
  };

  const handleQuickPredict = async (patientId, patientName) => {
    setPredictingId(patientId);
    try {
      const res = await runPrediction(patientId);
      const risk = res.result.risk_level;
      const prob = res.result.probability;
      setToast({
        message: `Prediction for ${patientName}: ${res.result.prediction_label} (${prob}% - ${risk})`,
        type: risk === 'High Risk' ? 'warning' : 'success'
      });
      fetchPatientsList();
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Prediction execution failed", type: "error" });
    } finally {
      setPredictingId(null);
    }
  };

  return (
    <div className="patients-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Control Header */}
      <div className="patients-controls-card neu-card mb-6">
        <div className="controls-row">
          {/* Search Box */}
          <div className="search-box neu-inset flex-1">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by Name, Patient ID (PAT-1001), or Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Gender Filter */}
          <div className="filter-select-wrapper">
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="neu-select"
            >
              <option value="">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div className="filter-select-wrapper">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="neu-select"
            >
              <option value="">All Risk Bands</option>
              <option value="Low Risk">Low Risk</option>
              <option value="Moderate Risk">Moderate Risk</option>
              <option value="High Risk">High Risk</option>
            </select>
          </div>

          {/* Add Patient Button */}
          <button
            onClick={() => navigate('/patients/new')}
            className="neu-btn neu-btn-primary"
          >
            <UserPlus size={18} />
            <span>Add Patient</span>
          </button>
        </div>
      </div>

      {/* Patient Roster Table */}
      <div className="neu-card">
        <div className="table-header-bar">
          <h2 className="section-title">Kaggle All OK Patient Records ({patients.length})</h2>
        </div>

        {loading ? (
          <div className="loading-state">
            <Activity className="animate-spin" size={28} color="#6c47ff" />
            <p>Fetching patients...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="empty-state neu-inset">
            <Users size={40} color="#6e6785" />
            <h3>No Patients Found</h3>
            <p>Try adjusting your search query or add a new patient record.</p>
          </div>
        ) : (
          <div className="neu-table-container">
            <table className="neu-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Patient Name</th>
                  <th>Age / Sex</th>
                  <th>Contact</th>
                  <th>Last Prediction</th>
                  <th>Risk Category</th>
                  <th>Record Date (fixed)</th>
                  <th>Last Updated</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => {
                  const lastPred = p.last_prediction;
                  return (
                    <tr key={p.id}>
                      <td><b style={{ color: '#6c47ff' }}>{p.patient_id}</b></td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6e6785' }}>{p.email || 'No email'}</div>
                      </td>
                      <td>{p.age} yrs ({p.gender_label})</td>
                      <td>{p.phone || 'N/A'}</td>
                      <td>
                        {lastPred ? (
                          <div>
                            <b>{lastPred.probability}%</b>
                            <div style={{ fontSize: '0.72rem', color: '#6e6785' }}>{lastPred.prediction_label}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#9790b0', fontSize: '0.8rem' }}>None</span>
                        )}
                      </td>
                      <td>
                        {lastPred ? (
                          <span className={`neu-badge badge-${lastPred.risk_level.toLowerCase().replace(' ', '-')}`}>
                            {lastPred.risk_level}
                          </span>
                        ) : (
                          <span className="neu-badge">Unevaluated</span>
                        )}
                      </td>
                      <td>{p.created_at || p.record_date || 'N/A'}</td>
                      <td>{p.updated_at || 'N/A'}</td>
                      <td>
                        <div className="action-buttons-group">
                          <button
                            onClick={() => navigate(`/patients/${p.id}`)}
                            className="neu-btn neu-btn-sm"
                            title="View Patient Profile"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => navigate(`/patients/${p.id}/edit`)}
                            className="neu-btn neu-btn-sm"
                            title="Edit dynamic fields (date stays locked)"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleQuickPredict(p.id, p.name)}
                            className="neu-btn neu-btn-primary neu-btn-sm"
                            disabled={predictingId === p.id}
                            title="Run ML Heart Disease Prediction"
                          >
                            <Activity size={15} />
                            <span>{predictingId === p.id ? 'Running...' : 'Predict'}</span>
                          </button>
                          <button
                            onClick={() => downloadPatientPDF(p.id)}
                            className="neu-btn neu-btn-sm"
                            title="Download Clinical PDF Report"
                          >
                            <Download size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="neu-btn neu-btn-danger neu-btn-sm"
                            title="Delete Patient Record"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientsPage;
