export interface Student {
  _id: string;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  fatherName?: string;
  motherName?: string;
  bloodGroup?: string;
  faceDescriptor?: number[];
  faceImage?: string;
  profileImageUrl?: string; // S3 URL for profile image
  fingerprintCredentialId?: string;
  fingerprintPublicKey?: string;
  fingerprintCounter?: number;
  // External fingerprint fields
  externalFingerprintTemplate?: string;
  externalFingerprintSensorType?: 'digital_persona' | 'zkteco' | 'mantra' | 'generic_hid';
  fingerprintMode: 'external' | 'webauthn' | 'both';
  externalFingerprintMetadata?: {
    quality: number;
    capturedAt: string;
    sensorId: string;
    templateVersion: string;
    deviceInfo?: {
      manufacturer: string;
      model: string;
      vendorId: number;
      productId: number;
    };
  };
  biometricMethods: ('face' | 'fingerprint' | 'external_fingerprint')[];
  isActive: boolean;
  enrolledAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  _id: string;
  student: string | Student;
  studentId: string;
  date: string;
  timeIn: string;
  timeOut?: string;
  status: 'present' | 'absent';
  confidence?: number;
  biometricMethod: 'face' | 'fingerprint' | 'external_fingerprint';
  fingerprintMode?: 'webauthn' | 'external';
  sensorInfo?: {
    sensorId: string;
    sensorType: string;
    quality: number;
  };
  location: string;
  loginPhotoUrl?: string; // S3 URL for login photo
  logoutPhotoUrl?: string; // S3 URL for logout photo
  whatsappNotificationSent: boolean;
  deviceInfo: {
    userAgent?: string;
    ip?: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceResult {
  success: boolean;
  studentId?: string;
  name?: string;
  timeIn?: string;
  timeOut?: string;
  duration?: number;
  status?: string;
  confidence?: number;
  message?: string;
  action?: 'login' | 'logout';
  isLoggedIn?: boolean;
}

export interface LoginStatusResponse {
  isLoggedIn: boolean;
  studentId?: string;
  name?: string;
  timeIn?: string;
  duration?: number;
  location?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

export interface WeeklyTrendData {
  name: string;
  present: number;
  absent: number;
  date: string;
}

export interface DashboardStats {
  totalStudents: number;
  presentToday: number;
  attendanceRate: number;
  recentAttendance: Attendance[];
  weeklyTrend: WeeklyTrendData[];
}

export interface FingerprintData {
  credentialId: string;
  publicKey: string;
  counter: number;
  authenticatorData?: string;
  clientDataJSON?: string;
  signature?: string;
  userHandle?: string;
}

export interface EnrollStudentRequest {
  name: string;
  email: string;
  phone: string;
  course: string;
  fatherName?: string;
  motherName?: string;
  bloodGroup?: string;
  faceImage?: string;
  fingerprintData?: FingerprintData;
}

export interface AbsentStudent {
  _id: string;
  studentId: string;
  name: string;
  phone: string;
  course: string;
  email: string;
  whatsappLink: string;
  message: string;
}

export interface MarkAttendanceRequest {
  faceImage?: string;
  fingerprintData?: FingerprintData;
  biometricMethod: 'face' | 'fingerprint';
  location?: string;
  notes?: string;
  action?: 'auto' | 'login' | 'logout';
}

export interface FaceDetectionResult {
  detection: any;
  descriptor: Float32Array;
  landmarks: any;
  expressions: any;
}

export interface CameraState {
  isActive: boolean;
  isCapturing: boolean;
  hasPermission: boolean;
  error: string | null;
}

export interface AttendanceState {
  isMarking: boolean;
  lastResult: AttendanceResult | null;
  stats: DashboardStats | null;
  recentAttendance: Attendance[];
}

export interface StudentFormData {
  name: string;
  email: string;
  phone: string;
  course: string;
  fatherName?: string;
  motherName?: string;
  bloodGroup?: string;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface RecentAttendance {
  studentId: string;
  studentName: string;
  timeIn: string;
  status: string;
  confidence: number;
}

// Student Management Types
export interface PaginationMetadata {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StudentListItem {
  _id: string;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  fatherName?: string;
  motherName?: string;
  bloodGroup?: string;
  profileImageUrl?: string;
  biometricMethods: ('face' | 'fingerprint' | 'external_fingerprint')[];
  isActive: boolean;
  enrolledAt: string;
  attendancePercentage: number;
}

export interface StudentListResponse {
  students: StudentListItem[];
  pagination: PaginationMetadata;
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  attendancePercentage: number;
}

export interface StudentDetail {
  student: Student;
  attendanceStats: AttendanceStats;
}

export interface UpdateStudentData {
  name?: string;
  email?: string;
  phone?: string;
  course?: string;
  fatherName?: string;
  motherName?: string;
  bloodGroup?: string;
}

export interface UpdateBiometricsData {
  faceImage?: string;
  fingerprintData?: FingerprintData;
}

export interface AttendanceCalendarDay {
  date: string;
  status: 'present' | 'absent' | 'none';
  timeIn?: string;
  timeOut?: string;
  duration?: number;
  location?: string;
  biometricMethod?: 'face' | 'fingerprint';
  confidence?: number;
  attendanceId?: string;
}

export interface UpdateAttendanceData {
  status?: 'present' | 'absent';
  timeIn?: string;
  timeOut?: string;
  location?: string;
  notes?: string;
}

// ===== EXTERNAL FINGERPRINT SENSOR TYPES =====

export interface ExternalFingerprintData {
  template: string; // Base64 encoded fingerprint template
  quality: number; // 0-100 quality score
  sensorId: string; // Device identifier
  sensorType: 'digital_persona' | 'zkteco' | 'mantra' | 'generic';
  capturedAt: Date;
  metadata?: {
    width?: number;
    height?: number;
    dpi?: number;
    templateVersion?: string;
  };
}

export interface SensorInfo {
  id: string;
  name: string;
  manufacturer: string;
  type: string;
  vendorId: number;
  productId: number;
  status: 'ready' | 'busy' | 'error';
  capabilities?: string[];
}

export interface SensorEvent {
  type: 'connected' | 'disconnected' | 'capture_progress' | 'capture_complete' | 'error' | 'initial_sensors' | 'heartbeat';
  deviceId?: string;
  data?: any;
  timestamp: Date;
}

export interface CaptureOptions {
  timeout?: number; // Capture timeout in ms
  quality?: number; // Minimum quality threshold (0-100)
  maxRetries?: number; // Maximum capture attempts
  captureMode?: 'enrollment' | 'verification';
}

export interface SensorHealthStatus {
  isHealthy: boolean;
  sensorCount: number;
  connectedCount: number;
  errors: string[];
  connectionStatus: Record<string, boolean>;
}

export interface SensorCapabilities {
  canCapture: boolean;
  canVerify: boolean;
  canEnroll: boolean;
  hasLiveDetection: boolean;
  maxQuality: number;
  supportedTemplateFormats: string[];
}

// Updated interfaces to support external fingerprint

export interface EnrollStudentRequestExtended extends EnrollStudentRequest {
  externalFingerprintData?: ExternalFingerprintData;
  fingerprintMode?: 'external' | 'webauthn' | 'both';
}

export interface MarkAttendanceRequestExtended extends Omit<MarkAttendanceRequest, 'biometricMethod' | 'fingerprintData'> {
  fingerprintData?: FingerprintData | ExternalFingerprintData;
  biometricMethod: 'face' | 'fingerprint' | 'external_fingerprint';
  fingerprintMode?: 'webauthn' | 'external';
}

export interface UpdateBiometricsDataExtended extends UpdateBiometricsData {
  externalFingerprintData?: ExternalFingerprintData;
  fingerprintMode?: 'external' | 'webauthn' | 'both';
}

export interface AttendanceCalendarDayExtended extends Omit<AttendanceCalendarDay, 'biometricMethod'> {
  biometricMethod?: 'face' | 'fingerprint' | 'external_fingerprint';
  sensorInfo?: {
    sensorId: string;
    sensorType: string;
    quality: number;
  };
}

// UI State types for external fingerprint
export interface ExternalFingerprintState {
  isConnecting: boolean;
  isCapturing: boolean;
  availableSensors: SensorInfo[];
  selectedSensorId: string | null;
  captureProgress: {
    quality: number;
    status: string;
    attempt: number;
    maxAttempts: number;
  } | null;
  sseConnected: boolean;
  lastCaptureResult: ExternalFingerprintData | null;
  error: string | null;
}

export interface FingerprintModeState {
  currentMode: 'external_sensor' | 'webauthn' | 'auto';
  externalSensorsAvailable: boolean;
  webauthnAvailable: boolean;
  preferredMethod: 'external_sensor' | 'webauthn' | null;
}
