import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Recordings from './pages/Recordings';
// RecordingDetail removed — Analysis handles all recording views
import Contacts from './pages/Contacts';
import Settings from './pages/Settings';
import Landing from './pages/Landing';
import Analysis from './pages/Analysis';
import Simulator from './pages/Simulator';

// Placeholder for protected pages
// Placeholder for other pages

const ProtectedRoute = ({ children }) => {
  const { session, isLoading } = useAuthStore();
  if (isLoading) return <div className="h-screen flex items-center justify-center text-gray-500 bg-[#F6F8FC]">Loading...</div>;
  if (!session) return <Navigate to="/login" />;
  return children;
};

export default function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/recordings" 
          element={<ProtectedRoute><Recordings /></ProtectedRoute>} 
        />
        <Route 
          path="/recordings/:id" 
          element={<ProtectedRoute><Analysis /></ProtectedRoute>} 
        />
        <Route 
          path="/analysis" 
          element={<ProtectedRoute><Analysis /></ProtectedRoute>} 
        />
        <Route 
          path="/analysis/:id" 
          element={<ProtectedRoute><Analysis /></ProtectedRoute>} 
        />
        <Route 
          path="/contacts" 
          element={<ProtectedRoute><Contacts /></ProtectedRoute>} 
        />
        <Route 
          path="/simulator" 
          element={<ProtectedRoute><Simulator /></ProtectedRoute>} 
        />
        <Route 
          path="/settings" 
          element={<ProtectedRoute><Settings /></ProtectedRoute>} 
        />
        <Route path="/" element={<Landing />} />
      </Routes>
    </Router>
  );
}
