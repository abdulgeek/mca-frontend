import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { QueryClient, QueryClientProvider } from 'react-query';
import { motion } from 'framer-motion';
import SmartAttendance from './components/SmartAttendance';
import Enrollment from './components/Enrollment';
import Dashboard from './components/Dashboard';
import Health from './components/Health';
import Navigation from './components/Navigation';
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
              <Route path="/health" element={<Health />} />
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
