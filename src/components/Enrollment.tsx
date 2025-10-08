import React, { useState, useCallback, useEffect } from 'react';
import {
    UserPlus,
    Camera,
    CheckCircle,
    AlertCircle,
    Loader2,
    User,
    Mail,
    Phone,
    GraduationCap,
    Play,
    Pause,
    RefreshCw,
    Fingerprint,
    Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaceRecognition } from '../hooks/useFaceRecognition';
import { apiService } from '../services/api';
import { FingerprintService } from '../services/fingerprintService';
import { StudentFormData, FingerprintData } from '../types';
import { toast } from 'react-toastify';

const AVAILABLE_COURSES = [
    '1st Standard', '2nd Standard', '3rd Standard', '4th Standard', '5th Standard',
    '6th Standard', '7th Standard', '8th Standard', '9th Standard', '10th Standard',
    '1st PUC - Science', '1st PUC - Commerce',
    '2nd PUC - Science', '2nd PUC - Commerce',
    'Degree - MCA', 'Degree - BCA', 'Degree - B.Com', 'Degree - B.Sc', 'Degree - BA', 'Degree - Other'
];

const Enrollment: React.FC = () => {
    const [formData, setFormData] = useState<StudentFormData>({
        name: '',
        email: '',
        phone: '',
        course: ''
    });
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [fingerprintData, setFingerprintData] = useState<FingerprintData | null>(null);
    const [selectedBiometrics, setSelectedBiometrics] = useState<('face' | 'fingerprint')[]>(['face']);
    const [isFingerprintSupported, setIsFingerprintSupported] = useState(false);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [enrollmentResult, setEnrollmentResult] = useState<{ success: boolean; message: string; studentId?: string; biometricMethods?: string[] } | null>(null);

    const {
        modelsLoaded,
        cameraState,
        videoRef,
        canvasRef,
        startCamera,
        stopCamera
    } = useFaceRecognition();

    // Start camera on mount and check fingerprint support
    useEffect(() => {
        const checkFingerprint = async () => {
            const supported = await FingerprintService.isPlatformAuthenticatorAvailable();
            setIsFingerprintSupported(supported);
            if (supported) {
                toast.info('Fingerprint authentication is available on this device! 👍', {
                    autoClose: 3000,
                    position: 'top-right'
                });
            }
        };

        checkFingerprint();

        if (selectedBiometrics.includes('face')) {
            startCamera();
        }

        return () => {
            stopCamera();
        };
    }, [startCamera, stopCamera, selectedBiometrics]);

    // Capture photo from video stream
    const capturePhoto = useCallback((): string | null => {
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
            console.error('Failed to capture photo:', error);
            return null;
        }
    }, [videoRef, canvasRef]);

    const handleCapture = () => {
        const imageData = capturePhoto();
        if (imageData) {
            setCapturedImage(imageData);
            toast.success('Photo captured successfully!');
        } else {
            toast.error('Failed to capture photo. Please try again.');
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setEnrollmentResult(null);
    };

    const handleCaptureFingerprint = async () => {
        if (!formData.name || !formData.email) {
            toast.error('Please enter your name and email first');
            return;
        }

        try {
            toast.info('Place your finger on the sensor...', { autoClose: 2000 });
            const data = await FingerprintService.enrollFingerprint(formData.name, formData.email);
            setFingerprintData(data);
            toast.success('Fingerprint captured successfully! 👍');
        } catch (error: any) {
            const message = FingerprintService.getErrorMessage(error);
            toast.error(message);
            console.error('Fingerprint capture error:', error);
        }
    };

    const handleRetakeFingerprint = () => {
        setFingerprintData(null);
        setEnrollmentResult(null);
    };

    const toggleBiometric = (biometric: 'face' | 'fingerprint') => {
        setSelectedBiometrics(prev => {
            const newSelection = prev.includes(biometric)
                ? prev.filter(b => b !== biometric)
                : [...prev, biometric];

            // Ensure at least one is selected
            if (newSelection.length === 0) {
                toast.warning('Please select at least one biometric method');
                return prev;
            }

            // Start/stop camera based on face selection
            if (biometric === 'face') {
                if (newSelection.includes('face')) {
                    startCamera();
                } else {
                    stopCamera();
                }
            }

            return newSelection;
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!formData.name || !formData.email || !formData.phone || !formData.course) {
            toast.error('Please fill in all required fields');
            return;
        }

        // Validate at least one biometric is captured
        const hasFaceData = selectedBiometrics.includes('face') && capturedImage;
        const hasFingerprintData = selectedBiometrics.includes('fingerprint') && fingerprintData;

        if (!hasFaceData && !hasFingerprintData) {
            const missing = [];
            if (selectedBiometrics.includes('face') && !capturedImage) missing.push('face photo');
            if (selectedBiometrics.includes('fingerprint') && !fingerprintData) missing.push('fingerprint');
            toast.error(`Please capture your ${missing.join(' and ')}`);
            return;
        }

        setIsEnrolling(true);
        setEnrollmentResult(null);

        try {
            const response = await apiService.enrollStudent({
                ...formData,
                faceImage: capturedImage || undefined,
                fingerprintData: fingerprintData || undefined
            });

            if (response.success) {
                const methods = response.data.biometricMethods || [];
                const methodsStr = methods.map((m: string) => m === 'face' ? '👤 Face' : '👆 Fingerprint').join(' & ');

                setEnrollmentResult({
                    success: true,
                    message: 'Enrollment successful!',
                    studentId: response.data.studentId,
                    biometricMethods: methods
                });

                toast.success(`Welcome ${formData.name}! Your ID: ${response.data.studentId}`, {
                    autoClose: 5000,
                    position: 'top-center'
                });

                toast.info(`Enrolled with: ${methodsStr}`, {
                    autoClose: 4000,
                    position: 'top-right'
                });

                // Reset form after 3 seconds
                setTimeout(() => {
                    setFormData({ name: '', email: '', phone: '', course: '' });
                    setCapturedImage(null);
                    setFingerprintData(null);
                    setEnrollmentResult(null);
                }, 3000);
            } else {
                setEnrollmentResult({
                    success: false,
                    message: response.message || 'Enrollment failed'
                });
                toast.error(response.message || 'Enrollment failed');
            }
        } catch (error: any) {
            console.error('Enrollment error:', error);
            const errorMessage = error.message || 'Failed to enroll. Please try again.';
            setEnrollmentResult({
                success: false,
                message: errorMessage
            });
            toast.error(errorMessage);
        } finally {
            setIsEnrolling(false);
        }
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
                        Student Enrollment
                    </h1>
                    <p className="text-xl text-white/70">Register your face and get your unique student ID</p>
                </motion.div>

                {/* Biometric Selection */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-2xl"></div>
                        <div className="relative p-6 border rounded-2xl backdrop-blur-sm bg-white/10 border-white/20 shadow-2xl">
                            <div className="flex gap-3 items-center mb-4">
                                <Shield className="w-5 h-5 text-white" />
                                <h3 className="text-lg font-semibold text-white">Select Biometric Methods</h3>
                                <span className="text-sm text-white/60">(You can choose both!)</span>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                {/* Face Recognition Option */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => toggleBiometric('face')}
                                    className={`flex-1 min-w-[200px] p-4 rounded-xl border-2 transition-all duration-300 ${selectedBiometrics.includes('face')
                                        ? 'bg-blue-500/30 border-blue-400 shadow-lg shadow-blue-500/30'
                                        : 'bg-white/5 border-white/20 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Camera className="w-6 h-6 text-white" />
                                        <div className="text-left">
                                            <h4 className="font-bold text-white">Face Recognition</h4>
                                            <p className="text-sm text-white/70">Use your camera</p>
                                        </div>
                                        {selectedBiometrics.includes('face') && (
                                            <CheckCircle className="w-5 h-5 text-green-400 ml-auto" />
                                        )}
                                    </div>
                                </motion.button>

                                {/* Fingerprint Option */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => toggleBiometric('fingerprint')}
                                    disabled={!isFingerprintSupported}
                                    className={`flex-1 min-w-[200px] p-4 rounded-xl border-2 transition-all duration-300 ${selectedBiometrics.includes('fingerprint')
                                        ? 'bg-purple-500/30 border-purple-400 shadow-lg shadow-purple-500/30'
                                        : 'bg-white/5 border-white/20 hover:bg-white/10'
                                        } ${!isFingerprintSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Fingerprint className="w-6 h-6 text-white" />
                                        <div className="text-left">
                                            <h4 className="font-bold text-white">Fingerprint</h4>
                                            <p className="text-sm text-white/70">
                                                {isFingerprintSupported ? 'Touch sensor' : 'Not available'}
                                            </p>
                                        </div>
                                        {selectedBiometrics.includes('fingerprint') && (
                                            <CheckCircle className="w-5 h-5 text-green-400 ml-auto" />
                                        )}
                                    </div>
                                </motion.button>
                            </div>

                            {!isFingerprintSupported && (
                                <p className="mt-3 text-sm text-yellow-300/80">
                                    💡 Fingerprint authentication requires a compatible device with a fingerprint sensor
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Main Content */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* Camera Section - Only show if face is selected */}
                    {selectedBiometrics.includes('face') && (
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl"></div>
                            <div className="relative p-8 border rounded-3xl backdrop-blur-sm bg-white/10 border-white/20 shadow-2xl">
                                <div className="flex gap-3 items-center mb-6">
                                    <Camera className="w-6 h-6 text-white" />
                                    <h3 className="text-xl font-semibold text-white">Capture Profile Photo</h3>
                                </div>

                                {/* Camera/Preview */}
                                <div className="relative mb-6">
                                    <div className="overflow-hidden relative rounded-2xl border-2 aspect-video bg-black/30 border-white/20 shadow-xl">
                                        {capturedImage ? (
                                            <img src={capturedImage} alt="Captured" className="object-cover w-full h-full" />
                                        ) : (
                                            <>
                                                <video
                                                    ref={videoRef}
                                                    autoPlay
                                                    muted
                                                    playsInline
                                                    className="object-cover w-full h-full"
                                                />
                                                <canvas ref={canvasRef} className="hidden" />
                                            </>
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
                                <div className="flex gap-3">
                                    {!capturedImage ? (
                                        <>
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
                                                onClick={handleCapture}
                                                disabled={!cameraState.isActive}
                                                className="flex flex-1 gap-2 justify-center items-center px-6 py-3 font-bold text-white bg-gradient-to-r rounded-xl shadow-xl transition-all duration-300 from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Camera className="w-5 h-5" />
                                                Capture Photo
                                            </motion.button>
                                        </>
                                    ) : (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleRetake}
                                            className="flex flex-1 gap-2 justify-center items-center px-6 py-3 font-bold text-white bg-gradient-to-r rounded-xl shadow-xl transition-all duration-300 from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                                        >
                                            <RefreshCw className="w-5 h-5" />
                                            Retake Photo
                                        </motion.button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Fingerprint Section - Only show if fingerprint is selected */}
                    {selectedBiometrics.includes('fingerprint') && (
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl"></div>
                            <div className="relative p-8 border rounded-3xl backdrop-blur-sm bg-white/10 border-white/20 shadow-2xl">
                                <div className="flex gap-3 items-center mb-6">
                                    <Fingerprint className="w-6 h-6 text-white" />
                                    <h3 className="text-xl font-semibold text-white">Fingerprint Registration</h3>
                                </div>

                                {/* Fingerprint Status */}
                                <div className="relative mb-6">
                                    <div className="overflow-hidden relative rounded-2xl border-2 aspect-video bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-white/20 shadow-xl flex items-center justify-center">
                                        {fingerprintData ? (
                                            <div className="flex flex-col items-center gap-4 p-8">
                                                <CheckCircle className="w-20 h-20 text-green-400 animate-pulse" />
                                                <p className="text-xl font-bold text-white">Fingerprint Captured!</p>
                                                <p className="text-sm text-white/70 text-center">Your fingerprint has been securely registered</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-4 p-8">
                                                <Fingerprint className="w-20 h-20 text-white/50" />
                                                <p className="text-lg font-semibold text-white">Ready to Capture</p>
                                                <p className="text-sm text-white/60 text-center">Click the button below to register your fingerprint</p>
                                            </div>
                                        )}

                                        {/* Status Indicator */}
                                        <div className="absolute top-4 right-4">
                                            <div className="flex gap-2 items-center px-4 py-2 border rounded-xl backdrop-blur-sm bg-black/60 border-white/20">
                                                <div className={`w-3 h-3 rounded-full ${fingerprintData ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                                                <span className="text-sm font-medium text-white">
                                                    {fingerprintData ? 'Captured' : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Fingerprint Controls */}
                                <div className="flex gap-3">
                                    {!fingerprintData ? (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleCaptureFingerprint}
                                            disabled={!formData.name || !formData.email}
                                            className="flex flex-1 gap-2 justify-center items-center px-6 py-3 font-bold text-white bg-gradient-to-r rounded-xl shadow-xl transition-all duration-300 from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Fingerprint className="w-5 h-5" />
                                            Register Fingerprint
                                        </motion.button>
                                    ) : (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleRetakeFingerprint}
                                            className="flex flex-1 gap-2 justify-center items-center px-6 py-3 font-bold text-white bg-gradient-to-r rounded-xl shadow-xl transition-all duration-300 from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                                        >
                                            <RefreshCw className="w-5 h-5" />
                                            Re-register Fingerprint
                                        </motion.button>
                                    )}
                                </div>

                                {!formData.name || !formData.email ? (
                                    <p className="mt-4 text-sm text-center text-yellow-300/80">
                                        ⚠️ Please enter your name and email first
                                    </p>
                                ) : null}
                            </div>
                        </motion.div>
                    )}

                    {/* Form Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl"></div>
                        <div className="relative p-8 border rounded-3xl backdrop-blur-sm bg-white/10 border-white/20 shadow-2xl">
                            <div className="flex gap-3 items-center mb-6">
                                <UserPlus className="w-6 h-6 text-white" />
                                <h3 className="text-xl font-semibold text-white">Student Information</h3>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="flex gap-2 items-center mb-2 text-sm font-medium text-white">
                                        <User className="w-4 h-4" />
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="px-4 py-3 w-full text-white placeholder-white/50 rounded-xl border backdrop-blur-sm transition-all duration-300 bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/20"
                                        placeholder="Enter your full name"
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="flex gap-2 items-center mb-2 text-sm font-medium text-white">
                                        <Mail className="w-4 h-4" />
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        className="px-4 py-3 w-full text-white placeholder-white/50 rounded-xl border backdrop-blur-sm transition-all duration-300 bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/20"
                                        placeholder="your.email@example.com"
                                    />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="flex gap-2 items-center mb-2 text-sm font-medium text-white">
                                        <Phone className="w-4 h-4" />
                                        Phone Number *
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        required
                                        className="px-4 py-3 w-full text-white placeholder-white/50 rounded-xl border backdrop-blur-sm transition-all duration-300 bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/20"
                                        placeholder="+91 9876543210"
                                    />
                                </div>

                                {/* Course */}
                                <div>
                                    <label className="flex gap-2 items-center mb-2 text-sm font-medium text-white">
                                        <GraduationCap className="w-4 h-4" />
                                        Course *
                                    </label>
                                    <select
                                        name="course"
                                        value={formData.course}
                                        onChange={handleInputChange}
                                        required
                                        className="px-4 py-3 w-full text-white rounded-xl border backdrop-blur-sm transition-all duration-300 bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/20"
                                    >
                                        <option value="" className="text-black">Select your course</option>
                                        {AVAILABLE_COURSES.map((course) => (
                                            <option key={course} value={course} className="text-black">
                                                {course}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Submit Button */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={
                                        isEnrolling ||
                                        (selectedBiometrics.includes('face') && !capturedImage) ||
                                        (selectedBiometrics.includes('fingerprint') && !fingerprintData)
                                    }
                                    className="flex gap-3 justify-center items-center px-8 py-4 w-full text-xl font-bold text-white bg-gradient-to-r rounded-xl shadow-xl transition-all duration-300 from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isEnrolling ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            Enrolling...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-6 h-6" />
                                            Enroll Student
                                        </>
                                    )}
                                </motion.button>
                            </form>

                            {/* Enrollment Result */}
                            <AnimatePresence>
                                {enrollmentResult && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className={`mt-6 p-6 rounded-2xl backdrop-blur-sm ${enrollmentResult.success
                                            ? 'bg-green-500/20 border border-green-500/30'
                                            : 'bg-red-500/20 border border-red-500/30'
                                            }`}
                                    >
                                        <div className="flex gap-3 items-center">
                                            {enrollmentResult.success ? (
                                                <CheckCircle className="w-6 h-6 text-green-300" />
                                            ) : (
                                                <AlertCircle className="w-6 h-6 text-red-300" />
                                            )}
                                            <div>
                                                <h4 className="font-bold text-white">
                                                    {enrollmentResult.success ? 'Success!' : 'Failed'}
                                                </h4>
                                                <p className="text-sm text-white/80">{enrollmentResult.message}</p>
                                                {enrollmentResult.studentId && (
                                                    <p className="mt-2 text-lg font-bold text-white">
                                                        Student ID: {enrollmentResult.studentId}
                                                    </p>
                                                )}
                                                {enrollmentResult.biometricMethods && enrollmentResult.biometricMethods.length > 0 && (
                                                    <div className="mt-3 flex gap-2 items-center">
                                                        <span className="text-sm text-white/70">Enrolled with:</span>
                                                        {enrollmentResult.biometricMethods.map((method: string) => (
                                                            <span key={method} className="px-2 py-1 text-xs font-medium rounded-lg bg-white/20 text-white">
                                                                {method === 'face' ? '👤 Face' : '👆 Fingerprint'}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Enrollment;
