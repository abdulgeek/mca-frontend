import { FC, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Printer, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { StudentListItem } from '../types';
import { StudentIDCardPDF } from './StudentIDCardPDF';
import axios from 'axios';
import ceoSignature from '../assets/ceo.jpeg';
import courseDirectorSignature from '../assets/course-director.jpeg';
import academyLogo from '../assets/logo.webp';

interface StudentIDCardProps {
    student: StudentListItem;
    ceoSignatureUrl?: string;
    courseDirectorSignatureUrl?: string;
}

const StudentIDCard: FC<StudentIDCardProps> = ({
    student,
    ceoSignatureUrl,
    courseDirectorSignatureUrl,
}) => {
    const [isGenerating, setIsGenerating] = useState(false);

    // Helper function to convert image URL to base64 via backend proxy
    const convertImageToBase64 = async (imageUrl: string): Promise<string | null> => {
        try {
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

            // Use backend proxy endpoint to fetch and convert image
            const response = await axios.get(`${API_BASE_URL}/students/image/base64`, {
                params: { imageUrl }
            });

            if (response.data.success && response.data.data) {
                return response.data.data;
            }

            console.error('Failed to get base64 image from backend');
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
        try {
            setIsGenerating(true);

            // Debug log
            console.log('Generating ID card for student:', {
                name: student.name,
                studentId: student.studentId,
                email: student.email,
                course: student.course,
                fatherName: student.fatherName,
                bloodGroup: student.bloodGroup,
                profileImageUrl: student.profileImageUrl
            });

            // Convert student profile image to base64 to bypass CORS
            let imageData = student.profileImageUrl;
            if (student.profileImageUrl) {
                console.log('Converting student image to base64...');
                const base64Image = await convertImageToBase64(student.profileImageUrl);
                if (base64Image) {
                    imageData = base64Image;
                    console.log('Student image converted successfully');
                } else {
                    console.warn('Failed to convert student image, using original URL');
                }
            }

            // Convert CEO signature to base64
            let ceoSignatureBase64 = ceoSignatureUrl;
            if (ceoSignature) {
                console.log('Converting CEO signature to base64...');
                const response = await fetch(ceoSignature);
                const blob = await response.blob();
                const reader = new FileReader();
                ceoSignatureBase64 = await new Promise<string>((resolve) => {
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
                console.log('CEO signature converted successfully');
            }

            // Convert Course Director signature to base64
            let courseDirectorSignatureBase64 = courseDirectorSignatureUrl;
            if (courseDirectorSignature) {
                console.log('Converting Course Director signature to base64...');
                const response = await fetch(courseDirectorSignature);
                const blob = await response.blob();
                const reader = new FileReader();
                courseDirectorSignatureBase64 = await new Promise<string>((resolve) => {
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
                console.log('Course Director signature converted successfully');
            }

            // Convert Academy Logo to base64 and convert webp to PNG
            let academyLogoBase64: string | undefined = undefined;
            if (academyLogo) {
                console.log('Converting Academy logo to base64...');
                try {
                    const response = await fetch(academyLogo);
                    const blob = await response.blob();
                    const reader = new FileReader();
                    const webpDataUrl = await new Promise<string>((resolve) => {
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                    });

                    // Convert webp to PNG if it's webp format
                    if (blob.type === 'image/webp' || webpDataUrl.startsWith('data:image/webp')) {
                        console.log('Converting webp logo to PNG...');
                        academyLogoBase64 = await convertWebpToPng(webpDataUrl);
                        console.log('Academy logo converted to PNG successfully');
                    } else {
                        academyLogoBase64 = webpDataUrl;
                        console.log('Academy logo converted successfully');
                    }
                } catch (error) {
                    console.warn('Failed to convert logo, will use fallback', error);
                }
            }

            // Create student object with base64 image
            const studentWithBase64Image = {
                ...student,
                profileImageUrl: imageData
            };

            const doc = (
                <StudentIDCardPDF
                    student={studentWithBase64Image}
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
            link.download = `${student.studentId}-ID-Card.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up URL after a delay
            setTimeout(() => URL.revokeObjectURL(url), 100);
        } catch (error) {
            console.error('Error generating ID card:', error);
            alert('Error generating ID card. Check console for details.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <motion.button
            whileHover={{ scale: isGenerating ? 1 : 1.1 }}
            whileTap={{ scale: isGenerating ? 1 : 0.9 }}
            onClick={handlePrint}
            disabled={isGenerating}
            className="p-2 text-blue-300 rounded-lg transition-colors hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            title={isGenerating ? 'Generating PDF...' : 'Print ID Card'}
        >
            {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Printer className="w-4 h-4" />
            )}
        </motion.button>
    );
};

export default StudentIDCard;

