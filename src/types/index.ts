export interface Student {
  _id: string;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  faceDescriptor?: number[];
  faceImage?: string;
  profileImageUrl?: string; // S3 URL for profile image
  fingerprintCredentialId?: string;
  fingerprintPublicKey?: string;
  fingerprintCounter?: number;
  biometricMethods: ('face' | 'fingerprint')[];
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
  biometricMethod: 'face' | 'fingerprint';
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
  profileImageUrl?: string;
  biometricMethods: ('face' | 'fingerprint')[];
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
