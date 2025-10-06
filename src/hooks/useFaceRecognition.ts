import { useState, useRef, useCallback, useEffect } from 'react';
import { FaceDetectionResult, CameraState } from '../types';

export const useFaceRecognition = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraState, setCameraState] = useState<CameraState>({
    isActive: false,
    isCapturing: false,
    hasPermission: false,
    error: null
  });
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize face recognition system
  const loadModels = useCallback(async () => {
    try {
      setCameraState(prev => ({ ...prev, error: null }));
      
      // Simple initialization - no models needed on frontend
      setModelsLoaded(true);
      console.log('✅ Face recognition system ready');
    } catch (error) {
      console.error('❌ Error initializing face recognition:', error);
      setCameraState(prev => ({ 
        ...prev, 
        error: 'Failed to initialize face recognition system.' 
      }));
    }
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setCameraState(prev => ({ ...prev, error: null, isCapturing: true }));

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraState(prev => ({ 
          ...prev, 
          isActive: true, 
          isCapturing: false, 
          hasPermission: true 
        }));
      }
    } catch (error: any) {
      console.error('❌ Camera error:', error);
      let errorMessage = 'Failed to access camera';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please connect a camera.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is being used by another application.';
      }
      
      setCameraState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isCapturing: false 
      }));
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraState(prev => ({ 
      ...prev, 
      isActive: false, 
      isCapturing: false 
    }));
  }, []);

  // Capture image from video with enhanced functionality
  const captureImage = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return null;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  // Enhanced capture with preview and validation
  const captureImageWithPreview = useCallback(async (): Promise<string | null> => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    setIsCapturing(true);
    
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return null;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame
      context.drawImage(video, 0, 0);
      
      // Get the image data
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      
      // Store the captured image for preview
      setCapturedImage(imageData);
      
      return imageData;
    } catch (error) {
      console.error('❌ Image capture error:', error);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  // Clear captured image
  const clearCapturedImage = useCallback(() => {
    setCapturedImage(null);
  }, []);

  // Detect faces in image (simplified for frontend)
  const detectFaces = useCallback(async (imageData: string): Promise<FaceDetectionResult[]> => {
    if (!modelsLoaded) {
      throw new Error('Face recognition system not ready');
    }

    try {
      // Simple face detection - just return a basic detection
      // The real face detection happens on the backend
      const img = new Image();
      img.src = imageData;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      // Return a simple detection result
      const mockDetection: FaceDetectionResult = {
        detection: {
          box: {
            x: img.width * 0.2,
            y: img.height * 0.2,
            width: img.width * 0.6,
            height: img.height * 0.6
          },
          score: 0.9
        },
        descriptor: new Float32Array(128).fill(0.5),
        landmarks: null,
        expressions: null
      };

      return [mockDetection];
    } catch (error) {
      console.error('❌ Face detection error:', error);
      throw new Error('Face detection failed');
    }
  }, [modelsLoaded]);

  // Validate face quality
  const validateFaceQuality = useCallback((detections: FaceDetectionResult[]): {
    valid: boolean;
    reason: string;
    quality: number;
  } => {
    if (!detections || detections.length === 0) {
      return { valid: false, reason: 'No face detected', quality: 0 };
    }
    
    if (detections.length > 1) {
      return { valid: false, reason: 'Multiple faces detected', quality: 0 };
    }
    
    const detection = detections[0];
    const box = detection.detection.box;
    
    // Check face size (minimum 100x100 pixels)
    if (box.width < 100 || box.height < 100) {
      return { valid: false, reason: 'Face too small', quality: 0.3 };
    }
    
    // Calculate quality score based on size
    const sizeScore = Math.min(1, (box.width * box.height) / (200 * 200));
    const quality = sizeScore;
    
    return { 
      valid: quality > 0.5, 
      reason: quality > 0.5 ? 'Face quality acceptable' : 'Face quality too low',
      quality: quality
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    modelsLoaded,
    cameraState,
    capturedImage,
    isCapturing,
    videoRef,
    canvasRef,
    loadModels,
    startCamera,
    stopCamera,
    captureImage,
    captureImageWithPreview,
    clearCapturedImage,
    detectFaces,
    validateFaceQuality
  };
};
