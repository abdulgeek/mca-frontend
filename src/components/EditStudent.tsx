import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, Mail, Phone, BookOpen, Camera, Droplet } from 'lucide-react';
import { toast } from 'react-toastify';
import { apiService } from '../services/api';
import { Student, UpdateStudentData, UpdateBiometricsData } from '../types';
import { useFaceRecognition } from '../hooks/useFaceRecognition';

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

    const handleUpdateBiometrics = async () => {
        try {
            setUpdating(true);

            if (!capturedImage) {
                toast.error('Please capture a face image');
                return;
            }

            const biometricData: UpdateBiometricsData = {
                faceImage: capturedImage
            };

            const response = await apiService.updateStudentBiometrics(student._id, biometricData);

            if (response.success) {
                toast.success('Biometric data updated successfully');
                clearCapturedImage();
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
                                        <h3 className="mb-4 text-lg font-semibold text-white">Update Face Recognition</h3>

                                        <div className="space-y-4">
                                            {/* Camera/Preview */}
                                            <div className="overflow-hidden relative rounded-xl border backdrop-blur-sm bg-white/5 border-white/10">
                                                {capturedImage ? (
                                                    <img
                                                        src={capturedImage}
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
                                                {!cameraState.isActive && !capturedImage && (
                                                    <div className="flex absolute inset-0 justify-center items-center bg-slate-800/50">
                                                        <div className="text-center">
                                                            <Camera className="mx-auto mb-4 w-16 h-16 text-white/30" />
                                                            <p className="text-white/70">Camera not started</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Camera Controls */}
                                            <div className="flex gap-3">
                                                {!cameraState.isActive && !capturedImage && (
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

                                                {cameraState.isActive && !capturedImage && (
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

                                                {capturedImage && (
                                                    <>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => {
                                                                clearCapturedImage();
                                                                handleStartCamera();
                                                            }}
                                                            className="px-6 py-3 font-medium text-white rounded-xl bg-white/10 hover:bg-white/20"
                                                        >
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

