import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check localStorage for token on mount
    const storedUser = localStorage.getItem('vivid_user');
    const storedToken = localStorage.getItem('vivid_token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('vivid_user', JSON.stringify(userData));
    localStorage.setItem('vivid_token', authToken);
    navigate('/dashboard/simulate');
  };

  const logout = async () => {
    setIsLoggingOut(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Artificial delay for realism
    setUser(null);
    setToken(null);
    localStorage.removeItem('vivid_user');
    localStorage.removeItem('vivid_token');
    setIsLoggingOut(false);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, isLoggingOut, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
