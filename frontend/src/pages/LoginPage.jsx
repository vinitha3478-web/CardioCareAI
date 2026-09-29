import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse, Mail, Lock, ArrowRight, Stethoscope } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

const LoginPage = () => {
  const [email, setEmail] = useState('doctor@cardiocare.ai');
  const [password, setPassword] = useState('doctor123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials or server error');
    } finally {
      setLoading(false);
    }
  };

  const autofillDemo = () => {
    setEmail('doctor@cardiocare.ai');
    setPassword('doctor123');
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card neu-card">
        <div className="auth-brand-header">
          <div className="brand-logo-icon large">
            <HeartPulse size={32} color="#6c47ff" />
          </div>
          <h1 className="auth-title">CardioCare <span>AI</span></h1>
          <p className="auth-subtitle">Heart Disease Prediction & Patient Management</p>
        </div>

        {error && <Toast message={error} type="error" onClose={() => setError('')} />}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="neu-input-group">
            <label className="neu-label">Doctor Email</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                className="neu-input"
                placeholder="doctor@cardiocare.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="neu-input-group">
            <label className="neu-label">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                className="neu-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="neu-btn neu-btn-primary auth-submit-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Sign In as Doctor'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-demo-box neu-inset" onClick={autofillDemo}>
          <div className="demo-box-header">
            <Stethoscope size={16} color="#6c47ff" />
            <span>Click to fill Demo Doctor Credentials</span>
          </div>
          <p className="demo-credentials">email: <b>doctor@cardiocare.ai</b> | pass: <b>doctor123</b></p>
        </div>

        <div className="auth-footer-text">
          <span>Don't have a doctor account?</span>
          <Link to="/register" className="auth-link">Register Doctor</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
