import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, EnrollStudentRequest, MarkAttendanceRequest, DashboardStats, Attendance, LoginStatusResponse, AbsentStudent, FingerprintData } from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('❌ API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Face Recognition APIs
  async enrollStudent(data: EnrollStudentRequest): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/face-recognition/enroll', data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async markAttendance(data: MarkAttendanceRequest): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/face-recognition/mark-attendance', data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async checkLoginStatus(faceImage: string): Promise<ApiResponse<LoginStatusResponse>> {
    try {
      const response = await this.api.post('/face-recognition/check-status', { faceImage });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getAttendanceStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      const response = await this.api.get('/face-recognition/stats');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getStudentAttendance(studentId: string, startDate?: string, endDate?: string): Promise<ApiResponse<Attendance[]>> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await this.api.get(`/face-recognition/student/${studentId}?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getAbsentStudents(date?: string): Promise<ApiResponse<{
    date: string;
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    absentStudents: AbsentStudent[];
  }>> {
    try {
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      
      const response = await this.api.get(`/face-recognition/absent-students?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Fingerprint APIs
  async generateChallenge(): Promise<ApiResponse<{ challenge: string }>> {
    try {
      const response = await this.api.get('/fingerprint/challenge');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async markAttendanceWithFingerprint(data: {
    fingerprintData: FingerprintData;
    location?: string;
    notes?: string;
    action?: 'auto' | 'login' | 'logout';
  }): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/fingerprint/mark-attendance', data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async checkLoginStatusWithFingerprint(fingerprintData: FingerprintData): Promise<ApiResponse<LoginStatusResponse>> {
    try {
      const response = await this.api.post('/fingerprint/check-status', { fingerprintData });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/health');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || 'Server error occurred';
      const status = error.response.status;
      return new Error(`${status}: ${message}`);
    } else if (error.request) {
      // Request was made but no response received
      return new Error('Network error: Unable to connect to server');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

export const apiService = new ApiService();
export default apiService;
