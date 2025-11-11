import React, { FC, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Printer, CheckSquare, Square, Loader2 } from 'lucide-react';
import { StudentListItem } from '../types';
import { pdf } from '@react-pdf/renderer';
import { BulkStudentIDCardPDF } from './BulkStudentIDCardPDF';
import { toast } from 'react-toastify';
import axios from 'axios';
import ceoSignature from '../assets/ceo.jpeg';
import courseDirectorSignature from '../assets/course-director.jpeg';
import academyLogo from '../assets/logo.webp';

interface BulkPrintIDCardsModalProps {
    isOpen: boolean;
    onClose: () => void;
    students: StudentListItem[];
}

const COURSES = [
    '1st Standard', '2nd Standard', '3rd Standard', '4th Standard', '5th Standard',
    '6th Standard', '7th Standard', '8th Standard', '9th Standard', '10th Standard',
    '1st PUC - Science', '1st PUC - Commerce',
    '2nd PUC - Science', '2nd PUC - Commerce',
    'Degree - MCA', 'Degree - BCA', 'Degree - B.Com', 'Degree - B.Sc', 'Degree - BA', 'Degree - Other',
    'DCA', 'Programming', 'DCAD'
];

export const BulkPrintIDCardsModal: FC<BulkPrintIDCardsModalProps> = ({
    isOpen,
    onClose,
    students
}) => {
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Filter students based on search and course
    const filteredStudents = useMemo(() => {
        let filtered = [...students];

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(s =>
                s.name.toLowerCase().includes(search) ||
                s.studentId.toLowerCase().includes(search) ||
                s.email.toLowerCase().includes(search)
            );
        }

        if (selectedCourse) {
            filtered = filtered.filter(s => s.course === selectedCourse);
        }

        return filtered;
    }, [students, searchTerm, selectedCourse]);

    // Check if all filtered students are selected
    const allSelected = filteredStudents.length > 0 && 
        filteredStudents.every(s => selectedStudentIds.has(s._id));

    // Toggle individual student selection
    const toggleStudent = (studentId: string) => {
        const newSelected = new Set(selectedStudentIds);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedStudentIds(newSelected);
    };

    // Toggle all filtered students
    const toggleAll = () => {
        if (allSelected) {
            // Deselect all filtered students
            const newSelected = new Set(selectedStudentIds);
            filteredStudents.forEach(s => newSelected.delete(s._id));
            setSelectedStudentIds(newSelected);
        } else {
            // Select all filtered students
            const newSelected = new Set(selectedStudentIds);
            filteredStudents.forEach(s => newSelected.add(s._id));
            setSelectedStudentIds(newSelected);
        }
    };

    // Reset selections when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedStudentIds(new Set());
            setSearchTerm('');
            setSelectedCourse('');
        }
    }, [isOpen]);

    // Helper function to convert image URL to base64 via backend proxy
    const convertImageToBase64 = async (imageUrl: string): Promise<string | null> => {
        try {
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
            const response = await axios.get(`${API_BASE_URL}/students/image/base64`, {
                params: { imageUrl }
            });

            if (response.data.success && response.data.data) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.error('Failed to convert image to base64:', error);
            return null;
        }
    };

    // Helper function to convert webp to PNG using canvas
    const convertWebpToPng = async (webpDataUrl: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }
                ctx.drawImage(img, 0, 0);
                const pngDataUrl = canvas.toDataURL('image/png');
                resolve(pngDataUrl);
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = webpDataUrl;
        });
    };

    const handlePrint = async () => {
        if (selectedStudentIds.size === 0) {
            toast.warning('Please select at least one student');
            return;
        }

        try {
            setIsGenerating(true);
            toast.info(`Generating PDF for ${selectedStudentIds.size} students...`);

            // Get selected students
            const selectedStudents = students.filter(s => selectedStudentIds.has(s._id));

            // Convert CEO signature to base64
            let ceoSignatureBase64: string | undefined = undefined;
            if (ceoSignature) {
                const response = await fetch(ceoSignature);
                const blob = await response.blob();
                const reader = new FileReader();
                ceoSignatureBase64 = await new Promise<string>((resolve) => {
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            }

            // Convert Course Director signature to base64
            let courseDirectorSignatureBase64: string | undefined = undefined;
            if (courseDirectorSignature) {
                const response = await fetch(courseDirectorSignature);
                const blob = await response.blob();
                const reader = new FileReader();
                courseDirectorSignatureBase64 = await new Promise<string>((resolve) => {
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            }

            // Convert Academy Logo to base64 and convert webp to PNG
            let academyLogoBase64: string | undefined = undefined;
            if (academyLogo) {
                try {
                    const response = await fetch(academyLogo);
                    const blob = await response.blob();
                    const reader = new FileReader();
                    const webpDataUrl = await new Promise<string>((resolve) => {
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                    });

                    if (blob.type === 'image/webp' || webpDataUrl.startsWith('data:image/webp')) {
                        academyLogoBase64 = await convertWebpToPng(webpDataUrl);
                    } else {
                        academyLogoBase64 = webpDataUrl;
                    }
                } catch (error) {
                    console.warn('Failed to convert logo, will use fallback', error);
                }
            }

            // Convert all student profile images to base64
            const studentsWithBase64Images = await Promise.all(
                selectedStudents.map(async (student) => {
                    let imageData = student.profileImageUrl;
                    if (student.profileImageUrl) {
                        const base64Image = await convertImageToBase64(student.profileImageUrl);
                        if (base64Image) {
                            imageData = base64Image;
                        }
                    }
                    return {
                        ...student,
                        profileImageUrl: imageData
                    };
                })
            );

            // Generate PDF
            const doc = (
                <BulkStudentIDCardPDF
                    students={studentsWithBase64Images}
                    ceoSignatureUrl={ceoSignatureBase64}
                    courseDirectorSignatureUrl={courseDirectorSignatureBase64}
                    academyLogoUrl={academyLogoBase64}
                />
            );

            const asPdf = pdf(doc);
            const blob = await asPdf.toBlob();
            const url = URL.createObjectURL(blob);

            // Open PDF in new tab for printing
            const newWindow = window.open(url, '_blank');
            if (newWindow) {
                newWindow.onload = () => {
                    newWindow.print();
                };
            }

            // Also create download link
            const link = document.createElement('a');
            link.href = url;
            link.download = `Bulk-ID-Cards-${selectedStudentIds.size}-Students.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up URL after a delay
            setTimeout(() => URL.revokeObjectURL(url), 100);

            toast.success(`Generated PDF with ${selectedStudentIds.size} ID cards!`);
            onClose();
        } catch (error) {
            console.error('Error generating bulk ID cards:', error);
            toast.error('Failed to generate ID cards. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="z-50 fixed inset-0 flex justify-center items-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl border shadow-2xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border-white/20"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-white/10">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Bulk Print ID Cards</h2>
                            <p className="mt-1 text-sm text-white/70">
                                {selectedStudentIds.size > 0 
                                    ? `${selectedStudentIds.size} student${selectedStudentIds.size !== 1 ? 's' : ''} selected`
                                    : 'Select students to print their ID cards'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isGenerating}
                            className="p-2 text-white rounded-lg transition-colors hover:bg-white/10 disabled:opacity-50"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="p-6 space-y-4 border-b border-white/10">
                        <div className="flex flex-wrap gap-4">
                            {/* Search */}
                            <div className="flex-1 min-w-[300px]">
                                <div className="relative">
                                    <Search className="absolute top-3 left-3 w-5 h-5 text-white/50" />
                                    <input
                                        type="text"
                                        placeholder="Search by name, ID, or email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="py-3 pr-4 pl-10 w-full text-white rounded-lg border backdrop-blur-sm transition-all placeholder-white/50 bg-white/5 border-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Course Filter */}
                            <select
                                value={selectedCourse}
                                onChange={(e) => setSelectedCourse(e.target.value)}
                                className="px-4 py-3 text-white rounded-lg border backdrop-blur-sm transition-all bg-white/5 border-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none"
                            >
                                <option value="">All Courses</option>
                                {COURSES.map(course => (
                                    <option key={course} value={course} className="bg-slate-800">
                                        {course}
                                    </option>
                                ))}
                            </select>

                            {/* Select All Button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={toggleAll}
                                disabled={filteredStudents.length === 0}
                                className="inline-flex gap-2 items-center px-4 py-3 text-white rounded-lg border backdrop-blur-sm transition-all bg-white/10 border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {allSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                {allSelected ? 'Deselect All' : 'Select All'}
                            </motion.button>
                        </div>
                    </div>

                    {/* Student List */}
                    <div className="overflow-y-auto p-6 max-h-[400px]">
                        {filteredStudents.length === 0 ? (
                            <div className="py-12 text-center">
                                <p className="text-lg font-medium text-white">No students found</p>
                                <p className="text-sm text-white/70">Try adjusting your filters</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredStudents.map((student) => {
                                    const isSelected = selectedStudentIds.has(student._id);
                                    return (
                                        <motion.div
                                            key={student._id}
                                            whileHover={{ scale: 1.01 }}
                                            onClick={() => toggleStudent(student._id)}
                                            className={`flex gap-4 items-center p-4 rounded-lg border cursor-pointer transition-all ${
                                                isSelected
                                                    ? 'bg-blue-500/20 border-blue-400/50'
                                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                            }`}
                                        >
                                            {/* Checkbox */}
                                            <div className="flex-shrink-0">
                                                {isSelected ? (
                                                    <CheckSquare className="w-6 h-6 text-blue-400" />
                                                ) : (
                                                    <Square className="w-6 h-6 text-white/50" />
                                                )}
                                            </div>

                                            {/* Profile Image */}
                                            {student.profileImageUrl ? (
                                                <img
                                                    src={student.profileImageUrl}
                                                    alt={student.name}
                                                    className="object-cover w-12 h-12 rounded-full ring-2 ring-white/20"
                                                />
                                            ) : (
                                                <div className="flex justify-center items-center w-12 h-12 font-semibold text-white bg-gradient-to-br from-blue-500 to-purple-500 rounded-full">
                                                    {student.name.charAt(0)}
                                                </div>
                                            )}

                                            {/* Student Info */}
                                            <div className="flex-1">
                                                <p className="font-medium text-white">{student.name}</p>
                                                <p className="text-sm text-white/70">
                                                    {student.studentId} • {student.course}
                                                </p>
                                            </div>

                                            {/* Email */}
                                            <div className="hidden md:block text-sm text-white/70">
                                                {student.email}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex gap-4 justify-end items-center p-6 border-t border-white/10">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onClose}
                            disabled={isGenerating}
                            className="px-6 py-3 text-white rounded-lg border backdrop-blur-sm transition-all bg-white/5 border-white/10 hover:bg-white/10 disabled:opacity-50"
                        >
                            Cancel
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: selectedStudentIds.size > 0 && !isGenerating ? 1.05 : 1 }}
                            whileTap={{ scale: selectedStudentIds.size > 0 && !isGenerating ? 0.95 : 1 }}
                            onClick={handlePrint}
                            disabled={selectedStudentIds.size === 0 || isGenerating}
                            className="inline-flex gap-2 items-center px-6 py-3 font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-lg transition-all duration-300 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating PDF...
                                </>
                            ) : (
                                <>
                                    <Printer className="w-5 h-5" />
                                    Print Selected ({selectedStudentIds.size})
                                </>
                            )}
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

