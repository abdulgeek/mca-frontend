import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, Mail, Phone, BookOpen, Camera, Droplet, Upload, Image as ImageIcon, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { apiService } from '../services/api';
import { Student, UpdateStudentData, UpdateBiometricsData } from '../types';
import { useFaceRecognition } from '../hooks/useFaceRecognition';
import * as faceapi from 'face-api.js';

interface EditStudentProps {
    student: Student;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const COURSES = [
    '1st Standard', '2nd Standard', '3rd Standard', '4th Standard', '5th Standard',
    '6th Standard', '7th Standard', '8th Standard', '9th Standard', '10th Standard',
    '1st PUC - Science', '1st PUC - Commerce',
    '2nd PUC - Science', '2nd PUC - Commerce',
    'Degree - MCA', 'Degree - BCA', 'Degree - B.Com', 'Degree - B.Sc', 'Degree - BA', 'Degree - Other',
    'DCA', 'Programming', 'DCAD'
];

const EditStudent: React.FC<EditStudentProps> = ({ student, isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState<UpdateStudentData>({
        name: student.name,
        email: student.email,
        phone: student.phone,
        course: student.course,
        fatherName: student.fatherName || '',
        motherName: student.motherName || '',
        bloodGroup: student.bloodGroup || ''
    });

    const [updating, setUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState<'basic' | 'biometric'>('basic');
    const [captureMode, setCaptureMode] = useState<'camera' | 'upload'>('camera');
    const [isValidatingImage, setIsValidatingImage] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [faceModelsLoaded, setFaceModelsLoaded] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);

    const {
        videoRef,
        canvasRef,
        cameraState,
        startCamera,
        stopCamera,
        captureImageWithPreview,
        capturedImage,
        clearCapturedImage
    } = useFaceRecognition();

    // Use uploaded image if available, otherwise use captured image from hook
    const currentImage = uploadedImage || capturedImage;

    // Load face-api.js models for face detection
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
            }
        };
        loadFaceModels();
    }, []);

    // Start camera only when in camera mode
    useEffect(() => {
        if (activeTab === 'biometric' && captureMode === 'camera' && !capturedImage) {
            // Don't auto-start camera, let user start it manually
        } else if (captureMode === 'upload') {
            stopCamera();
        }
    }, [captureMode, activeTab, capturedImage, stopCamera]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateBasicInfo = async () => {
        try {
            setUpdating(true);

            // Validate required fields
            if (!formData.name || !formData.email || !formData.phone || !formData.course) {
                toast.error('Please fill in all required fields');
                return;
            }

            const response = await apiService.updateStudent(student._id, formData);

            if (response.success) {
                toast.success('Student information updated successfully');
                onSuccess();
            } else {
                toast.error(response.message || 'Failed to update student');
            }
        } catch (error: any) {
            console.error('❌ Update student error:', error);
            toast.error(error.message || 'Failed to update student');
        } finally {
            setUpdating(false);
        }
    };

    const handleStartCamera = async () => {
        try {
            await startCamera();
        } catch (error: any) {
            toast.error(error.message || 'Failed to start camera');
        }
    };

    const handleCaptureImage = async () => {
        try {
            const image = await captureImageWithPreview();
            if (image) {
                stopCamera();
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to capture image');
        }
    };

    // Validate uploaded image with face detection
    const validateUploadedImage = useCallback(async (file: File): Promise<{ valid: boolean; imageData: string | null; error?: string }> => {
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

            // Validate image dimensions (minimum 200x200 recommended)
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
    }, [faceModelsLoaded]);

    // Handle file upload
    const handleFileUpload = useCallback(async (file: File) => {
        const result = await validateUploadedImage(file);

        if (result.valid && result.imageData) {
            setUploadedImage(result.imageData);
            setUploadError(null);
            toast.success('Photo uploaded and validated successfully!');
        } else {
            setUploadError(result.error || 'Invalid image');
            toast.error(result.error || 'Failed to upload image');
        }
    }, [validateUploadedImage]);

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

    const handleUpdateBiometrics = async () => {
        try {
            setUpdating(true);

            if (!currentImage) {
                toast.error('Please capture or upload a face image');
                return;
            }

            const biometricData: UpdateBiometricsData = {
                faceImage: currentImage
            };

            const response = await apiService.updateStudentBiometrics(student._id, biometricData);

            if (response.success) {
                toast.success('Biometric data updated successfully');
                clearCapturedImage();
                setUploadedImage(null);
                onSuccess();
            } else {
                toast.error(response.message || 'Failed to update biometric data');
            }
        } catch (error: any) {
            console.error('❌ Update biometrics error:', error);
            toast.error(error.message || 'Failed to update biometric data');
        } finally {
            setUpdating(false);
        }
    };

    const handleClose = () => {
        if (cameraState.isActive) {
            stopCamera();
        }
        clearCapturedImage();
        setUploadedImage(null);
        setUploadError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-y-auto fixed inset-0 z-[60] p-4 bg-black/70 backdrop-blur-sm"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative mx-auto my-8 w-full max-w-2xl"
                >
                    <div className="overflow-hidden rounded-3xl border shadow-2xl backdrop-blur-sm bg-slate-900/95 border-white/20">
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20">
                            <h2 className="text-2xl font-bold text-white">Edit Student</h2>
                            <button
                                onClick={handleClose}
                                className="p-2 text-white rounded-xl transition-colors hover:bg-white/10"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b bg-white/5 border-white/10">
                            <button
                                onClick={() => setActiveTab('basic')}
                                className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === 'basic'
                                    ? 'text-white bg-white/10 border-b-2 border-blue-500'
                                    : 'text-white/70 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <div className="flex gap-2 justify-center items-center">
                                    <User className="w-5 h-5" />
                                    Basic Information
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('biometric')}
                                className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === 'biometric'
                                    ? 'text-white bg-white/10 border-b-2 border-purple-500'
                                    : 'text-white/70 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <div className="flex gap-2 justify-center items-center">
                                    <Camera className="w-5 h-5" />
                                    Biometric Data
                                </div>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {activeTab === 'basic' ? (
                                <div className="space-y-4">
                                    {/* Name */}
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-white">
                                            Full Name *
                                        </label>
                                        <div className="relative">
                                            <User className="absolute top-3.5 left-3 w-5 h-5 text-white/50" />
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className="py-3 pr-4 pl-10 w-full text-white rounded-lg border backdrop-blur-sm transition-all placeholder-white/50 bg-white/5 border-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none"
                                                placeholder="Enter full name"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-white">
                                            Email Address *
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute top-3.5 left-3 w-5 h-5 text-white/50" />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="py-3 pr-4 pl-10 w-full text-white rounded-lg border backdrop-blur-sm transition-all placeholder-white/50 bg-white/5 border-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none"
                                                placeholder="Enter email address"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-white">
                                            Phone Number *
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute top-3.5 left-3 w-5 h-5 text-white/50" />
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className="py-3 pr-4 pl-10 w-full text-white rounded-lg border backdrop-blur-sm transition-all placeholder-white/50 bg-white/5 border-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none"
                                                placeholder="Enter phone number"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Course */}
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-white">
                                            Course *
                                        </label>
                                        <div className="relative">
                                            <BookOpen className="absolute top-3.5 left-3 w-5 h-5 text-white/50" />
                                            <select
                                                name="course"
                                                value={formData.course}
                                                onChange={handleInputChange}
                                                className="py-3 pr-4 pl-10 w-full text-white rounded-lg border backdrop-blur-sm transition-all bg-white/5 border-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none"
                                                required
                                            >
                                                {COURSES.map(course => (
                                                    <option key={course} value={course} className="bg-slate-800">
                                                        {course}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Father's Name */}
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-white">
                                            Father's Name
                                        </label>
                                        <div className="relative">
                                            <User className="absolute top-3.5 left-3 w-5 h-5 text-white/50" />
                                            <input
                                                type="text"
                                                name="fatherName"
                                                value={formData.fatherName}
                                                onChange={handleInputChange}
                                                className="py-3 pr-4 pl-10 w-full text-white rounded-lg border backdrop-blur-sm transition-all placeholder-white/50 bg-white/5 border-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none"
                                                placeholder="Enter father's name"
                                            />
                                        </div>
                                    </div>

                                    {/* Mother's Name */}
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-white">
                                            Mother's Name
                                        </label>
                                        <div className="relative">
                                            <User className="absolute top-3.5 left-3 w-5 h-5 text-white/50" />
                                            <input
                                                type="text"
                                                name="motherName"
                                                value={formData.motherName}
                                                onChange={handleInputChange}
                                                className="py-3 pr-4 pl-10 w-full text-white rounded-lg border backdrop-blur-sm transition-all placeholder-white/50 bg-white/5 border-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none"
                                                placeholder="Enter mother's name"
                                            />
                                        </div>
                                    </div>

                                    {/* Blood Group */}
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-white">
                                            Blood Group (Optional)
                                        </label>
                                        <div className="relative">
                                            <Droplet className="absolute top-3.5 left-3 w-5 h-5 text-white/50" />
                                            <select
                                                name="bloodGroup"
                                                value={formData.bloodGroup}
                                                onChange={handleInputChange}
                                                className="py-3 pr-4 pl-10 w-full text-white rounded-lg border backdrop-blur-sm transition-all bg-white/5 border-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none"
                                            >
                                                <option value="" className="bg-slate-800">Select blood group</option>
                                                <option value="A+" className="bg-slate-800">A+</option>
                                                <option value="A-" className="bg-slate-800">A-</option>
                                                <option value="B+" className="bg-slate-800">B+</option>
                                                <option value="B-" className="bg-slate-800">B-</option>
                                                <option value="AB+" className="bg-slate-800">AB+</option>
                                                <option value="AB-" className="bg-slate-800">AB-</option>
                                                <option value="O+" className="bg-slate-800">O+</option>
                                                <option value="O-" className="bg-slate-800">O-</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex gap-3 justify-end pt-4">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleClose}
                                            className="px-6 py-3 font-medium text-white rounded-xl transition-colors bg-white/10 hover:bg-white/20"
                                        >
                                            Cancel
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleUpdateBasicInfo}
                                            disabled={updating}
                                            className="inline-flex gap-2 items-center px-6 py-3 font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl transition-all hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Save className="w-5 h-5" />
                                            {updating ? 'Saving...' : 'Save Changes'}
                                        </motion.button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Face Recognition */}
                                    <div>
                                        <div className="flex gap-3 items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-white">Update Face Recognition</h3>

                                            {/* Mode Toggle */}
                                            <div className="flex gap-2 items-center p-1 rounded-xl border backdrop-blur-sm bg-white/5 border-white/20">
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => {
                                                        setCaptureMode('camera');
                                                        setUploadedImage(null);
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
                                                        setUploadedImage(null);
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

                                        <div className="space-y-4">
                                            {/* Camera/Upload Preview */}
                                            {captureMode === 'camera' ? (
                                                <div className="overflow-hidden relative rounded-xl border backdrop-blur-sm bg-white/5 border-white/10">
                                                    {currentImage ? (
                                                        <img
                                                            src={currentImage}
                                                            alt="Captured"
                                                            className="object-cover w-full h-80"
                                                        />
                                                    ) : (
                                                        <>
                                                            <video
                                                                ref={videoRef}
                                                                autoPlay
                                                                playsInline
                                                                muted
                                                                className="object-cover w-full h-80 bg-slate-800"
                                                            />
                                                            <canvas ref={canvasRef} className="hidden" />
                                                        </>
                                                    )}
                                                    {!cameraState.isActive && !currentImage && (
                                                        <div className="flex absolute inset-0 justify-center items-center bg-slate-800/50">
                                                            <div className="text-center">
                                                                <Camera className="mx-auto mb-4 w-16 h-16 text-white/30" />
                                                                <p className="text-white/70">Camera not started</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div
                                                    onDragOver={handleDragOver}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={handleDrop}
                                                    className={`overflow-hidden relative rounded-xl border backdrop-blur-sm bg-white/5 border-white/10 transition-all duration-300 ${isDragOver ? 'border-blue-400 bg-blue-500/20' : ''
                                                        }`}
                                                >
                                                    {currentImage ? (
                                                        <img
                                                            src={currentImage}
                                                            alt="Uploaded"
                                                            className="object-cover w-full h-80"
                                                        />
                                                    ) : (
                                                        <div className="flex flex-col gap-4 justify-center items-center h-80 p-8">
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

                                            {/* Error Message */}
                                            {uploadError && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="p-4 rounded-xl border backdrop-blur-sm bg-red-500/20 border-red-500/30"
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
                                                    !currentImage ? (
                                                        <>
                                                            {!cameraState.isActive && (
                                                                <motion.button
                                                                    whileHover={{ scale: 1.05 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    onClick={handleStartCamera}
                                                                    className="inline-flex flex-1 gap-2 justify-center items-center px-6 py-3 font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl"
                                                                >
                                                                    <Camera className="w-5 h-5" />
                                                                    Start Camera
                                                                </motion.button>
                                                            )}

                                                            {cameraState.isActive && (
                                                                <>
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.05 }}
                                                                        whileTap={{ scale: 0.95 }}
                                                                        onClick={handleCaptureImage}
                                                                        className="inline-flex flex-1 gap-2 justify-center items-center px-6 py-3 font-medium text-white bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl"
                                                                    >
                                                                        <Camera className="w-5 h-5" />
                                                                        Capture Image
                                                                    </motion.button>
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.05 }}
                                                                        whileTap={{ scale: 0.95 }}
                                                                        onClick={stopCamera}
                                                                        className="px-6 py-3 font-medium text-white rounded-xl bg-white/10 hover:bg-white/20"
                                                                    >
                                                                        Cancel
                                                                    </motion.button>
                                                                </>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => {
                                                                    clearCapturedImage();
                                                                    setUploadedImage(null);
                                                                    handleStartCamera();
                                                                }}
                                                                className="px-6 py-3 font-medium text-white rounded-xl bg-white/10 hover:bg-white/20"
                                                            >
                                                                <RefreshCw className="w-5 h-5 inline mr-2" />
                                                                Retake
                                                            </motion.button>
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={handleUpdateBiometrics}
                                                                disabled={updating}
                                                                className="inline-flex flex-1 gap-2 justify-center items-center px-6 py-3 font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl disabled:opacity-50"
                                                            >
                                                                <Save className="w-5 h-5" />
                                                                {updating ? 'Updating...' : 'Update Biometric'}
                                                            </motion.button>
                                                        </>
                                                    )
                                                ) : (
                                                    currentImage ? (
                                                        <>
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => {
                                                                    setUploadedImage(null);
                                                                    setUploadError(null);
                                                                }}
                                                                className="px-6 py-3 font-medium text-white rounded-xl bg-white/10 hover:bg-white/20"
                                                            >
                                                                <RefreshCw className="w-5 h-5 inline mr-2" />
                                                                Remove
                                                            </motion.button>
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={handleUpdateBiometrics}
                                                                disabled={updating}
                                                                className="inline-flex flex-1 gap-2 justify-center items-center px-6 py-3 font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl disabled:opacity-50"
                                                            >
                                                                <Save className="w-5 h-5" />
                                                                {updating ? 'Updating...' : 'Update Biometric'}
                                                            </motion.button>
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-1 gap-2 justify-center items-center px-6 py-3 text-sm text-white/60">
                                                            <Upload className="w-5 h-5" />
                                                            <span>Click the area above or drag & drop to upload</span>
                                                        </div>
                                                    )
                                                )}
                                            </div>

                                            <p className="text-sm text-center text-white/70">
                                                Position your face in the center and ensure good lighting
                                            </p>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-4 rounded-xl border bg-blue-500/10 border-blue-500/20">
                                        <p className="text-sm text-blue-200">
                                            <strong>Note:</strong> Updating biometric data will replace the existing face recognition data.
                                            Make sure the new image is clear and well-lit for best results.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default EditStudent;

