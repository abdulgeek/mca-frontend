import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { AttendanceCalendarDay } from '../types';

interface AttendanceCalendarProps {
    calendarData: AttendanceCalendarDay[];
    onDateClick?: (day: AttendanceCalendarDay) => void;
    currentMonth?: Date;
    onMonthChange?: (date: Date) => void;
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
    calendarData,
    onDateClick,
    currentMonth: externalCurrentMonth,
    onMonthChange
}) => {
    const [internalCurrentMonth, setInternalCurrentMonth] = useState(new Date());
    const currentMonth = externalCurrentMonth || internalCurrentMonth;

    const handleMonthChange = (newMonth: Date) => {
        if (onMonthChange) {
            onMonthChange(newMonth);
        } else {
            setInternalCurrentMonth(newMonth);
        }
    };

    // Get calendar grid
    const { days, monthName, year } = useMemo(() => {
        const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday

        const days: (Date | null)[] = [];
        const current = new Date(startDate);

        // Generate 6 weeks of calendar
        for (let i = 0; i < 42; i++) {
            if (i < firstDay.getDay() || current > lastDay) {
                days.push(null);
            } else {
                days.push(new Date(current));
            }
            current.setDate(current.getDate() + 1);
        }

        return {
            days,
            monthName: firstDay.toLocaleString('default', { month: 'long' }),
            year: firstDay.getFullYear()
        };
    }, [currentMonth]);

    // Create a map of attendance data by date
    const attendanceMap = useMemo(() => {
        const map = new Map<string, AttendanceCalendarDay>();
        calendarData.forEach(day => {
            map.set(day.date, day);
        });
        return map;
    }, [calendarData]);

    const previousMonth = () => {
        const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        handleMonthChange(newMonth);
    };

    const nextMonth = () => {
        const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
        handleMonthChange(newMonth);
    };

    const goToToday = () => {
        handleMonthChange(new Date());
    };

    const getStatusColor = (status: 'present' | 'absent' | 'none') => {
        switch (status) {
            case 'present':
                return 'bg-green-500/20 border-green-500/50 text-green-300';
            case 'absent':
                return 'bg-red-500/20 border-red-500/50 text-red-300';
            default:
                return 'bg-white/5 border-white/10 text-white/50';
        }
    };

    const getStatusIcon = (status: 'present' | 'absent' | 'none') => {
        switch (status) {
            case 'present':
                return <CheckCircle2 className="w-3 h-3" />;
            case 'absent':
                return <XCircle className="w-3 h-3" />;
            default:
                return null;
        }
    };

    const formatDuration = (duration?: number) => {
        if (!duration) return '';
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="space-y-4">
            {/* Calendar Header */}
            <div className="flex justify-between items-center">
                <div className="flex gap-3 items-center">
                    <div className="p-2 rounded-lg bg-indigo-500/20">
                        <CalendarIcon className="w-5 h-5 text-indigo-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                        {monthName} {year}
                    </h3>
                </div>

                <div className="flex gap-2">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={goToToday}
                        className="px-4 py-2 text-sm font-medium text-white rounded-lg border transition-colors backdrop-blur-sm bg-white/5 border-white/10 hover:bg-white/10"
                    >
                        Today
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={previousMonth}
                        className="p-2 text-white rounded-lg border transition-colors backdrop-blur-sm bg-white/5 border-white/10 hover:bg-white/10"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={nextMonth}
                        className="p-2 text-white rounded-lg border transition-colors backdrop-blur-sm bg-white/5 border-white/10 hover:bg-white/10"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </motion.button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 p-4 rounded-xl border backdrop-blur-sm bg-white/5 border-white/10">
                <div className="flex gap-2 items-center">
                    <div className="w-4 h-4 bg-green-500/20 rounded border border-green-500/50"></div>
                    <span className="text-sm text-white/70">Present</span>
                </div>
                <div className="flex gap-2 items-center">
                    <div className="w-4 h-4 bg-red-500/20 rounded border border-red-500/50"></div>
                    <span className="text-sm text-white/70">Absent</span>
                </div>
                <div className="flex gap-2 items-center">
                    <div className="w-4 h-4 bg-white/5 rounded border border-white/10"></div>
                    <span className="text-sm text-white/70">No Record</span>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-6 rounded-2xl border backdrop-blur-sm bg-white/5 border-white/10">
                {/* Day Names */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="text-center text-sm font-semibold text-white/70">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-2">
                    <AnimatePresence mode="wait">
                        {days.map((day, index) => {
                            if (!day) {
                                return <div key={`empty-${index}`} className="aspect-square" />;
                            }

                            const dateStr = day.toISOString().split('T')[0];
                            const attendanceDay = attendanceMap.get(dateStr);
                            const status = attendanceDay?.status || 'none';
                            const isToday = new Date().toDateString() === day.toDateString();
                            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

                            return (
                                <motion.div
                                    key={dateStr}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ delay: index * 0.01 }}
                                    className="relative group"
                                >
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => attendanceDay && onDateClick && onDateClick(attendanceDay)}
                                        disabled={!attendanceDay || status === 'none'}
                                        className={`
                      w-full aspect-square p-2 rounded-lg border transition-all duration-200
                      ${getStatusColor(status)}
                      ${isToday ? 'ring-2 ring-blue-400' : ''}
                      ${!isCurrentMonth ? 'opacity-30' : ''}
                      ${attendanceDay && status !== 'none' ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                      relative flex flex-col items-center justify-center
                    `}
                                    >
                                        <span className="text-sm font-medium">{day.getDate()}</span>
                                        {getStatusIcon(status)}
                                    </motion.button>

                                    {/* Tooltip */}
                                    {attendanceDay && status !== 'none' && (
                                        <div className="group-hover:opacity-100 opacity-0 absolute left-1/2 top-full z-50 mt-2 transition-opacity duration-200 pointer-events-none transform -translate-x-1/2">
                                            <div className="px-3 py-2 text-xs rounded-lg border shadow-lg backdrop-blur-sm whitespace-nowrap bg-slate-900/95 border-white/20">
                                                <div className="font-semibold text-white capitalize">{status}</div>
                                                {attendanceDay.timeIn && (
                                                    <div className="flex gap-1 items-center mt-1 text-white/70">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(attendanceDay.timeIn).toLocaleTimeString('en-US', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                )}
                                                {attendanceDay.duration && (
                                                    <div className="mt-1 text-white/70">
                                                        Duration: {formatDuration(attendanceDay.duration)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default AttendanceCalendar;

