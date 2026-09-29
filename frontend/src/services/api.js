import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cardiocare_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Auth API
export const loginDoctor = async (credentials) => {
  const res = await api.post('/auth/login', credentials);
  return res.data;
};

export const registerDoctor = async (doctorData) => {
  const res = await api.post('/auth/register', doctorData);
  return res.data;
};

export const getCurrentDoctor = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

// Patients API
export const getPatients = async (params = {}) => {
  const res = await api.get('/patients', { params });
  return res.data;
};

export const getPatientDetail = async (id) => {
  const res = await api.get(`/patients/${id}`);
  return res.data;
};

export const createPatient = async (patientData) => {
  const res = await api.post('/patients', patientData);
  return res.data;
};

export const updatePatient = async (id, patientData) => {
  const res = await api.put(`/patients/${id}`, patientData);
  return res.data;
};

export const deletePatient = async (id) => {
  const res = await api.delete(`/patients/${id}`);
  return res.data;
};

// Predictions API
export const runPrediction = async (patientId, payload = {}) => {
  const res = await api.post(`/predictions/patients/${patientId}/predict`, payload);
  return res.data;
};

export const getPredictions = async (params = {}) => {
  const res = await api.get('/predictions', { params });
  return res.data;
};

export const getPredictionDetail = async (id) => {
  const res = await api.get(`/predictions/${id}`);
  return res.data;
};

export const getPatientPredictionHistory = async (patientId) => {
  const res = await api.get(`/predictions/patients/${patientId}/history`);
  return res.data;
};

// Analytics API
export const getDashboardSummary = async () => {
  const res = await api.get('/analytics/dashboard');
  return res.data;
};

export const getPatientAnalytics = async () => {
  const res = await api.get('/analytics/patients');
  return res.data;
};

export const getPredictionAnalytics = async () => {
  const res = await api.get('/analytics/predictions');
  return res.data;
};

// Model Metrics API
export const getModelMetrics = async () => {
  const res = await api.get('/model/metrics');
  return res.data;
};

// Report PDF Download trigger
export const downloadPatientPDF = (patientId) => {
  const token = localStorage.getItem('cardiocare_token');
  const downloadUrl = `/api/reports/patient/${patientId}?token=${token || ''}`;
  window.open(downloadUrl, '_blank');
};

export default api;
