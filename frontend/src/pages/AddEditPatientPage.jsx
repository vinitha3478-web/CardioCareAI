import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserPlus, Heart, Save, ArrowLeft, Calendar, Lock } from 'lucide-react';
import { createPatient, getPatientDetail, updatePatient } from '../services/api';
import Toast from '../components/Toast';

const EMPTY_FORM = {
  name: '',
  age: '55',
  sex: '1',
  phone: '',
  email: '',
  address: '',
  created_at: '',
  cp: '0',
  trestbps: '130',
  chol: '240',
  fbs: '0',
  restecg: '0',
  thalach: '150',
  exang: '0',
  oldpeak: '1.0',
  slope: '1',
  ca: '0',
  thal: '2'
};

const AddEditPatientPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!isEdit) return;

    const loadPatient = async () => {
      try {
        const res = await getPatientDetail(id);
        const patient = res.patient;
        const med = patient.latest_medical_record || {};
        setFormData({
          name: patient.name || '',
          age: String(patient.age ?? ''),
          sex: String(patient.sex ?? '1'),
          phone: patient.phone || '',
          email: patient.email || '',
          address: patient.address || '',
          created_at: patient.record_date || patient.created_at || '',
          cp: String(med.cp ?? '0'),
          trestbps: String(med.trestbps ?? ''),
          chol: String(med.chol ?? ''),
          fbs: String(med.fbs ?? '0'),
          restecg: String(med.restecg ?? '0'),
          thalach: String(med.thalach ?? ''),
          exang: String(med.exang ?? '0'),
          oldpeak: String(med.oldpeak ?? '0'),
          slope: String(med.slope ?? '1'),
          ca: String(med.ca ?? '0'),
          thal: String(med.thal ?? '2')
        });
      } catch (err) {
        setToast({ message: 'Failed to load patient for editing', type: 'error' });
      }
    };

    loadPatient();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Date is display-only; ignore any attempt to change it from the GUI.
    if (name === 'created_at' || name === 'record_date') return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast(null);

    if (!formData.name.trim()) {
      setToast({ message: 'Patient Name is required', type: 'error' });
      return;
    }

    const ageNum = parseInt(formData.age, 10);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      setToast({ message: 'Please enter a valid age between 1 and 120', type: 'error' });
      return;
    }

    const bpNum = parseFloat(formData.trestbps);
    if (isNaN(bpNum) || bpNum < 50 || bpNum > 300) {
      setToast({ message: 'Resting Blood Pressure must be a valid numeric value', type: 'error' });
      return;
    }

    const cholNum = parseFloat(formData.chol);
    if (isNaN(cholNum) || cholNum < 50 || cholNum > 700) {
      setToast({ message: 'Serum Cholesterol must be a valid numeric value', type: 'error' });
      return;
    }

    const payload = { ...formData };
    delete payload.created_at;
    delete payload.record_date;

    setLoading(true);
    try {
      if (isEdit) {
        await updatePatient(id, payload);
        setToast({ message: 'Dynamic fields updated. Record date stayed fixed.', type: 'success' });
        setTimeout(() => navigate(`/patients/${id}`), 700);
      } else {
        const res = await createPatient(payload);
        setToast({ message: 'Patient registered with a locked record date.', type: 'success' });
        setTimeout(() => navigate(`/patients/${res.patient.id}`), 800);
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.error || 'Failed to save patient',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-patient-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header-bar mb-6">
        <button onClick={() => navigate(isEdit ? `/patients/${id}` : '/patients')} className="neu-btn neu-btn-sm">
          <ArrowLeft size={16} />
          <span>{isEdit ? 'Back to Profile' : 'Back to Roster'}</span>
        </button>
        <h1 className="page-title">
          {isEdit ? 'Update Dynamic Patient Fields' : 'Register New Patient Record'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="patient-form">
        <div className="neu-card mb-6">
          <div className="card-header-with-icon">
            <div className="header-icon neu-inset">
              <UserPlus size={22} color="#6c47ff" />
            </div>
            <div>
              <h2 className="section-title">Personal Information</h2>
              <p className="section-subtitle">
                All fields below are dynamic except the locked record date.
              </p>
            </div>
          </div>

          <div className="grid-3 gap-4 mt-4">
            <div className="neu-input-group">
              <label className="neu-label">Full Name *</label>
              <input
                type="text"
                name="name"
                className="neu-input"
                placeholder="e.g. Johnathan Miller"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="neu-input-group">
              <label className="neu-label">Age (years) *</label>
              <input
                type="number"
                name="age"
                className="neu-input"
                placeholder="55"
                value={formData.age}
                onChange={handleChange}
                required
              />
            </div>

            <div className="neu-input-group">
              <label className="neu-label">Gender (Sex) *</label>
              <select name="sex" className="neu-select" value={formData.sex} onChange={handleChange}>
                <option value="1">Male</option>
                <option value="0">Female</option>
              </select>
            </div>

            <div className="neu-input-group">
              <label className="neu-label">Record Date (fixed / unchangeable)</label>
              <div className="locked-date-field">
                <Calendar size={16} />
                <input
                  type="text"
                  name="created_at"
                  className="neu-input"
                  value={formData.created_at || 'Assigned on save: 2026-01-15 09:00:00'}
                  readOnly
                  disabled
                  tabIndex={-1}
                />
                <Lock size={14} />
              </div>
            </div>

            <div className="neu-input-group">
              <label className="neu-label">Phone Number</label>
              <input
                type="text"
                name="phone"
                className="neu-input"
                placeholder="+1 555-0199"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="neu-input-group">
              <label className="neu-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="neu-input"
                placeholder="patient@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="neu-input-group" style={{ gridColumn: 'span 3' }}>
              <label className="neu-label">Address</label>
              <input
                type="text"
                name="address"
                className="neu-input"
                placeholder="Street address, City, State"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="neu-card mb-6">
          <div className="card-header-with-icon">
            <div className="header-icon neu-inset">
              <Heart size={22} color="#6c47ff" />
            </div>
            <div>
              <h2 className="section-title">Clinical Medical Parameters</h2>
              <p className="section-subtitle">Dynamic Kaggle features consumed by the ML model</p>
            </div>
          </div>

          <div className="grid-3 gap-4 mt-4">
            <div className="neu-input-group">
              <label className="neu-label">Chest Pain Type (cp)</label>
              <select name="cp" className="neu-select" value={formData.cp} onChange={handleChange}>
                <option value="0">0: Typical Angina</option>
                <option value="1">1: Atypical Angina</option>
                <option value="2">2: Non-anginal Pain</option>
                <option value="3">3: Asymptomatic</option>
              </select>
            </div>

            <div className="neu-input-group">
              <label className="neu-label">Resting Blood Pressure (trestbps - mm Hg)</label>
              <input
                type="number"
                name="trestbps"
                className="neu-input"
                value={formData.trestbps}
                onChange={handleChange}
                required
              />
            </div>

            <div className="neu-input-group">
              <label className="neu-label">Serum Cholesterol (chol - mg/dl)</label>
              <input
                type="number"
                name="chol"
                className="neu-input"
                value={formData.chol}
                onChange={handleChange}
                required
              />
            </div>

            <div className="neu-input-group">
              <label className="neu-label">Fasting Blood Sugar &gt; 120 mg/dl (fbs)</label>
              <select name="fbs" className="neu-select" value={formData.fbs} onChange={handleChange}>
                <option value="0">0: False (&lt;= 120 mg/dl)</option>
                <option value="1">1: True (&gt; 120 mg/dl)</option>
              </select>
            </div>

            <div className="neu-input-group">
              <label className="neu-label">Resting ECG Results (restecg)</label>
              <select name="restecg" className="neu-select" value={formData.restecg} onChange={handleChange}>
                <option value="0">0: Normal</option>
                <option value="1">1: ST-T Wave Abnormality</option>
                <option value="2">2: Left Ventricular Hypertrophy</option>
              </select>
            </div>

            <div className="neu-input-group">
              <label className="neu-label">Maximum Heart Rate (thalach - bpm)</label>
              <input
                type="number"
                name="thalach"
                className="neu-input"
                value={formData.thalach}
                onChange={handleChange}
                required
              />
            </div>

            <div className="neu-input-group">
              <label className="neu-label">Exercise-Induced Angina (exang)</label>
              <select name="exang" className="neu-select" value={formData.exang} onChange={handleChange}>
                <option value="0">0: No</option>
                <option value="1">1: Yes</option>
              </select>
            </div>

            <div className="neu-input-group">
              <label className="neu-label">ST Depression (oldpeak)</label>
              <input
                type="number"
                step="0.1"
                name="oldpeak"
                className="neu-input"
                value={formData.oldpeak}
                onChange={handleChange}
                required
              />
            </div>

            <div className="neu-input-group">
              <label className="neu-label">Slope of Peak Exercise ST (slope)</label>
              <select name="slope" className="neu-select" value={formData.slope} onChange={handleChange}>
                <option value="0">0: Upsloping</option>
                <option value="1">1: Flat</option>
                <option value="2">2: Downsloping</option>
              </select>
            </div>

            <div className="neu-input-group">
              <label className="neu-label">Major Vessels Colored by Fluoroscopy (ca)</label>
              <select name="ca" className="neu-select" value={formData.ca} onChange={handleChange}>
                <option value="0">0 vessels</option>
                <option value="1">1 vessel</option>
                <option value="2">2 vessels</option>
                <option value="3">3 vessels</option>
                <option value="4">4 vessels</option>
              </select>
            </div>

            <div className="neu-input-group">
              <label className="neu-label">Thalassemia (thal)</label>
              <select name="thal" className="neu-select" value={formData.thal} onChange={handleChange}>
                <option value="0">0: Unknown / not measured</option>
                <option value="1">1: Normal</option>
                <option value="2">2: Fixed Defect</option>
                <option value="3">3: Reversible Defect</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-actions-bar">
          <button
            type="button"
            onClick={() => navigate(isEdit ? `/patients/${id}` : '/patients')}
            className="neu-btn"
          >
            Cancel
          </button>

          <button type="submit" className="neu-btn neu-btn-primary" disabled={loading}>
            <Save size={18} />
            <span>
              {loading
                ? 'Saving...'
                : isEdit
                  ? 'Save Dynamic Fields'
                  : 'Save & Open Profile'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEditPatientPage;
