import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Activity,
  Zap,
  Shield,
  Scan,
  UserPlus,
} from 'lucide-react';

const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Attendance', icon: Scan },
    { path: '/enroll', label: 'Enrollment', icon: UserPlus },
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/students', label: 'Students', icon: Shield },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="relative border-b shadow-2xl backdrop-blur-md bg-white/10 border-white/20"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5"></div>

      <div className="relative z-10 px-6 mx-auto max-w-7xl">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex gap-4 items-center group">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="relative"
            >
              <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-200">
                MCA
              </h1>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex gap-2 items-center">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative group"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300 ${isActive
                      ? 'text-white shadow-lg bg-white/20'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold">{item.label}</span>

                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r rounded-xl from-blue-500/20 to-purple-500/20 -z-10"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}

                    {/* Hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-r rounded-xl opacity-0 transition-opacity duration-300 from-blue-500/10 to-purple-500/10 group-hover:opacity-100 -z-10"></div>
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* Status Indicator */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-3 items-center px-4 py-2 rounded-xl border backdrop-blur-sm bg-white/10 border-white/20"
          >
            <div className="flex gap-2 items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-white">System Online</span>
            </div>
            <div className="flex gap-1 items-center">
              <Shield className="w-4 h-4 text-green-500" />
              <Zap className="w-4 h-4 text-blue-500" />
            </div>
          </motion.div>
        </div>
      </div >
    </motion.nav >
  );
};

export default Navigation;