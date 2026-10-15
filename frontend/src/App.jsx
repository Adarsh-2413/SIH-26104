import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/dashboard/DashboardLayout';
import DashboardOverview from './components/dashboard/DashboardOverview';
import LiveCallInterface from './components/dashboard/LiveCallInterface';
import DashboardHistory from './components/dashboard/DashboardHistory';
import DashboardSettings from './components/dashboard/DashboardSettings';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-[#050505] font-sans selection:bg-accent/30 selection:text-white">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="simulate" element={<LiveCallInterface />} />
              <Route path="history" element={<ProtectedRoute><DashboardHistory /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute><DashboardSettings /></ProtectedRoute>} />
            </Route>
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
