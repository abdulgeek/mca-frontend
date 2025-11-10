import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { QueryClient, QueryClientProvider } from 'react-query';
import { motion } from 'framer-motion';
import SmartAttendance from './components/SmartAttendance';
import Enrollment from './components/Enrollment';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import Navigation from './components/Navigation';
import PinGate from './components/PinGate';
import { pinService } from './services/pinService';
import 'react-toastify/dist/ReactToastify.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  // Check authentication state on mount
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = pinService.isAuthenticated();
      setIsAuthenticated(authenticated);
      setIsChecking(false);
    };

    checkAuth();

    // Listen for logout events
    const handleLogout = () => {
      setIsAuthenticated(false);
    };

    window.addEventListener('pin-logout', handleLogout);

    // Cleanup event listener
    return () => {
      window.removeEventListener('pin-logout', handleLogout);
    };
  }, []);

  // Handle successful authentication
  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br via-purple-900 from-slate-900 to-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Show PIN gate if not authenticated
  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <PinGate onAuthenticated={handleAuthenticated} />
      </QueryClientProvider>
    );
  }

  // Show main app if authenticated
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gradient-to-br via-purple-900 from-slate-900 to-slate-900">
          <Navigation />

          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <Routes>
              <Route path="/" element={<SmartAttendance />} />
              <Route path="/enroll" element={<Enrollment />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/students" element={<Students />} />
            </Routes>
          </motion.main>

          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
            toastClassName="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20"
            bodyClassName="font-medium text-white"
            progressClassName="bg-gradient-to-r from-blue-500 to-purple-500"
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
