import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse, Mail, Lock, User, Award, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialization, setSpecialization] = useState('Cardiology Specialist');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await register({ name, email, password, specialization });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card neu-card">
        <div className="auth-brand-header">
          <div className="brand-logo-icon large">
            <HeartPulse size={32} color="#6c47ff" />
          </div>
          <h1 className="auth-title">Doctor Registration</h1>
          <p className="auth-subtitle">Join CardioCare AI Decision Support Network</p>
        </div>

        {error && <Toast message={error} type="error" onClose={() => setError('')} />}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="neu-input-group">
            <label className="neu-label">Full Name</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                type="text"
                className="neu-input"
                placeholder="Dr. Alexander Wright"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="neu-input-group">
            <label className="neu-label">Medical Email</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                className="neu-input"
                placeholder="doctor.wright@hospital.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="neu-input-group">
            <label className="neu-label">Specialization</label>
            <div className="input-with-icon">
              <Award size={18} className="input-icon" />
              <input
                type="text"
                className="neu-input"
                placeholder="Interventional Cardiology"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
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
            {loading ? 'Creating Account...' : 'Register Doctor Profile'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-footer-text">
          <span>Already registered?</span>
          <Link to="/login" className="auth-link">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
