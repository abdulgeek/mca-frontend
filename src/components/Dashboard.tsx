import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Clock,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  RefreshCw,
  CheckCircle2,
  XCircle,
  MessageCircle,
  UserX,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { apiService } from '../services/api';
import { DashboardStats, ChartData, AbsentStudent } from '../types';
import { toast } from 'react-toastify';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [absentStudents, setAbsentStudents] = useState<AbsentStudent[]>([]);
  const [loadingAbsent, setLoadingAbsent] = useState(false);
  const [showAbsentModal, setShowAbsentModal] = useState(false);

  const fetchDashboardData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await apiService.getAttendanceStats();

      if (response.success) {
        setStats(response.data!);
      } else {
        toast.error('Failed to fetch dashboard data');
      }
    } catch (error: any) {
      console.error('❌ Dashboard data error:', error);
      toast.error(error.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAbsentStudents = async () => {
    try {
      setLoadingAbsent(true);

      // Get yesterday's date (24 hours ago)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      const response = await apiService.getAbsentStudents(dateStr);

      if (response.success && response.data) {
        setAbsentStudents(response.data.absentStudents);
        if (response.data.absentStudents.length > 0) {
          toast.info(`Found ${response.data.absentStudents.length} absent students from yesterday`);
        }
      }
    } catch (error: any) {
      console.error('❌ Absent students error:', error);
      toast.error(error.message || 'Failed to fetch absent students');
    } finally {
      setLoadingAbsent(false);
    }
  };

  const handleWhatsAppClick = (student: AbsentStudent) => {
    window.open(student.whatsappLink, '_blank');
    toast.success(`Opening WhatsApp for ${student.name}`);
  };

  useEffect(() => {
    fetchDashboardData();

    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const chartData: ChartData[] = stats ? [
    { name: 'Present', value: stats.presentToday, color: '#10b981' },
    { name: 'Absent', value: stats.totalStudents - stats.presentToday, color: '#ef4444' }
  ] : [];

  // Use dynamic weekly trend data from API
  const attendanceHistory = stats?.weeklyTrend || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br via-purple-900 from-slate-900 to-slate-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative mb-8">
            <div className="mx-auto w-20 h-20 rounded-full border-4 animate-spin border-white/20 border-t-white"></div>
            <div className="absolute inset-0 mx-auto w-20 h-20 rounded-full border-4 border-transparent animate-spin border-t-blue-400" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-2 text-2xl font-bold text-white"
          >
            Loading Dashboard
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-white/70"
          >
            Preparing your attendance insights...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br via-purple-900 from-slate-900 to-slate-900">
      {/* Animated Background */}
      <div className="overflow-hidden absolute inset-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl animate-pulse bg-purple-500/20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl animate-pulse bg-blue-500/20" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full blur-3xl animate-pulse transform -translate-x-1/2 -translate-y-1/2 bg-indigo-500/10" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 p-6">
        <div className="mx-auto space-y-8 max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex gap-4 items-center mb-6"
            >
              <div className="p-4 rounded-2xl border backdrop-blur-sm bg-white/10 border-white/20">
                <Activity className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-purple-200">
                  Attendance Dashboard
                </h1>
                <p className="mt-2 text-lg text-white/70">Real-time attendance monitoring and analytics</p>
              </div>
            </motion.div>

            <div className="flex gap-3">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchDashboardData(true)}
                disabled={refreshing}
                className="inline-flex gap-3 items-center px-6 py-3 text-white rounded-xl border backdrop-blur-sm transition-all duration-300 bg-white/10 border-white/20 hover:bg-white/20 disabled:opacity-50"
              >
                {refreshing ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  fetchAbsentStudents();
                  setShowAbsentModal(true);
                }}
                disabled={loadingAbsent}
                className="inline-flex gap-3 items-center px-6 py-3 text-white bg-gradient-to-r rounded-xl shadow-lg transition-all duration-300 from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
              >
                {loadingAbsent ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <UserX className="w-5 h-5" />
                )}
                {loadingAbsent ? 'Loading...' : 'Absent Students'}
              </motion.button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="overflow-hidden relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br rounded-2xl backdrop-blur-sm from-blue-500/20 to-blue-600/20"></div>
              <div className="relative p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 border-white/10 bg-white/5 hover:bg-white/10">
                <div className="flex justify-between items-center mb-4">
                  <div className="p-3 rounded-xl bg-blue-500/20">
                    <Users className="w-6 h-6 text-blue-300" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{stats?.totalStudents || 0}</p>
                    <p className="text-sm text-white/70">Total Students</p>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Target className="w-4 h-4 text-blue-300" />
                  <span className="text-sm text-white/70">Active enrollment</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="overflow-hidden relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br rounded-2xl backdrop-blur-sm from-green-500/20 to-green-600/20"></div>
              <div className="relative p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 border-white/10 bg-white/5 hover:bg-white/10">
                <div className="flex justify-between items-center mb-4">
                  <div className="p-3 rounded-xl bg-green-500/20">
                    <UserCheck className="w-6 h-6 text-green-300" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{stats?.presentToday || 0}</p>
                    <p className="text-sm text-white/70">Present Today</p>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <CheckCircle2 className="w-4 h-4 text-green-300" />
                  <span className="text-sm text-white/70">Currently present</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="overflow-hidden relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br rounded-2xl backdrop-blur-sm from-purple-500/20 to-purple-600/20"></div>
              <div className="relative p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 border-white/10 bg-white/5 hover:bg-white/10">
                <div className="flex justify-between items-center mb-4">
                  <div className="p-3 rounded-xl bg-purple-500/20">
                    <TrendingUp className="w-6 h-6 text-purple-300" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{stats?.attendanceRate.toFixed(1) || 0}%</p>
                    <p className="text-sm text-white/70">Attendance Rate</p>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Zap className="w-4 h-4 text-purple-300" />
                  <span className="text-sm text-white/70">Performance metric</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="overflow-hidden relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br rounded-2xl backdrop-blur-sm from-orange-500/20 to-orange-600/20"></div>
              <div className="relative p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 border-white/10 bg-white/5 hover:bg-white/10">
                <div className="flex justify-between items-center mb-4">
                  <div className="p-3 rounded-xl bg-orange-500/20">
                    <Clock className="w-6 h-6 text-orange-300" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">Live</p>
                    <p className="text-sm text-white/70">Real-time</p>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-white/70">Auto-refresh enabled</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Attendance Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="overflow-hidden relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br rounded-2xl backdrop-blur-sm from-indigo-500/10 to-purple-500/10"></div>
              <div className="relative p-6 rounded-2xl border backdrop-blur-sm border-white/10 bg-white/5">
                <div className="flex gap-3 items-center mb-6">
                  <div className="p-2 rounded-lg bg-indigo-500/20">
                    <PieChart className="w-6 h-6 text-indigo-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Today's Distribution</h3>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Weekly Trend */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="overflow-hidden relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br rounded-2xl backdrop-blur-sm from-emerald-500/10 to-teal-500/10"></div>
              <div className="relative p-6 rounded-2xl border backdrop-blur-sm border-white/10 bg-white/5">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-3 items-center">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <BarChart3 className="w-6 h-6 text-emerald-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Weekly Trend</h3>
                  </div>
                  {refreshing && (
                    <div className="flex gap-2 items-center">
                      <RefreshCw className="w-4 h-4 text-emerald-300 animate-spin" />
                      <span className="text-sm text-white/70">Updating...</span>
                    </div>
                  )}
                </div>

                {attendanceHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={attendanceHistory}>
                      <defs>
                        <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="absentGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis dataKey="name" stroke="rgba(255, 255, 255, 0.7)" />
                      <YAxis stroke="rgba(255, 255, 255, 0.7)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                        formatter={(value, name) => [value, name === 'present' ? 'Present' : 'Absent']}
                        labelFormatter={(label) => `Day: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="present"
                        stackId="1"
                        stroke="#10b981"
                        fill="url(#presentGradient)"
                        strokeWidth={3}
                        name="Present"
                      />
                      <Area
                        type="monotone"
                        dataKey="absent"
                        stackId="1"
                        stroke="#ef4444"
                        fill="url(#absentGradient)"
                        strokeWidth={3}
                        name="Absent"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex justify-center items-center h-64 text-white/70">
                    <div className="text-center">
                      <BarChart3 className="mx-auto mb-4 w-16 h-16 text-white/30" />
                      <p className="text-lg font-medium">No attendance data available</p>
                      <p className="text-sm">Weekly trend will appear once attendance is recorded</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Recent Attendance */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="overflow-hidden relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br rounded-2xl backdrop-blur-sm from-rose-500/10 to-pink-500/10"></div>
            <div className="relative p-6 rounded-2xl border backdrop-blur-sm border-white/10 bg-white/5">
              <div className="flex gap-3 items-center mb-6">
                <div className="p-2 rounded-lg bg-rose-500/20">
                  <Clock className="w-6 h-6 text-rose-300" />
                </div>
                <h3 className="text-xl font-semibold text-white">Recent Attendance</h3>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {stats?.recentAttendance && stats.recentAttendance.length > 0 ? (
                    stats.recentAttendance.map((attendance, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex justify-between items-center p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 bg-white/5 border-white/10 hover:bg-white/10"
                      >
                        <div className="flex gap-4 items-center">
                          <div className={`w-3 h-3 rounded-full ${attendance.status === 'present' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                          <div>
                            <p className="font-medium text-white">{(attendance as any).studentName || 'Unknown Student'}</p>
                            <p className="text-sm text-white/70">ID: {attendance.studentId}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-white">
                            {new Date(attendance.timeIn).toLocaleTimeString()}
                          </p>
                          <p className="flex gap-1 items-center text-xs capitalize text-white/70">
                            {attendance.status === 'present' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {attendance.status}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-12 text-center text-white/70"
                    >
                      <Clock className="mx-auto mb-4 w-16 h-16 text-white/30" />
                      <p className="text-lg font-medium">No recent attendance</p>
                      <p className="text-sm">Attendance records will appear here</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Absent Students Modal */}
        <AnimatePresence>
          {showAbsentModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowAbsentModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="overflow-hidden relative w-full max-w-4xl max-h-[90vh]"
              >
                <div className="absolute inset-0 bg-gradient-to-br rounded-3xl from-red-500/20 to-orange-500/20"></div>
                <div className="relative p-8 overflow-y-auto rounded-3xl border max-h-[90vh] backdrop-blur-sm bg-slate-900/95 border-white/20">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex gap-3 items-center">
                      <div className="p-3 bg-red-500/20 rounded-xl">
                        <UserX className="w-6 h-6 text-red-300" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Absent Students</h3>
                        <p className="text-white/70">Yesterday's absent students - Send WhatsApp notifications</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAbsentModal(false)}
                      className="p-2 text-white rounded-xl transition-colors hover:bg-white/10"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Absent Students List */}
                  {loadingAbsent ? (
                    <div className="flex flex-col gap-3 justify-center items-center py-12">
                      <RefreshCw className="w-12 h-12 text-white animate-spin" />
                      <p className="text-white/70">Loading absent students...</p>
                    </div>
                  ) : absentStudents.length === 0 ? (
                    <div className="flex flex-col gap-3 justify-center items-center py-12 text-white/70">
                      <CheckCircle2 className="w-16 h-16 text-green-400" />
                      <p className="text-lg font-medium">No absent students yesterday!</p>
                      <p className="text-sm">All students marked their attendance.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {absentStudents.map((student, index) => (
                        <motion.div
                          key={student._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex gap-4 justify-between items-center p-5 rounded-xl border backdrop-blur-sm transition-all duration-300 bg-white/5 border-white/10 hover:bg-white/10"
                        >
                          <div className="flex gap-4 items-center flex-1">
                            <div className="flex flex-col justify-center items-center p-3 bg-red-500/20 rounded-xl">
                              <UserX className="w-6 h-6 text-red-300" />
                            </div>
                            <div>
                              <p className="font-bold text-white">{student.name}</p>
                              <p className="text-sm text-white/70">ID: {student.studentId}</p>
                              <p className="text-sm text-white/60">{student.course}</p>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleWhatsAppClick(student)}
                            className="flex gap-2 items-center px-5 py-3 font-semibold text-white bg-gradient-to-r rounded-xl shadow-lg transition-all duration-300 from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                          >
                            <MessageCircle className="w-5 h-5" />
                            Send WhatsApp
                            <ExternalLink className="w-4 h-4" />
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  {absentStudents.length > 0 && (
                    <div className="mt-6 p-4 rounded-xl border bg-white/5 border-white/10">
                      <p className="text-sm text-white/70">
                        💡 <strong>Tip:</strong> Click "Send WhatsApp" to open WhatsApp with a pre-filled absence notification message for each student.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;