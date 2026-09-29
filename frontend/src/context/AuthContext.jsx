import React, { createContext, useState, useEffect, useContext } from 'react';
import { getCurrentDoctor, loginDoctor as apiLogin, registerDoctor as apiRegister } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('cardiocare_token');
      if (token) {
        try {
          const res = await getCurrentDoctor();
          setDoctor(res.doctor);
        } catch (err) {
          console.error("Token verification failed:", err);
          localStorage.removeItem('cardiocare_token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials) => {
    const res = await apiLogin(credentials);
    if (res.token) {
      localStorage.setItem('cardiocare_token', res.token);
      setDoctor(res.doctor);
    }
    return res;
  };

  const register = async (doctorData) => {
    const res = await apiRegister(doctorData);
    if (res.token) {
      localStorage.setItem('cardiocare_token', res.token);
      setDoctor(res.doctor);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('cardiocare_token');
    setDoctor(null);
  };

  return (
    <AuthContext.Provider value={{ doctor, loading, login, register, logout, isAuthenticated: !!doctor }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
