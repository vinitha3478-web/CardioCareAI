import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Search, Filter, Eye, Activity, Download } from 'lucide-react';
import { getPredictions, downloadPatientPDF } from '../services/api';
import Toast from '../components/Toast';

const HistoryPage = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [toast, setToast] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, [search, riskFilter]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getPredictions({ search, risk: riskFilter });
      setPredictions(data.predictions || []);
    } catch (err) {
      setToast({ message: "Failed to load prediction history", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="history-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Search & Filter Header */}
      <div className="neu-card mb-6">
        <div className="controls-row">
          <div className="search-box neu-inset flex-1">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search history by patient name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

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
        </div>
      </div>

      {/* History Table */}
      <div className="neu-card">
        <div className="section-header mb-4">
          <h2 className="section-title">Prediction Execution Logs ({predictions.length})</h2>
        </div>

        {loading ? (
          <div className="loading-state">
            <Activity className="animate-spin" size={28} color="#6c47ff" />
            <p>Loading history records...</p>
          </div>
        ) : predictions.length === 0 ? (
          <div className="empty-state neu-inset">
            <History size={40} color="#6e6785" />
            <h3>No History Logs Found</h3>
            <p>Try clearing your search filters or run a prediction from the Patient Roster.</p>
          </div>
        ) : (
          <div className="neu-table-container">
            <table className="neu-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Patient</th>
                  <th>Classification Result</th>
                  <th>Probability</th>
                  <th>Risk Band</th>
                  <th>Doctor</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p) => (
                  <tr key={p.id}>
                    <td>{p.created_at}</td>
                    <td>
                      <b style={{ color: '#6c47ff' }}>{p.patient_name}</b>
                      <div style={{ fontSize: '0.75rem', color: '#6e6785' }}>{p.patient_code}</div>
                    </td>
                    <td><b>{p.prediction_label}</b></td>
                    <td><b>{p.probability}%</b></td>
                    <td>
                      <span className={`neu-badge badge-${p.risk_level.toLowerCase().replace(' ', '-')}`}>
                        {p.risk_level}
                      </span>
                    </td>
                    <td>{p.doctor_name}</td>
                    <td>
                      <div className="action-buttons-group">
                        <button
                          onClick={() => navigate(`/predictions/${p.id}`)}
                          className="neu-btn neu-btn-sm"
                          title="View Prediction Factor Analysis"
                        >
                          <Eye size={15} />
                          <span>View Factor Analysis</span>
                        </button>
                        <button
                          onClick={() => downloadPatientPDF(p.patient_id)}
                          className="neu-btn neu-btn-sm"
                          title="Download PDF"
                        >
                          <Download size={15} />
                        </button>
                      </div>
                    </td>
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

export default HistoryPage;
