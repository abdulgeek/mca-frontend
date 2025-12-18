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
    Shield,
    Droplet,
    Upload,
    Image as ImageIcon,
    Usb,
    Wifi,
    WifiOff,
    Settings,
    Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaceRecognition } from '../hooks/useFaceRecognition';
import { apiService } from '../services/api';
import { FingerprintService } from '../services/fingerprintService';
import {
    StudentFormData,
    FingerprintData,
    ExternalFingerprintData,
    SensorEvent,
    ExternalFingerprintState,
    FingerprintModeState
} from '../types';
import { toast } from 'react-toastify';
import * as faceapi from 'face-api.js';

const AVAILABLE_COURSES = [
    '1st Standard', '2nd Standard', '3rd Standard', '4th Standard', '5th Standard',
    '6th Standard', '7th Standard', '8th Standard', '9th Standard', '10th Standard',
    '1st PUC - Science', '1st PUC - Commerce',
    '2nd PUC - Science', '2nd PUC - Commerce',
    'Degree - MCA', 'Degree - BCA', 'Degree - B.Com', 'Degree - B.Sc', 'Degree - BA', 'Degree - Other',
    'DCA', 'Programming', 'DCAD'
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
    const [externalFingerprintData, setExternalFingerprintData] = useState<ExternalFingerprintData | null>(null);
    const [selectedBiometrics, setSelectedBiometrics] = useState<('face' | 'fingerprint')[]>(['face']);
    const [isFingerprintSupported, setIsFingerprintSupported] = useState(false);

    // External fingerprint sensor state
    const [externalSensorState, setExternalSensorState] = useState<ExternalFingerprintState>({
        isConnecting: false,
        isCapturing: false,
        availableSensors: [],
        selectedSensorId: null,
        captureProgress: null,
        sseConnected: false,
        lastCaptureResult: null,
        error: null
    });

    // Fingerprint mode state
    const [fingerprintMode, setFingerprintMode] = useState<FingerprintModeState>({
        currentMode: 'auto',
        externalSensorsAvailable: false,
        webauthnAvailable: false,
        preferredMethod: null
    });
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [enrollmentResult, setEnrollmentResult] = useState<{ success: boolean; message: string; studentId?: string; biometricMethods?: string[] } | null>(null);
    const [captureMode, setCaptureMode] = useState<'camera' | 'upload'>('camera');
    const [isValidatingImage, setIsValidatingImage] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [faceModelsLoaded, setFaceModelsLoaded] = useState(false);

    const {
        modelsLoaded,
        cameraState,
        videoRef,
        canvasRef,
        startCamera,
        stopCamera
    } = useFaceRecognition();

    // Load face-api.js models for face detection (optional - will use basic validation if models unavailable)
    useEffect(() => {
        const loadFaceModels = async () => {
            try {
                const MODEL_URL = '/models';
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                setFaceModelsLoaded(true);
                console.log('✅ Face-api.js models loaded successfully');
            } catch (error) {
                setFaceModelsLoaded(false);
                console.warn('⚠️ Face-api.js models not found. Uploaded images will be accepted without strict face validation.');
                toast.info('Face validation disabled - models not available. Images will be accepted without face detection.', {
                    autoClose: 5000
                });
            }
        };
        loadFaceModels();
    }, []);

    // Start camera on mount and check fingerprint support
    useEffect(() => {
        const checkFingerprint = async () => {
            // Check WebAuthn support
            const webauthnSupported = await FingerprintService.isPlatformAuthenticatorAvailable();
            // Check external sensors
            const externalSensorsAvailable = await FingerprintService.hasExternalSensors();
            setIsFingerprintSupported(webauthnSupported || externalSensorsAvailable);
            console.log("webauthnSupported", webauthnSupported);
            console.log("externalSensorsAvailable", externalSensorsAvailable);

            setFingerprintMode(prev => ({
                ...prev,
                webauthnAvailable: webauthnSupported,
                externalSensorsAvailable,
                preferredMethod: externalSensorsAvailable ? 'external_sensor' :
                    webauthnSupported ? 'webauthn' : null
            }));

            if (externalSensorsAvailable) {
                toast.info('🔌 External fingerprint sensors detected! Enhanced security available.', {
                    autoClose: 3000,
                    position: 'top-right'
                });

                // Load available sensors
                loadAvailableSensors();

                // Connect to SSE for real-time updates
                connectToSensorUpdates();
            } else if (webauthnSupported) {
                toast.info('👍 Built-in fingerprint authentication is available on this device!', {
                    autoClose: 3000,
                    position: 'top-right'
                });
            }
        };

        checkFingerprint();

        // Only start camera if face biometric is selected AND camera mode is active
        if (selectedBiometrics.includes('face') && captureMode === 'camera') {
            startCamera();
        } else if (captureMode === 'upload') {
            stopCamera();
        }

        return () => {
            stopCamera();
            // Cleanup SSE connection on unmount
            FingerprintService.disconnectSSE();
        };
    }, [startCamera, stopCamera]); // eslint-disable-line react-hooks/exhaustive-deps

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
        setUploadError(null);
    };

    // Validate uploaded image with face detection
    const validateUploadedImage = async (file: File): Promise<{ valid: boolean; imageData: string | null; error?: string }> => {
        setIsValidatingImage(true);
        setUploadError(null);

        try {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!validTypes.includes(file.type)) {
                return {
                    valid: false,
                    imageData: null,
                    error: 'Invalid file type. Please upload a JPEG or PNG image.'
                };
            }

            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                return {
                    valid: false,
                    imageData: null,
                    error: 'File size too large. Please upload an image smaller than 5MB.'
                };
            }

            // Convert file to base64
            const imageData = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (e.target?.result) {
                        resolve(e.target.result as string);
                    } else {
                        reject(new Error('Failed to read file'));
                    }
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            // Create image element for face detection
            const img = new Image();
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = imageData;
            });

            // Validate image dimensions (minimum 640x480 recommended)
            if (img.width < 200 || img.height < 200) {
                return {
                    valid: false,
                    imageData: null,
                    error: 'Image too small. Please upload an image with at least 200x200 pixels.'
                };
            }

            // Try to detect faces using face-api.js (only if models are loaded)
            if (faceModelsLoaded) {
                try {
                    const detections = await faceapi
                        .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
                        .withFaceLandmarks()
                        .withFaceDescriptors();

                    if (detections.length === 0) {
                        return {
                            valid: false,
                            imageData: null,
                            error: 'No face detected in the image. Please upload a photo with a clear face.'
                        };
                    }

                    if (detections.length > 1) {
                        return {
                            valid: false,
                            imageData: null,
                            error: 'Multiple faces detected. Please upload a photo with only one person.'
                        };
                    }

                    // Face detected successfully
                    return {
                        valid: true,
                        imageData: imageData
                    };
                } catch (faceError) {
                    // If face-api.js fails, still accept the image but warn
                    console.warn('Face detection failed, accepting image anyway:', faceError);
                    return {
                        valid: true,
                        imageData: imageData
                    };
                }
            } else {
                // Models not loaded, accept image without face validation
                console.log('Face models not loaded, skipping face detection');
                return {
                    valid: true,
                    imageData: imageData
                };
            }
        } catch (error: any) {
            return {
                valid: false,
                imageData: null,
                error: error.message || 'Failed to process image. Please try again.'
            };
        } finally {
            setIsValidatingImage(false);
        }
    };

    // Handle file upload
    const handleFileUpload = async (file: File) => {
        const result = await validateUploadedImage(file);

        if (result.valid && result.imageData) {
            setCapturedImage(result.imageData);
            setUploadError(null);
            toast.success('Photo uploaded and validated successfully!');
        } else {
            setUploadError(result.error || 'Invalid image');
            toast.error(result.error || 'Failed to upload image');
        }
    };

    // Handle file input change
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    // Handle drag and drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    const handleCaptureFingerprint = async () => {
        if (!formData.name || !formData.email) {
            toast.error('Please enter your name and email first');
            return;
        }

        // Check if external sensors are actually available (not just detected)
        const hasExternalSensors = externalSensorState.availableSensors.length > 0 &&
            externalSensorState.selectedSensorId;

        if (hasExternalSensors) {
            await handleCaptureExternalFingerprint();
        } else if (fingerprintMode.webauthnAvailable) {
            // Fall back to WebAuthn if external sensors aren't available
            await handleCaptureWebAuthnFingerprint();
        } else {
            toast.error('No fingerprint authentication method available. Please connect an external scanner or use a device with built-in fingerprint support.');
        }
    };

    const handleCaptureExternalFingerprint = async () => {
        if (!externalSensorState.selectedSensorId) {
            toast.error('Please select a fingerprint sensor');
            return;
        }

        try {
            setExternalSensorState(prev => ({ ...prev, isCapturing: true, error: null }));
            toast.info('🔌 Place your finger on the external sensor...', { autoClose: 3000 });

            const data = await FingerprintService.captureFromExternalSensor(
                externalSensorState.selectedSensorId,
                { captureMode: 'enrollment', quality: 70, maxRetries: 3 }
            );

            setExternalFingerprintData(data);
            setExternalSensorState(prev => ({
                ...prev,
                isCapturing: false,
                lastCaptureResult: data,
                captureProgress: null
            }));
            toast.success('External fingerprint captured successfully! 🔐');
        } catch (error: any) {
            setExternalSensorState(prev => ({
                ...prev,
                isCapturing: false,
                error: error.message,
                captureProgress: null
            }));
            toast.error(error.message || 'Failed to capture from external sensor');
            console.error('External fingerprint capture error:', error);
        }
    };

    const handleCaptureWebAuthnFingerprint = async () => {
        try {
            toast.info('👆 Place your finger on the built-in sensor...', { autoClose: 2000 });
            const data = await FingerprintService.enrollFingerprint(formData.name, formData.email);
            setFingerprintData(data);
            toast.success('Fingerprint captured successfully! 👍');
        } catch (error: any) {
            const message = FingerprintService.getErrorMessage(error);
            toast.error(message);
            console.error('WebAuthn fingerprint capture error:', error);
        }
    };

    const handleRetakeFingerprint = () => {
        setFingerprintData(null);
        setExternalFingerprintData(null);
        setEnrollmentResult(null);
        setExternalSensorState(prev => ({
            ...prev,
            lastCaptureResult: null,
            captureProgress: null,
            error: null
        }));
    };

    // Load available external sensors
    const loadAvailableSensors = async () => {
        try {
            setExternalSensorState(prev => ({ ...prev, isConnecting: true }));
            const sensors = await FingerprintService.enumerateSensors();
            console.log("sensors", sensors);
            setExternalSensorState(prev => ({
                ...prev,
                availableSensors: sensors,
                selectedSensorId: sensors.length > 0 ? sensors[0].id : null,
                isConnecting: false
            }));
        } catch (error) {
            console.error('Error loading sensors:', error);
            setExternalSensorState(prev => ({
                ...prev,
                isConnecting: false,
                error: 'Failed to load sensors'
            }));
        }
    };

    // Connect to SSE for real-time sensor updates
    const connectToSensorUpdates = () => {
        const sseConnection = FingerprintService.connectToSSE((event: SensorEvent) => {
            handleSensorEvent(event);
        });

        if (sseConnection) {
            setExternalSensorState(prev => ({ ...prev, sseConnected: true }));
        }
    };

    // Handle SSE sensor events
    const handleSensorEvent = (event: SensorEvent) => {
        switch (event.type) {
            case 'initial_sensors':
                if (event.data?.sensors) {
                    setExternalSensorState(prev => ({
                        ...prev,
                        availableSensors: event.data.sensors,
                        selectedSensorId: prev.selectedSensorId ||
                            (event.data.sensors.length > 0 ? event.data.sensors[0].id : null)
                    }));
                }
                break;

            case 'capture_progress':
                if (event.data && event.deviceId === externalSensorState.selectedSensorId) {
                    setExternalSensorState(prev => ({
                        ...prev,
                        captureProgress: {
                            quality: event.data.quality || 0,
                            status: event.data.status || 'Processing...',
                            attempt: event.data.attempt || 1,
                            maxAttempts: event.data.maxAttempts || 3
                        }
                    }));
                }
                break;

            case 'capture_complete':
                if (event.deviceId === externalSensorState.selectedSensorId) {
                    const externalData: ExternalFingerprintData = {
                        template: event.data.template,
                        quality: event.data.quality,
                        sensorId: event.deviceId,
                        sensorType: 'generic', // This would be determined by the sensor
                        capturedAt: new Date(),
                        metadata: event.data.metadata
                    };

                    setExternalFingerprintData(externalData);
                    setExternalSensorState(prev => ({
                        ...prev,
                        lastCaptureResult: externalData,
                        isCapturing: false,
                        captureProgress: null
                    }));

                    toast.success('External fingerprint captured successfully! 🔐');
                }
                break;

            case 'error':
                if (event.deviceId === externalSensorState.selectedSensorId) {
                    setExternalSensorState(prev => ({
                        ...prev,
                        isCapturing: false,
                        captureProgress: null,
                        error: event.data?.message || 'Capture failed'
                    }));
                    toast.error(event.data?.message || 'Sensor error occurred');
                }
                break;

            case 'connected':
            case 'disconnected':
                // Refresh sensor list
                loadAvailableSensors();
                break;
        }
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

            // Start/stop camera based on face selection and capture mode
            if (biometric === 'face') {
                if (newSelection.includes('face') && captureMode === 'camera') {
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
        const hasFingerprintData = selectedBiometrics.includes('fingerprint') &&
            (fingerprintData || externalFingerprintData);

        if (!hasFaceData && !hasFingerprintData) {
            const missing = [];
            if (selectedBiometrics.includes('face') && !capturedImage) missing.push('face photo');
            if (selectedBiometrics.includes('fingerprint') && !fingerprintData && !externalFingerprintData) {
                missing.push('fingerprint');
            }
            toast.error(`Please capture your ${missing.join(' and ')}`);
            return;
        }

        setIsEnrolling(true);
        setEnrollmentResult(null);

        try {
            const response = await apiService.enrollStudent({
                ...formData,
                faceImage: capturedImage || undefined,
                fingerprintData: fingerprintData || undefined,
                externalFingerprintData: externalFingerprintData || undefined,
                fingerprintMode: externalFingerprintData ? 'external' :
                    fingerprintData ? 'webauthn' : undefined
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
        <div className="min-h-screen bg-gradient-to-br via-purple-900 from-slate-900 to-slate-900">
            {/* Animated Background */}
            <div className="overflow-hidden absolute inset-0">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl animate-pulse bg-purple-500/15"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl animate-pulse bg-blue-500/15" style={{ animationDelay: '2s' }}></div>
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
                    <div className="overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br rounded-2xl from-emerald-500/20 to-cyan-500/20"></div>
                        <div className="relative p-6 rounded-2xl border shadow-2xl backdrop-blur-sm bg-white/10 border-white/20">
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
                                    <div className="flex gap-3 items-center">
                                        <Camera className="w-6 h-6 text-white" />
                                        <div className="text-left">
                                            <h4 className="font-bold text-white">Face Recognition</h4>
                                            <p className="text-sm text-white/70">Use your camera</p>
                                        </div>
                                        {selectedBiometrics.includes('face') && (
                                            <CheckCircle className="ml-auto w-5 h-5 text-green-400" />
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
                                    <div className="flex gap-3 items-center">
                                        <Fingerprint className="w-6 h-6 text-white" />
                                        <div className="text-left">
                                            <h4 className="font-bold text-white">Fingerprint</h4>
                                            <p className="text-sm text-white/70">
                                                {isFingerprintSupported ? 'Touch sensor' : 'Not available'}
                                            </p>
                                        </div>
                                        {selectedBiometrics.includes('fingerprint') && (
                                            <CheckCircle className="ml-auto w-5 h-5 text-green-400" />
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
                    {/* Camera/Upload Section - Only show if face is selected */}
                    {selectedBiometrics.includes('face') && (
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br rounded-3xl from-indigo-500/20 to-purple-500/20"></div>
                            <div className="relative p-8 rounded-3xl border shadow-2xl backdrop-blur-sm bg-white/10 border-white/20">
                                <div className="flex gap-3 items-center justify-between mb-6">
                                    <div className="flex gap-3 items-center">
                                        {captureMode === 'camera' ? (
                                            <Camera className="w-6 h-6 text-white" />
                                        ) : (
                                            <Upload className="w-6 h-6 text-white" />
                                        )}
                                        <h3 className="text-xl font-semibold text-white">Capture Profile Photo</h3>
                                    </div>

                                    {/* Mode Toggle */}
                                    <div className="flex gap-2 items-center p-1 rounded-xl border backdrop-blur-sm bg-white/5 border-white/20">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                setCaptureMode('camera');
                                                setCapturedImage(null);
                                                setUploadError(null);
                                            }}
                                            className={`flex gap-2 items-center px-4 py-2 rounded-lg transition-all duration-300 ${captureMode === 'camera'
                                                ? 'bg-blue-500/30 text-white shadow-lg'
                                                : 'text-white/70 hover:text-white hover:bg-white/10'
                                                }`}
                                        >
                                            <Camera className="w-4 h-4" />
                                            <span className="text-sm font-medium">Camera</span>
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                setCaptureMode('upload');
                                                setCapturedImage(null);
                                                setUploadError(null);
                                                stopCamera();
                                            }}
                                            className={`flex gap-2 items-center px-4 py-2 rounded-lg transition-all duration-300 ${captureMode === 'upload'
                                                ? 'bg-purple-500/30 text-white shadow-lg'
                                                : 'text-white/70 hover:text-white hover:bg-white/10'
                                                }`}
                                        >
                                            <Upload className="w-4 h-4" />
                                            <span className="text-sm font-medium">Upload</span>
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Camera/Upload Preview */}
                                <div className="relative mb-6">
                                    {captureMode === 'camera' ? (
                                        <div className="overflow-hidden relative rounded-2xl border-2 shadow-xl aspect-video bg-black/30 border-white/20">
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
                                                <div className="flex gap-2 items-center px-4 py-2 rounded-xl border backdrop-blur-sm bg-black/60 border-white/20">
                                                    <div className={`w-3 h-3 rounded-full ${cameraState.isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                                                    <span className="text-sm font-medium text-white">
                                                        {cameraState.isActive ? 'Live' : 'Offline'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            className={`overflow-hidden relative rounded-2xl border-2 shadow-xl aspect-video bg-black/30 border-white/20 transition-all duration-300 ${isDragOver ? 'border-blue-400 bg-blue-500/20' : ''
                                                }`}
                                        >
                                            {capturedImage ? (
                                                <img src={capturedImage} alt="Uploaded" className="object-cover w-full h-full" />
                                            ) : (
                                                <div className="flex flex-col gap-4 justify-center items-center h-full p-8">
                                                    {isValidatingImage ? (
                                                        <>
                                                            <Loader2 className="w-12 h-12 text-white animate-spin" />
                                                            <p className="text-lg font-semibold text-white">Validating image...</p>
                                                            <p className="text-sm text-center text-white/60">Checking for face detection</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="p-4 rounded-full bg-white/10">
                                                                <ImageIcon className="w-12 h-12 text-white/70" />
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-lg font-semibold text-white mb-2">
                                                                    {isDragOver ? 'Drop your photo here' : 'Upload Profile Photo'}
                                                                </p>
                                                                <p className="text-sm text-white/60 mb-4">
                                                                    Drag and drop or click to browse
                                                                </p>
                                                                <p className="text-xs text-white/50">
                                                                    JPEG or PNG, max 5MB, one face required
                                                                </p>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            {/* Upload Status Indicator */}
                                            {!capturedImage && (
                                                <div className="absolute top-4 right-4">
                                                    <div className="flex gap-2 items-center px-4 py-2 rounded-xl border backdrop-blur-sm bg-black/60 border-white/20">
                                                        <div className={`w-3 h-3 rounded-full ${capturedImage ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                                                        <span className="text-sm font-medium text-white">
                                                            {capturedImage ? 'Uploaded' : 'Pending'}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Hidden file input */}
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png"
                                                onChange={handleFileInputChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                disabled={isValidatingImage}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Error Message */}
                                {uploadError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-4 p-4 rounded-xl border backdrop-blur-sm bg-red-500/20 border-red-500/30"
                                    >
                                        <div className="flex gap-2 items-center">
                                            <AlertCircle className="w-5 h-5 text-red-300" />
                                            <p className="text-sm text-red-200">{uploadError}</p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Controls */}
                                <div className="flex gap-3">
                                    {captureMode === 'camera' ? (
                                        !capturedImage ? (
                                            <>
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={cameraState.isActive ? stopCamera : startCamera}
                                                    disabled={!modelsLoaded}
                                                    className="flex gap-2 items-center px-4 py-3 text-white rounded-xl border backdrop-blur-sm transition-all duration-300 bg-white/10 border-white/20 hover:bg-white/20 disabled:opacity-50"
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
                                                    className="flex flex-1 gap-2 justify-center items-center px-6 py-3 font-bold text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-xl transition-all duration-300 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                className="flex flex-1 gap-2 justify-center items-center px-6 py-3 font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-xl transition-all duration-300 hover:from-orange-600 hover:to-red-600"
                                            >
                                                <RefreshCw className="w-5 h-5" />
                                                Retake Photo
                                            </motion.button>
                                        )
                                    ) : (
                                        capturedImage ? (
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleRetake}
                                                className="flex flex-1 gap-2 justify-center items-center px-6 py-3 font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-xl transition-all duration-300 hover:from-orange-600 hover:to-red-600"
                                            >
                                                <RefreshCw className="w-5 h-5" />
                                                Remove Photo
                                            </motion.button>
                                        ) : (
                                            <div className="flex flex-1 gap-2 justify-center items-center px-6 py-3 text-sm text-white/60">
                                                <Upload className="w-5 h-5" />
                                                <span>Click the area above or drag & drop to upload</span>
                                            </div>
                                        )
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
                            className="overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br rounded-3xl from-purple-500/20 to-pink-500/20"></div>
                            <div className="relative p-8 rounded-3xl border shadow-2xl backdrop-blur-sm bg-white/10 border-white/20">
                                <div className="flex gap-3 items-center mb-6">
                                    <Fingerprint className="w-6 h-6 text-white" />
                                    <h3 className="text-xl font-semibold text-white">Fingerprint Registration</h3>
                                </div>

                                {/* Sensor Selection */}
                                {fingerprintMode.externalSensorsAvailable && (
                                    <div className="mb-4">
                                        <div className="flex gap-2 items-center justify-between mb-2">
                                            <label className="flex gap-2 items-center text-sm font-medium text-white">
                                                <Usb className="w-4 h-4" />
                                                External Fingerprint Sensor
                                            </label>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={loadAvailableSensors}
                                                disabled={externalSensorState.isConnecting}
                                                className="flex gap-1 items-center px-3 py-1 text-xs font-medium text-white rounded-lg border backdrop-blur-sm bg-white/10 border-white/20 hover:bg-white/20 disabled:opacity-50 transition-all"
                                                title="Refresh sensor list"
                                            >
                                                {externalSensorState.isConnecting ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <RefreshCw className="w-3 h-3" />
                                                )}
                                                Refresh
                                            </motion.button>
                                        </div>
                                        {externalSensorState.availableSensors.length > 0 ? (
                                            <select
                                                value={externalSensorState.selectedSensorId || ''}
                                                onChange={(e) => setExternalSensorState(prev => ({ ...prev, selectedSensorId: e.target.value }))}
                                                className="w-full p-3 text-white rounded-xl border shadow-lg bg-black/30 border-white/20 backdrop-blur-sm focus:border-purple-400 focus:outline-none"
                                            >
                                                {externalSensorState.availableSensors.map((sensor) => (
                                                    <option key={sensor.id} value={sensor.id} className="bg-gray-800">
                                                        {sensor.name} ({sensor.status})
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="p-4 text-sm text-yellow-200 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
                                                <div className="flex gap-2 items-start">
                                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="font-medium mb-1">No external sensors detected</p>
                                                        <p className="text-xs text-yellow-300/80">
                                                            Make sure your fingerprint scanner is connected via USB.
                                                            Try refreshing or check <code className="px-1 py-0.5 bg-black/30 rounded">/api/sensors/debug/all-devices</code> to see all connected devices.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Fingerprint Status */}
                                <div className="relative mb-6">
                                    <div className="flex overflow-hidden relative justify-center items-center bg-gradient-to-br rounded-2xl border-2 shadow-xl aspect-video from-purple-900/50 to-pink-900/50 border-white/20">
                                        {(fingerprintData || externalFingerprintData) ? (
                                            <div className="flex flex-col gap-4 items-center p-8">
                                                <CheckCircle className="w-20 h-20 text-green-400 animate-pulse" />
                                                <p className="text-xl font-bold text-white">Fingerprint Captured!</p>
                                                <p className="text-sm text-center text-white/70">
                                                    {externalFingerprintData
                                                        ? `External sensor • Quality: ${externalFingerprintData.quality}%`
                                                        : 'Built-in sensor • Securely registered'
                                                    }
                                                </p>
                                            </div>
                                        ) : externalSensorState.isCapturing ? (
                                            <div className="flex flex-col gap-4 items-center p-8">
                                                <div className="relative">
                                                    <Fingerprint className="w-20 h-20 text-blue-400 animate-pulse" />
                                                    <Loader2 className="absolute -top-2 -right-2 w-8 h-8 text-blue-300 animate-spin" />
                                                </div>
                                                <p className="text-lg font-semibold text-white">Capturing...</p>
                                                {externalSensorState.captureProgress && (
                                                    <div className="text-center">
                                                        <p className="text-sm text-white/80">{externalSensorState.captureProgress.status}</p>
                                                        <div className="w-48 h-2 mt-2 bg-white/20 rounded-full">
                                                            <div
                                                                className="h-full bg-blue-400 rounded-full transition-all duration-300"
                                                                style={{ width: `${(externalSensorState.captureProgress.quality || 0)}%` }}
                                                            />
                                                        </div>
                                                        <p className="text-xs mt-1 text-white/60">
                                                            Attempt {externalSensorState.captureProgress.attempt}/{externalSensorState.captureProgress.maxAttempts}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-4 items-center p-8">
                                                {fingerprintMode.externalSensorsAvailable ? (
                                                    <Usb className="w-20 h-20 text-white/50" />
                                                ) : (
                                                    <Fingerprint className="w-20 h-20 text-white/50" />
                                                )}
                                                <p className="text-lg font-semibold text-white">Ready to Capture</p>
                                                <p className="text-sm text-center text-white/60">
                                                    {fingerprintMode.externalSensorsAvailable
                                                        ? externalSensorState.availableSensors.length > 0
                                                            ? 'Click below to capture from external sensor'
                                                            : 'External sensors expected but none detected. Try refreshing or check device connection.'
                                                        : 'Click below to register your fingerprint'
                                                    }
                                                </p>
                                                {fingerprintMode.externalSensorsAvailable && externalSensorState.availableSensors.length === 0 && (
                                                    <p className="text-xs text-center text-yellow-300/70 mt-2">
                                                        💡 Check <code className="px-1 py-0.5 bg-black/30 rounded">/api/sensors/debug/all-devices</code> to see all connected USB devices
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Status Indicators */}
                                        <div className="absolute top-4 right-4 flex flex-col gap-2">
                                            {/* Capture Status */}
                                            <div className="flex gap-2 items-center px-3 py-1 rounded-lg border backdrop-blur-sm bg-black/60 border-white/20">
                                                <div className={`w-2 h-2 rounded-full ${(fingerprintData || externalFingerprintData) ? 'bg-green-400' :
                                                    externalSensorState.isCapturing ? 'bg-blue-400 animate-pulse' :
                                                        'bg-yellow-400'
                                                    }`}></div>
                                                <span className="text-xs font-medium text-white">
                                                    {(fingerprintData || externalFingerprintData) ? 'Captured' :
                                                        externalSensorState.isCapturing ? 'Capturing' : 'Pending'}
                                                </span>
                                            </div>

                                            {/* Connection Status */}
                                            {fingerprintMode.externalSensorsAvailable && (
                                                <div className="flex gap-2 items-center px-3 py-1 rounded-lg border backdrop-blur-sm bg-black/60 border-white/20">
                                                    {externalSensorState.sseConnected ? (
                                                        <Wifi className="w-3 h-3 text-green-400" />
                                                    ) : (
                                                        <WifiOff className="w-3 h-3 text-red-400" />
                                                    )}
                                                    <span className="text-xs font-medium text-white">
                                                        {externalSensorState.sseConnected ? 'Connected' : 'Offline'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Method Indicator */}
                                        <div className="absolute top-4 left-4">
                                            <div className="flex gap-2 items-center px-3 py-1 rounded-lg border backdrop-blur-sm bg-black/60 border-white/20">
                                                {fingerprintMode.externalSensorsAvailable ? (
                                                    <Zap className="w-3 h-3 text-blue-400" />
                                                ) : (
                                                    <Shield className="w-3 h-3 text-purple-400" />
                                                )}
                                                <span className="text-xs font-medium text-white">
                                                    {fingerprintMode.externalSensorsAvailable ? 'External' : 'Built-in'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Error Display */}
                                {externalSensorState.error && (
                                    <div className="p-3 mb-4 text-sm text-red-200 rounded-lg bg-red-500/20 border border-red-500/30">
                                        <div className="flex gap-2 items-center">
                                            <AlertCircle className="w-4 h-4" />
                                            <span>{externalSensorState.error}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Fingerprint Controls */}
                                <div className="flex gap-3">
                                    {!(fingerprintData || externalFingerprintData) ? (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleCaptureFingerprint}
                                            disabled={
                                                !formData.name ||
                                                !formData.email ||
                                                externalSensorState.isCapturing ||
                                                (fingerprintMode.externalSensorsAvailable && !externalSensorState.selectedSensorId)
                                            }
                                            className="flex flex-1 gap-2 justify-center items-center px-6 py-3 font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-xl transition-all duration-300 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {externalSensorState.isCapturing ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : fingerprintMode.externalSensorsAvailable ? (
                                                <Usb className="w-5 h-5" />
                                            ) : (
                                                <Fingerprint className="w-5 h-5" />
                                            )}
                                            {externalSensorState.isCapturing
                                                ? 'Capturing...'
                                                : fingerprintMode.externalSensorsAvailable
                                                    ? 'Capture from External Sensor'
                                                    : 'Register Fingerprint'
                                            }
                                        </motion.button>
                                    ) : (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleRetakeFingerprint}
                                            disabled={externalSensorState.isCapturing}
                                            className="flex flex-1 gap-2 justify-center items-center px-6 py-3 font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-xl transition-all duration-300 hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
                                        >
                                            <RefreshCw className="w-5 h-5" />
                                            Re-register Fingerprint
                                        </motion.button>
                                    )}

                                    {/* Sensor Settings Button */}
                                    {fingerprintMode.externalSensorsAvailable && (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={loadAvailableSensors}
                                            disabled={externalSensorState.isConnecting}
                                            className="flex gap-2 justify-center items-center px-4 py-3 font-medium text-white rounded-xl border shadow-lg bg-white/10 border-white/20 backdrop-blur-sm transition-all duration-300 hover:bg-white/20 disabled:opacity-50"
                                        >
                                            {externalSensorState.isConnecting ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Settings className="w-4 h-4" />
                                            )}
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
                        className="overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br rounded-3xl from-blue-500/20 to-cyan-500/20"></div>
                        <div className="relative p-8 rounded-3xl border shadow-2xl backdrop-blur-sm bg-white/10 border-white/20">
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
                                        className="px-4 py-3 w-full text-white rounded-xl border backdrop-blur-sm transition-all duration-300 placeholder-white/50 bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/20"
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
                                        className="px-4 py-3 w-full text-white rounded-xl border backdrop-blur-sm transition-all duration-300 placeholder-white/50 bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/20"
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
                                        className="px-4 py-3 w-full text-white rounded-xl border backdrop-blur-sm transition-all duration-300 placeholder-white/50 bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/20"
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

                                {/* Father's Name */}
                                <div>
                                    <label className="flex gap-2 items-center mb-2 text-sm font-medium text-white">
                                        <User className="w-4 h-4" />
                                        Father's Name (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        name="fatherName"
                                        value={formData.fatherName || ''}
                                        onChange={handleInputChange}
                                        className="px-4 py-3 w-full text-white rounded-xl border backdrop-blur-sm transition-all duration-300 placeholder-white/50 bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/20"
                                        placeholder="Enter father's name"
                                    />
                                </div>

                                {/* Mother's Name */}
                                <div>
                                    <label className="flex gap-2 items-center mb-2 text-sm font-medium text-white">
                                        <User className="w-4 h-4" />
                                        Mother's Name (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        name="motherName"
                                        value={formData.motherName || ''}
                                        onChange={handleInputChange}
                                        className="px-4 py-3 w-full text-white rounded-xl border backdrop-blur-sm transition-all duration-300 placeholder-white/50 bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/20"
                                        placeholder="Enter mother's name"
                                    />
                                </div>

                                {/* Blood Group */}
                                <div>
                                    <label className="flex gap-2 items-center mb-2 text-sm font-medium text-white">
                                        <Droplet className="w-4 h-4" />
                                        Blood Group (Optional)
                                    </label>
                                    <select
                                        name="bloodGroup"
                                        value={formData.bloodGroup || ''}
                                        onChange={handleInputChange}
                                        className="px-4 py-3 w-full text-white rounded-xl border backdrop-blur-sm transition-all duration-300 bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/20"
                                    >
                                        <option value="" className="text-black">Select blood group</option>
                                        <option value="A+" className="text-black">A+</option>
                                        <option value="A-" className="text-black">A-</option>
                                        <option value="B+" className="text-black">B+</option>
                                        <option value="B-" className="text-black">B-</option>
                                        <option value="AB+" className="text-black">AB+</option>
                                        <option value="AB-" className="text-black">AB-</option>
                                        <option value="O+" className="text-black">O+</option>
                                        <option value="O-" className="text-black">O-</option>
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
                                        (selectedBiometrics.includes('fingerprint') && !fingerprintData && !externalFingerprintData)
                                    }
                                    className="flex gap-3 justify-center items-center px-8 py-4 w-full text-xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-xl transition-all duration-300 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                    <div className="flex gap-2 items-center mt-3">
                                                        <span className="text-sm text-white/70">Enrolled with:</span>
                                                        {enrollmentResult.biometricMethods.map((method: string) => (
                                                            <span key={method} className="px-2 py-1 text-xs font-medium text-white rounded-lg bg-white/20">
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
