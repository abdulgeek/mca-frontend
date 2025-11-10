import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Search,
    Eye,
    UserX,
    UserCheck,
    Fingerprint,
    ScanFace,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Plus
} from 'lucide-react';
import { toast } from 'react-toastify';
import { apiService } from '../services/api';
import { StudentListItem } from '../types';
import StudentDetail from './StudentDetail';
import StudentIDCard from './StudentIDCard';
import { useNavigate } from 'react-router-dom';

const COURSES = [
    '1st Standard', '2nd Standard', '3rd Standard', '4th Standard', '5th Standard',
    '6th Standard', '7th Standard', '8th Standard', '9th Standard', '10th Standard',
    '1st PUC - Science', '1st PUC - Commerce',
    '2nd PUC - Science', '2nd PUC - Commerce',
    'Degree - MCA', 'Degree - BCA', 'Degree - B.Com', 'Degree - B.Sc', 'Degree - BA', 'Degree - Other',
    'DCA', 'Programming', 'DCAD'
];

const Students: React.FC = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState<StudentListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filters and search
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [biometricFilter, setBiometricFilter] = useState<'all' | 'face' | 'fingerprint'>('all');
    const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'excellent' | 'good' | 'average' | 'poor'>('all');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalStudents, setTotalStudents] = useState(0);
    const studentsPerPage = 20;

    // Sorting
    const [sortBy, setSortBy] = useState<string>('enrolledAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Modals
    const [selectedStudent, setSelectedStudent] = useState<StudentListItem | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Store all students from API
    const [allStudents, setAllStudents] = useState<StudentListItem[]>([]);

    // Fetch students from API (fetch once)
    const fetchStudents = async (showRefresh = false) => {
        try {
            if (showRefresh) setRefreshing(true);
            else setLoading(true);

            const response = await apiService.getAllStudents({
                page: 1,
                limit: 1000 // Fetch all students at once for frontend filtering
            });

            if (response.success && response.data) {
                setAllStudents(response.data.students);
            } else {
                toast.error('Failed to fetch students');
            }
        } catch (error: any) {
            console.error('❌ Fetch students error:', error);
            toast.error(error.message || 'Failed to fetch students');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Apply filters and search on frontend
    useEffect(() => {
        let filteredData = [...allStudents];

        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filteredData = filteredData.filter(s =>
                s.name.toLowerCase().includes(search) ||
                s.studentId.toLowerCase().includes(search) ||
                s.email.toLowerCase().includes(search)
            );
        }

        // Course filter
        if (selectedCourse) {
            filteredData = filteredData.filter(s => s.course === selectedCourse);
        }

        // Status filter
        if (statusFilter === 'active') {
            filteredData = filteredData.filter(s => s.isActive);
        } else if (statusFilter === 'inactive') {
            filteredData = filteredData.filter(s => !s.isActive);
        }

        // Biometric filter
        if (biometricFilter !== 'all') {
            filteredData = filteredData.filter(s => s.biometricMethods.includes(biometricFilter));
        }

        // Attendance percentage filter
        if (attendanceFilter !== 'all') {
            filteredData = filteredData.filter(s => {
                const percentage = s.attendancePercentage;
                switch (attendanceFilter) {
                    case 'excellent':
                        return percentage >= 90;
                    case 'good':
                        return percentage >= 70 && percentage < 90;
                    case 'average':
                        return percentage >= 50 && percentage < 70;
                    case 'poor':
                        return percentage < 50;
                    default:
                        return true;
                }
            });
        }

        // Apply sorting
        filteredData.sort((a, b) => {
            let aValue: any = a[sortBy as keyof StudentListItem];
            let bValue: any = b[sortBy as keyof StudentListItem];

            // Handle string comparison
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        // Apply pagination
        const startIndex = (currentPage - 1) * studentsPerPage;
        const endIndex = startIndex + studentsPerPage;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        setStudents(paginatedData);
        setTotalStudents(filteredData.length);
        setTotalPages(Math.ceil(filteredData.length / studentsPerPage));
    }, [allStudents, searchTerm, selectedCourse, statusFilter, biometricFilter, attendanceFilter, currentPage, sortBy, sortOrder, studentsPerPage]);

    // Fetch data on mount
    useEffect(() => {
        fetchStudents();
    }, []);

    // Statistics (based on all students, not just paginated view)
    const stats = useMemo(() => {
        const activeStudents = allStudents.filter(s => s.isActive).length;
        const faceEnrolled = allStudents.filter(s => s.biometricMethods.includes('face')).length;
        const fingerprintEnrolled = allStudents.filter(s => s.biometricMethods.includes('fingerprint')).length;

        return { activeStudents, faceEnrolled, fingerprintEnrolled };
    }, [allStudents]);

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const handleViewStudent = (student: StudentListItem) => {
        setSelectedStudent(student);
        setShowDetailModal(true);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCourse, statusFilter, biometricFilter, attendanceFilter]);

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
                    </div>
                    <motion.h3 className="mb-2 text-2xl font-bold text-white">
                        Loading Students
                    </motion.h3>
                    <motion.p className="text-white/70">
                        Preparing student list...
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
            </div>

            <div className="relative z-10 p-6">
                <div className="overflow-visible mx-auto space-y-6 max-w-7xl">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-wrap gap-4 justify-between items-center"
                    >
                        <div className="flex gap-4 items-center">
                            <div className="p-4 rounded-2xl border backdrop-blur-sm bg-white/10 border-white/20">
                                <Users className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-purple-200">
                                    Student Management
                                </h1>
                                <p className="mt-1 text-white/70">Manage students and view attendance records</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => fetchStudents(true)}
                                disabled={refreshing}
                                className="inline-flex gap-2 items-center px-4 py-2 text-white rounded-xl border backdrop-blur-sm transition-all duration-300 bg-white/10 border-white/20 hover:bg-white/20"
                            >
                                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                                {refreshing ? 'Refreshing...' : 'Refresh'}
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/enroll')}
                                className="inline-flex gap-2 items-center px-6 py-2 font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg transition-all duration-300 hover:from-blue-600 hover:to-purple-600"
                            >
                                <Plus className="w-5 h-5" />
                                Add Student
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="p-6 rounded-xl border backdrop-blur-sm bg-white/5 border-white/10"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-white/70">Total Students</p>
                                    <p className="text-3xl font-bold text-white">{totalStudents}</p>
                                </div>
                                <Users className="w-10 h-10 text-blue-400" />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="p-6 rounded-xl border backdrop-blur-sm bg-white/5 border-white/10"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-white/70">Active Students</p>
                                    <p className="text-3xl font-bold text-white">{stats.activeStudents}</p>
                                </div>
                                <UserCheck className="w-10 h-10 text-green-400" />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="p-6 rounded-xl border backdrop-blur-sm bg-white/5 border-white/10"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-white/70">Face Enrolled</p>
                                    <p className="text-3xl font-bold text-white">{stats.faceEnrolled}</p>
                                </div>
                                <ScanFace className="w-10 h-10 text-purple-400" />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="p-6 rounded-xl border backdrop-blur-sm bg-white/5 border-white/10"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-white/70">Fingerprint Enrolled</p>
                                    <p className="text-3xl font-bold text-white">{stats.fingerprintEnrolled}</p>
                                </div>
                                <Fingerprint className="w-10 h-10 text-orange-400" />
                            </div>
                        </motion.div>
                    </div>

                    {/* Search and Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="overflow-visible relative p-6 rounded-xl border backdrop-blur-sm bg-white/5 border-white/10"
                    >
                        <div className="flex flex-wrap gap-4 items-center">
                            {/* Search */}
                            <div className="flex-1 min-w-[300px]">
                                <div className="relative">
                                    <Search className="absolute top-3 left-3 w-5 h-5 text-white/50" />
                                    <input
                                        type="text"
                                        placeholder="Search by name, ID, or email..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="py-3 pr-4 pl-10 w-full text-white rounded-lg border backdrop-blur-sm transition-all placeholder-white/50 bg-white/5 border-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Course Filter */}
                            <select
                                value={selectedCourse}
                                onChange={(e) => {
                                    setSelectedCourse(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="px-4 py-3 text-white rounded-lg border backdrop-blur-sm transition-all bg-white/5 border-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none"
                            >
                                <option value="">All Courses</option>
                                {COURSES.map(course => (
                                    <option key={course} value={course} className="bg-slate-800">
                                        {course}
                                    </option>
                                ))}
                            </select>

                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
                                    setCurrentPage(1);
                                }}
                                className="px-4 py-3 text-white rounded-lg border backdrop-blur-sm transition-all bg-white/5 border-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none"
                            >
                                <option value="all" className="bg-slate-800">All Status</option>
                                <option value="active" className="bg-slate-800">Active Only</option>
                                <option value="inactive" className="bg-slate-800">Inactive Only</option>
                            </select>

                            {/* Biometric Filter */}
                            <select
                                value={biometricFilter}
                                onChange={(e) => {
                                    setBiometricFilter(e.target.value as 'all' | 'face' | 'fingerprint');
                                    setCurrentPage(1);
                                }}
                                className="px-4 py-3 text-white rounded-lg border backdrop-blur-sm transition-all bg-white/5 border-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none"
                            >
                                <option value="all" className="bg-slate-800">All Methods</option>
                                <option value="face" className="bg-slate-800">Face Only</option>
                                <option value="fingerprint" className="bg-slate-800">Fingerprint Only</option>
                            </select>

                            {/* Attendance Filter */}
                            <select
                                value={attendanceFilter}
                                onChange={(e) => {
                                    setAttendanceFilter(e.target.value as 'all' | 'excellent' | 'good' | 'average' | 'poor');
                                    setCurrentPage(1);
                                }}
                                className="px-4 py-3 text-white rounded-lg border backdrop-blur-sm transition-all bg-white/5 border-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none"
                            >
                                <option value="all" className="bg-slate-800">All Attendance</option>
                                <option value="excellent" className="bg-slate-800">Excellent (≥90%)</option>
                                <option value="good" className="bg-slate-800">Good (70-89%)</option>
                                <option value="average" className="bg-slate-800">Average (50-69%)</option>
                                <option value="poor" className="bg-slate-800">Poor (&lt;50%)</option>
                            </select>
                        </div>
                    </motion.div>

                    {/* Students Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="overflow-hidden rounded-xl border backdrop-blur-sm bg-white/5 border-white/10"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/10">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-white uppercase">
                                            Student
                                        </th>
                                        <th
                                            className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-white uppercase transition-colors cursor-pointer hover:text-blue-300"
                                            onClick={() => handleSort('studentId')}
                                        >
                                            ID {sortBy === 'studentId' && (sortOrder === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-white uppercase">
                                            Contact
                                        </th>
                                        <th
                                            className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-white uppercase transition-colors cursor-pointer hover:text-blue-300"
                                            onClick={() => handleSort('course')}
                                        >
                                            Course {sortBy === 'course' && (sortOrder === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-white uppercase">
                                            Biometric
                                        </th>
                                        <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-white uppercase">
                                            Attendance %
                                        </th>
                                        <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-white uppercase">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-white uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    <AnimatePresence>
                                        {students.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-12 text-center">
                                                    <Users className="mx-auto mb-4 w-16 h-16 text-white/30" />
                                                    <p className="text-lg font-medium text-white">No students found</p>
                                                    <p className="text-sm text-white/70">Try adjusting your filters</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            students.map((student, index) => (
                                                <motion.tr
                                                    key={student._id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 20 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="transition-colors hover:bg-white/5"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex gap-3 items-center">
                                                            {student.profileImageUrl ? (
                                                                <img
                                                                    src={student.profileImageUrl}
                                                                    alt={student.name}
                                                                    className="object-cover w-10 h-10 rounded-full ring-2 ring-white/20"
                                                                />
                                                            ) : (
                                                                <div className="flex justify-center items-center w-10 h-10 font-semibold text-white bg-gradient-to-br from-blue-500 to-purple-500 rounded-full">
                                                                    {student.name.charAt(0)}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="font-medium text-white">{student.name}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm whitespace-nowrap text-white/70">
                                                        {student.studentId}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm whitespace-nowrap text-white/70">
                                                        <div>{student.email}</div>
                                                        <div className="text-xs text-white/50">{student.phone}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm whitespace-nowrap text-white/70">
                                                        {student.course}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex gap-2">
                                                            {student.biometricMethods.includes('face') && (
                                                                <span className="inline-flex gap-1 items-center px-2 py-1 text-xs font-medium text-purple-300 rounded-full bg-purple-500/20">
                                                                    <ScanFace className="w-3 h-3" />
                                                                    Face
                                                                </span>
                                                            )}
                                                            {student.biometricMethods.includes('fingerprint') && (
                                                                <span className="inline-flex gap-1 items-center px-2 py-1 text-xs font-medium text-orange-300 rounded-full bg-orange-500/20">
                                                                    <Fingerprint className="w-3 h-3" />
                                                                    Print
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-white whitespace-nowrap">
                                                        <div className="flex gap-2 items-center">
                                                            <div className="overflow-hidden w-16 h-2 rounded-full bg-white/10">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                                                    style={{ width: `${student.attendancePercentage}%` }}
                                                                />
                                                            </div>
                                                            <span>{student.attendancePercentage.toFixed(1)}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {student.isActive ? (
                                                            <span className="inline-flex gap-1 items-center px-3 py-1 text-xs font-medium text-green-300 rounded-full bg-green-500/20">
                                                                <UserCheck className="w-3 h-3" />
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex gap-1 items-center px-3 py-1 text-xs font-medium text-red-300 rounded-full bg-red-500/20">
                                                                <UserX className="w-3 h-3" />
                                                                Inactive
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex gap-2">
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={() => handleViewStudent(student)}
                                                                className="p-2 text-blue-300 rounded-lg transition-colors hover:bg-blue-500/20"
                                                                title="View Details"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </motion.button>
                                                            <StudentIDCard
                                                                student={student}
                                                                ceoSignatureUrl={process.env.REACT_APP_CEO_SIGNATURE_URL}
                                                                courseDirectorSignatureUrl={process.env.REACT_APP_COURSE_DIRECTOR_SIGNATURE_URL}
                                                            />
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex flex-wrap gap-4 justify-between items-center px-6 py-4 border-t bg-white/5 border-white/10">
                                <p className="text-sm text-white/70">
                                    Showing {((currentPage - 1) * studentsPerPage) + 1} to {Math.min(currentPage * studentsPerPage, totalStudents)} of {totalStudents} students
                                </p>

                                <div className="flex gap-2">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="p-2 text-white rounded-lg border backdrop-blur-sm transition-colors bg-white/5 border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </motion.button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(page => {
                                            // Show first page, last page, current page, and pages around current
                                            return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                                        })
                                        .map((page, index, array) => {
                                            // Add ellipsis if there's a gap
                                            const showEllipsis = index > 0 && page - array[index - 1] > 1;

                                            return (
                                                <React.Fragment key={page}>
                                                    {showEllipsis && (
                                                        <span className="px-3 py-2 text-white/50">...</span>
                                                    )}
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handlePageChange(page)}
                                                        className={`px-4 py-2 rounded-lg border transition-colors ${currentPage === page
                                                            ? 'bg-blue-500 border-blue-500 text-white'
                                                            : 'backdrop-blur-sm bg-white/5 border-white/10 text-white hover:bg-white/10'
                                                            }`}
                                                    >
                                                        {page}
                                                    </motion.button>
                                                </React.Fragment>
                                            );
                                        })}

                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="p-2 text-white rounded-lg border backdrop-blur-sm transition-colors bg-white/5 border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </motion.button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Student Detail Modal */}
            {selectedStudent && (
                <StudentDetail
                    studentId={selectedStudent._id}
                    isOpen={showDetailModal}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedStudent(null);
                        fetchStudents(true);
                    }}
                />
            )}
        </div>
    );
};

export default Students;

