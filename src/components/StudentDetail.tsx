import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Mail,
    Phone,
    BookOpen,
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    Edit,
    UserX,
    UserCheck,
    RefreshCw,
    ScanFace,
    Fingerprint
} from 'lucide-react';
import { toast } from 'react-toastify';
import { apiService } from '../services/api';
import { StudentDetail as StudentDetailType, AttendanceCalendarDay, Attendance } from '../types';
import AttendanceCalendar from './AttendanceCalendar';
import EditStudent from './EditStudent';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface StudentDetailProps {
    studentId: string;
    isOpen: boolean;
    onClose: () => void;
}

const StudentDetail: React.FC<StudentDetailProps> = ({ studentId, isOpen, onClose }) => {
    const [studentDetail, setStudentDetail] = useState<StudentDetailType | null>(null);
    const [calendarData, setCalendarData] = useState<AttendanceCalendarDay[]>([]);
    const [recentAttendance, setRecentAttendance] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingCalendar, setLoadingCalendar] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        if (isOpen && studentId) {
            fetchStudentDetails();
            fetchCalendarData();
        }
    }, [isOpen, studentId]);

    useEffect(() => {
        if (isOpen && studentId) {
            fetchCalendarData();
        }
    }, [currentMonth]);

    const fetchStudentDetails = async () => {
        try {
            setLoading(true);
            const response = await apiService.getStudentById(studentId);

            if (response.success && response.data) {
                setStudentDetail(response.data);

                // Fetch recent attendance
                const attendanceResponse = await apiService.getStudentAttendance(
                    response.data.student.studentId
                );

                if (attendanceResponse.success && attendanceResponse.data) {
                    setRecentAttendance(attendanceResponse.data.slice(0, 10));
                }
            } else {
                toast.error('Failed to fetch student details');
            }
        } catch (error: any) {
            console.error('❌ Fetch student details error:', error);
            toast.error(error.message || 'Failed to fetch student details');
        } finally {
            setLoading(false);
        }
    };

    const fetchCalendarData = async () => {
        try {
            setLoadingCalendar(true);

            // Get first and last day of current month
            const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

            const response = await apiService.getStudentCalendar(
                studentId,
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
            );

            if (response.success && response.data) {
                setCalendarData(response.data);
            }
        } catch (error: any) {
            console.error('❌ Fetch calendar error:', error);
        } finally {
            setLoadingCalendar(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!studentDetail) return;

        try {
            const response = await apiService.toggleStudentStatus(studentId);

            if (response.success) {
                toast.success(response.message);
                fetchStudentDetails();
            } else {
                toast.error(response.message);
            }
        } catch (error: any) {
            console.error('❌ Toggle status error:', error);
            toast.error(error.message || 'Failed to update student status');
        }
    };

    const handleDateClick = (day: AttendanceCalendarDay) => {
        if (day.status === 'none') return;

        const timeIn = day.timeIn ? new Date(day.timeIn).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        }) : 'N/A';

        const timeOut = day.timeOut ? new Date(day.timeOut).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Not logged out';

        const duration = day.duration ? formatDuration(day.duration) : 'N/A';

        toast.info(
            <div>
                <p className="font-semibold">{new Date(day.date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                })}</p>
                <p className="text-sm">Status: <span className="capitalize">{day.status}</span></p>
                <p className="text-sm">Time In: {timeIn}</p>
                <p className="text-sm">Time Out: {timeOut}</p>
                <p className="text-sm">Duration: {duration}</p>
                {day.location && <p className="text-sm">Location: {day.location}</p>}
            </div>,
            { autoClose: 8000 }
        );
    };

    const formatDuration = (duration: number) => {
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    if (!isOpen) return null;

    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black/70 backdrop-blur-sm"
            >
                <div className="text-center">
                    <RefreshCw className="mx-auto mb-4 w-12 h-12 text-white animate-spin" />
                    <p className="text-white">Loading student details...</p>
                </div>
            </motion.div>
        );
    }

    if (!studentDetail) {
        return null;
    }

    const { student, attendanceStats } = studentDetail;

    const chartData = [
        { name: 'Present', value: attendanceStats.presentDays, color: '#10b981' },
        { name: 'Absent', value: attendanceStats.absentDays, color: '#ef4444' }
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-y-auto fixed inset-0 z-50 p-4 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative mx-auto my-8 max-w-6xl"
                >
                    <div className="overflow-hidden rounded-3xl border shadow-2xl backdrop-blur-sm bg-slate-900/95 border-white/20">
                        {/* Header */}
                        <div className="relative p-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 text-white rounded-xl transition-colors hover:bg-white/10"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="flex flex-wrap gap-6 items-start">
                                {/* Profile Image */}
                                <div className="relative">
                                    {student.profileImageUrl ? (
                                        <img
                                            src={student.profileImageUrl}
                                            alt={student.name}
                                            className="object-cover w-24 h-24 rounded-2xl ring-4 ring-white/20"
                                        />
                                    ) : (
                                        <div className="flex justify-center items-center w-24 h-24 text-3xl font-bold text-white bg-gradient-to-br rounded-2xl from-blue-500 to-purple-500 ring-4 ring-white/20">
                                            {student.name.charAt(0)}
                                        </div>
                                    )}
                                    {student.isActive ? (
                                        <div className="absolute -bottom-2 -right-2 p-2 bg-green-500 rounded-full ring-4 ring-slate-900">
                                            <UserCheck className="w-4 h-4 text-white" />
                                        </div>
                                    ) : (
                                        <div className="absolute -bottom-2 -right-2 p-2 bg-red-500 rounded-full ring-4 ring-slate-900">
                                            <UserX className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </div>

                                {/* Student Info */}
                                <div className="flex-1">
                                    <h2 className="mb-1 text-3xl font-bold text-white">{student.name}</h2>
                                    <p className="mb-3 text-lg text-white/70">ID: {student.studentId}</p>

                                    <div className="flex flex-wrap gap-2">
                                        {student.biometricMethods.includes('face') && (
                                            <span className="inline-flex gap-1 items-center px-3 py-1 text-sm font-medium text-purple-300 rounded-full bg-purple-500/20">
                                                <ScanFace className="w-4 h-4" />
                                                Face Recognition
                                            </span>
                                        )}
                                        {student.biometricMethods.includes('fingerprint') && (
                                            <span className="inline-flex gap-1 items-center px-3 py-1 text-sm font-medium text-orange-300 rounded-full bg-orange-500/20">
                                                <Fingerprint className="w-4 h-4" />
                                                Fingerprint
                                            </span>
                                        )}
                                        <span className={`inline-flex gap-1 items-center px-3 py-1 text-sm font-medium rounded-full ${student.isActive
                                            ? 'bg-green-500/20 text-green-300'
                                            : 'bg-red-500/20 text-red-300'
                                            }`}>
                                            {student.isActive ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                                            {student.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowEditModal(true)}
                                        className="inline-flex gap-2 items-center px-4 py-2 font-medium text-white bg-blue-500 rounded-xl transition-colors hover:bg-blue-600"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleToggleStatus}
                                        className={`inline-flex gap-2 items-center px-4 py-2 font-medium text-white rounded-xl transition-colors ${student.isActive
                                            ? 'bg-red-500 hover:bg-red-600'
                                            : 'bg-green-500 hover:bg-green-600'
                                            }`}
                                    >
                                        {student.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                        {student.isActive ? 'Deactivate' : 'Activate'}
                                    </motion.button>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-6">
                            {/* Contact Info Grid */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="p-4 rounded-xl border backdrop-blur-sm bg-white/5 border-white/10">
                                    <div className="flex gap-3 items-center">
                                        <div className="p-2 bg-blue-500/20 rounded-lg">
                                            <Mail className="w-5 h-5 text-blue-300" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/70">Email</p>
                                            <p className="font-medium text-white">{student.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl border backdrop-blur-sm bg-white/5 border-white/10">
                                    <div className="flex gap-3 items-center">
                                        <div className="p-2 bg-green-500/20 rounded-lg">
                                            <Phone className="w-5 h-5 text-green-300" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/70">Phone</p>
                                            <p className="font-medium text-white">{student.phone}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl border backdrop-blur-sm bg-white/5 border-white/10">
                                    <div className="flex gap-3 items-center">
                                        <div className="p-2 bg-purple-500/20 rounded-lg">
                                            <BookOpen className="w-5 h-5 text-purple-300" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/70">Course</p>
                                            <p className="font-medium text-white">{student.course}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Statistics */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Stats Cards */}
                                <div className="space-y-4">
                                    <h3 className="text-xl font-semibold text-white">Attendance Statistics</h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl border backdrop-blur-sm bg-white/5 border-white/10">
                                            <p className="text-sm text-white/70">Total Days</p>
                                            <p className="text-2xl font-bold text-white">{attendanceStats.totalDays}</p>
                                        </div>

                                        <div className="p-4 rounded-xl border backdrop-blur-sm bg-white/5 border-white/10">
                                            <p className="text-sm text-white/70">Present Days</p>
                                            <p className="text-2xl font-bold text-green-400">{attendanceStats.presentDays}</p>
                                        </div>

                                        <div className="p-4 rounded-xl border backdrop-blur-sm bg-white/5 border-white/10">
                                            <p className="text-sm text-white/70">Absent Days</p>
                                            <p className="text-2xl font-bold text-red-400">{attendanceStats.absentDays}</p>
                                        </div>

                                        <div className="p-4 rounded-xl border backdrop-blur-sm bg-white/5 border-white/10">
                                            <p className="text-sm text-white/70">Attendance Rate</p>
                                            <p className="text-2xl font-bold text-white">{attendanceStats.attendancePercentage.toFixed(1)}%</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Pie Chart */}
                                <div className="p-6 rounded-xl border backdrop-blur-sm bg-white/5 border-white/10">
                                    <h3 className="mb-4 text-lg font-semibold text-white">Attendance Distribution</h3>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <RechartsPieChart>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
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
                            </div>

                            {/* Calendar */}
                            <div>
                                <h3 className="mb-4 text-xl font-semibold text-white">Attendance Calendar</h3>
                                {loadingCalendar ? (
                                    <div className="flex justify-center items-center py-12">
                                        <RefreshCw className="w-8 h-8 text-white animate-spin" />
                                    </div>
                                ) : (
                                    <AttendanceCalendar
                                        calendarData={calendarData}
                                        onDateClick={handleDateClick}
                                        currentMonth={currentMonth}
                                        onMonthChange={setCurrentMonth}
                                    />
                                )}
                            </div>

                            {/* Recent Attendance */}
                            <div>
                                <h3 className="mb-4 text-xl font-semibold text-white">Recent Attendance</h3>
                                <div className="space-y-3">
                                    {recentAttendance.length === 0 ? (
                                        <div className="py-12 text-center text-white/70">
                                            <CalendarIcon className="mx-auto mb-4 w-16 h-16 text-white/30" />
                                            <p>No attendance records yet</p>
                                        </div>
                                    ) : (
                                        recentAttendance.map((attendance, index) => (
                                            <motion.div
                                                key={attendance._id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="flex justify-between items-center p-4 rounded-xl border backdrop-blur-sm bg-white/5 border-white/10"
                                            >
                                                <div className="flex gap-4 items-center">
                                                    <div className={`w-3 h-3 rounded-full ${attendance.status === 'present' ? 'bg-green-400' : 'bg-red-400'
                                                        }`}></div>
                                                    <div>
                                                        <p className="font-medium text-white">
                                                            {new Date(attendance.date).toLocaleDateString('en-US', {
                                                                month: 'long',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </p>
                                                        <div className="flex gap-4 text-sm text-white/70">
                                                            <span className="flex gap-1 items-center">
                                                                <Clock className="w-3 h-3" />
                                                                {new Date(attendance.timeIn).toLocaleTimeString('en-US', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </span>
                                                            {attendance.location && (
                                                                <span className="flex gap-1 items-center">
                                                                    <MapPin className="w-3 h-3" />
                                                                    {attendance.location}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 text-sm font-medium rounded-full capitalize ${attendance.status === 'present'
                                                    ? 'bg-green-500/20 text-green-300'
                                                    : 'bg-red-500/20 text-red-300'
                                                    }`}>
                                                    {attendance.status}
                                                </span>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Edit Modal */}
            {showEditModal && (
                <EditStudent
                    student={student}
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={() => {
                        setShowEditModal(false);
                        fetchStudentDetails();
                    }}
                />
            )}
        </AnimatePresence>
    );
};

export default StudentDetail;

