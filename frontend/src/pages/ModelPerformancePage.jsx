import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine
} from 'recharts';
import { Cpu, Activity, CheckCircle, ShieldCheck, BarChart2, GitCommit, Settings } from 'lucide-react';
import StatCard from '../components/StatCard';
import FeatureInfluenceChart from '../components/FeatureInfluenceChart';
import { getModelMetrics } from '../services/api';

const ModelPerformancePage = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModelMetrics();
  }, []);

  const fetchModelMetrics = async () => {
    try {
      const res = await getModelMetrics();
      setMetrics(res.metrics);
    } catch (err) {
      console.error("Failed to load model metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state neu-card">
        <Activity className="animate-spin" size={32} color="#6c47ff" />
        <p>Loading Logistic Regression evaluation metrics & ROC curve...</p>
      </div>
    );
  }

  const cm = metrics?.confusion_matrix || { tn: 0, fp: 0, fn: 0, tp: 0 };
  const rocCurve = metrics?.roc_curve || [];
  const featInfluence = metrics?.feature_influence || [];
  const modelInfo = metrics?.model_info || {};
  const clfReport = metrics?.classification_report || {};
  const bestParams = metrics?.best_parameters || {};

  return (
    <div className="model-performance-container">
      {/* Header Banner */}
      <div className="page-header-bar mb-6">
        <div>
          <h1 className="page-title">Model Performance & Evaluation</h1>
          <p className="section-subtitle">Scikit-Learn Logistic Regression Pipeline Metrics (UCI Cleveland Heart Disease Dataset)</p>
        </div>
        <span className="neu-badge badge-purple" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
          Logistic Regression v{modelInfo.model_version || '1.0.0'}
        </span>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid-3 gap-6 mb-6">
        <StatCard
          title="Classification Accuracy"
          value={`${((metrics?.accuracy || 0) * 100).toFixed(1)}%`}
          icon={CheckCircle}
          color="#38a169"
          subtext="Held-out Test Set Evaluation"
          badgeText="Accuracy"
          badgeType="low-risk"
        />
        <StatCard
          title="ROC-AUC Score"
          value={metrics?.roc_auc?.toFixed(3) || "0.782"}
          icon={ShieldCheck}
          color="#6c47ff"
          subtext="Area Under Receiver Operating Curve"
          badgeText="ROC-AUC"
          badgeType="purple"
        />
        <StatCard
          title="5-Fold CV Score"
          value={`${((metrics?.cross_validation_score || 0) * 100).toFixed(1)}%`}
          icon={GitCommit}
          color="#0284c7"
          subtext={`Std Dev: +/- ${((metrics?.cross_validation_std || 0) * 100).toFixed(1)}%`}
          badgeText="Cross-Validation"
          badgeType="purple"
        />
      </div>

      <div className="grid-3 gap-6 mb-6">
        <StatCard
          title="Precision Score"
          value={`${((metrics?.precision || 0) * 100).toFixed(1)}%`}
          icon={BarChart2}
          color="#4f46e5"
          subtext="Positive Predictive Value"
        />
        <StatCard
          title="Recall (Sensitivity)"
          value={`${((metrics?.recall || 0) * 100).toFixed(1)}%`}
          icon={BarChart2}
          color="#dd6b20"
          subtext="True Positive Rate"
        />
        <StatCard
          title="F1-Score"
          value={metrics?.f1_score?.toFixed(3) || "0.579"}
          icon={BarChart2}
          color="#9333ea"
          subtext="Harmonic Mean of Precision & Recall"
        />
      </div>

      {/* Grid: Confusion Matrix & ROC Curve */}
      <div className="grid-2 gap-6 mb-6">
        {/* Confusion Matrix Visualization */}
        <div className="neu-card">
          <div className="section-header mb-4">
            <h2 className="section-title">Confusion Matrix</h2>
            <p className="section-subtitle">Binary classification breakdown (Test Set)</p>
          </div>

          <div className="confusion-matrix-grid mt-4">
            <div className="cm-cell neu-inset cm-tn">
              <span className="cm-label">True Negative (TN)</span>
              <span className="cm-value">{cm.tn}</span>
              <span className="cm-sub">Correctly identified No Risk</span>
            </div>

            <div className="cm-cell neu-inset cm-fp">
              <span className="cm-label">False Positive (FP)</span>
              <span className="cm-value">{cm.fp}</span>
              <span className="cm-sub">Incorrectly flagged Risk</span>
            </div>

            <div className="cm-cell neu-inset cm-fn">
              <span className="cm-label">False Negative (FN)</span>
              <span className="cm-value">{cm.fn}</span>
              <span className="cm-sub">Missed Risk cases</span>
            </div>

            <div className="cm-cell neu-inset cm-tp">
              <span className="cm-label">True Positive (TP)</span>
              <span className="cm-value">{cm.tp}</span>
              <span className="cm-sub">Correctly identified Risk</span>
            </div>
          </div>
        </div>

        {/* ROC Curve Graph */}
        <div className="neu-card">
          <div className="section-header mb-4">
            <h2 className="section-title">ROC Curve (Receiver Operating Characteristic)</h2>
            <p className="section-subtitle">AUC = {metrics?.roc_auc?.toFixed(3)}</p>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocCurve} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0d6f2" />
                <XAxis dataKey="fpr" label={{ value: 'False Positive Rate (FPR)', position: 'insideBottom', offset: -5 }} stroke="#6e6785" />
                <YAxis label={{ value: 'True Positive Rate (TPR)', angle: -90, position: 'insideLeft' }} stroke="#6e6785" />
                <Tooltip />
                <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="#9790b0" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="tpr" stroke="#6c47ff" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Model Feature Influence Bar Chart */}
      <div className="neu-card mb-6">
        <div className="section-header mb-4">
          <h2 className="section-title">Model Coefficients (Feature Influence)</h2>
          <p className="section-subtitle">Trained Logistic Regression feature weights (Positive increases risk score, Negative decreases risk score)</p>
        </div>

        <FeatureInfluenceChart data={featInfluence} height={350} />
      </div>

      {/* Grid: Detailed Classification Report & Model Metadata */}
      <div className="grid-2 gap-6">
        {/* Classification Report Table */}
        <div className="neu-card">
          <div className="section-header mb-4">
            <h2 className="section-title">Classification Report</h2>
          </div>

          <div className="neu-table-container">
            <table className="neu-table">
              <thead>
                <tr>
                  <th>Class Label</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>F1-Score</th>
                  <th>Support</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><b>Class 0 (No Risk)</b></td>
                  <td>{((clfReport['0']?.precision || 0) * 100).toFixed(1)}%</td>
                  <td>{((clfReport['0']?.recall || 0) * 100).toFixed(1)}%</td>
                  <td>{clfReport['0']?.['f1-score']?.toFixed(3) || "0.0"}</td>
                  <td>{clfReport['0']?.support || 0}</td>
                </tr>
                <tr>
                  <td><b>Class 1 (Possible Risk)</b></td>
                  <td>{((clfReport['1']?.precision || 0) * 100).toFixed(1)}%</td>
                  <td>{((clfReport['1']?.recall || 0) * 100).toFixed(1)}%</td>
                  <td>{clfReport['1']?.['f1-score']?.toFixed(3) || "0.0"}</td>
                  <td>{clfReport['1']?.support || 0}</td>
                </tr>
                <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-inset)' }}>
                  <td>Macro Average</td>
                  <td>{((clfReport['macro avg']?.precision || 0) * 100).toFixed(1)}%</td>
                  <td>{((clfReport['macro avg']?.recall || 0) * 100).toFixed(1)}%</td>
                  <td>{clfReport['macro avg']?.['f1-score']?.toFixed(3) || "0.0"}</td>
                  <td>{clfReport['macro avg']?.support || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Model Architecture & Training Metadata */}
        <div className="neu-card">
          <div className="section-header mb-4">
            <div className="flex-align-gap">
              <Settings size={20} color="#6c47ff" />
              <h2 className="section-title">Model Specifications</h2>
            </div>
          </div>

          <div className="model-spec-list neu-inset">
            <div className="spec-item">
              <span className="spec-key">Algorithm:</span>
              <span className="spec-val">scikit-learn LogisticRegression</span>
            </div>
            <div className="spec-item">
              <span className="spec-key">Dataset:</span>
              <span className="spec-val">{modelInfo.dataset}</span>
            </div>
            <div className="spec-item">
              <span className="spec-key">Total Samples:</span>
              <span className="spec-val">{modelInfo.total_samples} (242 Train / 61 Test)</span>
            </div>
            <div className="spec-item">
              <span className="spec-key">Hyperparameter Tuning:</span>
              <span className="spec-val">GridSearchCV (Stratified 5-Fold)</span>
            </div>
            <div className="spec-item">
              <span className="spec-key">Best Parameters:</span>
              <span className="spec-val">C={bestParams.C || 10.0}, solver='{bestParams.solver || 'liblinear'}'</span>
            </div>
            <div className="spec-item">
              <span className="spec-key">Preprocessing:</span>
              <span className="spec-val">StandardScaler + SimpleImputer Pipeline</span>
            </div>
            <div className="spec-item">
              <span className="spec-key">Trained Timestamp:</span>
              <span className="spec-val">{modelInfo.trained_at || 'Recent'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelPerformancePage;
