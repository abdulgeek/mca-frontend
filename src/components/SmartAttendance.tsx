import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    LogIn,
    LogOut,
    CheckCircle,
    AlertCircle,
    Loader2,
    Clock,
    User,
    TrendingUp,
    Play,
    Pause,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaceRecognition } from '../hooks/useFaceRecognition';
import { apiService } from '../services/api';
import { AttendanceResult, LoginStatusResponse } from '../types';
import { toast } from 'react-toastify';

const SmartAttendance: React.FC = () => {
    const [currentStatus, setCurrentStatus] = useState<LoginStatusResponse | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastResult, setLastResult] = useState<AttendanceResult | null>(null);
    const [elapsedTime, setElapsedTime] = useState('0h 0m');
    const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);

    const {
        modelsLoaded,
        cameraState,
        videoRef,
        canvasRef,
        startCamera,
        stopCamera
    } = useFaceRecognition();

    // Capture current frame from video
    const captureFrame = useCallback((): string | null => {
        if (!videoRef.current || !canvasRef.current) return null;

        try {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            const context = canvas.getContext('2d');

            if (!context) return null;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0);

            return canvas.toDataURL('image/jpeg', 0.9);
        } catch (error) {
            console.error('Failed to capture frame:', error);
            return null;
        }
    }, [videoRef, canvasRef]);

    // Check login status
    const checkLoginStatus = useCallback(async () => {
        if (!cameraState.isActive) return;

        try {
            const imageData = captureFrame();
            if (!imageData) return;

            const response = await apiService.checkLoginStatus(imageData);
            if (response.success && response.data) {
                setCurrentStatus(response.data);
                if (response.data.isLoggedIn) {
                    toast.info(`You are currently logged in as ${response.data.name}`);
                }
            }
        } catch (error) {
            console.error('Failed to check login status:', error);
        }
    }, [cameraState.isActive, captureFrame]);

    // Load models on mount
    useEffect(() => {
        startCamera();

        return () => {
            stopCamera();
            if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
        };
    }, [startCamera, stopCamera]);

    // Update elapsed time for logged-in users
    useEffect(() => {
        if (currentStatus?.isLoggedIn && currentStatus.timeIn) {
            const updateElapsed = () => {
                const loginTime = new Date(currentStatus.timeIn!).getTime();
                const now = Date.now();
                const diff = now - loginTime;
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                setElapsedTime(`${hours}h ${minutes}m`);
            };

            updateElapsed();
            elapsedTimerRef.current = setInterval(updateElapsed, 60000); // Update every minute

            return () => {
                if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
            };
        } else {
            setElapsedTime('0h 0m');
        }
    }, [currentStatus]);

    // Smart login/logout action - ONE CLICK!
    const handleSmartAction = useCallback(async () => {
        if (isProcessing || !cameraState.isActive) return;

        setIsProcessing(true);
        setLastResult(null);

        try {
            const imageData = captureFrame();

            if (!imageData) {
                toast.error('Failed to capture image. Please try again.');
                setIsProcessing(false);
                return;
            }

            // Call the intelligent API that auto-detects login/logout
            const response = await apiService.markAttendance({
                faceImage: imageData,
                action: 'auto' // Let backend decide
            });

            if (response.success && response.data) {
                setLastResult(response.data);

                const action = response.data.action;
                const duration = response.data.duration;

                if (action === 'login') {
                    toast.success(`✅ ${response.data.name} logged in successfully! Next student please.`, {
                        icon: '👋',
                        position: 'top-center',
                        autoClose: 4000
                    });

                    // Briefly show status then clear for next student
                    setCurrentStatus({
                        isLoggedIn: true,
                        studentId: response.data.studentId,
                        name: response.data.name,
                        timeIn: response.data.timeIn,
                        location: response.data.location
                    });

                    // Clear status after 3 seconds so next student can login
                    setTimeout(() => {
                        setCurrentStatus(null);
                        setLastResult(null);
                    }, 3000);
                } else if (action === 'logout') {
                    const hours = Math.floor(duration! / (1000 * 60 * 60));
                    const minutes = Math.floor((duration! % (1000 * 60 * 60)) / (1000 * 60));

                    toast.success(`✅ ${response.data.name} logged out! Total time: ${hours}h ${minutes}m`, {
                        icon: '👋',
                        position: 'top-center',
                        autoClose: 4000
                    });

                    // Briefly show status then clear for next student
                    setCurrentStatus({
                        isLoggedIn: false,
                        studentId: response.data.studentId,
                        name: response.data.name
                    });

                    // Clear status after 3 seconds
                    setTimeout(() => {
                        setCurrentStatus(null);
                        setLastResult(null);
                    }, 3000);
                }
            } else {
                toast.error(response.message || 'Action failed. Please try again.');
                setLastResult({
                    success: false,
                    message: response.message || 'Failed to process'
                });
            }
        } catch (error: any) {
            console.error('Smart action error:', error);
            toast.error(error.message || 'Failed to process. Please try again.');
            setLastResult({
                success: false,
                message: error.message || 'An error occurred'
            });
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, cameraState.isActive, captureFrame]);

    const formatTime = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleTimeString();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 px-6 py-8 mx-auto max-w-7xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 text-center"
                >
                    <h1 className="mb-3 text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-purple-200">
                        Smart Attendance System
                    </h1>
                    <p className="text-xl text-white/70">One-click login & logout with face recognition</p>
                </motion.div>

                {/* Main Content */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Camera & Action Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-2"
                    >
                        <div className="overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl"></div>
                            <div className="relative p-8 border rounded-3xl backdrop-blur-sm bg-white/10 border-white/20 shadow-2xl">
                                {/* Camera Feed */}
                                <div className="relative mb-6">
                                    <div className="overflow-hidden relative rounded-2xl border-2 aspect-video bg-black/30 border-white/20 shadow-xl">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            muted
                                            playsInline
                                            className="object-cover w-full h-full"
                                        />
                                        <canvas ref={canvasRef} className="hidden" />

                                        {/* Processing Overlay */}
                                        {isProcessing && (
                                            <div className="absolute inset-0 flex justify-center items-center bg-black/70">
                                                <div className="flex flex-col gap-3 items-center">
                                                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                                                    <p className="text-lg font-medium text-white">Processing...</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Camera Status Indicator */}
                                        <div className="absolute top-4 right-4">
                                            <div className="flex gap-2 items-center px-4 py-2 border rounded-xl backdrop-blur-sm bg-black/60 border-white/20">
                                                <div className={`w-3 h-3 rounded-full ${cameraState.isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                                                <span className="text-sm font-medium text-white">
                                                    {cameraState.isActive ? 'Live' : 'Offline'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Camera Controls */}
                                <div className="flex gap-3 mb-6">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={cameraState.isActive ? stopCamera : startCamera}
                                        disabled={!modelsLoaded}
                                        className="flex gap-2 items-center px-4 py-3 text-white border rounded-xl backdrop-blur-sm transition-all duration-300 bg-white/10 border-white/20 hover:bg-white/20 disabled:opacity-50"
                                    >
                                        {cameraState.isActive ? (
                                            <>
                                                <Pause className="w-4 h-4" />
                                                <span className="font-medium">Stop Camera</span>
                                            </>
                                        ) : (
                                            <>
                                                <Play className="w-4 h-4" />
                                                <span className="font-medium">Start Camera</span>
                                            </>
                                        )}
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={checkLoginStatus}
                                        disabled={!cameraState.isActive || isProcessing}
                                        className="flex flex-1 gap-2 justify-center items-center px-4 py-3 text-white border rounded-xl backdrop-blur-sm transition-all duration-300 bg-white/10 border-white/20 hover:bg-white/20 disabled:opacity-50"
                                    >
                                        <User className="w-4 h-4" />
                                        <span className="font-medium">Check Status</span>
                                    </motion.button>
                                </div>

                                {/* MAIN ACTION BUTTON - ONE CLICK! */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSmartAction}
                                    disabled={!cameraState.isActive || isProcessing}
                                    className={`flex gap-4 justify-center items-center px-8 py-6 w-full text-xl font-bold text-white rounded-2xl shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${currentStatus?.isLoggedIn
                                        ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                                        : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                                        }`}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-7 h-7 animate-spin" />
                                            Processing...
                                        </>
                                    ) : currentStatus?.isLoggedIn ? (
                                        <>
                                            <LogOut className="w-7 h-7" />
                                            Logout Now
                                        </>
                                    ) : (
                                        <>
                                            <LogIn className="w-7 h-7" />
                                            Login Now
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Status & Info Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        {/* Current Status Card */}
                        <div className="overflow-hidden relative">
                            <div className={`absolute inset-0 backdrop-blur-sm rounded-2xl ${currentStatus?.isLoggedIn
                                ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20'
                                : 'bg-gradient-to-br from-gray-500/20 to-slate-500/20'
                                }`}></div>
                            <div className="relative p-6 border rounded-2xl backdrop-blur-sm bg-white/10 border-white/20">
                                <div className="flex gap-3 items-center mb-4">
                                    <div className={`p-3 rounded-xl ${currentStatus?.isLoggedIn ? 'bg-green-500/30' : 'bg-gray-500/30'
                                        }`}>
                                        <User className={`w-6 h-6 ${currentStatus?.isLoggedIn ? 'text-green-300' : 'text-gray-300'
                                            }`} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Current Status</h3>
                                        <p className="text-sm text-white/70">Your attendance today</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/70">Status</span>
                                        <span className={`px-3 py-1 rounded-lg text-sm font-bold ${currentStatus?.isLoggedIn
                                            ? 'bg-green-500/30 text-green-300'
                                            : 'bg-gray-500/30 text-gray-300'
                                            }`}>
                                            {currentStatus?.isLoggedIn ? 'Logged In' : 'Logged Out'}
                                        </span>
                                    </div>

                                    {currentStatus?.name && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-white/70">Name</span>
                                            <span className="font-bold text-white">{currentStatus.name}</span>
                                        </div>
                                    )}

                                    {currentStatus?.studentId && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-white/70">ID</span>
                                            <span className="font-bold text-white">{currentStatus.studentId}</span>
                                        </div>
                                    )}

                                    {currentStatus?.timeIn && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-white/70">Login Time</span>
                                            <span className="font-bold text-white">{formatTime(currentStatus.timeIn)}</span>
                                        </div>
                                    )}

                                    {currentStatus?.isLoggedIn && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-white/70">Time Elapsed</span>
                                            <span className="flex gap-2 items-center font-bold text-white">
                                                <Clock className="w-4 h-4" />
                                                {elapsedTime}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Logout Reminder */}
                                {currentStatus?.isLoggedIn && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="mt-4 p-4 border-2 rounded-xl bg-orange-500/20 border-orange-500/50"
                                    >
                                        <div className="flex gap-3 items-center">
                                            <AlertCircle className="w-5 h-5 text-orange-300 animate-pulse" />
                                            <div>
                                                <p className="text-sm font-bold text-orange-200">Don't forget to logout!</p>
                                                <p className="text-xs text-orange-300/80">Click the big red button when you're done</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Last Action Result */}
                        <AnimatePresence>
                            {lastResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="overflow-hidden relative"
                                >
                                    <div className={`absolute inset-0 backdrop-blur-sm rounded-2xl ${lastResult.success
                                        ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20'
                                        : 'bg-gradient-to-br from-red-500/20 to-rose-500/20'
                                        }`}></div>
                                    <div className={`relative p-6 border rounded-2xl backdrop-blur-sm bg-white/10 ${lastResult.success ? 'border-blue-500/30' : 'border-red-500/30'
                                        }`}>
                                        <div className="flex gap-3 items-center mb-3">
                                            {lastResult.success ? (
                                                <CheckCircle className="w-6 h-6 text-blue-300" />
                                            ) : (
                                                <AlertCircle className="w-6 h-6 text-red-300" />
                                            )}
                                            <h4 className="font-bold text-white">
                                                {lastResult.success ? 'Success!' : 'Failed'}
                                            </h4>
                                        </div>
                                        <p className="text-sm text-white/80">{lastResult.message}</p>

                                        {lastResult.success && lastResult.action === 'logout' && lastResult.duration && (
                                            <div className="flex gap-2 items-center mt-3 text-sm text-white/70">
                                                <TrendingUp className="w-4 h-4" />
                                                Total time: {Math.floor(lastResult.duration / (1000 * 60 * 60))}h {Math.floor((lastResult.duration % (1000 * 60 * 60)) / (1000 * 60))}m
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* System Info */}
                        <div className="overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-br rounded-2xl backdrop-blur-sm from-purple-500/20 to-pink-500/20"></div>
                            <div className="relative p-6 border rounded-2xl backdrop-blur-sm bg-white/10 border-white/20">
                                <h4 className="mb-4 font-bold text-white">System Status</h4>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/70">AI Models</span>
                                        <span className={`flex gap-2 items-center ${modelsLoaded ? 'text-green-300' : 'text-red-300'}`}>
                                            <div className={`w-2 h-2 rounded-full ${modelsLoaded ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                            {modelsLoaded ? 'Ready' : 'Loading'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/70">Camera</span>
                                        <span className={`flex gap-2 items-center ${cameraState.isActive ? 'text-green-300' : 'text-gray-300'}`}>
                                            <div className={`w-2 h-2 rounded-full ${cameraState.isActive ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                                            {cameraState.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/70">Permission</span>
                                        <span className={`flex gap-2 items-center ${cameraState.hasPermission ? 'text-green-300' : 'text-red-300'}`}>
                                            <div className={`w-2 h-2 rounded-full ${cameraState.hasPermission ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                            {cameraState.hasPermission ? 'Granted' : 'Denied'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-br rounded-2xl backdrop-blur-sm from-indigo-500/20 to-blue-500/20"></div>
                            <div className="relative p-6 border rounded-2xl backdrop-blur-sm bg-white/10 border-white/20">
                                <h4 className="mb-4 font-bold text-white">How to Use</h4>
                                <div className="space-y-4 text-sm text-white/70">
                                    <div>
                                        <p className="mb-2 font-semibold text-white">📥 For Login (Morning):</p>
                                        <div className="space-y-2 ml-4">
                                            <p>1. Position your face in camera</p>
                                            <p>2. Click the green button</p>
                                            <p>3. Wait for confirmation, then move away</p>
                                            <p>4. Next student can login immediately</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="mb-2 font-semibold text-white">📤 For Logout (Evening):</p>
                                        <div className="space-y-2 ml-4">
                                            <p>1. Click "Check Status" to verify your identity</p>
                                            <p>2. Click the red "Logout" button</p>
                                            <p>3. Wait for confirmation - Done!</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default SmartAttendance;
